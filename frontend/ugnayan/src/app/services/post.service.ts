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
  providedIn: 'root'
})
export class PostService {

  baseUrl = 'http://localhost/ugnayan_system/backend/ugnayanapi/';

  addViolation(violation: any) {
    return axios.post(this.baseUrl + 'addviolations', violation);
  }

  addEvent(event: any) {
    return axios.post(this.baseUrl + 'addevent', event);
  }

  addAttendance(attendance: any) {
    return axios.post(this.baseUrl + 'addattendance', attendance);
  }

  updateEvent(event: any) {
    return axios.post(this.baseUrl + 'updateevent', event);
  }

  deleteEvent(eventId: any) {
    return axios.post(this.baseUrl + 'deleteevent', eventId);
  }

  addSermon(sermon: any) {
    return axios.post(this.baseUrl + 'addsermon', sermon);
  }

  updateSermon(sermon: any) {
    return axios.post(this.baseUrl + 'updatesermon', sermon);
  }

  deleteSermon(sermonId: any) {
    return axios.post(this.baseUrl + 'deletesermon', sermonId);
  }

  updateDashboard(dashboardData: any) {
    return axios.post(this.baseUrl + 'updatedashboard', dashboardData);
  }
  
  getUsersByLastname(lastname: string) {
    return axios.get(this.baseUrl + 'users-by-lastname/' + lastname);
  }

  addContribution(contribution: any) {
    return axios.post(this.baseUrl + 'addcontribution', contribution);
  }


  async updateUser(user: User): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.put(`${this.baseUrl}/update-user`, user);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  verifyOTP(data: any) {
    return axios.post(this.baseUrl + 'verifyotp', data);
  }

}
