import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubePlayer as YTPlayer } from "react-youtube";

interface YouTubeIframeProps {
  videoId: string;
  isPlaying: boolean;
  wasPlaying: boolean;
  onReady: (duration: number) => void;
  onProgress: (currentTime: number) => void;
  onEnd: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  seekTime: number | null;
  volume: number; // 0.0 to 1.0
  muted: boolean;
}

export function YouTubeIframe({
  videoId,
  isPlaying,
  wasPlaying,
  onReady,
  onProgress,
  onEnd,
  onPlay,
  onPause,
  seekTime,
  volume,
  muted,
}: YouTubeIframeProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const prevIsPlayingRef = useRef(isPlaying);
  const [playerReady, setPlayerReady] = useState(false);

  // Reset playerReady state when videoId changes
  useEffect(() => {
    setPlayerReady(false);
  }, [videoId]);

  useEffect(() => {
    let animationFrameId: number;
    const updateProgress = async () => {
      if (!playerReady || !playerRef.current) return;
      if (isPlaying) {
        try {
          const time = await playerRef.current.getCurrentTime();
          if (time !== undefined) onProgress(time);
        } catch (e) {
          console.warn("Failed to get current play time:", e);
        }
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };
    if (isPlaying && playerReady) updateProgress();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, onProgress, playerReady]);

  // Handle play/pause commands based on isPlaying state
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    if (isPlaying && videoId) {
      const t = setTimeout(() => {
        if (playerReady && playerRef.current && isPlaying && videoId) {
          try {
            playerRef.current.playVideo();
          } catch (e) {
            console.warn("Failed to play video:", e);
          }
        }
      }, 50);
      return () => clearTimeout(t);
    } else if (!isPlaying && prevIsPlayingRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {
        console.warn("Failed to pause video:", e);
      }
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying, videoId, playerReady]);

  // Autoplay/cue on track change if wasPlaying is true
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    if (videoId && wasPlaying) {
      const t = setTimeout(() => {
        if (playerReady && playerRef.current && wasPlaying) {
          try {
            playerRef.current.playVideo();
          } catch (e) {
            console.warn("Failed to autoplay video on track change:", e);
          }
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [videoId, wasPlaying, playerReady]);

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    if (seekTime !== null && videoId) {
      try {
        playerRef.current.seekTo(seekTime, true);
      } catch (e) {
        console.warn("Failed to seek video:", e);
      }
    }
  }, [seekTime, playerReady, videoId]);

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    try {
      if (muted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        if (videoId) {
          playerRef.current.setVolume(volume * 100);
        }
      }
    } catch (e) {
      console.warn("Failed to set volume/mute:", e);
    }
  }, [volume, muted, videoId, playerReady]);

  const handlePlayerReady = (event: { target: YTPlayer }) => {
    playerRef.current = event.target;
    setPlayerReady(true);

    try {
      const iframe = event.target.getIframe();
      if (!iframe) {
        console.warn("YouTube iframe is not ready yet");
      } else {
        const currentSrc = iframe.src;
        console.log("YouTube iframe is mounted. Source:", currentSrc);
      }
    } catch (e) {
      console.warn("Could not read iframe properties yet:", e);
    }

    try {
      onReady(event.target.getDuration());
    } catch (e) {
      console.warn("Error in onReady callback:", e);
    }

    if (isPlaying && videoId) {
      try {
        event.target.playVideo();
      } catch (e) {
        console.warn("Failed to play video on ready:", e);
      }
    }

    try {
      event.target.setVolume(volume * 100);
    } catch (e) {
      console.warn("Failed to set volume on ready:", e);
    }

    try {
      if (muted) {
        event.target.mute();
      } else {
        event.target.unMute();
      }
    } catch (e) {
      console.warn("Failed to set mute state on ready:", e);
    }
  };

  const activeVideoId = videoId || "3nQNiWdeH2Q";

  return (
    <div className="hidden absolute opacity-0 pointer-events-none" style={{ display: 'none' }}>
      <YouTube
        videoId={activeVideoId}
        opts={{ height: "0", width: "0", playerVars: { autoplay: 0, controls: 0 } }}
        onReady={handlePlayerReady}
        onPlay={onPlay}
        onPause={onPause}
        onEnd={onEnd}
      />
    </div>
  );
}

