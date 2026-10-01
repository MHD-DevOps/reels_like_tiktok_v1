# Reels Feed — Stable Video Loading

This project uses Expo SDK 57, React Native 0.86, FlashList and expo-video.

## Video behavior

- One `VideoView` lives inside each visible FlashList cell.
- Persistent `VideoPlayer` instances are keyed by Reel ID.
- Current Reel plus three previous and three next Reels are preloaded.


## Run

```bash
npm install
npx tsc --noEmit
npx expo start -c
```

For a native Android build:

```bash
npx expo run:android
```

The demo feed uses short runtime MP4 URLs. Replace `REELS_API_URL` in `src/api/reels.ts` when your backend is ready.


### Reel restart behavior
Each time a Reel becomes active it starts from 0 seconds. We do not replace the
video source during normal scrolling, so an already-prepared/cached Reel is not
downloaded again just because it became active. During rebuffering we never call
`replay()`, which prevents flashing back to 0 seconds when the network pauses.
