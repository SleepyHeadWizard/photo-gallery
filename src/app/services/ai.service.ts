// src/app/services/ai.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse
import { Platform } from '@ionic/angular';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

// Import the UserPhoto interface (make sure it's exported from photo.service.ts)
import { UserPhoto } from './photo.service';

@Injectable({
  providedIn: 'root'
})
export class AiService {

  constructor(
    private http: HttpClient,
    private platform: Platform
  ) { }

  /**
   * Reads the photo file from local filesystem and returns its base64 representation.
   * Handles both native platforms and web/PWA.
   * @param photo The photo object containing the filepath.
   * @returns A Promise resolving to the pure base64 string (without data URI prefix).
   */
  private async readPhotoAsBase64(photo: UserPhoto): Promise<string> {
    let base64Data: any; // We will ensure this always gets a string if successful

    // Read the file based on the platform
    if (this.platform.is('hybrid')) {
      // Read the file directly from the Filesystem for native platforms
      const file = await Filesystem.readFile({
        path: photo.filepath, // On native, filepath is the URI from Directory.Data
        directory: Directory.Data
      });
      base64Data = file.data; // data is already base64 string
    } else {
      // Fetch the photo via its webPath, read as a blob, then convert to base64 format for web/PWA
      if (!photo.webviewPath) {
        throw new Error('Webview path is missing for web platform');
      }
      const response = await fetch(photo.webviewPath);
      if (!response.ok) {
         throw new Error(`Failed to fetch webview image: ${response.statusText}`);
      }
      const blob = await response.blob();

      // Call the helper, now typed correctly
      const dataUrlResult = await this.convertBlobToBase64DataUrl(blob);

      // Check if the result is a valid string (it should be if onload succeeded)
      if (typeof dataUrlResult !== 'string') {
        throw new Error('Failed to convert blob to base64 data URL string.');
      }
      base64Data = dataUrlResult; // Assign the string result
    }

    // Remove the data URI prefix (e.g., "data:image/jpeg;base64,")
    // Ensure base64Data is treated as a string here
    const L_PREFIX = 'base64,';
    const i = base64Data.indexOf(L_PREFIX);
    if (i === -1) {
      console.warn('Base64 prefix not found, assuming pure base64 data.');
      return base64Data;
    }
    return base64Data.substring(i + L_PREFIX.length);
  }

  /**
   * Helper to convert a Blob to a base64 Data URL string.
   * FileReader.result is string | null | ArrayBuffer. readAsDataURL yields string | null.
   */
  private convertBlobToBase64DataUrl = (blob: Blob): Promise<string | null> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Handle potential errors during file reading
    reader.onerror = (error) => {
        console.error('FileReader Error:', error);
        reject(new Error('Failed to read blob using FileReader.'));
    };
    // Handle successful reading
    reader.onload = () => {
      // result should be a string (Data URL) or potentially null
      resolve(reader.result as string | null);
    };
    // Read the blob as Data URL
    reader.readAsDataURL(blob);
  });

  /**
   * Generates a description for the given photo using Google Gemini API.
   * @param photo The UserPhoto object.
   * @returns Promise<string> The generated description text.
   * @throws Error if API key is missing or API call fails.
   */
  public async generatePhotoDescription(photo: UserPhoto): Promise<string> {
    if (!environment.geminiApiKey) {
      console.error('API Key for Gemini is missing in environment variables.');
      throw new Error('API Key for Gemini is not configured.');
    }

    console.log('AI Service: Reading image file for Gemini...');
    // 1. Read image as base64 using the local helper method
    const pureBase64 = await this.readPhotoAsBase64(photo);

    console.log('AI Service: Calling Gemini API...');
    // 2. Construct the API request payload for Gemini Vision

    // --- !!! UPDATED MODEL NAME !!! ---
    // Using the Generative Language API endpoint with a current vision model
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${environment.geminiApiKey}`;
    // --- !!! END OF UPDATE !!! ---


    const requestBody = {
      contents: [{
        parts: [
          // The prompt for the AI
          { text: "Describe this image concisely for accessibility. Focus on the main subject, setting, and any significant actions or objects." },
          // The image data
          {
            inline_data: {
              // Assuming JPEG format based on previous code. Change if needed.
              mime_type: "image/jpeg",
              data: pureBase64
            }
          }
        ]
      }],
      // Optional: Add generation config or safety settings here if needed
      // generationConfig: { ... },
      // safetySettings: [ ... ]
    };

    // 3. Make the API Call using Angular's HttpClient
    try {
        const response = await this.http.post<any>(API_ENDPOINT, requestBody).pipe(
            map(res => {
              console.log('AI Service: Raw Gemini Response:', res);
              // Extract the text. Structure depends on the Gemini API version.
              // Carefully check the actual JSON response in your browser's network tools.
              if (res && res.candidates && res.candidates[0]?.content?.parts[0]?.text) {
                // Successfully extracted text
                return res.candidates[0].content.parts[0].text;
              } else if (res?.promptFeedback?.blockReason) {
                // Handle cases where content is blocked by safety filters
                console.error('Gemini request blocked:', res.promptFeedback.blockReason);
                throw new Error(`Content blocked by API: ${res.promptFeedback.blockReason}`);
              } else if (res && res.candidates && res.candidates[0]?.finishReason && res.candidates[0].finishReason !== 'STOP') {
                 // Handle other finish reasons like MAX_TOKENS, SAFETY, etc.
                 console.error('Gemini generation stopped for reason:', res.candidates[0].finishReason);
                 throw new Error(`Generation stopped: ${res.candidates[0].finishReason}`);
              }
              else {
                // Unexpected structure or missing data
                console.error("AI Service: Unexpected Gemini response structure or missing text:", res);
                throw new Error('Could not parse description from Gemini response.');
              }
            })
        ).toPromise(); // Convert Observable to Promise

        // Ensure response is not undefined before returning
        if (response === undefined) {
             throw new Error('Received undefined response after processing.');
        }
        return response;

    } catch (error: any) {
        console.error('AI Service: Error during Gemini API call or processing:', error);
        // Log the detailed error object from HttpErrorResponse if available
        if (error instanceof HttpErrorResponse && error.error) {
           console.error('Gemini Error Details:', JSON.stringify(error.error, null, 2));
        }
        // Construct a meaningful error message
        const message = error?.error?.message || error?.message || 'Failed to generate description.';
        throw new Error(`AI Service failed: ${message}`);
    }
  } // End of generatePhotoDescription

} // End of AiService class