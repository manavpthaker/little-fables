The buddy is the bear companion — the app's voice and hands, drawn in the house style, always breathing, never pleading.

```jsx
<Buddy pose="idle" size={220} />
<Buddy pose="listening" />   // lean-in while the child speaks
<Buddy pose="pointing" />    // directs attention (pair with a spoken line)
<Buddy pose="celebrating" /> // arms up, lantern-light glow — light, not confetti
```

Notes:
- Idle breath loops on `--motion-breath` (2.6s); holds still under reduced motion.
- The celebrating glow uses `--glow-lamplight` — celebrations are light, never confetti.
- The buddy never begs, guilts, or looks disappointed. There is no "sad" pose by design.
- Pair every buddy gesture with a spoken line (see SpeechBalloon).
