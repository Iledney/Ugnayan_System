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
import { AxiosResponse } from 'axios';
import Swal from 'sweetalert2';

interface ApiResponse {
  status: string;
  message: string;
  data?: any;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  otpForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  otpErrorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  contactType: 'email' | 'phone' = 'email';
  termsVisible: boolean = false;
  otpVerificationMode: boolean = false;
  registeredUsername: string = '';
  step: number = 1;

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
        phone: [''],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        sex: ['', [Validators.required]],
        birthdate: ['', [Validators.required]],
        terms: [false, [Validators.requiredTrue]],
      },
      {
        validators: [this.passwordMatchValidator],
      }
    );

    this.otpForm = this.fb.group({
      otp: [
        '',
        [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
      ],
    });
  }

  ngOnInit() {}

  // Password matching validator
  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
  }

  get f() {
    return this.registerForm.controls;
  }

  togglePassword(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  toggleContact(type: 'email' | 'phone') {
    this.contactType = type;
    if (type === 'email') {
      this.registerForm.get('phone')?.clearValidators();
      this.registerForm
        .get('email')
        ?.setValidators([Validators.required, Validators.email]);
    } else {
      this.registerForm.get('email')?.clearValidators();
      this.registerForm
        .get('phone')
        ?.setValidators([
          Validators.required,
          Validators.pattern(/^[0-9]{11}$/),
        ]);
    }
    this.registerForm.get('email')?.updateValueAndValidity();
    this.registerForm.get('phone')?.updateValueAndValidity();
  }

  showTerms() {
    this.termsVisible = true;
  }

  closeTerms() {
    this.termsVisible = false;
  }

  acceptTerms() {
    this.registerForm.patchValue({ terms: true });
    this.closeTerms();
  }

  goToStep2() {
    const step1Controls = [
      'firstname',
      'lastname',
      'username',
      'sex',
      'birthdate',
    ];
    let isValid = true;

    step1Controls.forEach((control) => {
      const formControl = this.registerForm.get(control);
      if (formControl) {
        formControl.markAsTouched();
        if (formControl.invalid) {
          isValid = false;
        }
      }
    });

    if (isValid) {
      this.step = 2;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.',
        confirmButtonColor: '#d33',
      });
    }
  }

  async onSubmit() {
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
      delete formData.terms;

      const response = await this.authService.register(formData);
      const apiResponse = response.data as ApiResponse;

      if (apiResponse.status === 'success') {
        this.registeredUsername = formData.username;
        this.otpVerificationMode = true;

        await Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'Please verify your account with the OTP sent to your email.',
          confirmButtonColor: '#28a745',
        });
      } else {
        throw new Error(apiResponse.message || 'Registration failed');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text:
          error.response?.data?.message ||
          error.message ||
          'Registration failed. Please try again.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isLoading = false;
    }
  }

  async onOtpSubmit() {
    if (this.otpForm.invalid) {
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.authService.verifyOTP({
        username: this.registeredUsername,
        otp: this.otpForm.get('otp')?.value || '',
      });
      const apiResponse = response.data as ApiResponse;

      if (apiResponse.status === 'success') {
        await Swal.fire({
          icon: 'success',
          title: 'Account Verified!',
          text: 'You can now login to your account.',
          confirmButtonColor: '#28a745',
        });
        this.router.navigate(['/login']);
      } else {
        this.otpErrorMessage =
          apiResponse.message || 'Invalid OTP. Please try again.';
      }
    } catch (error: any) {
      this.otpErrorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to verify OTP. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

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

    if (this.contactType === 'email') {
      if (controls['email'].errors?.['required']) {
        errors.push('Email is required');
      }
      if (controls['email'].errors?.['email']) {
        errors.push('Please enter a valid email address');
      }
    } else {
      if (controls['phone'].errors?.['required']) {
        errors.push('Phone number is required');
      }
      if (controls['phone'].errors?.['pattern']) {
        errors.push('Please enter a valid phone number');
      }
    }

    if (controls['password'].errors?.['required']) {
      errors.push('Password is required');
    }
    if (controls['password'].errors?.['minlength']) {
      errors.push('Password must be at least 8 characters');
    }

    if (controls['confirmPassword'].errors?.['required']) {
      errors.push('Password confirmation is required');
    }

    if (this.registerForm.hasError('passwordMismatch')) {
      errors.push('Passwords do not match');
    }

    if (!controls['terms'].value) {
      errors.push('You must accept the terms and conditions');
    }

    return errors;
  }
}
