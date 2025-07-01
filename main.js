// Import the Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase configuration
const supabaseUrl = 'https://etddzvxpnwkwguzkkoke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZGR6dnhwbndrd2d1emtrb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDIyMTYsImV4cCI6MjA2Njg3ODIxNn0.eSZkuyRl-DlHJ8qMTcl_R8eh9Ce3CcetZilF9BUVRhY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Google Drive folder IDs for 6 segments
const folderIds = {
  'ca-registration': '1KSIbsfpRnj1y8yt32vC7sTFWA10arFbb',    // Added for CA
  'mobile-registration': '1x7TaP1VMzTdW7F9HHOWRR8iGUR0ZsybF',  // Confirmed
  'camera-registration': '1aSm3l5JJA8oJfV6Q8Bi3UaWBPRbnIURK', // Confirmed
  'story-writing': '13vGQywI8uN2rwlRYRbSXHuoWZ5Ntu4WI',      // Confirmed
  'poster-design': '1ZyMJ7z7ybj_5D9L5DAS3fksPOEV3phDy',        // Confirmed
  'video-content': '1MpPiEx6WaYMtPrwRMp8JblNgA2lB4JHd'         // Confirmed
};

// Global variable for Google API client
let gapi = window.gapi;
let authInstance = null;

function loadGoogleApi() {
  return new Promise((resolve) => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        clientId: '797962726049-parp29f8dgqp8d14lo81cc31ikft8cuv.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      }).then(() => {
        authInstance = gapi.auth2.getAuthInstance();
        resolve();
      }, (error) => {
        console.error('Google API init error:', error);
        alert('Failed to initialize Google API. Check console for details.');
      });
    });
  });
}

async function uploadToGoogleDrive(file, folderId) {
  if (!authInstance) {
    alert('Google API not initialized. Please reload the page and sign in.');
    return null;
  }
  if (!authInstance.isSignedIn.get()) {
    try {
      await authInstance.signIn();
      console.log('Signed in successfully');
    } catch (error) {
      alert('Google Drive authentication failed. Please sign in again or check your internet connection.');
      console.error('Sign-in error:', error);
      return null;
    }
  }

  const metadata = {
    name: `${new Date().toISOString().replace(/[:.]/g, '-')}_${file.name}`,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  try {
    const response = await gapi.client.request({
      path: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      method: 'POST',
      params: { uploadType: 'multipart' },
      body: form,
    });
    console.log('Upload successful:', response.result.id);
    return `https://drive.google.com/uc?id=${response.result.id}`;
  } catch (error) {
    console.error('Upload error:', error);
    alert('File upload failed. Check file size (max 15MB) or try again.');
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadGoogleApi().catch(console.error);

  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        document.getElementById(href.substring(1)).scrollIntoView({ behavior: 'smooth' });
      } else if (href.startsWith('http')) {
        window.location.href = href;
      } else {
        window.location.href = 'https://frameofrevolution.netlify.app' + href; // Updated website
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
          const folderId = folderIds[formId.replace('-registration', '') || formId];
          if (!folderId) {
            alert('No folder ID configured for this form. Contact ulphotoclub2024@gmail.com for support.');
            return;
          }
          const url = await uploadToGoogleDrive(file, folderId);
          if (url) imageUrls.push(url);
        }
      }

      // CA reference check for relevant segments
      const caRef = data['CA Reference'] || 'n/a';
      if (caRef !== 'n/a') {
        const { data: caCodes, error: caError } = await supabase
          .from('ca_reference_codes')
          .select('code')
          .eq('code', caRef);
        if (caError || caCodes.length === 0) {
          alert('Invalid CA Reference. Submission failed.');
          return;
        }
      }

      // Determine table and insert data based on form ID
      let tableName, insertData;
      switch (formId) {
        case 'mobile-registration':
          insertData = {
            name: data['Name'],
            institute: data['Institute'],
            current_class: data['Current Class/Semester'],
            contact_number: data['Contact Number (WhatsApp)'],
            social_link: data['Facebook or Insta Link'],
            mail_address: data['Mail Address'],
            photo_title: data['Photo Title'],
            ca_reference: caRef,
            club_reference: data['Club Reference'],
            volunteer_ref: data['Volunteer Reference'],
            image_urls: imageUrls,
          };
          tableName = 'mobile_photography';
          break;
        case 'camera-registration':
          insertData = {
            name: data['Name'],
            institute: data['Institute'],
            current_class: data['Current Class/Semester'],
            contact_number: data['Contact Number (WhatsApp)'],
            social_link: data['Facebook or Insta Link'],
            mail_address: data['Mail Address'],
            photo_title: data['Photo Title'],
            ca_reference: caRef,
            club_reference: data['Club Reference'],
            volunteer_ref: data['Volunteer Reference'],
            image_urls: imageUrls,
          };
          tableName = 'camera_photography';
          break;
        case 'story-writing':
          insertData = {
            name: data['Name'],
            institute: data['Institute'],
            current_class: data['Current Class/Semester'],
            contact_number: data['Contact Number (WhatsApp)'],
            social_link: data['Facebook or Insta Link'],
            mail_address: data['Mail Address'],
            ca_reference: caRef,
            club_reference: data['Club Reference'],
            volunteer_ref: data['Volunteer Reference'],
          };
          tableName = 'story_writing';
          const { error } = await supabase.from(tableName).insert(insertData);
          if (error) {
            console.error('Error saving to Supabase:', error);
            alert('An error occurred. Please try again.');
            return;
          }
          window.location.href = 'https://chat.whatsapp.com/DahFyu1GBuUHqBPFhvCar4'; // Redirect after save
          return;
        case 'video-content':
          insertData = {
            name: data['Name'],
            institute: data['Institute'],
            current_class: data['Current Class/Semester'],
            contact_number: data['Contact Number (WhatsApp)'],
            social_link: data['Facebook or Insta Link'],
            mail_address: data['Mail Address'],
            google_drive_link: data['Google Drive Link'],
            ca_reference: caRef,
            club_reference: data['Club Reference'],
            volunteer_ref: data['Volunteer Reference'],
          };
          tableName = 'video_content';
          break;
        case 'poster-design':
          insertData = {
            name: data['Name'],
            institute: data['Institute'],
            current_class: data['Current Class/Semester'],
            contact_number: data['Contact Number (WhatsApp)'],
            social_link: data['Facebook or Insta Link'],
            mail_address: data['Mail Address'],
            photo_title: data['Photo Title'],
            ca_reference: caRef,
            club_reference: data['Club Reference'],
            volunteer_ref: data['Volunteer Reference'],
            image_urls: imageUrls,
          };
          tableName = 'poster_design';
          break;
        case 'ca-registration':
          insertData = {
            name: data['Name'],
            institute: data['Institute'],
            current_class: data['Current Class/Semester'],
            contact_number: data['Contact Number (WhatsApp)'],
            social_link: data['Facebook or Insta Link'],
            mail_address: data['Mail Address'],
            past_ca_experience: data['Past CA Experience'],
            elaborate_experience: data['Elaborate Experience'],
            volunteer_ref: data['Volunteer Reference'],
            director_ref: data['Director Reference'],
            photo_url: imageUrls[0] || null, // Single photo
          };
          tableName = 'ca_registration';
          break;
        default:
          alert('Unknown form ID.');
          return;
      }

      const { error } = await supabase.from(tableName).insert(insertData);
      if (error) {
        console.error('Error saving to Supabase:', error);
        alert('An error occurred. Please try again.');
      } else {
        alert('Submission received. Thank you!');
        form.reset();
      }
    });
  });
});