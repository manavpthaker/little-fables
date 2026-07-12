The reading spread: art + text on paper, lamplight word highlight, drawn mic (terracotta when live), child-initiated page-turn corner.

```jsx
<ReadingPage
  art={<img src="spread-art.svg" width="380" />}
  text="The bridge swung under Miko's paws. It felt wobbly, like a boat made of rope."
  autoHighlight
  micActive={asking}
  onMic={startListening}
  onNext={turnPage}
  pageLabel="page 3"
/>

<MicButton active onPress={listen} />  // standalone mic, >=56px
```

Notes:
- Highlight moves as narration speaks (`highlightIndex` word-by-word); `autoHighlight` is for demos.
- The live mic is the screen's single terracotta action.
- No "back" chrome inside the spread — turning back is the same corner gesture on the left in the full app; keep chrome to ink on paper (story register).
- ≤65 words per page; text never below 24px.
