import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./NaturePixelTheme.css";
import { formatDuration } from "../../utils/time";
import { YouTubePlaylistItem } from "../../utils/youtubeApi";

import artworkFrame from "../../assets/nature/artwork_frame.png";
import closeButton from "../../assets/nature/close_button.png";
import lengthBarEmpty from "../../assets/nature/length_bar_empty.png";
import lengthBarFull from "../../assets/nature/length_bar_full.png";
import minimizeButton from "../../assets/nature/minimize_button.png";
import muteButton from "../../assets/nature/mute_button.png";
import nextButton from "../../assets/nature/next_button.png";
import pauseButton from "../../assets/nature/pause_button.png";
import pinActive from "../../assets/nature/pin_active.png";
import pinInactive from "../../assets/nature/pin_inactive.png";
import playButton from "../../assets/nature/play_button.png";
import previousButton from "../../assets/nature/previous_button.png";
import repeatButton from "../../assets/nature/repeat_button.png";
import repeatOneButton from "../../assets/nature/repeat_one_button.png";
import settingsButton from "../../assets/nature/settings_button.png";
import shuffleButton from "../../assets/nature/shuffle_button.png";
import songsButton from "../../assets/nature/songs_button.png";
import unmuteButton from "../../assets/nature/unmute_button.png";
import volumeBarEmpty from "../../assets/nature/volume_bar_empty.png";
import volumeBarFull from "../../assets/nature/volume_bar_full.png";
import leaf from "../../assets/nature/leaf.png";
import heartLeaf from "../../assets/nature/heart_leaf.png";
import frameNoBackground from "../../assets/nature/frame_no_backround.png";

interface NaturePixelThemeProps {
  isPlaying: boolean;
  currentTrack?: YouTubePlaylistItem | null;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  seek: (pct: number) => void;
  onMinimize: () => void;
  onClose: () => void;
  onToggleSettings: () => void;
  onTogglePlaylist: () => void;
  showSettings: boolean;
  showPlaylistSongs: boolean;
  volume: number;
  muted: boolean;
  onToggleMute: () => void;
  onChangeVolume: (val: number) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  playMode: "normal" | "shuffle" | "repeat" | "repeat-one";
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
}

interface FireflyConfig {
  id: number;
  left: string;
  top: string;
  size: "s" | "m" | "l";
  color: string;
  driftVariant: "a" | "b" | "c" | "d";
  glowVariant: "a" | "b" | "c";
  delay: string;
  isHeart?: boolean;
}

const FIREFLIES: FireflyConfig[] = [
  { id: 1, left: "15%", top: "20%", size: "m", color: "#ffe46b", driftVariant: "a", glowVariant: "a", delay: "0.2s" },
  { id: 2, left: "75%", top: "15%", size: "s", color: "#e2ff9e", driftVariant: "b", glowVariant: "b", delay: "1.5s" },
  { id: 3, left: "30%", top: "45%", size: "l", color: "#ffd885", driftVariant: "c", glowVariant: "c", delay: "0.8s", isHeart: true },
  { id: 4, left: "85%", top: "50%", size: "m", color: "#ffe46b", driftVariant: "d", glowVariant: "a", delay: "2.1s" },
  { id: 5, left: "10%", top: "70%", size: "s", color: "#e2ff9e", driftVariant: "a", glowVariant: "b", delay: "0.5s" },
  { id: 6, left: "60%", top: "80%", size: "l", color: "#ffd885", driftVariant: "b", glowVariant: "c", delay: "3.0s" },
  { id: 7, left: "45%", top: "25%", size: "m", color: "#ffe46b", driftVariant: "c", glowVariant: "a", delay: "1.1s" },
  { id: 8, left: "20%", top: "85%", size: "s", color: "#e2ff9e", driftVariant: "d", glowVariant: "b", delay: "2.5s" },
  { id: 9, left: "70%", top: "65%", size: "m", color: "#ffd885", driftVariant: "a", glowVariant: "c", delay: "0.7s" },
  { id: 10, left: "50%", top: "55%", size: "l", color: "#ffe46b", driftVariant: "b", glowVariant: "a", delay: "1.9s" },
  { id: 11, left: "80%", top: "35%", size: "s", color: "#e2ff9e", driftVariant: "c", glowVariant: "b", delay: "2.8s" },
  { id: 12, left: "35%", top: "75%", size: "m", color: "#ffd885", driftVariant: "d", glowVariant: "c", delay: "1.4s" },
  { id: 13, left: "90%", top: "25%", size: "l", color: "#ffe46b", driftVariant: "a", glowVariant: "a", delay: "0.4s" },
  { id: 14, left: "25%", top: "35%", size: "s", color: "#e2ff9e", driftVariant: "b", glowVariant: "b", delay: "2.2s" },
  { id: 15, left: "65%", top: "40%", size: "m", color: "#ffd885", driftVariant: "c", glowVariant: "c", delay: "1.7s", isHeart: true },
  { id: 16, left: "55%", top: "10%", size: "s", color: "#ffe46b", driftVariant: "d", glowVariant: "a", delay: "0.9s" },
];

const getLeafSrc = (index: number) => {
  // Stable pseudorandom selection: 10% chance of heart leaf
  const isHeart = (index * 17 + 5) % 10 === 0;
  return isHeart ? heartLeaf : leaf;
};

const FireflyIcon = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 16 16"
    fill="currentColor"
    style={{ display: "block", imageRendering: "pixelated" }}
  >
    <path d="M7 2h2v2H7z" fill="currentColor" />
    <path d="M6 4h4v5H6z" fill="currentColor" opacity="0.8" />
    <path d="M5 5h1v2H5zm5 0h1v2h-1z" fill="currentColor" opacity="0.5" />
    <path d="M7 9h2v3H7z" fill="currentColor" />
  </svg>
);

const NatureHeader = ({
  showPlaylistSongs,
  onTogglePlaylist,
  showSettings,
  onToggleSettings,
  isPinned,
  onTogglePin,
  onMinimize,
  onClose,
  onLogoClick,
  fireflyActive,
  onToggleFirefly,
}: {
  showPlaylistSongs: boolean;
  onTogglePlaylist: () => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onLogoClick: () => void;
  fireflyActive: boolean;
  onToggleFirefly: () => void;
}) => {
  return (
    <div className="nature-top-bar" data-tauri-drag-region>
      <div
        className="nature-logo"
        style={{ cursor: "pointer", whiteSpace: "nowrap" }}
        onClick={(e) => {
          e.stopPropagation();
          onLogoClick();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        data-tauri-drag-region
      >
        Moni's Garden
      </div>

      <div className="nature-top-bar-center" onMouseDown={(e) => e.stopPropagation()}>
        <button
          className={`nature-image-button nature-firefly-button ${
            fireflyActive ? "is-active" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFirefly();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Firefly Mode"
        >
          <div className="firefly-svg-wrapper">
            <FireflyIcon />
          </div>
        </button>

        <button
          className={`nature-image-button nature-songs-button ${
            showPlaylistSongs ? "is-active" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlaylist();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Songs"
        >
          <img src={songsButton} alt="Songs" draggable={false} />
        </button>
      </div>

      <div
        className="nature-top-controls"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className={`nature-image-button nature-header-button nature-settings-button ${
            showSettings ? "is-active" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSettings();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Settings"
        >
          <img src={settingsButton} alt="Settings" draggable={false} />
        </button>

        <button
          className={`nature-image-button nature-header-button nature-pin-button ${
            isPinned ? "is-active" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={isPinned ? "Always on Top: ON" : "Always on Top: OFF"}
        >
          <img
            src={isPinned ? pinActive : pinInactive}
            alt={isPinned ? "Pinned" : "Pin"}
            draggable={false}
          />
        </button>

        <button
          className="nature-image-button nature-header-button"
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Minimize"
        >
          <img src={minimizeButton} alt="Minimize" draggable={false} />
        </button>

        <button
          className="nature-image-button nature-header-button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Close"
        >
          <img src={closeButton} alt="Close" draggable={false} />
        </button>
      </div>
    </div>
  );
};

const CircularAlbumArt = ({ thumbnailUrl }: { thumbnailUrl?: string }) => {
  return (
    <div className="nature-album-section">
      <div className="nature-album-frame-wrapper">
        <div className="nature-album-art-circle">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              className="nature-album-art"
              alt="Album art"
              draggable={false}
            />
          ) : (
            <div className="nature-fallback-art" />
          )}
        </div>

        <img
          src={artworkFrame}
          className="nature-artwork-frame"
          alt=""
          draggable={false}
        />
      </div>
    </div>
  );
};

const TrackInfo = ({ title, artist }: { title?: string; artist?: string }) => {
  return (
    <div className="nature-info-section" data-tauri-drag-region>
      <h1 className="nature-title" title={title || "No Track Loaded"}>
        {title || "No Track Loaded"}
      </h1>

      <p className="nature-artist" title={artist || "Unknown Artist"}>
        {artist || "Unknown Artist"}
      </p>

      <p className="nature-album">Album: Forest Whispers</p>
    </div>
  );
};

const ProgressSection = ({
  currentTime,
  duration,
  seek,
}: {
  currentTime: number;
  duration: number;
  seek: (pct: number) => void;
}) => {
  const progress =
    duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    const getPct = (clientX: number) => {
      const vw = window.innerWidth;
      const leftCap = (14 / 306) * vw;
      const rightCap = (14 / 306) * vw;
      const usableWidth = rect.width - leftCap - rightCap;
      if (usableWidth <= 0) return 0;
      const relativeX = clientX - rect.left - leftCap;
      return Math.max(0, Math.min(1, relativeX / usableWidth));
    };

    seek(getPct(e.clientX));

    const onMouseMove = (moveEvent: MouseEvent) => {
      seek(getPct(moveEvent.clientX));
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="nature-progress-section" onMouseDown={(e) => e.stopPropagation()}>
      <div
        className="nature-image-bar nature-length-bar"
        onMouseDown={handleProgressMouseDown}
      >
        <img
          src={lengthBarEmpty}
          className="nature-bar-empty"
          alt=""
          draggable={false}
        />

        <div
          className="nature-bar-fill-window"
          style={{
            left: 0,
            width: progress > 0
              ? `calc(var(--nature-progress-cap-left) + ${progress} * (100% - var(--nature-progress-cap-left) - var(--nature-progress-cap-right)))`
              : "0px",
          }}
        >
          <img
            src={lengthBarFull}
            className="nature-bar-full"
            alt=""
            draggable={false}
          />
        </div>

        <img
          src={leaf}
          className="nature-bar-thumb nature-progress-thumb"
          style={{
            left: `calc(var(--nature-progress-cap-left) + ${progress} * (100% - var(--nature-progress-cap-left) - var(--nature-progress-cap-right)))`,
          }}
          alt=""
          draggable={false}
        />
      </div>

      <div className="nature-time-row">
        <span>{formatDuration(duration > 0 ? currentTime : 0)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
};

const PlaybackControls = ({
  isPlaying,
  playMode,
  onTogglePlay,
  onNext,
  onPrev,
  toggleShuffle,
  cycleRepeatMode,
}: {
  isPlaying: boolean;
  playMode: "normal" | "shuffle" | "repeat" | "repeat-one";
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
}) => {
  const isShuffleActive = playMode === "shuffle";
  const repeatAsset =
    playMode === "repeat-one" ? repeatOneButton : repeatButton;
  const isRepeatActive = playMode === "repeat" || playMode === "repeat-one";

  return (
    <div className="playback-row" onMouseDown={(e) => e.stopPropagation()}>
      <div className="center-controls">
        <button
          className={`nature-image-button nature-control-button nature-side-control nature-shuffle-button ${
            isShuffleActive ? "is-active" : "is-inactive"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleShuffle();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Shuffle"
        >
          <img src={shuffleButton} alt="Shuffle" draggable={false} />
        </button>

        <button
          className="nature-image-button nature-control-button nature-small-round-control"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Previous"
        >
          <img src={previousButton} alt="Previous" draggable={false} />
        </button>

        <button
          className="nature-image-button nature-control-button nature-main-play-control"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={isPlaying ? "Pause" : "Play"}
        >
          <img
            src={isPlaying ? playButton : pauseButton}
            alt={isPlaying ? "Pause" : "Play"}
            draggable={false}
          />
        </button>

        <button
          className="nature-image-button nature-control-button nature-small-round-control"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Next"
        >
          <img src={nextButton} alt="Next" draggable={false} />
        </button>

        <button
          className={`nature-image-button nature-control-button nature-side-control nature-repeat-button ${
            isRepeatActive ? "is-active" : "is-inactive"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            cycleRepeatMode();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={playMode === "repeat-one" ? "Repeat One" : "Repeat"}
        >
          <img
            src={repeatAsset}
            alt={playMode === "repeat-one" ? "Repeat One" : "Repeat"}
            draggable={false}
          />
        </button>
      </div>
    </div>
  );
};

const VolumeControl = ({
  volume,
  muted,
  onToggleMute,
  onChangeVolume,
}: {
  volume: number;
  muted: boolean;
  onToggleMute: () => void;
  onChangeVolume: (val: number) => void;
}) => {
  const volumePct = muted ? 0 : Math.round(volume * 100);
  const volumeVal = volumePct / 100;

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    const getPct = (clientX: number) => {
      const vw = window.innerWidth;
      const leftCap = (10 / 306) * vw;
      const rightCap = (8 / 306) * vw;
      const usableWidth = rect.width - leftCap - rightCap;
      if (usableWidth <= 0) return 0;
      const relativeX = clientX - rect.left - leftCap;
      return Math.max(0, Math.min(1, relativeX / usableWidth));
    };

    onChangeVolume(getPct(e.clientX));

    const onMouseMove = (moveEvent: MouseEvent) => {
      onChangeVolume(getPct(moveEvent.clientX));
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="nature-volume-row" onMouseDown={(e) => e.stopPropagation()}>
      <button
        className="nature-image-button nature-volume-button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title={muted ? "Unmute" : "Mute"}
      >
        <img
          src={muted ? muteButton : unmuteButton}
          alt={muted ? "Muted" : "Volume"}
          draggable={false}
        />
      </button>

      <div
        className="nature-image-bar nature-volume-bar"
        onMouseDown={handleVolumeMouseDown}
      >
        <img
          src={volumeBarEmpty}
          className="nature-bar-empty"
          alt=""
          draggable={false}
        />

        <div
          className="nature-bar-fill-window"
          style={{
            left: 0,
            width: volumeVal > 0
              ? `calc(var(--nature-volume-cap-left) + ${volumeVal} * (100% - var(--nature-volume-cap-left) - var(--nature-volume-cap-right)))`
              : "0px",
          }}
        >
          <img
            src={volumeBarFull}
            className="nature-bar-full nature-volume-bar-full"
            alt=""
            draggable={false}
          />
        </div>

        <img
          src={leaf}
          className="nature-bar-thumb nature-volume-thumb"
          style={{
            left: `calc(var(--nature-volume-cap-left) + ${volumeVal} * (100% - var(--nature-volume-cap-left) - var(--nature-volume-cap-right)))`,
          }}
          alt=""
          draggable={false}
        />
      </div>

      <span className="nature-volume-text">{volumePct}%</span>
    </div>
  );
};

export default function NaturePixelTheme({
  isPlaying,
  currentTrack,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  seek,
  onMinimize,
  onClose,
  onToggleSettings,
  onTogglePlaylist,
  showSettings,
  showPlaylistSongs,
  volume,
  muted,
  onToggleMute,
  onChangeVolume,
  isPinned,
  onTogglePin,
  playMode,
  toggleShuffle,
  cycleRepeatMode,
}: NaturePixelThemeProps) {
  // Feature 2: Birthday overlay state
  const [showBirthday, setShowBirthday] = useState(true);
  const [birthdayFadeOut, setBirthdayFadeOut] = useState(false);

  // Feature 3: Logo clicks & Secret message modal
  const [logoClicks, setLogoClicks] = useState(0);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretFadeOut, setSecretFadeOut] = useState(false);
  const [extraLeaves, setExtraLeaves] = useState(false);

  // Feature 5: Forest Friend achievement modal
  const [completedCount, setCompletedCount] = useState<number>(() => {
    const saved = localStorage.getItem("monis_garden_completed_count");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementFadeOut, setAchievementFadeOut] = useState(false);

  // Feature 6: About modal state
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [aboutFadeOut, setAboutFadeOut] = useState(false);
  const [settingsPanelContainer, setSettingsPanelContainer] = useState<HTMLDivElement | null>(null);

  // Feature 7: Firefly mode state
  const [fireflyActive, setFireflyActive] = useState(false);

  // Tracking song completion (Feature 5)
  const lastTrackIdRef = useRef<string | null>(null);
  const trackHasCompletedRef = useRef<boolean>(false);
  const trackId = currentTrack?.id || null;

  useEffect(() => {
    if (!trackId) {
      lastTrackIdRef.current = null;
      trackHasCompletedRef.current = false;
      return;
    }

    if (lastTrackIdRef.current !== trackId) {
      // Track changed! If the previous track completed naturally, increment count
      if (trackHasCompletedRef.current) {
        const unlocked = localStorage.getItem("forestFriendUnlocked") === "true";
        if (!unlocked) {
          setCompletedCount((prev) => {
            const next = prev + 1;
            localStorage.setItem("monis_garden_completed_count", next.toString());
            if (next >= 5) {
              setShowAchievement(true);
              localStorage.setItem("forestFriendUnlocked", "true");
            }
            return next;
          });
        }
      }
      lastTrackIdRef.current = trackId;
      trackHasCompletedRef.current = false;
    }

    // If currentTime is close to duration, mark as completed
    if (duration > 0 && currentTime >= duration - 1) {
      trackHasCompletedRef.current = true;
    }
  }, [trackId, currentTime, duration]);

  // Effect for extra floating leaves timeout
  useEffect(() => {
    if (extraLeaves) {
      const timer = setTimeout(() => {
        setExtraLeaves(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [extraLeaves]);

  // Feature 6: Portal for "About This Player" button inside Settings panel
  // MutationObserver ensures that the button remains at the absolute end of settings list
  useEffect(() => {
    if (!showSettings) {
      setSettingsPanelContainer(null);
      return;
    }

    let observer: MutationObserver | null = null;

    const setupPortal = () => {
      const inner = document.querySelector(".settings-panel-inner");
      if (inner) {
        let wrapper = inner.querySelector(".nature-about-btn-wrapper") as HTMLDivElement;
        if (!wrapper) {
          wrapper = document.createElement("div");
          wrapper.className = "nature-about-btn-wrapper";
          inner.appendChild(wrapper);
        } else if (inner.lastChild !== wrapper) {
          inner.appendChild(wrapper);
        }
        setSettingsPanelContainer(wrapper);

        if (!observer) {
          observer = new MutationObserver(() => {
            if (inner.lastChild !== wrapper) {
              inner.appendChild(wrapper);
            }
          });
          observer.observe(inner, { childList: true });
        }
      }
    };

    setupPortal();
    const timer = setTimeout(setupPortal, 100);

    return () => {
      clearTimeout(timer);
      if (observer) {
        (observer as MutationObserver).disconnect();
      }
      const inner = document.querySelector(".settings-panel-inner");
      const wrapper = inner?.querySelector(".nature-about-btn-wrapper");
      if (inner && wrapper && inner.contains(wrapper)) {
        inner.removeChild(wrapper);
      }
    };
  }, [showSettings]);

  const handleLogoClick = () => {
    console.log("Moni's Garden logo clicks:", logoClicks);
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowSecretModal(true);
        setExtraLeaves(true);
        return 0;
      }
      return next;
    });
  };

  const closeBirthdayOverlay = () => {
    setBirthdayFadeOut(true);
    setTimeout(() => {
      setShowBirthday(false);
    }, 800);
  };

  const closeAboutModal = () => {
    setAboutFadeOut(true);
    setTimeout(() => {
      setShowAboutModal(false);
      setAboutFadeOut(false);
    }, 400);
  };

  const closeSecretModal = () => {
    setSecretFadeOut(true);
    setTimeout(() => {
      setShowSecretModal(false);
      setSecretFadeOut(false);
    }, 400);
  };

  const closeAchievementModal = () => {
    setAchievementFadeOut(true);
    setTimeout(() => {
      setShowAchievement(false);
      setAchievementFadeOut(false);
    }, 400);
  };

  return (
    <div className={`nature-theme-container ${fireflyActive ? "firefly-mode" : ""}`}>
      {/* Decorative Fireflies Layer */}
      <div className={`nature-fireflies-layer ${fireflyActive ? "is-visible" : ""}`} aria-hidden="true">
        {FIREFLIES.map((f) => (
          <div
            key={f.id}
            className={`firefly size-${f.size} drift-${f.driftVariant}`}
            style={{
              left: f.left,
              top: f.top,
              animationDelay: f.delay,
            }}
          >
            <div
              className={`firefly-glow glow-${f.glowVariant}`}
              style={{
                color: f.color,
                animationDelay: f.delay,
              }}
            >
              {f.isHeart ? (
                <svg
                  viewBox="0 0 10 10"
                  fill="currentColor"
                  style={{ display: "block", width: "100%", height: "100%" }}
                >
                  <path d="M5 9C5 9 1 6 1 3.5C1 1.5 2.5 0.5 5 2.5C7.5 0.5 9 1.5 9 3.5C9 6 5 9 5 9Z" />
                </svg>
              ) : (
                <div className="firefly-pixel-body" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="nature-card" data-tauri-drag-region>
        {/* Botanical Nature Overlay Frame Layer */}
        <div className="nature-frame-layer">
          <img
            src={frameNoBackground}
            className="nature-frame-image"
            alt=""
            draggable={false}
          />
        </div>

        {/* Decorative Floating Leaves Layer */}
        <div className="nature-floating-leaves" aria-hidden="true">
          <img src={getLeafSrc(1)} className="nature-floating-leaf size-s leaf-a" alt="" draggable={false} />
          <img src={getLeafSrc(2)} className="nature-floating-leaf size-m leaf-b" alt="" draggable={false} />
          <img src={getLeafSrc(3)} className="nature-floating-leaf size-l leaf-c" alt="" draggable={false} />
          <img src={getLeafSrc(4)} className="nature-floating-leaf size-s leaf-d" alt="" draggable={false} />
          <img src={getLeafSrc(5)} className="nature-floating-leaf size-m leaf-e" alt="" draggable={false} />
          <img src={getLeafSrc(6)} className="nature-floating-leaf size-s leaf-f" alt="" draggable={false} />
          <img src={getLeafSrc(7)} className="nature-floating-leaf size-l leaf-g" alt="" draggable={false} />
          <img src={getLeafSrc(8)} className="nature-floating-leaf size-m leaf-h" alt="" draggable={false} />
          <img src={getLeafSrc(9)} className="nature-floating-leaf size-s leaf-i" alt="" draggable={false} />
          <img src={getLeafSrc(10)} className="nature-floating-leaf size-m leaf-j" alt="" draggable={false} />
          <img src={getLeafSrc(11)} className="nature-floating-leaf size-l leaf-k" alt="" draggable={false} />
          <img src={getLeafSrc(12)} className="nature-floating-leaf size-s leaf-l" alt="" draggable={false} />
          <img src={getLeafSrc(13)} className="nature-floating-leaf size-m leaf-m" alt="" draggable={false} />
          <img src={getLeafSrc(14)} className="nature-floating-leaf size-s leaf-n" alt="" draggable={false} />
          <img src={getLeafSrc(15)} className="nature-floating-leaf size-s leaf-o" alt="" draggable={false} />
          <img src={getLeafSrc(16)} className="nature-floating-leaf size-s leaf-p" alt="" draggable={false} />
          <img src={getLeafSrc(17)} className="nature-floating-leaf size-s leaf-q" alt="" draggable={false} />
          <img src={getLeafSrc(18)} className="nature-floating-leaf size-s leaf-r" alt="" draggable={false} />

          {/* Special Spawn of Extra Leaves (Feature 3) */}
          {extraLeaves && (
            <>
              <img src={getLeafSrc(19)} className="nature-floating-leaf size-s leaf-extra-a" alt="" draggable={false} />
              <img src={getLeafSrc(20)} className="nature-floating-leaf size-m leaf-extra-b" alt="" draggable={false} />
              <img src={getLeafSrc(21)} className="nature-floating-leaf size-l leaf-extra-c" alt="" draggable={false} />
              <img src={getLeafSrc(22)} className="nature-floating-leaf size-s leaf-extra-d" alt="" draggable={false} />
              <img src={getLeafSrc(23)} className="nature-floating-leaf size-m leaf-extra-e" alt="" draggable={false} />
              <img src={getLeafSrc(24)} className="nature-floating-leaf size-l leaf-extra-f" alt="" draggable={false} />
            </>
          )}
        </div>



        <NatureHeader
          showPlaylistSongs={showPlaylistSongs}
          onTogglePlaylist={onTogglePlaylist}
          showSettings={showSettings}
          onToggleSettings={onToggleSettings}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
          onMinimize={onMinimize}
          onClose={onClose}
          onLogoClick={handleLogoClick}
          fireflyActive={fireflyActive}
          onToggleFirefly={() => setFireflyActive((prev) => !prev)}
        />

        <CircularAlbumArt thumbnailUrl={currentTrack?.thumbnailUrl} />

        <TrackInfo
          title={currentTrack?.title}
          artist={currentTrack?.channelTitle}
        />

        <ProgressSection
          currentTime={currentTime}
          duration={duration}
          seek={seek}
        />

        <div className="nature-controls-group">
          <PlaybackControls
            isPlaying={isPlaying}
            playMode={playMode}
            onTogglePlay={onTogglePlay}
            onNext={onNext}
            onPrev={onPrev}
            toggleShuffle={toggleShuffle}
            cycleRepeatMode={cycleRepeatMode}
          />

          <VolumeControl
            volume={volume}
            muted={muted}
            onToggleMute={onToggleMute}
            onChangeVolume={onChangeVolume}
          />
        </div>
      </div>

      {/* Feature 2: Birthday Screen Overlay */}
      {showBirthday && createPortal(
        <div
          className={`nature-birthday-overlay ${birthdayFadeOut ? "fade-out" : ""}`}
          onClick={closeBirthdayOverlay}
        >
          <div className="nature-birthday-content" onClick={(e) => e.stopPropagation()}>
            <div className="nature-birthday-title">Happy Birthday Moni 🌿</div>
            <div className="nature-birthday-body">
              {"May every song bring\na beautiful memory."}
            </div>
            <div className="nature-birthday-footer" onClick={closeBirthdayOverlay}>
              Click anywhere to enter the garden
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Feature 3: Secret Moni Message Modal */}
      {showSecretModal && createPortal(
        <div className={`nature-modal-backdrop ${secretFadeOut ? "fade-out" : ""}`} onClick={closeSecretModal}>
          <div className="nature-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nature-modal-title">🌿 Hi Moni</div>
            <div className="nature-modal-body">
              {"I hope this player\nalways finds you\na good song."}
            </div>
            <button
              className="nature-modal-button"
              onClick={closeSecretModal}
            >
              Continue
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Feature 5: Forest Friend Achievement Modal */}
      {showAchievement && createPortal(
        <div className={`nature-modal-backdrop ${achievementFadeOut ? "fade-out" : ""}`} onClick={closeAchievementModal}>
          <div className="nature-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nature-modal-title">🌿 Forest Friend Unlocked</div>
            <div className="nature-modal-body">
              {`Thanks for spending time\nin Moni's Garden.\n\nCompleted: ${completedCount} songs`}
            </div>
            <button
              className="nature-modal-button"
              onClick={closeAchievementModal}
            >
              Continue
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Feature 6: About Modal */}
      {showAboutModal && createPortal(
        <div className={`nature-modal-backdrop ${aboutFadeOut ? "fade-out" : ""}`} onClick={closeAboutModal}>
          <div className="nature-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nature-modal-title">Moni's Garden</div>
            <div className="nature-modal-body">
              {"Version 1.0\n\nCreated for Moni 🌿\n\nThank you for inspiring\nthis little forest."}
            </div>
            <button
              className="nature-modal-button"
              onClick={closeAboutModal}
            >
              Return
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Portal for About button inside Settings Panel */}
      {settingsPanelContainer && createPortal(
        <button
          className="settings-theme-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowAboutModal(true);
          }}
          style={{ width: "100%", marginTop: "15px" }}
        >
          About This Player
        </button>,
        settingsPanelContainer
      )}
    </div>
  );
}
