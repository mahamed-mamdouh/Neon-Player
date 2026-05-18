# 🎶 Neon Player

<div align="center">
  <img src="public/logo.png" width="128" alt="Neon Player Logo" />
  <h3>⚡ A Retro-Themed Desktop Music Companion ⚡</h3>
  <p><strong>Nostalgic hardware aesthetic meets modern playback engineering.</strong></p>
  <p>Built with 💖 using <strong>Tauri v2</strong> • <strong>React</strong> • <strong>TypeScript</strong> • <strong>Vite</strong></p>
</div>

---

## 🌟 Overview

**Neon Player** is a retro-themed, hardware-inspired desktop music player. It merges a beautifully layered, pixel-art physical music deck with modern playback capabilities, custom frameless window controls, and seamless music streaming. 

Swap out vinyl records, watch custom-animated needles drop, and control your tunes directly from a compact, floating desktop companion that captures the nostalgic neon/pixel vibe!

---

## 🎨 Design & Aesthetic

- **Nostalgic Compact Deck:** Frameless window layout engineered to look like a physical micro-console.
- **Dynamic Themes:** Features a gorgeous pixel-art skin that adapts to your vibe.
- **Pixel-Perfect HUD:** A custom progress bar with pixelated stars, a custom-drawn volume slider, dial indicator, and responsive vinyl rotation.
- **Interactive Needle & Record Swap:** Realistic physical interaction where changing tracks lifts the needle, swaps the vinyl record, and drops the needle back into place!

---

## ✨ Features

### 📂 Local Music Playback
- Drag or select local audio tracks directly from your computer.
- Custom playback console (Play, Pause, Fast-Forward, Rewind).
- Integrated progress bar displaying elapsed time and total duration.

### 📺 YouTube Playlist Support
- Import any official YouTube or YouTube Music playlist link.
- High-fidelity metadata importing using the **YouTube Data API**.
- Direct track display including title, artist/channel name, and video thumbnail.
- Lightweight and secure native playback integration.

### 🔁 Premium Playback Modes
- **Shuffle mode:** Play your imported playlist in a randomized sequence.
- **Repeat Playlist:** Loop back to the first song once the playlist completes.
- **Repeat Current Song:** Repeat a single song continuously (with custom pixel-art `"1"` badge indicator).
- **Normal Mode:** Plays sequentially and terminates when the final track ends.

### 💻 Retro Desktop UI
- Custom frameless title bar with drag capability.
- Interactive, responsive native minimize and close buttons.
- No scrollbars, fixed window scale, and smooth performance.
- Clean launch experience with no autoplay on startup.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Desktop Shell** | [Tauri v2](https://tauri.app) | Secure, lightweight native Rust windowing |
| **Frontend** | [React](https://react.dev) | Responsive component-driven state architecture |
| **Language** | [TypeScript](https://www.typescriptlang.org) | Type-safe development |
| **Tooling** | [Vite](https://vite.dev) | High-speed hot module reloading & bundling |
| **Styling** | [Vanilla CSS & HSL](https://w3.org) | Beautiful gradients, precise layouts & animations |
| **APIs** | [YouTube Data API v3](https://developers.google.com/youtube/v3) | Fetching track metadata |
| **Backend** | [Rust](https://www.rust-lang.org) | Native OS hooks and compiled performance |

---

## 🚀 Requirements

To compile or run **Neon Player** from source, you will need:

- **Node.js** (v18+) & **npm**
- **Rust toolchain** (via `rustup`)
- **Microsoft C++ Build Tools** (For Windows compilers)
- **YouTube Data API v3 Key** (to fetch playlists)

---

## ⚙️ Setup & Installation

### 1. Clone the project
```bash
git clone https://github.com/mahamed-mamdouh/Playlist.git
cd Playlist
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run in Development
```bash
npm run tauri dev
```

### 5. Build Final Installer
```bash
npm run tauri build
```
*The compiled release installer (`Neon Player 2.0.0.exe`) will be generated inside the `release/` folder.*

---

<div align="center">
  <p>Created with 💖 by mahamed-mamdouh</p>
</div>
