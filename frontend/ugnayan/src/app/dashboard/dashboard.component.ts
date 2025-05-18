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
      reminders: this.fb.array([])
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
          announcement: data.announcement || { announcements: [] },
          reminders: data.reminders || { reminders: [] },
          activities: []
        };

        // Update stats
        this.stats = {
          total_members: data.total_members || 0,
          monthly_contributions: data.monthly_contributions || 0,
          monthly_attendance: data.monthly_attendance || 0,
          monthly_events: data.monthly_events || 0
        };

        // Fetch and process events
        try {
          const eventsResponse = await this.fetchService.getEvents();
          if (eventsResponse.data && eventsResponse.data.status === 'success') {
            const events = Array.isArray(eventsResponse.data.data) ? eventsResponse.data.data : [];
            // Convert events to activities format
            this.dashboardData.activities = events.map((event: any) => ({
              date: event.date,
              name: event.eventname,
              category: 'Event',
              status: new Date(event.date) > new Date() ? 'Upcoming' : 'Past'
            }));
          }
        } catch (error) {
          console.error('Error fetching events:', error);
        }

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