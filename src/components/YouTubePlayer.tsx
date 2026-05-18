import { useState, useEffect, useRef } from "react";
import YouTube, { YouTubePlayer as YTPlayer } from "react-youtube";
import { AlbumArt, BackgroundEffects } from "./UIComponents";
import { Controls } from "./Controls";
import { Search, List, PlaySquare } from "lucide-react";
import { fetchPlaylistItems, YouTubePlaylistItem } from "../utils/youtubeApi";

export function YouTubePlayerComponent() {
  const [videoId, setVideoId] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  
  const [playlist, setPlaylist] = useState<YouTubePlaylistItem[]>([]);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isVinyl, setIsVinyl] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    const updateProgress = async () => {
      if (playerRef.current && isPlaying) {
        const time = await playerRef.current.getCurrentTime();
        if (time !== undefined) setCurrentTime(time);
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };
    if (isPlaying) updateProgress();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  const handlePlayerReady = (event: { target: YTPlayer }) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    event.target.playVideo();
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  };

  const handleEnd = () => {
    if (playlist.length > 0 && currentTrackIndex < playlist.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      setVideoId(playlist[nextIndex].videoId);
      setIsPlaying(false);
    } else {
      setIsPlaying(false);
    }
  };

  const handleLoadUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;

    // Check if it's a playlist URL
    const listRegex = /[?&]list=([^#\&\?]+)/;
    const listMatch = inputUrl.match(listRegex);
    
    if (listMatch && listMatch[1]) {
      const playlistId = listMatch[1];
      const items = await fetchPlaylistItems(playlistId);
      if (items.length > 0) {
        setPlaylist(items);
        setVideoId(items[0].videoId);
        setCurrentTrackIndex(0);
        setShowPlaylist(true);
      }
    } else {
      // It's a single video
      let id = inputUrl;
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = inputUrl.match(regex);
      if (match && match[1]) id = match[1];
      
      setPlaylist([]);
      setVideoId(id);
    }
    
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const currentTrack = playlist[currentTrackIndex];
  const albumArtSrc = currentTrack?.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "/vite.svg");
  const trackTitle = currentTrack?.title || (videoId ? "YouTube Audio" : "No Track");
  const trackArtist = currentTrack?.channelTitle || "Embedded Stream";

  return (
    <div className="relative w-full h-full flex flex-col">
      <BackgroundEffects />
      
      {/* Top Bar for Input */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        {playlist.length > 0 && (
          <button 
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`p-2 rounded-full transition ${showPlaylist ? 'bg-white text-black' : 'glass text-white'}`}
          >
            <List size={20} />
          </button>
        )}
        <form onSubmit={handleLoadUrl} className="flex items-center gap-2 glass px-4 py-2 rounded-full">
          <PlaySquare size={20} className="text-zinc-400" />
          <input
            type="text"
            placeholder="Paste YouTube Video or Playlist URL..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 w-64 md:w-80"
          />
          <button type="submit" className="text-white hover:text-zinc-300 transition">
            <Search size={18} />
          </button>
        </form>
      </div>

      {videoId && (
        <div className="hidden absolute opacity-0 pointer-events-none">
          <YouTube
            videoId={videoId}
            opts={{ height: "0", width: "0", playerVars: { autoplay: 1, controls: 0 } }}
            onReady={handlePlayerReady}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnd={handleEnd}
          />
        </div>
      )}

      {videoId ? (
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between flex-1 w-full max-w-7xl mx-auto px-6 py-12">
          <div className="flex-1 flex flex-col items-center justify-center w-full mt-10 md:mt-0">
            <AlbumArt src={albumArtSrc} isPlaying={isPlaying} isVinyl={isVinyl} />
            <div className="mt-8 text-center px-4 max-w-lg">
              <h2 className="text-2xl font-bold tracking-wide text-white drop-shadow-md truncate">{trackTitle}</h2>
              <p className="text-lg text-zinc-400 font-medium mt-2">{trackArtist}</p>
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl mx-auto flex flex-col justify-center h-full relative">
            {showPlaylist && playlist.length > 0 ? (
              <div className="absolute inset-0 overflow-y-auto no-scrollbar py-12 px-6 mask-image-vertical"
                   style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}>
                <div className="flex flex-col gap-4">
                  {playlist.map((item, idx) => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setVideoId(item.videoId);
                      }}
                      className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition ${
                        idx === currentTrackIndex ? 'bg-white/20 scale-105 shadow-xl' : 'hover:bg-white/10'
                      }`}
                    >
                      <img src={item.thumbnailUrl} className="w-16 h-12 object-cover rounded-md" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${idx === currentTrackIndex ? 'text-white' : 'text-white/80'}`}>{item.title}</p>
                        <p className="text-xs text-zinc-400 truncate">{item.channelTitle}</p>
                      </div>
                      {idx === currentTrackIndex && isPlaying && (
                        <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
               <div className="text-zinc-500 italic text-center">
                 Lyrics are not available for YouTube streams without an LRC file.
               </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          Paste a YouTube Video or Playlist link to start playing.
        </div>
      )}

      {videoId && (
        <div className="absolute bottom-0 left-0 right-0 glass-dock pb-8 pt-20 px-6">
          <Controls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            isVinyl={isVinyl}
            onPlayPause={togglePlayPause}
            onSeek={handleSeek}
            onToggleVinyl={() => setIsVinyl(!isVinyl)}
          />
        </div>
      )}
    </div>
  );
}
