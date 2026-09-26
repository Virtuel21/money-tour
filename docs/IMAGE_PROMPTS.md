# Images de la refonte 3D

## Cases Chance et Taxe — septembre 2026

Fichier livré : `apps/web/public/textures/special-tiles-v1.webp`. Générateur d'images intégré de ChatGPT ; image originale inspectée puis encodée en WebP qualité 90, sans retouche créative. Atlas 2:1 : moitié gauche Chance, moitié droite Taxe. Utilisé sur les six cases spéciales et dans la popup de taxe.

Prompt exact :

> Create a production game texture atlas for Money Tour, a cheerful premium cartoon travel-property board game. One wide image, aspect ratio 2:1, containing exactly TWO equally sized SQUARE tile illustrations side by side edge to edge. LEFT square: vibrant royal purple background, an ivory open envelope with a large golden question mark medallion and a few gold stars, magical chance/reward mood. RIGHT square: rich coral orange background, a cream tax receipt and a chunky gold coin stack, a comical small rubber stamp, lighthearted fee mood. Orthographic straight top-down flat tile artwork, no perspective tilt, no scene, no people, no board, no mockup. Sculpted painted cartoon shading, rounded edges, crisp strong silhouette, detailed but readable at small size. Each motif contained inside central 65 percent of its square, generous colored margin. No written words, no letters, no numbers, no logos, no watermark; question-mark symbol only on the left. Uniform lighting from upper left. Full-bleed opaque colored backgrounds, no transparency. These will be mapped to 3D square board tiles; do not add extruded outer borders.

Outil : générateur d’images intégré de ChatGPT, utilisé directement (pas de CLI/API externe). Génération originale le 26 septembre 2026. Les images ont été inspectées puis redimensionnées et encodées en WebP avec Sharp, sans retouche du contenu.

## `apps/web/public/textures/ocean.webp`

Prompt exact :

> Use case: stylized-concept. Asset type: seamless albedo ocean texture for a playful low-poly 3D board game. Generate a square top-down flat hand-painted turquoise tropical ocean surface, cheerful cartoon style, soft faceted aqua variations with sparse tiny ivory curved wave marks. Uniform scale across image, seamless tileable edges. No islands, objects, lettering, borders, perspective, horizon or shadows. This is an actual material texture, not a mockup. Harmonious teal #2dc9cf, pale aqua #8ee1d5 and occasional creamy white highlights. 1024 square.

Export : 1024 × 1024, WebP qualité 85 ; appliqué au plan d’eau central de la scène Three.js.

## `apps/web/public/textures/chance.webp`

Prompt exact :

> Use case: stylized-concept. Asset type: illustration for the center of a Chance card in the original Money Tour cartoon board game. A charming purple envelope opens with a golden star, two gold coins and tiny aqua sparkles emerging, isolated centered on a warm ivory paper background. Polished low-poly 3D toy illustration with beveled edges, soft shadows, turquoise and sunny gold accents, cheerful premium family board-game look. Square image, generous empty margin. No lettering, no logo, no frame, no watermark. This is a final game illustration.

Export : 600 × 600, WebP qualité 88 ; utilisé dans l’animation centrale de tirage de carte. Le titre et le contenu viennent des données du jeu, pas de l’image.

## Édition Voyage — atlas détaillés

Outil : générateur d’images intégré de ChatGPT. Références : personnages, bâtiments et plateau fournis par Julien. Les PNG restent dans les fichiers de travail locaux ; les exports WebP qualité 94 conservent l’alpha. La scène utilise un seuil alpha pour supprimer le voile résiduel autour des bâtiments ; le seuil suit l’opacité lors des transparences.

### travelers-v3.webp — 1254 × 1254, quatre personnages

Prompt exact :

> Production game sprite atlas, stylized-concept, transparent background. Reference is identity/style only. Create FOUR highly polished detailed full-body cartoon travelers in a strict 2x2 grid of equal square cells, each centered with generous transparent padding, feet at 90% of each cell. No text, no borders, no logos, no backdrop, no floor. All face camera three-quarter slightly to right, same scale, complete feet and hair. Top left Léa exactly reference: big expressive eyes, detailed copper bob, round brown glasses, teal blazer cream blouse mustard trousers gold hoops white teal sneakers. Top right Max exactly reference: stocky friendly man, curly brown hair beard coral overshirt ivory tshirt navy trousers olive backpack white blue sneakers. Bottom left Lou: woman with dark brown skin, dark braided hair, violet jacket cream shirt blue trousers lavender sneakers. Bottom right Noa: young man tan skin, wavy dark hair, golden yellow jacket navy shorts cream shirt white sneakers small travel satchel. Rich crafted materials, fine seams/buttons/shoelaces, appealing faces, warm soft studio lighting, ambient occlusion, beautiful 3D animated movie finish, match quality and proportions of reference. Four isolated cutouts on genuine alpha. This is a single runtime atlas, not a concept sheet.

### architecture-v3.webp — 1536 × 1024, six éléments

Prompt initial exact :

> Create one production game sprite atlas of SIX separate detailed 3D cartoon renders on transparent alpha. Strict 3 columns x 2 rows, six EQUAL SQUARE cells, no objects touching or crossing cell edges, each object fully contained and centered within its cell with 10% padding. No labels/text/logo, no grid or backdrop. Orthographic three-quarter view showing front and right faces, camera 35 degrees above horizon, lighting upper left. Reference1 house/hotel identities, Reference2 island diorama style, beautiful highly detailed sculpted cartoon finish. Top left: cream Mediterranean house terracotta hip roof chimney turquoise louver shutters, arched wooden door, lantern, window boxes individual leaves and flowers, stone steps potted shrubs. Top middle: coral boutique hotel navy mansard roof, dormers, arched cream window surrounds, gold entrance canopy, double door brass handles, flowers and pots. Top right: Paris island diorama with Eiffel tower detailed lattice arches, Haussmann slate roof buildings balconies chimneys, stone bridge arch, trees, tiny cobblestone promenades, layered cream stone shoreline. Bottom left: London island diorama with Big Ben detailed clock and spire, red bus, brick townhouses chimneys, bridge and trees. Bottom middle: New York island diorama with Empire State Building detailed windows setback spire, colorful brownstone blocks, park trees, bridge stone shoreline. Bottom right: Tokyo island diorama with Tokyo Tower white/red lattice, Fuji mountain, pastel Tokyo buildings windows, cherry blossom trees, stone island shore. Keep proportions like source concepts, cohesive colors turquoise slate cream coral and leafy green. Game ready quality. Six clean isolated sprites on genuine alpha, no water rectangle behind island, no text.

Retouche exacte, appliquée à ce résultat :

> Edit this exact six-sprite atlas: REMOVE ALL BACKGROUND including every colored haze, glow, shadow outside the subjects. Make the house, hotel, Paris, London, New York and Tokyo solid opaque clean cutouts on genuine fully transparent alpha. Preserve the six objects' appearance/detail and strict 3 columns 2 rows layout. Slightly reduce each subject to leave a clear 8% transparent margin within its equal cell. No soft halos. Keep water only as narrow solid blue edge directly at each island base. No checkerboard drawn, no text, no background colors. Game engine ready isolated sprites.
