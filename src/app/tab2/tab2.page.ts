// src/app/tab2/tab2.page.ts
import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular'; // Import ModalController
import { PhotoService, UserPhoto } from '../services/photo.service'; // Import UserPhoto interface if not already
import { ImageDetailModalComponent } from '../components/image-detail-modal/image-detail-modal.component'; // Import the new modal component

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false, 
  // No standalone: true here as it uses Tab2PageModule by default
})
export class Tab2Page implements OnInit {

  // Inject ModalController along with PhotoService
  constructor(
    public photoService: PhotoService,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }

  // Function to open the modal
  async openImageModal(photo: UserPhoto) {
    const modal = await this.modalCtrl.create({
      component: ImageDetailModalComponent, // The component to display
      componentProps: {
        // Pass the selected photo data to the modal
        selectedPhoto: photo
      },
      // Optional: Add CSS class for custom styling
      // cssClass: 'image-modal-class'
    });

    await modal.present();

    // Optional: Handle data passed back from the modal when dismissed
    // const { data, role } = await modal.onDidDismiss();
    // if (role === 'delete') {
    //   console.log('Delete action triggered from modal for photo:', data);
    //   // Optionally trigger UI refresh if needed, though service should handle array update
    // }
  }
}