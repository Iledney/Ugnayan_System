import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent {
    isOpen = true;

    constructor(private router: Router) {}

    menuItems = [
        { path: '/home', icon: 'home', label: 'Home' },
        { path: '/user-profile', icon: 'person', label: 'Profile' }
    ];

    toggleSidenav() {
        this.isOpen = !this.isOpen;
    }

    logout() {
        // Clear any stored authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Navigate to login page
        this.router.navigate(['/']);
    }
}
