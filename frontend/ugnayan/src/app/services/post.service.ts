import { Injectable } from '@angular/core';
import axios from 'axios';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
  isAdmin: number;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  baseUrl = 'http://localhost/ugnayan_system/backend/ugnayanapi/';

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  addViolation(violation: any) {
    return axios.post(
      this.baseUrl + 'addviolations',
      violation,
      this.getHeaders()
    );
  }

  addEvent(event: any) {
    return axios.post(this.baseUrl + 'addevent', event, this.getHeaders());
  }

  addAttendance(attendance: any) {
    return axios.post(
      this.baseUrl + 'addattendance',
      attendance,
      this.getHeaders()
    );
  }

  updateEvent(event: any) {
    return axios.post(this.baseUrl + 'updateevent', event, this.getHeaders());
  }

  deleteEvent(eventId: any) {
    return axios.post(this.baseUrl + 'deleteevent', eventId, this.getHeaders());
  }

  addSermon(sermon: any) {
    return axios.post(this.baseUrl + 'addsermon', sermon, this.getHeaders());
  }

  updateSermon(sermon: any) {
    return axios.post(this.baseUrl + 'updatesermon', sermon, this.getHeaders());
  }

  deleteSermon(sermonId: any) {
    return axios.post(
      this.baseUrl + 'deletesermon',
      sermonId,
      this.getHeaders()
    );
  }

  updateDashboard(dashboardData: any) {
    return axios.post(
      this.baseUrl + 'updatedashboard',
      dashboardData,
      this.getHeaders()
    );
  }

  getUsersByLastname(lastname: string) {
    return axios.get(
      this.baseUrl + 'users-by-lastname/' + lastname,
      this.getHeaders()
    );
  }

  addContribution(contribution: any) {
    return axios.post(
      this.baseUrl + 'addcontribution',
      contribution,
      this.getHeaders()
    );
  }

  async updateUser(user: User): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/update-user`,
        user,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  updateProfile(profile: any) {
    return axios.post(
      this.baseUrl + 'updateprofile',
      profile,
      this.getHeaders()
    );
  }
}
