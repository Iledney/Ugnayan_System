import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AttendanceComponent } from './attendance/attendance.component';
import { EventsComponent } from './events/events.component';
import { FinanceComponent } from './finance/finance.component';
import { SermonsComponent } from './sermons/sermons.component';
import { ViolationsComponent } from './violations/violations.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'attendance/:id', component: AttendanceComponent },
  { path: 'events', component: EventsComponent },
  { path: 'finance', component: FinanceComponent },
  { path: 'sermons', component: SermonsComponent },
  { path: 'violations', component: ViolationsComponent },
  { path: '**', redirectTo: 'dashboard' } // Catch all route for 404s
];
