export interface YouTubePlaylistItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
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
      channelTitle: item.snippet.videoOwnerChannelTitle,
      thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || "",
    }));
  } catch (error) {
    console.error("YouTube API Error:", error);
    return [];
  }
}
