import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const CARS = [
  {
    id: 'street',
    name: 'Apex Street Coupe',
    modelPaths: ['/models/starter.glb', '/models/starter/scene.gltf'],
    price: 0,
    topSpeed: 2.35,
    accel: 0.036,
    handling: 0.035,
    nitroPower: 3.65,
    enginePitch: 1.15,
  },
  {
    id: 'muscle',
    name: 'V8 Phantom Muscle',
    modelPaths: ['/models/muscle.glb', '/models/muscle/scene.gltf'],
    price: 500,
    topSpeed: 2.6,
    accel: 0.042,
    handling: 0.033,
    nitroPower: 3.95,
    enginePitch: 0.92,
  },
  {
    id: 'supercar',
    name: 'Lykan GT Supercar',
    modelPaths: ['/models/sportscar.glb', '/models/sportscar/scene.gltf'],
    price: 1200,
    topSpeed: 2.9,
    accel: 0.046,
    handling: 0.039,
    nitroPower: 4.35,
    enginePitch: 1.32,
  },
  {
    id: 'hypercar',
    name: 'Zenith F1 Hypercar',
    modelPaths: ['/models/hypercar.glb', '/models/hypercar/scene.gltf'],
    price: 2500,
    topSpeed: 3.25,
    accel: 0.052,
    handling: 0.043,
    nitroPower: 4.85,
    enginePitch: 1.48,
  },
];

const TRACKS = [
  {
    id: 'city',
    name: 'Neon Metropolis',
    subtitle: 'Midnight Highway • 4.8 KM Loop',
    skyTop: '#020617',
    skyBottom: '#0f172a',
    fogColor: 0x060b19,
    fogDensity: 0.00095,
    groundBase: '#090d16',
    groundGrain: '#1e293b',
    curbPrimary: '#06b6d4',
    curbSecondary: '#0f172a',
    accentHex: '#06b6d4',
    ambientColor: 0xe0f2fe,
    sunColor: 0x60a5fa,
    points: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -520),
      new THREE.Vector3(240, 0, -960),
      new THREE.Vector3(680, 0, -1120),
      new THREE.Vector3(1140, 0, -920),
      new THREE.Vector3(1320, 0, -500),
      new THREE.Vector3(1020, 0, -180),
      new THREE.Vector3(1280, 0, 220),
      new THREE.Vector3(1140, 0, 680),
      new THREE.Vector3(720, 0, 880),
      new THREE.Vector3(280, 0, 740),
      new THREE.Vector3(440, 0, 420),
      new THREE.Vector3(120, 0, 280),
      new THREE.Vector3(0, 0, 160),
    ],
  },
  {
    id: 'jungle',
    name: 'Emerald Amazon',
    subtitle: 'Rainforest Canopy • 5.4 KM Loop',
    skyTop: '#064e3b',
    skyBottom: '#a7f3d0',
    fogColor: 0x0d3b2e,
    fogDensity: 0.00105,
    groundBase: '#0c2e1c',
    groundGrain: '#14532d',
    curbPrimary: '#eab308',
    curbSecondary: '#14532d',
    accentHex: '#10b981',
    ambientColor: 0xecfdf5,
    sunColor: 0xfef08a,
    points: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-120, 0, -480),
      new THREE.Vector3(-480, 0, -820),
      new THREE.Vector3(-260, 0, -1240),
      new THREE.Vector3(240, 0, -1340),
      new THREE.Vector3(680, 0, -1060),
      new THREE.Vector3(520, 0, -640),
      new THREE.Vector3(960, 0, -420),
      new THREE.Vector3(1180, 0, 80),
      new THREE.Vector3(840, 0, 560),
      new THREE.Vector3(360, 0, 440),
      new THREE.Vector3(240, 0, 780),
      new THREE.Vector3(-180, 0, 680),
      new THREE.Vector3(-60, 0, 320),
    ],
  },
  {
    id: 'desert',
    name: 'Sahara Canyon',
    subtitle: 'Red Rock Switchbacks • 5.8 KM Loop',
    skyTop: '#7c2d12',
    skyBottom: '#fed7aa',
    fogColor: 0x5c240c,
    fogDensity: 0.0009,
    groundBase: '#78350f',
    groundGrain: '#92400e',
    curbPrimary: '#ef4444',
    curbSecondary: '#fef3c7',
    accentHex: '#f59e0b',
    ambientColor: 0xffedd5,
    sunColor: 0xfdba74,
    points: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(140, 0, -560),
      new THREE.Vector3(-220, 0, -980),
      new THREE.Vector3(180, 0, -1420),
      new THREE.Vector3(760, 0, -1460),
      new THREE.Vector3(1240, 0, -1120),
      new THREE.Vector3(940, 0, -720),
      new THREE.Vector3(1420, 0, -340),
      new THREE.Vector3(1360, 0, 260),
      new THREE.Vector3(860, 0, 540),
      new THREE.Vector3(640, 0, 180),
      new THREE.Vector3(320, 0, 620),
      new THREE.Vector3(-140, 0, 480),
      new THREE.Vector3(-40, 0, 220),
    ],
  },
];

const TOTAL_LAPS = 2;

function formatOrdinal(pos) {
  if (pos === 1) return '1st';
  if (pos === 2) return '2nd';
  if (pos === 3) return '3rd';
  return `${pos}th`;
}

function createAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#181c24';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 16000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = 20 + Math.floor(Math.random() * 28);
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = 'rgba(8, 10, 14, 0.35)';
  ctx.fillRect(110, 0, 55, 512);
  ctx.fillRect(347, 0, 55, 512);

  ctx.fillStyle = '#eab308';
  ctx.fillRect(18, 0, 8, 512);
  ctx.fillRect(486, 0, 8, 512);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(252, 32, 8, 190);
  ctx.fillRect(252, 288, 8, 190);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function createCurbTexture(colorA, colorB) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = colorB;
  ctx.fillRect(0, 64, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createGroundTexture(baseHex, grainHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = grainHex;
  for (let i = 0; i < 3500; i++) {
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(90, 90);
  return tex;
}

function createSkyDome(topHex, bottomHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, topHex);
  grad.addColorStop(0.55, bottomHex);
  grad.addColorStop(1, bottomHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 256);
  const tex = new THREE.CanvasTexture(canvas);
  return new THREE.Mesh(
    new THREE.SphereGeometry(3600, 24, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
  );
}

function createBuildingWindowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 128, 256);

  for (let y = 8; y < 248; y += 14) {
    for (let x = 8; x < 120; x += 16) {
      const lit = Math.random();
      if (lit > 0.35) {
        ctx.fillStyle = lit > 0.85 ? '#38bdf8' : lit > 0.6 ? '#fef08a' : '#94a3b8';
        ctx.fillRect(x, y, 9, 8);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeExhaustDistortionCurve(amount = 55) {
  const nSamples = 44100;
  const curve = new Float32Array(nSamples);
  const deg = Math.PI / 180;
  for (let i = 0; i < nSamples; ++i) {
    const x = (i * 2) / nSamples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function buildTrackMinimapData(points) {
  const curve = new THREE.CatmullRomCurve3(points, true);
  const sampled = curve.getPoints(160);

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  sampled.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  });

  const span = Math.max(maxX - minX, maxZ - minZ) || 1;
  const padX = (span - (maxX - minX)) / 2;
  const padZ = (span - (maxZ - minZ)) / 2;

  const project = (x, z) => ({
    x: ((x - minX + padX) / span) * 116 + 12,
    y: ((z - minZ + padZ) / span) * 116 + 12,
  });

  const svgPath =
    sampled
      .map((p, idx) => {
        const { x, y } = project(p.x, p.z);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z';

  return { curve, svgPath, project };
}

function AnalogDial({ value, max, label, accentColor }) {
  const ratio = Math.min(1, Math.max(0, value / max));
  const angle = -130 + ratio * 260;

  return (
    <div className="relative w-32 h-32 bg-slate-900/90 border-2 border-slate-700 rounded-full flex flex-col items-center justify-center shadow-xl backdrop-blur-md">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <path
          d="M 22 92 A 48 48 0 1 1 98 92"
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 22 92 A 48 48 0 1 1 98 92"
          fill="none"
          stroke={accentColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="215"
          strokeDashoffset={215 - ratio * 215}
        />
        <g transform={`translate(60, 60) rotate(${angle})`}>
          <polygon points="-2,4 0,-44 2,4" fill="#f8fafc" />
          <circle cx="0" cy="0" r="5" fill={accentColor} />
        </g>
      </svg>
      <div className="absolute bottom-3 text-center">
        <div className="text-lg font-black font-mono text-white leading-none">{value}</div>
        <div className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
}

function buildBotCarMesh(colorHex) {
  const group = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    metalness: 0.7,
    roughness: 0.2,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.85,
    roughness: 0.15,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.62, 4.5), paintMat);
  body.position.y = 0.58;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.5, 2.0), darkMat);
  cabin.position.set(0, 1.1, -0.1);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.14, 0.5), paintMat);
  wing.position.set(0, 1.18, 2.0);
  group.add(body, cabin, wing);

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.36, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
  [
    [-1.1, 0.42, -1.4],
    [1.1, 0.42, -1.4],
    [-1.1, 0.42, 1.4],
    [1.1, 0.42, 1.4],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(wx, wy, wz);
    group.add(w);
  });

  return group;
}

function populateBiomeScenery(envGroup, trackId, trackCurve, roadWidth) {
  const clearPoints = trackCurve.getPoints(320);
  const isNearRoad = (x, z, minDist) => {
    const minSq = minDist * minDist;
    for (let i = 0; i < clearPoints.length; i++) {
      const dx = clearPoints[i].x - x;
      const dz = clearPoints[i].z - z;
      if (dx * dx + dz * dz < minSq) return true;
    }
    return false;
  };

  const poleGeo = new THREE.CylinderGeometry(0.18, 0.25, 11, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const lampGeo = new THREE.BoxGeometry(2.8, 0.25, 0.6);
  const lampMat = new THREE.MeshBasicMaterial({
    color: trackId === 'city' ? 0x38bdf8 : trackId === 'jungle' ? 0xfef08a : 0xfb923c,
  });

  const poleCount = 45;
  const poles = new THREE.InstancedMesh(poleGeo, poleMat, poleCount * 2);
  const lamps = new THREE.InstancedMesh(lampGeo, lampMat, poleCount * 2);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < poleCount; i++) {
    const t = i / poleCount;
    const pt = trackCurve.getPointAt(t);
    const tan = trackCurve.getTangentAt(t).normalize();
    const norm = new THREE.Vector3(-tan.z, 0, tan.x);
    const yaw = Math.atan2(tan.x, tan.z);

    [-1, 1].forEach((side, sIdx) => {
      const idx = i * 2 + sIdx;
      const px = pt.x + norm.x * side * (roadWidth / 2 + 2.2);
      const pz = pt.z + norm.z * side * (roadWidth / 2 + 2.2);

      dummy.position.set(px, 5.5, pz);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poles.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(px - norm.x * side * 1.2, 10.9, pz - norm.z * side * 1.2);
      dummy.updateMatrix();
      lamps.setMatrixAt(idx, dummy.matrix);
    });
  }
  envGroup.add(poles, lamps);

  const spots = [];
  for (let i = 0; i < 720 && spots.length < 460; i++) {
    const t = Math.random();
    const pt = trackCurve.getPointAt(t);
    const tan = trackCurve.getTangentAt(t).normalize();
    const norm = new THREE.Vector3(-tan.z, 0, tan.x);
    const side = Math.random() < 0.5 ? -1 : 1;
    const dist = roadWidth * 0.85 + 12 + Math.random() * 160;
    const x = pt.x + norm.x * side * dist;
    const z = pt.z + norm.z * side * dist;

    if (!isNearRoad(x, z, roadWidth * 0.8 + 8)) {
      spots.push({ x, z });
    }
  }

  if (trackId === 'city') {
    const windowTex = createBuildingWindowTexture();
    const towerGeo = new THREE.BoxGeometry(1, 1, 1);
    const towerMat = new THREE.MeshStandardMaterial({
      map: windowTex,
      emissiveMap: windowTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.75,
      roughness: 0.3,
      metalness: 0.6,
    });
    const towers = new THREE.InstancedMesh(towerGeo, towerMat, spots.length);

    const beaconGeo = new THREE.BoxGeometry(1.03, 0.03, 1.03);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const beacons = new THREE.InstancedMesh(beaconGeo, beaconMat, spots.length);

    spots.forEach((s, idx) => {
      const w = 16 + Math.random() * 22;
      const d = 16 + Math.random() * 22;
      const h = 40 + Math.random() * 145;

      dummy.position.set(s.x, h / 2, s.z);
      dummy.scale.set(w, h, d);
      dummy.rotation.set(0, (Math.floor(Math.random() * 4) * Math.PI) / 2, 0);
      dummy.updateMatrix();
      towers.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(s.x, h - 2, s.z);
      dummy.scale.set(w, 1.2, d);
      dummy.updateMatrix();
      beacons.setMatrixAt(idx, dummy.matrix);
    });

    envGroup.add(towers, beacons);
  } else if (trackId === 'jungle') {
    const trunkGeo = new THREE.CylinderGeometry(0.75, 1.35, 1, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.92 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);

    const leafGeo = new THREE.DodecahedronGeometry(1, 1);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.78 });
    const canopies = new THREE.InstancedMesh(leafGeo, leafMat, spots.length * 2);

    spots.forEach((s, idx) => {
      const h = 15 + Math.random() * 25;
      const radius = 5.5 + Math.random() * 7.5;

      dummy.position.set(s.x, h * 0.35, s.z);
      dummy.scale.set(1, h * 0.7, 1);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      trunks.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(s.x, h * 0.68, s.z);
      dummy.scale.set(radius, radius * 0.65, radius);
      dummy.updateMatrix();
      canopies.setMatrixAt(idx * 2, dummy.matrix);

      dummy.position.set(s.x + 1.5, h * 0.92, s.z - 1.2);
      dummy.scale.set(radius * 0.75, radius * 0.55, radius * 0.75);
      dummy.updateMatrix();
      canopies.setMatrixAt(idx * 2 + 1, dummy.matrix);
    });

    envGroup.add(trunks, canopies);
  } else {
    const mesaCount = Math.floor(spots.length * 0.45);
    const cactusCount = spots.length - mesaCount;

    const mesaGeo = new THREE.CylinderGeometry(0.62, 1.05, 1, 8);
    const mesaMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.92 });
    const mesas = new THREE.InstancedMesh(mesaGeo, mesaMat, mesaCount);

    const cactusGeo = new THREE.CylinderGeometry(0.45, 0.55, 1, 8);
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const cacti = new THREE.InstancedMesh(cactusGeo, cactusMat, cactusCount);

    spots.forEach((s, idx) => {
      if (idx < mesaCount) {
        const w = 18 + Math.random() * 32;
        const h = 20 + Math.random() * 60;
        dummy.position.set(s.x, h / 2, s.z);
        dummy.scale.set(w, h, w * (0.7 + Math.random() * 0.6));
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        mesas.setMatrixAt(idx, dummy.matrix);
      } else {
        const h = 4.5 + Math.random() * 6.5;
        dummy.position.set(s.x, h / 2, s.z);
        dummy.scale.set(1, h, 1);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        cacti.setMatrixAt(idx - mesaCount, dummy.matrix);
      }
    });

    envGroup.add(mesas, cacti);
  }
}

export default function App() {
  const mountRef = useRef(null);

  const [coins, setCoins] = useState(() => Number(localStorage.getItem('nh_coins') ?? 650));
  const [unlockedCars, setUnlockedCars] = useState(() =>
    JSON.parse(localStorage.getItem('nh_cars') ?? '["street"]')
  );

  const [equippedCarId, setEquippedCarId] = useState('street');
  const [previewCarId, setPreviewCarId] = useState('street');
  const [selectedTrackId, setSelectedTrackId] = useState('city');
  const [flipCarModel, setFlipCarModel] = useState(false);
  const [modelStatus, setModelStatus] = useState('LOADING 3D MODEL...');
  // 'menu' | 'countdown' | 'racing' | 'paused' | 'finished'
  const [gameState, setGameState] = useState('menu');
  const [countdownText, setCountdownText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [raceReward, setRaceReward] = useState(0);
  const [raceSessionId, setRaceSessionId] = useState(0);

  const activeTrack = TRACKS.find((t) => t.id === selectedTrackId) || TRACKS[0];
  const initialMap = buildTrackMinimapData(activeTrack.points);

  const [hud, setHud] = useState({
    speed: 0,
    rpm: 1000,
    gear: 1,
    nitro: 100,
    isBoosting: false,
    score: 0,
    lap: 1,
    position: 1,
    airborne: false,
    minimapPath: initialMap.svgPath,
    playerDot: initialMap.project(0, 0),
    botDots: [],
  });

  useEffect(() => {
    localStorage.setItem('nh_coins', String(coins));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('nh_cars', JSON.stringify(unlockedCars));
  }, [unlockedCars]);

  const previewCar = CARS.find((c) => c.id === previewCarId) || CARS[0];
  const equippedCar = CARS.find((c) => c.id === equippedCarId) || CARS[0];

  const previewCarRef = useRef(previewCar);
  const flipRef = useRef(flipCarModel);
  const gameStateRef = useRef(gameState);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    previewCarRef.current = previewCar;
  }, [previewCar]);

  useEffect(() => {
    flipRef.current = flipCarModel;
  }, [flipCarModel]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Keyboard Escape / P shortcut for Pause & Resume
  useEffect(() => {
    const onPauseKey = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        setGameState((prev) => {
          if (prev === 'racing') return 'paused';
          if (prev === 'paused') return 'racing';
          return prev;
        });
      }
    };
    window.addEventListener('keydown', onPauseKey);
    return () => window.removeEventListener('keydown', onPauseKey);
  }, []);

  const sceneObjectsRef = useRef(null);

  const swapCarModelInScene = (carSpec) => {
    const objs = sceneObjectsRef.current;
    if (!objs) return;

    const { modelHolder, gltfLoader } = objs;
    const requestToken = Symbol(carSpec.id);
    objs.activeRequest = requestToken;

    while (modelHolder.children.length > 0) {
      modelHolder.remove(modelHolder.children[0]);
    }

    setModelStatus('LOADING 3D MODEL...');

    const tryLoadPath = (pathIndex) => {
      if (objs.activeRequest !== requestToken) return;

      if (pathIndex >= carSpec.modelPaths.length) {
        setModelStatus(`MISSING: ${carSpec.modelPaths[0]}`);
        return;
      }

      const currentPath = carSpec.modelPaths[pathIndex];

      gltfLoader.load(
        currentPath,
        (gltf) => {
          if (objs.activeRequest !== requestToken) return;

          while (modelHolder.children.length > 0) {
            modelHolder.remove(modelHolder.children[0]);
          }

          const wrapper = new THREE.Group();
          const model = gltf.scene;

          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = 4.8 / (maxDim || 1);
          model.scale.setScalar(scaleFactor);

          const scaledBox = new THREE.Box3().setFromObject(model);
          const center = new THREE.Vector3();
          scaledBox.getCenter(center);
          model.position.x -= center.x;
          model.position.z -= center.z;
          model.position.y -= scaledBox.min.y;

          wrapper.rotation.y = flipRef.current ? 0 : Math.PI;
          wrapper.userData.isGLBWrapper = true;
          wrapper.add(model);

          modelHolder.add(wrapper);
          setModelStatus('3D MODEL READY');
        },
        undefined,
        () => {
          tryLoadPath(pathIndex + 1);
        }
      );
    };

    tryLoadPath(0);
  };

  useEffect(() => {
    const car = CARS.find((c) => c.id === previewCarId) || CARS[0];
    swapCarModelInScene(car);
  }, [previewCarId]);

  // Asphalt 8 Style Car DSP Audio Engine
  const audioRef = useRef(null);
  const initAudio = () => {
    if (audioRef.current) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const subOsc = ctx.createOscillator();
    const mainOsc = ctx.createOscillator();
    const screamOsc = ctx.createOscillator();
    const turboWhineOsc = ctx.createOscillator();

    subOsc.type = 'triangle';
    mainOsc.type = 'sawtooth';
    screamOsc.type = 'sawtooth';
    turboWhineOsc.type = 'sine';

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeExhaustDistortionCurve(48);
    shaper.oversample = '2x';

    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 420;
    engineFilter.Q.value = 5.0;

    const raspPeak = ctx.createBiquadFilter();
    raspPeak.type = 'peaking';
    raspPeak.frequency.value = 1150;
    raspPeak.Q.value = 2.4;
    raspPeak.gain.value = 7.5;

    const subGain = ctx.createGain();
    subGain.gain.value = 0.42;
    const screamGain = ctx.createGain();
    screamGain.gain.value = 0.36;
    const turboWhineGain = ctx.createGain();
    turboWhineGain.gain.value = 0.0;

    const masterEngineGain = ctx.createGain();
    masterEngineGain.gain.value = 0;

    subOsc.connect(subGain);
    subGain.connect(shaper);
    mainOsc.connect(shaper);
    screamOsc.connect(screamGain);
    screamGain.connect(shaper);

    shaper.connect(engineFilter);
    engineFilter.connect(raspPeak);
    raspPeak.connect(masterEngineGain);

    turboWhineOsc.connect(turboWhineGain);
    turboWhineGain.connect(ctx.destination);

    masterEngineGain.connect(ctx.destination);

    subOsc.start();
    mainOsc.start();
    screamOsc.start();
    turboWhineOsc.start();

    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const nitroNoise = ctx.createBufferSource();
    nitroNoise.buffer = noiseBuffer;
    nitroNoise.loop = true;
    const nitroFilter = ctx.createBiquadFilter();
    nitroFilter.type = 'bandpass';
    nitroFilter.frequency.value = 880;
    nitroFilter.Q.value = 1.2;
    const nitroGain = ctx.createGain();
    nitroGain.gain.value = 0;

    nitroNoise.connect(nitroFilter);
    nitroFilter.connect(nitroGain);
    nitroGain.connect(ctx.destination);
    nitroNoise.start();

    const screechNoise = ctx.createBufferSource();
    screechNoise.buffer = noiseBuffer;
    screechNoise.loop = true;
    const screechFilter = ctx.createBiquadFilter();
    screechFilter.type = 'bandpass';
    screechFilter.frequency.value = 1680;
    screechFilter.Q.value = 8.5;
    const screechGain = ctx.createGain();
    screechGain.gain.value = 0;

    screechNoise.connect(screechFilter);
    screechFilter.connect(screechGain);
    screechGain.connect(ctx.destination);
    screechNoise.start();

    audioRef.current = {
      ctx,
      noiseBuffer,
      subOsc,
      mainOsc,
      screamOsc,
      turboWhineOsc,
      turboWhineGain,
      engineFilter,
      raspPeak,
      masterEngineGain,
      nitroFilter,
      nitroGain,
      screechGain,
    };
  };

  const playExhaustPopAndTurbo = () => {
    if (!soundEnabledRef.current || !audioRef.current) return;
    const { ctx, noiseBuffer } = audioRef.current;
    const now = ctx.currentTime;

    const popSrc = ctx.createBufferSource();
    popSrc.buffer = noiseBuffer;
    const popFilter = ctx.createBiquadFilter();
    popFilter.type = 'bandpass';
    popFilter.frequency.setValueAtTime(750, now);
    popFilter.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    const popGain = ctx.createGain();
    popGain.gain.setValueAtTime(0.18, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    popSrc.connect(popFilter);
    popFilter.connect(popGain);
    popGain.connect(ctx.destination);
    popSrc.start(now);
    popSrc.stop(now + 0.08);

    const turboOsc = ctx.createOscillator();
    const turboGain = ctx.createGain();
    turboOsc.type = 'sine';
    turboOsc.frequency.setValueAtTime(2600, now);
    turboOsc.frequency.exponentialRampToValueAtTime(840, now + 0.13);
    turboGain.gain.setValueAtTime(0.04, now);
    turboGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    turboOsc.connect(turboGain);
    turboGain.connect(ctx.destination);
    turboOsc.start(now);
    turboOsc.stop(now + 0.13);
  };

  const playPerfectNitroSurge = () => {
    if (!soundEnabledRef.current || !audioRef.current) return;
    const { ctx, noiseBuffer } = audioRef.current;
    const now = ctx.currentTime;

    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(150, now);
    boomOsc.frequency.exponentialRampToValueAtTime(36, now + 0.24);
    boomGain.gain.setValueAtTime(0.22, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    boomOsc.connect(boomGain);
    boomGain.connect(ctx.destination);
    boomOsc.start(now);
    boomOsc.stop(now + 0.24);

    const surgeSrc = ctx.createBufferSource();
    surgeSrc.buffer = noiseBuffer;
    const surgeFilter = ctx.createBiquadFilter();
    surgeFilter.type = 'bandpass';
    surgeFilter.frequency.setValueAtTime(450, now);
    surgeFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.22);
    surgeFilter.Q.value = 1.6;

    const surgeGain = ctx.createGain();
    surgeGain.gain.setValueAtTime(0.2, now);
    surgeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    surgeSrc.connect(surgeFilter);
    surgeFilter.connect(surgeGain);
    surgeGain.connect(ctx.destination);
    surgeSrc.start(now);
    surgeSrc.stop(now + 0.26);
  };

  const playTakedownCrunch = () => {
    if (!soundEnabledRef.current || !audioRef.current) return;
    const { ctx, noiseBuffer } = audioRef.current;
    const now = ctx.currentTime;

    const slamOsc = ctx.createOscillator();
    const slamGain = ctx.createGain();
    slamOsc.type = 'sawtooth';
    slamOsc.frequency.setValueAtTime(110, now);
    slamOsc.frequency.exponentialRampToValueAtTime(26, now + 0.26);
    slamGain.gain.setValueAtTime(0.26, now);
    slamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    slamOsc.connect(slamGain);
    slamGain.connect(ctx.destination);
    slamOsc.start(now);
    slamOsc.stop(now + 0.26);

    const crashSrc = ctx.createBufferSource();
    crashSrc.buffer = noiseBuffer;
    const crashFilter = ctx.createBiquadFilter();
    crashFilter.type = 'highpass';
    crashFilter.frequency.setValueAtTime(1400, now);

    const crashGain = ctx.createGain();
    crashGain.gain.setValueAtTime(0.24, now);
    crashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    crashSrc.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(ctx.destination);
    crashSrc.start(now);
    crashSrc.stop(now + 0.32);
  };

  const playPickupChime = () => {
    if (!soundEnabledRef.current || !audioRef.current) return;
    const { ctx } = audioRef.current;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.setValueAtTime(1580, now + 0.055);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  };

  const playMechanicalClick = (pitch = 240) => {
    if (!soundEnabledRef.current) return;
    initAudio();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    const now = audio.ctx.currentTime;

    const osc = audio.ctx.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.45, now + 0.07);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(audio.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  };

  const handleSelectOrBuyCar = (car) => {
    setPreviewCarId(car.id);
    if (unlockedCars.includes(car.id)) {
      setEquippedCarId(car.id);
      playMechanicalClick(260);
    } else {
      playMechanicalClick(180);
    }
  };

  const handleUnlockCar = (e, car) => {
    e.stopPropagation();
    if (coins >= car.price && !unlockedCars.includes(car.id)) {
      setCoins((c) => c - car.price);
      setUnlockedCars((prev) => [...prev, car.id]);
      setEquippedCarId(car.id);
      setPreviewCarId(car.id);
      playExhaustPopAndTurbo();
    }
  };

  const countdownTimersRef = useRef([]);
  const clearCountdownTimers = () => {
    countdownTimersRef.current.forEach((id) => clearTimeout(id));
    countdownTimersRef.current = [];
  };

  const startRace = () => {
    clearCountdownTimers();
    setRaceSessionId((s) => s + 1);
    setPreviewCarId(equippedCarId);
    initAudio();
    if (audioRef.current?.ctx.state === 'suspended') audioRef.current.ctx.resume();

    playExhaustPopAndTurbo();

    setGameState('countdown');
    setCountdownText('3');
    playMechanicalClick(440);

    countdownTimersRef.current.push(
      setTimeout(() => {
        setCountdownText('2');
        playMechanicalClick(440);
      }, 850),
      setTimeout(() => {
        setCountdownText('1');
        playMechanicalClick(440);
      }, 1700),
      setTimeout(() => {
        setCountdownText('GO!');
        playPerfectNitroSurge();
        setGameState('racing');
      }, 2550),
      setTimeout(() => setCountdownText(''), 3300)
    );
  };

  const exitToGarage = () => {
    clearCountdownTimers();
    setCountdownText('');
    setGameState('menu');
    setRaceSessionId((s) => s + 1);
    playMechanicalClick(200);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const trackConfig = TRACKS.find((t) => t.id === selectedTrackId) || TRACKS[0];
    const minimapData = buildTrackMinimapData(trackConfig.points);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(trackConfig.fogColor, trackConfig.fogDensity);
    scene.add(createSkyDome(trackConfig.skyTop, trackConfig.skyBottom));

    const camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / container.clientHeight,
      0.1,
      4000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(trackConfig.ambientColor, 1.35));
    scene.add(new THREE.HemisphereLight(trackConfig.ambientColor, 0x1e293b, 1.15));

    const dirLight = new THREE.DirectionalLight(trackConfig.sunColor, 2.2);
    dirLight.position.set(140, 240, 120);
    scene.add(dirLight);

    const groundTex = createGroundTexture(trackConfig.groundBase, trackConfig.groundGrain);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(8000, 8000),
      new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    const trackCurve = minimapData.curve;
    const roadWidth = 28;
    const segments = 900;

    function buildTexturedRibbon(width, yOffset, texture, repeatU, repeatV) {
      const positions = [];
      const uvs = [];
      const indices = [];

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const pt = trackCurve.getPointAt(t);
        const tangent = trackCurve.getTangentAt(t).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);

        const left = pt.clone().addScaledVector(normal, -width / 2);
        const right = pt.clone().addScaledVector(normal, width / 2);

        positions.push(left.x, yOffset, left.z);
        positions.push(right.x, yOffset, right.z);

        uvs.push(0, t * repeatV);
        uvs.push(repeatU, t * repeatV);

        if (i < segments) {
          const base = i * 2;
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      return new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.82,
          metalness: 0.08,
          side: THREE.DoubleSide,
        })
      );
    }

    const curbTex = createCurbTexture(trackConfig.curbPrimary, trackConfig.curbSecondary);
    const asphaltTex = createAsphaltTexture();

    scene.add(buildTexturedRibbon(roadWidth + 3.2, 0.01, curbTex, 1, 240));
    scene.add(buildTexturedRibbon(roadWidth, 0.03, asphaltTex, 1, 180));

    const envGroup = new THREE.Group();
    populateBiomeScenery(envGroup, trackConfig.id, trackCurve, roadWidth);
    scene.add(envGroup);

    const padRing = new THREE.Mesh(
      new THREE.RingGeometry(3.2, 3.6, 48),
      new THREE.MeshBasicMaterial({ color: trackConfig.curbPrimary, side: THREE.DoubleSide })
    );
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.set(0, 0.05, 0);
    scene.add(padRing);

    const startPt = trackCurve.getPointAt(0);
    const startTan = trackCurve.getTangentAt(0).normalize();
    const archGroup = new THREE.Group();
    archGroup.position.copy(startPt);
    archGroup.lookAt(startPt.clone().add(startTan));
    const finishStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(roadWidth, 5),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    finishStrip.rotation.x = -Math.PI / 2;
    finishStrip.position.y = 0.06;
    archGroup.add(finishStrip);
    const archBanner = new THREE.Mesh(
      new THREE.BoxGeometry(roadWidth + 3, 2.5, 1.2),
      new THREE.MeshBasicMaterial({ color: trackConfig.curbPrimary })
    );
    archBanner.position.y = 9;
    archGroup.add(archBanner);
    scene.add(archGroup);

    const playerCar = new THREE.Group();
    const modelHolder = new THREE.Group();
    playerCar.add(modelHolder);
    scene.add(playerCar);

    const flameGeo = new THREE.ConeGeometry(0.3, 1.8, 8);
    flameGeo.rotateX(Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const leftFlame = new THREE.Mesh(flameGeo, flameMat);
    leftFlame.position.set(-0.55, 0.5, 2.9);
    leftFlame.visible = false;
    const rightFlame = leftFlame.clone();
    rightFlame.position.x = 0.55;
    playerCar.add(leftFlame, rightFlame);

    const gltfLoader = new GLTFLoader();
    sceneObjectsRef.current = { modelHolder, gltfLoader, activeRequest: null };
    swapCarModelInScene(previewCarRef.current);

    const ramps = [];
    const pickups = [];
    const rampGeo = new THREE.BoxGeometry(6.2, 0.45, 10);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 });
    const pickupGeo = new THREE.OctahedronGeometry(1.0);
    const pickupMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    const featureCount = 18;
    for (let i = 1; i < featureCount; i++) {
      const t = i / featureCount;
      const pt = trackCurve.getPointAt(t);
      const tan = trackCurve.getTangentAt(t).normalize();
      const norm = new THREE.Vector3(-tan.z, 0, tan.x);

      const ramp = new THREE.Mesh(rampGeo, rampMat);
      ramp.position.copy(pt).addScaledVector(norm, (i % 2 === 0 ? 1 : -1) * 6);
      ramp.position.y = 0.7;
      ramp.lookAt(ramp.position.clone().add(tan));
      ramp.rotateX(-0.22);
      scene.add(ramp);
      ramps.push(ramp);

      const pickupT = (t + 0.025) % 1;
      const pPt = trackCurve.getPointAt(pickupT);
      const pickup = new THREE.Mesh(pickupGeo, pickupMat);
      pickup.position.copy(pPt).add(new THREE.Vector3(0, 1.35, 0));
      scene.add(pickup);
      pickups.push(pickup);
    }

    // Competitive, Fast AI Bots with Dynamic Lane-Changing & Lap Tracking
    const LANE_SLOTS = [-8.5, -3.0, 3.0, 8.5];
    const bots = [
      {
        mesh: buildBotCarMesh('#10b981'),
        color: '#10b981',
        t: 0.008,
        lap: 1,
        baseSpeedT: 0.00043,
        currentSpeedT: 0.00043,
        offset: -7.5,
        targetOffset: -7.5,
        laneTimer: 110,
      },
      {
        mesh: buildBotCarMesh('#f97316'),
        color: '#f97316',
        t: 0.013,
        lap: 1,
        baseSpeedT: 0.00046,
        currentSpeedT: 0.00046,
        offset: 7.5,
        targetOffset: 7.5,
        laneTimer: 160,
      },
      {
        mesh: buildBotCarMesh('#3b82f6'),
        color: '#3b82f6',
        t: 0.018,
        lap: 1,
        baseSpeedT: 0.0004,
        currentSpeedT: 0.0004,
        offset: -3.0,
        targetOffset: -3.0,
        laneTimer: 80,
      },
    ];
    bots.forEach((b) => {
      b.mesh.visible = false;
      scene.add(b.mesh);
    });

    const keys = {};
    const onKeyDown = (e) => (keys[e.code] = true);
    const onKeyUp = (e) => (keys[e.code] = false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let speed = 0;
    let heading = Math.PI;
    let velocityY = 0;
    let nitro = 100;
    let score = 0;
    let barrelRollAngle = 0;
    let isRolling = false;
    let currentLap = 1;
    let passedCheckpoint = false;
    let lastFlip = flipRef.current;
    let lastGear = 1;
    let wasBoosting = false;
    let wasForward = false;
    let idleRev = 0;
    let menuOrbitAngle = 0.6;

    const samplePoints = trackCurve.getPoints(500);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (lastFlip !== flipRef.current) {
        lastFlip = flipRef.current;
        modelHolder.children.forEach((child) => {
          if (child.userData?.isGLBWrapper) {
            child.rotation.y = flipRef.current ? 0 : Math.PI;
          }
        });
      }

      const mode = gameStateRef.current;

      // Silence engine audio cleanly when paused
      if (mode === 'paused') {
        if (audioRef.current) {
          const t = audioRef.current.ctx.currentTime;
          audioRef.current.masterEngineGain.gain.setTargetAtTime(0, t, 0.04);
          audioRef.current.turboWhineGain.gain.setTargetAtTime(0, t, 0.04);
          audioRef.current.nitroGain.gain.setTargetAtTime(0, t, 0.04);
          audioRef.current.screechGain.gain.setTargetAtTime(0, t, 0.04);
        }
        renderer.render(scene, camera);
        return;
      }

      if (mode === 'menu') {
        menuOrbitAngle += 0.009;
        const radius = 6.2;
        camera.position.set(
          playerCar.position.x + Math.sin(menuOrbitAngle) * radius,
          playerCar.position.y + 2.35,
          playerCar.position.z + Math.cos(menuOrbitAngle) * radius
        );
        camera.lookAt(playerCar.position.x, playerCar.position.y + 0.15, playerCar.position.z);

        if (audioRef.current) {
          const t = audioRef.current.ctx.currentTime;
          audioRef.current.masterEngineGain.gain.setTargetAtTime(0, t, 0.05);
          audioRef.current.turboWhineGain.gain.setTargetAtTime(0, t, 0.05);
          audioRef.current.nitroGain.gain.setTargetAtTime(0, t, 0.05);
          audioRef.current.screechGain.gain.setTargetAtTime(0, t, 0.05);
        }
        renderer.render(scene, camera);
        return;
      }

      padRing.visible = false;
      bots.forEach((b) => (b.mesh.visible = true));

      const spec = previewCarRef.current;
      const canDrive = mode === 'racing';
      const wantsThrottle = keys['KeyW'] || keys['ArrowUp'];
      const forward = canDrive && wantsThrottle;
      const brake = canDrive && (keys['KeyS'] || keys['ArrowDown']);
      const left = canDrive && (keys['KeyA'] || keys['ArrowLeft']);
      const right = canDrive && (keys['KeyD'] || keys['ArrowRight']);
      const wantsBoost = canDrive && keys['Space'] && nitro > 2 && forward;

      if (wantsBoost && !wasBoosting) {
        playPerfectNitroSurge();
      }
      wasBoosting = wantsBoost;

      if (!wantsThrottle && wasForward && speed > 1.3) {
        playExhaustPopAndTurbo();
      }
      wasForward = wantsThrottle;

      if (mode === 'countdown') {
        idleRev = THREE.MathUtils.lerp(idleRev, wantsThrottle ? 0.88 : 0.08, 0.14);
      } else {
        idleRev = 0;
      }

      const maxSpeed = wantsBoost ? spec.nitroPower : spec.topSpeed;
      if (forward) {
        speed = THREE.MathUtils.lerp(speed, maxSpeed, wantsBoost ? spec.accel * 1.8 : spec.accel);
      } else if (brake) {
        speed = THREE.MathUtils.lerp(speed, -0.8, 0.05);
      } else {
        speed = THREE.MathUtils.lerp(speed, 0, 0.025);
      }

      if (wantsBoost) {
        nitro = Math.max(0, nitro - 0.5);
        score += 2;
      } else {
        nitro = Math.min(100, nitro + 0.15);
      }

      const kmh = Math.max(0, Math.round(speed * 115));
      const gear = Math.min(6, Math.max(1, Math.floor(kmh / 68) + 1));
      const rawRpm =
        mode === 'countdown'
          ? 1100 + idleRev * 7800
          : 1200 + ((kmh % 68) / 68) * 7600 + (wantsBoost ? 950 : 0);
      const rpm = Math.min(9500, Math.round(rawRpm));

      if (gear > lastGear && canDrive) {
        playExhaustPopAndTurbo();
      }
      lastGear = gear;

      const isTurningHard = (left || right) && speed > 1.35 && playerCar.position.y <= 0.05;

      if (audioRef.current) {
        const audio = audioRef.current;
        const now = audio.ctx.currentTime;
        if (soundEnabledRef.current && (mode === 'racing' || mode === 'countdown')) {
          const pitchMult = spec.enginePitch || 1.25;
          const rpmNorm = rpm / 9500;
          const baseHz = (46 + rpmNorm * 145 + (wantsBoost ? 30 : 0)) * pitchMult;

          audio.subOsc.frequency.setTargetAtTime(baseHz * 0.5, now, 0.03);
          audio.mainOsc.frequency.setTargetAtTime(baseHz, now, 0.03);
          audio.screamOsc.frequency.setTargetAtTime(baseHz * 2.02, now, 0.03);

          audio.turboWhineOsc.frequency.setTargetAtTime(950 + rpmNorm * 2200 + (wantsBoost ? 450 : 0), now, 0.04);
          audio.turboWhineGain.gain.setTargetAtTime(wantsThrottle || wantsBoost ? 0.024 : 0.004, now, 0.05);

          const filterCutoff = wantsBoost
            ? 1950
            : 380 + rpmNorm * 1250 + (wantsThrottle ? 320 : 0);
          audio.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.045);

          const engineVol = wantsThrottle || wantsBoost ? 0.095 : 0.05;
          audio.masterEngineGain.gain.setTargetAtTime(engineVol, now, 0.045);

          audio.nitroFilter.frequency.setTargetAtTime(750 + rpmNorm * 650, now, 0.05);
          audio.nitroGain.gain.setTargetAtTime(wantsBoost ? 0.13 : 0, now, 0.045);
          audio.screechGain.gain.setTargetAtTime(isTurningHard ? 0.036 : 0, now, 0.035);
        } else {
          audio.masterEngineGain.gain.setTargetAtTime(0, now, 0.05);
          audio.turboWhineGain.gain.setTargetAtTime(0, now, 0.05);
          audio.nitroGain.gain.setTargetAtTime(0, now, 0.05);
          audio.screechGain.gain.setTargetAtTime(0, now, 0.05);
        }
      }

      leftFlame.visible = wantsBoost;
      rightFlame.visible = wantsBoost;
      if (wantsBoost) {
        const pulse = 0.8 + Math.random() * 0.6;
        leftFlame.scale.set(1, 1, pulse);
        rightFlame.scale.set(1, 1, pulse);
      }

      if (Math.abs(speed) > 0.05) {
        const turnDir = (left ? 1 : 0) - (right ? 1 : 0);
        heading += turnDir * spec.handling * (speed > 0 ? 1 : -1);
      }
      playerCar.rotation.y = heading - Math.PI;

      playerCar.position.x += Math.sin(heading) * speed;
      playerCar.position.z += Math.cos(heading) * speed;
      if (canDrive) score += Math.floor(Math.max(0, speed));

      let closestDist = Infinity;
      let closestIdx = 0;
      for (let i = 0; i < samplePoints.length; i++) {
        const d = playerCar.position.distanceToSquared(samplePoints[i]);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      }

      const distFromCenter = Math.sqrt(closestDist);
      if (distFromCenter > roadWidth / 2 - 1.2) {
        const closestPt = samplePoints[closestIdx];
        const pullDir = new THREE.Vector3().subVectors(closestPt, playerCar.position).setY(0).normalize();
        playerCar.position.addScaledVector(pullDir, distFromCenter - (roadWidth / 2 - 1.2));
        speed *= 0.96;
      }

      const playerTrackT = closestIdx / samplePoints.length;
      const playerTotalProgress = (currentLap - 1) + playerTrackT;

      if (closestIdx > 220 && closestIdx < 280) {
        passedCheckpoint = true;
      }

      // Dynamic AI Bots: Faster Pace, Rubber-Banding & Smooth Lane Changing
      const botDots = [];
      let aheadCount = 0;

      bots.forEach((bot) => {
        if (canDrive) {
          const botTotalProgress = (bot.lap - 1) + bot.t;
          const gapToPlayer = playerTotalProgress - botTotalProgress;

          // Rubber-banding so bots stay competitive and speed up when behind
          let targetSpeedT = bot.baseSpeedT;
          if (gapToPlayer > 0.03) {
            targetSpeedT = bot.baseSpeedT * 1.26;
          } else if (gapToPlayer < -0.12) {
            targetSpeedT = bot.baseSpeedT * 0.92;
          }
          bot.currentSpeedT = THREE.MathUtils.lerp(bot.currentSpeedT, targetSpeedT, 0.04);

          const prevT = bot.t;
          bot.t += bot.currentSpeedT;
          if (bot.t >= 1) {
            bot.t -= 1;
            if (prevT > 0.8) bot.lap += 1;
          }

          // Periodic lane switching + evasive swerve when player approaches closely
          bot.laneTimer -= 1;
          const distToPlayer = playerCar.position.distanceTo(bot.mesh.position);
          if (distToPlayer < 24 && Math.abs(gapToPlayer) < 0.025 && bot.laneTimer < 90) {
            const alternatives = LANE_SLOTS.filter((l) => Math.abs(l - bot.targetOffset) > 4);
            bot.targetOffset = alternatives[Math.floor(Math.random() * alternatives.length)];
            bot.laneTimer = 140 + Math.floor(Math.random() * 100);
          } else if (bot.laneTimer <= 0) {
            bot.targetOffset = LANE_SLOTS[Math.floor(Math.random() * LANE_SLOTS.length)];
            bot.laneTimer = 150 + Math.floor(Math.random() * 150);
          }

          const prevOffset = bot.offset;
          bot.offset = THREE.MathUtils.lerp(bot.offset, bot.targetOffset, 0.035);
          const lateralDelta = bot.offset - prevOffset;

          const pt = trackCurve.getPointAt(bot.t);
          const tan = trackCurve.getTangentAt(bot.t).normalize();
          const norm = new THREE.Vector3(-tan.z, 0, tan.x);

          bot.mesh.position.copy(pt).addScaledVector(norm, bot.offset);
          // Tilt heading slightly during lane changes for natural steering look
          const lookPoint = bot.mesh.position
            .clone()
            .sub(tan)
            .addScaledVector(norm, -lateralDelta * 1.8);
          bot.mesh.lookAt(lookPoint);

          if (distToPlayer < 3.4) {
            if (wantsBoost) {
              bot.t = Math.max(0, bot.t - 0.02);
              bot.currentSpeedT = bot.baseSpeedT * 0.45;
              nitro = Math.min(100, nitro + 30);
              score += 500;
              setCoins((c) => c + 50);
              playTakedownCrunch();
            } else {
              speed *= 0.68;
              playTakedownCrunch();
            }
          }
        } else {
          const pt = trackCurve.getPointAt(bot.t);
          const tan = trackCurve.getTangentAt(bot.t).normalize();
          const norm = new THREE.Vector3(-tan.z, 0, tan.x);
          bot.mesh.position.copy(pt).addScaledVector(norm, bot.offset);
          bot.mesh.lookAt(bot.mesh.position.clone().sub(tan));
        }

        const botProgressNow = (bot.lap - 1) + bot.t;
        if (botProgressNow > playerTotalProgress) {
          aheadCount += 1;
        }

        const dot = minimapData.project(bot.mesh.position.x, bot.mesh.position.z);
        botDots.push({ x: dot.x, y: dot.y, color: bot.color });
      });

      const currentPosition = aheadCount + 1;

      if (passedCheckpoint && (closestIdx < 20 || closestIdx > 480)) {
        passedCheckpoint = false;
        if (currentLap < TOTAL_LAPS) {
          currentLap += 1;
          score += 1500;
          playPerfectNitroSurge();
        } else if (gameStateRef.current === 'racing') {
          const positionBonus = currentPosition === 1 ? 600 : currentPosition === 2 ? 350 : currentPosition === 3 ? 200 : 100;
          const earned = positionBonus + Math.floor(score / 12);
          setRaceReward(earned);
          setCoins((c) => c + earned);
          setGameState('finished');
          playExhaustPopAndTurbo();
        }
      }

      ramps.forEach((ramp) => {
        if (playerCar.position.distanceTo(ramp.position) < 5.0 && playerCar.position.y < 0.65 && speed > 1.2) {
          velocityY = 0.46;
          isRolling = true;
          barrelRollAngle = 0;
          nitro = Math.min(100, nitro + 25);
          score += 250;
          playExhaustPopAndTurbo();
        }
      });

      if (playerCar.position.y > 0 || velocityY > 0) {
        playerCar.position.y += velocityY;
        velocityY -= 0.018;
        if (isRolling) {
          barrelRollAngle += 0.18;
          playerCar.rotation.z = barrelRollAngle;
          if (barrelRollAngle >= Math.PI * 2) {
            isRolling = false;
            playerCar.rotation.z = 0;
          }
        }
        if (playerCar.position.y <= 0) {
          playerCar.position.y = 0;
          velocityY = 0;
          isRolling = false;
          playerCar.rotation.z = 0;
          playTakedownCrunch();
        }
      }

      pickups.forEach((p) => {
        p.rotation.y += 0.06;
        if (p.visible && playerCar.position.distanceTo(p.position) < 3.8) {
          p.visible = false;
          nitro = Math.min(100, nitro + 35);
          score += 150;
          setCoins((c) => c + 25);
          playPickupChime();
          setTimeout(() => (p.visible = true), 7000);
        }
      });

      const targetFov = wantsBoost ? 82 : 62 + speed * 4.5;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
      camera.updateProjectionMatrix();

      const camOffset = new THREE.Vector3(-Math.sin(heading) * 10, 4.4, -Math.cos(heading) * 10);
      camera.position.lerp(playerCar.position.clone().add(camOffset), 0.14);

      const lookTarget = playerCar.position.clone().add(
        new THREE.Vector3(Math.sin(heading) * 12, 1.3, Math.cos(heading) * 12)
      );
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);

      setHud({
        speed: kmh,
        rpm,
        gear,
        nitro: Math.round(nitro),
        isBoosting: wantsBoost,
        score,
        lap: currentLap,
        position: currentPosition,
        airborne: playerCar.position.y > 0.2,
        minimapPath: minimapData.svgPath,
        playerDot: minimapData.project(playerCar.position.x, playerCar.position.z),
        botDots,
      });
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      sceneObjectsRef.current = null;
      if (audioRef.current) {
        audioRef.current.ctx.close();
        audioRef.current = null;
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedTrackId, raceSessionId]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* GARAGE & TRACK SELECTOR OVERLAY */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/75 flex flex-col justify-between p-5 md:p-7 pointer-events-none">
          <div className="flex flex-wrap justify-between items-start gap-4 pointer-events-auto">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold tracking-widest uppercase mb-1.5">
                3 Long-Distance Circuits • Competitive AI Racers
              </div>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-500">
                NITRO HORIZON 3D
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-400/50 px-4 py-2 rounded-xl shadow-lg">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                  $
                </span>
                <span className="text-lg font-black font-mono text-amber-300">
                  {coins.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Coins</span>
              </div>

              <button
                onClick={() => setFlipCarModel(!flipCarModel)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs font-bold hover:border-cyan-400 transition cursor-pointer"
                title="Flip 3D model direction if facing backwards"
              >
                🔄 FLIP 180°
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs font-bold hover:border-cyan-400 transition cursor-pointer"
              >
                {soundEnabled ? '🔊 ENGINE SFX' : '🔇 MUTED'}
              </button>
            </div>
          </div>

          <div className="self-center text-center mt-auto mb-2.5">
            <div className="inline-flex items-center gap-2 bg-slate-950/85 border border-slate-700/80 backdrop-blur-md px-4 py-1.5 rounded-full">
              <span className="text-sm font-black tracking-wide text-white">
                {previewCar.name}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  modelStatus.startsWith('MISSING')
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-slate-800 text-cyan-300'
                }`}
              >
                {modelStatus}
              </span>
            </div>
          </div>

          <div className="w-full max-w-5xl mx-auto bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl pointer-events-auto">
            <div className="mb-3.5 pb-3 border-b border-slate-800">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                1. Select Circuit Location
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {TRACKS.map((track) => {
                  const active = selectedTrackId === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => {
                        setSelectedTrackId(track.id);
                        playMechanicalClick(240);
                      }}
                      className={`px-3.5 py-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        active
                          ? 'bg-slate-800 border-cyan-400 shadow-md shadow-cyan-500/15'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: track.accentHex }}
                          />
                          {track.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{track.subtitle}</div>
                      </div>
                      {active && (
                        <span className="text-[10px] font-black text-cyan-400 uppercase">
                          SELECTED
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                2. Select Supercar ({unlockedCars.length}/{CARS.length} Unlocked)
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:block">
                Collect gold crystals & takedowns on track to earn coins
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3.5">
              {CARS.map((car) => {
                const owned = unlockedCars.includes(car.id);
                const isEquipped = equippedCarId === car.id;
                const isPreviewing = previewCarId === car.id;
                const canAfford = coins >= car.price;

                return (
                  <div
                    key={car.id}
                    onClick={() => handleSelectOrBuyCar(car)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isPreviewing
                        ? 'bg-slate-800 border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-white truncate">{car.name}</span>
                        {isEquipped && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                            READY
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 my-2 text-[10px] text-slate-400">
                        <div>
                          <div className="flex justify-between">
                            <span>TOP SPEED</span>
                            <span>{Math.round(car.topSpeed * 115)} KM/H</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-0.5">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${(car.topSpeed / 3.35) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <span>NITRO</span>
                            <span>{Math.round(car.nitroPower * 115)} KM/H</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-0.5">
                            <div
                              className="h-full bg-fuchsia-400 rounded-full"
                              style={{ width: `${(car.nitroPower / 4.95) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-center">
                      {isEquipped ? (
                        <span className="text-xs font-black text-cyan-400">EQUIPPED</span>
                      ) : owned ? (
                        <span className="text-xs font-bold text-slate-300">CLICK TO EQUIP</span>
                      ) : (
                        <button
                          onClick={(e) => handleUnlockCar(e, car)}
                          disabled={!canAfford}
                          className={`w-full py-1 rounded-lg text-xs font-black transition ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          UNLOCK • {car.price} COINS
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                <span className="text-white font-bold">WASD / Arrows</span> Drive •{' '}
                <span className="text-cyan-400 font-bold">SPACE</span> Nitro •{' '}
                <span className="text-slate-300 font-bold">ESC</span> Pause •{' '}
                <span className="text-cyan-400 font-bold">{activeTrack.name}</span>
              </div>
              <button
                onClick={startRace}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:brightness-110 text-slate-950 font-black tracking-wider text-sm shadow-lg shadow-cyan-500/30 transition cursor-pointer"
              >
                START RACE →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-2-1-GO! COUNTDOWN */}
      {countdownText && gameState !== 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)] animate-pulse">
            {countdownText}
          </div>
        </div>
      )}

      {/* ACTIVE RACING HUD */}
      {gameState !== 'menu' && (
        <>
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
            {/* Top-Left: Position (1st/2nd/3rd/4th), Lap, Score, Coins */}
            <div className="flex items-center gap-4 bg-slate-900/85 border border-cyan-500/40 backdrop-blur-md px-5 py-2.5 rounded-xl">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Pos</div>
                <div
                  className={`text-2xl font-black font-mono ${
                    hud.position === 1
                      ? 'text-amber-400'
                      : hud.position === 2
                      ? 'text-slate-200'
                      : hud.position === 3
                      ? 'text-amber-600'
                      : 'text-slate-400'
                  }`}
                >
                  {formatOrdinal(hud.position)}
                  <span className="text-xs text-slate-500 font-bold"> / 4</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Lap</div>
                <div className="text-2xl font-black text-cyan-400 font-mono">
                  {hud.lap} / {TOTAL_LAPS}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Score</div>
                <div className="text-2xl font-black text-white font-mono">
                  {hud.score.toLocaleString()}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700 hidden sm:block" />
              <div className="hidden sm:block">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Coins</div>
                <div className="text-xl font-black text-amber-400 font-mono">
                  {coins.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Top-Right: Pause/Exit Controls + Dynamic SVG Minimap */}
            <div className="flex items-start gap-2.5">
              <div className="flex flex-col gap-2 pointer-events-auto">
                <button
                  onClick={() =>
                    setGameState((prev) => (prev === 'paused' ? 'racing' : 'paused'))
                  }
                  disabled={gameState === 'countdown' || gameState === 'finished'}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-white text-xs font-black tracking-wider transition cursor-pointer disabled:opacity-40"
                >
                  {gameState === 'paused' ? '▶ RESUME' : '⏸ PAUSE'}
                </button>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  {soundEnabled ? '🔊 SFX ON' : '🔇 MUTED'}
                </button>
                <button
                  onClick={exitToGarage}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-red-500/40 hover:border-red-400 text-red-300 text-xs font-black tracking-wider transition cursor-pointer"
                >
                  ✕ EXIT
                </button>
              </div>

              <div className="bg-slate-900/85 border border-slate-700 backdrop-blur-md p-2.5 rounded-2xl shadow-xl">
                <svg viewBox="0 0 140 140" className="w-32 h-32">
                  <path
                    d={hud.minimapPath}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="7"
                    strokeLinejoin="round"
                  />
                  <path
                    d={hud.minimapPath}
                    fill="none"
                    stroke={activeTrack.accentHex}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {hud.botDots.map((b, idx) => (
                    <circle key={idx} cx={b.x} cy={b.y} r="3.5" fill={b.color} />
                  ))}
                  <circle
                    cx={hud.playerDot.x}
                    cy={hud.playerDot.y}
                    r="4.8"
                    fill="#ffffff"
                    stroke={activeTrack.accentHex}
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {hud.airborne && gameState === 'racing' && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-amber-500/95 text-slate-950 font-black px-5 py-1.5 rounded-full text-sm tracking-widest animate-bounce">
              BARREL ROLL +250!
            </div>
          )}

          <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4 pointer-events-none">
            <div className="w-72 bg-slate-900/85 border border-slate-700 backdrop-blur-md p-4 rounded-2xl">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className={hud.isBoosting ? 'text-cyan-400 animate-pulse' : 'text-slate-300'}>
                  {hud.isBoosting ? 'NITRO OVERDRIVE!' : 'NITRO BOOST [SPACE]'}
                </span>
                <span className="text-cyan-400 font-mono">{hud.nitro}%</span>
              </div>
              <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    hud.isBoosting
                      ? 'bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${hud.nitro}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AnalogDial value={hud.rpm} max={9500} label="RPM" accentColor="#ec4899" />
              <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Gear</div>
                <div className="text-2xl font-black font-mono text-amber-400">{hud.gear}</div>
              </div>
              <AnalogDial value={hud.speed} max={500} label="KM/H" accentColor={activeTrack.accentHex} />
            </div>
          </div>
        </>
      )}

      {/* PAUSE MODAL OVERLAY */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center z-20">
          <div className="bg-slate-900 border border-cyan-500/40 p-7 rounded-2xl text-center w-full max-w-sm shadow-2xl">
            <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-1">
              {activeTrack.name}
            </div>
            <h2 className="text-3xl font-black italic text-white mb-6">RACE PAUSED</h2>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setGameState('racing')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950 font-black tracking-wider text-sm hover:brightness-110 transition cursor-pointer"
              >
                ▶ RESUME RACE
              </button>
              <button
                onClick={startRace}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold tracking-wider text-sm transition cursor-pointer"
              >
                ↻ RESTART CIRCUIT
              </button>
              <button
                onClick={exitToGarage}
                className="w-full py-3 rounded-xl bg-slate-950 hover:bg-red-950/50 border border-red-500/40 text-red-300 font-bold tracking-wider text-sm transition cursor-pointer"
              >
                ✕ EXIT TO GARAGE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINISH OVERLAY */}
      {gameState === 'finished' && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-slate-900 border border-cyan-500/50 p-8 rounded-2xl text-center max-w-sm">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-widest mb-2">
              Finished {formatOrdinal(hud.position)} Place
            </div>
            <h2 className="text-3xl font-black text-cyan-400 mb-2">CIRCUIT COMPLETE!</h2>
            <p className="text-slate-300 mb-2">
              Stunt Score:{' '}
              <span className="font-mono font-bold text-white">{hud.score.toLocaleString()}</span>
            </p>
            <p className="text-amber-400 font-black text-lg mb-5">
              +{raceReward.toLocaleString()} COINS EARNED!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={startRace}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition cursor-pointer"
              >
                RACE AGAIN
              </button>
              <button
                onClick={exitToGarage}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition cursor-pointer"
              >
                GARAGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}