import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import jsQR from 'jsqr';
import { PostService } from '../services/post.service';
import { FetchService } from '../services/fetch.service';
import { NavbarComponent } from '../navbar/navbar.component';

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
  styleUrl: './attendance.component.css'
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

  constructor(
    private post: PostService,
    private fetch: FetchService
  ) {}

  ngOnInit() {
    this.getAttendance();
  }

  ngAfterViewInit() {
    this.activateCamera();
  }

  ngOnDestroy() {
    this.closeCamera();
  }

  async activateCamera() {
    try {
      // First check if camera permissions are granted
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (permissions.state === 'denied') {
        throw new Error('Camera permission denied. Please enable camera access in your browser settings.');
      }

      // Show camera UI first
      this.showCamera = true;

      // Wait a bit for the DOM to update and elements to be available
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!this.videoElement || !this.canvasElement) {
        throw new Error('Camera elements not found. Please refresh the page and try again.');
      }

      // Try to get the camera stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      const video = this.videoElement.nativeElement;
      video.srcObject = this.stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play()
            .then(() => resolve(true))
            .catch(error => {
              console.error('Error playing video:', error);
              reject(new Error('Error starting video stream. Please try again.'));
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
      this.cameraError = error.message || 'Error accessing camera. Please check permissions.';
      this.scanStatus = 'Camera error occurred';
      this.showCamera = false;
      
      // If stream was created but error occurred later, clean it up
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
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
      this.stream.getTracks().forEach(track => {
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
  }

  private startQRScanning() {
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) {
      this.cameraError = 'Camera components not found. Please refresh and try again.';
      this.closeCamera();
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) {
      this.cameraError = 'Could not initialize camera context';
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
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

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
        }
      }
    }, 100);
  }

  openAttendanceModal() {
    this.showAttendanceModal = true;
    document.body.classList.add('modal-open');
  }

  closeAttendanceModal() {
    this.showAttendanceModal = false;
    document.body.classList.remove('modal-open');
  }

  private async handleQRCode(data: string) {
    try {
      const qrData = JSON.parse(data);

      if (qrData.username && qrData.firstname && qrData.lastname) {
        this.scanStatus = 'Na-detect ang QR Code! Nagpo-process...';

        const newRecord: AttendanceRecord = {
          username: qrData.username,
          firstname: qrData.firstname,
          lastname: qrData.lastname,
          timeIn: new Date().toLocaleString(),
          status: 'Present'
        };
        
        // Add visual feedback
        this.addWithAnimation(newRecord);

        // Send to backend
        const attendancePayload = {
          username: qrData.username,
          eventId: this.eventId,
          date: new Date().toLocaleString()
        };

        try {
          const res = await this.post.addAttendance(attendancePayload);
          console.log('Attendance added:', res);
          this.scanStatus = 'Matagumpay na na-record ang attendance!';
          
          // Refresh attendance list and show modal
          await this.getAttendance();
          this.openAttendanceModal();
          
          // Reset status after delay
          setTimeout(() => {
            this.scanStatus = 'Handa na mag-scan ng susunod na QR code...';
          }, 2000);
        } catch (error) {
          console.error('Error adding attendance:', error);
          this.scanStatus = 'Error sa pag-record ng attendance. Pakisubukan ulit.';
        }
      } else {
        this.scanStatus = 'Hindi tamang QR code format. Pakisubukan ulit.';
        console.warn('Incomplete QR data:', qrData);
      }
    } catch (error) {
      this.scanStatus = 'Hindi tamang QR code. Pakisubukan ulit.';
      console.error('Invalid QR code data:', error);
    }
  }

  private addWithAnimation(record: AttendanceRecord) {
    // Add record to the beginning of the array for better visibility
    this.attendance.unshift(record);
    
    // Limit the number of visible records if needed
    if (this.attendance.length > 50) {
      this.attendance = this.attendance.slice(0, 50);
    }
  }

  async getAttendance() {
    try {
      const response = await this.fetch.fetchAttendance(this.eventId!);
      this.attendance = response.data.map((record: any) => ({
        username: record.username,
        firstname: record.firstname,
        lastname: record.lastname,
        timeIn: new Date(record.date).toLocaleString(),
        status: record.status || 'Present'
      }));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }
}
