import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormBuilder } from '@angular/forms';
import { FormGroup, Validators } from '@angular/forms';
import { FetchService } from '../services/fetch.service';
import { PostService } from '../services/post.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AttendanceComponent } from '../attendance/attendance.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    NavbarComponent,
    CommonModule,
    ReactiveFormsModule,
    AttendanceComponent,
  ],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css',
})
export class EventsComponent implements OnInit {
  events: any = { data: [] };
  eventForm: FormGroup;
  selectedFile: File | null = null;
  previewImage: string | ArrayBuffer | null = null;
  updatePreviewImage: string | ArrayBuffer | null = null;
  showAttendanceModal = false;
  selectedEvent: any = null;
  showUpdateModal = false;
  updateForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fetchService: FetchService,
    private postService: PostService,
    private fb: FormBuilder
  ) {
    this.eventForm = this.fb.group({
      eventname: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required],
      image: [''],
    });

    this.updateForm = this.fb.group({
      id: [''],
      eventname: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required],
      image: [''],
    });
  }

  ngOnInit() {
    this.getEvents();
  }

  async getEvents() {
    try {
      const res = await this.fetchService.getEvents();
      console.log('Raw API response:', res);

      if (res.data && res.data.status === 'success') {
        const eventData = Array.isArray(res.data.data) ? res.data.data : [];
        this.events = { data: eventData };
        console.log('Processed events:', this.events);
      } else {
        console.error('Invalid events data format:', res);
        Swal.fire({
          icon: 'error',
          title: 'Error Loading Events',
          text: 'Failed to load events. Please try again.',
          confirmButtonColor: '#d33',
        });
      }
    } catch (err: any) {
      console.error('Error details:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Events',
        text: err.response?.data?.message || 'Error loading events',
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
          this.eventForm.patchValue({ image: base64 });
        })
        .catch((error) => {
          console.error('Error converting file to base64:', error);
          Swal.fire({
            icon: 'error',
            title: 'File Processing Error',
            text: 'Failed to process the selected image. Please try again.',
            confirmButtonColor: '#d33',
          });
        });
    }
  }

  onUpdateFileSelected(event: Event) {
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
      this.convertFileToBase64(file)
        .then((base64) => {
          this.updatePreviewImage = base64;
          this.updateForm.patchValue({ image: base64 });
        })
        .catch((error) => {
          console.error('Error converting file to base64:', error);
          Swal.fire({
            icon: 'error',
            title: 'File Processing Error',
            text: 'Failed to process the selected image. Please try again.',
            confirmButtonColor: '#d33',
          });
        });
    }
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  async addEvent() {
    try {
      if (!this.eventForm.valid) {
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
        title: 'Adding Event',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const form = this.eventForm.value;
      const payload = {
        eventname: form.eventname,
        description: form.description,
        date: form.date,
        image: form.image || null,
      };

      console.log('Sending payload:', payload);
      const res = await this.postService.addEvent(payload);
      console.log('Response:', res);

      if (res.data && res.data.status === 'success') {
        this.resetForm();
        await this.getEvents();
        await Swal.fire({
          icon: 'success',
          title: 'Event Added',
          text: 'Event has been added successfully!',
          confirmButtonColor: '#28a745',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(res.data?.message || 'Failed to add event');
      }
    } catch (err: any) {
      console.error('Error details:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Adding Event',
        text:
          err.response?.data?.message ||
          'Error adding event. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }

  async deleteEvent(id: any) {
    try {
      const result = await Swal.fire({
        title: 'Delete Event',
        text: 'Are you sure you want to delete this event?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it',
      });

      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Deleting Event',
          text: 'Please wait...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const payload = { id: id };
        const res = await this.postService.deleteEvent(payload);

        if (res.data && res.data.status === 'success') {
          await this.getEvents();
          await Swal.fire({
            icon: 'success',
            title: 'Event Deleted',
            text: 'Event has been deleted successfully!',
            confirmButtonColor: '#28a745',
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          throw new Error(res.data?.message || 'Failed to delete event');
        }
      }
    } catch (err: any) {
      console.error('Error details:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Deleting Event',
        text:
          err.response?.data?.message ||
          'Error deleting event. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }

  openUpdateModal(event: any) {
    console.log('Opening update modal with event:', event);
    this.showUpdateModal = true;
    const originalImage = event.image;

    // Format the date properly
    let formattedDate = event.date;
    if (event.date && event.date.includes('T')) {
      formattedDate = event.date.split('T')[0];
    }

    this.updateForm.patchValue({
      id: event.id,
      eventname: event.eventname,
      description: event.description,
      date: formattedDate,
      image: null,
    });
    this.updatePreviewImage = originalImage;
    console.log('Update form values:', this.updateForm.value);
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
    this.updateForm.reset();
    this.updatePreviewImage = null;
  }

  async updateEvent() {
    try {
      if (!this.updateForm.valid) {
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
        title: 'Updating Event',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const form = this.updateForm.value;
      const payload: any = {
        eventId: form.id,
        eventname: form.eventname,
        description: form.description,
        date: form.date,
      };

      if (form.image && form.image.startsWith('data:image')) {
        payload.image = form.image;
      }

      console.log('Sending update payload:', payload);
      const res = await this.postService.updateEvent(payload);

      if (res.data && res.data.status === 'success') {
        this.closeUpdateModal();
        await this.getEvents();
        await Swal.fire({
          icon: 'success',
          title: 'Event Updated',
          text: 'Event has been updated successfully!',
          confirmButtonColor: '#28a745',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(res.data?.message || 'Failed to update event');
      }
    } catch (err: any) {
      console.error('Error details:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Updating Event',
        text:
          err.response?.data?.message ||
          'Error updating event. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  }

  resetForm() {
    this.eventForm.reset();
    this.selectedFile = null;
    this.previewImage = null;
  }

  onRowClick(event: any) {
    this.selectedEvent = event;
    this.showAttendanceModal = true;
  }

  closeAttendanceModal() {
    this.showAttendanceModal = false;
    this.selectedEvent = null;
  }
}
