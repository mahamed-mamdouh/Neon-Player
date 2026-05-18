import { useCallback, useRef, useEffect, useState } from 'react';
import './App.css';
import useTheme from './hooks/useTheme';
import { YouTubeIframe } from './components/YouTubeIframe';
import { fetchPlaylistItems, fetchVideoDetails, YouTubePlaylistItem, extractYouTubeId } from './utils/youtubeApi';
import { formatDuration } from './utils/time';
import { resizeWindow, minimizeWindow, closeWindow } from './utils/windowApi';
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { ErrorBoundary } from './components/ErrorBoundary';

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
  const [playlist, setPlaylist] = useState<YouTubePlaylistItem[]>([
    {
      id: "sample-1",
      videoId: "dQw4w9WgXcQ",
      title: "Moonlight Pixel Serenade",
      channelTitle: "Lofi Dreamer",
      thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&h=80&q=80",
      duration: "3:45"
    },
    {
      id: "sample-2",
      videoId: "dQw4w9WgXcQ",
      title: "Chiptune Coffee Shop Vibes",
      channelTitle: "8-Bit Arcade",
      thumbnailUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=80&h=80&q=80",
      duration: "2:30"
    },
    {
      id: "sample-3",
      videoId: "dQw4w9WgXcQ",
      title: "Neon City Raindrops",
      channelTitle: "Synthwave Rider",
      thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=80&h=80&q=80",
      duration: "4:12"
    }
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Playback state & division
  const [currentMode, setCurrentMode] = useState<'local' | 'youtube'>('youtube');
  const [localAudioPath, setLocalAudioPath] = useState<string>('');
  const [localTrack, setLocalTrack] = useState<YouTubePlaylistItem>({
    id: "local-track",
    videoId: "",
    title: "No Local Audio",
    channelTitle: "Local File",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&h=80&q=80",
    duration: "0:00"
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingAutoPlay, setPendingAutoPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const wasPlayingRef = useRef(false);
  
  const [playMode, setPlayMode] = useState<'normal' | 'shuffle' | 'repeat' | 'repeat-one'>('normal');
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

  const defaultThumbnail = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&h=80&q=80";

  const rawTrack = currentMode === 'local'
    ? localTrack
    : playlist[currentTrackIndex];

  const currentTrack = {
    id: rawTrack?.id || "fallback-track-id",
    videoId: rawTrack?.videoId || "",
    title: rawTrack?.title || "Unknown title",
    channelTitle: rawTrack?.channelTitle || "Unknown artist",
    thumbnailUrl: rawTrack?.thumbnailUrl || defaultThumbnail,
    duration: rawTrack?.duration || "0:00"
  };
  
  const togglePlay = () => {
    if (currentMode === 'local' && localAudioRef.current) {
      if (isPlaying) {
        localAudioRef.current.pause();
      } else {
        localAudioRef.current.play().catch(e => console.error("Error playing local audio:", e));
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => setMuted(m => !m);

  const next = useCallback((isManual = false) => {
    const shouldAutoPlay = isPlaying;

    if (playMode === 'repeat-one' && !isManual) {
      setCurrentTime(0);
      setSeekTime(0);
      setIsPlaying(true);
      if (currentMode === 'local' && localAudioRef.current) {
        localAudioRef.current.currentTime = 0;
        localAudioRef.current.play().catch(e => console.error("Error repeating local audio:", e));
      }
      return;
    }

    setPendingAutoPlay(shouldAutoPlay);
    setIsPlaying(false);

    if (currentMode === 'local') {
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
    if (playMode === 'shuffle') {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else if ((playMode === 'repeat' || playMode === 'repeat-one') && nextIndex >= playlist.length) {
      nextIndex = 0;
    } else if (nextIndex >= playlist.length) {
      setPendingAutoPlay(false);
      return;
    }
    setCurrentTrackIndex(nextIndex);
    setCurrentTime(0);
    setSeekTime(0);
  }, [playlist.length, currentTrackIndex, playMode, currentMode, isPlaying]);

  const prev = () => {
    const shouldAutoPlay = isPlaying;
    setPendingAutoPlay(shouldAutoPlay);
    setIsPlaying(false);

    if (currentMode === 'local') {
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

    const prevIndex = currentTrackIndex - 1 < 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTime(0);
    setSeekTime(0);
  };

  const seek = (pct: number) => {
    if (duration > 0) {
      const targetTime = pct * duration;
      setSeekTime(targetTime);
      setCurrentTime(targetTime);
      if (currentMode === 'local' && localAudioRef.current) {
        localAudioRef.current.currentTime = targetTime;
      }
    }
  };

  const cyclePlayMode = useCallback(() => {
    setPlayMode((m) => {
      if (m === 'normal') return 'shuffle';
      if (m === 'shuffle') return 'repeat';
      if (m === 'repeat') return 'repeat-one';
      return 'normal';
    });
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
    if (!audio || currentMode !== 'local') return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      const durationStr = formatDuration(audio.duration);
      setLocalTrack(t => ({ ...t, duration: durationStr }));
    };
    const handleEnded = () => {
      if (playMode === 'repeat-one') {
        audio.currentTime = 0;
        setCurrentTime(0);
        audio.play().catch(e => console.error("Error repeating local audio:", e));
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

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [localAudioPath, currentMode, playMode]);

  // Autoplay local audio when track changes and pendingAutoPlay is true
  useEffect(() => {
    if (pendingAutoPlay && currentMode === 'local' && localAudioRef.current) {
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

      audio.addEventListener('canplay', onCanPlay, { once: true });
      return () => {
        audio.removeEventListener('canplay', onCanPlay);
      };
    }
  }, [currentTrack.title, pendingAutoPlay, currentMode]);

  const handleSelectLocalAudio = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Audio", extensions: ["mp3", "wav", "ogg", "m4a"] }],
      });
      if (selected && typeof selected === "string") {
        setLocalAudioPath(selected);
        const filename = selected.split('\\').pop()?.split('/').pop() || "Local File";
        
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);

        setLocalTrack({
          id: "local-track",
          videoId: "",
          title: filename,
          channelTitle: "Local Audio",
          thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&h=80&q=80",
          duration: "0:00"
        });
        setErrorMessage(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to select local file.");
    }
  };

  const handleModeChange = (mode: 'local' | 'youtube') => {
    if (mode === currentMode) return;

    if (currentMode === 'local') {
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
          setErrorMessage("Could not load this playlist. Please check the link or API key.");
          setLoading(false);
          return;
        }
        setPlaylist(items);
        setCurrentTrackIndex(0);
        setIsPlaying(false); // Disables autoplay on launch/load!
      } else {
        const id = parsed.id;
        const trackDetails = await fetchVideoDetails(id);
        if (trackDetails) {
          setPlaylist([trackDetails]);
        } else {
          setPlaylist([{
            id, videoId: id, title: "YouTube Stream", channelTitle: "Unknown Artist", thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
          }]);
        }
        setCurrentTrackIndex(0);
        setIsPlaying(false); // Disables autoplay on launch/load!
      }
      setShowSettings(false);
    } catch (err: any) {
      console.error("Failed loading YouTube content:", err);
      setErrorMessage("Could not load this playlist. Please check the link or API key.");
    } finally {
      setLoading(false);
    }
  };

  const resizeTL = useResize('top-left');
  const resizeTR = useResize('top-right');
  const resizeBL = useResize('bottom-left');
  const resizeBR = useResize('bottom-right');

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <ErrorBoundary theme={theme} assets={assets}>
      <div className={`player ${theme === 'blue' ? 'theme-blue' : ''}`}>
        {currentMode === 'youtube' && currentTrack.videoId ? (
          <YouTubeIframe 
            videoId={currentTrack.videoId}
            isPlaying={isPlaying && currentMode === 'youtube'}
            wasPlaying={wasPlayingRef.current && currentMode === 'youtube'}
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
            style={{ display: 'none' }}
          />
        )}

      <img src={assets.frame} className="layer" alt="" draggable={false} />

      <div className="window-title" data-tauri-drag-region>neon player</div>

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
        src={(playMode === 'repeat' || playMode === 'repeat-one') ? assets.repeatButton : assets.shuffleButton}
        className="layer layer-ui"
        alt=""
        draggable={false}
        style={{ opacity: playMode === 'normal' ? 0.4 : 0.8 }}
      />

      <img src={assets.minimizerButton} className="layer layer-ui minimizer-layer" alt="" draggable={false} />
      <img src={assets.windowButton} className="layer layer-ui" alt="" draggable={false} style={{ display: 'none' }} />
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
        <span className="time-current">{formatDuration(currentTime)}</span>
        <span className="time-remaining">{formatDuration(duration - currentTime)}</span>
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
      <div className="btn btn-next" onClick={() => next(true)} />

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

      <div className="btn btn-playmode" onClick={cyclePlayMode} title={playMode}>
        {playMode === 'repeat-one' && (
          <span className="repeat-one-badge">1</span>
        )}
      </div>

      <div className="btn btn-minimize" onClick={minimizeWindow} />
      <div className="btn btn-window" style={{ display: 'none' }} />
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
                  className={`playlist-panel-item ${idx === currentTrackIndex && currentMode === 'youtube' ? 'active' : ''}`}
                  onClick={() => {
                    const shouldAutoPlay = isPlaying;
                    handleModeChange('youtube');
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
                    <span className="playlist-item-artist">{item.channelTitle}</span>
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

            <div className="settings-label" style={{ marginTop: '15px' }}>mode</div>
            <div className="settings-theme-row">
              <button
                className={`settings-theme-btn ${currentMode === 'local' ? 'active' : ''}`}
                onClick={() => handleModeChange('local')}
              >
                local
              </button>
              <button
                className={`settings-theme-btn ${currentMode === 'youtube' ? 'active' : ''}`}
                onClick={() => handleModeChange('youtube')}
              >
                youtube
              </button>
            </div>

            {currentMode === 'youtube' ? (
              <>
                <div className="settings-label" style={{ marginTop: '15px' }}>youtube link</div>
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
              </>
            ) : (
              <>
                <div className="settings-label" style={{ marginTop: '15px' }}>local file</div>
                <button 
                  className="settings-theme-btn" 
                  onClick={handleSelectLocalAudio}
                  style={{ width: '100%', marginBottom: '10px' }}
                >
                  select audio file
                </button>
                {localAudioPath && (
                  <div style={{ 
                    color: 'white', 
                    fontSize: '10px', 
                    textAlign: 'center', 
                    wordBreak: 'break-all',
                    fontFamily: 'Rainyhearts',
                    opacity: 0.8
                  }}>
                    {localAudioPath.split('\\').pop()?.split('/').pop()}
                  </div>
                )}
              </>
            )}

            {errorMessage && (
              <div style={{
                color: '#ff4e6a',
                fontSize: '11px',
                marginTop: '10px',
                textAlign: 'center',
                fontFamily: 'Rainyhearts',
                lineHeight: '1.2'
              }}>
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
