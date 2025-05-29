import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        firstname: ['', [Validators.required, Validators.minLength(2)]],
        middlename: [''],
        lastname: ['', [Validators.required, Validators.minLength(2)]],
        username: ['', [Validators.required, Validators.minLength(4)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  ngOnInit() {}

  // Validator sa password matching
  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  // Getter methods for form controls
  get f() {
    return this.registerForm.controls;
  }

  togglePassword(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Check for specific field errors
  getFieldErrors(): string[] {
    const errors: string[] = [];
    const controls = this.registerForm.controls;

    if (controls['firstname'].errors?.['required']) {
      errors.push('First Name is required');
    }
    if (controls['firstname'].errors?.['minlength']) {
      errors.push('First Name must be at least 2 characters');
    }

    if (controls['lastname'].errors?.['required']) {
      errors.push('Last Name is required');
    }
    if (controls['lastname'].errors?.['minlength']) {
      errors.push('Last Name must be at least 2 characters');
    }

    if (controls['username'].errors?.['required']) {
      errors.push('Username is required');
    }
    if (controls['username'].errors?.['minlength']) {
      errors.push('Username must be at least 4 characters');
    }

    if (controls['email'].errors?.['required']) {
      errors.push('Email is required');
    }
    if (controls['email'].errors?.['email']) {
      errors.push('Please enter a valid email address');
    }

    if (controls['password'].errors?.['required']) {
      errors.push('Password is required');
    }
    if (controls['password'].errors?.['minlength']) {
      errors.push('Password must be at least 6 characters');
    }

    if (controls['confirmPassword'].errors?.['required']) {
      errors.push('Password confirmation is required');
    }

    if (this.registerForm.hasError('mismatch')) {
      errors.push('Passwords do not match');
    }

    return errors;
  }

  async onSubmit() {
    // Mark all fields as touched to trigger validation messages
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });

    if (this.registerForm.invalid) {
      const errors = this.getFieldErrors();
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        html: errors.map((error) => `• ${error}`).join('<br>'),
        confirmButtonColor: '#d33',
      });
      return;
    }

    this.isLoading = true;

    try {
      const formData = {
        ...this.registerForm.value,
        isAdmin: 0,
      };
      delete formData.confirmPassword;

      const response = await this.authService.register(formData);

      // Store username temporarily for OTP verification
      localStorage.setItem('tempUsername', formData.username);

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: 'Please verify your account with the OTP sent to your email.',
        confirmButtonColor: '#28a745',
      });

      // Redirect to OTP page
      this.router.navigate(['/otp']);
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.message || 'Registration failed. Please try again.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isLoading = false;
    }
  }
}
