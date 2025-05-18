import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { FetchService } from '../services/fetch.service';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-violations',
  standalone: true,
  imports: [NavbarComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './violations.component.html',
  styleUrl: './violations.component.css'
})
export class ViolationsComponent implements OnInit {

  violations: any = { data: [] };
  violationForm: FormGroup;
  users: any = { data: [] };

  constructor(private fetchService: FetchService, private postService: PostService, private fb: FormBuilder) {
    this.violationForm = this.fb.group({
      date: ['', Validators.required],
      violation: ['', Validators.required],
      userId: ['', Validators.required]
    });
  }

  ngOnInit(){
    this.getViolations();
    this.getUsers();
  }

  async getViolations() {
    try {
      const res = await this.fetchService.getViolations();
      this.violations = res.data;
      console.log(this.violations);
    } catch (err) {
      console.error('Error fetching violations:', err);
    }
  }

  async getUsers() {
    try {
      const res = await this.fetchService.getUsers();
      this.users = res.data;
      console.log('Users fetched:', this.users);
    } catch (err) {
      console.error('Error fetching users:', err);  
    }
  }

  async addViolation() {
    try {

      const form = this.violationForm.value;

      const payload = {
        date: form.date,
        violation: form.violation,
        userId: form.userId
      }

      const res = await this.postService.addViolation(payload);

      this.getViolations();

    } catch (err) {
      console.error('Error adding violation:', err);
    }

  }
}
