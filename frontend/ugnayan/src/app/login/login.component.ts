import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
      // Store user data if needed
      // localStorage.setItem('user', JSON.stringify(response.data.user));
      // localStorage.setItem('token', response.data.token);
      
      // Uncomment to navigate after successful login
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Login failed:', error);
      // Handle specific error cases if needed
      // this.errorMessage = 'Invalid username or password';
    }
  }
  
}
