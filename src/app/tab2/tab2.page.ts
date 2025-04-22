// src/app/tab2/tab2.page.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectorRef
import { IonicModule, ModalController, ViewWillEnter } from '@ionic/angular'; // Import IonicModule, ViewWillEnter
import { CommonModule } from '@angular/common'; // Import CommonModule
import { FormsModule } from '@angular/forms'; // Import FormsModule

// Import Services and Components
import { PhotoService, UserPhoto } from '../services/photo.service';
import { ImageDetailModalComponent } from '../components/image-detail-modal/image-detail-modal.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false, // This component uses Tab2PageModule
})
// Implement ViewWillEnter to refresh data when tab becomes active
export class Tab2Page implements OnInit, ViewWillEnter {

  constructor(
    public photoService: PhotoService, // Public for template binding
    private modalCtrl: ModalController,
    private changeDetector: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  /**
   * Initial load when component is first created.
   */
  ngOnInit() {
    console.log('Tab2 OnInit');
    // Initial load can happen here, but ionViewWillEnter is often better for tabs
    // await this.photoService.loadSaved();
  }

  /**
   * Load/refresh data every time the view is about to be entered.
   */
  async ionViewWillEnter() {
     console.log('Tab2 ionViewWillEnter: Loading saved photos...');
     await this.photoService.loadSaved();
     // Manually trigger change detection if needed after async operations update the array
     // This might be necessary if the template doesn't update automatically
     this.changeDetector.detectChanges();
     console.log(`Tab2 ionViewWillEnter: ${this.photoService.photos.length} photos loaded.`);
  }

  /**
   * Triggered by the FAB button to add a new photo locally.
   */
  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }

  /**
   * Opens the image detail modal for the selected photo.
   * @param photo The photo object to display.
   */
  async openImageModal(photo: UserPhoto) {
    if (!photo || !photo.webviewPath) {
        console.warn("Attempted to open modal for invalid photo:", photo);
        // Optionally show a toast message to the user
        return;
    };
    const modal = await this.modalCtrl.create({
      component: ImageDetailModalComponent,
      componentProps: {
        selectedPhoto: photo
      }
    });
    await modal.present();

    // Handle modal dismissal (if a photo was deleted, reload the list)
    const { role } = await modal.onDidDismiss();
    if (role === 'delete') {
      console.log('Photo deleted via modal, reloading list in Tab 2');
      // No explicit reload needed IF PhotoService array manipulation triggers updates
      // If not, uncomment the following line:
      // await this.photoService.loadSaved(); // Reload from Preferences
      // this.changeDetector.detectChanges(); // Trigger UI update
    }
  }

  /**
   * Triggered by the Upload button in the header.
   */
  async uploadAll() {
    console.log("Tab 2: Upload All button clicked, calling service...");
    // The UI state (spinner, progress bar) is bound directly to PhotoService properties
    await this.photoService.uploadAllPhotosToFirebase();
    console.log("Tab 2: Service upload call finished (upload may continue async).");
    // Consider triggering change detection if upload completion needs to update UI immediately
    // this.changeDetector.detectChanges();
  }

  /**
   * Placeholder function to handle image loading errors in the template.
   * @param event The error event.
   * @param photo The photo that failed to load.
   */
  handleImageError(event: Event, photo: UserPhoto) {
      console.error('Error loading image:', photo.webviewPath, event);
      // Optional: Replace with a placeholder image or remove the item
      const imgElement = event.target as HTMLIonImgElement;
      if (imgElement) {
          imgElement.src = 'assets/icon/favicon.png'; // Path to a fallback image
      }
  }

} // End Tab2Page class