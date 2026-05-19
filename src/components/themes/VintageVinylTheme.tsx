import React, { useEffect, useState, useRef } from 'react';
import './VintageVinylTheme.css';
import { formatDuration } from '../../utils/time';
import { YouTubePlaylistItem } from '../../utils/youtubeApi';

const PinIcon = () => (
  <svg 
    width="100%" 
    height="100%" 
    viewBox="0 0 16 16" 
    fill="currentColor"
    style={{ imageRendering: 'pixelated' }}
  >
    <path d="M7 3h2v1H7zM6 4h4v1H6zM5 5h6v2H5zM6 7h4v1H6zM7 8v5h2V8z" />
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
      // Song changed! Trigger the vinyl swap animation
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
        {/* Top Header Row (placed OUTSIDE the turntable box!) */}
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
            />
            <button 
              className={`vintage-icon-btn btn-pin ${isPinned ? 'active' : ''}`} 
              onClick={(e) => { e.stopPropagation(); onTogglePin(); }} 
              onMouseDown={(e) => e.stopPropagation()}
              title={isPinned ? "Always on Top: ON" : "Always on Top: OFF"}
            >
              <PinIcon />
            </button>
            <button 
              className="vintage-icon-btn btn-minimize" 
              onClick={(e) => { e.stopPropagation(); onMinimize(); }} 
              onMouseDown={(e) => e.stopPropagation()}
              title="Minimize" 
            />
            <button 
              className="vintage-icon-btn btn-close" 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              onMouseDown={(e) => e.stopPropagation()}
              title="Close" 
            />
          </div>
        </div>

        {/* Record Player Box (turntable panel starting below the header) */}
        <div className="vintage-turntable-panel" onMouseDown={(e) => e.stopPropagation()}>
          {/* Top Left dial and dots details */}
          <div className="dial-top-left-group">
            <div className="dial-circle-outer">
              <div className="dial-circle-inner" />
            </div>
            <div className="dial-dots">
              <span className="dial-dot" />
              <span className="dial-dot" />
            </div>
          </div>
          
          {/* Vinyl record inside tan panel */}
          <div className={`vintage-vinyl-wrapper ${isPlaying && !isChanging ? 'vinyl-spinning' : ''} ${isChanging ? 'record-changing' : ''}`}>
            <div className="vintage-vinyl">
              <div className="vinyl-groove-1" />
              <div className="vinyl-groove-2" />
              {/* Center label with subtle album art grayscale sepia styling */}
              <div className="vinyl-center-label">
                {currentTrack.thumbnailUrl ? (
                  <img src={currentTrack.thumbnailUrl} className="vinyl-album-art" alt="" draggable={false} />
                ) : (
                  <div className="vinyl-fallback-label" />
                )}
              </div>
              <div className="vinyl-spindle-hole" />
            </div>
          </div>

          {/* Tonearm track and arm */}
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

          {/* Bottom Left decorative details */}
          <div className="dial-bottom-left-group">
            <span className="dial-btn-circle" />
            <span className="dial-btn-circle" />
            <span className="dial-btn-pill" />
          </div>

          {/* Retro Script/Brand text */}
          <div className="vintage-brand" data-tauri-drag-region>Vinilo</div>
        </div>

        {/* Now playing typography & labels */}
        <div className="vintage-now-playing" onMouseDown={(e) => e.stopPropagation()}>
          <h1 className="vintage-title" title={currentTrack.title}>
            {currentTrack.title || "No Track Loaded"}
          </h1>
          <p className="vintage-artist">
            By {currentTrack.channelTitle || "Unknown Artist"}
          </p>
        </div>

        {/* Progress seek area with vertical caps */}
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

        {/* Playback Controls & Volume Row grouped together */}
        <div className="vintage-controls-group" onMouseDown={(e) => e.stopPropagation()}>
          {/* Playback Controls */}
          <div className="vintage-controls">
            <button className="vintage-btn btn-prev" onClick={onPrev} title="Previous">
              <svg viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" fill="currentColor"/>
              </svg>
            </button>
            <button className="vintage-btn btn-play" onClick={onTogglePlay} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" fill="currentColor"/>
                </svg>
              )}
            </button>
            <button className="vintage-btn btn-next" onClick={onNext} title="Next">
              <svg viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6zm9-12v12h2V6z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          {/* Retro Volume Controls Row */}
          <div className="vintage-volume-row">
            <button 
              className={`vintage-volume-btn ${muted ? 'muted' : ''}`} 
              onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <svg viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.03a11.12 11.12 0 0 0 3.73-1.68L19.73 21 21 19.73 12 10.73 4.27 3zM12 4 9.91 6.09 12 8.18V4z" fill="currentColor"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                </svg>
              )}
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

        {/* Monochrome Footer printed label */}
        <div className="vintage-footer">
          Calle Antonino Vera 43, Elda
        </div>
      </div>
    </div>
  );
}
