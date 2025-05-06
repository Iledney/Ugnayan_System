import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css'
})
export class FinanceComponent {

}
