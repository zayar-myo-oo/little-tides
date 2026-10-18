# Little Tides

An original cozy browser game about wandering, fishing, and letting go. All island geometry, Pip the traveler, fish illustrations, animation, and lo-fi music are generated in the project. No paid assets, API keys, build step, or account is needed for local play.

## Play locally

With Node.js installed, run `npm start` in this folder, then open http://127.0.0.1:4173. Serve `dist/` with any static web server for other hosts. Opening index.html directly from disk is not supported because browsers restrict local ES modules.

## Controls

- WASD or arrow keys: wander; Shift: run; Space: hop.
- Drag: orbit the camera; scroll: zoom.
- E: interact with the dock, Moss, or benches.
- J: field notes; M: toggle music; Esc: cancel or close.
- Touch: thumbstick, jump, and action buttons.

Follow the sandy trail to the southeast dock. At the end, press E to cast. Wait for the float to dip, press E to hook, then press E when the marker enters the green zone. Release each fish to record the encounter. Six species, best lengths, and discovery milestones are saved in browser localStorage. Refreshing preserves discoveries but starts Pip back on the meadow path.

Walk the winding uphill path to Lighthouse Hill, talk to Moss by the cabin, rest at the fire or summit bench, change among three lighting moods, and save a PNG postcard. Audio is opt-in and synthesized with Web Audio at 74 BPM. Fish do not require music to be on.

## Art direction

Pip is an original small traveler with a wide straw hat, apricot raincoat, sage scarf and backpack, and brown boots. The visual palette combines sage meadows, muted turquoise water, cream paper, warm wood, and peach accents. The island includes a cabin, dock, lighthouse, campfire, pine and broadleaf trees, wildflowers, gulls, drifting clouds, and a moving sea.

Concept references: Messenger by Abeto (tiny-world exploration), A Short Hike by Adam Robinson-Yu (gentle wandering and climbing), and Slow Roads by anslo (calm atmosphere). No character models, textures, music, code, or other assets from those works are copied.

## Files and licensing

- `dist/game.js`: world generation, movement, fishing, persistence, music, and interactions.
- `dist/style.css` and `dist/index.html`: responsive game UI.
- `dist/vendor/three.module.js`: Three.js r170, distributed under the MIT license in `THREE-LICENSE.txt`.
- Optional Google Fonts fall back to system fonts when offline. Game rendering and audio use local assets.

The game is a single-player experience. WebGL and a modern browser are required. Touch controls use camera-relative movement. Fishing results are random and all fish are released; no combat or payment systems are present.
