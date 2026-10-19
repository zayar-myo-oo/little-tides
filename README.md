# Little Tides

## Memory-world prototype

Choose **Worlds** in the header, then create a memory world or enter the sample **Our little corner**. Up to six local worlds are supported, with peach garden, moonlit cove, and woodland picnic themes. Set both travelers' names and coat colors. “Make it yours” edits the active world's settings.

Walk to a hiding place and choose **Hide a memory** (or B). Add a title, letter, optional photo, and letter/postcard style. Up to twelve memories fit in a world. JPG, PNG, and WebP files below 10 MB are resized locally to at most 900 pixels and stored as compressed JPEGs. Photos and text are never uploaded by this prototype. Quota failures retain the editor and show a save error.

**Visit as my person** switches to the other character's look and visitor preview. Look for a sparkle, walk close, and press E to uncover the envelope or postcard. Creator controls are hidden in preview. Use **Back to creating** to edit. Creator preview is not an authentication or authorization boundary; this is a single-device prototype.

Worlds and memories use `little-tides-memory-v1` in localStorage, separate from the original fish and exploration save. Refresh preserves saved content and discoveries, but starts at the main menu. Data remains specific to the browser and site origin; local preview data does not automatically move to the hosted Site. Clearing browser storage removes it. Total photo capacity depends on the browser's storage quota.

**Share a link:** in creator view, press **Share a link ↗**. The whole world (names, letters, and photos shrunk to ~420px) is gzip-compressed into the link's `#gift=` fragment, which browsers never send to the server. Whoever opens it gets a visit-only copy on their own device. Anyone holding the link can read it, so send it privately. Very large photo sets fall back to a letters-only link. Choose **Link lasts 1 day** (the default) and the link stops opening after 24 hours. The recipient's copy is also deleted from their device then. This expiry is enforced in the browser, so it is a gentle limit, not a security guarantee.

**Hosting so others can open it:** push to GitHub and enable *Settings → Pages → Source: GitHub Actions*; `.github/workflows/pages.yml` publishes `dist/` to a public URL. `npm start` also listens on all interfaces, so people on the same Wi-Fi can open `http://<your-ip>:4173`.

**Not yet implemented:** server-backed invites, separate-device visits, real multiplayer, server-enforced guest limits, and cloud photo storage. The published Site remains owner-private. The planned sharing model is documented in `docs/future-sharing.md`; no inactive sharing controls pretend to enforce it.

`dist/memory-world.js` and `dist/memory-world.css` contain the prototype. All scenery and character models are original procedural geometry; the sample letters are editable placeholders.

## The Farther Shores update

The original island is now part of a larger connected world with five places: Little Tides, Clover Farm, Mushroom Woods, Willow Falls, and Cloudrest Peak. Bridges connect the farm and woodland, while a flagged northern trail leads to the mountain summit. Existing fish records remain compatible with the same save format.

- Seven named animals: Clover and Mochi the sheep, Maple the cow, Peaches the pig, Button the rabbit, Sunny the chicken, and Pebble the goat. Pet, feed, or invite one animal to follow; companions return home when dismissed. Friendship and feeding milestones persist; an active companion resets on reload.
- Fifteen carrot plants supply three carrots per harvest and regrow after sixty seconds of active play. Start with eight carrots. Backpack carrots persist; regrowth timers restart on reload.
- Twelve collectible shells are placed around the world and persist in field notes.
- Hold Space to scramble on steep Cloudrest ground. Scrambling uses energy that recovers when resting. Shift runs faster. Large woodland mushrooms give a higher jump when standing on their caps.
- G, Tab during play, or the Island map button opens the map. Follow trail shows a direction and distance; Visit becomes available after discovering a destination. The map is a stylized overview, so use signs and sandy paths for bridges and switchbacks.
- The summit stamp is collected with E and unlocks a panoramic camera view. Friends, discoveries, carrots, shells, and the stamp are saved locally along with existing fish records.
- The farm includes an animated windmill, barn, orchard, garden, hay bales, trough, fences, and animal idle/walking animations. Willow Falls adds moving water and butterflies; the original cabin gains bunting and dock details.

The experience remains single player and gentle: the climbing is a simple original scramble mechanic, without PEAK's multiplayer or full climbing simulation.

`dist/world-expansion.js` owns the expanded scenery, animals, exploration activities, and map. `dist/expansion.css` contains its interface styling. All added models and animations are procedural original work.

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
