import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../services/post.service';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.css'
})
export class OtpComponent implements OnInit {
  otp: string = '';
  error: string = '';
  loading: boolean = false;
  username: string = '';

  constructor(
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit() {
    // Get username from localStorage or state management
    this.username = localStorage.getItem('tempUsername') || '';
    if (!this.username) {
      this.router.navigate(['/register']);
    }
  }

  async verifyOTP() {
    if (this.otp.length !== 6) {
      this.error = 'Please enter a valid 6-digit OTP';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const response = await this.postService.verifyOTP({
        username: this.username,
        otp: this.otp
      });

      if (response.data.success) {
        // Clear temporary username
        localStorage.removeItem('tempUsername');
        // Redirect to login
        this.router.navigate(['/login']);
      }
    } catch (error: any) {
      this.error = error.message || 'Failed to verify OTP. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  onOtpInput(event: any) {
    // Only allow numbers
    this.otp = event.target.value.replace(/[^0-9]/g, '');
    // Limit to 6 digits
    if (this.otp.length > 6) {
      this.otp = this.otp.slice(0, 6);
    }
  }
}
