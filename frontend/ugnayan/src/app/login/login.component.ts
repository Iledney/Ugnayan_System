import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  userLoginForm: FormGroup;
  adminLoginForm: FormGroup;
  isLoading: boolean = false;
  showPassword: boolean = false;
  showAdminPassword: boolean = false;
  activeTab: 'user' | 'admin' = 'user';

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.userLoginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false],
    });

    this.adminLoginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false],
    });

    // Check for remembered username
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      this.userLoginForm.patchValue({ username: rememberedUsername });
    }
  }

  switchTab(tab: 'user' | 'admin') {
    this.activeTab = tab;
  }

  togglePassword(type: 'user' | 'admin') {
    if (type === 'user') {
      this.showPassword = !this.showPassword;
    } else {
      this.showAdminPassword = !this.showAdminPassword;
    }
  }

  async onSubmit(type: 'user' | 'admin') {
    const form = type === 'user' ? this.userLoginForm : this.adminLoginForm;

    if (form.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter both username and password',
        confirmButtonColor: '#d33',
      });
      return;
    }

    try {
      this.isLoading = true;
      const formValue = form.value;

      const response = await this.authService.login(
        formValue.username,
        formValue.password
      );
      console.log('Login response:', response.data);

      if (response.data.status === 401) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Failed',
          text: response.data.message,
          confirmButtonColor: '#d33',
        });
        return;
      }

      // Store JWT token
      localStorage.setItem('token', response.data.jwt);

      // Decode JWT to get user info
      const decoded: any = jwtDecode(response.data.jwt);
      const userData = decoded.data;
      localStorage.setItem('user', JSON.stringify(userData));

      // Handle remember me
      if (formValue.rememberMe) {
        localStorage.setItem('rememberedUsername', formValue.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: 'Welcome back!',
        confirmButtonColor: '#28a745',
        timer: 1500,
        showConfirmButton: false,
      });

      // Redirect based on isAdmin
      if (userData && userData.isAdmin === 1) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/user-profile']);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text:
          error.response?.data?.message || 'Login failed. Please try again.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isLoading = false;
    }
  }
}
