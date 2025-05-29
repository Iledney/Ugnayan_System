import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { FetchService } from '../services/fetch.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SidenavComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  title = 'Ugnayan Dashboard';
  dashboardData: any = null;
  sermons: any[] = [];
  loading = true;
  error = '';
  
  // Pagination variables
  currentPage = 1;
  itemsPerPage = 3;
  totalPages = 0;
  paginatedSermons: any[] = [];

  constructor(private fetchService: FetchService) {}

  ngOnInit() {
    this.fetchDashboardData();
    this.loadSermons();
  }

  async fetchDashboardData() {
    this.loading = true;
    this.error = '';
    try {
      const response = await this.fetchService.getDashboard();
      this.dashboardData = response.data.data;
      console.log('Dashboard data loaded:', this.dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      this.error = 'Failed to load dashboard data. Please try again later.';
    } finally {
      this.loading = false;
    }
  }

  async loadSermons() {
    try {
      const response = await this.fetchService.getSermons();
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        return;
      }

      // Process sermons to ensure valid audio URLs
      this.sermons = (response.data.data || []).map((sermon: any) => ({
        ...sermon,
        audioFile: sermon.audioFile ? `http://localhost${sermon.audioFile}` : null
      }));

      this.totalPages = Math.ceil(this.sermons.length / this.itemsPerPage);
      this.updatePaginatedSermons();
      console.log('Sermons loaded:', this.sermons);
    } catch (error) {
      console.error('Error loading sermons:', error);
    }
  }

  refreshDashboard() {
    this.fetchDashboardData();
  }

  // Pagination methods
  updatePaginatedSermons() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedSermons = this.sermons.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedSermons();
    }
  }

  previousPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
