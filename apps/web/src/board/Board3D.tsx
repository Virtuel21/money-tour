import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { reservedCity, getRent, type GameState } from '@money-tour/engine';
import type { Cue } from '../game/presentation';
import { streetSurface } from './surfaces';
import { colors } from '../game/local';

import { boardShape, tileFrame, tilePoint, wealthPoints } from './layout';
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
  selecting = false,
}: {
  state: GameState;
  onTile: (id: number) => void;
  reducedMotion?: boolean;
  demo?: boolean;
  cue?: Cue;
  choices?: number[];
  selecting?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ state, cue, reducedMotion, choices });
  live.current = { state, cue, reducedMotion, choices };
  const update = useRef<() => void>(() => {});
  const [error, setError] = useState(''),
    [ready, setReady] = useState(false);
  const [bankAnchors, setBankAnchors] = useState<{ x: number; y: number }[]>([]);
  const [anchors, setAnchors] = useState<{ x: number; y: number; points: string; angle: number }[]>(
    [],
  );
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
        const camera = new THREE.OrthographicCamera(-18, 18, 12.25, -12.25, 0.1, 80);
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
        const fortuneGltf = await loader.loadAsync(import.meta.env.BASE_URL + 'models/fortune.glb');
        if (disposed) {
          disposePending(fortuneGltf.scene);
          disposePending(gltf.scene);
          return;
        }
        for (const name of ['casino_roulette', 'casino_slots', 'insurance_shield', 'karma_scale'])
          templates.set(name, compact(fortuneGltf.scene.getObjectByName(name)!));
        const shape = boardShape(live.current.state.config.board.length);
        const platform = clone('board');
        platform.scale.set(
          (shape.x * 2 + shape.depth) / 16.65,
          1,
          (shape.z * 2 + shape.depth) / 16.65,
        );
        resources.add(platform);
        const wealthGltf = await loader.loadAsync(import.meta.env.BASE_URL + 'models/wealth.glb');
        if (disposed) {
          disposePending(wealthGltf.scene);
          disposePending(gltf.scene);
          return;
        }
        const note = compact(wealthGltf.scene.getObjectByName('banknote_bundle')!);
        const ingot = compact(wealthGltf.scene.getObjectByName('gold_bar')!);
        // glTF already converts these models to Y-up; keep the bundles horizontal.
        for (const source of [note, ingot])
          source.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              node.geometry.scale(1, 1, 1.5);
              if (
                node.material instanceof THREE.MeshStandardMaterial &&
                node.material.metalness > 0
              )
                node.material.metalness = 0.22;
            }
          });
        const wealth = live.current.state.players.map((_, i) => {
          const pile = new THREE.Group();
          const pos = wealthPoints[i]!;
          pile.position.set(pos.x, -0.4, pos.z);
          const plinth = new THREE.Mesh(
            new THREE.BoxGeometry(2.3, 0.06, 1.4),
            new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.6 }),
          );
          plinth.position.y = -0.04;
          pile.add(plinth);
          const units = new THREE.Group();
          pile.add(units);
          for (let k = 0; k < 24; k++) {
            const unit = (k % 3 < 2 ? note : ingot).clone(true);
            unit.position.set(
              ((k % 3) - 1) * 0.76,
              Math.floor(k / 6) * 0.23,
              Math.floor((k % 6) / 3) * 0.7 - 0.35,
            );
            unit.rotation.y = k % 2 ? 0.06 : -0.04;
            units.add(unit);
          }
          resources.add(pile);
          return units;
        });
        const shownWealth = live.current.state.players.map((p) => p.cash);
        setBankAnchors(
          wealthPoints.map((p) => {
            const v = new THREE.Vector3(
              p.x + (Math.abs(p.x) > Math.abs(p.z) ? Math.sign(p.x) * 1.2 : 0),
              0,
              p.z + (Math.abs(p.z) > Math.abs(p.x) ? Math.sign(p.z) * 1.2 : 0),
            ).project(camera);
            return { x: (v.x + 1) * 50, y: (1 - v.y) * 50 };
          }),
        );
        const textureLoader = new THREE.TextureLoader();
        const [travelers, architecture, specialTiles, expansionTiles] = await Promise.all([
          textureLoader.loadAsync(import.meta.env.BASE_URL + 'textures/travelers-v3.webp'),
          textureLoader.loadAsync(import.meta.env.BASE_URL + 'textures/architecture-v3.webp'),
          textureLoader.loadAsync(import.meta.env.BASE_URL + 'textures/special-tiles-v1.webp'),
          textureLoader.loadAsync(import.meta.env.BASE_URL + 'textures/expansion-v1.webp'),
        ]);
        if (disposed) {
          travelers.dispose();
          architecture.dispose();
          specialTiles.dispose();
          expansionTiles.dispose();
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
        const ownerSprite = (sprite: THREE.Sprite, owner: number) => {
          sprite.material.onBeforeCompile = (shader) => {
            shader.uniforms.ownerTone = { value: new THREE.Color(colors[owner] ?? '#278fc0') };
            shader.fragmentShader = 'uniform vec3 ownerTone;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <map_fragment>',
              `#include <map_fragment>
              float chroma=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b))-min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b));
              if(chroma>0.07 && ((diffuseColor.r>diffuseColor.g*1.25 && diffuseColor.r>diffuseColor.b*1.08) || (diffuseColor.b>diffuseColor.r*1.18 && diffuseColor.b>diffuseColor.g*1.10))) {
                float shade=clamp(max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b))*1.65,0.28,1.3);
                diffuseColor.rgb=ownerTone*shade;
              }
            `,
            );
          };
          sprite.material.customProgramCacheKey = () => 'owner-color-v1';
          return sprite;
        };
        // Detailed pre-rendered dioramas: a fixed three-quarter camera lets the art retain its fine detail.
        [
          [-2.5, -1.6],
          [2.5, -1.6],
          [-2.5, 2.2],
          [2.5, 2.2],
        ].forEach(([x, z], i) => {
          const island = atlasSprite(architecture, i + 2, 3, 3.05, 3.05);
          island.position.set(x!, 0.08, z!);
          resources.add(island);
        });
        const sea = new THREE.Mesh(
          new THREE.BoxGeometry(shape.x * 2 - shape.depth, 0.06, shape.z * 2 - shape.depth),
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
          flags: THREE.Sprite[] = [],
          championships: THREE.Group[] = [],
          confetti: THREE.Group[] = [];
        for (const tile of live.current.state.config.board) {
          const p = tileFrame(tile.id, live.current.state.config.board.length),
            cell = clone('tile');
          cell.position.set(p.x, 0, p.z);
          cell.scale.set(p.width / 1.66, 1, p.depth / 1.66);
          resources.add(cell);
          const special = tile.type === 'chance' || tile.type === 'tax';
          const extra = ['casino', 'insurance', 'karma'].includes(tile.type);
          const tileMap = extra
            ? expansionTiles.clone()
            : special
              ? specialTiles.clone()
              : streetSurface(tile);
          if (extra) {
            const index =
              tile.type === 'casino' ? (tile.id < 15 ? 0 : 1) : tile.type === 'insurance' ? 2 : 3;
            tileMap.repeat.set(0.5, 0.5);
            tileMap.offset.set((index % 2) * 0.5, index < 2 ? 0.5 : 0);
            tileMap.colorSpace = THREE.SRGBColorSpace;
            tileMap.anisotropy = renderer!.capabilities.getMaxAnisotropy();
          }
          if (special) {
            tileMap.repeat.set(0.5, 1);
            tileMap.offset.x = tile.type === 'chance' ? 0 : 0.5;
            tileMap.colorSpace = THREE.SRGBColorSpace;
            tileMap.anisotropy = renderer!.capabilities.getMaxAnisotropy();
          }
          const iconSize = Math.min(p.width, p.depth) - 0.12;
          if (special || extra) {
            const backdrop = new THREE.Mesh(
              new THREE.PlaneGeometry(p.width - 0.12, p.depth - 0.12),
              new THREE.MeshStandardMaterial({
                color:
                  tile.type === 'chance' ? '#722caf' : tile.type === 'tax' ? '#c77337' : '#25625e',
                roughness: 0.95,
              }),
            );
            backdrop.rotation.x = -Math.PI / 2;
            backdrop.position.set(p.x, 0.276, p.z);
            resources.add(backdrop);
          }
          const surface = new THREE.Mesh(
            new THREE.PlaneGeometry(
              special || extra ? iconSize : p.width - 0.12,
              special || extra ? iconSize : p.depth - 0.12,
            ),
            new THREE.MeshStandardMaterial({ map: tileMap, roughness: 0.95 }),
          );
          surface.rotation.x = -Math.PI / 2;
          surface.position.set(p.x, 0.28, p.z);
          surface.receiveShadow = true;
          resources.add(surface);
          const trim = new THREE.Mesh(
            new THREE.BoxGeometry((p.corner ? shape.depth : shape.step) - 0.04, 0.25, 0.16),
            new THREE.MeshStandardMaterial({ color: 0xffffff }),
          );
          trim.position.set(p.x + p.normal.x * 1.69, 0.18, p.z + p.normal.z * 1.69);
          trim.rotation.y = p.angle;
          resources.add(trim);
          trims.push(trim);
          const outline = new THREE.Mesh(
            new THREE.BoxGeometry(p.width - 0.15, 0.025, p.depth - 0.15),
            new THREE.MeshStandardMaterial({ color: 0xffdf55, transparent: true, opacity: 0.7 }),
          );
          outline.position.set(p.x, 0.27, p.z);
          outline.visible = false;
          resources.add(outline);
          borders.push(outline);
          const city = new THREE.Group();
          city.position.set(p.x - p.normal.x * 0.85, 0.26, p.z - p.normal.z * 0.85);
          city.rotation.y = p.angle;
          resources.add(city);
          buildings.push(city);
          if (tile.type === 'resort' || tile.type === 'island') {
            const palm = clone('palm');
            palm.scale.setScalar(0.9);
            palm.position.set(p.x - p.normal.x * 0.65, 0.26, p.z - p.normal.z * 0.65);
            resources.add(palm);
          }
          if (!['city', 'resort', 'island', 'chance', 'tax'].includes(tile.type)) {
            const model =
              tile.type === 'casino'
                ? tile.id < 15
                  ? 'casino_roulette'
                  : 'casino_slots'
                : tile.type === 'insurance'
                  ? 'insurance_shield'
                  : tile.type === 'karma'
                    ? 'karma_scale'
                    : tile.type;
            const icon = clone(model);
            if (extra) icon.scale.setScalar(0.72);
            icon.position.set(p.x - p.normal.x * 0.3, 0.27, p.z - p.normal.z * 0.3);
            resources.add(icon);
          }
          const flag = caption('⚑ ×2', 0.38, 0.22, '#b55b20');
          flag.position.set(p.x - 0.58, 0.7, p.z - 0.5);
          resources.add(flag);
          flags.push(flag);
          const celebration = new THREE.Group();
          celebration.position.set(p.x, 0.29, p.z);
          celebration.rotation.y = p.angle;
          if (tile.type === 'city') {
            const trophy = clone('championship');
            trophy.scale.setScalar(0.3);
            trophy.position.set(-0.66, 0, -0.5);
            celebration.add(trophy);
            const ribbon = new THREE.Mesh(
              new THREE.BoxGeometry(1.92, 0.07, 0.13),
              new THREE.MeshStandardMaterial({ color: '#ffd45c', metalness: 0.3, roughness: 0.4 }),
            );
            ribbon.position.set(0, 0.03, 1.5);
            celebration.add(ribbon);
          }
          resources.add(celebration);
          championships.push(celebration);
          const shower = new THREE.Group();
          shower.position.copy(celebration.position);
          if (tile.type === 'city')
            for (let k = 0; k < 18; k++) {
              const flake = new THREE.Mesh(
                new THREE.PlaneGeometry(0.075, 0.13),
                new THREE.MeshBasicMaterial({
                  color: ['#ffd45c', '#f34b90', '#4bdddf', '#fff5cc'][k % 4],
                  side: THREE.DoubleSide,
                }),
              );
              flake.position.set(((k * 7) % 17) / 12 - 0.65, 0, ((k * 11) % 17) / 12 - 0.65);
              shower.add(flake);
            }
          resources.add(shower);
          confetti.push(shower);
        }
        setAnchors(
          live.current.state.config.board.map((t) => {
            const p = tileFrame(t.id, live.current.state.config.board.length);
            const labelOffset = p.corner ? 0.85 : 0.5;
            const v = new THREE.Vector3(
              p.x + p.normal.x * labelOffset,
              0.32,
              p.z + p.normal.z * labelOffset,
            ).project(camera);
            const points = [
              [-p.width / 2, -p.depth / 2],
              [-p.width / 2, p.depth / 2],
              [p.width / 2, p.depth / 2],
              [p.width / 2, -p.depth / 2],
            ]
              .map(([x, z]) => {
                const corner = new THREE.Vector3(p.x + x!, 0.27, p.z + z!).project(camera);
                return (corner.x + 1) * 50 + ',' + (1 - corner.y) * 50;
              })
              .join(' ');
            const alongX = p.side % 2 === 0;
            const a = new THREE.Vector3(p.x, 0.3, p.z).project(camera);
            const b = new THREE.Vector3(
              p.x + (alongX ? 1 : 0),
              0.3,
              p.z + (alongX ? 0 : 1),
            ).project(camera);
            let angle = (Math.atan2((-(b.y - a.y) * 8.3) / 12.2, b.x - a.x) * 180) / Math.PI;
            if (angle > 90) angle -= 180;
            if (angle < -90) angle += 180;
            return { x: (v.x + 1) * 50, y: (1 - v.y) * 50, points, angle };
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
        const diceScene = new THREE.Scene();
        const diceCamera = new THREE.OrthographicCamera(-2.8, 2.8, 2, -2, 0.1, 100);
        diceCamera.position.set(0, 6, 7);
        diceCamera.lookAt(0, 0, 0);
        diceScene.add(new THREE.AmbientLight(0xffffff, 2.3));
        const diceLight = new THREE.DirectionalLight(0xfff0d2, 3);
        diceLight.position.set(-3, 7, 4);
        diceScene.add(diceLight);
        const diceTray = new THREE.Mesh(
          new THREE.CylinderGeometry(2.35, 2.4, 0.18, 64),
          new THREE.MeshStandardMaterial({ color: '#d8a34c', roughness: 0.45, metalness: 0.2 }),
        );
        diceTray.position.y = -0.16;
        diceTray.scale.z = 0.72;
        diceScene.add(diceTray);
        const felt = new THREE.Mesh(
          new THREE.CylinderGeometry(2.2, 2.2, 0.035, 64),
          new THREE.MeshStandardMaterial({ color: '#185b58', roughness: 0.95 }),
        );
        felt.scale.z = 0.72;
        felt.position.y = -0.045;
        diceScene.add(felt);
        let diceVisibleUntil = 0;
        const dice = [clone('die'), clone('die')];
        dice.forEach((die, i) => {
          die.position.set(i ? 0.52 : -0.52, 0.55, 1.0);
          die.scale.setScalar(1.15);
          diceScene.add(die);
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
            championships[i]!.visible = (prop?.championships ?? 0) > 0;
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
              building.add(
                ownerSprite(atlasSprite(architecture, level === 4 ? 1 : 0, 3, 1.85, 1.85), owner),
              );
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
            let point = tilePoint(player.position, game.config.board.length),
              height = 0.27;
            if (activeCue?.kind === 'hop' && activeCue.playerId === player.id && !reduced) {
              const from = tilePoint(activeCue.from!, game.config.board.length),
                to = tilePoint(activeCue.to!, game.config.board.length);
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
            const frame = tileFrame(player.position, game.config.board.length);
            pawn.position.set(
              point.x + offsetX + frame.normal.x * 0.25,
              height,
              point.z + offsetZ + frame.normal.z * 0.25,
            );
            // A crowded cell remains readable: the active traveler stays solid; companions become translucent.
            pawn.traverse((node) => {
              if (node instanceof THREE.Sprite && node.material.map) {
                node.material.opacity = peers.length > 1 && game.currentPlayer !== i ? 0.48 : 1;
                node.material.alphaTest = 0.7 * node.material.opacity;
              }
            });
          });
          wealth.forEach((units, i) => {
            const target = game.players[i]?.eliminated ? 0 : (game.players[i]?.cash ?? 0);
            shownWealth[i] = reduced ? target : THREE.MathUtils.lerp(shownWealth[i]!, target, 0.12);
            const amount = Math.min(24, shownWealth[i]! / 100000);
            units.children.forEach((unit, k) => {
              const fill = THREE.MathUtils.clamp(amount - k, 0, 1);
              unit.visible = fill > 0.01;
              unit.scale.y = Math.max(0.01, fill);
            });
            units.scale.setScalar(
              1 + Math.max(0, Math.log2(Math.max(1, shownWealth[i]! / 2400000))) * 0.1,
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
                (i ? 0.78 : -0.78) + Math.sin(progress * 8 + i) * 0.5 * (1 - progress),
                0.52 + Math.abs(Math.sin(progress * Math.PI * 3)) * 1.25 * (1 - progress),
                (i ? -0.25 : 0.25) + Math.sin(progress * 5) * 0.4,
              );
            } else {
              die.quaternion.copy(final);
              die.position.set(i ? 0.78 : -0.78, 0.52, i ? -0.25 : 0.25);
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
          confetti.forEach((shower, i) => {
            shower.visible = championships[i]!.visible && !reduced;
            if (!shower.visible) return;
            shower.children.forEach((flake, k) => {
              flake.position.y = 0.1 + (1 - ((now / 2900 + k / 18) % 1)) * 1.55;
              flake.rotation.set(now / 700 + k, now / 900, k + now / 1200);
            });
          });
          borders.forEach((b) => {
            (b.material as THREE.MeshStandardMaterial).opacity =
              0.42 + (reduced ? 0 : Math.sin(now / 240) * 0.18);
          });
          const fullSize = renderer!.getSize(new THREE.Vector2());
          renderer!.setViewport(0, 0, fullSize.x, fullSize.y);
          renderer!.render(scene, camera);
          if (activeCue?.kind === 'dice') diceVisibleUntil = now + 450;
          if (now < diceVisibleUntil) {
            const width = Math.min(390, fullSize.x * 0.8),
              height = width * 0.72;
            renderer!.autoClear = false;
            renderer!.clearDepth();
            renderer!.setViewport(
              (fullSize.x - width) / 2,
              (fullSize.y - height) / 2,
              width,
              height,
            );
            renderer!.render(diceScene, diceCamera);
            renderer!.autoClear = true;
          }
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
          gather(diceScene);
          gather(gltf.scene);
          gather(wealthGltf.scene);
          gather(fortuneGltf.scene);
          gather(note);
          gather(ingot);
          templates.forEach(gather);
          textures.add(travelers);
          textures.add(architecture);
          textures.add(specialTiles);
          textures.add(expansionTiles);
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
                  className={
                    choices.includes(t.id) ? 'selectable' : selecting ? 'choice-dimmed' : ''
                  }
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
            {!demo &&
              state.players.map((p, i) => (
                <div
                  className="bank-label"
                  key={p.id}
                  style={{
                    left: bankAnchors[i]?.x + '%',
                    top: bankAnchors[i]?.y + '%',
                    borderColor: colors[i],
                  }}
                >
                  <b>{p.name}</b>
                  <strong>{new Intl.NumberFormat('fr-FR').format(p.cash)} ¤</strong>
                </div>
              ))}
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
                        : t.type === 'casino'
                          ? 'CASINO'
                          : t.type === 'insurance'
                            ? 'ASSURANCE'
                            : t.type === 'karma'
                              ? 'KARMA'
                              : t.name;
              return (
                <div
                  key={t.id}
                  data-tile-label={t.id}
                  className={
                    'city-label' +
                    (selecting && !choices.includes(t.id) ? ' label-dimmed' : '') +
                    (['casino', 'insurance', 'karma'].includes(t.type) ? ' special-label' : '')
                  }
                  style={
                    {
                      left: anchors[i]?.x + '%',
                      top: anchors[i]?.y + '%',
                      '--label-angle': (anchors[i]?.angle ?? 0) + 'deg',
                      '--street-color': t.color ?? '#e4b63c',
                    } as React.CSSProperties
                  }
                >
                  <b>{short}</b>
                  {reservedCity(state, t.id) && (
                    <small className="tile-condition">🔒 Enchère T10</small>
                  )}
                  {state.players.some((p) => p.insurance?.tile === t.id) && (
                    <small className="tile-condition">🛡 Assurée</small>
                  )}
                  {!!state.properties[t.id]?.roachTurns && (
                    <small className="tile-condition">
                      −50 % · {state.properties[t.id]?.roachTurns} tours
                    </small>
                  )}
                  {state.properties[t.id]?.ownerId && (
                    <strong className="tile-rent" title="Loyer actuel">
                      {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(
                        getRent(state, t.id) / 1000,
                      )}
                      <small> k</small>
                    </strong>
                  )}
                  {!!state.properties[t.id]?.championships && (
                    <small className="world-badge">
                      🏆 {state.properties[t.id]?.championshipTurns ?? 4} tours
                    </small>
                  )}
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
