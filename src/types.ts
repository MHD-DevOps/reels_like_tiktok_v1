export type Reel = {
  id: string;
  videoUrl: string;
  username: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  soundName: string;
};

export type ReelComment = {
  id: string;
  reelId: string;
  username: string;
  text: string;
  likes: number;
  createdAt: string;
};
