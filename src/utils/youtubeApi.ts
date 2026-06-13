import { formatDuration, parseISO8601Duration } from './time';

export interface YouTubePlaylistItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
}

// Ensure you set VITE_YOUTUBE_API_KEY in your .env file
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "";

export async function fetchPlaylistItems(playlistId: string): Promise<YouTubePlaylistItem[]> {
  if (!API_KEY) {
    console.warn("No YouTube API Key found.");
    return [];
  }

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch playlist");
    const data = await response.json();

    const items = data.items.map((item: any) => ({
      id: item.id,
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || "Unknown Artist",
      thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
    }));

    if (items.length > 0) {
      const videoIds = items.map((item: any) => item.videoId).filter(Boolean);
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(",")}&key=${API_KEY}`;
      const detailsResponse = await fetch(detailsUrl);
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        const durationMap: Record<string, string> = {};
        
        detailsData.items?.forEach((vItem: any) => {
          const rawDuration = vItem.contentDetails?.duration || "";
          const durationSeconds = parseISO8601Duration(rawDuration);
          durationMap[vItem.id] = formatDuration(durationSeconds);
        });

        items.forEach((item: any) => {
          item.duration = durationMap[item.videoId] || "0:00";
        });
      }
    }

    return items;
  } catch (error) {
    console.error("YouTube API Error:", error);
    return [];
  }
}

export async function fetchPlaylistTitle(playlistId: string): Promise<string | null> {
  if (!API_KEY) {
    console.warn("No YouTube API Key found.");
    return null;
  }
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch playlist title");
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet?.title || null;
    }
  } catch (error) {
    console.error("YouTube API Error fetching playlist title:", error);
  }
  return null;
}

export async function fetchVideoDetails(videoId: string): Promise<YouTubePlaylistItem | null> {
  if (!API_KEY) {
    console.warn("No YouTube API Key found.");
    return null;
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch video details");
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const rawDuration = item.contentDetails?.duration || "";
      const durationSeconds = parseISO8601Duration(rawDuration);
      const durationStr = formatDuration(durationSeconds);

      return {
        id: item.id,
        videoId: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle || "Unknown Artist",
        thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
        duration: durationStr,
      };
    }
  } catch (error) {
    console.error("YouTube API Error fetching video:", error);
  }
  return null;
}

export function extractYouTubeId(input: string): { type: "video" | "playlist"; id: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Check for playlist query parameters (e.g. list=...)
  // This covers normal watch?v=...&list=..., /playlist?list=..., and music.youtube.com/playlist?list=...
  const playlistMatch = trimmed.match(/[?&]list=([^#\&\?]+)/);
  if (playlistMatch && playlistMatch[1]) {
    return { type: "playlist", id: playlistMatch[1] };
  }

  // 2. Check for playlist path /playlist/PLAYLIST_ID
  const playlistPathMatch = trimmed.match(/\/playlist\/([^#\&\?]+)/);
  if (playlistPathMatch && playlistPathMatch[1]) {
    return { type: "playlist", id: playlistPathMatch[1] };
  }

  // 3. Check for watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([^#\&\?]{11})/);
  if (watchMatch && watchMatch[1]) {
    return { type: "video", id: watchMatch[1] };
  }

  // 4. Check for paths like /live/VIDEO_ID, /shorts/VIDEO_ID, /embed/VIDEO_ID, /v/VIDEO_ID
  const pathMatch = trimmed.match(/\/(?:live|shorts|embed|v)\/([^#\&\?]{11})/);
  if (pathMatch && pathMatch[1]) {
    return { type: "video", id: pathMatch[1] };
  }

  // 5. Check for youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([^#\&\?]{11})/);
  if (shortMatch && shortMatch[1]) {
    return { type: "video", id: shortMatch[1] };
  }

  // 6. Check for raw video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { type: "video", id: trimmed };
  }

  // 7. Check for raw playlist ID (typically 18, 24, or 34 characters starting with PL or other characters)
  // Let's allow raw playlist ID if it's alphanumeric and longer than 11 characters
  if (/^[a-zA-Z0-9_-]{12,}$/.test(trimmed)) {
    return { type: "playlist", id: trimmed };
  }

  return null;
}
