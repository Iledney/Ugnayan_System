import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { FetchService } from '../services/fetch.service';
import { PostService } from '../services/post.service';

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
  imports: [CommonModule, FormsModule, NavbarComponent],
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
      const data = response.data as { status: string; data: UserContribution[]; statusCode: number };
      this.userContributions = data.data;
      this.selectedUserId = userId;
    } catch (error) {
      console.error('Error fetching contributions:', error);
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
      await this.postService.addContribution(this.contribution);
      this.closeModal();
      // Refresh contributions if we're viewing a user's contributions
      if (this.selectedUserId) {
        await this.fetchUserContributions(this.selectedUserId);
      }
    } catch (error) {
      console.error('Error adding contribution:', error);
    }
  }

  getTotalContributions(): number {
    return this.userContributions.reduce((total, contribution) => total + contribution.amount, 0);
  }
}