import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { LocalPlayerComponent } from "./components/LocalPlayer";
import { YouTubePlayerComponent } from "./components/YouTubePlayer";
import "./App.css";

function App() {
  const [mode, setMode] = useState<"local" | "youtube">("local");

  return (
    <main className="w-screen h-screen flex bg-black text-white overflow-hidden font-sans">
      <Sidebar mode={mode} setMode={setMode} />
      
      <div className="flex-1 ml-64 relative overflow-hidden">
        {mode === "local" ? <LocalPlayerComponent /> : <YouTubePlayerComponent />}
      </div>
    </main>
  );
}

export default App;
