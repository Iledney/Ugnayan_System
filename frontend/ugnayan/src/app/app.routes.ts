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
import { OtpComponent } from './otp/otp.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'otp', component: OtpComponent },

  // Admin routes
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { requiresAdmin: true }
  },
  { 
    path: 'attendance/:id', 
    component: AttendanceComponent,
    canActivate: [AuthGuard],
    data: { requiresAdmin: true }
  },
  { 
    path: 'events', 
    component: EventsComponent,
    canActivate: [AuthGuard],
    data: { requiresAdmin: true }
  },
  { 
    path: 'finance', 
    component: FinanceComponent,
    canActivate: [AuthGuard],
    data: { requiresAdmin: true }
  },
  { 
    path: 'sermons', 
    component: SermonsComponent,
    canActivate: [AuthGuard],
    data: { requiresAdmin: true }
  },
  { 
    path: 'violations', 
    component: ViolationsComponent,
    canActivate: [AuthGuard],
    data: { requiresAdmin: true }
  },

  // Non-admin routes
  { 
    path: 'user-profile', 
    component: UserProfileComponent,
    canActivate: [AuthGuard],
    data: { requiresAdmin: false }
  },
  { 
    path: 'home', 
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: { requiresAdmin: false }
  },
  
  { path: '**', redirectTo: 'dashboard' }, // Catch all route for 404s
];
