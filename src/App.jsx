import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const CARS = [
  {
    id: 'street',
    name: 'Apex Street Coupe',
    modelPaths: ['/models/starter.glb', '/models/starter/scene.gltf'],
    price: 0,
    topSpeed: 2.1,
    accel: 0.032,
    handling: 0.034,
    nitroPower: 3.3,
  },
  {
    id: 'muscle',
    name: 'V8 Phantom Muscle',
    modelPaths: ['/models/muscle.glb', '/models/muscle/scene.gltf'],
    price: 500,
    topSpeed: 2.35,
    accel: 0.038,
    handling: 0.032,
    nitroPower: 3.6,
  },
  {
    id: 'supercar',
    name: 'Valkyrie GT Supercar',
    modelPaths: ['/models/sportscar.glb', '/models/sportscar/scene.gltf'],
    price: 1200,
    topSpeed: 2.6,
    accel: 0.042,
    handling: 0.038,
    nitroPower: 3.9,
  },
  {
    id: 'hypercar',
    name: 'Zenith F1 Hypercar',
    modelPaths: ['/models/hypercar.glb', '/models/hypercar/scene.gltf'],
    price: 2500,
    topSpeed: 2.9,
    accel: 0.048,
    handling: 0.042,
    nitroPower: 4.3,
  },
];

const TOTAL_LAPS = 3;

const TRACK_POINTS = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -260),
  new THREE.Vector3(140, 0, -440),
  new THREE.Vector3(360, 0, -420),
  new THREE.Vector3(460, 0, -220),
  new THREE.Vector3(320, 0, -40),
  new THREE.Vector3(440, 0, 160),
  new THREE.Vector3(300, 0, 340),
  new THREE.Vector3(80, 0, 300),
  new THREE.Vector3(0, 0, 150),
];

function toMinimapCoords(x, z) {
  const nx = ((x + 60) / 580) * 120 + 10;
  const ny = ((z + 490) / 890) * 120 + 10;
  return { x: nx, y: ny };
}

const MINIMAP_PATH = (() => {
  const curve = new THREE.CatmullRomCurve3(TRACK_POINTS, true);
  return (
    curve
      .getPoints(100)
      .map((p, idx) => {
        const { x, y } = toMinimapCoords(p.x, p.z);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
})();

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

// Lightweight AI opponent car mesh
function buildBotCarMesh(colorHex) {
  const group = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    metalness: 0.65,
    roughness: 0.22,
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

export default function App() {
  const mountRef = useRef(null);

  const [coins, setCoins] = useState(() => Number(localStorage.getItem('nh_coins') ?? 650));
  const [unlockedCars, setUnlockedCars] = useState(() =>
    JSON.parse(localStorage.getItem('nh_cars') ?? '["street"]')
  );

  const [equippedCarId, setEquippedCarId] = useState('street');
  const [previewCarId, setPreviewCarId] = useState('street');
  const [flipCarModel, setFlipCarModel] = useState(false);
  const [modelStatus, setModelStatus] = useState('LOADING 3D MODEL...');
  const [gameState, setGameState] = useState('menu');
  const [countdownText, setCountdownText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [raceReward, setRaceReward] = useState(0);

  const [hud, setHud] = useState({
    speed: 0,
    rpm: 1000,
    gear: 1,
    nitro: 100,
    isBoosting: false,
    score: 0,
    lap: 1,
    airborne: false,
    playerDot: toMinimapCoords(0, 0),
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
        console.error(
          `[Nitro Horizon] Could not find 3D model for "${carSpec.name}". Checked:`,
          carSpec.modelPaths
        );
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

          // Auto-scale any realistic .glb / .gltf car to ~4.8 units long
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = 4.8 / (maxDim || 1);
          model.scale.setScalar(scaleFactor);

          // Center horizontally and rest tires cleanly on y = 0
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

  // Web Audio Synth
  const audioRef = useRef(null);
  const initAudio = () => {
    if (audioRef.current) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = 55;
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    gain.gain.value = 0;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    audioRef.current = { ctx, osc, gain, filter };
  };

  const playBeep = (freq, duration = 0.15) => {
    if (!soundEnabledRef.current) return;
    initAudio();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    const beepOsc = audio.ctx.createOscillator();
    const beepGain = audio.ctx.createGain();
    beepOsc.type = 'triangle';
    beepOsc.frequency.value = freq;
    beepGain.gain.setValueAtTime(0.14, audio.ctx.currentTime);
    beepGain.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + duration);
    beepOsc.connect(beepGain);
    beepGain.connect(audio.ctx.destination);
    beepOsc.start();
    beepOsc.stop(audio.ctx.currentTime + duration);
  };

  const handleSelectOrBuyCar = (car) => {
    setPreviewCarId(car.id);
    if (unlockedCars.includes(car.id)) {
      setEquippedCarId(car.id);
      playBeep(620, 0.1);
    } else {
      playBeep(480, 0.08);
    }
  };

  const handleUnlockCar = (e, car) => {
    e.stopPropagation();
    if (coins >= car.price && !unlockedCars.includes(car.id)) {
      setCoins((c) => c - car.price);
      setUnlockedCars((prev) => [...prev, car.id]);
      setEquippedCarId(car.id);
      setPreviewCarId(car.id);
      playBeep(880, 0.25);
    }
  };

  const startRace = () => {
    setPreviewCarId(equippedCarId);
    initAudio();
    if (audioRef.current?.ctx.state === 'suspended') audioRef.current.ctx.resume();
    setGameState('countdown');
    setCountdownText('3');
    playBeep(440, 0.18);

    setTimeout(() => {
      setCountdownText('2');
      playBeep(440, 0.18);
    }, 850);

    setTimeout(() => {
      setCountdownText('1');
      playBeep(440, 0.18);
    }, 1700);

    setTimeout(() => {
      setCountdownText('GO!');
      playBeep(880, 0.35);
      setGameState('racing');
    }, 2550);

    setTimeout(() => setCountdownText(''), 3300);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.0022);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1200
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.2));

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(40, 90, 50);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(-50, 40, -60);
    scene.add(rimLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(2400, 2400),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // Track Ribbon
    const trackCurve = new THREE.CatmullRomCurve3(TRACK_POINTS, true);
    const roadWidth = 26;
    const segments = 400;

    function buildTrackRibbon(width, yOffset, colorHex) {
      const positions = [];
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

        if (i < segments) {
          const base = i * 2;
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.75,
          side: THREE.DoubleSide,
        })
      );
    }

    scene.add(buildTrackRibbon(roadWidth + 2.4, 0.01, 0x06b6d4));
    scene.add(buildTrackRibbon(roadWidth, 0.03, 0x111827));

    const padRing = new THREE.Mesh(
      new THREE.RingGeometry(3.2, 3.6, 48),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide })
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
      new THREE.PlaneGeometry(roadWidth, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    finishStrip.rotation.x = -Math.PI / 2;
    finishStrip.position.y = 0.06;
    archGroup.add(finishStrip);
    const archBanner = new THREE.Mesh(
      new THREE.BoxGeometry(roadWidth + 2, 2.2, 1),
      new THREE.MeshBasicMaterial({ color: 0xec4899 })
    );
    archBanner.position.y = 8;
    archGroup.add(archBanner);
    scene.add(archGroup);

    // Player Car & Dedicated Model Holder
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

    // Load initial car immediately
    swapCarModelInScene(previewCarRef.current);

    // Ramps & Coin/Nitro Pickups
    const ramps = [];
    const pickups = [];
    const rampGeo = new THREE.BoxGeometry(5.5, 0.4, 9);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 });
    const pickupGeo = new THREE.OctahedronGeometry(0.9);
    const pickupMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    for (let i = 1; i < 10; i++) {
      const t = i / 10;
      const pt = trackCurve.getPointAt(t);
      const tan = trackCurve.getTangentAt(t).normalize();
      const norm = new THREE.Vector3(-tan.z, 0, tan.x);

      const ramp = new THREE.Mesh(rampGeo, rampMat);
      ramp.position.copy(pt).addScaledVector(norm, (i % 2 === 0 ? 1 : -1) * 5);
      ramp.position.y = 0.65;
      ramp.lookAt(ramp.position.clone().add(tan));
      ramp.rotateX(-0.22);
      scene.add(ramp);
      ramps.push(ramp);

      const pickupT = (t + 0.04) % 1;
      const pPt = trackCurve.getPointAt(pickupT);
      const pickup = new THREE.Mesh(pickupGeo, pickupMat);
      pickup.position.copy(pPt).add(new THREE.Vector3(0, 1.3, 0));
      scene.add(pickup);
      pickups.push(pickup);
    }

    // AI Opponents staggered cleanly away from player start (0, 0, 0) & hidden in Garage
    const bots = [
      { mesh: buildBotCarMesh('#10b981'), color: '#10b981', t: 0.015, speedT: 0.00058, offset: -6 },
      { mesh: buildBotCarMesh('#f97316'), color: '#f97316', t: 0.025, speedT: 0.00064, offset: 6 },
      { mesh: buildBotCarMesh('#3b82f6'), color: '#3b82f6', t: 0.035, speedT: 0.00055, offset: -6 },
    ];
    bots.forEach((b) => {
      b.mesh.visible = false;
      scene.add(b.mesh);
    });

    // Controls
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
    let menuOrbitAngle = 0.6;

    const samplePoints = trackCurve.getPoints(200);

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
          audioRef.current.gain.gain.setTargetAtTime(0, audioRef.current.ctx.currentTime, 0.05);
        }
        renderer.render(scene, camera);
        return;
      }

      padRing.visible = false;
      bots.forEach((b) => (b.mesh.visible = true));

      const spec = previewCarRef.current;
      const canDrive = mode === 'racing';
      const forward = canDrive && (keys['KeyW'] || keys['ArrowUp']);
      const brake = canDrive && (keys['KeyS'] || keys['ArrowDown']);
      const left = canDrive && (keys['KeyA'] || keys['ArrowLeft']);
      const right = canDrive && (keys['KeyD'] || keys['ArrowRight']);
      const wantsBoost = canDrive && keys['Space'] && nitro > 2 && forward;

      const maxSpeed = wantsBoost ? spec.nitroPower : spec.topSpeed;
      if (forward) {
        speed = THREE.MathUtils.lerp(speed, maxSpeed, wantsBoost ? spec.accel * 1.8 : spec.accel);
      } else if (brake) {
        speed = THREE.MathUtils.lerp(speed, -0.7, 0.05);
      } else {
        speed = THREE.MathUtils.lerp(speed, 0, 0.025);
      }

      if (wantsBoost) {
        nitro = Math.max(0, nitro - 0.55);
        score += 2;
      } else {
        nitro = Math.min(100, nitro + 0.14);
      }

      if (audioRef.current) {
        const audio = audioRef.current;
        if (soundEnabledRef.current && mode === 'racing') {
          const baseFreq = 52 + Math.abs(speed) * 48 + (wantsBoost ? 35 : 0);
          audio.osc.frequency.setTargetAtTime(baseFreq, audio.ctx.currentTime, 0.06);
          audio.filter.frequency.setTargetAtTime(wantsBoost ? 900 : 320, audio.ctx.currentTime, 0.08);
          audio.gain.gain.setTargetAtTime(0.055, audio.ctx.currentTime, 0.08);
        } else {
          audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.05);
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

      if (closestIdx > 85 && closestIdx < 115) {
        passedCheckpoint = true;
      }
      if (passedCheckpoint && (closestIdx < 12 || closestIdx > 188)) {
        passedCheckpoint = false;
        if (currentLap < TOTAL_LAPS) {
          currentLap += 1;
          score += 1000;
          playBeep(660, 0.25);
        } else if (gameStateRef.current === 'racing') {
          const earned = 350 + Math.floor(score / 15);
          setRaceReward(earned);
          setCoins((c) => c + earned);
          setGameState('finished');
          playBeep(980, 0.45);
        }
      }

      ramps.forEach((ramp) => {
        if (playerCar.position.distanceTo(ramp.position) < 4.5 && playerCar.position.y < 0.6 && speed > 1.2) {
          velocityY = 0.44;
          isRolling = true;
          barrelRollAngle = 0;
          nitro = Math.min(100, nitro + 25);
          score += 250;
          playBeep(580, 0.2);
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
        }
      }

      pickups.forEach((p) => {
        p.rotation.y += 0.06;
        if (p.visible && playerCar.position.distanceTo(p.position) < 3.5) {
          p.visible = false;
          nitro = Math.min(100, nitro + 35);
          score += 150;
          setCoins((c) => c + 25);
          playBeep(740, 0.14);
          setTimeout(() => (p.visible = true), 6000);
        }
      });

      const botDots = [];
      bots.forEach((bot) => {
        if (canDrive) bot.t = (bot.t + bot.speedT) % 1;
        const pt = trackCurve.getPointAt(bot.t);
        const tan = trackCurve.getTangentAt(bot.t).normalize();
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);

        bot.mesh.position.copy(pt).addScaledVector(norm, bot.offset);
        bot.mesh.lookAt(bot.mesh.position.clone().sub(tan));

        if (canDrive && playerCar.position.distanceTo(bot.mesh.position) < 3.2) {
          if (wantsBoost) {
            bot.t = (bot.t + 0.06) % 1;
            nitro = Math.min(100, nitro + 30);
            score += 500;
            setCoins((c) => c + 50);
            playBeep(300, 0.25);
          } else {
            speed *= 0.65;
          }
        }

        const dot = toMinimapCoords(bot.mesh.position.x, bot.mesh.position.z);
        botDots.push({ x: dot.x, y: dot.y, color: bot.color });
      });

      const targetFov = wantsBoost ? 80 : 60 + speed * 5;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
      camera.updateProjectionMatrix();

      const camOffset = new THREE.Vector3(-Math.sin(heading) * 10, 4.4, -Math.cos(heading) * 10);
      camera.position.lerp(playerCar.position.clone().add(camOffset), 0.14);

      const lookTarget = playerCar.position.clone().add(
        new THREE.Vector3(Math.sin(heading) * 12, 1.3, Math.cos(heading) * 12)
      );
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);

      const kmh = Math.max(0, Math.round(speed * 115));
      const gear = Math.min(6, Math.max(1, Math.floor(kmh / 65) + 1));
      const rpm = Math.min(9500, Math.round(1200 + ((kmh % 65) / 65) * 7500 + (wantsBoost ? 800 : 0)));

      setHud({
        speed: kmh,
        rpm,
        gear,
        nitro: Math.round(nitro),
        isBoosting: wantsBoost,
        score,
        lap: currentLap,
        airborne: playerCar.position.y > 0.2,
        playerDot: toMinimapCoords(playerCar.position.x, playerCar.position.z),
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
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* GARAGE & SHOWROOM OVERLAY */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/70 flex flex-col justify-between p-6 md:p-8 pointer-events-none">
          <div className="flex flex-wrap justify-between items-start gap-4 pointer-events-auto">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold tracking-widest uppercase mb-1.5">
                Earn Coins In-Game • Zero Real-Money Purchases
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
                {soundEnabled ? '🔊 ON' : '🔇 OFF'}
              </button>
            </div>
          </div>

          <div className="self-center text-center mt-auto mb-3">
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

          <div className="w-full max-w-4xl mx-auto bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                Garage — Click Any Car to Preview ({unlockedCars.length}/{CARS.length} Unlocked)
              </span>
              <span className="text-xs text-slate-400 hidden sm:block">
                Collect gold crystals & takedowns on track to earn coins
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
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
                              style={{ width: `${(car.topSpeed / 3) * 100}%` }}
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
                              style={{ width: `${(car.nitroPower / 4.5) * 100}%` }}
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
                <span className="text-cyan-400 font-bold">SPACE</span> Nitro Overdrive •{' '}
                <span className="text-slate-300">Racing with:</span>{' '}
                <span className="text-cyan-400 font-bold">{equippedCar.name}</span>
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
      {countdownText && (
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
            <div className="flex items-center gap-4 bg-slate-900/85 border border-cyan-500/40 backdrop-blur-md px-5 py-2.5 rounded-xl">
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
              <div className="h-8 w-px bg-slate-700" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Coins</div>
                <div className="text-xl font-black text-amber-400 font-mono">
                  {coins.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/85 border border-slate-700 backdrop-blur-md p-2.5 rounded-2xl shadow-xl">
              <svg viewBox="0 0 140 140" className="w-32 h-32">
                <path
                  d={MINIMAP_PATH}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="7"
                  strokeLinejoin="round"
                />
                <path
                  d={MINIMAP_PATH}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
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
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />
              </svg>
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
              <AnalogDial value={hud.speed} max={450} label="KM/H" accentColor="#06b6d4" />
            </div>
          </div>
        </>
      )}

      {/* FINISH OVERLAY */}
      {gameState === 'finished' && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-cyan-500/50 p-8 rounded-2xl text-center max-w-sm">
            <h2 className="text-3xl font-black text-cyan-400 mb-2">CIRCUIT COMPLETE!</h2>
            <p className="text-slate-300 mb-2">
              Stunt Score:{' '}
              <span className="font-mono font-bold text-white">{hud.score.toLocaleString()}</span>
            </p>
            <p className="text-amber-400 font-black text-lg mb-5">
              +{raceReward.toLocaleString()} COINS EARNED!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition cursor-pointer"
            >
              RETURN TO GARAGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}