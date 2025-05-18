import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { FetchService } from '../services/fetch.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { PostService } from '../services/post.service';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NavbarComponent, RouterModule, CommonModule, ReactiveFormsModule, FooterComponent],
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
    }
  };
  updateForm: FormGroup;
  showModal = false;
  private refreshInterval: any;

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
    // Refresh dashboard data every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchDashboardData();
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
        
        // Ensure quick_stats exists and has default values
        if (!data.quick_stats) {
          data.quick_stats = {
            total_attendance: 0,
            contributions_this_month: 0,
            upcoming_events: 0
          };
        }

        // Convert contributions_this_month to number and format to 2 decimal places
        if (data.quick_stats.contributions_this_month !== undefined) {
          const amount = Number(data.quick_stats.contributions_this_month);
          data.quick_stats.contributions_this_month = amount;
        }

        // Update the dashboard data
        this.dashboardData = data;
        console.log('Updated dashboard data:', this.dashboardData);
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
          quick_stats: this.updateForm.value.quick_stats, // Include Quick Stats
          announcement: {
            announcements: this.updateForm.value.announcements,
            last_updated: new Date().toISOString()
          },
          reminders: {
            reminders: this.updateForm.value.reminders,
            last_updated: new Date().toISOString()
          }
        };

        console.log('Submitting Data:', formattedData); // Debugging

        // Send data to the backend
        const result = await this.postService.updateDashboard(formattedData);
        console.log('Backend Response:', result.data); // Check backend response

        // Fetch updated data
        await this.fetchDashboardData();

        // Close the modal
        this.closeModal();
      } catch (error) {
        console.error('Error updating dashboard:', error);
      }
    } else {
      console.warn('Form is invalid. Please check the inputs.');
    }
  }
}