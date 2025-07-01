// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDcCW3QkNHSfOsmFe_jUBrDKdYGWiv8_M",
  authDomain: "frameofrevolutionbangladesh2.firebaseapp.com",
  projectId: "frameofrevolutionbangladesh2",
  storageBucket: "frameofrevolutionbangladesh2.firebasestorage.app",
  messagingSenderId: "103773409483",
  appId: "1:103773409483:web:ff2f9802614840dd3b0b4e",
  measurementId: "G-GV4Q4NFF4Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Google Drive folder IDs
const folderIds = {
  'ca-registration': '1KSIbsfpRnj1y8yt32vC7sTFWA10arFbb',
  'mobile-registration': '1x7TaP1VMzTdW7F9HHOWRR8iGUR0ZsybF',
  'camera-registration': '1aSm3l5JJA8oJfV6Q8Bi3UaWBPRbnIURK'
};

// Function to upload file to Google Drive (simplified placeholder)
async function uploadToGoogleDrive(file, folderId) {
  // This is a placeholder. Actual implementation requires Google Drive API integration.
  // For now, we'll simulate by returning a mock URL.
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${timestamp}_${file.name}`;
  const mockUrl = `https://drive.google.com/uc?id=${folderId}&name=${fileName}`;
  return mockUrl;
}

// Handle form submissions
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        document.getElementById(href.substring(1)).scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = href;
      }
    });
  });

  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formId = form.id;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const files = form.querySelector('input[type="file"]')?.files || [];

      let imageUrls = [];
      if (files.length > 0) {
        for (const file of files) {
          if (file.size > 15 * 1024 * 1024) {
            alert('File size exceeds 15MB limit.');
            return;
          }
          const folderId = folderIds[formId];
          const url = await uploadToGoogleDrive(file, folderId);
          imageUrls.push(url);
        }
        data.imageUrls = imageUrls;
      }

      const dbRef = ref(database, `${formId}/${Date.now()}`);
      set(dbRef, data)
        .then(() => {
          alert('Submission received. We will contact you later.');
          form.reset();
        })
        .catch((error) => {
          console.error('Error saving to Firebase:', error);
          alert('An error occurred. Please try again.');
        });
    });
  });
});