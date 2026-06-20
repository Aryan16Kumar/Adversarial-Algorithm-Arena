Art assets used by the game (loaded in src/scenes/BootScene.js):

- map.png                -> overworld map background (1402x1122)
- builder sprite.png     -> player "Builder" (1254x1254 sheet, 5 cols x 4 rows)
- Witch.png              -> opponent "Witch" (same layout)
- Ai wizards sprite.png  -> opponent "Wizard" (same layout)
- castle sprite.png      -> reference sheet (not currently loaded)

To swap art, replace the file and keep the dimensions/layout, or update the
matching values in src/config.js (MAP_W/MAP_H, ASSETS, SHEET). See ../README.md.
