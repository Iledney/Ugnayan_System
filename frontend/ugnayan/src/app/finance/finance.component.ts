import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.css']
})
export class FinanceComponent {
  families: any[] = []; // Array to store family data
  filteredFamilies: any[] = []; // Array to store filtered families
  newFamily = { surname: '', members: [] }; // Object to store new family data
  selectedFamily: any = null; // Currently selected family for managing members
  newMember = { firstName: '', lastName: '', contribution: 0 }; // Object to store new member data
  newContribution = { amount: 0, date: '' }; // Object to store new contribution data

  constructor() {
    // Load families from localStorage on initialization
    const storedFamilies = localStorage.getItem('families');
    this.families = storedFamilies ? JSON.parse(storedFamilies) : [];
    this.filteredFamilies = [...this.families]; // Initialize filtered families
  }

  // Save families to localStorage
  saveToLocalStorage(): void {
    localStorage.setItem('families', JSON.stringify(this.families));
  }

  // Filter families by surname
  filterFamilies(event: any): void {
    const searchValue = event.target.value.toLowerCase();
    this.filteredFamilies = this.families.filter(family =>
      family.surname.toLowerCase().includes(searchValue)
    );
  }

  // Add a new family
  addFamily(): void {
    if (this.newFamily.surname.trim() === '') {
      alert('Family surname cannot be empty.');
      return;
    }
    const newId = this.families.length + 1;
    const newFamily = { id: newId, surname: this.newFamily.surname, members: [] };
    this.families.push(newFamily);
    this.filteredFamilies = [...this.families]; // Update filtered families
    this.newFamily.surname = ''; // Clear the input field
    this.saveToLocalStorage(); // Save to localStorage
    alert(`Family "${newFamily.surname}" added successfully.`);
  }

  // Open the manage modal for a family
  openManageModal(family: any): void {
    this.selectedFamily = family; // Use a reference, not a clone
  }

  // Close the manage modal
  closeManageModal(): void {
    this.selectedFamily = null;
    this.newContribution = { amount: 0, date: '' }; // Reset new contribution form
  }

  // Save contributions for the selected family
  saveContributions(): void {
    this.saveToLocalStorage(); // Save to localStorage
    alert('Contributions saved successfully.');
    this.closeManageModal();
  }

  // Add a new contribution to a member
  addContribution(member: any): void {
    if (this.newContribution.amount <= 0 || this.newContribution.date.trim() === '') {
      alert('Please enter a valid amount and date.');
      return;
    }

    // Clone the new contribution object to avoid shared references
    const newContribution = { ...this.newContribution };
    member.contributions.push(newContribution); // Add the new contribution to the member
    this.newContribution = { amount: 0, date: '' }; // Reset the form
    this.saveToLocalStorage(); // Save to localStorage
    alert(`Contribution of ${newContribution.amount} added for ${member.firstName}.`);
  }

  // Remove a contribution from a member
  removeContribution(member: any, contribution: any): void {
    const index = member.contributions.indexOf(contribution);
    if (index !== -1) {
      member.contributions.splice(index, 1); // Remove the contribution
      this.saveToLocalStorage(); // Save to localStorage
      alert(`Contribution of ${contribution.amount} on ${contribution.date} removed.`);
    }
  }

  // Add a new member to the selected family
  addMember(): void {
    if (!this.selectedFamily) {
      alert('No family selected.');
      return;
    }

    if (this.newMember.firstName.trim() === '' || this.newMember.lastName.trim() === '') {
      alert('Both first name and last name are required.');
      return;
    }

    // Clone the new member object to avoid shared references
    const newMember = { ...this.newMember, contributions: [] };
    this.selectedFamily.members.push(newMember); // Add the new member to the selected family
    this.newMember = { firstName: '', lastName: '', contribution: 0 }; // Reset the form
    this.saveToLocalStorage(); // Save to localStorage
    alert(`Member "${newMember.firstName} ${newMember.lastName}" added successfully.`);
  }
}