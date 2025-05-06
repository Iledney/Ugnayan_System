import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { FetchService } from '../services/fetch.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { PostService } from '../services/post.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NavbarComponent, RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  dashboardData: any = '';
  updateForm: FormGroup;
  showModal = false;

  constructor(private fetchService: FetchService, private postService: PostService, private fb: FormBuilder) {
    this.updateForm = this.fb.group({
      daily_verse: [''],
      announcements: this.fb.array([]),
      reminders: this.fb.array([])
    });
  }

  ngOnInit() {
    this.fetchDashboardData();
  }

  async fetchDashboardData() {
    try {
      const response = await this.fetchService.getDashboard();
      this.dashboardData = response.data.data;
      console.log('Dashboard Data:', this.dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }

  get announcements() {
    return this.updateForm.get('announcements') as FormArray;
  }

  get reminders() {
    return this.updateForm.get('reminders') as FormArray;
  }

  openUpdateModal() {
    this.showModal = true;
    this.populateForm();
  }

  closeModal() {
    this.showModal = false;
  }

  populateForm() {
    if (this.dashboardData) {
      this.updateForm.patchValue({
        daily_verse: this.dashboardData.daily_verse
      });

      // Clear existing arrays
      while (this.announcements.length) {
        this.announcements.removeAt(0);
      }
      while (this.reminders.length) {
        this.reminders.removeAt(0);
      }

      // Add announcements
      this.dashboardData.announcement.announcements.forEach((announcement: any) => {
        this.announcements.push(this.fb.group({
          icon: [announcement.icon],
          title: [announcement.title],
          description: [announcement.description]
        }));
      });

      // Add reminders
      this.dashboardData.reminders.reminders.forEach((reminder: any) => {
        this.reminders.push(this.fb.group({
          icon: [reminder.icon],
          title: [reminder.title],
          status: [reminder.status]
        }));
      });
    }
  }

  addAnnouncement() {
    this.announcements.push(this.fb.group({
      icon: [''],
      title: [''],
      description: ['']
    }));
  }

  removeAnnouncement(index: number) {
    this.announcements.removeAt(index);
  }

  addReminder() {
    this.reminders.push(this.fb.group({
      icon: [''],
      title: [''],
      status: ['pending']
    }));
  }

  removeReminder(index: number) {
    this.reminders.removeAt(index);
  }

  async onSubmit() {
    if (this.updateForm.valid) {
      try {
        // Format the data to match the expected structure
        const formattedData = {
          daily_verse: this.updateForm.value.daily_verse,
          announcement: {
            announcements: this.updateForm.value.announcements,
            last_updated: new Date().toISOString()
          },
          reminders: {
            reminders: this.updateForm.value.reminders,
            last_updated: new Date().toISOString()
          }
        };
  
        await this.postService.updateDashboard(formattedData);
        await this.fetchDashboardData();
        this.closeModal();
      } catch (error) {
        console.error('Error updating dashboard:', error);
      }
    }
  }

}
