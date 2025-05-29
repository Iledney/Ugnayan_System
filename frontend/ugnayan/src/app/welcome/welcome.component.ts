import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent {
  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  showAboutInfo() {
    Swal.fire({
      title: 'About Ugnayan',
      html: `
        <div class="about-content">
          <p>Ugnayan is a comprehensive church management system designed to streamline and enhance the operations of religious organizations.</p>
          <p>Key Features:</p>
          <ul>
            <li>Member Management</li>
            <li>Event Organization</li>
            <li>Attendance Tracking</li>
            <li>Financial Management</li>
            <li>Sermon Archives</li>
          </ul>
          <p>Our mission is to help churches build stronger communities through efficient management and organization.</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Got it!',
    });
  }
}
