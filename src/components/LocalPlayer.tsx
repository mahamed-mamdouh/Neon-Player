import { useState, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";
import { AlbumArt, BackgroundEffects, LyricsDisplay } from "./UIComponents";
import { Controls } from "./Controls";
import { parseLrc, LyricLine } from "../utils/lrcParser";
import { Music, FileText } from "lucide-react";

export function LocalPlayerComponent() {
  const [audioPath, setAudioPath] = useState("");
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVinyl, setIsVinyl] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSelectAudio = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Audio", extensions: ["mp3", "wav", "ogg"] }],
      });
      if (selected && typeof selected === "string") {
        setAudioPath(selected);
        setIsPlaying(false);
        setCurrentTime(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectLrc = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Lyrics", extensions: ["lrc"] }],
      });
      if (selected && typeof selected === "string") {
        const lrcContent = await readTextFile(selected);
        const parsed = parseLrc(lrcContent);
        setLyrics(parsed);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioPath]);

  return (
    <div className="relative w-full h-full flex flex-col">
      <BackgroundEffects />
      
      {/* Top Bar for File Selection */}
      <div className="absolute top-6 right-6 z-20 flex gap-4">
        <button onClick={handleSelectAudio} className="flex items-center gap-2 glass px-4 py-2 rounded-full text-white hover:bg-white/10 transition">
          <Music size={18} />
          <span className="text-sm">Select Audio</span>
        </button>
        <button onClick={handleSelectLrc} className="flex items-center gap-2 glass px-4 py-2 rounded-full text-white hover:bg-white/10 transition">
          <FileText size={18} />
          <span className="text-sm">Select LRC</span>
        </button>
      </div>

      {audioPath && (
        <audio
          ref={audioRef}
          src={convertFileSrc(audioPath)}
          className="hidden"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {audioPath ? (
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between flex-1 w-full max-w-7xl mx-auto px-6 py-12">
          <div className="flex-1 flex flex-col items-center justify-center w-full mt-10 md:mt-0">
            <AlbumArt src="/vite.svg" isPlaying={isPlaying} isVinyl={isVinyl} />
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-bold tracking-wide text-white drop-shadow-md break-all px-4">
                {audioPath.split('\\').pop()?.split('/').pop()}
              </h2>
              <p className="text-lg text-zinc-400 font-medium mt-2">Local File</p>
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl mx-auto flex flex-col justify-center h-full">
            {lyrics.length > 0 ? (
              <LyricsDisplay lyrics={lyrics} currentTime={currentTime} />
            ) : (
              <div className="text-zinc-500 italic text-center">
                Select an LRC file to display lyrics.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          Select an audio file from your computer to start.
        </div>
      )}

      {audioPath && (
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
