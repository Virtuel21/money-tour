import { expect, it } from 'vitest';
import * as THREE from 'three';
import { festivalFlag, lagoonBoat } from '../src/board/scenery';
import { boatRadius } from '../src/board/lagoon';

it('waves the free edge of the flag while keeping its mast edge attached, sharing the label texture', () => {
  const texture = new THREE.Texture();
  const flag = festivalFlag(texture);
  const cloth = flag.group.children[3] as THREE.Mesh;
  const positions = cloth.geometry.attributes.position!;
  flag.wave(1);
  const first = Array.from(positions.array);
  flag.wave(2);
  expect(Array.from(positions.array)).not.toEqual(first);
  for (let i = 0; i < positions.count; i++) {
    if (Math.abs(positions.getX(i)) < 0.001) expect(positions.getZ(i)).toBeCloseTo(0);
  }
  expect(flag.texture).toBe(texture);
  const frozen = Array.from(positions.array);
  flag.wave(2);
  expect(Array.from(positions.array)).toEqual(frozen);
});

it.each(['cruise', 'sail'] as const)(
  '%s geometry fits inside the navigation clearance and stays still when paused',
  (kind) => {
    const boat = lagoonBoat(kind, 0);
    const body = boat.root.children[0]!;
    body.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      expect(node.geometry).toBeInstanceOf(THREE.BufferGeometry);
      const points = node.geometry.attributes.position!;
      for (let i = 0; i < points.count; i++)
        expect(Math.hypot(points.getX(i), points.getZ(i))).toBeLessThan(boatRadius - 0.05);
    });
    boat.animate(18, true);
    const pose = boat.root.position.clone(),
      rotation = body.rotation.clone();
    boat.animate(18, true);
    expect(boat.root.position.equals(pose)).toBe(true);
    expect(body.rotation.equals(rotation)).toBe(true);
    expect(boat.root.children[1]!.visible).toBe(false);
  },
);
