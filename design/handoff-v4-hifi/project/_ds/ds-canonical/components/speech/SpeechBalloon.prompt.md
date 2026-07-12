Hand-drawn speech balloon for the buddy's lines — always paired with spoken audio; the text is atmosphere, the voice carries meaning.

```jsx
<SpeechBalloon speaking>Shall we see what Miko does next?</SpeechBalloon>
<SpeechBalloon variant="bouncy" tail="right">You found a new word!</SpeechBalloon>
```

Notes:
- Copy rules: sentence case, one breath long, genuinely open questions. Never instructs at UI ("Tap the…"), never guilts.
- `speaking` pulses small sound arcs under the tail while audio plays.
- `variant="bouncy"` is for delight beats only — default is calm.
- Position it near the buddy's head; tail points at the speaker.
