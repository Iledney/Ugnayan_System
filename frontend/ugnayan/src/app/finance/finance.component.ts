import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { FetchService } from '../services/fetch.service';
import { PostService } from '../services/post.service';
import Swal from 'sweetalert2';

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

interface MonthlyBreakdown {
  name: string;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css',
})
export class FinanceComponent implements OnInit {
  surnames: string[] = [];
  filteredSurnames: string[] = [];
  searchTerm: string = '';
  selectedUsers: User[] = [];
  selectedSurname: string = '';
  userContributions: UserContribution[] = [];
  selectedUserId: number | null = null;
  monthlyBreakdown: MonthlyBreakdown[] = [];

  // Modal properties
  showModal: boolean = false;
  selectedUser: User | null = null;
  contribution: Contribution = {
    user_id: 0,
    amount: 0,
    contribution_date: new Date().toISOString().split('T')[0],
  };

  constructor(
    private fetchService: FetchService,
    private postService: PostService
  ) {}

  ngOnInit() {
    this.fetchSurnames();
    this.calculateMonthlyBreakdown();
  }

  async fetchSurnames() {
    try {
      const response = await this.fetchService.getSurnames();
      const data = response.data as {
        status: string;
        data: Array<{ lastname: string }>;
        statusCode: number;
      };
      this.surnames = data.data.map((item) => item.lastname);
      this.filteredSurnames = [...this.surnames];
    } catch (error) {
      console.error('Error fetching surnames:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Surnames',
        text: 'Failed to load the list of surnames. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }

  async fetchUsersByLastname(lastname: string) {
    try {
      const response = await this.postService.getUsersByLastname(lastname);
      const data = response.data as {
        status: string;
        data: User[];
        statusCode: number;
      };
      this.selectedUsers = data.data;
      this.selectedSurname = lastname;
      this.userContributions = []; // Clear previous contributions
      this.selectedUserId = null;
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Users',
        text: 'Failed to load users for the selected surname. Please try again.',
        confirmButtonColor: '#d33',
      });
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
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching contributions:', error);
      this.userContributions = [];
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Contributions',
        text: 'Failed to load contribution history. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }

  filterSurnames(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = searchValue;

    if (!searchValue) {
      this.filteredSurnames = [...this.surnames];
      return;
    }

    this.filteredSurnames = this.surnames.filter((surname) =>
      surname.toLowerCase().includes(searchValue)
    );
  }

  getTotalContributions(): number {
    return this.userContributions.reduce(
      (total, contribution) => total + contribution.amount,
      0
    );
  }

  getWeeklyTotal(): number {
    const now = new Date();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay()
    );

    return this.userContributions
      .filter(
        (contribution) => new Date(contribution.contribution_date) >= weekStart
      )
      .reduce((total, contribution) => total + contribution.amount, 0);
  }

  getMonthlyTotal(): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.userContributions
      .filter(
        (contribution) => new Date(contribution.contribution_date) >= monthStart
      )
      .reduce((total, contribution) => total + contribution.amount, 0);
  }

  getUserTotalContributions(userId: number): number {
    return this.userContributions
      .filter((contribution) => contribution.user_id === userId)
      .reduce((total, contribution) => total + contribution.amount, 0);
  }

  getLastContributionDate(userId: number): Date | null {
    const userContributions = this.userContributions
      .filter((contribution) => contribution.user_id === userId)
      .sort(
        (a, b) =>
          new Date(b.contribution_date).getTime() -
          new Date(a.contribution_date).getTime()
      );

    return userContributions.length > 0
      ? new Date(userContributions[0].contribution_date)
      : null;
  }

  calculateMonthlyBreakdown() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const now = new Date();
    const currentYear = now.getFullYear();

    // Calculate totals for each month
    const monthlyTotals = months.map((name, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = new Date(currentYear, index + 1, 0);

      const total = this.userContributions
        .filter((contribution) => {
          const date = new Date(contribution.contribution_date);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, contribution) => sum + contribution.amount, 0);

      return { name, total };
    });

    // Calculate percentages based on the highest month
    const maxTotal = Math.max(...monthlyTotals.map((month) => month.total));

    this.monthlyBreakdown = monthlyTotals.map((month) => ({
      name: month.name,
      total: month.total,
      percentage: maxTotal > 0 ? (month.total / maxTotal) * 100 : 0,
    }));
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
      contribution_date: new Date().toISOString().split('T')[0],
    };
  }

  async addContribution() {
    try {
      if (!this.contribution.amount || this.contribution.amount <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Amount',
          text: 'Please enter a valid amount greater than 0',
          confirmButtonColor: '#d33',
        });
        return;
      }

      if (!this.contribution.contribution_date) {
        Swal.fire({
          icon: 'error',
          title: 'Date Required',
          text: 'Please select a contribution date',
          confirmButtonColor: '#d33',
        });
        return;
      }

      // Show loading state
      Swal.fire({
        title: 'Adding Contribution',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      console.log('Sending contribution:', this.contribution);
      const result = await this.postService.addContribution(this.contribution);
      console.log('Server response:', result);

      if (result.data && result.data.data) {
        // Refresh the user's contributions if we're viewing them
        if (this.selectedUserId === this.contribution.user_id) {
          await this.fetchUserContributions(this.selectedUserId);
        }

        // Recalculate monthly breakdown
        this.calculateMonthlyBreakdown();

        await Swal.fire({
          icon: 'success',
          title: 'Contribution Added',
          text: 'The contribution has been recorded successfully!',
          confirmButtonColor: '#28a745',
          timer: 2000,
          showConfirmButton: false,
        });

        this.closeModal();
      } else {
        console.error('Invalid server response:', result);
        throw new Error('Invalid server response');
      }
    } catch (error: any) {
      console.error('Error adding contribution:', error);
      const errorMessage = error.response?.data?.message || 'Please try again.';

      Swal.fire({
        icon: 'error',
        title: 'Error Adding Contribution',
        text: 'Failed to add contribution: ' + errorMessage,
        confirmButtonColor: '#d33',
      });
    }
  }
}
