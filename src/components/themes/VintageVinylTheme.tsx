import React, { useEffect, useState, useRef } from 'react';
import './VintageVinylTheme.css';
import { formatDuration } from '../../utils/time';
import { YouTubePlaylistItem } from '../../utils/youtubeApi';

// Clean SVG Icons to match mockup
const SettingsIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
  </svg>
);

const UpArrowIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
    <path d="M12 18V6M7 11l5-5 5 5" />
  </svg>
);

const MinimizeIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="11" width="14" height="2.5" />
  </svg>
);

const CloseIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
    <path d="M7 7l10 10M17 7L7 17" />
  </svg>
);

const PrevIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="6" width="3" height="12" />
    <polygon points="19,6 9,12 19,18" />
  </svg>
);

const PlayIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="7,5 20,12 7,19" />
  </svg>
);

const PauseIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="5" width="4" height="14" />
    <rect x="14" y="5" width="4" height="14" />
  </svg>
);

const NextIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,6 15,12 5,18" />
    <rect x="16" y="6" width="3" height="12" />
  </svg>
);

const VolumeIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <rect x="14" y="9" width="2" height="6" />
    <rect x="18" y="7" width="2" height="10" />
  </svg>
);

const VolumeMuteIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <path d="M15 9l4 6M19 9l-4 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
  </svg>
);

interface VintageVinylThemeProps {
  isPlaying: boolean;
  currentTrack: YouTubePlaylistItem;
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
}

export default function VintageVinylTheme({
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
}: VintageVinylThemeProps) {
  const [isChanging, setIsChanging] = useState(false);
  const prevTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const trackId = currentTrack.id;
    if (prevTrackIdRef.current !== null && prevTrackIdRef.current !== trackId) {
      setIsChanging(true);
      const timer = setTimeout(() => {
        setIsChanging(false);
      }, 800);
      return () => clearTimeout(timer);
    }
    prevTrackIdRef.current = trackId;
  }, [currentTrack.id]);

  const progress = duration > 0 ? currentTime / duration : 0;

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const progressContainer = e.currentTarget;
    const progressLine = progressContainer.querySelector('.progress-line');
    if (!progressLine) return;

    const getPct = (clientX: number) => {
      const lineRect = progressLine.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - lineRect.left) / lineRect.width));
    };

    const pct = getPct(e.clientX);
    seek(pct);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const movePct = getPct(moveEvent.clientX);
      seek(movePct);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="vintage-theme-container">
      <div className="vintage-card" data-tauri-drag-region>
        <div className="vintage-top-bar" data-tauri-drag-region>
          <div className="vintage-logo" data-tauri-drag-region>neon</div>
          <button 
            className={`vintage-songs-btn ${showPlaylistSongs ? 'active' : ''}`} 
            onClick={(e) => { e.stopPropagation(); onTogglePlaylist(); }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            ♫ songs
          </button>
          <div className="vintage-top-controls" onMouseDown={(e) => e.stopPropagation()}>
            <button 
              className={`vintage-icon-btn btn-settings ${showSettings ? 'active' : ''}`} 
              onClick={(e) => { e.stopPropagation(); onToggleSettings(); }} 
              onMouseDown={(e) => e.stopPropagation()}
              title="Settings" 
            >
              <SettingsIcon />
            </button>
            <button 
              className={`vintage-icon-btn btn-pin ${isPinned ? 'active' : ''}`} 
              onClick={(e) => { e.stopPropagation(); onTogglePin(); }} 
              onMouseDown={(e) => e.stopPropagation()}
              title={isPinned ? "Always on Top: ON" : "Always on Top: OFF"}
            >
              <UpArrowIcon />
            </button>
            <button 
              className="vintage-icon-btn btn-minimize" 
              onClick={(e) => { e.stopPropagation(); onMinimize(); }} 
              onMouseDown={(e) => e.stopPropagation()}
              title="Minimize" 
            >
              <MinimizeIcon />
            </button>
            <button 
              className="vintage-icon-btn btn-close" 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              onMouseDown={(e) => e.stopPropagation()}
              title="Close" 
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="vintage-turntable-panel" onMouseDown={(e) => e.stopPropagation()}>
          <div className="dial-top-left-group">
            <div className="dial-circle-outer">
              <div className="dial-circle-inner" />
            </div>
            <div className="dial-dots">
              <span className="dial-dot" />
              <span className="dial-dot" />
            </div>
          </div>
          
          <div className={`vintage-vinyl-wrapper ${isPlaying && !isChanging ? 'vinyl-spinning' : ''} ${isChanging ? 'record-changing' : ''}`}>
            <div className="vintage-vinyl">
              <div className="vinyl-groove-1" />
              <div className="vinyl-groove-2" />
              <div className="vinyl-center-label">
                {currentTrack.thumbnailUrl ? (
                  <img src={currentTrack.thumbnailUrl} className="vinyl-album-art" alt="" draggable={false} />
                ) : (
                  <div className="vinyl-fallback-label" />
                )}
                <div className="vinyl-spindle-hole" />
              </div>
            </div>
          </div>

          <div className="vintage-tonearm-track">
            <div className="track-cap-top" />
            <div className="track-line" />
            <div className="track-cap-bottom" />
          </div>
          <div className={`vintage-tonearm-container ${isPlaying && !isChanging ? 'tonearm-playing' : ''}`}>
            <div className="tonearm-pivot" />
            <div className="tonearm-arm" />
            <div className="tonearm-head" />
          </div>

          <div className="dial-bottom-left-group">
            <span className="dial-btn-circle" />
            <span className="dial-btn-circle" />
            <span className="dial-btn-pill" />
          </div>

          <div className="vintage-brand" data-tauri-drag-region>Vinilo</div>
        </div>

        <div className="vintage-now-playing" onMouseDown={(e) => e.stopPropagation()}>
          <h1 className="vintage-title" title={currentTrack.title}>
            {currentTrack.title || "No Track Loaded"}
          </h1>
          <p className="vintage-artist">
            By {currentTrack.channelTitle || "Unknown Artist"}
          </p>
        </div>

        <div className="vintage-progress-container" onMouseDown={(e) => { e.stopPropagation(); handleProgressMouseDown(e); }}>
          <div className="progress-line-wrapper">
            <div className="progress-cap-left" />
            <div className="progress-line">
              <div className="progress-line-fill" style={{ width: `${progress * 100}%` }} />
              <div className="progress-knob" style={{ left: `${progress * 100}%` }} />
            </div>
            <div className="progress-cap-right" />
          </div>
          <div className="vintage-time-row">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="vintage-controls-group" onMouseDown={(e) => e.stopPropagation()}>
          <div className="vintage-controls">
            <button className="vintage-btn btn-prev" onClick={onPrev} title="Previous">
              <PrevIcon />
            </button>
            <button className="vintage-btn btn-play" onClick={onTogglePlay} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button className="vintage-btn btn-next" onClick={onNext} title="Next">
              <NextIcon />
            </button>
          </div>

          <div className="vintage-volume-row">
            <button 
              className={`vintage-volume-btn ${muted ? 'muted' : ''}`} 
              onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeMuteIcon /> : <VolumeIcon />}
            </button>
            <div className="vintage-volume-slider-wrapper">
              <input 
                type="range"
                min="0"
                max="100"
                value={muted ? 0 : Math.round(volume * 100)}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value) / 100;
                  onChangeVolume(newVolume);
                }}
                className="vintage-volume-slider"
              />
            </div>
          </div>
        </div>

        <div className="vintage-footer">
          Calle Antonino Vera 43, Elda
        </div>
      </div>
    </div>
  );
}


