import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (!this.username || !this.password) {
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
      this.errorMessage = '';

      const response = await this.authService.login(
        this.username,
        this.password
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

      // This will show a success message
      Swal.fire({
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
      // if there is an this swal will show
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
