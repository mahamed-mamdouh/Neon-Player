import React from "react";
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

const NatureHeader = ({
  showPlaylistSongs,
  onTogglePlaylist,
  showSettings,
  onToggleSettings,
  isPinned,
  onTogglePin,
  onMinimize,
  onClose,
}: {
  showPlaylistSongs: boolean;
  onTogglePlaylist: () => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onMinimize: () => void;
  onClose: () => void;
}) => {
  return (
    <div className="nature-top-bar" data-tauri-drag-region>
      <div className="nature-logo" data-tauri-drag-region>
        neon
      </div>

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
  return (
    <div className="nature-theme-container">
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
          <img src={leaf} className="nature-floating-leaf size-s leaf-a" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-m leaf-b" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-l leaf-c" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-s leaf-d" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-m leaf-e" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-s leaf-f" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-l leaf-g" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-m leaf-h" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-s leaf-i" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-m leaf-j" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-l leaf-k" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-s leaf-l" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-m leaf-m" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-s leaf-n" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-s leaf-o" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-s leaf-p" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-s leaf-q" alt="" draggable={false} />
          <img src={leaf} className="nature-floating-leaf size-s leaf-r" alt="" draggable={false} />
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
    </div>
  );
}
