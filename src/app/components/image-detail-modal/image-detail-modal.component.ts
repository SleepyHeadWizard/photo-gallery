// src/app/components/image-detail-modal/image-detail-modal.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core'; // Added OnDestroy
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ActionSheetController, AlertController, LoadingController, Platform } from '@ionic/angular'; // Added Platform
import { UserPhoto, PhotoService } from '../../services/photo.service';
import { AiService } from '../../services/ai.service';

// --- Import the TTS Plugin ---
import { TextToSpeech, TTSOptions } from '@capacitor-community/text-to-speech';

@Component({
  selector: 'app-image-detail-modal',
  templateUrl: './image-detail-modal.component.html',
  styleUrls: ['./image-detail-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule] // Imports for standalone component
})
// Implement OnDestroy to stop speech when modal closes
export class ImageDetailModalComponent implements OnInit, OnDestroy {

  @Input() selectedPhoto!: UserPhoto; // Input property to receive photo data
  generatedDescription: string | null = null; // To store the AI description
  isNarrating = false; // Flag to control AI generation loading state
  isSpeaking = false; // Flag to track if TTS is currently active

  // Reference to the Web Speech API utterance for potential cancellation
  private webUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    private modalCtrl: ModalController,
    private photoService: PhotoService, // Keep for delete functionality
    private aiService: AiService,       // Inject AiService
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController, // Inject LoadingController for feedback
    private platform: Platform // Inject Platform service for platform detection
  ) {}

  ngOnInit() {
    // Optional: Log received photo on init for debugging
    // console.log('Modal received photo:', this.selectedPhoto);
  }

  /**
   * Lifecycle hook called when the component is destroyed.
   * Ensures any ongoing speech is stopped.
   */
  ngOnDestroy() {
    this.stopSpeaking();
  }

  /**
   * Closes the modal view and stops any ongoing speech.
   */
  closeModal() {
    this.stopSpeaking(); // Stop speech before closing
    this.modalCtrl.dismiss(null, 'cancel'); // Dismiss with 'cancel' role
  }

  /**
   * Presents an action sheet to confirm photo deletion.
   * If confirmed, calls PhotoService to delete the photo and dismisses the modal.
   */
  async deletePhoto() {
    // Stop any ongoing speech before showing action sheet
    await this.stopSpeaking();

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Delete Photo',
      subHeader: 'Are you sure you want to delete this photo?',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await this.photoService.deletePicture(this.selectedPhoto);
              this.modalCtrl.dismiss(this.selectedPhoto, 'delete');
            } catch (error) {
               console.error('Error deleting photo from modal:', error);
               const alert = await this.alertCtrl.create({
                   header: 'Deletion Failed',
                   message: 'Could not delete the photo. Please try again.',
                   buttons: ['OK']
               });
               await alert.present();
            }
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
        }
      ]
    });
    await actionSheet.present();
  }

  /**
   * Handles the 'Narrate' / 'Stop' button click.
   * If speaking, stops speech. Otherwise, initiates AI description generation and speech.
   */
  async handleNarrationClick() {
    if (this.isSpeaking) {
        // If already speaking, stop it
        await this.stopSpeaking();
    } else if (!this.isNarrating) {
        // If not speaking and not already generating, start the process
        await this.playNarration();
    }
    // If isNarrating is true but not speaking, do nothing (wait for generation to finish/fail)
  }


  /**
   * Initiates the process of getting AI description and speaking it.
   * Manages loading state.
   */
  private async playNarration() {
    if (!this.selectedPhoto) {
        console.warn('Play narration called without selected photo.');
        return; // Guard against missing photo data
    }

    this.isNarrating = true; // Set AI generation loading state
    this.generatedDescription = null; // Clear previous description

    const loading = await this.loadingCtrl.create({
      message: 'Generating description...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      console.log('Requesting description for:', this.selectedPhoto.filepath);
      this.generatedDescription = await this.aiService.generatePhotoDescription(this.selectedPhoto);
      console.log("Description received:", this.generatedDescription);

      if (this.generatedDescription) {
        // Call TTS immediately after getting description
        await this.speakText(this.generatedDescription);
      } else {
        // This case should ideally be handled by errors thrown from the service
        throw new Error("No description was generated by the service.");
      }

    } catch (error: any) {
      console.error('Narration process failed:', error);
      // Display a user-friendly error message
      const alert = await this.alertCtrl.create({
        header: 'Narration Error',
        message: error?.message || 'Could not generate description. Please check logs or try again.',
        buttons: ['OK']
      });
      await alert.present();
      // Reset speaking flag if generation fails before speech starts
      this.isSpeaking = false;
    } finally {
      // Ensure loading indicator is always dismissed
      await loading.dismiss();
      this.isNarrating = false; // Reset AI generation loading state
      // NOTE: isSpeaking is now controlled by the TTS start/end/stop events
    }
  }

  /**
   * Speaks the provided text using the appropriate platform's TTS engine.
   * Manages the `isSpeaking` state.
   * @param text The text to be spoken.
   */
  async speakText(text: string) {
    if (!text) {
        console.warn("SpeakText called with empty text.");
        return;
    }

    // Ensure any previous speech attempts are stopped before starting new
    await this.stopSpeaking();
    this.isSpeaking = true; // Set speaking flag immediately

    if (this.platform.is('hybrid')) {
      // --- Native Platform Logic (iOS/Android) ---
      console.log("Using Capacitor TTS Plugin");
      try {
        const options: TTSOptions = {
          text: text,
          lang: 'en-US',      // Target language
          rate: 1.0,          // Speed
          pitch: 1.0,         // Pitch
          volume: 1.0,        // Volume
          category: 'playback',// Audio category (try 'playback' for more control)
        };
        await TextToSpeech.speak(options);
        console.log("Capacitor TTS initiated.");
        // Limitation: Capacitor plugin doesn't provide reliable 'onend' event.
        // We rely on stopSpeaking() or ngOnDestroy to clear isSpeaking flag.
        // For immediate UI feedback, consider the button remains 'Stop' until clicked again or modal closed.

      } catch (ttsError: any) {
        console.error('Capacitor TextToSpeech error:', ttsError);
        // Only reset flag if the error is thrown *during* the speak call initiation
        this.isSpeaking = false;
        const alert = await this.alertCtrl.create({
          header: 'Speech Error',
          message: `Could not speak the description: ${ttsError?.message || 'Unknown native TTS error'}`,
          buttons: ['OK']
        });
        await alert.present();
      }

    } else {
      // --- Web Browser Logic ---
      console.log("Using Web Speech API");
      if ('speechSynthesis' in window) {
        this.webUtterance = new SpeechSynthesisUtterance(text);
        this.webUtterance.lang = 'en-US'; // Set language
        this.webUtterance.rate = 1.0;     // Set speed
        this.webUtterance.pitch = 1.0;    // Set pitch
        this.webUtterance.volume = 1.0;   // Set volume

        // Event handler when speech finishes successfully
        this.webUtterance.onend = () => {
          console.log("Web Speech API finished.");
          this.isSpeaking = false; // Reset flag when done
          this.webUtterance = null; // Clear reference
        };

        // Event handler for errors during speech
        this.webUtterance.onerror = (event) => {
          console.error('Web Speech API error:', event.error);
          this.isSpeaking = false; // Reset flag on error
          this.webUtterance = null; // Clear reference
          // Show alert only if an error occurs during active speech
          this.alertCtrl.create({
              header: 'Speech Error',
              message: `Could not speak the description: ${event.error}`,
              buttons: ['OK']
          }).then(alert => alert.present());
        };

        // Speak the utterance
        window.speechSynthesis.speak(this.webUtterance);

      } else {
        // Web Speech API not supported
        console.warn('Web Speech API (TTS) not supported in this browser.');
        this.isSpeaking = false; // Reset flag as TTS is not available
        const alert = await this.alertCtrl.create({
          header: 'TTS Not Supported',
          message: `Your browser does not support Text-to-Speech.\n\n"${text}"`, // Show text instead
          buttons: ['OK']
        });
        await alert.present();
      }
    }
  }

  /**
   * Stops any currently active Text-to-Speech process.
   */
  async stopSpeaking() {
      if (!this.isSpeaking) {
          // console.log("StopSpeaking called but not currently speaking.");
          return; // Only act if speaking
      }
      console.log("Stopping TTS...");

      if (this.platform.is('hybrid')) {
          // --- Stop Native TTS ---
          try {
              await TextToSpeech.stop();
              console.log("Capacitor TTS stopped via plugin.");
          } catch (stopError) {
              // Log error but proceed to reset flag
              console.error("Error stopping Capacitor TTS:", stopError);
          }
      } else {
          // --- Stop Web TTS ---
          if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
               // Clear reference to utterance to prevent lingering callbacks
              if (this.webUtterance) {
                this.webUtterance.onend = null;
                this.webUtterance.onerror = null;
                this.webUtterance = null;
              }
              window.speechSynthesis.cancel(); // Stops current and removes queued utterances
              console.log("Web Speech API cancelled.");
          }
      }
      // Always reset the flag after attempting to stop
      this.isSpeaking = false;
  }

} // End of ImageDetailModalComponent class