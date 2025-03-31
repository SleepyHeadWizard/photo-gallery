// src/app/components/image-detail-modal/image-detail-modal.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ActionSheetController, AlertController } from '@ionic/angular'; // Import necessary Ionic modules
import { UserPhoto, PhotoService } from '../../services/photo.service'; // Import service and interface

@Component({
  selector: 'app-image-detail-modal',
  templateUrl: './image-detail-modal.component.html',
  styleUrls: ['./image-detail-modal.component.scss'],
  standalone: true, // This component is standalone
  imports: [IonicModule, CommonModule, FormsModule] // Import necessary modules for standalone
})
export class ImageDetailModalComponent implements OnInit {

  // Receive the selected photo data from the componentProps
  @Input() selectedPhoto!: UserPhoto;

  constructor(
    private modalCtrl: ModalController,
    private photoService: PhotoService, // Inject PhotoService for deletion
    private actionSheetCtrl: ActionSheetController, // For delete confirmation
    private alertCtrl: AlertController // For potential errors or info
  ) {}

  ngOnInit() {
    // You can log the received photo data for debugging if needed
    // console.log('Photo received in modal:', this.selectedPhoto);
  }

  // Function to close the modal
  closeModal() {
    this.modalCtrl.dismiss(null, 'cancel'); // Role 'cancel'
  }

  // Function to initiate deletion process
  async deletePhoto() {
    // Present an Action Sheet for confirmation
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Delete Photo',
      subHeader: 'Are you sure you want to delete this photo?',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive', // Makes the button red (on iOS)
          handler: async () => {
            // Call the service method to delete
            await this.photoService.deletePicture(this.selectedPhoto);
            // Dismiss the modal, passing back info that deletion occurred
            this.modalCtrl.dismiss(this.selectedPhoto, 'delete'); // Role 'delete'
          }
        },
        {
          text: 'Cancel',
          role: 'cancel', // Closes the action sheet
          handler: () => {
            console.log('Delete cancelled');
          }
        }
      ]
    });
    await actionSheet.present();
  }

  // --- Placeholder for Future Narration ---
  async playNarration() {
    const alert = await this.alertCtrl.create({
        header: 'Narration',
        message: 'AI narration feature coming soon!',
        buttons: ['OK']
    });
    await alert.present();
    // TODO: Implement Gemini API call and TTS playback here later (Part 3)
  }
  // -----------------------------------------
}