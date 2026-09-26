import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { type GameState } from '@money-tour/engine';
import type { Cue } from '../game/presentation';
import { colors } from '../game/local';

export function tilePoint(id: number, count = 28) {
  const side = count / 4;
  const step = 14.4 / side;
  if (id <= side) return { x: 7.2 - id * step, z: 7.2 };
  if (id <= side * 2) return { x: -7.2, z: 7.2 - (id - side) * step };
  if (id <= side * 3) return { x: -7.2 + (id - side * 2) * step, z: -7.2 };
  return { x: 7.2, z: -7.2 + (id - side * 3) * step };
}
const up = new THREE.Vector3(0, 1, 0);
// Blender Z up -> glTF Y up. Opposite faces sum to seven.
const faceNormals = [
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, -1, 0),
];
function compact(source: THREE.Object3D) {
  source.updateWorldMatrix(true, true);
  const inverse = source.matrixWorld.clone().invert();
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  source.traverse((node) => {
    if (!(node instanceof THREE.Mesh) || Array.isArray(node.material)) return;
    const geometry = node.geometry.clone().applyMatrix4(inverse.clone().multiply(node.matrixWorld));
    // These Blender assets use solid materials. Primitive UVs must not prevent
    // merging with the hand-built roof, arch and facial meshes, which have no UVs.
    geometry.deleteAttribute('uv');
    const list = batches.get(node.material) ?? [];
    list.push(geometry);
    batches.set(node.material, list);
  });
  const group = new THREE.Group();
  for (const [material, geometries] of batches) {
    const merged = mergeGeometries(geometries);
    if (merged) {
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
    }
    geometries.forEach((g) => g.dispose());
  }
  return group;
}
function caption(text: string, width: number, height: number, color = '#163d4b') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const context = canvas.getContext('2d')!;
  context.scale(2, 2);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    context.font = `${lines.length === 1 ? '900 120' : i ? '600 50' : '900 76'}px Trebuchet MS, sans-serif`;
    context.fillText(line, 256, lines.length === 1 ? 96 : 60 + i * 85, 490);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = 4;
  return sprite;
}

export default function Board({
  state,
  onTile,
  reducedMotion = false,
  demo = false,
  cue,
  choices = [],
}: {
  state: GameState;
  onTile: (id: number) => void;
  reducedMotion?: boolean;
  demo?: boolean;
  cue?: Cue;
  choices?: number[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ state, cue, reducedMotion, choices });
  live.current = { state, cue, reducedMotion, choices };
  const update = useRef<() => void>(() => {});
  const [error, setError] = useState(''),
    [ready, setReady] = useState(false);
  const [anchors, setAnchors] = useState<{ x: number; y: number; points: string }[]>([]);
  useEffect(() => {
    const element = host.current!;
    let disposed = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let observer: ResizeObserver | undefined;
    const resources = new THREE.Group();
    const disposePending = (root: THREE.Object3D) =>
      root.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          for (const m of Array.isArray(node.material) ? node.material : [node.material])
            m.dispose();
        }
      });
    let cleanup = () => disposePending(resources);
    const initialize = async () => {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NeutralToneMapping;
        renderer.toneMappingExposure = 0.9;
        element.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        scene.add(resources);
        const camera = new THREE.OrthographicCamera(-12.2, 12.2, 8.3, -8.3, 0.1, 80);
        camera.position.set(18, 22, 18);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        const resize = () => {
          const size = element.clientWidth;
          renderer!.setSize(size, size * (8.3 / 12.2), false);
        };
        observer = new ResizeObserver(resize);
        observer.observe(element);
        resize();
        scene.add(new THREE.HemisphereLight(0xf4fcff, 0xa8a388, 1.8));
        const light = new THREE.DirectionalLight(0xfff4df, 2.4);
        light.position.set(-8, 20, 10);
        light.castShadow = true;
        light.shadow.mapSize.set(2048, 2048);
        light.shadow.camera.left = -12;
        light.shadow.camera.right = 12;
        light.shadow.camera.top = 12;
        light.shadow.camera.bottom = -12;
        light.shadow.normalBias = 0.025;
        light.shadow.radius = 3;
        scene.add(light);
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(200, 200),
          new THREE.MeshStandardMaterial({ color: 0xd5edf2, roughness: 1 }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        resources.add(ground);
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(
          `${import.meta.env.BASE_URL}models/money-tour.glb?v=${import.meta.env.VITE_MODEL_REVISION}`,
        );
        if (disposed) {
          disposePending(gltf.scene);
          return;
        }
        const templates = new Map<string, THREE.Group>();
        for (const name of [
          'board',
          'tile',
          'die',
          'palm',
          'chance',
          'championship',
          'tax',
          'travel',
          'start',
          'plot',
        ]) {
          const original = gltf.scene.getObjectByName(name);
          if (!original) throw new Error(`Modèle absent : ${name}`);
          templates.set(name, compact(original));
        }
        const clone = (name: string) => templates.get(name)!.clone(true);
        resources.add(clone('board'));
        const textureLoader = new THREE.TextureLoader();
        const [travelers, architecture] = await Promise.all([
          textureLoader.loadAsync(import.meta.env.BASE_URL + 'textures/travelers-v3.webp'),
          textureLoader.loadAsync(import.meta.env.BASE_URL + 'textures/architecture-v3.webp'),
        ]);
        if (disposed) {
          travelers.dispose();
          architecture.dispose();
          disposePending(gltf.scene);
          return;
        }
        const atlasSprite = (
          atlas: THREE.Texture,
          index: number,
          columns: number,
          width: number,
          height: number,
        ) => {
          const map = atlas.clone();
          map.colorSpace = THREE.SRGBColorSpace;
          map.repeat.set(1 / columns, 0.5);
          map.offset.set((index % columns) / columns, index < columns ? 0.5 : 0);
          map.anisotropy = renderer!.capabilities.getMaxAnisotropy();
          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map,
              alphaTest: 0.7,
              transparent: true,
              depthWrite: false,
              toneMapped: false,
            }),
          );
          sprite.center.set(0.5, 0.05);
          sprite.scale.set(width, height, 1);
          return sprite;
        };
        // Detailed pre-rendered dioramas: a fixed three-quarter camera lets the art retain its fine detail.
        [
          [-3.8, 1.5],
          [1.5, -3.8],
          [-0.2, 4.9],
          [4.9, -0.2],
        ].forEach(([x, z], i) => {
          const island = atlasSprite(architecture, i + 2, 3, 4.6, 4.6);
          island.position.set(x!, 0.08, z!);
          resources.add(island);
        });
        const sea = new THREE.Mesh(
          new THREE.BoxGeometry(12.6, 0.06, 12.6),
          new THREE.MeshStandardMaterial({ color: '#31cbd0', roughness: 0.4 }),
        );
        sea.position.y = 0.02;
        resources.add(sea);
        for (let i = 0; i < 34; i++) {
          const ripple = new THREE.Mesh(
            new THREE.PlaneGeometry(0.22 + (i % 3) * 0.13, 0.045),
            new THREE.MeshBasicMaterial({ color: '#b1f5ed', transparent: true, opacity: 0.55 }),
          );
          ripple.rotation.x = -Math.PI / 2;
          ripple.rotation.z = -Math.PI / 4;
          ripple.position.set(((i * 37) % 113) / 10 - 5.5, 0.06, ((i * 29) % 109) / 10 - 5.4);
          resources.add(ripple);
        }
        // The water and its graphic ripples are authored in Blender with the islands.
        const buildings: THREE.Group[] = [],
          trims: THREE.Mesh[] = [],
          borders: THREE.Mesh[] = [],
          flags: THREE.Sprite[] = [];
        for (const tile of live.current.state.config.board) {
          const p = tilePoint(tile.id, live.current.state.config.board.length),
            cell = clone('tile');
          cell.position.set(p.x, 0, p.z);
          cell.scale.set(1.12, 1, 1.12);
          resources.add(cell);
          const strip = new THREE.Mesh(
            new THREE.BoxGeometry(1.55, 0.045, 0.24),
            new THREE.MeshStandardMaterial({ color: tile.color ?? '#f9c34f' }),
          );
          strip.position.set(0, 0.27, -0.72);
          cell.add(strip);
          const trim = new THREE.Mesh(
            new THREE.BoxGeometry(1.99, 0.25, 0.23),
            new THREE.MeshStandardMaterial({ color: 0xffffff }),
          );
          trim.position.set(p.x, 0.18, p.z);
          if (tile.id <= live.current.state.config.board.length / 4) trim.position.z += 1.02;
          else if (tile.id <= live.current.state.config.board.length / 2) {
            trim.rotation.y = Math.PI / 2;
            trim.position.x -= 1.02;
          } else if (tile.id <= (live.current.state.config.board.length * 3) / 4)
            trim.position.z -= 1.02;
          else {
            trim.rotation.y = Math.PI / 2;
            trim.position.x += 1.02;
          }
          resources.add(trim);
          trims.push(trim);
          const outline = new THREE.Mesh(
            new THREE.BoxGeometry(1.74, 0.025, 1.74),
            new THREE.MeshStandardMaterial({ color: 0xffdf55, transparent: true, opacity: 0.7 }),
          );
          outline.position.set(p.x, 0.27, p.z);
          outline.visible = false;
          resources.add(outline);
          borders.push(outline);
          const city = new THREE.Group();
          city.position.set(p.x, 0.26, p.z - 0.44);
          resources.add(city);
          buildings.push(city);
          if (tile.type === 'resort' || tile.type === 'island') {
            const palm = clone('palm');
            palm.scale.setScalar(0.9);
            palm.position.set(p.x, 0.26, p.z - 0.3);
            resources.add(palm);
          }
          if (!['city', 'resort', 'island'].includes(tile.type)) {
            const icon = clone(tile.type);
            icon.position.set(p.x, 0.27, p.z - 0.3);
            resources.add(icon);
          }
          const flag = caption('⚑ ×2', 0.38, 0.22, '#b55b20');
          flag.position.set(p.x - 0.58, 0.7, p.z - 0.5);
          resources.add(flag);
          flags.push(flag);
        }
        setAnchors(
          live.current.state.config.board.map((t) => {
            const p = tilePoint(t.id, live.current.state.config.board.length);
            const v = new THREE.Vector3(p.x + 0.48, 0.3, p.z + 0.48).project(camera);
            const points = [
              [-0.98, -0.98],
              [-0.98, 0.98],
              [0.98, 0.98],
              [0.98, -0.98],
            ]
              .map(([x, z]) => {
                const corner = new THREE.Vector3(p.x + x!, 0.27, p.z + z!).project(camera);
                return (corner.x + 1) * 50 + ',' + (1 - corner.y) * 50;
              })
              .join(' ');
            return { x: (v.x + 1) * 50, y: (1 - v.y) * 50, points };
          }),
        );
        const pawns = live.current.state.players.map((_, i) => {
          const pawn = new THREE.Group();
          const character = atlasSprite(travelers, i, 2, 2.55, 2.55);
          pawn.add(character);
          const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.53, 0.12, 32),
            new THREE.MeshStandardMaterial({ color: colors[i] }),
          );
          pawn.add(base);
          pawn.scale.setScalar(0.7);
          resources.add(pawn);
          const badge = caption(String(i + 1), 0.3, 0.3, colors[i]);
          badge.position.set(0, 2.28, 0);
          pawn.add(badge);
          return pawn;
        });
        const dice = [clone('die'), clone('die')];
        dice.forEach((die, i) => {
          die.position.set(i ? 0.52 : -0.52, 0.55, 1.0);
          die.scale.setScalar(1.15);
          resources.add(die);
        });
        let lastCue: Cue | undefined,
          started = 0;
        const signatures: string[] = [];
        const detached: THREE.Object3D[] = [];
        const draw = () => {
          const game = live.current.state;
          game.config.board.forEach((tile, i) => {
            const prop = game.properties[tile.id],
              owner = game.players.findIndex((p) => p.id === prop?.ownerId);
            trims[i]!.visible = owner >= 0;
            (trims[i]!.material as THREE.MeshStandardMaterial).color.set(
              colors[owner] ?? '#ffffff',
            );
            borders[i]!.visible = live.current.choices.includes(tile.id);
            flags[i]!.visible = game.festivals.includes(tile.id);
            const signature = String(prop?.level ?? 0) + ':' + String(prop?.ownerId);
            if (signatures[i] === signature) return;
            signatures[i] = signature;
            const group = buildings[i]!;
            detached.push(...group.children);
            group.clear();
            if (tile.type !== 'city') return;
            const level = prop?.level ?? 0;
            if (!level) {
              group.add(clone('plot'));
              return;
            }
            const n = level === 4 ? 1 : level;
            for (let j = 0; j < n; j++) {
              const building = new THREE.Group();
              building.add(atlasSprite(architecture, level === 4 ? 1 : 0, 3, 1.85, 1.85));
              building.scale.setScalar(level === 4 ? 0.61 : n === 1 ? 0.66 : 0.44);
              building.position.x = (j - (n - 1) / 2) * 0.46;
              building.position.z = -(j - (n - 1) / 2) * 0.46;
              if (level === 4) building.position.z -= 0.1;
              group.add(building);
            }
          });
        };
        update.current = draw;
        draw();
        renderer.setAnimationLoop(() => {
          if (disposed) return;
          const { state: game, cue: activeCue, reducedMotion: reduced } = live.current;
          const now = performance.now();
          if (activeCue !== lastCue) {
            lastCue = activeCue;
            started = now;
          }
          const progress = activeCue?.duration
            ? Math.min(1, (now - started) / activeCue.duration)
            : 1;
          pawns.forEach((pawn, i) => {
            const player = game.players[i];
            if (!player) {
              pawn.visible = false;
              return;
            }
            pawn.visible = !player.eliminated;
            let point = tilePoint(player.position),
              height = 0.27;
            if (activeCue?.kind === 'hop' && activeCue.playerId === player.id && !reduced) {
              const from = tilePoint(activeCue.from!),
                to = tilePoint(activeCue.to!);
              point = {
                x: THREE.MathUtils.lerp(from.x, to.x, progress),
                z: THREE.MathUtils.lerp(from.z, to.z, progress),
              };
              height += Math.sin(progress * Math.PI) * 0.65;
              pawn.rotation.z = Math.sin(progress * Math.PI * 2) * 0.07;
            } else pawn.rotation.z = 0;
            const peers = game.players.filter(
                (p) => !p.eliminated && p.position === player.position,
              ),
              slot = peers.findIndex((p) => p.id === player.id);
            // Separate the rear building plot from the front walking lane.
            // Four co-located travelers use two rows, never a stack of models.
            pawn.scale.setScalar(game.currentPlayer === i ? 0.95 : peers.length > 1 ? 0.7 : 0.88);
            const offsetX =
              peers.length > 2
                ? slot % 2
                  ? 0.38
                  : -0.38
                : peers.length === 2
                  ? slot
                    ? 0.37
                    : -0.37
                  : 0;
            const offsetZ = peers.length > 2 ? (slot < 2 ? 0.15 : 0.6) : 0.35;
            pawn.position.set(point.x + offsetX, height, point.z + offsetZ);
            // A crowded cell remains readable: the active traveler stays solid; companions become translucent.
            pawn.traverse((node) => {
              if (node instanceof THREE.Sprite && node.material.map) {
                node.material.opacity = peers.length > 1 && game.currentPlayer !== i ? 0.48 : 1;
                node.material.alphaTest = 0.7 * node.material.opacity;
              }
            });
          });
          dice.forEach((die, i) => {
            const value = (activeCue?.kind === 'dice' ? activeCue.dice?.[i] : game.dice[i]) ?? 1;
            const final = new THREE.Quaternion().setFromUnitVectors(faceNormals[value - 1]!, up);
            if (activeCue?.kind === 'dice' && !reduced && progress < 1) {
              const spin = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                  (1 - progress) * Math.PI * 8,
                  (1 - progress) * Math.PI * 6,
                  (1 - progress) * Math.PI * 4,
                ),
              );
              die.quaternion.copy(final).multiply(spin);
              die.position.set(
                1.7 + (i ? 0.58 : -0.58) + Math.sin(progress * 8 + i) * 0.5 * (1 - progress),
                0.52 + Math.abs(Math.sin(progress * Math.PI * 3)) * 1.25 * (1 - progress),
                1.7 + (i ? -0.58 : 0.58) + Math.sin(progress * 5) * 0.4,
              );
            } else {
              die.quaternion.copy(final);
              die.position.set(1.7 + (i ? 0.58 : -0.58), 0.52, 1.7 + (i ? -0.58 : 0.58));
            }
          });
          buildings.forEach((g, i) => {
            const occupied = game.players.some((p) => !p.eliminated && p.position === i);
            g.traverse((node) => {
              if (node instanceof THREE.Sprite) {
                node.material.opacity = occupied ? 0.4 : 1;
                node.material.alphaTest = 0.7 * node.material.opacity;
              }
            });
            g.scale.y =
              activeCue?.kind === 'build' && activeCue.tile === i && !reduced
                ? Math.max(
                    0.02,
                    1 - Math.pow(1 - progress, 3) + Math.sin(progress * Math.PI) * 0.12,
                  )
                : 1;
          });
          borders.forEach((b) => {
            (b.material as THREE.MeshStandardMaterial).opacity =
              0.42 + (reduced ? 0 : Math.sin(now / 240) * 0.18);
          });
          renderer!.render(scene, camera);
        });
        cleanup = () => {
          observer?.disconnect();
          const geometries = new Set<THREE.BufferGeometry>(),
            materials = new Set<THREE.Material>(),
            textures = new Set<THREE.Texture>();
          const gather = (o: THREE.Object3D) =>
            o.traverse((n) => {
              if (n instanceof THREE.Mesh || n instanceof THREE.Sprite) {
                if (n instanceof THREE.Mesh) geometries.add(n.geometry);
                for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
                  materials.add(m);
                  const tex = (m as THREE.MeshStandardMaterial).map;
                  if (tex) textures.add(tex);
                }
              }
            });
          gather(resources);
          gather(gltf.scene);
          templates.forEach(gather);
          textures.add(travelers);
          textures.add(architecture);
          detached.forEach(gather);
          geometries.forEach((g) => g.dispose());
          materials.forEach((m) => m.dispose());
          textures.forEach((t) => t.dispose());
        };
        setReady(true);
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : 'Rendu 3D indisponible');
      }
    };
    void initialize();
    return () => {
      disposed = true;
      update.current = () => {};
      renderer?.setAnimationLoop(null);
      observer?.disconnect();
      cleanup();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);
  const visualKey = JSON.stringify([state.properties, state.festivals, choices]);
  useEffect(() => {
    update.current();
  }, [visualKey]);
  return (
    <div className={`board-shell board-3d ${demo ? 'board-demo' : ''}`}>
      <div ref={host} className="board-canvas" aria-label="Plateau 3D Money Tour" />
      {!ready && !error && <div className="board-loading">Construction de votre archipel…</div>}
      {ready && (
        <>
          {!demo && (
            <svg
              className="board-hit-polygons"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-label="Cases du plateau"
            >
              {state.config.board.map((t, i) => (
                <polygon
                  key={t.id}
                  points={anchors[i]?.points}
                  tabIndex={0}
                  role="button"
                  aria-label={(choices.includes(t.id) ? 'Choisir ' : 'Voir ') + t.name}
                  className={choices.includes(t.id) ? 'selectable' : ''}
                  onClick={() => onTile(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTile(t.id);
                    }
                  }}
                />
              ))}
            </svg>
          )}
          <div className="board-labels" aria-hidden="true">
            <div className="board-watermark">
              MONEY
              <br />
              TOUR <span>✦</span>
            </div>
            {state.config.board.map((t, i) => {
              const short =
                t.type === 'chance'
                  ? 'CHANCE'
                  : t.type === 'championship'
                    ? 'MONDIAL'
                    : t.type === 'travel'
                      ? 'VOYAGE'
                      : t.type === 'tax'
                        ? 'TAXE'
                        : t.name;
              return (
                <div
                  key={t.id}
                  data-tile-label={t.id}
                  className="city-label"
                  style={
                    {
                      left: anchors[i]?.x + '%',
                      top: anchors[i]?.y + '%',
                      '--street-color': t.color ?? '#e4b63c',
                    } as React.CSSProperties
                  }
                >
                  <b>{short}</b>
                </div>
              );
            })}
          </div>
        </>
      )}
      {error && (
        <div className="board-fallback">
          <p>Le rendu 3D n’a pas pu démarrer : {error}</p>
          <div className="tile-list">
            {state.config.board.map((t) => (
              <button key={t.id} onClick={() => onTile(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
