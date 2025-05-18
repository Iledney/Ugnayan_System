import { Injectable } from '@angular/core';
import axios from 'axios';


@Injectable({
  providedIn: 'root'
})
export class FetchService {

  baseUrl = 'http://localhost/ugnayan_system/backend/ugnayanapi/';
  
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }

  getViolations(){
    return axios.get(this.baseUrl + 'violations', this.getHeaders());
  }
  
  getUsers() {
    return axios.get(this.baseUrl + 'users', this.getHeaders());
  }
  
  getEvents() {
    return axios.get(this.baseUrl + 'events', this.getHeaders());
  }

  getSurnames() {
    return axios.get(this.baseUrl + 'surnames', this.getHeaders());
  }

  getUserContributions(userId: number) {
    return axios.get(this.baseUrl + 'user-contributions/' + userId, this.getHeaders());
  }

  getSermons() {
    return axios.get(this.baseUrl + 'sermons', this.getHeaders());
  }

  fetchAttendance(eventId: string){
    return axios.get(this.baseUrl + 'attendance/' + eventId, this.getHeaders());
  }

  getDashboard() {
    return axios.get(this.baseUrl + 'dashboard', this.getHeaders());
  }

}
