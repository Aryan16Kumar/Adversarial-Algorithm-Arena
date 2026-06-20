# Put art assets here

The game runs WITHOUT any files in this folder (it generates a procedural
pixel tileset + wizard at runtime). Add real art when you're ready:

- `tilemap_packed.png`  -> Kenney "Tiny Town" tileset (16x16). See ../README.md
- `your-character.png`  -> your wizard sprite

Then uncomment the matching `this.load.image(...)` lines in
`src/scenes/BootScene.js`.
