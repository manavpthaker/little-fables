Endpaper — wash field + tiny motif. Every book's open/close beat (900ms, `--motion-endpaper`) and the app's only loading state (`loading` blooms the motif). No spinner exists.

```jsx
<Endpaper pigment="river" motif="boat" style={{ position: "absolute", inset: 0 }} />
<Endpaper pigment="plum" motif="moon" loading />   // "the next page is being painted"
```

Transition grammar (see also ui_kits/home): book-open = room recedes + page rises through the endpaper; kamishibai = flat side-slide (520ms) between pages; both physical and continuous — never a cut.
