import type { ReelComment } from '../types';

const DEMO_COMMENTS: ReelComment[] = [
  {
    id: 'comment-1',
    reelId: '',
    username: 'maya',
    text: 'This looks amazing 🔥',
    likes: 18,
    createdAt: '2h',
  },
  {
    id: 'comment-2',
    reelId: '',
    username: 'sam',
    text: 'Where is this?',
    likes: 7,
    createdAt: '1h',
  },
  {
    id: 'comment-3',
    reelId: '',
    username: 'lina',
    text: 'Need a part 2 👀',
    likes: 11,
    createdAt: '42m',
  },
];

export async function fetchComments(reelId: string): Promise<ReelComment[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return DEMO_COMMENTS.map((comment) => ({ ...comment, reelId }));
}

export async function createComment(
  reelId: string,
  text: string,
): Promise<ReelComment> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  return {
    id: `comment-${Date.now()}`,
    reelId,
    username: 'you',
    text,
    likes: 0,
    createdAt: 'now',
  };
}
