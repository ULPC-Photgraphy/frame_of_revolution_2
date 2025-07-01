// Import the Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase configuration
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-anon-key'; // Replace with your actual anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Google Drive folder IDs for 6 segments
const folderIds = {
  'ca-registration': '1KSIbsfpRnj1y8yt32vC7sTFWA10arFbb',
  'mobile-registration': '1x7TaP1VMzTdW7F9HHOWRR8iGUR0ZsybF',
  'camera-registration': '1aSm3l5JJA8oJfV6Q8Bi3UaWBPRbnIURK',
  'story-writing': '13vGQywI8uN2rwlRYRbSXHuoWZ5Ntu4WI',
  'poster-design': '1ZyMJ7z7ybj_5D9L5DAS3fksPOEV3phDy',
  'video-content': '1MpPiEx6WaYMtPrwRMp8JblNgA2lB4JHd'
};

// Function to upload file to Google Drive (simplified placeholder)
async function uploadToGoogleDrive(file, folderId) {
  // Placeholder: Actual Google Drive API integration required
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
          if (!folderId) {
            alert('No folder ID configured for this form.');
            return;
          }
          const url = await uploadToGoogleDrive(file, folderId);
          imageUrls.push(url);
        }
        data.imageUrls = imageUrls;
      }

      const { error } = await supabase
        .from('submissions')
        .insert({
          type: formId.replace('-registration', '') || formId, // Map form ID to submission type
          created_at: new Date().toISOString(),
          name: data['Name'],
          institute: data['Institute'],
          current_class: data['Current Class/Semester'],
          contact_number: data['Contact Number (WhatsApp)'],
          social_link: data['Facebook or Insta Link'],
          mail_address: data['Mail Address'],
          photo_title: data['Photo Title'],
          ca_reference: data['CA Reference'],
          club_reference: data['Club Reference'],
          volunteer_ref: data['Volunteer Reference'],
          image_urls: imageUrls.length ? imageUrls : null
        });

      if (error) {
        console.error('Error saving to Supabase:', error);
        alert('An error occurred. Please try again.');
      } else {
        alert('Submission received. We will contact you later.');
        form.reset();
      }
    });
  });
});