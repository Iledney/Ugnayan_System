import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import jsQR from 'jsqr';
import { PostService } from '../services/post.service';
import { FetchService } from '../services/fetch.service';
import { NavbarComponent } from '../navbar/navbar.component';
import Swal from 'sweetalert2';

interface AttendanceRecord {
  username: string;
  firstname: string;
  lastname: string;
  timeIn: string;
  status: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css',
})
export class AttendanceComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() eventId: string | undefined;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  showCamera = false;
  scanInterval: any;
  stream: MediaStream | null = null;
  attendance: AttendanceRecord[] = [];
  scanStatus: string = 'Click "Scan QR Code" to start';
  lastScannedTime: number = 0;
  scanCooldown: number = 2000; // 2 seconds cooldown between scans
  cameraError: string = '';
  showAttendanceModal = false;
  isCameraInitialized = false;

  constructor(
    private post: PostService, 
    private fetch: FetchService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.eventId) {
      this.getAttendance();
    }
  }

  ngAfterViewInit() {
    // Wait for view initialization before activating camera
    setTimeout(() => {
      if (this.showCamera) {
        this.activateCamera();
      }
    }, 1000);
  }

  ngOnDestroy() {
    this.closeCamera();
  }

  async activateCamera() {
    if (this.isCameraInitialized) return;

    try {
      // First check if camera permissions are granted
      const permissions = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });
      if (permissions.state === 'denied') {
        throw new Error(
          'Camera permission denied. Please enable camera access in your browser settings.'
        );
      }

      // Show camera UI first
      this.showCamera = true;
      this.cdr.detectChanges();

      // Wait for the DOM to update and elements to be available
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) {
        throw new Error(
          'Camera elements not found. Please refresh the page and try again.'
        );
      }

      // Try to get the camera stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const video = this.videoElement.nativeElement;
      video.srcObject = this.stream;

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video
            .play()
            .then(() => {
              this.isCameraInitialized = true;
              this.cdr.detectChanges();
              resolve(true);
            })
            .catch((error) => {
              console.error('Error playing video:', error);
              reject(
                new Error('Error starting video stream. Please try again.')
              );
            });
        };
        video.onerror = () => {
          reject(new Error('Error loading video stream. Please try again.'));
        };
      });

      this.scanStatus = 'Camera ready';
      this.cameraError = '';
      this.startQRScanning();
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      this.cameraError =
        error.message || 'Error accessing camera. Please check permissions.';
      this.scanStatus = 'Camera error occurred';
      this.showCamera = false;
      this.isCameraInitialized = false;
      this.cdr.detectChanges();

      Swal.fire({
        icon: 'error',
        title: 'Camera Error',
        text:
          error.message || 'Error accessing camera. Please check permissions.',
        confirmButtonColor: '#d33',
      });

      // If stream was created but error occurred later, clean it up
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }
    }
  }

  closeCamera() {
    // Clear scanning interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    // Stop all tracks in the stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      this.stream = null;
    }

    // Clear video source
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
      this.videoElement.nativeElement.load();
    }

    this.showCamera = false;
    this.scanStatus = 'I-click ang "Scan QR Code" para mag-scan';
    this.cameraError = '';
    this.isCameraInitialized = false;
    this.cdr.detectChanges();
  }

  private startQRScanning() {
    if (!this.isCameraInitialized || !this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) {
      this.cameraError =
        'Camera components not found. Please refresh and try again.';
      Swal.fire({
        icon: 'error',
        title: 'Camera Error',
        text: 'Camera components not found. Please refresh and try again.',
        confirmButtonColor: '#d33',
      });
      this.closeCamera();
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) {
      this.cameraError = 'Could not initialize camera context';
      Swal.fire({
        icon: 'error',
        title: 'Camera Error',
        text: 'Could not initialize camera context. Please try again.',
        confirmButtonColor: '#d33',
      });
      this.closeCamera();
      return;
    }

    this.scanInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          // Set canvas dimensions to match video
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;

          // Draw the video frame to the canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Get the image data for QR code scanning
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code) {
            const currentTime = Date.now();
            if (currentTime - this.lastScannedTime > this.scanCooldown) {
              this.handleQRCode(code.data);
              this.lastScannedTime = currentTime;
            }
          }
        } catch (error) {
          console.error('Error scanning QR code:', error);
          this.scanStatus = 'Error scanning QR code. Please try again.';
          Swal.fire({
            icon: 'error',
            title: 'Scanning Error',
            text: 'Error scanning QR code. Please try again.',
            confirmButtonColor: '#d33',
          });
        }
      }
    }, 100);
  }

  private async handleQRCode(data: string) {
    try {
      this.scanStatus = 'Processing QR code...';

      // Parse the QR code data
      const qrData = JSON.parse(data);

      // Send the data to the server
      const response = await this.post.addAttendance({
        username: qrData.username,
        eventId: this.eventId,
        date: new Date().toLocaleString(),
      });

      if (response.data.status === 'success') {
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Attendance Recorded',
          text: `${qrData.firstname} ${qrData.lastname} has been marked present.`,
          confirmButtonColor: '#28a745',
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh attendance list
        await this.getAttendance();

        this.scanStatus = 'QR code processed successfully';
      } else {
        throw new Error(response.data.message || 'Failed to record attendance');
      }
    } catch (error: any) {
      console.error('Error processing QR code:', error);
      this.scanStatus = 'Error processing QR code';

      Swal.fire({
        icon: 'error',
        title: 'Processing Error',
        text: error.message || 'Failed to process QR code. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }

  async getAttendance() {
    if (!this.eventId) return;

    try {
      const response = await this.fetch.fetchAttendance(this.eventId);
      if (response.data && response.data.data) {
        this.attendance = response.data.data.map((record: any) => ({
          username: record.user_username,
          firstname: record.user_firstname,
          lastname: record.user_lastname,
          timeIn: new Date(record.created_at).toLocaleString(),
          status: record.attendance_status || 'Present',
        }));
        this.cdr.detectChanges();
      } else {
        throw new Error('No attendance records found');
      }
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Attendance',
        text: error.response?.data?.message || 'Failed to load attendance records. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }

  openAttendanceModal() {
    this.showAttendanceModal = true;
    document.body.classList.add('modal-open');
    this.getAttendance();
  }

  closeAttendanceModal() {
    this.showAttendanceModal = false;
    document.body.classList.remove('modal-open');
    this.closeCamera();
  }
}
