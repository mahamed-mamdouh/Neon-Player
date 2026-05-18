export interface LyricLine {
  time: number;
  text: string;
}

export function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const lyrics: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let milliseconds = parseInt(match[3], 10);
      if (match[3].length === 2) {
        milliseconds *= 10;
      }
      
      const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      
      if (text) {
        lyrics.push({ time: timeInSeconds, text });
      }
    }
  }

  return lyrics.sort((a, b) => a.time - b.time);
}
