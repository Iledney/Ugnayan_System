import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(private authService: AuthService, private router: Router) { }

  username: string = '';
  password: string = '';

  async login() {
    try {
      const response = await this.authService.login(this.username, this.password);
      console.log('Login successful:', response.data);
      
      // Store JWT token
      localStorage.setItem('token', response.data.jwt);
      
      // Decode JWT to get user info
      const decoded: any = jwtDecode(response.data.jwt);
      const userData = decoded.data;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect based on isAdmin
      if (userData && userData.isAdmin === 0) {
        this.router.navigate(['/user-profile']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Handle specific error cases if needed
      // this.errorMessage = 'Invalid username or password';
    }
  }
  
}
