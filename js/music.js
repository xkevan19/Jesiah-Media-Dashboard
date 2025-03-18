/* --- Table of Contents ---
  1. DOM Element Caching
  2. State Variables
  3. Music Control Functions
      3.1. loadSong
      3.2. playSong
      3.3. pauseSong
      3.4. togglePlayPause
      3.5. nextSong
      3.6. prevSong
      3.7. updateProgress
  4. Event Listeners
  5. Fetch Songs (Initialization)
--- END --- */

// 1. DOM Element Caching
const playPauseBtn = document.getElementById("play-pause-btn");
const playPauseIcon = document.getElementById("play-pause-icon");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const songInfo = document.getElementById("song-info");
const progressBar = document.getElementById("progress-bar");
const waveBars = document.querySelectorAll(
  ".animate-wave-1, .animate-wave-2, .animate-wave-3, .animate-wave-4"
);

// 2. State Variables
let songs = [];
let songIndex = 0;
let isPlaying = false;
let audio = new Audio();

// 3. Music Control Functions

// 3.1. loadSong
function loadSong(index) {
  if (songs.length > 0) {
    audio.src = songs[index].src;
    songInfo.textContent = `${songs[index].artist} - ${songs[index].title}`;
    progressBar.style.width = "0%";
  }
}

// 3.2. playSong
function playSong() {
  if (audio) {
    audio.play();
    isPlaying = true;
    playPauseIcon.classList.remove("fa-play");
    playPauseIcon.classList.add("fa-pause");
    waveBars.forEach((bar) => (bar.style.animationPlayState = "running"));
  }
}

// 3.3. pauseSong
function pauseSong() {
  if (audio) {
    audio.pause();
    isPlaying = false;
    playPauseIcon.classList.remove("fa-pause");
    playPauseIcon.classList.add("fa-play");
    waveBars.forEach((bar) => (bar.style.animationPlayState = "paused"));
  }
}

// 3.4. togglePlayPause
function togglePlayPause() {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
}

// 3.5. nextSong
function nextSong() {
  songIndex++;
  if (songIndex > songs.length - 1) {
    songIndex = 0;
  }
  loadSong(songIndex);
  playSong();
}

// 3.6. prevSong
function prevSong() {
  songIndex--;
  if (songIndex < 0) {
    songIndex = songs.length - 1;
  }
  loadSong(songIndex);
  playSong();
}

// 3.7. updateProgress
function updateProgress() {
  if (audio && audio.duration) {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
  }
}

// 4. Event Listeners
playPauseBtn.addEventListener("click", togglePlayPause);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

// 5. Fetch Songs (Initialization)
fetch("js/songs.json")
  .then((response) => response.json())
  .then((data) => {
    songs = data;
    loadSong(songIndex);
    audio.addEventListener("ended", nextSong);
    audio.addEventListener("timeupdate", updateProgress);
  })
  .catch((error) => {
    console.error("Error loading songs.json:", error);
    songInfo.textContent = "Error loading songs.";
  });
