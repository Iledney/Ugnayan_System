import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  baseUrl = 'http://localhost/ugnayan_sys/backend/ugnayanapi/';

  addViolation(violation: any) {
    return axios.post(this.baseUrl + 'addviolations', violation);
  }

  addEvent(event: any) {
    return axios.post(this.baseUrl + 'addevent', event);
  }

  addAttendance(attendance: any){
    return axios.post(this.baseUrl + 'addattendance', attendance);
  }

  updateEvent(event: any){  
    return axios.post(this.baseUrl + 'updateevent', event);
  }

  deleteEvent(eventId: any) {
    return axios.post(this.baseUrl + 'deleteevent', eventId );
  }

  addSermon(sermon: any) {
    return axios.post(this.baseUrl + 'addsermon', sermon);
  }

  updateSermon(sermon: any) {
    return axios.post(this.baseUrl + 'updatesermon', sermon);
  }

  deleteSermon(sermonId: any) {
    return axios.post(this.baseUrl + 'deletesermon',  sermonId);
  }

  updateDashboard(dashboardData: any) {
    return axios.post(this.baseUrl + 'updatedashboard', dashboardData);
}

}
