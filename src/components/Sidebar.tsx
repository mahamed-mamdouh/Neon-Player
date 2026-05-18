import { Music, PlaySquare, Settings } from "lucide-react";

interface SidebarProps {
  mode: "local" | "youtube";
  setMode: (mode: "local" | "youtube") => void;
}

export function Sidebar({ mode, setMode }: SidebarProps) {
  return (
    <div className="w-64 h-full bg-black/60 backdrop-blur-2xl border-r border-white/10 flex flex-col p-6 absolute left-0 top-0 bottom-0 z-50">
      <div className="mb-12 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-black rounded-full" />
        </div>
        <h1 className="text-xl font-bold tracking-widest text-white">PLAYLIST</h1>
      </div>

      <nav className="flex-1 space-y-4">
        <button
          onClick={() => setMode("local")}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition ${
            mode === "local" ? "bg-white/10 text-white font-medium" : "text-zinc-500 hover:text-white hover:bg-white/5"
          }`}
        >
          <Music size={20} />
          <span>Local Library</span>
        </button>
        
        <button
          onClick={() => setMode("youtube")}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition ${
            mode === "youtube" ? "bg-white/10 text-white font-medium" : "text-zinc-500 hover:text-white hover:bg-white/5"
          }`}
        >
          <PlaySquare size={20} />
          <span>YouTube Playlists</span>
        </button>
      </nav>

      <div className="mt-auto">
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition">
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
