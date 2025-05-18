import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormBuilder } from '@angular/forms';
import { FormGroup, Validators } from '@angular/forms';
import { FetchService } from '../services/fetch.service';
import { PostService } from '../services/post.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AttendanceComponent } from '../attendance/attendance.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [NavbarComponent, CommonModule, ReactiveFormsModule, AttendanceComponent, FooterComponent],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
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

  constructor(private fetchService: FetchService, private postService: PostService, private fb: FormBuilder) {
    this.eventForm = this.fb.group({
      eventname: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required],
      image: ['']
    });

    this.updateForm = this.fb.group({
      id: [''],
      eventname: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required],
      image: ['']
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
        // The actual events array is in res.data.data
        const eventData = Array.isArray(res.data.data) ? res.data.data : [];
        this.events = { data: eventData };
        console.log('Processed events:', this.events);
      } else {
        console.error('Invalid events data format:', res);
        this.showError('Failed to load events');
      }
    } catch (err: any) {
      console.error('Error details:', err);
      this.showError(err.response?.data?.message || 'Error loading events');
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.showError('Please select a valid image file');
        return;
      }
      this.selectedFile = file;
      this.convertFileToBase64(file).then(base64 => {
        this.previewImage = base64;
        this.eventForm.patchValue({ image: base64 });
      }).catch(error => {
        console.error('Error converting file to base64:', error);
        this.showError('Failed to process the selected image. Please try again.');
      });
    }
  }

  onUpdateFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.showError('Please select a valid image file');
        return;
      }
      this.convertFileToBase64(file).then(base64 => {
        this.updatePreviewImage = base64;
        this.updateForm.patchValue({ image: base64 });
      }).catch(error => {
        console.error('Error converting file to base64:', error);
        this.showError('Failed to process the selected image. Please try again.');
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
        this.showError('Please fill in all required fields');
        return;
      }

      const form = this.eventForm.value;
      const payload = {
        eventname: form.eventname,
        description: form.description,
        date: form.date,
        image: form.image || null
      };

      console.log('Sending payload:', payload);
      const res = await this.postService.addEvent(payload);
      console.log('Response:', res);
      
      if (res.data && res.data.status === 'success') {
        this.showSuccess('Event added successfully');
        this.resetForm();
        await this.getEvents();
      } else {
        this.showError(res.data?.message || 'Failed to add event');
      }
    } catch (err: any) {
      console.error('Error details:', err);
      this.showError(err.response?.data?.message || 'Error adding event. Please try again.');
    }
  }

  async deleteEvent(id: any) {
    try {
      const payload = { id: id };
      const res = await this.postService.deleteEvent(payload);
      console.log('Delete Response:', res);
      
      if (res.data && res.data.status === 'success') {
        this.showSuccess('Event deleted successfully');
        await this.getEvents();
      } else {
        this.showError(res.data?.message || 'Failed to delete event');
      }
    } catch (err: any) {
      console.error('Error details:', err);
      this.showError(err.response?.data?.message || 'Error deleting event. Please try again.');
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
      image: null
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
        this.showError('Please fill in all required fields');
        return;
      }

      const form = this.updateForm.value;
      console.log('Form values before update:', form);

      const payload: any = {
        eventId: form.id,
        eventname: form.eventname,
        description: form.description,
        date: form.date
      };

      // Only include image in payload if a new image was selected
      if (form.image && form.image.startsWith('data:image')) {
        payload.image = form.image;
      }

      console.log('Sending update payload:', payload);
      const res = await this.postService.updateEvent(payload);
      console.log('Update Response:', res);
      
      if (res.data && res.data.status === 'success') {
        this.showSuccess('Event updated successfully');
        this.closeUpdateModal();
        await this.getEvents(); // Refresh the events list
      } else {
        this.showError(res.data?.message || 'Failed to update event');
      }
    } catch (err: any) {
      console.error('Error details:', err);
      this.showError(err.response?.data?.message || 'Error updating event. Please try again.');
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