const musicWidget = document.querySelector("[data-music-widget]");
const musicToggle = document.querySelector("[data-music-toggle]");
const musicPlayer = document.querySelector("[data-music-player]");
const volumeControls = document.querySelectorAll("[data-volume-action]");

const defaultVolume = 0.17;
const volumeStep = 0.12;

const tracks = [
  {
    title: "Open Window Morning",
    src: "assets/audio/open-window-morning.mp3",
  },
  {
    title: "Left You A Note",
    src: "assets/audio/left-you-a-note.mp3",
  },
  {
    title: "Notes on the Windowpane",
    src: "assets/audio/notes-on-the-windowpane.mp3",
  },
];

let currentTrackIndex = 0;
let isPlaying = false;
let hasVisitedMusicWidget = false;

const clampVolume = (volume) => Math.min(1, Math.max(0, volume));

const updateVolumeState = () => {
  const volumePercent = Math.round(musicPlayer.volume * 100);

  musicWidget.dataset.volume = String(volumePercent);

  volumeControls.forEach((control) => {
    const actionLabel =
      control.dataset.volumeAction === "up"
        ? "Raise browsing beats volume"
        : "Lower browsing beats volume";

    control.setAttribute("aria-label", `${actionLabel}. Current volume ${volumePercent}%`);
  });
};

const changeVolume = (direction) => {
  const nextVolume = musicPlayer.volume + direction * volumeStep;

  musicPlayer.volume = clampVolume(nextVolume);
  updateVolumeState();
};

const tuckWidgetOnLeave = () => {
  musicWidget.classList.add("is-tucked");
  musicWidget.classList.remove("is-hovering");

  if (musicWidget.contains(document.activeElement)) {
    document.activeElement.blur();
  }
};

const markMusicWidgetVisited = () => {
  hasVisitedMusicWidget = true;
  musicWidget.classList.add("is-hovering");
  musicWidget.classList.remove("is-tucked");
};

const setTrack = (trackIndex) => {
  const nextIndex = (trackIndex + tracks.length) % tracks.length;
  const nextTrack = tracks[nextIndex];

  currentTrackIndex = nextIndex;

  if (musicPlayer.dataset.trackIndex !== String(nextIndex)) {
    musicPlayer.src = nextTrack.src;
    musicPlayer.dataset.trackIndex = String(nextIndex);
  }

  musicPlayer.dataset.trackTitle = nextTrack.title;
};

const updatePlaybackState = (playing) => {
  isPlaying = playing;
  musicWidget.classList.toggle("is-playing", playing);
  musicToggle.setAttribute("aria-pressed", String(playing));
  musicToggle.setAttribute(
    "aria-label",
    playing ? "Pause browsing beats" : "Play browsing beats"
  );
};

const startMusic = async () => {
  try {
    if (!musicPlayer.src) {
      setTrack(currentTrackIndex);
    }

    await musicPlayer.play();
    updatePlaybackState(true);
  } catch (error) {
    updatePlaybackState(false);
    musicToggle.setAttribute("aria-label", "Audio could not be played");
    console.warn("Browsing Beats could not start.", error);
  }
};

const pauseMusic = () => {
  musicPlayer.pause();
  updatePlaybackState(false);
};

const playNextTrack = async () => {
  setTrack(currentTrackIndex + 1);

  if (!isPlaying) {
    return;
  }

  try {
    await musicPlayer.play();
  } catch (error) {
    updatePlaybackState(false);
    musicToggle.setAttribute("aria-label", "Audio could not be played");
    console.warn("Browsing Beats could not continue.", error);
  }
};

if (musicWidget && musicToggle && musicPlayer && tracks.length > 0) {
  musicPlayer.volume = defaultVolume;
  setTrack(0);
  updateVolumeState();

  window.setTimeout(() => {
    if (!isPlaying) {
      musicWidget.classList.add("is-tucked");
    }
  }, 4200);

  musicWidget.addEventListener("pointerenter", markMusicWidgetVisited);
  musicWidget.addEventListener("pointerover", markMusicWidgetVisited);

  musicToggle.addEventListener("click", () => {
    markMusicWidgetVisited();

    if (isPlaying) {
      pauseMusic();
    } else {
      startMusic();
    }
  });

  musicWidget.addEventListener("pointerleave", tuckWidgetOnLeave);

  document.addEventListener("pointermove", (event) => {
    if (musicWidget.contains(event.target)) {
      markMusicWidgetVisited();
      return;
    }

    if (hasVisitedMusicWidget && !musicWidget.contains(event.target)) {
      tuckWidgetOnLeave();
    }
  });

  volumeControls.forEach((control) => {
    control.addEventListener("click", () => {
      const direction = control.dataset.volumeAction === "up" ? 1 : -1;

      changeVolume(direction);
    });
  });

  musicPlayer.addEventListener("ended", playNextTrack);

  musicPlayer.addEventListener("error", () => {
    updatePlaybackState(false);
    musicToggle.setAttribute("aria-label", "Audio could not be played");
  });
}
