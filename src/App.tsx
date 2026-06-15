import { useCallback, useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { YouTubeIframe } from "./components/YouTubeIframe";
import {
  fetchPlaylistItems,
  fetchVideoDetails,
  fetchPlaylistTitle,
  YouTubePlaylistItem,
  extractYouTubeId,
} from "./utils/youtubeApi";
import { formatDuration } from "./utils/time";
import { resizeWindow, minimizeWindow, closeWindow } from "./utils/windowApi";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Nature Assets
import artworkFrame from "./assets/nature/artwork_frame.png";
import closeButton from "./assets/nature/close_button.png";
import lengthBarEmpty from "./assets/nature/length_bar_empty.png";
import lengthBarFull from "./assets/nature/length_bar_full.png";
import minimizeButton from "./assets/nature/minimize_button.png";
import muteButton from "./assets/nature/mute_button.png";
import nextButton from "./assets/nature/next_button.png";
import pauseButton from "./assets/nature/pause_button.png";
import pinActive from "./assets/nature/pin_active.png";
import pinInactive from "./assets/nature/pin_inactive.png";
import playButton from "./assets/nature/play_button.png";
import previousButton from "./assets/nature/previous_button.png";
import repeatButton from "./assets/nature/repeat_button.png";
import repeatOneButton from "./assets/nature/repeat_one_button.png";
import settingsButton from "./assets/nature/settings_button.png";
import shuffleButton from "./assets/nature/shuffle_button.png";
import songsButton from "./assets/nature/songs_button.png";
import unmuteButton from "./assets/nature/unmute_button.png";
import volumeBarEmpty from "./assets/nature/volume_bar_empty.png";
import volumeBarFull from "./assets/nature/volume_bar_full.png";
import leaf from "./assets/nature/leaf.png";
import heartLeaf from "./assets/nature/heart_leaf.png";
import frameNoBackground from "./assets/nature/frame_no_backround.png";

// Firefly Config
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

function useResize(corner: string) {
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      let lastX = e.screenX;
      let lastY = e.screenY;

      const onMouseMove = (e: MouseEvent) => {
        const dx = e.screenX - lastX;
        const dy = e.screenY - lastY;
        lastX = e.screenX;
        lastY = e.screenY;
        resizeWindow({ dx, dy, corner });
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [corner],
  );

  return onMouseDown;
}

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showPlaylistSongs, setShowPlaylistSongs] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [playlist, setPlaylist] = useState<YouTubePlaylistItem[]>([
    {
      id: "sample-1",
      videoId: "dQw4w9WgXcQ",
      title: "Moonlight Pixel Serenade",
      channelTitle: "Lofi Dreamer",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&h=80&q=80",
      duration: "3:45",
    },
    {
      id: "sample-2",
      videoId: "dQw4w9WgXcQ",
      title: "Chiptune Coffee Shop Vibes",
      channelTitle: "8-Bit Arcade",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=80&h=80&q=80",
      duration: "2:30",
    },
    {
      id: "sample-3",
      videoId: "dQw4w9WgXcQ",
      title: "Neon City Raindrops",
      channelTitle: "Synthwave Rider",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=80&h=80&q=80",
      duration: "4:12",
    },
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // States for YouTube Playlist persistence and refresh features
  const [savedPlaylistUrl, setSavedPlaylistUrl] = useState<string | null>(() => localStorage.getItem("neonPlayer:lastYoutubePlaylistUrl"));
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(() => localStorage.getItem("neonPlayer:lastYoutubePlaylistId"));
  const [savedPlaylistTitle, setSavedPlaylistTitle] = useState<string | null>(() => localStorage.getItem("neonPlayer:lastYoutubePlaylistTitle"));
  const [savedPlaylistLoadedAt, setSavedPlaylistLoadedAt] = useState<string | null>(() => localStorage.getItem("neonPlayer:lastYoutubePlaylistLoadedAt"));
  const [isRefreshingPlaylist, setIsRefreshingPlaylist] = useState(false);
  const [playlistStatusMessage, setPlaylistStatusMessage] = useState<string | null>(null);

  // Playback state & division
  const [currentMode, setCurrentMode] = useState<"local" | "youtube">(
    "youtube",
  );
  const [localAudioPath, setLocalAudioPath] = useState<string>("");
  const [localTrack, setLocalTrack] = useState<YouTubePlaylistItem>({
    id: "local-track",
    videoId: "",
    title: "No Local Audio",
    channelTitle: "Local File",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&h=80&q=80",
    duration: "0:00",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingAutoPlay, setPendingAutoPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("neon_player_volume");
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [muted, setMuted] = useState(() => {
    const saved = localStorage.getItem("neon_player_muted");
    return saved === "true";
  });
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const wasPlayingRef = useRef(false);

  const [playMode, setPlayMode] = useState<
    "normal" | "shuffle" | "repeat" | "repeat-one"
  >("normal");
  const [volumeDragging, setVolumeDragging] = useState(false);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem("neon_player_pinned");
    return saved === "true";
  });

  // Garden States
  const [showBirthday, setShowBirthday] = useState(true);
  const [birthdayFadeOut, setBirthdayFadeOut] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretFadeOut, setSecretFadeOut] = useState(false);
  const [extraLeaves, setExtraLeaves] = useState(false);

  const [completedCount, setCompletedCount] = useState<number>(() => {
    const saved = localStorage.getItem("monis_garden_completed_count");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementFadeOut, setAchievementFadeOut] = useState(false);

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [aboutFadeOut, setAboutFadeOut] = useState(false);
  const [settingsPanelContainer, setSettingsPanelContainer] = useState<HTMLDivElement | null>(null);

  const [fireflyActive, setFireflyActive] = useState(false);
  const [season, setSeason] = useState<string>(() => localStorage.getItem("monis_garden_season") || "spring");
  const [animationIntensity, setAnimationIntensity] = useState<string>(() => localStorage.getItem("monis_garden_animation_intensity") || "normal");

  // Save volume and muted states to local storage
  useEffect(() => {
    localStorage.setItem("neon_player_volume", volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("neon_player_muted", muted.toString());
  }, [muted]);

  useEffect(() => {
    const updateAlwaysOnTop = async () => {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.setAlwaysOnTop(isPinned);
      } catch (err) {
        console.error("Failed to set always on top:", err);
        setErrorMessage("Always on Top failed to activate.");
        setIsPinned(false);
        localStorage.setItem("neon_player_pinned", "false");
      }
    };
    updateAlwaysOnTop();
  }, [isPinned]);

  const handleTogglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      localStorage.setItem("neon_player_pinned", next.toString());
      return next;
    });
  };

  const defaultThumbnail =
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&h=80&q=80";

  const rawTrack =
    currentMode === "local" ? localTrack : playlist[currentTrackIndex];

  const currentTrack = {
    id: rawTrack?.id || "fallback-track-id",
    videoId: rawTrack?.videoId || "",
    title: rawTrack?.title || "Unknown title",
    channelTitle: rawTrack?.channelTitle || "Unknown artist",
    thumbnailUrl: rawTrack?.thumbnailUrl || defaultThumbnail,
    duration: rawTrack?.duration || "0:00",
  };

  const togglePlay = () => {
    if (currentMode === "local" && localAudioRef.current) {
      if (isPlaying) {
        localAudioRef.current.pause();
      } else {
        localAudioRef.current
          .play()
          .catch((e) => console.error("Error playing local audio:", e));
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => setMuted((m) => !m);

  const next = useCallback(
    (isManual = false) => {
      const shouldAutoPlay = isPlaying;

      if (playMode === "repeat-one" && !isManual) {
        setCurrentTime(0);
        setSeekTime(0);
        setIsPlaying(true);
        if (currentMode === "local" && localAudioRef.current) {
          localAudioRef.current.currentTime = 0;
          localAudioRef.current
            .play()
            .catch((e) => console.error("Error repeating local audio:", e));
        }
        return;
      }

      setPendingAutoPlay(shouldAutoPlay);
      setIsPlaying(false);

      if (currentMode === "local") {
        if (localAudioRef.current) {
          localAudioRef.current.currentTime = 0;
          setCurrentTime(0);
          if (shouldAutoPlay) {
            localAudioRef.current.load();
          }
        }
        return;
      }

      if (playlist.length === 0) return;
      wasPlayingRef.current = shouldAutoPlay;

      let nextIndex = currentTrackIndex + 1;
      if (playMode === "shuffle") {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } else if (
        (playMode === "repeat" || playMode === "repeat-one") &&
        nextIndex >= playlist.length
      ) {
        nextIndex = 0;
      } else if (nextIndex >= playlist.length) {
        setPendingAutoPlay(false);
        return;
      }
      setCurrentTrackIndex(nextIndex);
      setCurrentTime(0);
      setSeekTime(0);
    },
    [playlist.length, currentTrackIndex, playMode, currentMode, isPlaying],
  );

  const prev = () => {
    const shouldAutoPlay = isPlaying;
    setPendingAutoPlay(shouldAutoPlay);
    setIsPlaying(false);

    if (currentMode === "local") {
      if (localAudioRef.current) {
        localAudioRef.current.currentTime = 0;
        setCurrentTime(0);
        if (shouldAutoPlay) {
          localAudioRef.current.load();
        }
      }
      return;
    }

    if (playlist.length === 0) return;
    wasPlayingRef.current = shouldAutoPlay;

    const prevIndex =
      currentTrackIndex - 1 < 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTime(0);
    setSeekTime(0);
  };

  const seek = (pct: number) => {
    if (duration > 0) {
      const targetTime = pct * duration;
      setSeekTime(targetTime);
      setCurrentTime(targetTime);
      if (currentMode === "local" && localAudioRef.current) {
        localAudioRef.current.currentTime = targetTime;
      }
    }
  };

  const toggleShuffle = useCallback(() => {
    setPlayMode((m) => (m === "shuffle" ? "normal" : "shuffle"));
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setPlayMode((m) => {
      if (m === "repeat") return "repeat-one";
      if (m === "repeat-one") return "normal";
      return "repeat";
    });
  }, []);

  useEffect(() => {
    if (!volumeDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!volumeBarRef.current) return;
      const rect = volumeBarRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(1, 1 - (e.clientY - rect.top) / rect.height),
      );
      setVolume(pct);
    };
    const onMouseUp = () => {
      setVolumeDragging(false);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [volumeDragging]);

  // Synchronize volume and mute to the local audio element
  useEffect(() => {
    const audio = localAudioRef.current;
    if (audio) {
      audio.volume = muted ? 0 : volume;
    }
  }, [volume, muted, localAudioPath]);

  // Handle local audio player event listeners
  useEffect(() => {
    const audio = localAudioRef.current;
    if (!audio || currentMode !== "local") return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      const durationStr = formatDuration(audio.duration);
      setLocalTrack((t) => ({ ...t, duration: durationStr }));
    };
    const handleEnded = () => {
      if (playMode === "repeat-one") {
        audio.currentTime = 0;
        setCurrentTime(0);
        audio
          .play()
          .catch((e) => console.error("Error repeating local audio:", e));
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handleCanPlay = async () => {
      if (wasPlayingRef.current) {
        wasPlayingRef.current = false;
        try {
          await audio.play();
        } catch (e) {
          console.error("Failed to autoplay local audio after load:", e);
        }
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [localAudioPath, currentMode, playMode]);

  // Autoplay local audio when track changes and pendingAutoPlay is true
  useEffect(() => {
    if (pendingAutoPlay && currentMode === "local" && localAudioRef.current) {
      const audio = localAudioRef.current;
      audio.load();

      const onCanPlay = async () => {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Failed to autoplay next local track:", error);
          setIsPlaying(false);
        } finally {
          setPendingAutoPlay(false);
        }
      };

      audio.addEventListener("canplay", onCanPlay, { once: true });
      return () => {
        audio.removeEventListener("canplay", onCanPlay);
      };
    }
  }, [currentTrack.title, pendingAutoPlay, currentMode]);

  // Tracking song completion (Achievement)
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

  // Portal for "About This Player" button inside Settings panel
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

  const handleSelectLocalAudio = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Audio", extensions: ["mp3", "wav", "ogg", "m4a"] }],
      });
      if (selected && typeof selected === "string") {
        setLocalAudioPath(selected);
        const filename =
          selected.split("\\").pop()?.split("/").pop() || "Local File";

        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);

        setLocalTrack({
          id: "local-track",
          videoId: "",
          title: filename,
          channelTitle: "Local Audio",
          thumbnailUrl:
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&h=80&q=80",
          duration: "0:00",
        });
        setErrorMessage(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to select local file.");
    }
  };

  const handleModeChange = (mode: "local" | "youtube") => {
    if (mode === currentMode) return;

    if (currentMode === "local") {
      if (localAudioRef.current) {
        localAudioRef.current.pause();
      }
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentMode(mode);
    setErrorMessage(null);
  };

  // Helper functions for playlist persistence and clear features
  const saveLastYoutubePlaylist = ({ url, playlistId, title }: { url: string; playlistId: string; title: string }) => {
    const loadedAt = new Date().toISOString();
    localStorage.setItem("neonPlayer:lastYoutubePlaylistUrl", url);
    localStorage.setItem("neonPlayer:lastYoutubePlaylistId", playlistId);
    localStorage.setItem("neonPlayer:lastYoutubePlaylistTitle", title);
    localStorage.setItem("neonPlayer:lastYoutubePlaylistLoadedAt", loadedAt);

    setSavedPlaylistUrl(url);
    setSavedPlaylistId(playlistId);
    setSavedPlaylistTitle(title);
    setSavedPlaylistLoadedAt(loadedAt);
  };

  const clearLastYoutubePlaylist = () => {
    localStorage.removeItem("neonPlayer:lastYoutubePlaylistUrl");
    localStorage.removeItem("neonPlayer:lastYoutubePlaylistId");
    localStorage.removeItem("neonPlayer:lastYoutubePlaylistTitle");
    localStorage.removeItem("neonPlayer:lastYoutubePlaylistLoadedAt");

    setSavedPlaylistUrl(null);
    setSavedPlaylistId(null);
    setSavedPlaylistTitle(null);
    setSavedPlaylistLoadedAt(null);
    setPlaylistStatusMessage("Saved playlist cleared.");
    setTimeout(() => setPlaylistStatusMessage(null), 3000);
  };

  const refreshCurrentYoutubePlaylist = async () => {
    const activePlaylistId = savedPlaylistId || localStorage.getItem("neonPlayer:lastYoutubePlaylistId");
    if (!activePlaylistId) {
      setErrorMessage("No playlist to refresh.");
      return;
    }

    setIsRefreshingPlaylist(true);
    setPlaylistStatusMessage("Refreshing...");
    setErrorMessage(null);

    try {
      const items = await fetchPlaylistItems(activePlaylistId);
      if (!items || items.length === 0) {
        setErrorMessage("Could not refresh the playlist. It may no longer exist.");
        setIsRefreshingPlaylist(false);
        setPlaylistStatusMessage(null);
        return;
      }

      const currentSong = playlist[currentTrackIndex];
      let newTrackIndex = 0;
      let keepPlayingState = isPlaying;

      if (currentSong) {
        const foundIndex = items.findIndex(
          (item) => item.videoId === currentSong.videoId || item.id === currentSong.id
        );
        if (foundIndex !== -1) {
          newTrackIndex = foundIndex;
        } else {
          keepPlayingState = false;
        }
      }

      setPlaylist(items);
      setCurrentTrackIndex(newTrackIndex);
      setIsPlaying(keepPlayingState);

      const title = await fetchPlaylistTitle(activePlaylistId) || savedPlaylistTitle || "YouTube Playlist";
      const loadedAt = new Date().toISOString();

      localStorage.setItem("neonPlayer:lastYoutubePlaylistTitle", title);
      localStorage.setItem("neonPlayer:lastYoutubePlaylistLoadedAt", loadedAt);

      setSavedPlaylistTitle(title);
      setSavedPlaylistLoadedAt(loadedAt);
      setPlaylistStatusMessage("Playlist refreshed!");
      setTimeout(() => setPlaylistStatusMessage(null), 3000);
    } catch (err) {
      console.error("Failed to refresh playlist:", err);
      setErrorMessage("Failed to refresh playlist.");
    } finally {
      setIsRefreshingPlaylist(false);
    }
  };

  // Auto-load saved playlist on startup
  useEffect(() => {
    const autoLoadSavedPlaylist = async () => {
      const savedId = localStorage.getItem("neonPlayer:lastYoutubePlaylistId");
      if (!savedId) return;

      setLoading(true);
      setErrorMessage(null);
      try {
        const items = await fetchPlaylistItems(savedId);
        if (items && items.length > 0) {
          setPlaylist(items);
          setCurrentTrackIndex(0);
          setIsPlaying(false);
          setPendingAutoPlay(false);

          const savedUrl = localStorage.getItem("neonPlayer:lastYoutubePlaylistUrl");
          if (savedUrl) {
            setYoutubeUrl(savedUrl);
          }
        } else {
          setErrorMessage("Saved playlist could not be loaded. It may no longer exist.");
        }
      } catch (err) {
        console.error("Failed to auto-load saved playlist on startup:", err);
        setErrorMessage("Failed to auto-load saved playlist on startup.");
      } finally {
        setLoading(false);
      }
    };

    autoLoadSavedPlaylist();
  }, []);

  const loadYoutubeUrl = async () => {
    if (!youtubeUrl) return;
    setLoading(true);
    setErrorMessage(null);

    const parsed = extractYouTubeId(youtubeUrl);
    if (!parsed) {
      setErrorMessage("Invalid YouTube link, video ID, or playlist ID");
      setLoading(false);
      return;
    }

    try {
      if (parsed.type === "playlist") {
        const playlistId = parsed.id;
        const items = await fetchPlaylistItems(playlistId);
        if (!items || items.length === 0) {
          setErrorMessage(
            "Could not load this playlist. Please check the link or API key.",
          );
          setLoading(false);
          return;
        }
        setPlaylist(items);
        setCurrentTrackIndex(0);
        setIsPlaying(false);

        const title = await fetchPlaylistTitle(playlistId) || "YouTube Playlist";
        saveLastYoutubePlaylist({
          url: youtubeUrl,
          playlistId,
          title,
        });
        setPlaylistStatusMessage(null);
      } else {
        const id = parsed.id;
        const trackDetails = await fetchVideoDetails(id);
        if (trackDetails) {
          setPlaylist([trackDetails]);
        } else {
          setPlaylist([
            {
              id,
              videoId: id,
              title: "YouTube Stream",
              channelTitle: "Unknown Artist",
              thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
            },
          ]);
        }
        setCurrentTrackIndex(0);
        setIsPlaying(false);
      }
      setShowSettings(false);
    } catch (err: any) {
      console.error("Failed loading YouTube content:", err);
      setErrorMessage(
        "Could not load this playlist. Please check the link or API key.",
      );
    } finally {
      setLoading(false);
    }
  };

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

  const resizeTL = useResize("top-left");
  const resizeTR = useResize("top-right");
  const resizeBL = useResize("bottom-left");
  const resizeBR = useResize("bottom-right");

  return (
    <ErrorBoundary>
      <div
        className={`player nature-theme-container ${fireflyActive ? "firefly-mode" : ""} season-${season} intensity-${animationIntensity}`}
      >
        {currentMode === "youtube" && currentTrack.videoId ? (
          <YouTubeIframe
            videoId={currentTrack.videoId}
            isPlaying={isPlaying && currentMode === "youtube"}
            wasPlaying={wasPlayingRef.current && currentMode === "youtube"}
            autoPlayOnReady={pendingAutoPlay}
            onPlay={() => {
              setIsPlaying(true);
              wasPlayingRef.current = false;
              setPendingAutoPlay(false);
            }}
            onPause={() => setIsPlaying(false)}
            seekTime={seekTime}
            volume={volume}
            muted={muted}
            onReady={(d) => setDuration(d)}
            onProgress={(t) => setCurrentTime(t)}
            onEnd={() => next(false)}
            onSeekComplete={() => setSeekTime(null)}
          />
        ) : null}

        {localAudioPath && (
          <audio
            ref={localAudioRef}
            src={convertFileSrc(localAudioPath)}
            style={{ display: "none" }}
          />
        )}

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
          <div className="drag-region" data-tauri-drag-region />
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

            {/* Special Spawn of Extra Leaves */}
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
            onTogglePlaylist={() => {
              setShowPlaylistSongs((v) => !v);
              setShowSettings(false);
            }}
            showSettings={showSettings}
            onToggleSettings={() => {
              setShowSettings((v) => !v);
              setShowPlaylistSongs(false);
            }}
            isPinned={isPinned}
            onTogglePin={handleTogglePin}
            onMinimize={minimizeWindow}
            onClose={closeWindow}
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
              onTogglePlay={togglePlay}
              onNext={() => next(true)}
              onPrev={prev}
              toggleShuffle={toggleShuffle}
              cycleRepeatMode={cycleRepeatMode}
            />

            <VolumeControl
              volume={volume}
              muted={muted}
              onToggleMute={toggleMute}
              onChangeVolume={setVolume}
            />
          </div>
        </div>

        {/* Custom drag region and resize handles */}
        <div className="resize-handle top-left" onMouseDown={resizeTL} />
        <div className="resize-handle top-right" onMouseDown={resizeTR} />
        <div className="resize-handle bottom-left" onMouseDown={resizeBL} />
        <div className="resize-handle bottom-right" onMouseDown={resizeBR} />

        {/* Playlist Panel */}
        {showPlaylistSongs && (
          <div className="playlist-panel">
            <div className="playlist-panel-inner">
              <div className="playlist-panel-header">
                <span className="settings-label">playlist tracks</span>
                {(savedPlaylistId || playlist.length > 0) && (
                  <button
                    className="playlist-refresh-btn"
                    onClick={refreshCurrentYoutubePlaylist}
                    disabled={isRefreshingPlaylist}
                  >
                    {isRefreshingPlaylist ? "refreshing..." : "refresh"}
                  </button>
                )}
              </div>
              {playlist.length === 0 ? (
                <div
                  className="settings-label"
                  style={{
                    opacity: 0.5,
                    fontStyle: "italic",
                    marginTop: "10px",
                  }}
                >
                  no songs loaded
                </div>
              ) : (
                playlist.map((item, idx) => (
                  <button
                    key={idx}
                    className={`playlist-panel-item ${idx === currentTrackIndex && currentMode === "youtube" ? "active" : ""}`}
                    onClick={() => {
                      const shouldAutoPlay = isPlaying;
                      handleModeChange("youtube");
                      setIsPlaying(false);
                      setPendingAutoPlay(shouldAutoPlay);
                      wasPlayingRef.current = shouldAutoPlay;
                      setCurrentTrackIndex(idx);
                      setCurrentTime(0);
                      setSeekTime(0);
                    }}
                  >
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        className="playlist-item-thumb"
                        alt=""
                      />
                    )}
                    <div className="playlist-item-details">
                      <span className="playlist-item-title">{item.title}</span>
                      <span className="playlist-item-artist">
                        {item.channelTitle}
                      </span>
                    </div>
                    <span className="playlist-item-duration">
                      {item.duration || "3:15"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-panel">
            <div className="settings-panel-inner">
              {/* Season Settings */}
              <div className="settings-label">season</div>
              <div className="settings-theme-row">
                {["spring", "summer", "autumn", "winter"].map((s) => (
                  <button
                    key={s}
                    className={`settings-theme-btn ${season === s ? "active" : ""}`}
                    onClick={() => {
                      setSeason(s);
                      localStorage.setItem("monis_garden_season", s);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Animation Settings */}
              <div className="settings-label">animations</div>
              <div className="settings-theme-row">
                {["low", "normal", "high"].map((intensity) => (
                  <button
                    key={intensity}
                    className={`settings-theme-btn ${animationIntensity === intensity ? "active" : ""}`}
                    onClick={() => {
                      setAnimationIntensity(intensity);
                      localStorage.setItem("monis_garden_animation_intensity", intensity);
                    }}
                  >
                    {intensity}
                  </button>
                ))}
              </div>

              <div className="settings-label">mode</div>
              <div className="settings-theme-row">
                <button
                  className={`settings-theme-btn ${currentMode === "local" ? "active" : ""}`}
                  onClick={() => handleModeChange("local")}
                >
                  local
                </button>
                <button
                  className={`settings-theme-btn ${currentMode === "youtube" ? "active" : ""}`}
                  onClick={() => handleModeChange("youtube")}
                >
                  youtube
                </button>
              </div>

              {currentMode === "youtube" ? (
                <>
                  <div className="settings-label">youtube link</div>
                  <input
                    type="text"
                    placeholder="Paste Video or Playlist URL"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                  <button
                    className="settings-theme-btn"
                    onClick={loadYoutubeUrl}
                    disabled={loading}
                    style={{ width: "100%", opacity: loading ? 0.5 : 1 }}
                  >
                    {loading ? "loading..." : "play"}
                  </button>

                  {savedPlaylistId && (
                    <>
                      <div className="settings-label">saved playlist</div>
                      <div className="saved-playlist-box">
                        <div className="saved-playlist-title">
                          {savedPlaylistTitle || "YouTube Playlist"}
                        </div>
                        {savedPlaylistUrl && (
                          <div className="saved-playlist-meta" title={savedPlaylistUrl}>
                            url: {savedPlaylistUrl}
                          </div>
                        )}
                        {savedPlaylistLoadedAt && (
                          <div className="saved-playlist-meta">
                            loaded: {new Date(savedPlaylistLoadedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="saved-playlist-actions">
                        <button
                          className="settings-theme-btn saved-playlist-btn"
                          onClick={refreshCurrentYoutubePlaylist}
                          disabled={isRefreshingPlaylist}
                          style={{ opacity: isRefreshingPlaylist ? 0.5 : 1 }}
                        >
                          {isRefreshingPlaylist ? "refreshing..." : "refresh"}
                        </button>
                        <button
                          className="settings-theme-btn saved-playlist-btn btn-clear"
                          onClick={clearLastYoutubePlaylist}
                        >
                          clear
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="settings-label">local file</div>
                  <button
                    className="settings-theme-btn"
                    onClick={handleSelectLocalAudio}
                    style={{ width: "100%", marginBottom: "10px" }}
                  >
                    select audio file
                  </button>
                  {localAudioPath && (
                    <div
                      style={{
                        color: "var(--nature-dark)",
                        fontSize: "10px",
                        textAlign: "center",
                        wordBreak: "break-all",
                        fontFamily: "Rainyhearts",
                        opacity: 0.8,
                      }}
                    >
                      {localAudioPath.split("\\").pop()?.split("/").pop()}
                    </div>
                  )}
                </>
              )}

              {playlistStatusMessage && (
                <div
                  style={{
                    color: "var(--nature-accent)",
                    fontSize: "11px",
                    marginTop: "10px",
                    textAlign: "center",
                    fontFamily: "Rainyhearts",
                    lineHeight: "1.2",
                  }}
                >
                  {playlistStatusMessage}
                </div>
              )}

              {errorMessage && (
                <div
                  style={{
                    color: "#ff4e6a",
                    fontSize: "11px",
                    marginTop: "10px",
                    textAlign: "center",
                    fontFamily: "Rainyhearts",
                    lineHeight: "1.2",
                  }}
                >
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modals and Overlays */}

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
    </ErrorBoundary>
  );
}
