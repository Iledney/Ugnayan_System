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
  styleUrl: './sermons.component.css'
})
export class SermonsComponent implements OnInit {
  sermons: any = '';
  sermonForm: FormGroup;

  constructor(
    private fetchService: FetchService,
    private postService: PostService,
    private fb: FormBuilder
  ) {
    this.sermonForm = this.fb.group({
      title: ['', Validators.required],
      date: ['', Validators.required],
      audioFile: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadSermons();
  }

  async loadSermons() {
    try {
      const response = await this.fetchService.getSermons();
      this.sermons = response.data.data;
      console.log('Sermons:', this.sermons);
    } catch (error) {
      console.error('Error loading sermons:', error);
    }
  }
  

  async onSubmit() {
    if (this.sermonForm.valid) {
      try {
        const payload = {
          title: this.sermonForm.get('title')?.value,
          date: this.sermonForm.get('date')?.value,
          audioFile: this.sermonForm.get('audioFile')?.value
        };

        console.log('Payload:', payload);
  
        await this.postService.addSermon(payload);
        await this.loadSermons();
        this.sermonForm.reset();
      } catch (error: any) {
        console.error('Error adding sermon:', error);
      }
    }
  }

  handleFileInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:audio/xxx;base64, prefix
        const base64Content = base64String.split(',')[1];
        
        this.sermonForm.patchValue({
          audioFile: {
            content: base64Content,
            fileName: file.name,
            fileType: file.type
          }
        });
      };
      
      reader.readAsDataURL(file);
    }
  }

  async deleteSermon(id: string) {
    try {

      const payload = {
        id: id  
      }

      await this.postService.deleteSermon(payload);
      this.loadSermons();
    } catch (error) {
      console.error('Error deleting sermon:', error);
    }
  }



}
