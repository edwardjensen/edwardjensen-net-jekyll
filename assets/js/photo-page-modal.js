// Photo Page Modal Loader
// Transforms single photo page into gallery + modal for seamless experience.
// Fetches the gallery page, replaces content, and opens the photo in modal.
// Falls back gracefully to static HTML if gallery fetch fails.
(function() {
  'use strict';

  // Only run on single photo pages
  const container = document.getElementById('single-photo-container');
  if (!container) return;

  const photoUrl = container.dataset.photoUrl;
  const galleryUrl = container.dataset.galleryUrl;

  if (!photoUrl || !galleryUrl) {
    console.log('Photo page modal: missing data attributes');
    return;
  }

  // Fetch the gallery page
  fetch(galleryUrl)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch gallery');
      return response.text();
    })
    .then(html => {
      // Parse the gallery HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Get the main content and photo data
      const galleryMain = doc.getElementById('main-content');
      const photoDataScript = doc.getElementById('photo-gallery-data');

      if (!galleryMain || !photoDataScript) {
        console.log('Gallery elements not found, using fallback view');
        return;
      }

      // Replace current main content with gallery content
      const currentMain = document.getElementById('main-content');
      if (currentMain) {
        currentMain.innerHTML = galleryMain.innerHTML;

        // Remove any existing photo-gallery-data script to prevent duplicate IDs
        const existingScript = document.getElementById('photo-gallery-data');
        if (existingScript) {
          existingScript.remove();
        }

        // Add the photo data script to the page
        const newScript = document.createElement('script');
        newScript.id = 'photo-gallery-data';
        newScript.type = 'application/json';
        newScript.textContent = photoDataScript.textContent;
        currentMain.insertBefore(newScript, currentMain.firstChild);

        // Initialize Alpine.js on the new content
        const galleryContainer = currentMain.querySelector('[x-data="photoGallery()"]');
        if (galleryContainer && window.Alpine) {
          // Initialize the Alpine component
          Alpine.initTree(galleryContainer);

          // Wait for Alpine to initialize, then open the photo
          setTimeout(() => {
            if (window.photoGalleryInstance) {
              // Replace state instead of push since we're already on this URL
              const photo = window.photoGalleryInstance.findPhotoByUrl(photoUrl);
              if (photo) {
                window.photoGalleryInstance.openPhotoFull(photo, false);
              }
            }
          }, 150);
        }
      }
    })
    .catch(err => {
      console.log('Failed to load gallery, using fallback view:', err.message);
      // Fallback view is already rendered, so we're fine
    });
})();
