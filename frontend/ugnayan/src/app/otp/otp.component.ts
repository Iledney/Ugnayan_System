import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../services/post.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.css',
})
export class OtpComponent implements OnInit {
  otp: string = '';
  error: string = '';
  loading: boolean = false;
  username: string = '';

  constructor(private postService: PostService, private router: Router) {}

  ngOnInit() {
    // Get username from localStorage or state management
    this.username = localStorage.getItem('tempUsername') || '';
    if (!this.username) {
      this.router.navigate(['/register']);
    }
  }

  async verifyOTP() {
    if (this.otp.length !== 6) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid OTP',
        text: 'Please enter a valid 6-digit OTP',
        confirmButtonColor: '#d33',
      });
      return;
    }

    this.loading = true;

    try {
      // Show loading state
      Swal.fire({
        title: 'Verifying OTP',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await this.postService.verifyOTP({
        username: this.username,
        otp: this.otp,
      });

      if (response.data.success) {
        // Clear temporary username
        localStorage.removeItem('tempUsername');

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Account Verified!',
          text: 'Your account has been successfully verified.',
          confirmButtonColor: '#28a745',
          timer: 2000,
          showConfirmButton: false,
        });

        // Redirect to login
        this.router.navigate(['/login']);
      } else {
        throw new Error(response.data.message || 'Invalid OTP');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text:
          error.response?.data?.message ||
          'Failed to verify OTP. Please try again.',
        confirmButtonColor: '#d33',
      });
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

  async resendOTP() {
    try {
      // Show loading state
      Swal.fire({
        title: 'Resending OTP',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await this.postService.resendOTP({
        username: this.username,
      });

      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'OTP Resent',
          text: 'A new OTP has been sent to your email.',
          confirmButtonColor: '#28a745',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.data.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error Resending OTP',
        text:
          error.response?.data?.message ||
          'Failed to resend OTP. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }
}
