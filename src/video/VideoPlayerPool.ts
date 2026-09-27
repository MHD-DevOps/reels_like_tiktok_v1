import { createVideoPlayer, type VideoPlayer } from 'expo-video';
import type { Reel } from '../types';

type PlayerEntry = {
  player: VideoPlayer;
  url: string;
  lastUsed: number;
};

/**
 * Persistent players keyed by Reel ID.
 *
 * FlashList may recycle React cells, but a Reel keeps the same VideoPlayer
 * while it remains inside the preloaded window.
 */
export class VideoPlayerPool {
  private readonly players = new Map<string, PlayerEntry>();

  get(reelId: string): VideoPlayer | undefined {
    const entry = this.players.get(reelId);
    if (!entry) return undefined;

    entry.lastUsed = Date.now();
    return entry.player;
  }

  ensure(reel: Reel): VideoPlayer {
    const existing = this.players.get(reel.id);

    if (existing && existing.url === reel.videoUrl) {
      existing.lastUsed = Date.now();
      return existing.player;
    }

    if (existing) {
      existing.player.pause();
      existing.player.release();
      this.players.delete(reel.id);
    }

    const player = createVideoPlayer({
      uri: reel.videoUrl,
      useCaching: true,
    });

    player.loop = true;
    player.muted = true;

    this.players.set(reel.id, {
      player,
      url: reel.videoUrl,
      lastUsed: Date.now(),
    });

    return player;
  }

  /**
   * Keep the current Reel plus a generous surrounding window.
   * This reduces player creation/destruction when the user scrolls back.
   */
  syncWindow(reels: Reel[], centerIndex: number): void {
    const start = Math.max(0, centerIndex - 3);
    const end = Math.min(reels.length - 1, centerIndex + 3);
    const wantedIds = new Set<string>();

    for (let index = start; index <= end; index += 1) {
      const reel = reels[index];
      if (!reel) continue;

      wantedIds.add(reel.id);
      this.ensure(reel);
    }

    for (const [reelId, entry] of this.players) {
      if (wantedIds.has(reelId)) continue;

      entry.player.pause();
      entry.player.release();
      this.players.delete(reelId);
    }
  }

  /**
   * Make a Reel active without replacing its source.
   *
   * The player stays in the pool, so this does not trigger a new network
   * source load. It only resets playback to the beginning and plays when
   * ready. The React cell also repeats this behavior when it becomes active,
   * so the UI remains correct even when FlashList recycles a cell.
   */
  activate(reelId: string, muted: boolean): void {
    const entry = this.players.get(reelId);
    if (!entry) return;

    entry.lastUsed = Date.now();
    entry.player.muted = muted;
    entry.player.replay();

    if (entry.player.status === 'readyToPlay') {
      entry.player.play();
    }
  }

  pauseAllExcept(activeReelId: string | undefined, muted: boolean): void {
    for (const [reelId, entry] of this.players) {
      const isActive = reelId === activeReelId;
      entry.player.muted = muted || !isActive;

      if (!isActive) {
        entry.player.pause();
      } else if (entry.player.status === 'readyToPlay') {
        entry.player.play();
      }
    }
  }

  /**
   * Retry only replaces the source if the player is actually in an error state.
   * Normal scrolling never calls retry and therefore never reloads the source.
   */
  async retry(reel: Reel): Promise<void> {
    const player = this.ensure(reel);

    player.pause();
    await player.replaceAsync({
      uri: reel.videoUrl,
      useCaching: true,
    });

    player.loop = true;
    player.muted = true;
  }

  releaseAll(): void {
    for (const entry of this.players.values()) {
      entry.player.pause();
      entry.player.release();
    }

    this.players.clear();
  }
}
