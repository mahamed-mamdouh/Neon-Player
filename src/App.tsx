import { useCallback, useRef, useEffect, useState } from 'react';
import './App.css';
import useTheme from './hooks/useTheme';
import { YouTubeIframe } from './components/YouTubeIframe';
import { fetchPlaylistItems, fetchVideoDetails, YouTubePlaylistItem } from './utils/youtubeApi';
import { resizeWindow, minimizeWindow, closeWindow, toggleMaximizeWindow } from './utils/windowApi';

import progressBarStars from './assets/progress_bar_stars.png';
import star from './assets/star.png';
import starSelected from './assets/star_selected.png';

function useResize(corner: string) {
  const onMouseDown = useCallback((e: React.MouseEvent) => {
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
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [corner]);

  return onMouseDown;
}

function formatTime(seconds: number) {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function MarqueeText({ className, text }: { className: string; text: string }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    const textEl = textRef.current;
    if (!outer || !textEl) return;
    setShouldScroll(textEl.offsetWidth > outer.clientWidth);
  }, [text]);

  return (
    <div className={`${className} marquee-container`} ref={outerRef}>
      <span ref={textRef} className="marquee-measure">{text}</span>
      <span className={shouldScroll ? 'marquee-scroll' : ''}>
        {text}
        {shouldScroll && <span className="marquee-gap">{text}</span>}
      </span>
    </div>
  );
}

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showPlaylistSongs, setShowPlaylistSongs] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [playlist, setPlaylist] = useState<YouTubePlaylistItem[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  
  const [playMode, setPlayMode] = useState<'normal' | 'shuffle' | 'repeat'>('normal');
  const [volumeHovered, setVolumeHovered] = useState(false);
  const [volumeDragging, setVolumeDragging] = useState(false);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef<HTMLDivElement>(null);

  const { theme, toggleTheme, assets } = useTheme();

  const [recordFrame, setRecordFrame] = useState(0);
  const [needleFrame, setNeedleFrame] = useState(0);
  const [isPink, setIsPink] = useState(theme === 'pink');
  const [swapping, setSwapping] = useState(false);
  const [needleLifted, setNeedleLifted] = useState(false);
  const [starHovered, setStarHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  const prevTrackRef = useRef<string | null>(null);
  const [needleChangeFrame, setNeedleChangeFrame] = useState(0);

  const currentTrack = playlist[currentTrackIndex] || { title: 'No track', channelTitle: '', thumbnailUrl: '' };
  
  const togglePlay = () => setIsPlaying(p => !p);
  const toggleMute = () => setMuted(m => !m);
  const next = useCallback(() => {
    if (playlist.length === 0) return;
    let nextIndex = currentTrackIndex + 1;
    if (playMode === 'shuffle') {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else if (playMode === 'repeat' && nextIndex >= playlist.length) {
      nextIndex = 0;
    } else if (nextIndex >= playlist.length) {
      setIsPlaying(false);
      return;
    }
    setCurrentTrackIndex(nextIndex);
    setCurrentTime(0);
    setSeekTime(0);
    setIsPlaying(true);
  }, [playlist.length, currentTrackIndex, playMode]);

  const prev = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentTrackIndex - 1 < 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTime(0);
    setSeekTime(0);
    setIsPlaying(true);
  };

  const seek = (pct: number) => {
    if (duration > 0) {
      setSeekTime(pct * duration);
    }
  };

  const cyclePlayMode = useCallback(() => {
    setPlayMode((m) => m === 'normal' ? 'shuffle' : m === 'shuffle' ? 'repeat' : 'normal');
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!seekRef.current) return;
      const rect = seekRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverProgress(pct);
      seek(pct);
    };
    const onMouseUp = () => {
      setDragging(false);
      setStarHovered(false);
      setHoverProgress(null);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, duration]);

  useEffect(() => {
    if (!volumeDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!volumeBarRef.current) return;
      const rect = volumeBarRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
      setVolume(pct);
    };
    const onMouseUp = () => {
      setVolumeDragging(false);
      setVolumeHovered(false);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [volumeDragging]);

  const currentFrames = isPink ? assets.recordFramesA : assets.recordFramesB;
  const incomingFrames = isPink ? assets.recordFramesB : assets.recordFramesA;

  useEffect(() => {
    if (!isPlaying || swapping) return;
    const interval = setInterval(() => {
      setRecordFrame((f) => (f + 1) % currentFrames.length);
      setNeedleFrame((f) => (f + 1) % assets.needlePlayFrames.length);
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying, swapping, currentFrames.length, assets.needlePlayFrames.length]);

  useEffect(() => {
    if (prevTrackRef.current === currentTrack.title) return;
    const wasInitialOrPlaceholder = prevTrackRef.current === null || prevTrackRef.current === 'No track';
    prevTrackRef.current = currentTrack.title;
    if (currentTrack.title === 'No track' || wasInitialOrPlaceholder || needleLifted) return;

    setNeedleLifted(true);
    setNeedleChangeFrame(0);

    setTimeout(() => setNeedleChangeFrame(1), 200);
    setTimeout(() => setSwapping(true), 400);

    setTimeout(() => {
      setIsPink((p) => !p);
      setRecordFrame(0);
      setSwapping(false);
    }, 1000);

    setTimeout(() => {
      setNeedleChangeFrame(0);
      setNeedleLifted(false);
      setNeedleFrame(0);
    }, 1100);

  }, [currentTrack.title, needleLifted]);

  const loadYoutubeUrl = async () => {
    if (!youtubeUrl) return;
    setLoading(true);
    const listRegex = /[?&]list=([^#\&\?]+)/;
    const listMatch = youtubeUrl.match(listRegex);
    
    if (listMatch && listMatch[1]) {
      const playlistId = listMatch[1];
      const items = await fetchPlaylistItems(playlistId);
      setPlaylist(items);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    } else {
      let id = youtubeUrl;
      const regex = /(?:v=|\/v\/|embed\/|youtu\.be\/|\/shorts\/)([^"&?\/\s]{11})/i;
      const match = youtubeUrl.match(regex);
      if (match && match[1]) id = match[1];
      
      const trackDetails = await fetchVideoDetails(id);
      if (trackDetails) {
        setPlaylist([trackDetails]);
      } else {
        setPlaylist([{
          id, videoId: id, title: "YouTube Stream", channelTitle: "Unknown Artist", thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
        }]);
      }
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    }
    setLoading(false);
    setShowSettings(false);
  };

  const resizeTL = useResize('top-left');
  const resizeTR = useResize('top-right');
  const resizeBL = useResize('bottom-left');
  const resizeBR = useResize('bottom-right');

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className={`player ${theme === 'blue' ? 'theme-blue' : ''}`}>
      <YouTubeIframe 
        videoId={currentTrack.videoId}
        isPlaying={isPlaying}
        seekTime={seekTime}
        volume={volume}
        muted={muted}
        onReady={(d) => setDuration(d)}
        onProgress={(t) => setCurrentTime(t)}
        onEnd={next}
      />

      <img src={assets.frame} className="layer" alt="" draggable={false} />

      <div className="window-title">neon player</div>

      <img src={assets.recordPlayer} className="record-player" alt="" draggable={false} />
      <img
        src={currentFrames[recordFrame]}
        className={`record-player ${swapping ? 'record-slide-out' : ''}`}
        alt=""
        draggable={false}
      />
      {swapping && (
        <img
          src={incomingFrames[0]}
          className="record-player record-slide-in"
          alt=""
          draggable={false}
        />
      )}
      <img
        src={needleLifted ? assets.needleChangeFrames[needleChangeFrame] : assets.needlePlayFrames[needleFrame]}
        className="record-player"
        alt=""
        draggable={false}
      />

      <img src={assets.frameNoBg} className="layer frame-overlay" alt="" draggable={false} />
      <img src={assets.plant} className="layer layer-ui" alt="" draggable={false} />

      <img src={assets.progressBar} className="layer layer-ui" alt="" draggable={false} />
      <img
        src={progressBarStars}
        className="layer layer-ui"
        alt=""
        draggable={false}
        style={{
          clipPath: `inset(0 ${(1 - (131 + (hoverProgress ?? progress) * 226 + 10) / 512) * 100}% 0 0)`,
        }}
      />
      <img
        src={starHovered ? starSelected : star}
        className={`layer layer-ui star-indicator ${starHovered ? 'star-hovered' : ''}`}
        alt=""
        draggable={false}
        style={{
          transform: `translateX(calc(-3 / 306 * 100vw + ${(hoverProgress ?? progress) * (226 / 512) * 171.9}vw))`,
        }}
      />

      <img src={assets.backwardsButton} className="layer layer-ui" alt="" draggable={false} />
      <img src={isPlaying ? assets.pauseButton : assets.playButton} className="layer layer-ui" alt="" draggable={false} />
      <img src={assets.forwardsButton} className="layer layer-ui" alt="" draggable={false} />

      <img
        src={muted ? assets.muteButton : assets.volumeButton}
        className="layer layer-ui"
        alt=""
        draggable={false}
        style={{ opacity: 0.8 }}
      />

      <img
        src={playMode === 'repeat' ? assets.repeatButton : assets.shuffleButton}
        className="layer layer-ui"
        alt=""
        draggable={false}
        style={{ opacity: playMode === 'normal' ? 0.4 : 0.8 }}
      />

      <img src={assets.minimizerButton} className="layer layer-ui" alt="" draggable={false} />
      <img src={assets.windowButton} className="layer layer-ui" alt="" draggable={false} />
      <img src={assets.exitButton} className="layer layer-ui" alt="" draggable={false} />

      <img src={assets.settings} className="layer layer-ui settings-layer" alt="" draggable={false} />

      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="album-mask" clipPathUnits="objectBoundingBox">
            <rect x="0.07317" y="0" width="0.85366" height="1" />
            <rect x="0.04878" y="0.02439" width="0.90244" height="0.95122" />
            <rect x="0.02439" y="0.04878" width="0.95122" height="0.90244" />
            <rect x="0" y="0.07317" width="1" height="0.85366" />
          </clipPath>
        </defs>
      </svg>

      {currentTrack.thumbnailUrl && (
        <div className="album-mask">
          <img src={currentTrack.thumbnailUrl} className="album-art" alt="" draggable={false} />
        </div>
      )}

      <img src={assets.albumFrame} className="layer album-frame-layer" alt="" draggable={false} />

      <div className="now-playing">
        <div className="track-info">
          <div className="now-playing-label">now playing...</div>
          <MarqueeText className="track-title" text={currentTrack.title} />
          <div className="track-artist">by {currentTrack.channelTitle}</div>
        </div>
      </div>

      <div className="time-display">
        <span className="time-current">{formatTime(currentTime)}</span>
        <span className="time-remaining">{formatTime(duration - currentTime)}</span>
      </div>

      <div className="drag-region" data-tauri-drag-region />

      <div className="resize-handle top-left" onMouseDown={resizeTL} />
      <div className="resize-handle top-right" onMouseDown={resizeTR} />
      <div className="resize-handle bottom-left" onMouseDown={resizeBL} />
      <div className="resize-handle bottom-right" onMouseDown={resizeBR} />

      <div
        className="progress-seek"
        ref={seekRef}
        onMouseEnter={() => setStarHovered(true)}
        onMouseLeave={() => { if (!dragging) setStarHovered(false); }}
        onMouseDown={(e) => {
          e.preventDefault();
          setDragging(true);
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          setHoverProgress(pct);
          seek(pct);
        }}
      />

      <div className="btn btn-prev" onClick={prev} />
      <div className="btn btn-play" onClick={togglePlay} />
      <div className="btn btn-next" onClick={next} />

      {(volumeHovered || volumeDragging) && (
        <>
          <img src={assets.volumeBarLow} className="layer layer-ui volume-bar-layer" alt="" draggable={false} />
          <img
            src={assets.volumeBarHigh}
            className="layer layer-ui volume-bar-layer"
            alt=""
            draggable={false}
            style={{
              clipPath: `inset(${((1 - (muted ? 0 : volume)) * (420 - 338) / 512 + 338 / 512) * 100}% 0 0 0)`,
            }}
          />
        </>
      )}

      <div
        className={`volume-hover-zone ${(volumeHovered || volumeDragging) ? 'expanded' : ''}`}
        onMouseLeave={() => { if (!volumeDragging) setVolumeHovered(false); }}
      >
        <div
          className="btn-volume-icon"
          onClick={toggleMute}
          onMouseEnter={() => setVolumeHovered(true)}
        />
        {(volumeHovered || volumeDragging) && (
          <div
            className="volume-bar-area"
            ref={volumeBarRef}
            onMouseDown={(e) => {
              e.preventDefault();
              setVolumeDragging(true);
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
              setVolume(pct);
            }}
          />
        )}
      </div>

      <div className="btn btn-playmode" onClick={cyclePlayMode} title={playMode} />

      <div className="btn btn-minimize" onClick={minimizeWindow} />
      <div className="btn btn-window" onClick={toggleMaximizeWindow} />
      <div className="btn btn-exit" onClick={closeWindow} />

      <button className="btn-playlist-toggle" onClick={() => { setShowPlaylistSongs(v => !v); setShowSettings(false); }}>
        ♫ songs
      </button>

      <div className="btn btn-settings" onClick={() => { setShowSettings((v) => !v); setShowPlaylistSongs(false); }} />

      {showPlaylistSongs && (
        <div className="playlist-panel">
          <div className="playlist-panel-inner">
            <div className="settings-label">playlist tracks</div>
            {playlist.length === 0 ? (
              <div className="settings-label" style={{ opacity: 0.5, fontStyle: 'italic', marginTop: '10px' }}>
                no songs loaded
              </div>
            ) : (
              playlist.map((item, idx) => (
                <button
                  key={idx}
                  className={`playlist-panel-item ${idx === currentTrackIndex ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                >
                  {item.thumbnailUrl && (
                    <img 
                      src={item.thumbnailUrl} 
                      style={{ 
                        width: '20px', 
                        height: '15px', 
                        objectFit: 'cover', 
                        imageRendering: 'pixelated', 
                        borderRadius: '1px' 
                      }} 
                    />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {item.title}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-panel-inner" style={{ padding: '20px' }}>
            <div className="settings-label">theme</div>
            <div className="settings-theme-row">
              <button
                className={`settings-theme-btn ${theme === 'pink' ? 'active' : ''}`}
                onClick={() => { if (theme !== 'pink') toggleTheme(); }}
              >
                pink
              </button>
              <button
                className={`settings-theme-btn ${theme === 'blue' ? 'active' : ''}`}
                onClick={() => { if (theme !== 'blue') toggleTheme(); }}
              >
                blue
              </button>
            </div>
            
            <div className="settings-label" style={{ marginTop: '20px' }}>youtube link</div>
            <input 
              type="text" 
              placeholder="Paste Video or Playlist URL" 
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '4px',
                fontFamily: 'inherit',
                marginBottom: '10px'
              }}
            />
            <button 
              className="settings-theme-btn" 
              onClick={loadYoutubeUrl}
              disabled={loading}
              style={{ width: '100%', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'loading...' : 'play'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
