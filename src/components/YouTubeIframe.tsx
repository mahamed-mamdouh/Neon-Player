import { useEffect, useRef } from "react";
import YouTube, { YouTubePlayer as YTPlayer } from "react-youtube";

interface YouTubeIframeProps {
  videoId: string;
  isPlaying: boolean;
  onReady: (duration: number) => void;
  onProgress: (currentTime: number) => void;
  onEnd: () => void;
  seekTime: number | null;
  volume: number; // 0.0 to 1.0
  muted: boolean;
}

export function YouTubeIframe({
  videoId,
  isPlaying,
  onReady,
  onProgress,
  onEnd,
  seekTime,
  volume,
  muted,
}: YouTubeIframeProps) {
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    const updateProgress = async () => {
      if (playerRef.current && isPlaying) {
        const time = await playerRef.current.getCurrentTime();
        if (time !== undefined) onProgress(time);
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };
    if (isPlaying) updateProgress();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, onProgress]);

  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) playerRef.current.playVideo();
      else playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (playerRef.current && seekTime !== null) {
      playerRef.current.seekTo(seekTime, true);
    }
  }, [seekTime]);

  useEffect(() => {
    if (playerRef.current) {
      if (muted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume * 100);
      }
    }
  }, [volume, muted]);

  const handlePlayerReady = (event: { target: YTPlayer }) => {
    playerRef.current = event.target;
    onReady(event.target.getDuration());
    if (isPlaying) event.target.playVideo();
    event.target.setVolume(volume * 100);
    if (muted) event.target.mute();
  };

  if (!videoId) return null;

  return (
    <div className="hidden absolute opacity-0 pointer-events-none" style={{ display: 'none' }}>
      <YouTube
        videoId={videoId}
        opts={{ height: "0", width: "0", playerVars: { autoplay: 1, controls: 0 } }}
        onReady={handlePlayerReady}
        onEnd={onEnd}
      />
    </div>
  );
}
