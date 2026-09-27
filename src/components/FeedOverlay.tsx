import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Reel } from '../types';

type Props = {
  reel: Reel;
  liked: boolean;
  muted: boolean;
  onLike: () => void;
  onComments: () => void;
  onToggleMute: () => void;
};

export function FeedOverlay({
  reel,
  liked,
  muted,
  onLike,
  onComments,
  onToggleMute,
}: Props) {
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View pointerEvents="box-none" style={styles.bottomArea}>
        <View style={styles.info}>
          <Text style={styles.username}>@{reel.username}</Text>
          <Text style={styles.caption} numberOfLines={3}>
            {reel.caption}
          </Text>
          <Text style={styles.tags}>
            {reel.tags.map((tag) => `#${tag}`).join(' ')}
          </Text>
          <Text style={styles.sound}>♫ {reel.soundName}</Text>
        </View>

        <View style={styles.actions} pointerEvents="auto">
          <Pressable style={styles.action} onPress={onLike}>
            <Text style={[styles.icon, liked && styles.active]}>♥</Text>
            <Text style={styles.count}>{reel.likes + (liked ? 1 : 0)}</Text>
          </Pressable>

          <Pressable style={styles.action} onPress={onComments}>
            <Text style={styles.icon}>💬</Text>
            <Text style={styles.count}>{reel.comments}</Text>
          </Pressable>

          <Pressable style={styles.action} onPress={onToggleMute}>
            <Text style={styles.icon}>{muted ? '🔇' : '🔊'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  info: {
    flex: 1,
    paddingRight: 18,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  tags: {
    color: '#fff',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '700',
  },
  sound: {
    color: '#eee',
    fontSize: 12,
    marginTop: 10,
  },
  actions: {
    alignItems: 'center',
    gap: 18,
    paddingBottom: 4,
  },
  action: {
    alignItems: 'center',
    minWidth: 46,
  },
  icon: {
    color: '#fff',
    fontSize: 27,
    textShadowColor: '#000',
    textShadowRadius: 5,
  },
  active: {
    color: '#ff375f',
  },
  count: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
});
