import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      const response = await this.authService.login(this.username, this.password);
      console.log('Login response:', response.data);
      
      if (response.data.status === 401) {
        this.errorMessage = response.data.message;
        return;
      }
      
      // Store JWT token
      localStorage.setItem('token', response.data.jwt);
      
      // Decode JWT to get user info
      const decoded: any = jwtDecode(response.data.jwt);
      const userData = decoded.data;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect based on isAdmin
      if (userData && userData.isAdmin === 1) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/user-profile']);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      this.errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
