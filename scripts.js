const windows = [...document.querySelectorAll(".window")];
const openTriggers = [...document.querySelectorAll("[data-open]")];
const closeButtons = [...document.querySelectorAll("[data-close]")];
const minimizeButtons = [...document.querySelectorAll("[data-minimize]")];
const maximizeButtons = [...document.querySelectorAll("[data-maximize]")];
const taskbarWindows = document.getElementById("taskbar-windows");
const clock = document.getElementById("clock");
const desktopArea = document.querySelector(".desktop-area");

let topZ = 30;
let dragState = null;
let resizeState = null;

// ==========================================
// THEME TOGGLE & START MENU LOGIC
// ==========================================
const themeToggleBtn = document.getElementById("theme-toggle");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
  });
}

const startButton = document.getElementById("start-button");
const startMenu = document.getElementById("start-menu");
const showDesktopBtn = document.getElementById("start-menu-show-desktop");
const startToggleThemeBtn = document.getElementById("start-menu-toggle-theme");

function toggleStartMenu() {
  if (!startMenu) return;
  const isOpening = startMenu.classList.contains("is-hidden");
  startMenu.classList.toggle("is-hidden");
  if (startButton) {
    startButton.setAttribute("aria-expanded", isOpening ? "true" : "false");
  }
}

function closeStartMenu() {
  if (startMenu && !startMenu.classList.contains("is-hidden")) {
    startMenu.classList.add("is-hidden");
    if (startButton) startButton.setAttribute("aria-expanded", "false");
  }
}

if (startButton) {
  startButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleStartMenu();
  });
}

if (startToggleThemeBtn) {
  startToggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    closeStartMenu();
  });
}

let allWindowsMinimized = false;
let savedWindowState = [];

if (showDesktopBtn) {
  showDesktopBtn.addEventListener("click", () => {
    const openWins = getOpenWindows();
    if (!allWindowsMinimized && openWins.some(w => !w.classList.contains("is-minimized"))) {
      savedWindowState = openWins.map(w => ({ el: w, minimized: w.classList.contains("is-minimized") }));
      openWins.forEach(w => minimizeWindow(w));
      allWindowsMinimized = true;
    } else {
      savedWindowState.forEach(item => {
        if (!item.minimized) {
          item.el.classList.remove("is-minimized");
          item.el.classList.add("is-open");
        }
      });
      allWindowsMinimized = false;
      const topWin = openWins[openWins.length - 1];
      if (topWin) bringToFront(topWin);
    }
    closeStartMenu();
  });
}

// Close start menu when clicking outside
document.addEventListener("click", (e) => {
  if (startMenu && !startMenu.classList.contains("is-hidden")) {
    if (!startMenu.contains(e.target) && e.target !== startButton && !startButton.contains(e.target)) {
      closeStartMenu();
    }
  }
});

// Escape key listener for Start Menu and Lightbox
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeStartMenu();
    const lbModal = document.getElementById("lightbox-modal");
    if (lbModal && !lbModal.classList.contains("is-hidden")) {
      lbModal.classList.add("is-hidden");
      const lbImg = document.getElementById("lightbox-img");
      if (lbImg) setTimeout(() => { lbImg.src = ''; }, 300);
    }
  }
});

function isMobileLayout() { return window.innerWidth <= 768; }

function getOpenWindows() {
  return windows.filter((windowEl) => !windowEl.classList.contains("is-hidden"));
}

function getVisibleWindows() {
  return windows.filter((windowEl) => 
    !windowEl.classList.contains("is-hidden") && !windowEl.classList.contains("is-minimized")
  );
}

function bringToFront(windowEl) {
  if (!windowEl) return;
  topZ += 1;
  windowEl.style.zIndex = String(topZ);
  setActiveWindow(windowEl.id);
  syncTaskbar();
}

function setActiveWindow(targetId) {
  windows.forEach((windowEl) => {
    const isActive = windowEl.id === targetId && !windowEl.classList.contains("is-minimized");
    windowEl.classList.toggle("is-active", isActive);
  });
}

function openWindow(targetId, autoMaximize = false) {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.classList.remove("is-hidden", "is-minimized");
  target.classList.add("is-open");
  
  if (autoMaximize) {
    maximizeWindow(target);
  } else {
    bringToFront(target);
  }
}

function closeWindow(windowEl) {
  windowEl.classList.add("is-hidden");
  windowEl.classList.remove("is-open", "is-active", "is-minimized", "is-maximized");
  syncTaskbar();

  // Stop music if the music player window is closed
  if (windowEl.id === "music-player-window") {
    const audio = document.getElementById("mp-audio");
    const playBtn = document.getElementById("mp-play");
    const visualizer = document.getElementById("mp-visualizer");
    
    if (audio && !audio.paused) {
      audio.pause();
      if (playBtn) playBtn.textContent = "▶";
      if (visualizer) visualizer.classList.remove("is-playing");
    }
  }
}

function minimizeWindow(windowEl) {
  windowEl.classList.add("is-minimized");
  windowEl.classList.remove("is-active", "is-open"); // Removes is-open to trigger shrinking
  syncTaskbar();
}

function maximizeWindow(windowEl) {
  if (windowEl.classList.contains("is-maximized")) {
    windowEl.classList.remove("is-maximized");
    windowEl.style.left = "";
    windowEl.style.top = "";
    windowEl.style.width = "";
    windowEl.style.height = "";
    windowEl.style.setProperty('--left', '20%'); 
  } else {
    windowEl.classList.add("is-maximized");
  }
  bringToFront(windowEl);
}

function syncTaskbar() {
  taskbarWindows.innerHTML = "";
  getOpenWindows().sort((a, b) => Number(a.style.zIndex || 0) - Number(b.style.zIndex || 0))
    .forEach((windowEl) => {
      const tab = document.createElement("button");
      tab.className = `taskbar__tab`; // Removed the old generic CSS icon classes
      
      if (windowEl.classList.contains("is-active")) tab.classList.add("is-active");
      if (windowEl.classList.contains("is-minimized")) tab.classList.add("is-minimized");

      // MAGIC: Grab the exact icon (SVG image or Emoji span) from the window's title bar
      const titleIcon = windowEl.querySelector('.window__title').firstElementChild.cloneNode(true);
      titleIcon.className = "taskbar__tab-icon"; // Give it a unified class for sizing

      // Create the text label
      const label = document.createElement("span");
      label.className = "taskbar__tab-label";
      label.textContent = windowEl.dataset.title;

      // Add the real icon and the text into the taskbar tab
      tab.appendChild(titleIcon);
      tab.appendChild(label);

      tab.onclick = () => {
        if (windowEl.classList.contains("is-minimized")) {
          windowEl.classList.remove("is-minimized");
          windowEl.classList.add("is-open");
          bringToFront(windowEl);
        } else if (windowEl.classList.contains("is-active")) {
          minimizeWindow(windowEl);
        } else {
          bringToFront(windowEl);
        }
      };
      taskbarWindows.appendChild(tab);
    });
}

function updateClock() {
  clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function startDrag(e, el) {
  if (isMobileLayout() || el.classList.contains("is-maximized")) return;
  const rect = el.getBoundingClientRect();
  dragState = { el, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
  
  el.classList.add("no-transition"); // Disable transitions during drag to prevent lag
  
  bringToFront(el);
}

// Event Initialization for Windows
windows.forEach(w => {
  w.onmousedown = () => bringToFront(w);
  const tb = w.querySelector(".window__titlebar");
  tb.onmousedown = (e) => !e.target.closest(".window__control") && startDrag(e, w);
  tb.ondblclick = (e) => !e.target.closest(".window__control") && maximizeWindow(w);

  // Inject resize handles dynamically
  const resizerR = document.createElement("div");
  resizerR.className = "resizer resizer-r";
  const resizerB = document.createElement("div");
  resizerB.className = "resizer resizer-b";
  const resizerBR = document.createElement("div");
  resizerBR.className = "resizer resizer-br";

  w.append(resizerR, resizerB, resizerBR);
});

// Initialize resize on mousedown
document.addEventListener("mousedown", (e) => {
  if (e.target.classList.contains("resizer")) {
    e.preventDefault();
    const windowEl = e.target.closest(".window");
    bringToFront(windowEl);
    
    resizeState = {
      el: windowEl,
      type: e.target.className,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: windowEl.offsetWidth,
      startHeight: windowEl.offsetHeight
    };
    
    windowEl.classList.add("no-transition"); // Disable transitions during resize
    document.body.classList.add("is-resizing"); 
  }
});

// Handle both dragging and resizing
document.addEventListener("mousemove", (e) => {
  if (dragState) {
    const frame = desktopArea.getBoundingClientRect();
    let left = Math.max(0, Math.min(e.clientX - frame.left - dragState.offsetX, frame.width - dragState.el.offsetWidth));
    let top = Math.max(0, Math.min(e.clientY - frame.top - dragState.offsetY, frame.height - dragState.el.offsetHeight));
    dragState.el.style.left = `${left}px`;
    dragState.el.style.top = `${top}px`;
  } else if (resizeState) {
    const { el, type, startX, startY, startWidth, startHeight } = resizeState;

    if (type.includes("resizer-r") || type.includes("resizer-br")) {
      let newWidth = startWidth + (e.clientX - startX);
      el.style.width = `${Math.max(250, newWidth)}px`; 
    }

    if (type.includes("resizer-b") || type.includes("resizer-br")) {
      let newHeight = startHeight + (e.clientY - startY);
      el.style.height = `${Math.max(180, newHeight)}px`; 
    }
  }
});

// Clear states on mouse up
document.addEventListener("mouseup", () => {
  // Re-enable smooth transitions when dragging/resizing finishes
  if (dragState) dragState.el.classList.remove("no-transition");     
  if (resizeState) resizeState.el.classList.remove("no-transition"); 

  dragState = null;
  resizeState = null;
  document.body.classList.remove("is-resizing");
});

// Button Bindings & Delegation
document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-open]");
  if (trigger) {
    if (trigger.tagName !== "A") {
      e.preventDefault();
      openWindow(trigger.dataset.open, trigger.dataset.autoMaximize === "true");
    }
    closeStartMenu();
  }
});
closeButtons.forEach(b => b.onclick = () => closeWindow(b.closest(".window")));
minimizeButtons.forEach(b => b.onclick = () => minimizeWindow(b.closest(".window")));
maximizeButtons.forEach(b => b.onclick = () => maximizeWindow(b.closest(".window")));

// Startup sequence
updateClock();
setInterval(updateClock, 30000);
syncTaskbar(); 

// ==========================================
// DYNAMIC INTERACTIVE PARTICLE ENGINE (CLOUDS/STARS)
// ==========================================

const cloudContainer = document.querySelector(".desktop-area");
const particles = [];
const numParticles = 150; //

for (let i = 0; i < numParticles; i++) {
  const el = document.createElement("div");
  
  // The first 7 are "major" (clouds during day, bright stars at night)
  // The rest are "minor" (invisible during day, dim stars at night)
  el.className = i < 7 ? "dynamic-particle is-major" : "dynamic-particle is-minor";
  
  const scale = i < 7 ? (Math.random() * 0.8 + 0.6) : (Math.random() * 0.5 + 0.2); 
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight; 
  
  particles.push({
    el: el,
    x: x,
    y: y,
    baseSpeed: Math.random() * 0.2 + 0.05, 
    scale: scale,
    offsetX: 0,
    offsetY: 0
  });
  
  cloudContainer.appendChild(el);
}

let envMouseX = -1000;
let envMouseY = -1000;

document.addEventListener("mousemove", (e) => {
  envMouseX = e.clientX;
  envMouseY = e.clientY;
});

function animateParticles() {
  particles.forEach(p => {
    // Continuous drifting
    p.x += p.baseSpeed;
    if (p.x > window.innerWidth + 300) {
      p.x = -300;
      p.y = Math.random() * window.innerHeight;
    }

    // Centering calculations
    const particleCenterX = p.x + p.offsetX + (125 * p.scale); 
    const particleCenterY = p.y + p.offsetY + (40 * p.scale);
    
    // Mouse repel physics
    const dx = envMouseX - particleCenterX;
    const dy = envMouseY - particleCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const interactionRadius = 250; 

    if (dist < interactionRadius) {
      const force = (interactionRadius - dist) / interactionRadius;
      p.offsetX -= (dx / dist) * force * 5; 
      p.offsetY -= (dy / dist) * force * 5;
    } else {
      p.offsetX += (0 - p.offsetX) * 0.03;
      p.offsetY += (0 - p.offsetY) * 0.03;
    }

    // Apply the movement to the DOM
    p.el.style.transform = `translate(${p.x + p.offsetX}px, ${p.y + p.offsetY}px) scale(${p.scale})`;
  });
  
  requestAnimationFrame(animateParticles);
}

animateParticles();

// ==========================================
// WELCOME WIDGET TYPEWRITER EFFECT
// ==========================================
const roles = [
  "UI/UX Designer", 
  "Musician", 
  "Music Producer", 
  "Photographer", 
  "Animator", 
  "Video Editor", 
  "Graphic Designer", 
  "Frontend Developer"
];

const typewriterEl = document.getElementById("typewriter-text");
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeRoles() {
  const currentRole = roles[roleIndex];
  
  // Update the text content
  if (isDeleting) {
    typewriterEl.textContent = currentRole.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typewriterEl.textContent = currentRole.substring(0, charIndex + 1);
    charIndex++;
  }

  // Set typing speeds
  let typeSpeed = 50; // Normal typing speed
  if (isDeleting) typeSpeed /= 2; // Delete twice as fast

  // Logic for pausing and switching directions
  if (!isDeleting && charIndex === currentRole.length) {
    // Word is fully typed: pause for 2 seconds before deleting
    typeSpeed = 2000; 
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    // Word is fully deleted: move to the next word and pause briefly
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length; 
    typeSpeed = 500; 
  }

  setTimeout(typeRoles, typeSpeed);
}

// Start the typewriter sequence 1 second after the page loads
setTimeout(typeRoles, 1000);

// ==========================================
// IMAGE LIGHTBOX LOGIC
// ==========================================
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxBg = document.getElementById('lightbox-bg');
const clickableImages = document.querySelectorAll('.clickable-image');

if (lightboxModal) {
  // Open modal when an image is clicked
  clickableImages.forEach(img => {
    img.addEventListener('click', () => {
      const fullSrc = img.getAttribute('data-full-src');
      if (fullSrc) {
        lightboxImg.src = fullSrc;
        lightboxModal.classList.remove('is-hidden');
      }
    });
  });

  // Close modal function
  const closeLightbox = () => {
    lightboxModal.classList.add('is-hidden');
    // Optional: clear the image source after a brief delay so it doesn't flash when reopening
    setTimeout(() => { lightboxImg.src = ''; }, 300);
  };

  // Close when clicking the X or the blurred background
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxBg.addEventListener('click', closeLightbox);
}

// Startup sequence
updateClock();
setInterval(updateClock, 30000);
syncTaskbar(); 

// ==========================================
// DIRECT LINKING (URL HASH) LOGIC
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  // Grab the hash (e.g., "tap-in")
  const hash = window.location.hash.substring(1); 
  
  if (hash) {
    // MAGIC TRICK: Instantly erase the hash from the URL invisibly.
    // This permanently stops the browser from trying to scroll down the page!
    history.replaceState(null, null, window.location.pathname);
    
    // Force the scroll to top just to be completely safe
    window.scrollTo(0, 0);

    const targetWindow = document.getElementById(hash);
    
    // If the ID exists and it's actually a window, open it
    if (targetWindow && targetWindow.classList.contains('window')) {
      
      const desktopIcon = document.querySelector(`[data-open="${hash}"]`);
      const shouldMaximize = desktopIcon ? desktopIcon.dataset.autoMaximize === "true" : false;
      const isMobile = window.innerWidth <= 768;

      // Add a tiny delay so the desktop background loads first
      setTimeout(() => {
        openWindow(hash, shouldMaximize || isMobile); 
      }, 600);
    }
  }
});

// ==========================================
// INSTAGRAM PROFILE MUSIC PLAYER
// ==========================================
function toggleIgMusic() {
  const audio = document.getElementById('ig-audio');
  const icon = document.getElementById('ig-music-play-icon');
  
  if (!audio) return;

  if (audio.paused) {
    // Cross-pause playground audio
    const mpAudio = document.getElementById("mp-audio");
    const mpPlayBtn = document.getElementById("mp-play");
    const mpVisualizer = document.getElementById("mp-visualizer");
    if (mpAudio && !mpAudio.paused) {
      mpAudio.pause();
      if (mpPlayBtn) mpPlayBtn.textContent = "▶";
      if (mpVisualizer) mpVisualizer.classList.remove("is-playing");
    }
    audio.play();
    icon.innerHTML = '⏸';
  } else {
    audio.pause();
    icon.innerHTML = '▶';
  }
}

// ==========================================
// MUSIC SNIPPETS PLAYER LOGIC
// ==========================================

const playlist = [
  { title: "Royal", src: "Audio Files/Royal.mp3", genre: "Melodic", bpm: "130 BPM", key: "B Major" },
  { title: "Mixed Emotions", src: "Audio Files/mixed emotions.mp3", genre: "New Jack Swing", bpm: "118 BPM", key: "E Minor" },
  { title: "Unusual Things", src: "Audio Files/Unusual Things.mp3", genre: "Synthwave", bpm: "85 BPM", key: "E Minor" },
  { title: "Love Taps", src: "Audio Files/Love Taps.mp3", genre: "R&B", bpm: "138 BPM", key: "C Minor" },
  { title: "Let Me", src: "Audio Files/Let Me.mp3", genre: "2000's Swag", bpm: "108 BPM", key: "E Minor" },
  { title: "Chrome Dome", src: "Audio Files/Chrome Dome.mp3", genre: "Electronic Club", bpm: "80 BPM", key: "D# Minor" }
];

let currentTrackIndex = 0;
let isSeeking = false; // Prevents the animation from fighting your mouse clicks
const audio = document.getElementById("mp-audio");
const playBtn = document.getElementById("mp-play");
const prevBtn = document.getElementById("mp-prev");
const nextBtn = document.getElementById("mp-next");
const titleEl = document.getElementById("mp-title");
const genreEl = document.getElementById("mp-genre");
const bpmEl = document.getElementById("mp-bpm");
const keyEl = document.getElementById("mp-key");
const seekBar = document.getElementById("mp-seek-bar");
const currentTimeEl = document.getElementById("mp-current-time");
const durationEl = document.getElementById("mp-duration");
const visualizer = document.getElementById("mp-visualizer");
const playlistUI = document.getElementById("mp-playlist-ui");

// Generate Playlist HTML
function populatePlaylist() {
  if (!playlistUI) return;
  playlistUI.innerHTML = "";
  playlist.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = track.title;
    li.onclick = () => {
      currentTrackIndex = index;
      loadTrack(currentTrackIndex);
      if (audio.paused) togglePlay(); 
    };
    playlistUI.appendChild(li);
  });
}

function updateActivePlaylistItem() {
  if (!playlistUI) return;
  const items = playlistUI.querySelectorAll("li");
  items.forEach(item => item.classList.remove("is-active"));
  if (items[currentTrackIndex]) {
    items[currentTrackIndex].classList.add("is-active");
  }
}

function loadTrack(index) {
  if(!audio) return; 
  const track = playlist[index];
  audio.src = track.src;
  titleEl.textContent = track.title;
  genreEl.textContent = track.genre;
  bpmEl.textContent = track.bpm;
  keyEl.textContent = track.key;
  
  // Reset UI and Progress Bar Color
  seekBar.value = 0;
  seekBar.style.setProperty('--progress', '0%');
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "..."; 
  playBtn.textContent = "▶";
  visualizer.classList.remove("is-playing");
  
  updateActivePlaylistItem();
}

// 60FPS Smooth Progress Bar Animation
function updateSmoothProgress() {
  if (!isSeeking && audio.duration) {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    
    // Move the thumb & inject the color variable
    seekBar.value = progressPercent;
    seekBar.style.setProperty('--progress', `${progressPercent}%`);
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
  
  // Keep looping as long as music is playing
  if (!audio.paused) {
    requestAnimationFrame(updateSmoothProgress);
  }
}

function togglePlay() {
  if (audio.paused) {
    // Cross-pause Instagram audio if active
    const igAudio = document.getElementById('ig-audio');
    const igPlayIcon = document.getElementById('ig-music-play-icon');
    if (igAudio && !igAudio.paused) {
      igAudio.pause();
      if (igPlayIcon) igPlayIcon.textContent = "▶";
    }
    audio.play();
    playBtn.textContent = "⏸";
    visualizer.classList.add("is-playing");
    requestAnimationFrame(updateSmoothProgress); // Start smooth animation loop
  } else {
    audio.pause();
    playBtn.textContent = "▶";
    visualizer.classList.remove("is-playing");
  }
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadTrack(currentTrackIndex);
  togglePlay();
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrackIndex);
  togglePlay();
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Event Listeners
if(audio) {
  populatePlaylist();
  
  playBtn.addEventListener("click", togglePlay);
  nextBtn.addEventListener("click", nextTrack);
  prevBtn.addEventListener("click", prevTrack);

  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  // When dragging the scrubber, pause smooth animation and update colors manually
  seekBar.addEventListener("input", () => {
    isSeeking = true;
    const progressPercent = seekBar.value;
    seekBar.style.setProperty('--progress', `${progressPercent}%`);
    if (audio.duration) {
      currentTimeEl.textContent = formatTime((progressPercent / 100) * audio.duration);
    }
  });

  // When releasing the scrubber, jump the audio and resume smoothness
  seekBar.addEventListener("change", () => {
    const seekTime = (seekBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
    isSeeking = false;
    if (!audio.paused) {
      requestAnimationFrame(updateSmoothProgress);
    }
  });

  audio.addEventListener("ended", nextTrack);

  // Initialize
  loadTrack(currentTrackIndex);
}
