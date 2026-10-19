# Little Tides — full rebuild prompt

Copy everything below the line into any capable coding model (Claude, GPT, Gemini, etc.). It describes the whole project so a model can rebuild it from scratch or continue working on it.

---

You are building **Little Tides**, an original, cozy, single-player 3D browser game about wandering, fishing, befriending animals, and hiding "memory letters" for a loved one. Build it as a static web app with **no build step, no backend, no accounts, no API keys, and no external art/audio assets**. Everything visual and audible is generated in code.

## Tech constraints
- Plain ES modules + HTML + CSS. Three.js (r170) vendored at `dist/vendor/three.module.js` (MIT, include license file). No bundler.
- All deployable files live in `dist/`. Entry: `dist/index.html` → `dist/game.js` (module).
- `server.mjs`: tiny Node `http` static server for `dist/` (path-traversal safe, `Cache-Control: no-cache`, `PORT` env, binds `0.0.0.0` by default so devices on the same Wi-Fi can connect). `package.json` scripts: `start`/`dev` run the server; `check` runs `node --check` on every JS file.
- `.github/workflows/pages.yml` deploys `dist/` to GitHub Pages on push to `main` (public URL so anyone can open it). Add `dist/.nojekyll`.
- Persist with `localStorage` only, with try/catch around every read/write and validation of everything loaded.
- Must work on desktop (keyboard + mouse) and mobile (virtual thumbstick, jump and action buttons, camera-relative movement). Cap pixel ratio ~1.7.

## Art direction
- Low-poly, flat-shaded `MeshStandardMaterial` (roughness 1, `flatShading: true`), cached per color via a `mat(color)` helper. Primitive helpers: `mesh`, `box`, `ball`, `cyl`, `link` (cylinder between two points). Merge static props with a `batchStatic(group)` helper for performance.
- Palette: sage meadows, muted turquoise water, cream paper UI, warm wood, peach accents. Serif display headings, small letter-spaced "eyebrow" labels, soft rounded cards.
- Renderer: antialias, `preserveDrawingBuffer` (for postcards), sRGB output, ACES filmic tone mapping (~1.28 exposure), PCF soft shadows, exponential fog matching the sky.
- Three lighting moods (golden afternoon, soft morning, night) that lerp sky, fog, water, sun color/intensity, hemisphere intensity, exposure. Night adds a lighthouse beacon and brighter campfire.
- **Polish layer (`dist/polish.js`)**: a gradient sky-dome `ShaderMaterial` (horizon = current background color, deeper top, sun glow) that follows the player; a tight directional-light shadow frustum (~±48 units, 3072 map on desktop, ±38 on touch) that follows the player and snaps to whole shadow texels to prevent shimmer; ~160 additive drifting light motes (fewer on mobile) that wrap around the player; a subtle CSS radial vignette.
- Pip, the player: small original traveler — wide straw hat, apricot raincoat, sage scarf & backpack, brown boots — with idle bob, walk cycle, arms, hop. A reusable `traveler(coatColor, hatColor, scale)` factory builds characters.
- Concept inspirations only (do not copy assets): Messenger by Abeto, A Short Hike, Slow Roads.

## World & gameplay (`dist/game.js`, `dist/world-expansion.js`)
- Starting island **Little Tides**: meadow, winding sandy paths, cabin with bunting, dock, Lighthouse Hill, campfire, benches, pines and broadleaf trees, wildflowers, gulls, drifting clouds, animated sea. NPC **Moss** to talk to by the cabin.
- Connected expansion "The Farther Shores": **Clover Farm** (windmill, barn, orchard, garden, hay, trough, fences), **Mushroom Woods** (big mushroom caps give higher jumps), **Willow Falls** (moving water, butterflies), **Cloudrest Peak** (steep scramble; summit stamp unlocks a panoramic camera). Bridges and a red-flag trail connect them.
- Controls: WASD/arrows walk, Shift run, Space hop (hold on steep ground to scramble, using energy that recovers when resting), drag to orbit, scroll to zoom, E interact, J field notes, G/Tab map, M music, Esc close.
- **Fishing**: at the dock end press E to cast → wait for the float to dip → E to hook → E when a moving marker is in the green zone. Six original species with descriptions, random lengths, best lengths saved. Every fish is released ("Back to the blue").
- Seven named animals (Clover & Mochi sheep, Maple cow, Peaches pig, Button rabbit, Sunny chicken, Pebble goat): pet, feed carrots, invite one to follow. Friendship persists.
- Fifteen carrot plants (3 carrots per harvest, 60 s regrow), start with 8 carrots. Twelve collectible shells. Objectives checklist, field-notes journal, stylized map with "Follow trail" direction and "Visit" fast travel to discovered places.
- Postcard button: renders the frame to PNG with a cream border and "little tides" caption.
- Opt-in lo-fi music synthesized with Web Audio at 74 BPM, plus chimes.
- Gentle tone: no combat, no payments, no failure states.

## Memory worlds (`dist/memory-world.js`, `dist/memory-world.css`)
- "Worlds ♡" button opens a library: the main islands plus up to six memory worlds (sample "Our little corner" created on first run). Themes: Peach garden, Moonlit cove, Woodland picnic — each with its own sky/water/light/ground/leaf/accent palette.
- Entering a memory world hides the main scene and builds a small island: blossom trees, flowers, a flower arch, picnic blanket and basket, a dock, bench, rope swing, and a partner traveler who turns to face you.
- Settings: world name, theme, both people's names, both coat colors.
- Creator: walk anywhere and "Hide a memory" (or B): title, letter text (≤5000 chars), letter/postcard style, optional photo (JPG/PNG/WebP < 10 MB, resized to ≤900 px JPEG, < 300 KB). Max 12 memories. Markers: dirt mound, sprout, floating spinning sparkle, little flag in creator view.
- "Visit as my person" switches to visitor view (other coat color). Walk near a sparkle, press E → short dig animation → envelope/postcard reveal modal with photo and "From X, for Y ♡". Found state persists.
- **Share a link ↗** (creator view): serialize the world (found list cleared, photos shrunk to ~420 px JPEG q0.55), gzip with `CompressionStream`, base64url, and put it in `location.hash` as `#gift=…` (fragments are never sent to the server). If the result exceeds ~120k chars, regenerate without photos and say so. Use `navigator.share` on touch devices, otherwise copy to clipboard. On load, detect `#gift=`, clear it from the URL, decompress, run the same validation as localStorage data, store as a gift world (visit-only: no editing, no switching to creator), and drop the recipient straight into visitor view. Show a friendly error for corrupted links.
- Be honest in the UI: this is not authenticated sharing; anyone with the link can read it.

## Quality bar
- No console errors. Validate all stored/linked data (string lengths, hex colors, coordinate clamps, photo data-URL prefix and size).
- Accessible: aria labels on icon buttons, `role="dialog"` modals with backdrop click and Esc to close, `aria-live` toast.
- Responsive layout down to phone width; loading screen that fades once the first frame renders.
- README documents controls, features, sharing, hosting, file layout, and licensing.

## Future direction (document, don't fake)
Real multi-device shared worlds need a server: accounts, hashed expiring/revocable invites, per-world member caps (1–10, atomic slot claims), private photo storage behind membership checks, per-person discovery records, presence separate from membership, and explicit import of local worlds. Keep that in `docs/future-sharing.md`.
