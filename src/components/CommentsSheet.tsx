import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createComment, fetchComments } from '../api/comments';
import type { ReelComment } from '../types';

type Props = {
  visible: boolean;
  reelId: string;
  onClose: () => void;
};

export function CommentsSheet({ visible, reelId, onClose }: Props) {
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    setText('');

    void fetchComments(reelId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [reelId, visible]);

  const submit = async () => {
    const value = text.trim();
    if (!value || posting) return;

    setPosting(true);

    try {
      const comment = await createComment(reelId, value);
      setComments((current) => [comment, ...current]);
      setText('');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.commentList}
            contentContainerStyle={styles.commentContent}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : comments.length === 0 ? (
              <Text style={styles.empty}>Be the first to comment.</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {comment.username.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.commentBody}>
                    <Text style={styles.username}>@{comment.username}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <Text style={styles.meta}>
                      {comment.createdAt} · ♥ {comment.likes}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Add a comment..."
              placeholderTextColor="#888"
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={() => void submit()}
            />

            <Pressable
              style={styles.postButton}
              onPress={() => void submit()}
              disabled={posting}
            >
              {posting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.postText}>Post</Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: '78%',
    minHeight: 340,
    backgroundColor: '#111',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  header: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  close: { color: '#fff', fontSize: 30, lineHeight: 28 },
  commentList: { flex: 1 },
  commentContent: { paddingHorizontal: 16, paddingBottom: 12 },
  commentRow: { flexDirection: 'row', marginBottom: 16 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontWeight: '800' },
  commentBody: { flex: 1 },
  username: { color: '#fff', fontWeight: '800', fontSize: 13 },
  commentText: { color: '#eee', marginTop: 3, fontSize: 14 },
  meta: { color: '#777', fontSize: 11, marginTop: 5 },
  empty: { color: '#888', textAlign: 'center', marginTop: 36 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2b2b2b',
  },
  input: {
    flex: 1,
    minHeight: 44,
    backgroundColor: '#202020',
    borderRadius: 22,
    paddingHorizontal: 16,
    color: '#fff',
  },
  postButton: {
    marginLeft: 8,
    minWidth: 58,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff2d55',
  },
  postText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
