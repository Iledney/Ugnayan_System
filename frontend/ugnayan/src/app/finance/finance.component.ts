import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { FetchService } from '../services/fetch.service';
import { PostService } from '../services/post.service';
import { FooterComponent } from '../footer/footer.component';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
}

interface Contribution {
  user_id: number;
  amount: number;
  contribution_date: string;
}

interface UserContribution {
  id: number;
  user_id: number;
  amount: number;
  contribution_date: string;
  firstname: string;
  lastname: string;
}

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.css']
})
export class FinanceComponent implements OnInit {
  surnames: string[] = [];
  filteredSurnames: string[] = [];
  searchTerm: string = '';
  selectedUsers: User[] = [];
  selectedSurname: string = '';
  userContributions: UserContribution[] = [];
  selectedUserId: number | null = null;
  
  // Modal properties
  showModal: boolean = false;
  selectedUser: User | null = null;
  contribution: Contribution = {
    user_id: 0,
    amount: 0,
    contribution_date: new Date().toISOString().split('T')[0]
  };

  constructor(private fetchService: FetchService, private postService: PostService) {}

  ngOnInit() {
    this.fetchSurnames();
  }

  async fetchSurnames() {
    try {
      const response = await this.fetchService.getSurnames();
      const data = response.data as { status: string; data: Array<{ lastname: string }>; statusCode: number };
      this.surnames = data.data.map(item => item.lastname);
      this.filteredSurnames = [...this.surnames];
    } catch (error) {
      console.error('Error fetching surnames:', error);
    }
  }

  async fetchUsersByLastname(lastname: string) {
    try {
      const response = await this.postService.getUsersByLastname(lastname);
      const data = response.data as { status: string; data: User[]; statusCode: number };
      this.selectedUsers = data.data;
      this.selectedSurname = lastname;
      this.userContributions = []; // Clear previous contributions
      this.selectedUserId = null;
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  async fetchUserContributions(userId: number) {
    try {
      const response = await this.fetchService.getUserContributions(userId);
      if (response.data && response.data.data) {
        this.userContributions = response.data.data;
        this.selectedUserId = userId;
        console.log('Fetched contributions:', this.userContributions);
      } else {
        console.error('Invalid response format:', response);
        this.userContributions = [];
      }
    } catch (error) {
      console.error('Error fetching contributions:', error);
      this.userContributions = [];
    }
  }

  filterSurnames(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = searchValue;
    
    if (!searchValue) {
      this.filteredSurnames = [...this.surnames];
      return;
    }

    this.filteredSurnames = this.surnames.filter(surname => 
      surname.toLowerCase().includes(searchValue)
    );
  }

  openContributionModal(user: User) {
    this.selectedUser = user;
    this.contribution.user_id = user.id;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedUser = null;
    this.contribution = {
      user_id: 0,
      amount: 0,
      contribution_date: new Date().toISOString().split('T')[0]
    };
  }

  async addContribution() {
    try {
      // Validate amount
      if (!this.contribution.amount || this.contribution.amount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
      }

      // Validate date
      if (!this.contribution.contribution_date) {
        alert('Please select a date');
        return;
      }

      console.log('Sending contribution:', this.contribution);
      const result = await this.postService.addContribution(this.contribution);
      console.log('Server response:', result);
      
      if (result.data && result.data.data) {
        const { contribution, monthly_total } = result.data.data;
        
        // Add the new contribution to the list if we're viewing that user's contributions
        if (this.selectedUserId === this.contribution.user_id) {
          await this.fetchUserContributions(this.selectedUserId);
        }

        // Update dashboard data
        const dashboardResponse = await this.fetchService.getDashboard();
        if (dashboardResponse.data && dashboardResponse.data.data) {
          const dashboard = dashboardResponse.data.data;
          if (!dashboard.quick_stats) {
            dashboard.quick_stats = {};
          }
          dashboard.quick_stats.contributions_this_month = monthly_total;
        }
        
        // Show success message
        alert('Contribution added successfully!');
        this.closeModal();
      } else {
        console.error('Invalid server response:', result);
        alert('Failed to add contribution. Please try again.');
      }
    } catch (error: any) {
      console.error('Error adding contribution:', error);
      const errorMessage = error.response?.data?.message || 'Please try again.';
      alert('Failed to add contribution: ' + errorMessage);
    }
  }

  getTotalContributions(): number {
    return this.userContributions.reduce((total, contribution) => total + contribution.amount, 0);
  }
}