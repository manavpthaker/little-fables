Face-out book for the shelf — drawn cover framing real art, ribbon progress, authored star, pencil-sketch "still painting" state, and the lamplight beacon.

```jsx
<BookCover title="Miko and the Wobbly Bridge" pigment="river" progress={0.4} beacon
  art={<img src="cover.svg" width="90" />} onOpen={openBook} />
<BookCover title="Azad's Bird Book" authored sketch />
```

Notes:
- `beacon` = the one glowing next thing (squint test). Max one per screen.
- Ribbon is terracotta but is NOT the screen's action — the beacon glow is the invitation.
- `authored` marks the child's own books (star, top-left).
- Art must be drawn in the house style; never photos or glossy vectors.
