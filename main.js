import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase configuration
const supabaseUrl = 'https://etddzvxpnwkwguzkkoke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZGR6dnhwbndrd2d1emtrb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDIyMTYsImV4cCI6MjA2Njg3ODIxNn0.eSZkuyRl-DlHJ8qMTcl_R8eh9Ce3CcetZilF9BUVRhY';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
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
        window.location.href = 'https://frameofrevolution.netlify.app' + href;
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
      let imageUrls = [];

      // Validate link for segments that require it
      if (['ca-registration', 'mobile-registration', 'camera-registration', 'poster-design', 'video-content', 'club-collaboration'].includes(formId)) {
        const link = data['Link'] || data['Google Drive Link'] || data['Logo Links'];
        if (link) {
          // Split comma-separated links for club-collaboration (allowing multiple logo URLs)
          const links = formId === 'club-collaboration' ? link.split(',').map(l => l.trim()) : [link];
          for (const l of links) {
            if (!l.match(/^https:\/\/(drive\.google\.com\/(file\/d\/|open\?id=)|mega\.nz\/|workupload\.com\/)/)) {
              alert('Please provide valid Google Drive, Mega, or Workupload link(s).');
              return;
            }
            imageUrls.push(l);
          }
          // Ensure club-collaboration has up to 2 links
          if (formId === 'club-collaboration' && imageUrls.length > 2) {
            alert('Please provide at most two logo links (with and without background).');
            return;
          }
        } else if (formId !== 'video-content') { // video-content already requires link
          alert('A valid link is required.');
          return;
        }
      } else if (formId === 'story-writing' && data['Link']) {
        // Optional link for story-writing
        if (!data['Link'].match(/^https:\/\/(drive\.google\.com\/(file\/d\/|open\?id=)|mega\.nz\/|workupload\.com\/)/)) {
          alert('Please provide a valid Google Drive, Mega, or Workupload link.');
          return;
        }
        imageUrls.push(data['Link']);
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

      // Determine table and insert data based on formId
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
            image_urls: imageUrls.length > 0 ? imageUrls : null,
          };
          tableName = 'story_writing';
          const { error: storyError } = await supabase.from(tableName).insert(insertData);
          if (storyError) {
            console.error('Error saving to Supabase:', storyError);
            alert('An error occurred. Please try again.');
            return;
          }
          window.location.href = 'https://chat.whatsapp.com/DahFyu1GBuUHqBPFhvCar4';
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
            photo_url: imageUrls[0] || null,
          };
          tableName = 'ca_registration';
          break;
        case 'club-collaboration':
          insertData = {
            name: data['Name'],
            contact_number: data['Contact Number (WhatsApp)'],
            institute: data['Institute'],
            club_name: data['Club Name'],
            club_email: data['Club Email'],
            current_post: data['Current Post'],
            ca_reference: caRef,
            volunteer_ref: data['Volunteer Reference'],
            director_ref: data['Director Reference'],
            logo_urls: imageUrls.length > 0 ? imageUrls : null,
          };
          tableName = 'club_collaboration';
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