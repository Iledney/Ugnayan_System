import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FetchService } from '../services/fetch.service';
import { PostService } from '../services/post.service';

@Component({
  selector: 'app-sermons',
  standalone: true,
  imports: [NavbarComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './sermons.component.html',
  styleUrls: ['./sermons.component.css']
})
export class SermonsComponent implements OnInit {
  sermons: any[] = []; // Array to store sermons
  sermonForm: FormGroup; // Form group for adding sermons

  constructor(
    private fetchService: FetchService,
    private postService: PostService,
    private fb: FormBuilder
  ) {
    // Initialize the form with validation
    this.sermonForm = this.fb.group({
      title: ['', Validators.required],
      date: ['', Validators.required],
      audioFile: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // Load sermons on component initialization
    this.loadSermons();
  }

  // Load sermons from the backend
  async loadSermons(): Promise<void> {
    try {
      const response = await this.fetchService.getSermons();
      this.sermons = response.data.data || []; // Ensure it's an array
      console.log('Sermons loaded:', this.sermons);
    } catch (error) {
      console.error('Error loading sermons:', error);
    }
  }

  // Handle form submission to add a new sermon
  async onSubmit(): Promise<void> {
    if (this.sermonForm.valid) {
      try {
        const payload = {
          title: this.sermonForm.get('title')?.value,
          date: this.sermonForm.get('date')?.value,
          audioFile: this.sermonForm.get('audioFile')?.value
        };

        console.log('Submitting sermon payload:', payload);

        await this.postService.addSermon(payload); // Send the payload to the backend
        await this.loadSermons(); // Reload sermons after adding
        this.sermonForm.reset(); // Reset the form
      } catch (error: any) {
        console.error('Error adding sermon:', error);
      }
    } else {
      console.warn('Form is invalid. Please fill out all required fields.');
    }
  }

  // Handle file input for the audio file
  handleFileInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1]; // Remove the data:audio/xxx;base64, prefix

        // Patch the form with the audio file details
        this.sermonForm.patchValue({
          audioFile: {
            content: base64Content,
            fileName: file.name,
            fileType: file.type
          }
        });
      };

      reader.readAsDataURL(file); // Read the file as a base64 string
    }
  }

  // Delete a sermon by ID
  async deleteSermon(id: string): Promise<void> {
    try {
      const payload = { id }; // Prepare the payload with the sermon ID
      await this.postService.deleteSermon(payload); // Send the delete request to the backend
      await this.loadSermons(); // Reload sermons after deletion
    } catch (error) {
      console.error('Error deleting sermon:', error);
    }
  }
}