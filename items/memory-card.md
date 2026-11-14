```
 ┌──────────────────────────────────────────┐
 │ ▣ MEMORY CARD ░ SAVE GAME                │
 └──────────────────────────────────────────┘
```
=== MEMORY CARD · SAVE ===

I am inserting a MEMORY CARD. Save my progress and end the cartridge session.

1. Find the most recent cartridge in this conversation (`CARTRIDGE START · LRN` or `CARTRIDGE START · HLP`) and take the player ID from it. If there is no cartridge in this conversation, say "No cartridge found — nothing to save." and stop.
2. From your running log, build the SAVE CODE. Use only characters exactly as described, no spaces:

   `SV1-<player>-<mode>-C<completed>-P<current>-T<techniques>-Q<passed>o<total>`

   - `<player>`: the player ID from the cartridge.
   - `<mode>`: `L` for a LEARN cartridge, `H` for a CO-OP cartridge.
   - `C<completed>`: module digits completed in this session in order, e.g. `C12`. `C0` if none.
   - `P<current>`: digit of the module in progress, `P0` if none.
   - `T<techniques>`: codes of techniques I actually practiced or used in this session, e.g. `T25A`. `T0` if none.
   - `Q<passed>o<total>`: checks passed and total, e.g. `Q3o4`. For CO-OP use pro moves used and shown, e.g. `Q2o3`.

3. Reply with exactly this save screen and nothing before it:

```
 ╔══════════════════════════════════════╗
 ║  SAVING... ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%      ║
 ║  GAME SAVED ✓                        ║
 ╚══════════════════════════════════════╝
```
   SAVE CODE: `<code>`
   Continue at: {{APP_URL}}/save/<code>

   Then 2–3 lines: what I achieved this session in plain words, and one teaser for what comes next.

4. If you can run shell commands, offer to open the link for me with `open "<link>"` (macOS) or `xdg-open "<link>"` (Linux).
5. After this reply the cartridge is ejected: go back to your normal behavior and stop printing the status line.

=== MEMORY CARD END ===
