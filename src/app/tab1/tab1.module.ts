// src/app/tab1/tab1.module.ts
import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <<< IMPORT ReactiveFormsModule
import { Tab1Page } from './tab1.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module'; // If you use ExploreContainer

import { Tab1PageRoutingModule } from './tab1-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule, // Keep if needed for other things, often included alongside Reactive
    ReactiveFormsModule, // <<< ADD THIS MODULE
    ExploreContainerComponentModule, // Remove if not used
    Tab1PageRoutingModule
  ],
  declarations: [Tab1Page]
})
export class Tab1PageModule {}