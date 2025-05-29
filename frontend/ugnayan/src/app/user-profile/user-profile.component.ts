import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { FetchService } from '../services/fetch.service';
import { PostService } from '../services/post.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [NavbarComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit {
  user: any = {};
  updateForm: FormGroup;
  showUpdateModal = false;
  selectedFile: File | null = null;
  previewImage: string | ArrayBuffer | null = null;

  constructor(
    private fetchService: FetchService,
    private postService: PostService,
    private fb: FormBuilder
  ) {
    this.updateForm = this.fb.group({
      firstname: ['', Validators.required],
      middlename: [''],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      image: [''],
    });
  }

  ngOnInit() {
    this.getUserProfile();
  }

  async getUserProfile() {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('No user data found');
      }

      const user = JSON.parse(userData);
      const res = await this.fetchService.getUserProfile(user.id);

      if (res.data && res.data.status === 'success') {
        this.user = res.data.data;
        this.updateForm.patchValue({
          firstname: this.user.firstname,
          middlename: this.user.middlename || '',
          lastname: this.user.lastname,
          email: this.user.email,
          image: this.user.image || '',
        });
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Profile',
        text: err.message || 'Failed to load user profile',
        confirmButtonColor: '#d33',
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please select a valid image file',
          confirmButtonColor: '#d33',
        });
        return;
      }
      this.selectedFile = file;
      this.convertFileToBase64(file)
        .then((base64) => {
          this.previewImage = base64;
          this.updateForm.patchValue({ image: base64 });
        })
        .catch((error) => {
          console.error('Error converting file to base64:', error);
          Swal.fire({
            icon: 'error',
            title: 'File Processing Error',
            text: 'Failed to process the selected image',
            confirmButtonColor: '#d33',
          });
        });
    }
  }

  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  openUpdateModal() {
    this.showUpdateModal = true;
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
    this.previewImage = null;
    this.updateForm.patchValue({
      firstname: this.user.firstname,
      middlename: this.user.middlename || '',
      lastname: this.user.lastname,
      email: this.user.email,
      image: this.user.image || '',
    });
  }

  async updateProfile() {
    try {
      if (!this.updateForm.valid) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please fill in all required fields correctly',
          confirmButtonColor: '#d33',
        });
        return;
      }

      // Show loading state
      Swal.fire({
        title: 'Updating Profile',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const formData = this.updateForm.value;
      const payload = {
        id: this.user.id,
        ...formData,
      };

      const res = await this.postService.updateProfile(payload);

      if (res.data && res.data.status === 'success') {
        // Update local storage with new user data
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.firstname = formData.firstname;
        userData.middlename = formData.middlename;
        userData.lastname = formData.lastname;
        userData.email = formData.email;
        if (formData.image) {
          userData.image = formData.image;
        }
        localStorage.setItem('user', JSON.stringify(userData));

        await this.getUserProfile();
        this.closeUpdateModal();

        await Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Your profile has been updated successfully!',
          confirmButtonColor: '#28a745',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(res.data?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.message || 'Failed to update profile',
        confirmButtonColor: '#d33',
      });
    }
  }
}
