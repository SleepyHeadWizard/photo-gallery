import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { IonicModule, ModalController, ViewWillEnter } from '@ionic/angular'; 
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 


import { PhotoService, UserPhoto } from '../services/photo.service';
import { ImageDetailModalComponent } from '../components/image-detail-modal/image-detail-modal.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})

export class Tab2Page implements OnInit, ViewWillEnter {

  constructor(
    public photoService: PhotoService, 
    private modalCtrl: ModalController,
    private changeDetector: ChangeDetectorRef 
  ) {}


  ngOnInit() {
    console.log('Tab2 OnInit');

  }


  async ionViewWillEnter() {
     console.log('Tab2 ionViewWillEnter: Loading saved photos...');
     await this.photoService.loadSaved();
 
     this.changeDetector.detectChanges();
     console.log(`Tab2 ionViewWillEnter: ${this.photoService.photos.length} photos loaded.`);
  }


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
        
        return;
    };
    const modal = await this.modalCtrl.create({
      component: ImageDetailModalComponent,
      componentProps: {
        selectedPhoto: photo
      }
    });
    await modal.present();

  
    const { role } = await modal.onDidDismiss();
    if (role === 'delete') {
      console.log('Photo deleted via modal, reloading list in Tab 2');

    }
  }


  async uploadAll() {
    console.log("Tab 2: Upload All button clicked, calling service...");
   
    await this.photoService.uploadAllPhotosToFirebase();
    console.log("Tab 2: Service upload call finished (upload may continue async).");

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

}