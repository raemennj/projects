let currentPage = 0;
const totalPages = 2; // Total number of pages

const container = document.getElementById('container');
const pages = document.querySelectorAll('.page');

// Swipe Gesture Handling
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50; // Minimum swipe distance in pixels

document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleGesture();
}, { passive: true });

function handleGesture() {
  const swipeDistance = touchEndX - touchStartX;
  if (swipeDistance < -swipeThreshold) {
    // Swiped left
    if (currentPage < totalPages - 1) {
      currentPage++;
      updatePage();
    }
  } else if (swipeDistance > swipeThreshold) {
    // Swiped right
    if (currentPage > 0) {
      currentPage--;
      updatePage();
    }
  }
}

function updatePage() {
  container.style.transform = `translateX(-${currentPage * 100}%)`;
  updateActivePage();
}

function updateActivePage() {
  pages.forEach((page, index) => {
    page.classList.toggle('active', index === currentPage);
  });
}

// Keyboard Navigation (Optional)
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    if (currentPage > 0) {
      currentPage--;
      updatePage();
    }
  } else if (e.key === 'ArrowRight') {
    if (currentPage < totalPages - 1) {
      currentPage++;
      updatePage();
    }
  }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker Registered', reg))
      .catch(err => console.error('Service Worker Registration Failed', err));
  });
}
