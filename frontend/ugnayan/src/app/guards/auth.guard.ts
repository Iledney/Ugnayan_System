import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Check if user is logged in
    if (!user) {
      this.router.navigate(['/']);
      return false;
    }

    // Check if route requires admin access
    const requiresAdmin = route.data['requiresAdmin'] === true;
    
    if (requiresAdmin && user.isAdmin !== 1) {
      // If user is not admin but trying to access admin route, redirect to home
      this.router.navigate(['/home']);
      return false;
    }

    if (!requiresAdmin && user.isAdmin === 1) {
      // If user is admin but trying to access non-admin route, redirect to dashboard
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
} 