import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
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
export class AttendanceComponent implements OnInit, OnDestroy {
  @Input() eventId: string | undefined;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  showCamera = false;
  attendanceRecords: AttendanceRecord[] = [];
  attendance: any = '';
  private stream: MediaStream | null = null;
  private scanInterval: any;
  attendanceForm: FormGroup;

  constructor(private fb: FormBuilder, private post: PostService, private fetch: FetchService) {
    this.attendanceForm = this.fb.group({
      name: ['', Validators.required],
      timeIn: ['', Validators.required],
      status: ['Present', Validators.required]
    });
  }

  ngOnInit() {
    this.getAttendance();
  }

  ngOnDestroy() {
    this.closeCamera();
  }

  // NEW METHOD: Activate camera only after DOM is rendered
  activateCamera() {
    this.showCamera = true;
    setTimeout(() => {
      this.openCamera();
    }, 100);
  }

  async openCamera() {
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) {
      console.warn('ViewChild elements not yet initialized');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      this.videoElement.nativeElement.srcObject = this.stream;
      this.startQRScanning();
    } catch (err: any) {
      console.error('Error accessing camera:', err.name, err.message, err);
      alert(`Camera error: ${err.name} - ${err.message}`);
    }
  }

  closeCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }
    this.showCamera = false;
  }

  private startQRScanning() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    this.scanInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);

        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code) {
            this.handleQRCode(code.data);
          }
        }
      }
    }, 100);
  }

  async getAttendance() {
    try {
        const res = await this.fetch.fetchAttendance();
        console.log('Raw Attendance Response:', res);

        const allRecords = res.data?.data || [];
        
        // Filter records by eventId (if eventId is defined)
        const filteredRecords = this.eventId 
            ? allRecords.filter((record: any) => record.event_id === this.eventId)
            : allRecords;

        // Map the backend response to match the expected structure
        this.attendance = filteredRecords.map((record: any) => ({
            username: record.user_username,
            firstname: record.user_firstname,
            lastname: record.user_lastname,
            timeIn: record.created_at,
            status: record.attendance_status,
        }));

        console.log('Mapped and Filtered Attendance Records:', this.attendance);
    } catch (err) {
        console.error('Error fetching attendance:', err);
    }
}
  
  private async handleQRCode(data: string) {
    try {
      const qrData = JSON.parse(data); // Expecting keys: username, firstname, lastname
  
      if (qrData.username && qrData.firstname && qrData.lastname) {
        const newRecord: AttendanceRecord = {
          username: qrData.username,
          firstname: qrData.firstname,
          lastname: qrData.lastname,
          timeIn: new Date().toLocaleString(),
          status: 'Present'
        };
        
        console.log("New Rec: ", newRecord)
  
        // Push the record to the attendance array
        this.attendanceRecords.push(newRecord);
  
        // Now, send the attendance record to the backend
        const attendancePayload = {
          username: qrData.username,  // Assuming qrData contains the userId
          eventId: this.eventId,     // The eventId should be passed down from the parent component
          date: new Date().toLocaleString()
        };
  
        // Send attendance to the backend via PostService
        const res = await this.post.addAttendance(attendancePayload);
        console.log('Attendance added:', res);
        this.getAttendance()
        this.closeCamera();
      } else {
        console.warn('Incomplete QR data:', qrData);
      }
    } catch (error) {
      console.error('Invalid QR code data:', error);
    }
  }
  
}
