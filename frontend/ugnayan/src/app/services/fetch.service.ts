import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class FetchService {

  baseUrl = 'http://localhost/ugnayan_sys/backend/ugnayanapi/';
  
  getViolations(){
    return axios.get(this.baseUrl + 'violations');
  }
  
  getUsers() {
    return axios.get(this.baseUrl + 'users');
  }
  
  getEvents() {
    return axios.get(this.baseUrl + 'events');
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
