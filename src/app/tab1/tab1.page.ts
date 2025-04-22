

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { AngularFireAuth } from '@angular/fire/compat/auth'; 
import { Subscription } from 'rxjs'; 
import firebase from 'firebase/compat/app'; 
import { ToastController } from '@ionic/angular'; 

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false, 
  
})
export class Tab1Page implements OnInit, OnDestroy {

  
  loginForm: FormGroup;
  registerForm: FormGroup;


  user: firebase.User | null = null; 
  authSubscription: Subscription | null = null; 

 
  isLoggingIn = false;
  isRegistering = false;
  isLoggingOut = false;

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth, 
    private toastCtrl: ToastController 
  ) {
    
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    // Listen for changes in the user's login status
    this.authSubscription = this.afAuth.authState.subscribe(user => {
      console.log('Auth State Changed:', user ? `User logged in (${user.email})` : 'User logged out');
      this.user = user; 
      this.isLoggingIn = false;
      this.isRegistering = false;
      this.isLoggingOut = false;
    });
  }


  ngOnDestroy() {
    if (this.authSubscription) {
       this.authSubscription.unsubscribe();
       console.log('Auth Subscription Unsubscribed');
    }
  }


  async register() {
    // Prevent submission if form is invalid or already registering
    if (this.registerForm.invalid || this.isRegistering) {
      if (!this.isRegistering) this.showToast('Please enter valid email and password (min 6 chars).');
      return;
    }

    this.isRegistering = true; 
    const { email, password } = this.registerForm.value;

    try {
      // Call Firebase Auth to create a new user
      const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      console.log('Registered successfully:', credential.user);
      this.showToast('Registration successful!');
      this.registerForm.reset(); // Clear form on success
    } catch (error: any) {
      console.error('Registration Error:', error);
      // Provide specific feedback if possible, otherwise generic message
      this.showToast(`Registration failed: ${error.code === 'auth/email-already-in-use' ? 'Email already exists.' : error.message}`);
    } finally {
      this.isRegistering = false; // Reset loading state
    }
  }


  async login() {
    // Prevent submission if form is invalid or already logging in
    if (this.loginForm.invalid || this.isLoggingIn) {
       if (!this.isLoggingIn) this.showToast('Please enter valid email and password.');
      return;
    }

    this.isLoggingIn = true; // Set loading state
    const { email, password } = this.loginForm.value;

    try {
      // Call Firebase Auth to sign in the user
      const credential = await this.afAuth.signInWithEmailAndPassword(email, password);
      console.log('Logged in successfully:', credential.user);
      this.showToast('Login successful!');
      this.loginForm.reset(); // Clear form on success
    } catch (error: any) {
      console.error('Login Error:', error);
       // Provide specific feedback if possible
      let message = `Login failed: ${error.message}`;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
         message = 'Invalid email or password.';
      }
      this.showToast(message);
    } finally {
      this.isLoggingIn = false; 
    }
  }


  async logout() {
    if (this.isLoggingOut) return; 

    this.isLoggingOut = true; 
    try {
      // Call Firebase Auth to sign out
      await this.afAuth.signOut();
      console.log('Logged out successfully');
      this.showToast('Logout successful!');
      this.user = null; 
    } catch (error: any) {
      console.error('Logout Error:', error);
      this.showToast(`Logout failed: ${error.message}`);
    } finally {
        this.isLoggingOut = false; 
    }
  }

  // --- Helper Method for User Feedback ---
  async showToast(message: string, duration: number = 3000) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: duration,
      position: 'bottom',
    });
    await toast.present(); 
  }
}