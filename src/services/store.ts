import { load } from "@tauri-apps/plugin-store";
import { YouTubePlaylistItem } from "../utils/youtubeApi";

export interface SavedPlaylist {
  id: string; // The YouTube Playlist ID or a generated local ID
  title: string;
  source: "youtube" | "local";
  items: YouTubePlaylistItem[] | any[]; // using any for local tracks for now
}

// Interface to make it easily swappable with SQLite later
export interface IStorageService {
  savePlaylist(playlist: SavedPlaylist): Promise<void>;
  getPlaylists(): Promise<SavedPlaylist[]>;
  deletePlaylist(id: string): Promise<void>;
}

class JsonStorageService implements IStorageService {
  private storePath = "playlists.json";

  private async getStore() {
    return await load(this.storePath, { autoSave: true, defaults: {} });
  }

  async savePlaylist(playlist: SavedPlaylist): Promise<void> {
    try {
      const store = await this.getStore();
      const existingStr = await store.get<string>("playlists") || "[]";
      let playlists: SavedPlaylist[] = [];
      try {
        playlists = JSON.parse(existingStr);
      } catch (e) {
        playlists = [];
      }

      const index = playlists.findIndex(p => p.id === playlist.id);
      if (index >= 0) {
        playlists[index] = playlist; // Update
      } else {
        playlists.push(playlist); // Insert
      }

      await store.set("playlists", JSON.stringify(playlists));
      await store.save();
    } catch (e) {
      console.warn("Storage is only available in Tauri app environment.", e);
    }
  }

  async getPlaylists(): Promise<SavedPlaylist[]> {
    try {
      const store = await this.getStore();
      const existingStr = await store.get<string>("playlists");
      if (existingStr) {
        return JSON.parse(existingStr) as SavedPlaylist[];
      }
    } catch (e) {
      console.warn("Storage is only available in Tauri app environment.", e);
    }
    return [];
  }

  async deletePlaylist(id: string): Promise<void> {
    try {
      const store = await this.getStore();
      const existingStr = await store.get<string>("playlists") || "[]";
      let playlists: SavedPlaylist[] = [];
      try {
        playlists = JSON.parse(existingStr);
      } catch (e) {}

      playlists = playlists.filter(p => p.id !== id);
      await store.set("playlists", JSON.stringify(playlists));
      await store.save();
    } catch (e) {
      console.warn("Storage is only available in Tauri app environment.", e);
    }
  }
}

// Export a singleton instance of the chosen implementation
export const storageService: IStorageService = new JsonStorageService();
