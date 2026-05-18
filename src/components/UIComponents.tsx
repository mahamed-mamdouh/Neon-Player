import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export interface LyricLine {
  time: number;
  text: string;
}

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
}

export function LyricsDisplay({ lyrics, currentTime }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  let activeIndex = lyrics.findIndex((lyric, idx) => {
    const nextTime = lyrics[idx + 1] ? lyrics[idx + 1].time : Infinity;
    return currentTime >= lyric.time && currentTime < nextTime;
  });

  if (activeIndex === -1 && currentTime > 0) activeIndex = lyrics.length - 1;
  else if (activeIndex === -1) activeIndex = 0;

  useEffect(() => {
    if (containerRef.current) {
      const activeElement = containerRef.current.querySelector(".active-lyric");
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 md:h-64 overflow-y-auto no-scrollbar py-20 mask-image-vertical"
      style={{
        maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)"
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        {lyrics.map((lyric, idx) => {
          const isActive = idx === activeIndex;
          const isPassed = idx < activeIndex;
          return (
            <motion.p
              key={idx}
              className={`text-center text-lg md:text-2xl font-semibold transition-all duration-500 ease-out px-4 ${
                isActive
                  ? "text-white lyric-active active-lyric scale-110"
                  : isPassed
                  ? "text-white/30"
                  : "text-white/20"
              }`}
            >
              {lyric.text}
            </motion.p>
          );
        })}
      </div>
    </div>
  );
}

interface AlbumArtProps {
  src: string;
  isPlaying: boolean;
  isVinyl?: boolean;
}

export function AlbumArt({ src, isPlaying, isVinyl = false }: AlbumArtProps) {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto flex items-center justify-center">
      <motion.div
        animate={{
          opacity: isPlaying ? [0.5, 0.8, 0.5] : 0.4,
          scale: isPlaying ? [0.95, 1.05, 0.95] : 1,
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-white/20 blur-3xl rounded-full"
      />
      <motion.div
        animate={isVinyl ? { rotate: isPlaying ? 360 : 0 } : { y: isPlaying ? [-10, 10, -10] : 0 }}
        transition={isVinyl ? { duration: 10, repeat: Infinity, ease: "linear" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`relative z-10 w-full h-full overflow-hidden shadow-2xl ${isVinyl ? "rounded-full border-4 border-zinc-800" : "rounded-3xl border border-white/10"}`}
      >
        <img src={src} alt="Album Art" className={`w-full h-full object-cover ${isVinyl ? "scale-110" : ""}`} />
        {isVinyl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-full border-2 border-zinc-700" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function BackgroundEffects({ color = "rgba(40, 40, 50, 0.5)" }: { color?: string }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-zinc-950">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full blur-[100px] mix-blend-screen"
        style={{ background: color }}
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[60vw] h-[60vw] rounded-full blur-[120px] mix-blend-screen"
        style={{ background: color }}
      />
      <div className="absolute inset-0 bg-black/40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-zinc-950" />
    </div>
  );
}
