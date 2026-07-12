Choice cards — 2–3 drawn objects to pick up (never more; ≤5 decisions per screen). Each choice is spoken aloud; the sound-arc mark shows it.

```jsx
<ChoiceCards
  choices={[
    { id: "lantern", label: "the lantern", art: <LanternArt /> },
    { id: "rope",    label: "the rope",    art: <RopeArt /> },
  ]}
  picked={picked}
  onPick={setPicked}
/>
```

Picked = lamplight ring (light, not checkmarks). No wrong answers exist — there are no loss states.
