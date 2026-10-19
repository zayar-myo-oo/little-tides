# Future shared worlds — design intent, not implemented functionality

The current version is the user-selected single-device couple-world prototype. Its visitor view does not enforce identity or guest limits and cannot share memories with another browser. Keep that distinction in the UI until server-backed invitations exist.

## Product rules for the next stage

- The creator selects the world and invited people. A couple world defaults to two characters, including the creator.
- Each world has its own capacity, configurable from one to ten. Ten is the platform maximum, not the default for every world.
- Invitation possession alone must not expose a world's memories before acceptance and the server's access check. Offer invitation expiry and revocation. Do not make private couple worlds publicly enumerable.
- Define both membership slots and simultaneous online slots explicitly. A private couple world should remain limited to the intended couple, even when one person goes offline.
- The world owner edits scenery, notes, hiding positions, and photos. Guests explore and uncover. Per-person discovery records should not automatically mark a memory found for everyone.
- Provide export and recoverable deletion before encouraging people to rely on the service for irreplaceable memories.

## Server requirements

Migrate the static Site to a supported server runtime. Store worlds, memberships, hashed invitations, memories, and discoveries in a database. Store photos in private object storage and serve them only after a membership check. Keep credentials and authorization checks off the browser.

Invitation acceptance must claim a slot atomically. Concurrent requests must not exceed either the owner's capacity or the global maximum of ten. The owner counts as a member. Reject expired/revoked invitations, capacity overflow, unauthorized world edits, and cross-world photo reads on the server. Guest limits must never depend only on a hidden button or localStorage.

Add presence separately from durable membership. Bound update rates, interpolate character positions, expire disconnected presence leases, and resolve two tabs belonging to one member consistently. Validate world IDs and ownership on every read/write. Distinguish invited members from currently connected characters in the interface.

## Migration

Offer an explicit upload/import of locally created worlds and resized photos after sign-in. Explain what moves online and who can access it. Preserve original world IDs or map them during import, migrate per-memory IDs, and avoid duplicating an import on retries. Do not silently transmit current prototype letters or photos.

## Required verification before calling it shared

Test separate signed-in browsers, owner versus guest editing, simultaneous final-slot acceptance, per-world capacities 1/2/10, rejected capacity 11, invite revocation, expired presence, photo access after removal, and persistence across sessions. Verify private sharing without changing the whole Site's audience unintentionally.
