import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FetchService } from '../services/fetch.service';
import { PostService } from '../services/post.service';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-sermons',
  standalone: true,
  imports: [NavbarComponent, CommonModule, ReactiveFormsModule, FooterComponent],
  templateUrl: './sermons.component.html',
  styleUrls: ['./sermons.component.css']
})
export class SermonsComponent implements OnInit {
  sermons: any[] = []; // Array to store sermons
  sermonForm: FormGroup; // Form group for adding sermons
  selectedFileName: string | null = null; // Track selected file name

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
      console.log('Raw response from getSermons:', response);
      
      // Check if response has the expected structure
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        return;
      }

      this.sermons = response.data.data || []; // Ensure it's an array
      console.log('Extracted sermons array:', this.sermons);
      
      // Process each sermon to ensure valid audio URLs
      this.sermons = this.sermons.map(sermon => {
        const processedSermon = {
          ...sermon,
          audioFile: sermon.audioFile ? `http://localhost${sermon.audioFile}` : null,
          audioError: null
        };
        console.log('Processed sermon:', processedSermon);
        return processedSermon;
      });

      console.log('Final processed sermons:', this.sermons);
    } catch (error) {
      console.error('Error loading sermons:', error);
    }
  }

  // Handle file input for the audio file
  handleFileInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      
      // Check file size (limit to 35MB to stay within PHP limits)
      const maxSize = 35 * 1024 * 1024; // 35MB in bytes
      if (file.size > maxSize) {
        alert('File is too large. Please select an audio file smaller than 35MB.');
        target.value = ''; // Clear the file input
        this.selectedFileName = null;
        return;
      }

      // Check file type
      if (!file.type.startsWith('audio/')) {
        alert('Please select a valid audio file.');
        target.value = ''; // Clear the file input
        this.selectedFileName = null;
        return;
      }

      // Update selected file name
      this.selectedFileName = file.name;

      const reader = new FileReader();

      reader.onload = () => {
        try {
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
          console.log('File processed successfully:', {
            name: file.name,
            type: file.type,
            size: file.size
          });
        } catch (error) {
          console.error('Error processing file:', error);
          alert('Error processing the audio file. Please try again.');
          target.value = '';
          this.selectedFileName = null;
        }
      };

      reader.onerror = () => {
        console.error('Error reading file:', reader.error);
        alert('Error reading the audio file. Please try again.');
        target.value = '';
        this.selectedFileName = null;
      };

      reader.readAsDataURL(file);
    } else {
      this.selectedFileName = null;
    }
  }

  // Handle form submission to add a new sermon
  async onSubmit(): Promise<void> {
    if (this.sermonForm.valid) {
      try {
        const formData = this.sermonForm.value;
        console.log('Submitting form data:', formData);

        const payload = {
          title: formData.title,
          date: formData.date,
          audioFile: formData.audioFile
        };

        console.log('Submitting sermon payload:', payload);

        await this.postService.addSermon(payload);
        console.log('Sermon added successfully');
        
        await this.loadSermons(); // Reload sermons after adding
        this.sermonForm.reset(); // Reset the form
      } catch (error: any) {
        console.error('Error adding sermon:', error);
        alert('Error adding sermon. Please try again.');
      }
    } else {
      console.warn('Form is invalid:', this.sermonForm.errors);
      alert('Please fill out all required fields correctly.');
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

  // Handle audio errors
  onAudioError(event: Event, sermon: any): void {
    const audio = event.target as HTMLAudioElement;
    console.error('Audio error for sermon:', sermon.title);
    console.error('Audio element error:', audio.error);
    sermon.audioError = `Error loading audio: ${audio.error?.message || 'Unknown error'}`;
  }

  // Handle successful audio load
  onAudioLoaded(event: Event, sermon: any): void {
    const audio = event.target as HTMLAudioElement;
    console.log('Audio loaded successfully for sermon:', sermon.title);
    console.log('Duration:', audio.duration);
    console.log('Ready state:', audio.readyState);
    sermon.audioError = null;
  }
}