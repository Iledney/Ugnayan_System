import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormBuilder } from '@angular/forms';
import { FormGroup, Validators } from '@angular/forms';
import { FetchService } from '../services/fetch.service';
import { PostService } from '../services/post.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AttendanceComponent } from '../attendance/attendance.component';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [NavbarComponent, CommonModule, ReactiveFormsModule, AttendanceComponent],
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
      this.events = res.data;
      console.log('Events:', this.events);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
        this.eventForm.patchValue({ image: reader.result });
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onUpdateFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.updatePreviewImage = reader.result;
        this.updateForm.patchValue({ image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  }

  async addEvent() {
    try {
      const form = this.eventForm.value;
      const payload = {
        eventname: form.eventname,
        description: form.description,
        date: form.date,
        image: form.image
      };

      const res = await this.postService.addEvent(payload);
      console.log('Response:', res);
      this.resetForm();
      this.getEvents();
    } catch (err) {
      console.error('Error adding event:', err);
    }
  }

  async deleteEvent(id: any) {
    try {
      const payload = { id: id };
      const res = await this.postService.deleteEvent(payload);
      console.log('Delete Response:', res);
      this.getEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  }

  openUpdateModal(event: any) {
    this.showUpdateModal = true;
    this.updateForm.patchValue({
      id: event.id,
      eventname: event.eventname,
      description: event.description,
      date: event.date,
      image: event.image
    });
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
    this.updateForm.reset();
    this.updatePreviewImage = null;
  }

  async updateEvent() {
    try {
      if (!this.updateForm.valid) {
        return;
      }

      const form = this.updateForm.value;
      const payload = {
        eventId: form.id,
        eventname: form.eventname,
        description: form.description,
        date: form.date,
        image: form.image
      };

      const res = await this.postService.updateEvent(payload);
      console.log('Update Response:', res);
      this.closeUpdateModal();
      await this.getEvents();
    } catch (err) {
      console.error('Error updating event:', err);
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