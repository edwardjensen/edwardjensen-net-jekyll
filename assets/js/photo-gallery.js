// Photo Gallery Modal Component
window.photoGallery = function() {
  return {
    photos: [],
    currentIndex: 0,
    
    photoModal: {
      isOpen: false,
      image: '',
      alt: '',
      caption: '',
      link: '',
      date: '',
      captionVisible: true,
    },

    init() {
      
      // Collect all photos from the hidden data container
      const allPhotosContainer = document.getElementById('photo-gallery-all-photos');
      if (allPhotosContainer) {
        const allPhotoButtons = allPhotosContainer.querySelectorAll('.gallery-photo-data');
        allPhotoButtons.forEach((button) => {
          this.photos.push({
            image: button.dataset.image,
            alt: button.dataset.alt,
            caption: button.dataset.caption,
            link: button.dataset.link,
            date: button.dataset.date,
          });
        });
      } else {
        // Fallback: collect from visible grid buttons (for backwards compatibility)
        const buttons = this.$el.querySelectorAll('figure button');
        buttons.forEach((button) => {
          this.photos.push({
            image: button.dataset.image,
            alt: button.dataset.alt,
            caption: button.dataset.caption,
            link: button.dataset.link,
            date: button.dataset.date,
          });
        });
      }
      
      // Store reference to this component globally so modal can access it
      window.photoGalleryInstance = this;
      
      // Initialize the modal HTML in the root element
      this.initializeModalHTML();
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },

    initializeModalHTML() {
      const modalRoot = document.getElementById('photo-modal-root');
      if (!modalRoot || modalRoot.querySelector('template')) return; // Already initialized
      
      const template = document.createElement('template');
      template.innerHTML = `
        <div x-show="window.photoGalleryInstance?.photoModal.isOpen" 
             class="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
             @click.self="window.photoGalleryInstance?.close()"
             @keydown.escape="window.photoGalleryInstance?.close()"
             style="display: none;">
          <div class="relative flex flex-col bg-black rounded-lg overflow-hidden" id="modal-container" style="max-width: 90vw; max-height: 90vh;">
            <button @click="window.photoGalleryInstance?.close()"
                    class="absolute top-4 right-4 z-50 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
                    aria-label="Close modal">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
              <!-- Image container -->
              <div class="flex-1 flex items-center justify-center overflow-auto relative md:flex-1">
                <img id="modal-image" src="" alt="" class="w-full h-full object-contain cursor-pointer hidden md:block" @click="window.photoGalleryInstance?.toggleCaption()" onload="window.photoGalleryInstance?.resizeModal()">
                <img id="modal-image-mobile" src="" alt="" class="w-full h-auto object-contain md:hidden" onload="window.photoGalleryInstance?.resizeModal()">
                
                <!-- Caption overlay - lower center (desktop only) -->
                <div class="absolute bottom-0 left-0 right-0 z-30 flex justify-center pb-6 px-4 hidden md:flex" id="modal-caption-container">
                  <div class="bg-black/85 rounded-lg px-6 py-4 max-w-4xl text-center">
                    <p class="text-sm text-slate-100 whitespace-normal break-words" id="modal-caption"></p>
                    <p class="text-xs text-slate-400 mt-2" id="modal-date"></p>
                  </div>
                </div>
                
                <!-- Left navigation button (desktop only) -->
                <button @click="window.photoGalleryInstance?.previous()"
                        id="modal-prev"
                        class="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-white/10 hover:bg-white/30 disabled:opacity-20 disabled:hover:bg-white/10 text-white rounded-full p-3 transition-all hidden md:block"
                        aria-label="Previous photo">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <!-- Right navigation button (desktop only) -->
                <button @click="window.photoGalleryInstance?.next()"
                        id="modal-next"
                        class="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/10 hover:bg-white/30 disabled:opacity-20 disabled:hover:bg-white/10 text-white rounded-full p-3 transition-all hidden md:block"
                        aria-label="Next photo">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <!-- Mobile caption section -->
              <div class="md:hidden bg-black/80 border-t border-slate-700 p-4">
                <p class="text-sm text-slate-100 whitespace-normal break-words" id="modal-caption-mobile"></p>
                <p class="text-xs text-slate-400 mt-2" id="modal-date-mobile"></p>
              </div>
            </div>

            <div class="p-4 border-t border-slate-700 bg-black/80 hidden md:block">
              <p class="text-xs text-slate-400">
                <a id="modal-link" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="text-amber-400 hover:text-amber-300 underline">
                  View on micro.edwardjensen.net
                </a>
              </p>
            </div>

            <!-- Mobile footer section -->
            <div class="md:hidden p-4 border-t border-slate-700 bg-black/80 flex flex-col gap-2">
              <p class="text-xs text-slate-400">
                <a id="modal-link-mobile" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="text-amber-400 hover:text-amber-300 underline">
                  View on micro.edwardjensen.net
                </a>
              </p>
              <!-- Mobile navigation -->
              <div class="flex gap-2 justify-between">
                <button @click="window.photoGalleryInstance?.previous()"
                        id="modal-prev-mobile"
                        class="flex-1 bg-white/10 hover:bg-white/30 disabled:opacity-20 disabled:hover:bg-white/10 text-white rounded p-2 transition-all text-sm font-medium"
                        aria-label="Previous photo">
                  ← Previous
                </button>
                <button @click="window.photoGalleryInstance?.next()"
                        id="modal-next-mobile"
                        class="flex-1 bg-white/10 hover:bg-white/30 disabled:opacity-20 disabled:hover:bg-white/10 text-white rounded p-2 transition-all text-sm font-medium"
                        aria-label="Next photo">
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      modalRoot.appendChild(template.content.cloneNode(true));
    },

    openPhoto(buttonElement) {
      const image = buttonElement.dataset.image;
      const alt = buttonElement.dataset.alt;
      const caption = buttonElement.dataset.caption;
      const link = buttonElement.dataset.link;
      const date = buttonElement.dataset.date;
      
      
      this.photoModal.isOpen = true;
      this.photoModal.image = image;
      this.photoModal.alt = alt;
      this.photoModal.caption = caption;
      this.photoModal.link = link;
      this.photoModal.date = date;
      
      // Find current photo index
      this.currentIndex = this.photos.findIndex(p => p.image === image);
      
      
      // Update modal UI
      this.updateModalUI();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    },

    updateModalUI() {
      const img = document.getElementById('modal-image');
      const imgMobile = document.getElementById('modal-image-mobile');
      const caption = document.getElementById('modal-caption');
      const captionMobile = document.getElementById('modal-caption-mobile');
      const dateEl = document.getElementById('modal-date');
      const dateMobile = document.getElementById('modal-date-mobile');
      const link = document.getElementById('modal-link');
      const linkMobile = document.getElementById('modal-link-mobile');
      const modalDiv = document.querySelector('[x-show*="photoGalleryInstance"]');
      
      
      // Update desktop image
      if (img) {
        img.src = this.photoModal.image;
        img.alt = this.photoModal.alt;
      }
      
      // Update mobile image
      if (imgMobile) {
        imgMobile.src = this.photoModal.image;
        imgMobile.alt = this.photoModal.alt;
      }
      
      // Update desktop caption
      if (caption) caption.textContent = this.photoModal.caption;
      if (dateEl) dateEl.textContent = this.formatDate(this.photoModal.date);
      
      // Update mobile caption
      if (captionMobile) captionMobile.textContent = this.photoModal.caption;
      if (dateMobile) dateMobile.textContent = this.formatDate(this.photoModal.date);
      
      
      // Update links
      if (link) link.href = this.photoModal.link;
      if (linkMobile) linkMobile.href = this.photoModal.link;
      
      if (modalDiv) modalDiv.style.display = this.photoModal.isOpen ? '' : 'none';
      
      // Update button states (desktop)
      const prevBtn = document.getElementById('modal-prev');
      const nextBtn = document.getElementById('modal-next');
      if (prevBtn) prevBtn.disabled = !this.hasPrevious();
      if (nextBtn) nextBtn.disabled = !this.hasNext();
      
      // Update button states (mobile)
      const prevBtnMobile = document.getElementById('modal-prev-mobile');
      const nextBtnMobile = document.getElementById('modal-next-mobile');
      if (prevBtnMobile) prevBtnMobile.disabled = !this.hasPrevious();
      if (nextBtnMobile) nextBtnMobile.disabled = !this.hasNext();
      
      
      // Update caption visibility (desktop only)
      this.updateCaptionVisibility();
    },

    close() {
      this.photoModal.isOpen = false;
      document.body.style.overflow = '';
      this.updateModalUI();
    },

    toggleCaption() {
      this.photoModal.captionVisible = !this.photoModal.captionVisible;
      this.updateCaptionVisibility();
    },

    updateCaptionVisibility() {
      const captionContainer = document.getElementById('modal-caption-container');
      if (captionContainer) {
        captionContainer.style.opacity = this.photoModal.captionVisible ? '1' : '0';
        captionContainer.style.transition = 'opacity 0.3s ease';
        captionContainer.style.pointerEvents = this.photoModal.captionVisible ? 'auto' : 'none';
      }
    },

    resizeModal() {
      const container = document.getElementById('modal-container');
      if (!container) return;
      
      const isMobile = window.innerWidth < 768; // md breakpoint is 768px
      
      // On mobile, don't set explicit sizing - let CSS handle it
      if (isMobile) {
        container.style.width = '';
        container.style.height = '';
        return;
      }
      
      // Desktop: calculate sizing based on image aspect ratio
      const img = document.getElementById('modal-image');
      if (!img || !img.naturalWidth) return;
      
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.9;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      container.style.width = width + 'px';
      container.style.height = height + 'px';
    },

    next() {
      if (this.hasNext()) {
        this.currentIndex++;
        const photo = this.photos[this.currentIndex];
        this.photoModal.image = photo.image;
        this.photoModal.alt = photo.alt;
        this.photoModal.caption = photo.caption;
        this.photoModal.link = photo.link;
        this.photoModal.date = photo.date;
        this.photoModal.captionVisible = true;
        this.updateModalUI();
      }
    },

    previous() {
      if (this.hasPrevious()) {
        this.currentIndex--;
        const photo = this.photos[this.currentIndex];
        this.photoModal.image = photo.image;
        this.photoModal.alt = photo.alt;
        this.photoModal.caption = photo.caption;
        this.photoModal.link = photo.link;
        this.photoModal.date = photo.date;
        this.photoModal.captionVisible = true;
        this.updateModalUI();
      }
    },

    hasNext() {
      return this.currentIndex < this.photos.length - 1;
    },

    hasPrevious() {
      return this.currentIndex > 0;
    },
  };
};

