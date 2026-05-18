import { Play, Pause, SkipBack, SkipForward, Disc3 } from "lucide-react";

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isVinyl: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onToggleVinyl: () => void;
}

export function Controls({
  isPlaying,
  currentTime,
  duration,
  isVinyl,
  onPlayPause,
  onSeek,
  onToggleVinyl,
}: ControlsProps) {
  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 mt-8 z-10 relative">
      <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium">
        <span>{formatTime(currentTime)}</span>
        <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden group cursor-pointer">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          <div
            className="absolute top-0 left-0 h-full bg-white transition-all ease-linear"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-between px-4">
        <button
          onClick={onToggleVinyl}
          className={`p-2 rounded-full transition ${isVinyl ? "text-white" : "text-white/40 hover:text-white"}`}
          title="Toggle Vinyl Mode"
        >
          <Disc3 size={24} />
        </button>

        <div className="flex items-center gap-6">
          <button className="text-white/70 hover:text-white transition">
            <SkipBack size={28} />
          </button>
          
          <button
            onClick={onPlayPause}
            className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            {isPlaying ? <Pause size={28} className="fill-black" /> : <Play size={28} className="fill-black ml-1" />}
          </button>

          <button className="text-white/70 hover:text-white transition">
            <SkipForward size={28} />
          </button>
        </div>

        <div className="w-10" />
      </div>
    </div>
  );
}
