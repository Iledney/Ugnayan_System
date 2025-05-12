import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidenavComponent } from '../sidenav/sidenav.component';
@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule, SidenavComponent],
    templateUrl: './user-profile.component.html',
    styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
    user: any = {};

    constructor(private router: Router) {}

    ngOnInit() {
        const userData = localStorage.getItem('user');
        if (userData) {
            this.user = JSON.parse(userData);
        }
    }

}
