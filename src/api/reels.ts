import type { Reel } from '../types';

export const BATCH_SIZE = 5;

// Set this to your backend endpoint. The app will request:
// GET <endpoint>?page=0&limit=10
const REELS_API_URL:string = '';

// Small short-form MP4s for runtime testing.
// Replace these with your CDN URLs in production.
const DEMO_URLS = [
 'https://media.w3.org/2010/05/bunny/trailer.mp4' ,
  'https://download.samplelib.com/mp4/sample-5s.mp4' ,
  'https://download.samplelib.com/mp4/sample-10s.mp4' ,
  'https://media.w3.org/2010/05/sintel/trailer.mp4' ,
  'https://samplelib.com/mp4/sample-15s.mp4',
] as const;

function createDemoBatch(page: number): Reel[] {
  const start = page * BATCH_SIZE;

  return Array.from({ length: BATCH_SIZE }, (_, offset) => {
    const index = start + offset;

    return {
      id: `demo-${index}`,
      videoUrl: DEMO_URLS[index % DEMO_URLS.length],
      username: `creator_${(index % 8) + 1}`,
      caption: `Short reel #${index + 1}. Runtime video from the web.`,
      tags: index % 2 === 0 ? ['travel', 'discover'] : ['daily', 'fun'],
      likes: 1200 + index * 137,
      comments: 28 + index * 3,
      shares: 17 + index * 2,
      soundName: 'Original sound',
    };
  });
}

export async function fetchReels(page: number): Promise<Reel[]> {
  if (!REELS_API_URL) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return createDemoBatch(page);
  }

  const separator = REELS_API_URL.includes('?') ? '&' : '?';
  const response = await fetch(
    `${REELS_API_URL}${separator}page=${page}&limit=${BATCH_SIZE}`,
  );

  if (!response.ok) {
    throw new Error(`Reels API failed: ${response.status}`);
  }

  const payload = (await response.json()) as Reel[] | { reels: Reel[] };
  const result = Array.isArray(payload) ? payload : payload.reels;

  if (!Array.isArray(result)) {
    throw new Error('Invalid reels API response. Expected an array or { reels: [] }.');
  }

  return result.filter(
    (item): item is Reel =>
      Boolean(
        item &&
          typeof item.id === 'string' &&
          typeof item.videoUrl === 'string' &&
          item.videoUrl.length > 0,
      ),
  );
}
