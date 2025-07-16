import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase configuration
const supabaseUrl = 'https://etddzvxpnwkwguzkkoke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZGR6dnhwbndrd2d1emtrb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDIyMTYsImV4cCI6MjA2Njg3ODIxNn0.eSZkuyRl-DlHJ8qMTcl_R8eh9Ce3CcetZilF9BUVRhY';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {

  // Form submission handling
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    // Create and insert the message element right after the form
    const messageBox = document.createElement('p');
    messageBox.className = 'form-message';
    form.parentNode.insertBefore(messageBox, form.nextSibling);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      const buttonText = submitButton.innerHTML;
      
      // --- Start Loading State ---
      submitButton.disabled = true;
      submitButton.innerHTML = '<div class="spinner"></div>';
      messageBox.style.display = 'none'; // Hide previous messages

      const formId = form.id;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      let imageUrls = [];

      // --- Helper function to show messages ---
      const showMessage = (message, type) => {
        messageBox.textContent = message;
        messageBox.className = `form-message ${type}`;
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = buttonText;
      };

      // Validate phone number (must start with '01' and be 11 digits)
      const contactNumber = data['Contact Number (WhatsApp)'];
      if (!contactNumber.match(/^01\d{9}$/)) {
        showMessage('Contact Number must start with "01" and be exactly 11 digits.', 'error');
        return;
      }

      // Validate social media link
      if (['mobile-registration', 'camera-registration', 'story-writing', 'video-content', 'poster-design', 'ca-registration'].includes(formId)) {
        const socialLink = data['Facebook or Insta Link'];
        if (!socialLink || !/facebook|instagram/i.test(socialLink)) {
          showMessage('Social media link must be a valid Facebook or Instagram profile URL.', 'error');
          return;
        }
      }
      
      // ... (rest of your existing validation and data collection logic)
      if (['ca-registration', 'mobile-registration', 'camera-registration', 'poster-design', 'video-content', 'club-collaboration'].includes(formId)) {
        const link = data['Link'] || data['Google Drive Link'] || data['Logo Links'];
        if (link) {
          imageUrls = formId === 'club-collaboration' ? link.split(',').map(l => l.trim()) : [link];
          if (formId === 'club-collaboration' && imageUrls.length > 2) {
            showMessage('Please provide at most two logo links.', 'error');
            return;
          }
        }
      } else if (formId === 'story-writing' && data['Link']) {
        imageUrls.push(data['Link']);
      }

      const caRef = data['CA Reference'] || 'n/a';
      const clubRef = data['Club Reference'] || 'n/a';

      let isCaValid = caRef === 'n/a';
      if (caRef !== 'n/a') {
        const { data: caCodes, error: caError } = await supabase.from('ca_reference_codes').select('code').eq('code', caRef);
        isCaValid = !caError && caCodes.length > 0;
      }

      let isClubValid = clubRef === 'n/a';
      if (clubRef !== 'n/a') {
        const { data: clubCodes, error: clubError } = await supabase.from('club_reference_codes').select('code').eq('code', clubRef);
        isClubValid = !clubError && clubCodes.length > 0;
      }

      if (!isCaValid || !isClubValid) {
        showMessage('Invalid CA or Club Reference Code. Please check and try again.', 'error');
        return;
      }
      
      // --- Determine table and insert data (your existing switch case) ---
      let tableName, insertData;
      switch (formId) {
        case 'mobile-registration':
          insertData = { name: data['Name'], institute: data['Institute'], current_class: data['Current Class/Semester'], contact_number: data['Contact Number (WhatsApp)'], social_link: data['Facebook or Insta Link'], mail_address: data['Mail Address'], photo_title: data['Photo Title'], ca_reference: caRef, club_reference: clubRef, volunteer_ref: data['Volunteer Reference'], image_urls: imageUrls };
          tableName = 'mobile_photography';
          break;
        case 'camera-registration':
          insertData = { name: data['Name'], institute: data['Institute'], current_class: data['Current Class/Semester'], contact_number: data['Contact Number (WhatsApp)'], social_link: data['Facebook or Insta Link'], mail_address: data['Mail Address'], photo_title: data['Photo Title'], ca_reference: caRef, club_reference: clubRef, volunteer_ref: data['Volunteer Reference'], image_urls: imageUrls };
          tableName = 'camera_photography';
          break;
        case 'story-writing':
          insertData = { name: data['Name'], institute: data['Institute'], current_class: data['Current Class/Semester'], contact_number: data['Contact Number (WhatsApp)'], social_link: data['Facebook or Insta Link'], mail_address: data['Mail Address'], ca_reference: caRef, club_reference: clubRef, volunteer_ref: data['Volunteer Reference'], image_urls: imageUrls.length > 0 ? imageUrls : null };
          tableName = 'story_writing';
          const { error: storyError } = await supabase.from(tableName).insert(insertData);
          if (storyError) {
            console.error('Error saving to Supabase:', storyError);
            showMessage('An error occurred. Please try again.', 'error');
            return;
          }
          showMessage('Registration Successful! Redirecting you to the WhatsApp group...', 'success');
          setTimeout(() => {
            window.location.href = 'https://chat.whatsapp.com/DahFyu1GBuUHqBPFhvCar4';
          }, 2000);
          return;
        case 'video-content':
          insertData = { name: data['Name'], institute: data['Institute'], current_class: data['Current Class/Semester'], contact_number: data['Contact Number (WhatsApp)'], social_link: data['Facebook or Insta Link'], mail_address: data['Mail Address'], google_drive_link: data['Google Drive Link'], ca_reference: caRef, club_reference: clubRef, volunteer_ref: data['Volunteer Reference'] };
          tableName = 'video_content';
          break;
        case 'poster-design':
          insertData = { name: data['Name'], institute: data['Institute'], current_class: data['Current Class/Semester'], contact_number: data['Contact Number (WhatsApp)'], social_link: data['Facebook or Insta Link'], mail_address: data['Mail Address'], photo_title: data['Photo Title'], ca_reference: caRef, club_reference: clubRef, volunteer_ref: data['Volunteer Reference'], image_urls: imageUrls };
          tableName = 'poster_design';
          break;
        case 'ca-registration':
          insertData = { name: data['Name'], institute: data['Institute'], current_class: data['Current Class/Semester'], contact_number: data['Contact Number (WhatsApp)'], social_link: data['Facebook or Insta Link'], mail_address: data['Mail Address'], past_ca_experience: data['Past CA Experience'], elaborate_experience: data['Elaborate Experience'], volunteer_ref: data['Volunteer Reference'], director_ref: data['Director Reference'], photo_url: imageUrls[0] || null };
          tableName = 'ca_registration';
          break;
        case 'club-collaboration':
          insertData = { name: data['Name'], contact_number: data['Contact Number (WhatsApp)'], institute: data['Institute'], club_name: data['Club Name'], club_email: data['Club Email'], current_post: data['Current Post'], ca_reference: caRef, volunteer_ref: data['Volunteer Reference'], director_ref: data['Director Reference'], logo_urls: imageUrls.length > 0 ? imageUrls : null };
          tableName = 'club_collaboration';
          break;
        default:
          showMessage('Unknown form error.', 'error');
          return;
      }

      // --- Final Insert and Response ---
      const { error } = await supabase.from(tableName).insert(insertData);
      if (error) {
        console.error('Error saving to Supabase:', error);
        showMessage(`Submission failed: ${error.message}`, 'error');
      } else {
        showMessage('Submission successful. Thank you!', 'success');
        form.reset();
      }
    });
  });
});