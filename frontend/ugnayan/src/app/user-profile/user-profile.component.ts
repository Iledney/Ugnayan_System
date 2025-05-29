import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, SidenavComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit {
  user: any = {};
  totalContribution: number = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.user = decodedToken.data;
        this.totalContribution = decodedToken.data.total_contribution || 0;
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }
}
