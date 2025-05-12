import { Injectable } from '@angular/core';
import axios from 'axios';


@Injectable({
  providedIn: 'root'
})
export class FetchService {

  baseUrl = 'http://localhost/ugnayan_system/backend/ugnayanapi/';
  
  getViolations(){
    return axios.get(this.baseUrl + 'violations');
  }
  
  getUsers() {
    return axios.get(this.baseUrl + 'users');
  }
  
  getEvents() {
    return axios.get(this.baseUrl + 'events');
  }

  getSurnames() {
    return axios.get(this.baseUrl + 'surnames');
  }

  getUserContributions(userId: number) {
    return axios.get(this.baseUrl + 'user-contributions/' + userId);
  }

  getSermons() {
    return axios.get(this.baseUrl + 'sermons');
  }

  fetchAttendance(){
    return axios.get(this.baseUrl + 'attendance');
  }

  getDashboard() {
    return axios.get(this.baseUrl + 'dashboard');
  }

}
