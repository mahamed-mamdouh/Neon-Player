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

    return data.items.map((item: any) => ({
      id: item.id,
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || "Unknown Artist",
      thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
    }));
  } catch (error) {
    console.error("YouTube API Error:", error);
    return [];
  }
}

export async function fetchVideoDetails(videoId: string): Promise<YouTubePlaylistItem | null> {
  if (!API_KEY) {
    console.warn("No YouTube API Key found.");
    return null;
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch video details");
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        id: item.id,
        videoId: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle || "Unknown Artist",
        thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
      };
    }
  } catch (error) {
    console.error("YouTube API Error fetching video:", error);
  }
  return null;
}
