import { useEventListener } from 'expo';
import { VideoView, type VideoPlayer } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Reel } from '../types';
import { FeedOverlay } from './FeedOverlay';

type Props = {
  reel: Reel;
  player?: VideoPlayer;
  height: number;
  active: boolean;
  muted: boolean;
  liked: boolean;
  onLike: () => void;
  onComments: () => void;
  onToggleMute: () => void;
  onRetry: () => void;
};

/**
 * FlashList can render a Reel before its player has been created by the pool.
 * Keep the cell mounted and show only a small initial loader.
 */
export function ReelVideoItem(props: Props) {
  if (!props.player) {
    return (
      <View style={[styles.page, { height: props.height }]}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return <LoadedReelVideoItem {...props} player={props.player} />;
}

/**
 * `player` is guaranteed to exist in this component.
 *
 * IMPORTANT BEHAVIOR:
 * - We never hide the VideoView when buffering.
 * - Once the first frame has rendered, that state stays true.
 * - If the network temporarily buffers, the native player keeps its last
 *   rendered frame on screen while we put a loader on top of it.
 * - We pause during a real `loading` state and resume when `readyToPlay`.
 *
 * This prevents the old behavior where every status transition did:
 *   loading -> black background -> spinner -> video
 * even though the same video was already visible.
 */
function LoadedReelVideoItem({
  reel,
  player,
  height,
  active,
  muted,
  liked,
  onLike,
  onComments,
  onToggleMute,
  onRetry,
}: Props & { player: VideoPlayer }) {
  const [status, setStatus] = useState(player.status);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // True after this VideoView has rendered a frame at least once.
  // Once true, NEVER reset it just because the player starts buffering again.
  const [hasRenderedFrame, setHasRenderedFrame] = useState(
    player.status === 'readyToPlay',
  );

  useEventListener(player, 'statusChange', ({ status: nextStatus, error }) => {
    setStatus(nextStatus);

    if (nextStatus === 'error') {
      setErrorMessage(error?.message ?? 'Video failed to load.');
      return;
    }

    if (nextStatus === 'loading') {
      setErrorMessage(null);

      // Do NOT reset hasRenderedFrame here.
      // The existing video frame must remain visible while buffering.
      if (active) {
        player.pause();
      }
      return;
    }

    if (nextStatus === 'readyToPlay') {
      setErrorMessage(null);

      if (active) {
        player.play();
      }
    }
  });

  /**
   * FlashList may recycle this React component for a different Reel.
   * Always derive the state from the persistent player owned by the pool.
   */
  useEffect(() => {
    const currentStatus = player.status;

    setStatus(currentStatus);
    setErrorMessage(null);

    // A preloaded player can already be ready before its VideoView mounts.
    // In that case we don't need to wait for a first-frame event from this
    // particular React cell before allowing the video to show.
    setHasRenderedFrame(currentStatus === 'readyToPlay');
  }, [reel.id, player]);

  /**
   * Active Reel behavior:
   *
   * Every time THIS Reel becomes active, restart it from 0 seconds.
   * This does NOT download the video again. The same VideoPlayer remains
   * in the pool and can use its existing buffer/cache.
   *
   * We deliberately do not call replay() from the status listener below,
   * because `loading -> readyToPlay` can also happen during a rebuffer of
   * an already-playing video. Restarting there would incorrectly jump the
   * video back to 0 every time the network buffers.
   */
  useEffect(() => {
    player.muted = muted || !active;

    if (!active) {
      player.pause();
      return;
    }

    // This is the ONLY place that resets an already-loaded Reel.
    // `replay()` resets playback position to the beginning without
    // requiring us to create/replace the player.
    player.replay();

    // If it is already ready, replay() can start immediately.
    // If it is still loading, the status listener below will call play()
    // once it reaches readyToPlay.
  }, [active, muted, player]);

  const retry = () => {
    setErrorMessage(null);
    // A retry means we are waiting for a new first frame again.
    setHasRenderedFrame(false);
    onRetry();
  };

  const initialLoad =
    !hasRenderedFrame &&
    !errorMessage &&
    (status === 'idle' || status === 'loading');

  // This is a NETWORK BUFFERING overlay after a video already had a frame.
  // It is intentionally translucent: no black rectangle over the Reel.
  const buffering =
    hasRenderedFrame &&
    !errorMessage &&
    status === 'loading' &&
    active;

  return (
    <View style={[styles.page, { height }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
        useExoShutter={false}
        pointerEvents="none"
        onFirstFrameRender={() => {
          setHasRenderedFrame(true);
          setErrorMessage(null);

          if (active) {
            player.play();
          }
        }}
      />

      {/**
       * FIRST LOAD:
       * The player has not rendered a frame yet.
       * We show only a loader, without a second opaque black background.
       */}
      {initialLoad ? (
        <View pointerEvents="none" style={styles.initialLoaderLayer}>
          <View style={styles.loaderBubble}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.loaderText}>Loading…</Text>
          </View>
        </View>
      ) : null}

      {/**
       * REBUFFER:
       * The existing frame stays visible. The loader sits ON TOP of it.
       * We don't fade the VideoView and don't add a black cover.
       */}
      {buffering ? (
        <View pointerEvents="none" style={styles.bufferingLayer}>
          <View style={styles.bufferingBubble}>
            <ActivityIndicator color="#fff" size="small" />
          </View>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorCover} pointerEvents="auto">
          <View style={styles.errorBubble}>
            <Text style={styles.errorTitle}>Video unavailable</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>

            <Pressable style={styles.retryButton} onPress={retry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <FeedOverlay
        reel={reel}
        liked={liked}
        muted={muted}
        onLike={onLike}
        onComments={onComments}
        onToggleMute={onToggleMute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * Initial loader is transparent around the spinner.
   * There is no opaque black loading cover.
   */
  initialLoaderLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * Loader used while an already-visible video is buffering.
   * The underlying frame remains visible.
   */
  bufferingLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loaderBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.60)',
  },

  bufferingBubble: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },

  loaderText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  errorCover: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  errorBubble: {
    width: '82%',
    maxWidth: 320,
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.76)',
  },

  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  errorText: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },

  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
  },

  retryText: {
    color: '#000',
    fontWeight: '800',
  },
});
