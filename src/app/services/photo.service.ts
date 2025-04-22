// src/app/services/photo.service.ts
import { Injectable } from '@angular/core';
import { Platform, ToastController } from '@ionic/angular'; // Import ToastController
import { Filesystem, Directory, ReadFileResult } from '@capacitor/filesystem'; // Import ReadFileResult
import { Preferences } from '@capacitor/preferences';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

// --- Firebase Imports ---
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore'; // Optional for metadata
import firebase from 'firebase/compat/app'; // For Timestamp type
import { firstValueFrom } from 'rxjs'; // For awaiting currentUser

// --- AiService Import (for deleting descriptions if needed - we removed this from deletePicture previously) ---
// import { AiService } from './ai.service'; // Uncomment if you need AiService here again

// --- Interface ---
export interface UserPhoto {
  filepath: string; // Native URI or filename for web
  webviewPath?: string; // Path used by <img> tag
}

// Optional: Interface for metadata in Firestore
interface UploadedPhotoMetadata {
  userId: string;
  originalFilepath: string; // Store the original local path for reference
  storagePath: string; // Path in Cloud Storage
  // downloadURL?: string; // Optional: URL might not be needed immediately
  uploadedAt: firebase.firestore.FieldValue; // Use server timestamp
}

@Injectable({ providedIn: 'root' })
export class PhotoService {
  public photos: UserPhoto[] = []; // Holds locally managed photos
  private PHOTO_STORAGE: string = 'photos'; // Key for Preferences
  private platform: Platform;
  public uploadProgress: number | null = null; // For progress display (0 to 100)
  public isUploading = false; // Flag to prevent multiple uploads

  constructor(
    platform: Platform,
    private afAuth: AngularFireAuth,         // Inject Firebase Auth
    private afStorage: AngularFireStorage, // Inject Cloud Storage
    private afs: AngularFirestore,         // Inject Firestore (Optional for metadata)
    private toastCtrl: ToastController,      // Inject ToastController for messages
    // private aiService: AiService // Inject if needed again
  ) {
    this.platform = platform;
    // It's generally better to load data within the component (e.g., ngOnInit)
    // this.loadSaved();
  }

  /**
   * Loads saved photos from Preferences (local storage).
   * Should be called by components when needed (e.g., ngOnInit).
   */
  public async loadSaved() {
    console.log("PhotoService: Loading photos from Preferences...");
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];
    console.log(`PhotoService: Loaded ${this.photos.length} photos.`);

    // Generate webview paths for web platform
    if (!this.platform.is('hybrid')) {
      console.log("PhotoService: Generating webview paths for web...");
      for (let photo of this.photos) {
        // Check if webviewPath already exists (e.g., from previous session)
        if (!photo.webviewPath?.startsWith('data:')) { // Re-generate if not a data URL
            try {
                const readFile = await Filesystem.readFile({
                    path: photo.filepath, // filename on web
                    directory: Directory.Data
                });
                photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
            } catch (error) {
                console.error(`Error reading file ${photo.filepath} for webview:`, error);
                // Optionally filter out this photo or mark it as unloadable
                // this.photos = this.photos.filter(p => p.filepath !== photo.filepath);
                photo.webviewPath = undefined; // Mark as unloadable
            }
        }
      }
       console.log("PhotoService: Webview paths generated.");
    }
    // Ensure photos array update triggers change detection if needed elsewhere
    this.photos = [...this.photos];
  }

  /**
   * Adds a new photo taken with the camera to local storage.
   */
  public async addNewToGallery() {
    try {
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90
      });
      const savedImageFile = await this.savePictureLocally(capturedPhoto);
      this.photos.unshift(savedImageFile); // Add to beginning
      await Preferences.set({
        key: this.PHOTO_STORAGE,
        value: JSON.stringify(this.photos), // Save updated array
      });
      console.log('PhotoService: New photo added locally.', savedImageFile.filepath);
    } catch (error) {
      console.error("Error adding photo to gallery:", error);
      this.showToast("Could not add photo.");
    }
  }

  /**
   * Saves a picture file locally to the device's filesystem.
   */
  private async savePictureLocally(photo: Photo): Promise<UserPhoto> {
    const base64Data = await this.readCapturedPhotoAsBase64(photo);
    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data // Use Data directory for persistent private app storage
    });

    if (this.platform.is('hybrid')) {
      // Native platform: Use file URI and Capacitor's conversion for webview
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      // Web platform: Use filename and the blob URL from camera for webview
      return {
        filepath: fileName,
        webviewPath: photo.webPath! // webPath is crucial for web display
      };
    }
  }

  /**
   * Deletes a picture from local storage and filesystem.
   */
  public async deletePicture(photo: UserPhoto) {
    const photoIndex = this.photos.findIndex(p => p.filepath === photo.filepath);
    if (photoIndex === -1) {
      console.warn('PhotoService: deletePicture - Photo not found in array:', photo.filepath);
      return;
    }

    const filepathToDelete = this.photos[photoIndex].filepath;
    this.photos.splice(photoIndex, 1); // Remove from runtime array
    await Preferences.set({ key: this.PHOTO_STORAGE, value: JSON.stringify(this.photos) }); // Update local cache

    try { // Delete local file
      const filename = filepathToDelete.substring(filepathToDelete.lastIndexOf('/') + 1);
      await Filesystem.deleteFile({ path: filename, directory: Directory.Data });
      console.log('PhotoService: Deleted local file:', filename);
    } catch (error) {
      console.error('PhotoService: Error deleting local file:', filepathToDelete, error);
    }

    // Note: As per Suggestion 1, we are NOT deleting the Firestore description here automatically.
    // If you implemented Suggestion 1 fully, you would call:
    // this.aiService.deleteDescription(filepathToDelete).catch(...);
  }


  // --- NEW METHOD: Upload All Local Photos to Firebase Storage ---
  async uploadAllPhotosToFirebase() {
    if (this.isUploading) {
      this.showToast('Upload already in progress.');
      return;
    }
    // Reload local photos first to ensure we have the latest list
    await this.loadSaved();
    if (this.photos.length === 0) {
      this.showToast('No photos in the local gallery to upload.');
      return;
    }

    // Get current user - essential for associating uploads and setting rules
    const user = await firstValueFrom(this.afAuth.authState); // Use firstValueFrom for promise

    if (!user) {
      this.showToast('Please log in (Tab 1) before uploading photos.');
      return;
    }
    const userId = user.uid;
    console.log(`PhotoService: Starting upload for user: ${userId}`);
    this.isUploading = true;
    this.uploadProgress = 0; // Initialize progress

    let successfulUploads = 0;
    const totalPhotos = this.photos.length;
    const timestamp = Date.now(); // Consistent timestamp for this batch

    // Process uploads one by one (sequential)
    for (let i = 0; i < totalPhotos; i++) {
      const photo = this.photos[i];
      // Update overall progress for UI (0 to 100)
      this.uploadProgress = ((i + 1) / totalPhotos) * 100;

      // Create a unique filename for Cloud Storage
      const baseFilename = photo.filepath.substring(photo.filepath.lastIndexOf('/') + 1);
      // Add timestamp and index to ensure uniqueness even if filenames repeat locally over time
      const uniqueFileName = `${timestamp}_${i}_${baseFilename}`;
      const storagePath = `user_photos/${userId}/${uniqueFileName}`; // Define storage path

      console.log(`PhotoService: Uploading photo ${i + 1}/${totalPhotos}: ${storagePath}`);

      try {
        // 1. Get the image data as a Blob
        let imageBlob: Blob;
        if (this.platform.is('hybrid')) {
          // On native, read the file using the correct filepath (which is a URI)
          const fileResult: ReadFileResult = await Filesystem.readFile({ path: photo.filepath }); // NO Directory needed when using full URI path
          // Fetch the base64 data as a Blob
          const fetchResponse = await fetch(`data:image/jpeg;base64,${fileResult.data}`);
          imageBlob = await fetchResponse.blob();
        } else {
          // On web, fetch the photo directly from its webviewPath (blob URL or data URL)
          if (!photo.webviewPath) throw new Error(`WebviewPath missing for ${photo.filepath}`);
          const fetchResponse = await fetch(photo.webviewPath);
          if (!fetchResponse.ok) throw new Error(`Failed to fetch blob for ${photo.webviewPath}`);
          imageBlob = await fetchResponse.blob();
        }

        // 2. Upload Blob to Firebase Storage
        const storageRef = this.afStorage.ref(storagePath);
        const uploadTask: AngularFireUploadTask = storageRef.put(imageBlob, {
           contentType: 'image/jpeg' // Explicitly set content type
        });

        // Optional: Detailed progress logging for individual file
        uploadTask.percentageChanges().subscribe(perc => {
            if (perc) console.log(`  Progress for ${uniqueFileName}: ${perc.toFixed(2)}%`);
        });

        // Wait for the upload task to complete
        const snapshot = await uploadTask;
        console.log(`  Photo ${uniqueFileName} uploaded successfully.`);

        // 3. (Optional) Save Metadata to Firestore
        // Create a document in Firestore to track the uploaded file
         const metadata: UploadedPhotoMetadata = {
           userId: userId,
           originalFilepath: photo.filepath, // Keep track of the local source
           storagePath: snapshot.metadata.fullPath, // Store the actual path in Storage
           uploadedAt: firebase.firestore.FieldValue.serverTimestamp() // Use server time
           // downloadURL: await snapshot.ref.getDownloadURL(), // Get URL if needed later
         };
         const firestoreDocId = this.afs.createId(); // Generate unique ID for Firestore doc
         await this.afs.collection('uploadedPhotosMetadata').doc(firestoreDocId).set(metadata);
         console.log(`  Metadata saved to Firestore (Doc ID: ${firestoreDocId})`);

        successfulUploads++;

      } catch (error) {
        console.error(`Failed to upload photo ${photo.filepath}:`, error);
        this.showToast(`Error uploading ${baseFilename}`);
        // Consider breaking the loop or continuing with next photo
        // break; // Uncomment to stop on first error
      }
    } // End loop

    // Reset state after loop finishes (or breaks)
    this.isUploading = false;
    this.uploadProgress = null;
    this.showToast(`Upload process finished. ${successfulUploads}/${totalPhotos} photos processed.`);
  }


  // --- Helper Methods ---

  /** Helper to show toast messages */
  async showToast(message: string, duration: number = 3000) {
    const toast = await this.toastCtrl.create({ message, duration, position: 'bottom' });
    await toast.present(); // Ensure await here
  }

  /** Reads captured photo (Camera plugin output) as base64 string (no prefix) */
  private async readCapturedPhotoAsBase64(photo: Photo): Promise<string> {
    let base64Data: any;
    if (this.platform.is('hybrid')) {
      // Read file using path provided by Camera plugin
      const file = await Filesystem.readFile({ path: photo.path! });
      base64Data = file.data; // This is already base64
    } else {
      // Fetch blob URL from webPath, convert to base64 Data URL
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      base64Data = await this.convertBlobToBase64DataUrl(blob) as string; // Read as Data URL
    }
    // Remove the Data URL prefix if it exists
    const L_PREFIX = 'base64,';
    const i = base64Data.indexOf(L_PREFIX);
    return i === -1 ? base64Data : base64Data.substring(i + L_PREFIX.length);
  }

  /** Helper to convert Blob to base64 Data URL */
  private convertBlobToBase64DataUrl = (blob: Blob): Promise<string | null> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => { resolve(reader.result as string | null); };
    reader.readAsDataURL(blob);
  });

} // End PhotoService class