# Images de la refonte 3D

Outil : générateur d’images intégré de ChatGPT, utilisé directement (pas de CLI/API externe). Génération originale le 26 septembre 2026. Les images ont été inspectées puis redimensionnées et encodées en WebP avec Sharp, sans retouche du contenu.

## `apps/web/public/textures/ocean.webp`

Prompt exact :

> Use case: stylized-concept. Asset type: seamless albedo ocean texture for a playful low-poly 3D board game. Generate a square top-down flat hand-painted turquoise tropical ocean surface, cheerful cartoon style, soft faceted aqua variations with sparse tiny ivory curved wave marks. Uniform scale across image, seamless tileable edges. No islands, objects, lettering, borders, perspective, horizon or shadows. This is an actual material texture, not a mockup. Harmonious teal #2dc9cf, pale aqua #8ee1d5 and occasional creamy white highlights. 1024 square.

Export : 1024 × 1024, WebP qualité 85 ; appliqué au plan d’eau central de la scène Three.js.

## `apps/web/public/textures/chance.webp`

Prompt exact :

> Use case: stylized-concept. Asset type: illustration for the center of a Chance card in the original Money Tour cartoon board game. A charming purple envelope opens with a golden star, two gold coins and tiny aqua sparkles emerging, isolated centered on a warm ivory paper background. Polished low-poly 3D toy illustration with beveled edges, soft shadows, turquoise and sunny gold accents, cheerful premium family board-game look. Square image, generous empty margin. No lettering, no logo, no frame, no watermark. This is a final game illustration.

Export : 600 × 600, WebP qualité 88 ; utilisé dans l’animation centrale de tirage de carte. Le titre et le contenu viennent des données du jeu, pas de l’image.
