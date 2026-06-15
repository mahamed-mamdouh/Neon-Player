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
import logoImg from "./assets/logo.png";

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

interface GardenParticle {
  id: number;
  left: number; // percentage
  top: number; // percentage
  size: "s" | "m" | "l";
  speed: number;
  delay: number;
  driftVariant: "a" | "b" | "c" | "d" | "center" | "center-alt";
}

const PARTICLE_COUNT = 48;

const GENERATED_PARTICLES: GardenParticle[] = Array.from(
  { length: PARTICLE_COUNT },
  (_, idx) => {
    const id = idx + 1;
    const left = ((idx * 37) % 90) + 5;
    const top = ((idx * 23) % 40) - 15;
    const sizes: ("s" | "m" | "l")[] = ["s", "m", "l"];
    const size = sizes[idx % 3];
    const speed = 1.0 + (idx % 5) * 0.15;
    const delay = parseFloat(((idx * 0.7) % 8).toFixed(1));

    const driftVariants: GardenParticle["driftVariant"][] = [
      "a",
      "b",
      "c",
      "d",
      "center",
      "center-alt",
    ];
    const driftVariant = driftVariants[idx % driftVariants.length];

    return { id, left, top, size, speed, delay, driftVariant };
  },
);

const GENERATED_FIREFLIES: FireflyConfig[] = Array.from(
  { length: 24 },
  (_, idx) => {
    const id = idx + 1;
    const left = ((idx * 17) % 85) + 8 + "%";
    const top = ((idx * 29) % 80) + 10 + "%";
    const sizes: ("s" | "m" | "l")[] = ["s", "m", "l"];
    const size = sizes[idx % 3];
    const colors = ["#ffe46b", "#e2ff9e", "#ffd885"];
    const color = colors[idx % colors.length];
    const driftVariants: ("a" | "b" | "c" | "d")[] = ["a", "b", "c", "d"];
    const driftVariant = driftVariants[idx % 4];
    const glowVariants: ("a" | "b" | "c")[] = ["a", "b", "c"];
    const glowVariant = glowVariants[idx % 3];
    const delay = (idx * 0.4).toFixed(1) + "s";
    const isHeart = idx % 8 === 0;

    return {
      id,
      left,
      top,
      size,
      color,
      driftVariant,
      glowVariant,
      delay,
      isHeart,
    };
  },
);

const getFirefliesCount = (intensity: string, season: string) => {
  let base = 12;
  if (intensity === "low") base = 6;
  if (intensity === "high") base = 24;

  if (season === "summer") {
    return Math.round(base * 1.5);
  }
  return base;
};

const getParticlesCount = (intensity: string, season: string) => {
  let base = 16;
  if (intensity === "low") base = 8;
  if (intensity === "high") base = 32;

  if (season === "summer") {
    return Math.round(base * 1.5);
  }
  return base;
};

const MONI_NOTES = [
  "Moni, I hope today is a good day.",
  "The flowers seem happy to see you.",
  "The garden feels brighter today.",
  "You are loved more than you know.",
  "A little reminder to smile.",
];

const GARDEN_QUOTES = [
  "A butterfly passed through the garden.",
  "The forest is listening.",
  "A gentle breeze moved the leaves.",
  "The flowers are dancing today.",
  "The fireflies are awake.",
];

const SPECIAL_EVENTS = [
  { text: "The garden wanted to thank you for visiting.", type: "thank" },
  { text: "Some flowers bloomed just for you.", type: "blooms" },
  { text: "A secret breeze passed through.", type: "breeze" },
];

const DoubleHeartLeafSVG = () => (
  <svg
    viewBox="0 0 16 16"
    width="100%"
    height="100%"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <g transform="translate(1, 2) rotate(-15)">
      <path
        d="M4 12C4 12 0 8 0 4.5C0 1.5 2 0 4 3C6 0 8 1.5 8 4.5C8 8 4 12 4 12Z"
        fill="var(--heart-leaf-fill, #e884a4)"
      />
      <path
        d="M4 11C4 11 1 7.5 1 4.5"
        stroke="var(--heart-leaf-stroke, #c25375)"
        strokeWidth="0.5"
      />
    </g>
    <g transform="translate(8, 6) scale(0.7) rotate(25)">
      <path
        d="M4 12C4 12 0 8 0 4.5C0 1.5 2 0 4 3C6 0 8 1.5 8 4.5C8 8 4 12 4 12Z"
        fill="var(--heart-leaf-fill-light, #ffb3c6)"
      />
    </g>
  </svg>
);

const PixelHeartLeafSVG = () => (
  <svg
    viewBox="0 0 8 8"
    width="100%"
    height="100%"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <path
      d="M3 1h2v1H3zm-2 1h6v1H1zm-1 1h8v1H0zm1 1h6v1H1zm1 1h4v1H2zm1 1h2v1H3z"
      fill="var(--heart-leaf-fill, #d65a7f)"
    />
    <rect
      x="3"
      y="3"
      width="2"
      height="2"
      fill="var(--heart-leaf-stroke, #a83254)"
    />
  </svg>
);

const ButterflySVG = ({ isLanded }: { isLanded: boolean }) => (
  <svg viewBox="0 0 10 10" width="16" height="16" style={{ display: "block" }}>
    <g
      style={{
        transformOrigin: "5px 5px",
        animation: isLanded ? "none" : "wingFlap 0.25s infinite ease-in-out",
      }}
    >
      <rect x="1" y="2" width="4" height="3" fill="#ff9f43" />
      <rect x="2" y="5" width="3" height="3" fill="#ffb74d" />
      <rect x="2" y="3" width="1" height="1" fill="#fff" />
    </g>
    <g
      style={{
        transformOrigin: "5px 5px",
        animation: isLanded ? "none" : "wingFlap 0.25s infinite ease-in-out",
        animationDelay: "0.08s",
      }}
    >
      <rect x="5" y="2" width="4" height="3" fill="#ff9f43" />
      <rect x="5" y="5" width="3" height="3" fill="#ffb74d" />
      <rect x="7" y="3" width="1" height="1" fill="#fff" />
    </g>
    <rect x="4" y="1" width="2" height="8" fill="#5c3d24" />
    <rect x="4" y="2" width="2" height="2" fill="#2e1a0c" />
  </svg>
);

const BirdSVG = ({ isLanded }: { isLanded: boolean }) => (
  <svg viewBox="0 0 10 10" width="16" height="16" style={{ display: "block" }}>
    <rect x="2" y="3" width="6" height="5" fill="#54a0ff" />
    <rect x="5" y="1" width="4" height="4" fill="#54a0ff" />
    <rect x="7" y="2" width="1" height="1" fill="#000" />
    <rect x="9" y="2" width="1" height="1" fill="#ff9f43" />
    <rect
      x="3"
      y="4"
      width="3"
      height="3"
      fill="#2e86de"
      style={{
        transformOrigin: "3px 4px",
        animation: isLanded
          ? "none"
          : "birdWingFlap 0.15s infinite ease-in-out",
      }}
    />
    <rect x="1" y="5" width="1" height="2" fill="#2e86de" />
  </svg>
);

const LadybugSVG = () => (
  <svg viewBox="0 0 8 8" width="12" height="12" style={{ display: "block" }}>
    <rect x="3" y="1" width="2" height="1" fill="#222" />
    <rect x="1" y="2" width="6" height="5" fill="#ee5253" />
    <rect x="2" y="1" width="4" height="1" fill="#222" />
    <rect x="3" y="2" width="2" height="5" fill="#222" />
    <rect x="2" y="3" width="1" height="1" fill="#222" />
    <rect x="5" y="3" width="1" height="1" fill="#222" />
    <rect x="2" y="5" width="1" height="1" fill="#222" />
    <rect x="5" y="5" width="1" height="1" fill="#222" />
    <rect x="0" y="3" width="1" height="1" fill="#222" />
    <rect x="0" y="5" width="1" height="1" fill="#222" />
    <rect x="7" y="3" width="1" height="1" fill="#222" />
    <rect x="7" y="5" width="1" height="1" fill="#222" />
  </svg>
);

const BeeSVG = ({ isLanded }: { isLanded: boolean }) => (
  <svg viewBox="0 0 10 10" width="14" height="14" style={{ display: "block" }}>
    <g
      style={{
        transformOrigin: "5px 4px",
        animation: isLanded ? "none" : "wingFlap 0.1s infinite linear",
      }}
    >
      <rect x="2" y="1" width="3" height="3" fill="#fff" opacity="0.7" />
      <rect x="5" y="1" width="3" height="3" fill="#fff" opacity="0.7" />
    </g>
    <rect x="2" y="4" width="6" height="4" fill="#feca57" />
    <rect x="3" y="4" width="1" height="4" fill="#2d3436" />
    <rect x="5" y="4" width="1" height="4" fill="#2d3436" />
    <rect x="7" y="4" width="1" height="4" fill="#2d3436" />
    <rect x="8" y="5" width="1" height="1" fill="#2d3436" />
    <rect x="1" y="5" width="1" height="1" fill="#2d3436" />
  </svg>
);

const FLOWER_POSITIONS = [
  { id: 1, top: "5.5%", left: "5.5%", scale: 1.0, activeInAutumn: true },
  { id: 2, top: "4%", left: "13%", scale: 0.75, activeInAutumn: false },
  { id: 3, top: "11%", left: "4.5%", scale: 0.7, activeInAutumn: false },
  { id: 4, top: "5.5%", right: "5.5%", scale: 1.0, activeInAutumn: true },
  { id: 5, top: "4%", right: "13%", scale: 0.75, activeInAutumn: false },
  { id: 6, top: "11%", right: "4.5%", scale: 0.7, activeInAutumn: false },
  { id: 7, bottom: "5.5%", left: "5.5%", scale: 1.1, activeInAutumn: true },
  { id: 8, bottom: "4%", left: "14%", scale: 0.8, activeInAutumn: false },
  { id: 9, bottom: "12%", left: "4.5%", scale: 0.7, activeInAutumn: false },
  { id: 10, bottom: "5.5%", right: "5.5%", scale: 1.1, activeInAutumn: true },
  { id: 11, bottom: "4%", right: "14%", scale: 0.8, activeInAutumn: false },
  { id: 12, bottom: "12%", right: "4.5%", scale: 0.7, activeInAutumn: false },
];

const ParticleVisual = ({ particle }: { particle: GardenParticle }) => {
  return (
    <>
      <div className="particle-visual visual-leaf">
        {particle.id % 4 === 0 ? (
          <DoubleHeartLeafSVG />
        ) : particle.id % 4 === 2 ? (
          <PixelHeartLeafSVG />
        ) : (
          <img
            src={particle.id % 2 === 0 ? heartLeaf : leaf}
            alt=""
            draggable={false}
          />
        )}
      </div>
      <div className="particle-visual visual-petal">
        <svg
          viewBox="0 0 8 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}
        >
          <rect x="3" y="1" width="2" height="6" fill="#fca1b0" />
          <rect x="1" y="3" width="6" height="2" fill="#fca1b0" />
          <rect x="2" y="2" width="4" height="4" fill="#ffb7c5" />
          <rect x="3" y="3" width="2" height="2" fill="#ffe066" />
        </svg>
      </div>
      <div className="particle-visual visual-autumn-leaf">
        {particle.id % 4 === 0 ? (
          <DoubleHeartLeafSVG />
        ) : particle.id % 4 === 2 ? (
          <PixelHeartLeafSVG />
        ) : (
          <img
            src={particle.id % 2 === 0 ? heartLeaf : leaf}
            alt=""
            draggable={false}
          />
        )}
      </div>
      <div className="particle-visual visual-snowflake">
        <svg
          viewBox="0 0 8 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}
        >
          <path d="M3 0h2v8H3z" fill="#f0f8ff" />
          <path d="M0 3h8v2H0z" fill="#f0f8ff" />
          <path
            d="M1 1h2v2H1zm4 0h2v2H5zm0 4h2v2H5zm-4 0h2v2H1z"
            fill="#f0f8ff"
          />
        </svg>
      </div>
      <div className="particle-visual visual-frost">
        <svg
          viewBox="0 0 6 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}
        >
          <path d="M3 0L5 3L3 6L1 3Z" fill="#e0f2fe" opacity="0.85" />
        </svg>
      </div>
      <div className="particle-visual visual-summer-firefly">
        <div
          className="firefly-pixel-body"
          style={{
            backgroundColor: "#ffe46b",
            boxShadow: "0 0 6px #ffe46b",
            borderRadius: "50%",
          }}
        />
      </div>
    </>
  );
};

const SeasonalFlowers = ({
  season,
  intensity,
  specialBloomsActive,
}: {
  season: string;
  intensity: string;
  specialBloomsActive: boolean;
}) => {
  return (
    <div className="seasonal-flowers-layer">
      {FLOWER_POSITIONS.map((pos) => {
        let isActive = false;
        if (specialBloomsActive) {
          isActive = true;
        } else if (season === "spring") {
          isActive = true;
        } else if (season === "summer") {
          isActive = [1, 2, 4, 5, 7, 8, 10, 11].includes(pos.id);
        } else if (season === "autumn") {
          isActive = pos.activeInAutumn;
        }

        if (!specialBloomsActive && intensity === "low" && pos.id % 2 === 0) {
          isActive = false;
        }

        const style: React.CSSProperties = {
          transform: `scale(${pos.scale})`,
          animationDelay: `${(pos.id * 0.25).toFixed(2)}s`,
        };

        if (pos.top) style.top = pos.top;
        if (pos.bottom) style.bottom = pos.bottom;
        if (pos.left) style.left = pos.left;
        if (pos.right) style.right = pos.right;

        return (
          <div
            key={pos.id}
            className={`seasonal-flower ${isActive ? "active" : ""}`}
            style={style}
          >
            <svg
              viewBox="0 0 7 7"
              width="16"
              height="16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block" }}
            >
              <rect x="2" y="0" width="3" height="2" fill="currentColor" />
              <rect x="0" y="2" width="2" height="3" fill="currentColor" />
              <rect x="5" y="2" width="2" height="3" fill="currentColor" />
              <rect x="2" y="5" width="3" height="2" fill="currentColor" />
              <rect x="2" y="2" width="3" height="3" fill="#ffe066" />
            </svg>
          </div>
        );
      })}
    </div>
  );
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
        style={{
          cursor: "pointer",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "calc(4 / 306 * 100vw)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onLogoClick();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        data-tauri-drag-region
      >
        Moni's Garden
      </div>

      <div
        className="nature-top-bar-center"
        onMouseDown={(e) => e.stopPropagation()}
      >
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
            <div className="nature-fallback-art" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#d4dfc7" }}>
              <img
                src={logoImg}
                alt="Moni's Garden logo"
                draggable={false}
                style={{ width: "75%", height: "75%", objectFit: "contain" }}
              />
            </div>
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
    <div
      className="nature-progress-section"
      onMouseDown={(e) => e.stopPropagation()}
    >
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
            width:
              progress > 0
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
            width:
              volumeVal > 0
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
  const [savedPlaylistUrl, setSavedPlaylistUrl] = useState<string | null>(() =>
    localStorage.getItem("neonPlayer:lastYoutubePlaylistUrl"),
  );
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(() =>
    localStorage.getItem("neonPlayer:lastYoutubePlaylistId"),
  );
  const [savedPlaylistTitle, setSavedPlaylistTitle] = useState<string | null>(
    () => localStorage.getItem("neonPlayer:lastYoutubePlaylistTitle"),
  );
  const [savedPlaylistLoadedAt, setSavedPlaylistLoadedAt] = useState<
    string | null
  >(() => localStorage.getItem("neonPlayer:lastYoutubePlaylistLoadedAt"));
  const [isRefreshingPlaylist, setIsRefreshingPlaylist] = useState(false);
  const [playlistStatusMessage, setPlaylistStatusMessage] = useState<
    string | null
  >(null);

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
  const [settingsPanelContainer, setSettingsPanelContainer] =
    useState<HTMLDivElement | null>(null);

  const [fireflyActive, setFireflyActive] = useState(false);
  const [season, setSeason] = useState<string>(
    () => localStorage.getItem("monis_garden_season") || "spring",
  );
  const [animationIntensity, setAnimationIntensity] = useState<string>(
    () => localStorage.getItem("monis_garden_animation_intensity") || "normal",
  );

  // Personalization settings and state
  const [quotesEnabled, setQuotesEnabled] = useState(() => {
    return localStorage.getItem("monis_garden_magic_quotes") !== "false";
  });
  const [moniNotesEnabled, setMoniNotesEnabled] = useState(() => {
    return localStorage.getItem("monis_garden_moni_notes") !== "false";
  });
  const [companionsEnabled, setCompanionsEnabled] = useState(() => {
    return localStorage.getItem("monis_garden_companions") !== "false";
  });
  const [specialEventsEnabled, setSpecialEventsEnabled] = useState(() => {
    return localStorage.getItem("monis_garden_special_events") !== "false";
  });

  const [ambientMessage, setAmbientMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"note" | "quote" | null>(null);

  interface CompanionState {
    type: "butterfly" | "bird" | "ladybug" | "bee";
    x: number;
    y: number;
    rotation: number;
    isLanded: boolean;
    opacity: number;
  }
  const [companion, setCompanion] = useState<CompanionState | null>(null);

  const [visitCount, setVisitCount] = useState(0);

  // Hidden achievements trigger tracking
  const seasonClicksRef = useRef(0);
  const fireflyClicksRef = useRef(0);
  const songSkipsRef = useRef(0);

  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(
    () => {
      try {
        const saved = localStorage.getItem(
          "monis_garden_unlocked_achievements",
        );
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    },
  );

  interface ActiveAchievement {
    title: string;
    description: string;
  }
  const [activeAchievement, setActiveAchievement] =
    useState<ActiveAchievement | null>(null);

  // Special events states
  const [specialEventText, setSpecialEventText] = useState<string | null>(null);
  const [specialBreezeActive, setSpecialBreezeActive] = useState(false);
  const [specialBloomsActive, setSpecialBloomsActive] = useState(false);
  const [specialThankGlowActive, setSpecialThankGlowActive] = useState(false);

  const companionTimeoutsRef = useRef<number[]>([]);

  const unlockAchievement = (title: string, description: string) => {
    setUnlockedAchievements((prev) => {
      if (prev.includes(title)) return prev;
      const next = [...prev, title];
      localStorage.setItem(
        "monis_garden_unlocked_achievements",
        JSON.stringify(next),
      );

      setActiveAchievement({ title, description });
      setTimeout(() => {
        setActiveAchievement(null);
      }, 4500);

      return next;
    });
  };

  // Scheduler for companions, ambient messages, and special events
  useEffect(() => {
    const clearCompanionTimeouts = () => {
      companionTimeoutsRef.current.forEach((id) => clearTimeout(id));
      companionTimeoutsRef.current = [];
    };

    // 1. Ambient Message Scheduler (Runs every 45s, chooses note or quote)
    const messageInterval = setInterval(() => {
      if (ambientMessage) return; // Wait if already showing

      const roll = Math.random();
      if (moniNotesEnabled && roll < 0.08) {
        const msg = MONI_NOTES[Math.floor(Math.random() * MONI_NOTES.length)];
        setAmbientMessage(msg);
        setMessageType("note");
        setTimeout(() => {
          setAmbientMessage(null);
          setMessageType(null);
        }, 8000);
      } else if (quotesEnabled && roll < 0.35) {
        const msg =
          GARDEN_QUOTES[Math.floor(Math.random() * GARDEN_QUOTES.length)];
        setAmbientMessage(msg);
        setMessageType("quote");
        setTimeout(() => {
          setAmbientMessage(null);
          setMessageType(null);
        }, 8000);
      }
    }, 45000);

    // 2. Companion Spawner (Runs every 75s, 35% chance to wander)
    const companionInterval = setInterval(() => {
      if (!companionsEnabled || companion) return;

      if (Math.random() < 0.35) {
        clearCompanionTimeouts();

        const types: ("butterfly" | "bird" | "ladybug" | "bee")[] = [
          "butterfly",
          "bird",
          "ladybug",
          "bee",
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        const isLeft = Math.random() > 0.5;

        setCompanion({
          type,
          x: isLeft ? -10 : 110,
          y: Math.random() * 60 + 20,
          rotation: isLeft ? 45 : -45,
          isLanded: false,
          opacity: 0,
        });

        // Step 1: Fly/Crawl on-screen
        const t1 = window.setTimeout(() => {
          setCompanion((prev) =>
            prev
              ? {
                  ...prev,
                  x: isLeft ? 15 : 85,
                  y: Math.random() * 40 + 25,
                  rotation: isLeft ? 20 : -20,
                  opacity: 1,
                }
              : null,
          );
        }, 200);
        companionTimeoutsRef.current.push(t1);

        // Step 2: Land briefly
        const t2 = window.setTimeout(() => {
          setCompanion((prev) =>
            prev
              ? {
                  ...prev,
                  x: isLeft ? 7 : 93,
                  y: 12,
                  rotation: 0,
                  isLanded: true,
                }
              : null,
          );
        }, 3800);
        companionTimeoutsRef.current.push(t2);

        // Step 3: Wander to another corner
        const t3 = window.setTimeout(() => {
          setCompanion((prev) =>
            prev
              ? {
                  ...prev,
                  x: isLeft ? 88 : 12,
                  y: 84,
                  rotation: isLeft ? 135 : -135,
                  isLanded: false,
                }
              : null,
          );
        }, 8800);
        companionTimeoutsRef.current.push(t3);

        // Step 4: Land again
        const t4 = window.setTimeout(() => {
          setCompanion((prev) =>
            prev
              ? {
                  ...prev,
                  x: isLeft ? 93 : 7,
                  y: 89,
                  rotation: 0,
                  isLanded: true,
                }
              : null,
          );
        }, 12800);
        companionTimeoutsRef.current.push(t4);

        // Step 5: Leave off-screen
        const t5 = window.setTimeout(() => {
          setCompanion((prev) =>
            prev
              ? {
                  ...prev,
                  x: isLeft ? 110 : -10,
                  y: Math.random() * 60 + 20,
                  rotation: isLeft ? 45 : -45,
                  isLanded: false,
                }
              : null,
          );
        }, 17800);
        companionTimeoutsRef.current.push(t5);

        // Step 6: Cleanup
        const t6 = window.setTimeout(() => {
          setCompanion(null);
        }, 21500);
        companionTimeoutsRef.current.push(t6);
      }
    }, 75000);

    // 3. Special Event Spawner (Runs every 150s, 3% chance)
    const specialEventInterval = setInterval(() => {
      if (!specialEventsEnabled || specialEventText) return;

      if (Math.random() < 0.03) {
        const event =
          SPECIAL_EVENTS[Math.floor(Math.random() * SPECIAL_EVENTS.length)];
        setSpecialEventText(event.text);

        if (event.type === "breeze") {
          setSpecialBreezeActive(true);
        } else if (event.type === "blooms") {
          setSpecialBloomsActive(true);
        } else if (event.type === "thank") {
          setSpecialThankGlowActive(true);
        }

        setTimeout(() => {
          setSpecialEventText(null);
          setSpecialBreezeActive(false);
          setSpecialBloomsActive(false);
          setSpecialThankGlowActive(false);
        }, 10000);
      }
    }, 150000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(companionInterval);
      clearInterval(specialEventInterval);
      clearCompanionTimeouts();
    };
  }, [
    quotesEnabled,
    moniNotesEnabled,
    companionsEnabled,
    specialEventsEnabled,
    companion,
    ambientMessage,
    specialEventText,
  ]);

  // Load & Increment passive visit count on mount
  useEffect(() => {
    const visitsStr = localStorage.getItem("monis_garden_visit_count") || "0";
    const nextVisits = parseInt(visitsStr, 10) + 1;
    localStorage.setItem("monis_garden_visit_count", String(nextVisits));
    setVisitCount(nextVisits);

    if (nextVisits >= 5) {
      setTimeout(() => {
        unlockAchievement("Garden Visitor", "Visited the garden 5 times.");
      }, 3000);
    }
  }, []);

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
      if (isManual) {
        songSkipsRef.current += 1;
        if (songSkipsRef.current >= 5) {
          unlockAchievement(
            "Music Wanderer",
            "Explored different melodies in the garden.",
          );
        }
      }
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
      setIsPlaying(shouldAutoPlay);

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
    songSkipsRef.current += 1;
    if (songSkipsRef.current >= 5) {
      unlockAchievement(
        "Music Wanderer",
        "Explored different melodies in the garden.",
      );
    }
    const shouldAutoPlay = isPlaying;
    setPendingAutoPlay(shouldAutoPlay);
    setIsPlaying(shouldAutoPlay);

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
        const unlocked =
          localStorage.getItem("forestFriendUnlocked") === "true";
        if (!unlocked) {
          setCompletedCount((prev) => {
            const next = prev + 1;
            localStorage.setItem(
              "monis_garden_completed_count",
              next.toString(),
            );
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
        let wrapper = inner.querySelector(
          ".nature-about-btn-wrapper",
        ) as HTMLDivElement;
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
  const saveLastYoutubePlaylist = ({
    url,
    playlistId,
    title,
  }: {
    url: string;
    playlistId: string;
    title: string;
  }) => {
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
    const activePlaylistId =
      savedPlaylistId ||
      localStorage.getItem("neonPlayer:lastYoutubePlaylistId");
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
        setErrorMessage(
          "Could not refresh the playlist. It may no longer exist.",
        );
        setIsRefreshingPlaylist(false);
        setPlaylistStatusMessage(null);
        return;
      }

      const currentSong = playlist[currentTrackIndex];
      let newTrackIndex = 0;
      let keepPlayingState = isPlaying;

      if (currentSong) {
        const foundIndex = items.findIndex(
          (item) =>
            item.videoId === currentSong.videoId || item.id === currentSong.id,
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

      const title =
        (await fetchPlaylistTitle(activePlaylistId)) ||
        savedPlaylistTitle ||
        "YouTube Playlist";
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

          const savedUrl = localStorage.getItem(
            "neonPlayer:lastYoutubePlaylistUrl",
          );
          if (savedUrl) {
            setYoutubeUrl(savedUrl);
          }
        } else {
          setErrorMessage(
            "Saved playlist could not be loaded. It may no longer exist.",
          );
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

        const title =
          (await fetchPlaylistTitle(playlistId)) || "YouTube Playlist";
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
      if (next >= 3) {
        setShowSecretModal(true);
        setExtraLeaves(true);
        unlockAchievement(
          "Heart Collector",
          "Found the secret leaf breeze easter egg.",
        );
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
        className={`player nature-theme-container ${fireflyActive ? "firefly-mode" : ""} season-${season} intensity-${animationIntensity} ${specialThankGlowActive ? "special-thank-glow" : ""}`}
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
        <div
          className={`nature-fireflies-layer ${fireflyActive ? "is-visible" : ""}`}
          aria-hidden="true"
        >
          {GENERATED_FIREFLIES.slice(
            0,
            getFirefliesCount(animationIntensity, season),
          ).map((f) => (
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

          {/* Personalization Overlays */}
          {activeAchievement && (
            <div className="achievement-toast">
              <div className="achievement-toast-header">
                🌿 Hidden Achievement Unlocked!
              </div>
              <div className="achievement-toast-body">
                <strong>{activeAchievement.title}</strong>:{" "}
                {activeAchievement.description}
              </div>
            </div>
          )}

          {ambientMessage && (
            <div
              className={`ambient-message ${messageType === "note" ? "is-moni-note" : "is-garden-quote"}`}
            >
              {ambientMessage}
            </div>
          )}

          {specialEventText && (
            <div className="special-event-overlay">
              <div className="special-event-text">{specialEventText}</div>
            </div>
          )}

          {companion && (
            <div
              className={`forest-companion companion-${companion.type} ${companion.isLanded ? "landed" : ""}`}
              style={{
                position: "absolute",
                left: `${companion.x}%`,
                top: `${companion.y}%`,
                opacity: companion.opacity,
                transform: `translate(-50%, -50%) rotate(${companion.rotation}deg)`,
                transition:
                  "left 3s ease-in-out, top 3s ease-in-out, transform 1.5s ease-in-out, opacity 1s ease-in-out",
                zIndex: 8,
                pointerEvents: "none",
              }}
            >
              {companion.type === "butterfly" && (
                <ButterflySVG isLanded={companion.isLanded} />
              )}
              {companion.type === "bird" && (
                <BirdSVG isLanded={companion.isLanded} />
              )}
              {companion.type === "ladybug" && <LadybugSVG />}
              {companion.type === "bee" && (
                <BeeSVG isLanded={companion.isLanded} />
              )}
            </div>
          )}

          {/* Botanical Nature Overlay Frame Layer */}
          <div className="nature-frame-layer">
            <img
              src={frameNoBackground}
              className="nature-frame-image"
              alt=""
              draggable={false}
            />
          </div>

          {/* Dynamic Living Garden Particles Layer */}
          <div className="garden-particles-layer" aria-hidden="true">
            {GENERATED_PARTICLES.map((p, index) => {
              const isActive =
                index < getParticlesCount(animationIntensity, season);
              return (
                <div
                  key={p.id}
                  className={`garden-particle size-${p.size} drift-${p.driftVariant} ${isActive ? "visible" : ""}`}
                  style={{
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${(28 * p.speed).toFixed(1)}s`,
                  }}
                >
                  <ParticleVisual particle={p} />
                </div>
              );
            })}

            {/* Special Spawn of Extra Particles (Easter Egg or Special Breeze) */}
            {(extraLeaves || specialBreezeActive) && (
              <div className="extra-leaves-container">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const id = 100 + idx;
                  const size = idx % 3 === 0 ? "s" : idx % 3 === 1 ? "m" : "l";
                  const letter = ["a", "b", "c", "d", "e", "f"][idx];
                  return (
                    <div
                      key={id}
                      className={`garden-particle size-${size} drift-${letter} visible`}
                      style={{
                        left: `${((idx * 15) % 80) + 10}%`,
                        top: "-5%",
                        animationDelay: "0s",
                      }}
                    >
                      <ParticleVisual particle={{ id, size } as any} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seasonal Flowers Layer Overlaid on Botanical Frame */}
          <SeasonalFlowers
            season={season}
            intensity={animationIntensity}
            specialBloomsActive={specialBloomsActive}
          />

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
            onToggleFirefly={() => {
              setFireflyActive((prev) => !prev);
              fireflyClicksRef.current += 1;
              if (fireflyClicksRef.current >= 3) {
                unlockAchievement(
                  "Firefly Friend",
                  "Embraced the night forest glow.",
                );
              }
            }}
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
                      setIsPlaying(shouldAutoPlay);
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
                      seasonClicksRef.current += 1;
                      if (seasonClicksRef.current >= 3) {
                        unlockAchievement(
                          "Forest Explorer",
                          "Explored the seasonal magic of the forest.",
                        );
                      }
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
                      localStorage.setItem(
                        "monis_garden_animation_intensity",
                        intensity,
                      );
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
                          <div
                            className="saved-playlist-meta"
                            title={savedPlaylistUrl}
                          >
                            url: {savedPlaylistUrl}
                          </div>
                        )}
                        {savedPlaylistLoadedAt && (
                          <div className="saved-playlist-meta">
                            loaded:{" "}
                            {new Date(savedPlaylistLoadedAt).toLocaleString()}
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

              {/* Garden Magic Custom Section */}
              <div className="settings-label" style={{ marginTop: "12px" }}>
                garden magic
              </div>
              <div className="settings-theme-row">
                <button
                  className={`settings-theme-btn ${quotesEnabled ? "active" : ""}`}
                  onClick={() => {
                    const nextVal = !quotesEnabled;
                    setQuotesEnabled(nextVal);
                    localStorage.setItem(
                      "monis_garden_magic_quotes",
                      String(nextVal),
                    );
                  }}
                  style={{ flex: 1, marginRight: "4px" }}
                >
                  quotes: {quotesEnabled ? "on" : "off"}
                </button>
                <button
                  className={`settings-theme-btn ${moniNotesEnabled ? "active" : ""}`}
                  onClick={() => {
                    const nextVal = !moniNotesEnabled;
                    setMoniNotesEnabled(nextVal);
                    localStorage.setItem(
                      "monis_garden_moni_notes",
                      String(nextVal),
                    );
                  }}
                  style={{ flex: 1, marginLeft: "4px" }}
                >
                  notes: {moniNotesEnabled ? "on" : "off"}
                </button>
              </div>
              <div className="settings-theme-row" style={{ marginTop: "6px" }}>
                <button
                  className={`settings-theme-btn ${companionsEnabled ? "active" : ""}`}
                  onClick={() => {
                    const nextVal = !companionsEnabled;
                    setCompanionsEnabled(nextVal);
                    localStorage.setItem(
                      "monis_garden_companions",
                      String(nextVal),
                    );
                  }}
                  style={{ flex: 1, marginRight: "4px" }}
                >
                  companions: {companionsEnabled ? "on" : "off"}
                </button>
                <button
                  className={`settings-theme-btn ${specialEventsEnabled ? "active" : ""}`}
                  onClick={() => {
                    const nextVal = !specialEventsEnabled;
                    setSpecialEventsEnabled(nextVal);
                    localStorage.setItem(
                      "monis_garden_special_events",
                      String(nextVal),
                    );
                  }}
                  style={{ flex: 1, marginLeft: "4px" }}
                >
                  events: {specialEventsEnabled ? "on" : "off"}
                </button>
              </div>

              {/* Passive Visit Counter and Unlocked Achievements */}
              <div
                className="settings-label"
                style={{
                  marginTop: "14px",
                  borderTop: "1px dashed var(--nature-accent)",
                  paddingTop: "8px",
                }}
              >
                garden stats
              </div>
              <div
                style={{
                  color: "var(--nature-dark)",
                  fontSize: "10px",
                  textAlign: "center",
                  fontFamily: "Rainyhearts",
                  lineHeight: "1.3",
                  marginBottom: "10px",
                }}
              >
                visits count: {visitCount}
                {unlockedAchievements.length > 0 && (
                  <div
                    style={{ marginTop: "4px", color: "var(--nature-accent)" }}
                  >
                    unlocked: {unlockedAchievements.join(", ").toLowerCase()}
                  </div>
                )}
              </div>

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
        {showBirthday &&
          createPortal(
            <div
              className={`nature-birthday-overlay ${birthdayFadeOut ? "fade-out" : ""}`}
              onClick={closeBirthdayOverlay}
            >
              <div
                className="nature-birthday-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="nature-birthday-title">
                  Happy Birthday Moni 🌿
                </div>
                <div className="nature-birthday-body">
                  {"May every song bring\na beautiful memory."}
                </div>
                <div
                  className="nature-birthday-footer"
                  onClick={closeBirthdayOverlay}
                >
                  Click anywhere to enter the garden
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Feature 3: Secret Moni Message Modal */}
        {showSecretModal &&
          createPortal(
            <div
              className={`nature-modal-backdrop ${secretFadeOut ? "fade-out" : ""}`}
              onClick={closeSecretModal}
            >
              <div
                className="nature-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
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
            document.body,
          )}

        {/* Feature 5: Forest Friend Achievement Modal */}
        {showAchievement &&
          createPortal(
            <div
              className={`nature-modal-backdrop ${achievementFadeOut ? "fade-out" : ""}`}
              onClick={closeAchievementModal}
            >
              <div
                className="nature-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="nature-modal-title">
                  🌿 Forest Friend Unlocked
                </div>
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
            document.body,
          )}

        {/* Feature 6: About Modal */}
        {showAboutModal &&
          createPortal(
            <div
              className={`nature-modal-backdrop ${aboutFadeOut ? "fade-out" : ""}`}
              onClick={closeAboutModal}
            >
              <div
                className="nature-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="nature-modal-title">Moni's Garden</div>
                <div className="nature-modal-body">
                  {
                    "Created for Moni 🌿\n\nThank you for inspiring\nthis little forest."
                  }
                </div>
                <button
                  className="nature-modal-button"
                  onClick={closeAboutModal}
                >
                  Return
                </button>
              </div>
            </div>,
            document.body,
          )}

        {/* Portal for About button inside Settings Panel */}
        {settingsPanelContainer &&
          createPortal(
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
            settingsPanelContainer,
          )}
      </div>
    </ErrorBoundary>
  );
}
