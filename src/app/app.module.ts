// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// --- HttpClient Provider ---
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

// --- AngularFire Modules (Compat) ---
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';         // <-- Add Auth
import { AngularFireStorageModule } from '@angular/fire/compat/storage';   // <-- Add Storage
import { AngularFirestoreModule } from '@angular/fire/compat/firestore'; // <-- Add Firestore (Optional for metadata)
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    // --- Initialize Firebase ---
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireStorageModule,
    AngularFirestoreModule // Keep even if just for metadata later
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // --- HttpClient Provider ---
    provideHttpClient(withInterceptorsFromDi()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}