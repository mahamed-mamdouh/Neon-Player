import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubePlayer as YTPlayer } from "react-youtube";

interface YouTubeIframeProps {
  videoId: string;
  isPlaying: boolean;
  wasPlaying: boolean;
  autoPlayOnReady?: boolean;
  onReady: (duration: number) => void;
  onProgress: (currentTime: number) => void;
  onEnd: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  seekTime: number | null;
  volume: number; // 0.0 to 1.0
  muted: boolean;
  onSeekComplete?: () => void;
}

export function YouTubeIframe({
  videoId,
  isPlaying,
  wasPlaying,
  autoPlayOnReady,
  onReady,
  onProgress,
  onEnd,
  onPlay,
  onPause,
  seekTime,
  volume,
  muted,
  onSeekComplete,
}: YouTubeIframeProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const prevIsPlayingRef = useRef(isPlaying);
  const [playerReady, setPlayerReady] = useState(false);

  // Handle videoId change: load new video in existing player instance
  useEffect(() => {
    if (!playerReady || !playerRef.current || !videoId) return;
    try {
      const shouldPlay = isPlaying || wasPlaying || autoPlayOnReady;
      if (shouldPlay) {
        playerRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: 0
        });
        // Force play request to guarantee play state propagation
        setTimeout(() => {
          if (playerRef.current && isPlaying) {
            try {
              playerRef.current.playVideo();
            } catch (e) {
              console.warn("Deferred play failed:", e);
            }
          }
        }, 150);
      } else {
        playerRef.current.cueVideoById({
          videoId: videoId,
          startSeconds: 0
        });
      }

      // Re-apply volume and mute state to the player instance
      try {
        if (muted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume * 100);
        }
      } catch (err) {
        console.warn("Failed to apply volume on video update:", err);
      }

      // Update duration after cued/loaded metadata
      setTimeout(() => {
        if (playerRef.current) {
          try {
            const d = playerRef.current.getDuration();
            if (d) onReady(d);
          } catch (err) {
            console.warn("Failed to get video duration on update:", err);
          }
        }
      }, 500);
    } catch (e) {
      console.warn("Failed to update video ID in existing iframe:", e);
    }
  }, [videoId, playerReady]);

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
    if (isPlaying) {
      try {
        playerRef.current.playVideo();
      } catch (e) {
        console.warn("Failed to play video:", e);
      }
    } else {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {
        console.warn("Failed to pause video:", e);
      }
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying, playerReady]);

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    if (seekTime !== null && videoId) {
      try {
        playerRef.current.seekTo(seekTime, true);
        if (isPlaying) {
          playerRef.current.playVideo();
        }
        if (onSeekComplete) {
          onSeekComplete();
        }
      } catch (e) {
        console.warn("Failed to seek video:", e);
      }
    }
  }, [seekTime, playerReady, videoId, isPlaying, onSeekComplete]);

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

    const shouldPlay = isPlaying || autoPlayOnReady;
    if (shouldPlay && videoId) {
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

  const handlePlay = () => {
    if (playerRef.current) {
      try {
        const d = playerRef.current.getDuration();
        if (d) onReady(d);
      } catch (err) {
        console.warn("Failed to get duration on play:", err);
      }
    }
    if (onPlay) onPlay();
  };

  const handlePause = () => {
    if (!isPlaying) {
      if (onPause) onPause();
    }
  };

  const activeVideoId = videoId || "3nQNiWdeH2Q";

  return (
    <div className="hidden absolute opacity-0 pointer-events-none" style={{ display: 'none' }}>
      <YouTube
        videoId={activeVideoId}
        opts={{ height: "0", width: "0", playerVars: { autoplay: 0, controls: 0 } }}
        onReady={handlePlayerReady}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnd={onEnd}
      />
    </div>
  );
}


