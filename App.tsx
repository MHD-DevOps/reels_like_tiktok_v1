import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CommentsSheet } from './src/components/CommentsSheet';
import { ReelVideoItem } from './src/components/ReelVideoItem';
import { useReelFeed } from './src/hooks/useReelFeed';
import { VideoPlayerPool } from './src/video/VideoPlayerPool';
import type { Reel } from './src/types';

function ReelsScreen() {
  const { reels, initialLoading, error, loadMore } = useReelFeed();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
  const [playerVersion, setPlayerVersion] = useState(0);

  const pool = useMemo(() => new VideoPlayerPool(), []);

  useEffect(() => {
    return () => pool.releaseAll();
  }, [pool]);

  useEffect(() => {
    if (viewportHeight <= 0 || reels.length === 0) return;

    // Preload current + 2 before + 2 after.
    pool.syncWindow(reels, activeIndex);
    pool.pauseAllExcept(reels[activeIndex]?.id, muted);

    // FlashList cells are virtualized. This state update tells renderItem to
    // read the newly-created players from the pool.
    setPlayerVersion((version) => version + 1);
  }, [activeIndex, muted, pool, reels, viewportHeight]);

  useEffect(() => {
    if (reels.length > 0 && activeIndex >= reels.length - 3) {
      void loadMore();
    }
  }, [activeIndex, loadMore, reels.length]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (nextHeight > 0 && nextHeight !== viewportHeight) {
      setViewportHeight(nextHeight);
    }
  }, [viewportHeight]);

  const onMomentumScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      if (viewportHeight <= 0 || reels.length === 0) return;

      const index = Math.round(
        event.nativeEvent.contentOffset.y / viewportHeight,
      );
      const clamped = Math.max(0, Math.min(index, reels.length - 1));

      setActiveIndex((current) => (current === clamped ? current : clamped));
    },
    [reels.length, viewportHeight],
  );

  const toggleLike = useCallback((reelId: string) => {
    setLikedIds((current) => ({
      ...current,
      [reelId]: !current[reelId],
    }));
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Reel>) => {
      const player = pool.get(item.id);

      return (
        <ReelVideoItem
          reel={item}
          player={player}
          height={viewportHeight}
          active={reels[activeIndex]?.id === item.id}
          muted={muted}
          liked={Boolean(likedIds[item.id])}
          onLike={() => toggleLike(item.id)}
          onComments={() => setCommentsReelId(item.id)}
          onToggleMute={() => setMuted((value) => !value)}
          onRetry={() => {
            void pool.retry(item).finally(() => {
              setPlayerVersion((version) => version + 1);
            });
          }}
        />
      );
    },
    [activeIndex, likedIds, muted, playerVersion, pool, reels, toggleLike, viewportHeight],
  );

  if (initialLoading) {
    return (
      <View style={styles.center} onLayout={onLayout}>
        <StatusBar style="light" hidden />
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.centerText}>Loading reels…</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.center} onLayout={onLayout}>
        <StatusBar style="light" hidden />
        <Text style={styles.emptyTitle}>No reels</Text>
        <Text style={styles.centerText}>{error ?? 'The feed is empty.'}</Text>
        <Pressable style={styles.retryButton} onPress={() => void loadMore()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar style="light" hidden />

      {viewportHeight > 0 ? (
        <FlashList
          data={reels}
          renderItem={renderItem}
          extraData={{ activeIndex, muted, likedIds, playerVersion }}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          decelerationRate="fast"
          onMomentumScrollEnd={onMomentumScrollEnd}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.35}
          getItemType={() => 'reel'}
        />
      ) : null}

      {commentsReelId ? (
        <CommentsSheet
          visible
          reelId={commentsReelId}
          onClose={() => setCommentsReelId(null)}
        />
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ReelsScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: { color: '#aaa', marginTop: 10, textAlign: 'center' },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#ff2d55',
  },
  retryText: { color: '#fff', fontWeight: '800' },
});
