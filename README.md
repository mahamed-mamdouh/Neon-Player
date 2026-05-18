<p align="center">
  <img src="assets/logo.png" alt="Neon Player Logo" width="140" />
</p>

<h1 align="center">Neon Player</h1>

<p align="center">
  A retro-themed desktop music player built with Tauri, React, and TypeScript.
</p>

<p align="center">
  Built with 💖 using <strong>Tauri v2</strong> • <strong>React</strong> • <strong>TypeScript</strong> • <strong>Vite</strong>
</p>

---

**Neon Player** is a premium, frameless desktop music companion. It replaces the default browser experience with a beautiful, transparent, retro-themed hardware aesthetic. Stream your favorite tracks directly from **YouTube** and **YouTube Music** while watching cute pixelated records swap out and spin under interactive, animated needles!

---

## ✨ Features

* **🎨 Retro Pixel-Art Aesthetic:** Lovingly layered custom pixel-art assets rendering a physical, cute hardware music deck.
* **🖼️ Frameless Transparent Window:** Custom drag region and gorgeous resize handles that float seamlessly on your desktop.
* **🔄 Dual Theme Switching:** Switch between cozy **Pink** and high-contrast **Neon Blue** HSL theme modes on the fly.
* **🎵 Animated Vinyl Deck:** 
  * Playback triggers a spinning pixel-art vinyl record.
  * Changing tracks activates a cute **needle lift** and **physical record-swapping** animation sequence!
* **⭐ Interactive Star Seeker:** A draggable pixel-art star progress slider with micro-animations.
* **📂 Togglable Songs List Drawer:** A custom list panel that slides down from the left of the player, letting you browse your playlist tracks and directly jump to songs with their custom retro thumbnails.
* **🎧 Safe & Legal YouTube / YouTube Music Streaming:** Streams audio legally through a hidden embedded YouTube Iframe player complying with official ToS, eliminating local downloads or `yt-dlp` packages.
* **⚙️ Quick Import Panel:** Simply paste any YouTube / YouTube Music video or playlist link into the settings, and Neon Player will instantly parse, fetch metadata (song titles, uploader/artists, and covers), and load it into your queue.

---

## 🛠️ Tech Stack

* **Frontend Framework:** React 19 + TypeScript + Vite
* **Desktop Shell:** Tauri v2 (Rust-backed desktop environment)
* **API Integration:** YouTube Data API v3 (for real-time metadata resolving)
* **Styling Engine:** Custom Vanilla CSS variables & layout design tokens (HSL Hues)

---

## 🚀 Quick Start

### Prerequisites
1. **Node.js:** Ensure you have Node.js installed (LTS recommended).
2. **Rust Toolchain:** Install Rust via [rustup](https://rustup.rs/) (required for Tauri's native build step).
3. **YouTube API Key:** You'll need a free YouTube Data API key from [Google Cloud Console](https://console.cloud.google.com/).

### Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/Neon-Player.git
   cd Neon-Player
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the provided `.env.example` template to a new `.env` file and insert your actual YouTube Data API key:
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and configure your API key:
   ```env
   VITE_YOUTUBE_API_KEY=your_actual_youtube_data_api_key_here
   ```

4. **Run Dev Environment:**
   Start the interactive Tauri desktop dev server:
   ```bash
   npm run tauri dev
   ```

5. **Build Native Executables:**
   Compile highly optimized production installers for your platform (e.g., `.msi` / `.exe` on Windows, `.dmg` on macOS):
   ```bash
   npm run tauri build
   ```
   *Generated installers will be available in `src-tauri/target/release/bundle/`.*

---

## 📂 Project Structure

```
├── public/                 # Static web assets (e.g., logo)
├── src/
│   ├── assets/             # Pixel-art overlays, buttons, vinyls & fonts
│   ├── components/         # Core React components (e.g., YouTubeIframe)
│   ├── hooks/              # Custom React hooks (e.g., useTheme, useResize)
│   ├── utils/              # Metadata parsers (youtubeApi) and window controls (windowApi)
│   ├── App.tsx             # Main Layered Music Player layout and state machine
│   ├── index.css           # Typography imports and root variables
│   └── App.css             # Component-level layered pixel placements
└── src-tauri/
    ├── icons/              # Generated native desktop OS icons
    ├── src/                # Rust main entry points & lib exports
    └── tauri.conf.json     # Native window configurations (transparency, frameless, size)
```