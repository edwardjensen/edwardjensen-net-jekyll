// Photo Gallery Modal Component with URL Routing
// Uses Alpine.js for reactivity and History API for URL management
// Supports two modes:
// 1. Full mode (photography index): JSON data store with URL routing
// 2. Simple mode (homepage): Data attributes on buttons for lightbox only
window.photoGallery = function() {
  return {
    // Data store
    photos: [],
    currentIndex: -1,
    galleryUrl: '/photos/',
    galleryTitle: 'Photography',
    googleMapsApiKey: null,

    // Mode detection
    isFullMode: false, // true if JSON data store exists (photography index page)

    // Modal state
    photoModal: {
      isOpen: false,
      photo: null,
      // Legacy fields for simple mode
      image: '',
      alt: '',
      caption: '',
      date: '',
      captionVisible: true,
    },

    // Initialization
    init() {
      // Check if we're in full mode (JSON data store exists)
      const dataEl = document.getElementById('photo-gallery-data');
      this.isFullMode = !!dataEl;

      if (this.isFullMode) {
        this.loadPhotoData();
        this.setupHistoryListener();
      } else {
        // Simple mode: collect photos from data attributes
        this.loadPhotosFromDataAttributes();
      }

      this.initializeModalHTML();

      // Store reference globally for modal access
      window.photoGalleryInstance = this;

      // Check if we should open a photo based on initial URL (full mode only)
      if (this.isFullMode) {
        this.checkInitialUrl();
      }
    },

    // Load photo data from embedded JSON (full mode)
    loadPhotoData() {
      const dataEl = document.getElementById('photo-gallery-data');
      if (!dataEl) return;

      try {
        const data = JSON.parse(dataEl.textContent);
        this.photos = data.photos || [];
        this.galleryUrl = data.galleryUrl || '/photos/';
        this.galleryTitle = data.galleryTitle || 'Photography';
        this.googleMapsApiKey = data.googleMapsApiKey;
      } catch (e) {
        console.error('Failed to parse photo gallery data:', e);
      }
    },

    // Load photos from data attributes (simple mode - homepage)
    loadPhotosFromDataAttributes() {
      // First check for hidden data container
      const allPhotosContainer = document.getElementById('photo-gallery-all-photos');
      if (allPhotosContainer) {
        const buttons = allPhotosContainer.querySelectorAll('.gallery-photo-data');
        buttons.forEach((button) => {
          this.photos.push({
            image: button.dataset.image,
            imageAlt: button.dataset.alt,
            title: button.dataset.caption,
            date: button.dataset.date,
          });
        });
      } else {
        // Fallback: collect from visible buttons
        const buttons = this.$el.querySelectorAll('figure button[data-image]');
        buttons.forEach((button) => {
          this.photos.push({
            image: button.dataset.image,
            imageAlt: button.dataset.alt,
            title: button.dataset.caption,
            date: button.dataset.date,
          });
        });
      }
    },

    // Check if we should open a photo based on initial URL (full mode only)
    checkInitialUrl() {
      const currentPath = window.location.pathname;
      const normalizedGalleryUrl = this.galleryUrl.replace(/\/$/, '');

      // If we're not on the gallery root (and not on a pagination page), try to open the photo
      if (currentPath !== this.galleryUrl &&
          currentPath !== normalizedGalleryUrl &&
          !currentPath.includes('/page/')) {

        const photo = this.findPhotoByUrl(currentPath);
        if (photo) {
          // Small delay to ensure DOM is ready
          setTimeout(() => this.openPhotoFull(photo, false), 100);
        }
      }
    },

    // Format date string for display
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    },

    // Setup popstate listener for back/forward navigation (full mode only)
    setupHistoryListener() {
      window.addEventListener('popstate', (event) => {
        if (event.state && event.state.photoUrl) {
          // Navigate to photo
          const photo = this.findPhotoByUrl(event.state.photoUrl);
          if (photo) {
            this.openPhotoFull(photo, false);
          }
        } else {
          // Close modal (returned to gallery)
          this.closeModal(false);
        }
      });
    },

    // Find photo by URL
    findPhotoByUrl(url) {
      const normalizedUrl = url.replace(/\/$/, '');
      return this.photos.find(p => p.url.replace(/\/$/, '') === normalizedUrl);
    },

    // Find photo index
    findPhotoIndex(photo) {
      return this.photos.findIndex(p => p.url === photo.url);
    },

    // Open photo from grid click (by URL) - full mode
    openPhotoByUrl(url) {
      const photo = this.findPhotoByUrl(url);
      if (photo) {
        this.openPhotoFull(photo, true);
      }
    },

    // Open photo from button click (by element) - simple mode (homepage)
    openPhoto(buttonElement) {
      const image = buttonElement.dataset.image;
      const alt = buttonElement.dataset.alt;
      const caption = buttonElement.dataset.caption;
      const date = buttonElement.dataset.date;

      // Find current photo index
      this.currentIndex = this.photos.findIndex(p => p.image === image);

      // Create a photo object for the modal
      const photo = {
        image: image,
        imageAlt: alt,
        title: caption,
        date: date,
        dateFormatted: this.formatDate(date),
      };

      // Open in simple mode (no URL routing)
      this.openPhotoSimple(photo);
    },

    // Open photo in simple mode (no URL routing) - for homepage
    openPhotoSimple(photo) {
      this.photoModal.photo = photo;
      this.photoModal.isOpen = true;

      // Update modal UI
      this.updateModalUI();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    },

    // Open photo in full mode (with URL routing) - for photography index
    openPhotoFull(photo, pushState = true) {
      this.photoModal.photo = photo;
      this.photoModal.isOpen = true;
      this.currentIndex = this.findPhotoIndex(photo);

      // Update URL
      if (pushState) {
        history.pushState(
          { photoUrl: photo.url, fromGallery: true },
          photo.title,
          photo.url
        );
      }

      // Update page title
      document.title = `${photo.title} - ${this.galleryTitle} - Edward Jensen`;

      // Update modal UI
      this.updateModalUI();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    },

    // Close modal
    closeModal(pushState = true) {
      if (!this.photoModal.isOpen) return;

      this.photoModal.isOpen = false;
      this.photoModal.photo = null;
      this.currentIndex = -1;

      // Update URL back to gallery (full mode only)
      if (this.isFullMode && pushState) {
        history.pushState(
          { fromGallery: false },
          this.galleryTitle,
          this.galleryUrl
        );
        // Update page title
        document.title = `${this.galleryTitle} - Edward Jensen`;
      }

      // Hide modal
      const modalDiv = document.getElementById('photo-modal-overlay');
      if (modalDiv) {
        modalDiv.style.display = 'none';
      }

      // Restore body scroll
      document.body.style.overflow = '';
    },

    // Navigate to next photo
    next() {
      if (this.hasNext()) {
        this.currentIndex++;
        const nextPhoto = this.photos[this.currentIndex];
        if (this.isFullMode) {
          this.openPhotoFull(nextPhoto, true);
        } else {
          this.openPhotoSimple(nextPhoto);
        }
      }
    },

    // Navigate to previous photo
    previous() {
      if (this.hasPrevious()) {
        this.currentIndex--;
        const prevPhoto = this.photos[this.currentIndex];
        if (this.isFullMode) {
          this.openPhotoFull(prevPhoto, true);
        } else {
          this.openPhotoSimple(prevPhoto);
        }
      }
    },

    hasNext() {
      return this.currentIndex < this.photos.length - 1;
    },

    hasPrevious() {
      return this.currentIndex > 0;
    },

    // Check if photo has EXIF data
    hasExifData(photo) {
      if (!photo || !photo.exif) return false;
      const e = photo.exif;
      return e.camera || e.lens || e.focalLength || e.aperture || e.shutterSpeed || e.iso;
    },

    // Check if photo has location data
    hasLocationData(photo) {
      if (!photo || !photo.location) return false;
      return photo.location.lat && photo.location.lng && this.googleMapsApiKey;
    },

    // Generate Google Maps embed URL
    getMapEmbedUrl(photo) {
      if (!this.hasLocationData(photo)) return null;
      const loc = photo.location;
      return `https://www.google.com/maps/embed/v1/view?key=${this.googleMapsApiKey}&center=${loc.lat},${loc.lng}&zoom=15&maptype=roadmap`;
    },

    // Initialize modal HTML in DOM
    initializeModalHTML() {
      const modalRoot = document.getElementById('photo-modal-root');
      if (!modalRoot) return;

      // Clear existing content
      modalRoot.innerHTML = `
        <div id="photo-modal-overlay"
             class="fixed inset-0 bg-black/95 z-[9999] overflow-y-auto"
             style="display: none;"
             @keydown.escape.window="if (window.photoGalleryInstance?.photoModal.isOpen) window.photoGalleryInstance.closeModal(true)"
             @keydown.left.window="if (window.photoGalleryInstance?.photoModal.isOpen) window.photoGalleryInstance.previous()"
             @keydown.right.window="if (window.photoGalleryInstance?.photoModal.isOpen) window.photoGalleryInstance.next()">

          <!-- Close button (fixed position) -->
          <button onclick="window.photoGalleryInstance?.closeModal(true)"
                  class="fixed top-4 right-4 z-[10000] bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors"
                  aria-label="Close and return to gallery">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Modal content container - side by side on desktop -->
          <div class="min-h-screen flex items-start justify-center py-8 px-4">
            <div class="w-full max-w-7xl flex flex-col lg:flex-row gap-8">

              <!-- Image (left side on desktop) -->
              <div class="lg:flex-1 lg:sticky lg:top-8 lg:self-start">
                <img id="modal-photo-image"
                     src=""
                     alt=""
                     class="w-full h-auto max-h-[50vh] lg:max-h-[85vh] object-contain rounded-lg">
              </div>

              <!-- Content area (right side on desktop) -->
              <div class="lg:w-96 lg:flex-shrink-0 bg-slate-900/50 rounded-lg p-6 lg:p-8 lg:max-h-[85vh] lg:overflow-y-auto">
                <!-- Header -->
                <header class="mb-6">
                  <h1 id="modal-photo-title" class="font-header font-bold text-xl lg:text-2xl text-white mb-3"></h1>
                  <time id="modal-photo-date" class="text-slate-400 text-sm block mb-3"></time>
                  <div id="modal-photo-tags" class="flex flex-wrap gap-2"></div>
                </header>

                <!-- Description (if any) -->
                <div id="modal-photo-content" class="text-slate-300 text-sm mb-6" style="display: none;"></div>

                <!-- EXIF Metadata -->
                <aside id="modal-exif-section" class="bg-slate-800/50 rounded-lg p-4 mb-6" style="display: none;">
                  <h2 class="text-xs font-semibold text-white uppercase tracking-wide mb-3">
                    <i class="bi bi-camera me-2"></i>Camera Details
                  </h2>
                  <dl id="modal-exif-grid" class="grid grid-cols-2 gap-3 text-xs"></dl>
                </aside>

                <!-- Location Map -->
                <aside id="modal-location-section" class="bg-slate-800/50 rounded-lg p-4 mb-6" style="display: none;">
                  <h2 class="text-xs font-semibold text-white uppercase tracking-wide mb-3">
                    <i class="bi bi-geo-alt me-2"></i>Location
                  </h2>
                  <p id="modal-location-name" class="text-slate-300 text-sm mb-3" style="display: none;"></p>
                  <div class="aspect-video w-full rounded-lg overflow-hidden">
                    <iframe id="modal-location-map"
                            src=""
                            width="100%"
                            height="100%"
                            style="border:0;"
                            allowfullscreen=""
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade">
                    </iframe>
                  </div>
                </aside>

                <!-- Navigation -->
                <nav class="flex justify-between items-center pt-4 border-t border-slate-700">
                  <button id="modal-prev-btn"
                          onclick="window.photoGalleryInstance?.previous()"
                          class="flex items-center gap-1 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                          aria-label="Previous photo">
                    <i class="bi bi-arrow-left"></i>
                    <span class="hidden sm:inline">Prev</span>
                  </button>

                  <a id="modal-back-link"
                     href="/photos/"
                     class="text-amber-400 hover:text-amber-300 text-xs"
                     title="Back to gallery">
                    <i class="bi bi-grid me-1"></i>
                    Gallery
                  </a>

                  <button id="modal-next-btn"
                          onclick="window.photoGalleryInstance?.next()"
                          class="flex items-center gap-1 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                          aria-label="Next photo">
                    <span class="hidden sm:inline">Next</span>
                    <i class="bi bi-arrow-right"></i>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // Update modal UI with current photo data
    updateModalUI() {
      const photo = this.photoModal.photo;
      if (!photo) return;

      const overlay = document.getElementById('photo-modal-overlay');
      const image = document.getElementById('modal-photo-image');
      const title = document.getElementById('modal-photo-title');
      const date = document.getElementById('modal-photo-date');
      const tags = document.getElementById('modal-photo-tags');
      const content = document.getElementById('modal-photo-content');
      const exifSection = document.getElementById('modal-exif-section');
      const exifGrid = document.getElementById('modal-exif-grid');
      const locationSection = document.getElementById('modal-location-section');
      const locationName = document.getElementById('modal-location-name');
      const locationMap = document.getElementById('modal-location-map');
      const prevBtn = document.getElementById('modal-prev-btn');
      const nextBtn = document.getElementById('modal-next-btn');
      const backLink = document.getElementById('modal-back-link');

      // Show overlay
      if (overlay) overlay.style.display = '';

      // Update image
      if (image) {
        image.src = photo.image;
        image.alt = photo.imageAlt;
      }

      // Update title
      if (title) title.textContent = photo.title;

      // Update date
      if (date) {
        date.textContent = photo.dateFormatted || this.formatDate(photo.date);
        if (photo.date) date.setAttribute('datetime', photo.date);
      }

      // Update tags
      if (tags) {
        if (photo.tags && photo.tags.length > 0) {
          tags.innerHTML = photo.tags.map(tag =>
            `<span class="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-md text-xs font-medium border border-amber-400/30">#${tag}</span>`
          ).join('');
        } else {
          tags.innerHTML = '';
        }
      }

      // Update content
      if (content) {
        const stripped = (photo.content || '').trim();
        if (stripped) {
          content.textContent = stripped;
          content.style.display = '';
        } else {
          content.style.display = 'none';
        }
      }

      // Update EXIF section
      if (exifSection && exifGrid) {
        if (this.hasExifData(photo)) {
          const e = photo.exif;
          let exifHtml = '';

          if (e.camera) exifHtml += `<div><dt class="text-slate-500">Camera</dt><dd class="text-slate-300">${e.camera}</dd></div>`;
          if (e.lens) exifHtml += `<div><dt class="text-slate-500">Lens</dt><dd class="text-slate-300">${e.lens}</dd></div>`;
          if (e.focalLength) exifHtml += `<div><dt class="text-slate-500">Focal Length</dt><dd class="text-slate-300">${e.focalLength}</dd></div>`;
          if (e.aperture) exifHtml += `<div><dt class="text-slate-500">Aperture</dt><dd class="text-slate-300">${e.aperture}</dd></div>`;
          if (e.shutterSpeed) exifHtml += `<div><dt class="text-slate-500">Shutter Speed</dt><dd class="text-slate-300">${e.shutterSpeed}</dd></div>`;
          if (e.iso) exifHtml += `<div><dt class="text-slate-500">ISO</dt><dd class="text-slate-300">${e.iso}</dd></div>`;

          exifGrid.innerHTML = exifHtml;
          exifSection.style.display = '';
        } else {
          exifSection.style.display = 'none';
        }
      }

      // Update location section
      if (locationSection && locationMap) {
        if (this.hasLocationData(photo)) {
          if (locationName) {
            locationName.textContent = photo.location.name || '';
            locationName.style.display = photo.location.name ? '' : 'none';
          }
          locationMap.src = this.getMapEmbedUrl(photo);
          locationSection.style.display = '';
        } else {
          locationSection.style.display = 'none';
        }
      }

      // Update navigation buttons
      if (prevBtn) prevBtn.disabled = !this.hasPrevious();
      if (nextBtn) nextBtn.disabled = !this.hasNext();

      // Update back link
      if (backLink) backLink.href = this.galleryUrl;

      // Scroll to top of modal
      overlay?.scrollTo(0, 0);
    }
  };
};
