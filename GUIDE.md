# Epmate: Developer Guide

Welcome to the Epmate developer guide. This document provides all the necessary information to get the mobile application and the admin dashboard up and running.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
3.  [Configuration and API Keys](#configuration-and-api-keys)
    *   [Firebase Setup](#firebase-setup)
    *   [Google Maps Setup](#google-maps-setup)
    *   [Flutterwave Setup](#flutterwave-setup)
4.  [Running the Application](#running-the-application)
    *   [Epmate Mobile App](#epmate-mobile-app)
    *   [Admin Dashboard](#admin-dashboard)
5.  [Third-Party Service Pricing](#third-party-service-pricing)
    *   [Firebase](#firebase)
    *   [Google Maps Platform](#google-maps-platform)
    *   [Flutterwave](#flutterwave)

---

## 1. Project Overview

The Epmate project consists of two main parts:

*   **Epmate Mobile App**: A React Native application for both Android and iOS. This is the main app for users and helpers.
*   **Admin Dashboard**: A React web application for administrators to manage the platform.

The tech stack includes:

*   **Mobile**: React Native, React Navigation, React Native Paper, Redux Toolkit
*   **Web**: React
*   **Backend**: Firebase (Authentication, Firestore, Storage)

---

## 2. Getting Started

### Prerequisites

*   Node.js and npm
*   React Native development environment (see the [official documentation](https://reactnative.dev/docs/environment-setup))
*   Android Studio or Xcode for running the mobile app on an emulator/simulator

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies for the mobile app:**
    ```bash
    cd Epmate
    npm install
    ```

3.  **Install dependencies for the admin dashboard:**
    ```bash
    cd ../admin-dashboard
    npm install
    ```

---

## 3. Configuration and API Keys

To run the application, you will need to set up a few third-party services and obtain API keys.

### Firebase Setup

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.

2.  **Set up the Android App**:
    *   In your Firebase project, add a new Android app.
    *   The package name is `com.epmate`.
    *   Download the `google-services.json` file.
    *   Place this file in the `Epmate/android/app` directory, replacing the placeholder file.

3.  **Set up the Web App**:
    *   In your Firebase project, add a new Web app.
    *   You will be given a `firebaseConfig` object.
    *   Copy these values into the `admin-dashboard/src/services/firebase.js` file, replacing the placeholder values.

4.  **Enable Firebase Services**:
    *   In the Firebase Console, go to the **Authentication** section and enable the **Email/Password** and **Google** sign-in methods.
    *   Go to the **Firestore Database** section and create a new database. Start in **test mode** for now.

### Google Maps Setup

1.  **Create a Google Cloud Project**: Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.

2.  **Enable the Maps SDK**:
    *   In the APIs & Services dashboard, click **Enable APIs and Services**.
    *   Search for and enable the **Maps SDK for Android**.

3.  **Get an API Key**:
    *   Go to the **Credentials** page and create a new API key.
    *   **Important**: Restrict this key to be used only with your Android app's package name (`com.epmate`) and SHA-1 certificate fingerprint.
    *   This key will need to be added to the `Epmate/android/app/src/main/AndroidManifest.xml` file.

### Flutterwave Setup

1.  **Create an Account**: Sign up for an account on the [Flutterwave Dashboard](https://dashboard.flutterwave.com/).
2.  **Get API Keys**: Your API keys (public and secret) will be available in the **API** section of your dashboard. These will be needed for payment integration later.

---

## 4. Running the Application

### Epmate Mobile App

1.  Navigate to the `Epmate` directory.
2.  Make sure you have an Android emulator running or a device connected.
3.  Run the app:
    ```bash
    npx react-native run-android
    ```

### Admin Dashboard

1.  Navigate to the `admin-dashboard` directory.
2.  Start the development server:
    ```bash
    npm start
    ```
3.  The dashboard will be available at `http://localhost:3000`.

---

## 5. Third-Party Service Pricing

*   **Firebase**: The **Spark Plan** (free tier) is very generous and should be sufficient for the MVP. It includes monthly quotas for Firestore (e.g., 50k reads/day), Authentication, and Storage (5GB). For more details, see the [Firebase Pricing Page](https://firebase.google.com/pricing).

*   **Google Maps Platform**: There is a free tier that includes a recurring $200 monthly credit. This is generally enough for development and early-stage applications. For detailed pricing, see the [Google Maps Platform Pricing Page](https://cloud.google.com/maps-platform/pricing).

*   **Flutterwave**: Pricing is on a per-transaction basis and varies by country and payment method. Please refer to the [official Flutterwave Pricing Page](https://flutterwave.com/us/pricing) for the most accurate and up-to-date information.
