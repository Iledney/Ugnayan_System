import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AttendanceComponent } from './attendance/attendance.component';
import { EventsComponent } from './events/events.component';
import { FinanceComponent } from './finance/finance.component';
import { SermonsComponent } from './sermons/sermons.component';
import { ViolationsComponent } from './violations/violations.component';
import { RegisterComponent } from './register/register.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { HomeComponent } from './home/home.component';
export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'attendance/:id', component: AttendanceComponent },
  { path: 'events', component: EventsComponent },
  { path: 'finance', component: FinanceComponent },
  { path: 'sermons', component: SermonsComponent },
  { path: 'violations', component: ViolationsComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'user-profile', component: UserProfileComponent },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: 'dashboard' }, // Catch all route for 404s
];
