import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { FetchService } from '../services/fetch.service';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-violations',
  standalone: true,
  imports: [NavbarComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './violations.component.html',
  styleUrl: './violations.component.css',
})
export class ViolationsComponent implements OnInit {
  violations: any = { data: [] };
  violationForm: FormGroup;
  users: any = { data: [] };

  constructor(
    private fetchService: FetchService,
    private postService: PostService,
    private fb: FormBuilder
  ) {
    this.violationForm = this.fb.group({
      date: ['', Validators.required],
      violation: ['', Validators.required],
      userId: ['', Validators.required],
    });
  }

  ngOnInit() {
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
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Violations',
        text: 'Failed to load violations. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }

  async getUsers() {
    try {
      const res = await this.fetchService.getUsers();
      this.users = res.data;
      console.log('Users fetched:', this.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Users',
        text: 'Failed to load users list. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }

  async addViolation() {
    try {
      if (!this.violationForm.valid) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please fill in all required fields',
          confirmButtonColor: '#d33',
        });
        return;
      }

      // Show loading state
      Swal.fire({
        title: 'Adding Violation',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const form = this.violationForm.value;
      const payload = {
        date: form.date,
        violation: form.violation,
        userId: form.userId,
      };

      const res = await this.postService.addViolation(payload);

      if (res.data && res.data.status === 'success') {
        await this.getViolations(); // Refresh the list
        this.violationForm.reset(); // Reset the form

        await Swal.fire({
          icon: 'success',
          title: 'Violation Added',
          text: 'The violation has been recorded successfully!',
          confirmButtonColor: '#28a745',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(res.data?.message || 'Failed to add violation');
      }
    } catch (err: any) {
      console.error('Error adding violation:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Adding Violation',
        text:
          err.response?.data?.message ||
          'Failed to add violation. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }
}
