import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { Box3, Vector3, Matrix4, Quaternion } = await import(
  pathToFileURL(require.resolve('three').replace('three.cjs', 'three.module.js'))
);
const bytes = readFileSync(new URL('../apps/web/public/models/money-tour.glb', import.meta.url));
assert.equal(bytes.toString('utf8', 0, 4), 'glTF');
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
const bounds = {};
function visit(index, parent, box) {
  const node = gltf.nodes[index];
  const local = node.matrix
    ? new Matrix4().fromArray(node.matrix)
    : new Matrix4().compose(
        new Vector3(...(node.translation ?? [0, 0, 0])),
        new Quaternion(...(node.rotation ?? [0, 0, 0, 1])),
        new Vector3(...(node.scale ?? [1, 1, 1])),
      );
  const world = parent.clone().multiply(local);
  if (node.mesh !== undefined)
    for (const primitive of gltf.meshes[node.mesh].primitives) {
      const accessor = gltf.accessors[primitive.attributes.POSITION];
      assert(accessor.min?.every(Number.isFinite) && accessor.max?.every(Number.isFinite));
      box.union(
        new Box3(new Vector3(...accessor.min), new Vector3(...accessor.max)).applyMatrix4(world),
      );
    }
  node.children?.forEach((child) => visit(child, world, box));
}
for (const name of [
  'board',
  'tile',
  'house',
  'hotel',
  'islands',
  'die',
  'palm',
  'chance',
  'start',
  'travel',
  'tax',
  'championship',
  'pawn_0',
  'pawn_1',
  'pawn_2',
  'pawn_3',
  'plot',
]) {
  const index = gltf.nodes.findIndex((node) => node.name === name);
  assert(index >= 0, `Missing Blender root ${name}`);
  const box = new Box3();
  visit(index, new Matrix4(), box);
  bounds[name] = box;
  assert(!box.isEmpty(), `Empty model ${name}`);
}
const placed = (name, x, z, scale) =>
  bounds[name]
    .clone()
    .applyMatrix4(new Matrix4().makeScale(scale, scale, scale))
    .translate(new Vector3(x, 0, z));
const insideTile = (box) => {
  assert(
    box.min.x >= -0.84 && box.max.x <= 0.84 && box.min.z >= -0.84 && box.max.z <= 0.84,
    'Model exceeds the ivory tile',
  );
};
const housing = [
  placed('house', 0, -0.44, 0.66),
  placed('hotel', 0, -0.54, 0.61),
  ...[-0.55, 0, 0.55].map((x) => placed('house', x, -0.44, 0.44)),
];
housing.forEach(insideTile);
const crowd = Array.from({ length: 4 }, (_, i) =>
  placed('pawn_' + i, i % 2 ? 0.38 : -0.38, i < 2 ? 0.15 : 0.6, 0.46),
);
crowd.forEach(insideTile);
for (let i = 0; i < crowd.length; i++) {
  for (let j = i + 1; j < crowd.length; j++)
    assert(!crowd[i].intersectsBox(crowd[j]), 'Co-located travelers overlap');
  for (const building of housing)
    assert(!crowd[i].intersectsBox(building), 'Walking lane intersects a building');
}
assert(bounds.board.getSize(new Vector3()).x >= 16.6);
assert(bounds.tile.getSize(new Vector3()).x >= 1.68);
assert.equal(gltf.scenes.length, 1, 'Only the Money Tour asset scene may be exported');
assert.equal(gltf.scenes[0].nodes.length, 17, 'No unrelated Blender objects may be exported');
console.log(
  '17 Blender roots verified; three houses and four travelers fit within a tile without intersecting.',
);
