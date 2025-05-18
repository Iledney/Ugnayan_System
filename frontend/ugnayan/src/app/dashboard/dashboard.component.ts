import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class DashboardComponent implements OnInit, OnDestroy {
  dashboardData: any = {
    daily_verse: '',
    quick_stats: {
      total_attendance: 0,
      contributions_this_month: 0,
      upcoming_events: 0
    },
    announcement: {
      announcements: []
    },
    reminders: {
      reminders: []
    },
    activities: []
  };

  stats = {
    total_members: 0,
    monthly_contributions: 0,
    monthly_attendance: 0,
    monthly_events: 0
  };

  updateForm: FormGroup;
  showModal = false;
  private refreshInterval: any;
  currentDate: Date = new Date();

  constructor(private fetchService: FetchService, private postService: PostService, private fb: FormBuilder) {
    this.updateForm = this.fb.group({
      daily_verse: [''],
      announcements: this.fb.array([]),
      reminders: this.fb.array([]),
      quick_stats: this.fb.group({
        total_attendance: [0],
        contributions_this_month: [0],
        upcoming_events: [0]
      })
    });
  }

  ngOnInit() {
    this.fetchDashboardData();
    // Update current date
    this.currentDate = new Date();
    
    // Refresh dashboard data every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchDashboardData();
      this.currentDate = new Date();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async fetchDashboardData() {
    try {
      const response = await this.fetchService.getDashboard();
      if (response.data && response.data.data) {
        const data = response.data.data;
        
        console.log('Dashboard Data:', data);
        
        // Update dashboard data
        this.dashboardData = {
          daily_verse: data.daily_verse || '',
          quick_stats: {
            total_attendance: 0,
            contributions_this_month: 0,
            upcoming_events: 0
          },
          announcement: data.announcement || { announcements: [] },
          reminders: data.reminders || { reminders: [] },
          activities: []
        };

        // Update stats
        this.stats = {
          total_members: 0,
          monthly_contributions: 0,
          monthly_attendance: 0,
          monthly_events: 0
        };

        console.log('Updated Dashboard Data:', this.dashboardData);
      }
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
        daily_verse: this.dashboardData.daily_verse,
        quick_stats: {
          total_attendance: this.dashboardData.quick_stats.total_attendance,
          contributions_this_month: this.dashboardData.quick_stats.contributions_this_month,
          upcoming_events: this.dashboardData.quick_stats.upcoming_events
        }
      });

      // Clear existing arrays
      while (this.announcements.length) {
        this.announcements.removeAt(0);
      }
      while (this.reminders.length) {
        this.reminders.removeAt(0);
      }

      // Add announcements
      if (this.dashboardData.announcement?.announcements) {
        this.dashboardData.announcement.announcements.forEach((announcement: any) => {
          this.announcements.push(this.fb.group({
            icon: [announcement.icon],
            title: [announcement.title],
            description: [announcement.description]
          }));
        });
      }

      // Add reminders
      if (this.dashboardData.reminders?.reminders) {
        this.dashboardData.reminders.reminders.forEach((reminder: any) => {
          this.reminders.push(this.fb.group({
            icon: [reminder.icon],
            title: [reminder.title],
            status: [reminder.status]
          }));
        });
      }
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
        const formattedData = {
          daily_verse: this.updateForm.value.daily_verse,
          quick_stats: this.updateForm.value.quick_stats,
          announcement: {
            announcements: this.updateForm.value.announcements || []
          },
          reminders: {
            reminders: this.updateForm.value.reminders || []
          }
        };

        const result = await this.postService.updateDashboard(formattedData);
        if (result.data) {
          await this.fetchDashboardData();
          this.closeModal();
        }
      } catch (error) {
        console.error('Error updating dashboard:', error);
      }
    }
  }
}