import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { GameState } from '@money-tour/engine';
import type { Cue } from '../game/presentation';
import { colors, money } from '../game/local';

export function tilePoint(id: number) {
  if (id <= 8) return { x: 4 - id, z: 4 };
  if (id <= 16) return { x: -4, z: 12 - id };
  if (id <= 24) return { x: id - 20, z: -4 };
  return { x: 4, z: id - 28 };
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
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext('2d')!;
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
  const [anchors, setAnchors] = useState<{ x: number; y: number }[]>([]);
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
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        element.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        scene.add(resources);
        const camera = new THREE.OrthographicCamera(-5.25, 5.25, 4.4625, -4.4625, 0.1, 60);
        camera.position.set(0, 12, 9);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        const resize = () => {
          const size = element.clientWidth;
          renderer!.setSize(size, size * 0.85, false);
        };
        observer = new ResizeObserver(resize);
        observer.observe(element);
        resize();
        scene.add(new THREE.HemisphereLight(0xe5fcff, 0xb59872, 1.8));
        const light = new THREE.DirectionalLight(0xfff3ce, 2.5);
        light.position.set(-4, 12, 6);
        light.castShadow = true;
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.camera.left = -6;
        light.shadow.camera.right = 6;
        light.shadow.camera.top = 6;
        light.shadow.camera.bottom = -6;
        light.shadow.normalBias = 0.035;
        scene.add(light);
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(200, 200),
          new THREE.MeshStandardMaterial({ color: 0xf6ebd5, roughness: 1 }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        resources.add(ground);
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/money-tour.glb`);
        if (disposed) {
          disposePending(gltf.scene);
          return;
        }
        const templates = new Map<string, THREE.Group>();
        for (const name of [
          'board',
          'tile',
          'house',
          'hotel',
          'pawn_0',
          'pawn_1',
          'pawn_2',
          'pawn_3',
          'die',
          'islands',
          'palm',
        ]) {
          const original = gltf.scene.getObjectByName(name);
          if (!original) throw new Error(`Modèle absent : ${name}`);
          templates.set(name, compact(original));
        }
        const clone = (name: string) => templates.get(name)!.clone(true);
        resources.add(clone('board'), clone('islands'));
        const water = new THREE.TextureLoader().load(
          `${import.meta.env.BASE_URL}textures/ocean.webp`,
        );
        water.colorSpace = THREE.SRGBColorSpace;
        const sea = new THREE.Mesh(
          new THREE.PlaneGeometry(7.05, 7.05),
          new THREE.MeshStandardMaterial({ map: water, roughness: 0.75 }),
        );
        sea.rotation.x = -Math.PI / 2;
        sea.position.y = 0.06;
        sea.receiveShadow = true;
        resources.add(sea);
        const title = caption('MONEY TOUR', 3.6, 0.7);
        title.position.set(0, 0.1, 0.1);
        resources.add(title);
        const buildings: THREE.Group[] = [],
          trims: THREE.Mesh[] = [],
          borders: THREE.Mesh[] = [],
          flags: THREE.Sprite[] = [];
        for (const tile of live.current.state.config.board) {
          const p = tilePoint(tile.id),
            cell = clone('tile');
          cell.position.set(p.x, 0, p.z);
          resources.add(cell);
          const strip = new THREE.Mesh(
            new THREE.BoxGeometry(0.82, 0.025, 0.09),
            new THREE.MeshStandardMaterial({ color: tile.color ?? '#f9c34f' }),
          );
          strip.position.set(0, 0.2, -0.37);
          cell.add(strip);
          const trim = new THREE.Mesh(
            new THREE.BoxGeometry(0.95, 0.09, 0.14),
            new THREE.MeshStandardMaterial({ color: 0xffffff }),
          );
          trim.position.set(p.x, 0.1, p.z);
          if (tile.id <= 8) trim.position.z += 0.51;
          else if (tile.id <= 16) {
            trim.rotation.y = Math.PI / 2;
            trim.position.x -= 0.51;
          } else if (tile.id <= 24) trim.position.z -= 0.51;
          else {
            trim.rotation.y = Math.PI / 2;
            trim.position.x += 0.51;
          }
          resources.add(trim);
          trims.push(trim);
          const outline = new THREE.Mesh(
            new THREE.BoxGeometry(0.97, 0.025, 0.97),
            new THREE.MeshStandardMaterial({ color: 0xffdf55, transparent: true, opacity: 0.7 }),
          );
          outline.position.set(p.x, 0.19, p.z);
          outline.visible = false;
          resources.add(outline);
          borders.push(outline);
          const city = new THREE.Group();
          city.position.set(p.x, 0.18, p.z - 0.1);
          resources.add(city);
          buildings.push(city);
          if (tile.type === 'resort' || tile.type === 'island') {
            const palm = clone('palm');
            palm.scale.setScalar(0.65);
            palm.position.set(p.x, 0.19, p.z - 0.1);
            resources.add(palm);
          }
          if (!['city', 'resort', 'island'].includes(tile.type)) {
            const icon = caption(
              (
                { start: '⚑', chance: '✉', tax: '¤', travel: '✈', championship: '★' } as Record<
                  string,
                  string
                >
              )[tile.type] ?? '★',
              0.6,
              0.52,
              tile.type === 'chance' ? '#8c5abe' : '#ab7820',
            );
            icon.position.set(p.x, 0.35, p.z - 0.13);
            resources.add(icon);
          }
          const text = caption(
            `${tile.name.toUpperCase()}${tile.price ? '\n' + money(tile.price, true) : ''}`,
            0.92,
            0.25,
          );
          text.position.set(p.x, 0.24, p.z + 0.3);
          resources.add(text);
          const flag = caption('⚑ ×2', 0.38, 0.22, '#b55b20');
          flag.position.set(p.x - 0.26, 0.46, p.z - 0.26);
          resources.add(flag);
          flags.push(flag);
        }
        setAnchors(
          live.current.state.config.board.map((t) => {
            const p = tilePoint(t.id);
            const v = new THREE.Vector3(p.x, 0.22, p.z).project(camera);
            return { x: (v.x + 1) * 50, y: (1 - v.y) * 50 };
          }),
        );
        const pawns = live.current.state.players.map((_, i) => {
          const pawn = clone('pawn_' + i);
          pawn.scale.setScalar(0.76);
          resources.add(pawn);
          const badge = caption(String(i + 1), 0.25, 0.25, colors[i]);
          badge.position.set(0, 1.32, 0);
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
              const parcel = new THREE.Mesh(
                new THREE.BoxGeometry(0.43, 0.025, 0.34),
                new THREE.MeshStandardMaterial({ color: owner < 0 ? '#90c66a' : colors[owner] }),
              );
              group.add(parcel);
              return;
            }
            const n = level === 4 ? 1 : level;
            for (let j = 0; j < n; j++) {
              const building = clone(level === 4 ? 'hotel' : 'house');
              building.scale.setScalar(level === 4 ? 0.6 : n === 1 ? 0.67 : 0.48);
              building.position.x = (j - (n - 1) / 2) * 0.26;
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
              height = 0.2;
            if (activeCue?.kind === 'hop' && activeCue.playerId === player.id && !reduced) {
              const from = tilePoint(activeCue.from!),
                to = tilePoint(activeCue.to!);
              point = {
                x: THREE.MathUtils.lerp(from.x, to.x, progress),
                z: THREE.MathUtils.lerp(from.z, to.z, progress),
              };
              height += Math.sin(progress * Math.PI) * 0.5;
              pawn.rotation.z = Math.sin(progress * Math.PI * 2) * 0.07;
            } else pawn.rotation.z = 0;
            const peers = game.players.filter(
                (p) => !p.eliminated && p.position === player.position,
              ),
              slot = peers.findIndex((p) => p.id === player.id);
            pawn.position.set(
              point.x + (peers.length > 1 ? (slot - (peers.length - 1) / 2) * 0.19 : 0),
              height,
              point.z + 0.02,
            );
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
                (i ? 0.52 : -0.52) + Math.sin(progress * 8 + i) * 0.5 * (1 - progress),
                0.52 + Math.abs(Math.sin(progress * Math.PI * 3)) * 1.25 * (1 - progress),
                0.8 + Math.sin(progress * 5) * 0.4,
              );
            } else {
              die.quaternion.copy(final);
              die.position.set(i ? 0.52 : -0.52, 0.52, 1.0);
            }
          });
          buildings.forEach((g, i) => {
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
      {ready && !demo && (
        <div className="board-hit-targets">
          {state.config.board.map((t, i) => (
            <button
              key={t.id}
              aria-label={`${choices.includes(t.id) ? 'Choisir' : 'Voir'} ${t.name}`}
              title={`${t.name}${state.properties[t.id]?.ownerId ? ' · ' + state.players.find((p) => p.id === state.properties[t.id]?.ownerId)?.name : ''}`}
              style={{ left: `${anchors[i]?.x}%`, top: `${anchors[i]?.y}%` }}
              className={choices.includes(t.id) ? 'selectable' : ''}
              onClick={() => onTile(t.id)}
            />
          ))}
        </div>
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
