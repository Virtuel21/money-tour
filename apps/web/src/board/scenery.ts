import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { sailingPose } from './lagoon';

function festivalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#ffc84b';
  context.fillRect(0, 0, 1024, 384);
  context.strokeStyle = '#803963';
  context.lineWidth = 22;
  context.strokeRect(11, 11, 1002, 362);
  context.fillStyle = '#572d50';
  context.font = '900 155px Trebuchet MS, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('FESTIVAL', 512, 202, 920);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function festivalFlag(texture: THREE.Texture = festivalTexture()) {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: '#eaa941', roughness: 0.5 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.038, 2.25, 10), gold);
  pole.position.y = 1.125;
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), gold);
  finial.position.y = 2.3;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.08, 12), gold);
  group.add(pole, finial, foot);
  const cloth = new THREE.PlaneGeometry(1.3, 0.49, 20, 6);
  cloth.translate(0.65, 1.94, 0);
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const flag = new THREE.Mesh(cloth, material);
  // Face the fixed isometric camera; the entire pole stays inside the city plot.
  flag.rotation.y = Math.PI / 4;
  group.add(flag);
  const positions = cloth.attributes.position!;
  const wave = (time: number) => {
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i);
      positions.setZ(
        i,
        (x / 1.3) *
          (0.075 * Math.sin(x * 6 - time * 2.8) + 0.025 * Math.sin(y * 8 + x * 4 - time * 2)),
      );
    }
    positions.needsUpdate = true;
  };
  wave(0);
  return { group, wave, texture };
}

/** Small rounded toy boats; shared materials are merged to keep mobile draw calls low. */
export function lagoonBoat(kind: 'cruise' | 'sail', index: number) {
  const root = new THREE.Group(),
    body = new THREE.Group();
  root.add(body);
  const palette = Object.fromEntries(
    Object.entries({
      cream: '#fff3d4',
      blue: '#147da9',
      coral: '#f36c62',
      yellow: '#ffce52',
      teal: '#27b9b4',
      dark: '#315b75',
      white: '#ffffff',
    }).map(([name, color]) => [name, new THREE.MeshStandardMaterial({ color, roughness: 0.65 })]),
  );
  const part = (geometry: THREE.BufferGeometry, color: string, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, palette[color]!);
    mesh.position.set(x, y, z);
    body.add(mesh);
    return mesh;
  };
  const oval = (
    color: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const mesh = part(new THREE.SphereGeometry(1, 20, 12), color, x, y, z);
    mesh.scale.set(sx, sy, sz);
    return mesh;
  };
  const box = (color: string, x: number, y: number, z: number, w: number, h: number, d: number) =>
    part(new RoundedBoxGeometry(w, h, d, 2, 0.07), color, x, y, z);
  oval(kind === 'cruise' ? 'blue' : 'teal', 0, 0.17, 0, 0.33, 0.23, 0.64);
  oval('cream', 0, 0.27, 0, 0.335, 0.17, 0.62);
  if (kind === 'cruise') {
    box('white', 0, 0.44, -0.06, 0.48, 0.25, 0.85);
    box('yellow', 0, 0.59, -0.13, 0.4, 0.08, 0.71);
    box('white', 0, 0.68, -0.2, 0.34, 0.16, 0.43);
    box('blue', 0, 0.7, 0.025, 0.25, 0.08, 0.025);
    box('coral', 0, 0.84, -0.29, 0.17, 0.22, 0.19);
    box('dark', 0, 0.96, -0.29, 0.2, 0.055, 0.21);
    for (const side of [-1, 1])
      for (let k = 0; k < 4; k++) {
        oval('yellow', side * 0.25, 0.45, k * 0.18 - 0.32, 0.027, 0.059, 0.059);
        oval('blue', side * 0.27, 0.45, k * 0.18 - 0.32, 0.02, 0.041, 0.041);
      }
    for (const side of [-1, 1]) {
      const ring = part(
        new THREE.TorusGeometry(0.065, 0.018, 6, 12),
        'coral',
        side * 0.325,
        0.29,
        0.24,
      );
      ring.rotation.y = Math.PI / 2;
    }
  } else {
    box('coral', 0, 0.35, -0.14, 0.35, 0.1, 0.45);
    part(new THREE.CylinderGeometry(0.024, 0.03, 1.08, 8), 'yellow', 0, 0.86, 0);
    const sail = (color: string, direction: number) => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(direction * 0.45, 0.035);
      shape.quadraticCurveTo(direction * 0.18, 0.5, 0, 0.84);
      shape.closePath();
      const mesh = part(
        new THREE.ExtrudeGeometry(shape, {
          depth: 0.018,
          bevelEnabled: true,
          bevelSize: 0.018,
          bevelThickness: 0.015,
          bevelSegments: 2,
          steps: 1,
        }),
        color,
        0,
        0.49,
        0,
      );
      mesh.rotation.y = Math.PI / 2;
    };
    sail('coral', 1);
    sail('cream', -1);
  }
  body.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  for (const child of body.children) {
    const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
    const geometries = batches.get(mesh.material) ?? [];
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    geometries.push(geometry.applyMatrix4(mesh.matrixWorld));
    batches.set(mesh.material, geometries);
    mesh.geometry.dispose();
  }
  body.clear();
  batches.forEach((geometries, material) => {
    const mesh = new THREE.Mesh(mergeGeometries(geometries)!, material);
    mesh.castShadow = true;
    body.add(mesh);
    geometries.forEach((geometry) => geometry.dispose());
  });
  Object.values(palette).forEach((material) => {
    if (!batches.has(material)) material.dispose();
  });
  const wake = new THREE.Group();
  root.add(wake);
  for (let i = 0; i < 3; i++) {
    const foam = new THREE.Mesh(
      new THREE.TorusGeometry(0.23 + i * 0.09, 0.013, 4, 20, Math.PI),
      new THREE.MeshBasicMaterial({
        color: '#d7fff6',
        transparent: true,
        opacity: 0.5 - i * 0.12,
        depthWrite: false,
      }),
    );
    foam.rotation.x = Math.PI / 2;
    foam.position.set(0, 0.064, -0.46 - i * 0.23);
    wake.add(foam);
  }
  const animate = (seconds: number, still: boolean) => {
    const pose = sailingPose(seconds, index);
    root.position.set(pose.x, 0, pose.z);
    root.rotation.y = pose.heading;
    body.position.y = 0.02 * Math.sin(seconds * 2 + index);
    body.rotation.z = 0.045 * Math.sin(seconds * 1.5 + index);
    body.rotation.x = 0.025 * Math.sin(seconds * 1.8);
    wake.visible = !still;
    wake.scale.x = 1 + 0.1 * Math.sin(seconds * 3);
  };
  animate(0, true);
  return { root, animate };
}
