import { Injectable } from '@angular/core';
import axios from 'axios';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  baseUrl = 'http://localhost/ugnayan_sys/backend/ugnayanapi/'

  login(username: string, password: string) {
    return axios.post(this.baseUrl + 'login', { username, password });
  }

}
