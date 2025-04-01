# Trinetra 👁️

**Trinetra** is an Ionic Angular mobile application designed to enhance photo gallery accessibility for visually impaired users. Inspired by Lord Shiva's third eye, which represents higher perception, Trinetra aims to provide users with the ability to "see" images through AI-powered narration.

## Introduction

*   **Name:** Trinetra (Sanskrit: त्रि नेत्र - "Three Eyes")
*   **Origin:** Derived from "Tri" (three) and "Netra" (eye), referencing Lord Shiva's third eye symbolizing insight and awareness beyond ordinary sight.
*   **Goal:** To create an accessible photo gallery experience where visually impaired users can understand their photos independently through automated descriptions and voice narration.

## Problem Statement

Visually impaired users face significant challenges interacting with standard photo galleries. They often cannot perceive the visual content and rely on others for descriptions, lacking independence and the ability to fully engage with their photos. Many apps also lack robust voice-based navigation and audio support needed for true accessibility.

## Solution: Trinetra's Approach

Trinetra addresses these challenges by integrating:

1.  **Core Photo Gallery Features:** Standard functionalities like capturing, uploading, viewing, and managing photos.
2.  **AI-Powered Descriptions:** Utilizes the Google Gemini API to automatically generate rich textual descriptions of images.
3.  **Photo Narration:** Implements Text-to-Speech (TTS) functionality to read the AI-generated descriptions aloud, triggered by a simple user action (e.g., a play button).

## Key Features

*   **Photo Gallery:**
    *   Capture photos using the device camera (via Capacitor).
    *   Upload photos from the device library.
    *   View photos in a grid layout (Tab 2).
    *   View individual photos in a full-screen modal view by tapping thumbnails.
    *   Delete photos from the gallery and device storage (local implementation currently).
*   **Accessibility Core:**
    *   Basic screen reader compatibility (VoiceOver, TalkBack).
    *   *Planned:* Options for font size and contrast customization.
*   **AI Narration (Planned - Part 3):**
    *   Integration with Google Gemini API for image analysis and description generation.
    *   Text-to-Speech playback of descriptions for visually impaired users.
    *   Loading indicators during AI processing.

*(Note: The Photo Collage Creator feature (Part 2 of the original plan) is currently excluded from the scope).*

## Screenshots (Coming Soon)

*(Add screenshots of the app here once the UI is more developed)*

## Technology Stack

*   **Framework:** [Ionic](https://ionicframework.com/) (v7/v8) with [Angular](https://angular.io/) (v16/v17+)
*   **UI Components:** Ionic UI Components
*   **Native Access:** [Capacitor](https://capacitorjs.com/)
    *   Camera
    *   Filesystem
    *   Preferences (for local storage - *to be replaced*)
    *   *Planned:* Text-to-Speech Plugin
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Planned Backend:**
    *   **Database:** [Cloud Firestore (Firebase)](https://firebase.google.com/products/firestore)
    *   **Storage:** [Cloud Storage for Firebase](https://firebase.google.com/products/storage)
*   **Planned AI:** [Google Gemini API](https://ai.google.dev/)

## Project Status

🚧 **Under Development** 🚧

The project is currently implementing the core gallery features (Part 1) and the modal view. Firebase integration and AI features (Part 3) are planned next steps.

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/SleepyHeadWizard/photo-gallery.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd photo-gallery
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Run the app in the browser:**
    ```bash
    ionic serve
    ```
5.  **Build for Native Platforms (iOS/Android):**
    *   Ensure you have the native development environments set up (Xcode, Android Studio).
    *   Add the desired platform:
        ```bash
        ionic capacitor add ios
        ionic capacitor add android
        ```
    *   Sync project changes:
        bash
        npx cap sync
        
    *   Open the native project:
        ```bash
        npx cap open ios
        npx cap open android
        ```
    *   Run from the native IDE.

*Note: Future steps will require setting up a Firebase project and adding configuration details.*

## Basic Usage (Current State)

*   Navigate to the "Photos" tab (Tab 2) to see the image gallery.
*   Click the Camera Floating Action Button (FAB) at the bottom to add a new photo using the device camera.
*   Click on any photo thumbnail in the grid to open it in a larger modal view.
*   In the modal view, use the "Delete" button (trash icon) to remove the photo (confirmation required). Use the "Close" button (X icon) to dismiss the modal.
*   Tab 1 and Tab 3 are currently placeholders and their functionality will be defined based on the project roadmap (e.g., Dedicated Add Photo, Settings/Accessibility).

## Project Roadmap

*   **Phase 1: Base App Setup (Part 1 - In Progress)**
    *   [x] Basic Photo Gallery (Capture, View Grid)
    *   [x] View Image in Modal
    *   [x] Delete Photos (Local Storage)
    *   [ ] Define and Implement Tab 1 (e.g., Add Photo) & Tab 3 (e.g., Settings)
    *   [ ] Implement basic accessibility settings (Font size, Contrast)

*   **Phase 2: AI Photo Description (Part 3)**
    *   [ ] Integrate Google Gemini API.
    *   [ ] Implement logic to send image data and receive text descriptions.
    *   [ ] Implement Text-to-Speech functionality for narration.
    *   [ ] Add "Play Narration" button and loading states to the image modal.
    *   [ ] Thorough accessibility testing for the narration feature.

## Contributing

Contributions, issues, and feature requests are welcome. Please open an issue to discuss any significant changes before submitting a pull request.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

*   Developed by: Shiwaditya Chandra Mukesh 
*   Inspiration: Providing accessible technology solutions.
