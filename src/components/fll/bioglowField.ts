import * as THREE from 'three';
import type {FllSceneState} from '@site/src/telemark/blocks/fllInterpreter';

export type BioglowKind = 'grandTree' | 'hollowTree' | 'nest' | 'youngForest' | 'hive' | 'recycler' | 'waterfall' | 'operator' | 'technician';
export interface BioglowModelLocation {key: string; name: string; kind: BioglowKind; side: 'red' | 'blue'; x: number; z: number; radius: number}

// Positions are measured from the uploaded Future Edition field-map overview, scaled to
// Telemark's 236 × 108 cm practice coordinates. They are visual guides, not survey data.
export const BIOGLOW_MODELS: BioglowModelLocation[] = [
  {key: 'red-tree', name: 'Grand Tree', kind: 'grandTree', side: 'red', x: -54, z: 0, radius: 15},
  {key: 'red-hollow', name: 'Hollow Tree', kind: 'hollowTree', side: 'red', x: -76, z: 17, radius: 11},
  {key: 'red-nest', name: 'Nest', kind: 'nest', side: 'red', x: -76, z: -16, radius: 11},
  {key: 'red-young', name: 'Young Forest', kind: 'youngForest', side: 'red', x: -100, z: -40, radius: 10},
  {key: 'red-hive', name: 'Hive', kind: 'hive', side: 'red', x: -108, z: 3, radius: 9},
  {key: 'red-recycler', name: 'Token Recycler', kind: 'recycler', side: 'red', x: -108, z: 26, radius: 8},
  {key: 'red-waterfall', name: 'Cave Waterfall', kind: 'waterfall', side: 'red', x: -29, z: 0, radius: 12},
  {key: 'red-operator', name: 'Operator Barrier', kind: 'operator', side: 'red', x: -43, z: 39, radius: 9},
  {key: 'red-technician', name: 'Technician Barrier', kind: 'technician', side: 'red', x: -43, z: -39, radius: 9},
  {key: 'blue-tree', name: 'Grand Tree', kind: 'grandTree', side: 'blue', x: 54, z: 0, radius: 15},
  {key: 'blue-hollow', name: 'Hollow Tree', kind: 'hollowTree', side: 'blue', x: 76, z: -17, radius: 11},
  {key: 'blue-nest', name: 'Nest', kind: 'nest', side: 'blue', x: 76, z: 16, radius: 11},
  {key: 'blue-young', name: 'Young Forest', kind: 'youngForest', side: 'blue', x: 100, z: 40, radius: 10},
  {key: 'blue-hive', name: 'Hive', kind: 'hive', side: 'blue', x: 108, z: -3, radius: 9},
  {key: 'blue-recycler', name: 'Token Recycler', kind: 'recycler', side: 'blue', x: 108, z: -26, radius: 8},
  {key: 'blue-waterfall', name: 'Cave Waterfall', kind: 'waterfall', side: 'blue', x: 29, z: 0, radius: 12},
  {key: 'blue-operator', name: 'Operator Barrier', kind: 'operator', side: 'blue', x: 43, z: -39, radius: 9},
  {key: 'blue-technician', name: 'Technician Barrier', kind: 'technician', side: 'blue', x: 43, z: 39, radius: 9},
];

const palette = {
  bark: 0x70432e, barkLight: 0x9b6542, leaf: 0x287849, leafBright: 0x61a53b,
  lime: 0xa2bd27, sand: 0xd7c69a, stone: 0x88958d, dark: 0x253c36,
  water: 0x59bfd2, blueToken: 0x1d91ad, goldToken: 0xe4b229,
};
const materialCache = new Map<number, THREE.MeshStandardMaterial>();
function material(color: number): THREE.MeshStandardMaterial {
  let result = materialCache.get(color);
  if (!result) { result = new THREE.MeshStandardMaterial({color, roughness: 0.84}); materialCache.set(color, result); }
  return result;
}
function box(parent: THREE.Object3D, size: [number, number, number], color: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function cylinder(parent: THREE.Object3D, top: number, bottom: number, height: number, color: number, x = 0, y = 0, z = 0, sides = 16): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, sides), material(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function ring(parent: THREE.Object3D, radius: number, tube: number, color: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 24), material(color));
  mesh.rotation.x = Math.PI / 2; mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function token(parent: THREE.Object3D, kind: 'keystone' | 'resource', x: number, y: number, z: number): THREE.Group {
  const group = new THREE.Group(); group.position.set(x, y, z); parent.add(group);
  if (kind === 'keystone') {
    cylinder(group, 2, 1.55, 1.2, palette.blueToken, 0, 0.6);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), material(0x3eacc1));
    dome.position.y = 1.2; dome.castShadow = true; group.add(dome);
  } else {
    cylinder(group, 1.9, 1.9, 1.4, palette.goldToken, 0, 0.7, 0, 12);
    ring(group, 1.25, 0.25, 0xf3d05b, 0, 1.5);
  }
  return group;
}
function beam(parent: THREE.Object3D, length: number, color: number, x: number, y: number, z: number, alongZ = false): void {
  box(parent, alongZ ? [1.6, 1.5, length] : [length, 1.5, 1.6], color, x, y, z);
  const holes = Math.max(2, Math.floor(length / 3));
  for (let i = 0; i < holes; i += 1) {
    const offset = (i - (holes - 1) / 2) * 3;
    const bore = cylinder(parent, 0.36, 0.36, 0.12, palette.dark, alongZ ? x : x + offset, y + 0.8, alongZ ? z + offset : z, 8);
    bore.rotation.x = Math.PI / 2;
  }
}
function label(parent: THREE.Object3D, text: string, x: number, z: number, color: number, flipped = false): void {
  const background = box(parent, [5.3, 0.18, 5.3], color, x, 0.08, z);
  background.castShadow = false;
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) { ctx.fillStyle = '#fff'; ctx.font = 'bold 88px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 64, 67); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const digit = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.MeshBasicMaterial({map: texture, transparent: true, depthWrite: false}));
  digit.rotation.x = -Math.PI / 2; if (flipped) digit.rotation.z = Math.PI;
  digit.position.set(x, 0.21, z); parent.add(digit);
}

function makeTerrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = 1536; canvas.height = 704;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#b6c88b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  let seed = 71231;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 1700; i += 1) {
    const x = random() * canvas.width; const y = random() * canvas.height;
    const radius = 2 + random() * 17;
    ctx.fillStyle = ['#839f69', '#d4d8a0', '#759b6a', '#c2c98c', '#8ba874'][Math.floor(random() * 5)];
    ctx.globalAlpha = 0.32 + random() * 0.25;
    ctx.beginPath(); ctx.ellipse(x, y, radius * 1.7, radius, random() * Math.PI, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const river = (flip: boolean) => {
    ctx.save(); if (flip) { ctx.translate(canvas.width, canvas.height); ctx.rotate(Math.PI); }
    ctx.beginPath(); ctx.moveTo(0, 275); ctx.bezierCurveTo(170, 180, 230, 470, 380, 335);
    ctx.bezierCurveTo(520, 235, 590, 530, 768, 360);
    ctx.strokeStyle = '#deedd6'; ctx.lineWidth = 89; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = '#91c9cc'; ctx.lineWidth = 73; ctx.stroke();
    ctx.strokeStyle = '#b3dce0'; ctx.lineWidth = 43; ctx.stroke();
    ctx.restore();
  };
  river(false); river(true);
  for (let i = 0; i < 550; i += 1) {
    const x = random() * canvas.width; const y = random() * canvas.height;
    const r = 4 + random() * 13;
    ctx.fillStyle = ['#39784c', '#5c9b5b', '#e4dda5', '#afc88e'][Math.floor(random() * 4)];
    ctx.globalAlpha = 0.72;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.35, r, random() * Math.PI, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}

type AnimatedModel = {location: BioglowModelLocation; target: number; current: number; apply: (value: number) => void};
function createModel(location: BioglowModelLocation, field: THREE.Group): AnimatedModel {
  const group = new THREE.Group(); group.position.set(location.x, 0, location.z);
  if (location.side === 'blue') group.rotation.y = Math.PI;
  field.add(group);
  const kind = location.kind;
  const number: Record<BioglowKind, string> = {grandTree: '1', hollowTree: '2', nest: '3', youngForest: '4', hive: '5', recycler: '6', waterfall: '7', operator: '8', technician: '9'};
  label(group, number[kind], kind === 'grandTree' ? 11 : 8, kind === 'operator' || kind === 'technician' ? 0 : -8, location.side === 'red' ? 0xc92d35 : 0x186ba8, location.side === 'blue');
  let apply = (_value: number) => {};

  if (kind === 'grandTree') {
    box(group, [15, 1, 13], palette.stone, 0, 0.2);
    box(group, [7, 18, 7], palette.bark, 0, 9);
    box(group, [5.5, 10, 8], palette.barkLight, 0, 18);
    const crown = new THREE.Group(); crown.position.y = 23; group.add(crown);
    for (const [x, z] of [[-7, -3], [-4, 5], [4, -5], [8, 4], [0, 0]]) {
      box(crown, [Math.abs(x) + 4, 1.2, 1.2], palette.bark, x / 2, 0, z / 2);
      cylinder(crown, 2.6, 2.6, 1, palette.leaf, x, 0.6, z, 10);
      cylinder(crown, 2.2, 2.2, 0.7, palette.leafBright, x + 2, 1.1, z + 1, 10);
    }
    ring(group, 4.2, 1.4, palette.lime, -7, 6, 2);
    const ramp = new THREE.Group(); ramp.position.set(4, 5, 0); group.add(ramp);
    box(ramp, [7, 0.8, 8], palette.stone, 3.5, 0, 0);
    token(group, 'resource', 2, 20, 0);
    apply = (v) => { crown.rotation.y = v * 0.52; ramp.rotation.z = -v * 0.7; };
  } else if (kind === 'hollowTree') {
    box(group, [10, 1, 10], palette.sand, 0, 0.25);
    box(group, [8, 10, 8], palette.bark, 0, 5);
    box(group, [5, 4, 1], palette.dark, 0, 3, 4.05);
    ring(group, 5.3, 1.35, palette.lime, 0, 11.2);
    const hatch = new THREE.Group(); hatch.position.set(0, 7.6, 4.2); group.add(hatch);
    box(hatch, [6.2, 0.9, 4.5], palette.barkLight, 0, 0, 2.1);
    const tokens = [token(group, 'keystone', -1.7, 1.4, 3), token(group, 'keystone', 1.7, 1.4, 3)];
    apply = (v) => { hatch.rotation.x = -v * 1.1; tokens.forEach((piece, i) => { piece.position.z = 3 + v * (5 + i * 2); piece.position.y = 1.4 + Math.sin(v * Math.PI) * 2; }); };
  } else if (kind === 'nest') {
    box(group, [10, 1, 9], palette.sand, 0, 0.3);
    box(group, [6, 9, 7], palette.bark, 0, 4.7);
    ring(group, 4.2, 1.2, palette.lime, -1, 10.2);
    const gate = new THREE.Group(); gate.position.set(3, 8, 1); group.add(gate);
    beam(gate, 9, palette.leaf, 0, 0, 0, true);
    const tokens = [token(group, 'resource', -2, 10, 0), token(group, 'resource', 1.7, 10, 0)];
    apply = (v) => { gate.rotation.x = -v * 0.85; tokens.forEach((piece, i) => { piece.position.z = v * (6 + i * 3); piece.position.y = 10 - v * 8; }); };
  } else if (kind === 'youngForest') {
    box(group, [9, 1, 9], palette.stone, 0, 0.25);
    box(group, [7, 8, 7], palette.sand, 0, 4.2);
    ring(group, 4.1, 1.05, palette.lime, 0, 9);
    const canopy = new THREE.Group(); canopy.position.y = 9.6; group.add(canopy);
    for (const x of [-3, 0, 3]) {
      cylinder(canopy, 0.45, 0.45, 4 + Math.abs(x), palette.bark, x, 2);
      cylinder(canopy, 2.1, 2.1, 0.7, palette.leaf, x, 5, 0, 9);
    }
    const sensor = box(group, [4, 2.3, 0.35], palette.dark, 0, 3, 3.7);
    sensor.material = material(palette.dark).clone();
    apply = (v) => { canopy.rotation.z = v * 0.22; (sensor.material as THREE.MeshStandardMaterial).emissive.setHex(v > 0.5 ? 0x1b8675 : 0); };
  } else if (kind === 'hive') {
    box(group, [8, 1, 8], palette.stone, 0, 0.3);
    box(group, [6, 7, 6], palette.bark, 0, 4);
    const top = new THREE.Group(); top.position.y = 8; group.add(top);
    cylinder(top, 2.9, 2.9, 5, palette.leafBright, 0, 2.4);
    for (const x of [-1.5, 1.5]) cylinder(top, 0.65, 0.65, 0.5, 0xffffff, x, 4.2, 2.7);
    box(top, [3.5, 1.1, 0.5], palette.dark, 0, 1.2, 2.9);
    const arm = new THREE.Group(); arm.position.set(4, 4, 0); group.add(arm);
    beam(arm, 8, palette.water, 3, 0, 0);
    apply = (v) => { top.rotation.y = v * Math.PI * 2; arm.rotation.z = v * 0.5; };
  } else if (kind === 'recycler') {
    box(group, [8, 1, 7], palette.sand, 0, 0.3);
    box(group, [7.5, 9, 7], palette.bark, 0, 4.8);
    box(group, [5, 4, 0.3], palette.dark, 0, 5.8, 3.6);
    const lid = new THREE.Group(); lid.position.set(0, 9.5, -3); group.add(lid);
    box(lid, [7.7, 0.8, 6.7], palette.barkLight, 0, 0, 3.1);
    apply = (v) => { lid.rotation.x = -v * 0.9; };
  } else if (kind === 'waterfall') {
    box(group, [13, 1, 10], palette.stone, 0, 0.2);
    box(group, [10, 7, 8], palette.stone, 0, 4);
    box(group, [7, 4, 0.5], palette.dark, 0, 3, 4.2);
    ring(group, 5.4, 1.1, palette.lime, 0, 8.4);
    const disc = new THREE.Group(); disc.position.y = 8.8; group.add(disc);
    cylinder(disc, 4.2, 4.2, 0.8, palette.leaf, 0, 0);
    for (let i = 0; i < 8; i += 1) {
      const angle = i * Math.PI / 4;
      box(disc, [1, 0.4, 3.3], palette.leafBright, Math.sin(angle) * 2, 0.5, Math.cos(angle) * 2).rotation.y = angle;
    }
    cylinder(group, 2, 2, 0.5, 0xe6e5cc, 5.5, 4, 0);
    apply = (v) => { disc.rotation.y = v * Math.PI * 3; };
  } else if (kind === 'operator' || kind === 'technician') {
    const length = kind === 'operator' ? 31 : 28;
    beam(group, length, palette.lime, 0, 1.4, 5);
    beam(group, length, palette.lime, 0, 1.4, -5);
    if (kind === 'operator') {
      beam(group, 11, palette.lime, -length / 2, 1.4, 0, true);
      beam(group, 11, palette.lime, length / 2, 1.4, 0, true);
      for (const [x, z] of [[-8, 0], [0, 0], [8, 0]]) token(group, location.side === 'red' ? 'keystone' : 'resource', x, 0.5, z);
    } else {
      for (let i = 0; i < 4; i += 1) token(group, 'resource', -10 + i * 6, 0.5, 0);
    }
  }
  return {location, target: 0, current: 0, apply};
}

function segmentDistance(x: number, z: number, a: FllSceneState, b: FllSceneState): number {
  const dx = b.xCm - a.xCm; const dz = b.zCm - a.zCm;
  const t = Math.max(0, Math.min(1, ((x - a.xCm) * dx + (z - a.zCm) * dz) / Math.max(0.001, dx * dx + dz * dz)));
  return Math.hypot(x - a.xCm - t * dx, z - a.zCm - t * dz);
}

export function bioglowTouchedModels(trail: FllSceneState[]): string[] {
  const touched = new Set<string>();
  for (let i = 1; i < trail.length; i += 1) {
    const from = trail[i - 1]; const to = trail[i];
    if (Math.hypot(to.xCm - from.xCm, to.zCm - from.zCm) < 0.1) continue;
    for (const model of BIOGLOW_MODELS) {
      if (model.kind === 'operator' || model.kind === 'technician') continue;
      if (segmentDistance(model.x, model.z, from, to) <= model.radius) touched.add(model.key);
    }
  }
  // The field map pairs each Young Forest sensor with the Hive on the opposite half.
  if (touched.has('red-young')) touched.add('blue-hive');
  if (touched.has('blue-young')) touched.add('red-hive');
  return [...touched];
}

export interface BioglowField {
  root: THREE.Group;
  setProgress: (trail: FllSceneState[]) => string[];
  tick: (reducedMotion: boolean) => boolean;
}
export function createBioglowField(): BioglowField {
  materialCache.clear();
  const root = new THREE.Group();
  const mat = box(root, [236, 1.3, 108], 0x263d31, 0, -1.1);
  mat.receiveShadow = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(236, 108), new THREE.MeshStandardMaterial({map: makeTerrainTexture(), roughness: 1}));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.42; floor.receiveShadow = true; root.add(floor);
  box(root, [1.1, 0.18, 106], 0xd63b3b, -117.2, 0, 0);
  box(root, [1.1, 0.18, 106], 0x1879b8, 117.2, 0, 0);
  box(root, [115, 0.18, 1.2], 0xd63b3b, -58, 0, -53.4);
  box(root, [115, 0.18, 1.2], 0xd63b3b, -58, 0, 53.4);
  box(root, [115, 0.18, 1.2], 0x1879b8, 58, 0, -53.4);
  box(root, [115, 0.18, 1.2], 0x1879b8, 58, 0, 53.4);
  box(root, [1.2, 0.3, 108], 0x1e302b, 0, 0.08, 0);
  for (const x of [-8, 8]) {
    const haven = new THREE.Mesh(new THREE.RingGeometry(8.8, 9.1, 48), new THREE.MeshBasicMaterial({color: 0x273d36, side: THREE.DoubleSide}));
    haven.rotation.x = -Math.PI / 2; haven.position.set(x, 0.05, 0); root.add(haven);
  }
  const wallMaterial = material(0x18231e);
  for (const [w, d, x, z] of [[236, 2.6, 0, -55], [236, 2.6, 0, 55], [2.6, 108, -119, 0], [2.6, 108, 119, 0]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 6.8, d), wallMaterial);
    wall.position.set(x, 2.7, z); root.add(wall);
  }
  const models = BIOGLOW_MODELS.map((location) => createModel(location, root));
  return {
    root,
    setProgress(trail) {
      const touched = bioglowTouchedModels(trail);
      const active = new Set(touched);
      for (const model of models) model.target = active.has(model.location.key) ? 1 : 0;
      return touched;
    },
    tick(reducedMotion) {
      let moving = false;
      for (const model of models) {
        const difference = model.target - model.current;
        if (Math.abs(difference) > 0.004) {
          model.current = reducedMotion ? model.target : model.current + difference * 0.22;
          moving = true;
        } else model.current = model.target;
        model.apply(model.current);
      }
      return moving;
    },
  };
}
