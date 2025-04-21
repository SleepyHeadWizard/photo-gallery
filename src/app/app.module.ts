// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// --- Remove HttpClientModule import ---
// import { HttpClientModule } from '@angular/common/http';

// --- Import provideHttpClient and related functions ---
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent],
  // --- Remove HttpClientModule from imports ---
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule
    // HttpClientModule // <-- REMOVE THIS LINE
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // --- Add HttpClient provider here ---
    provideHttpClient(withInterceptorsFromDi()), // Recommended way

     // If you don't need DI for interceptors (less common):
    // provideHttpClient(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}