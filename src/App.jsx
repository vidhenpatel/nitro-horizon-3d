import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const CAR_SKINS = [
  { id: 'crimson', name: 'Crimson GT', color: 0xef4444, accent: 0xfca5a5 },
  { id: 'cyber', name: 'Cyber Cyan', color: 0x06b6d4, accent: 0x67e8f9 },
  { id: 'volt', name: 'Volt Yellow', color: 0xeab308, accent: 0xfef08a },
  { id: 'phantom', name: 'Phantom Purple', color: 0xa855f7, accent: 0xd8b4fe },
];

const TOTAL_LAPS = 3;

export default function App() {
  const mountRef = useRef(null);
  const [selectedSkin, setSelectedSkin] = useState(CAR_SKINS[0]);
  const [hud, setHud] = useState({
    speed: 0,
    nitro: 100,
    isBoosting: false,
    score: 0,
    lap: 1,
    finished: false,
    airborne: false,
  });

  const skinRef = useRef(selectedSkin);
  useEffect(() => {
    skinRef.current = selectedSkin;
  }, [selectedSkin]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.0022);

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      1200
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(80, 140, 60);
    scene.add(dirLight);

    // Ground Terrain
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(2400, 2400),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // 3. Closed-Loop Curved Racing Circuit (CatmullRomCurve3)
    const trackPoints = [
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
    const trackCurve = new THREE.CatmullRomCurve3(trackPoints, true);
    const roadWidth = 26;
    const segments = 400;

    // Build Ribbon Mesh for Asphalt + Neon Curbs
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

    scene.add(buildTrackRibbon(roadWidth + 2.4, 0.01, 0x06b6d4)); // Neon border
    scene.add(buildTrackRibbon(roadWidth, 0.03, 0x111827)); // Asphalt road

    // Start / Finish Line Arch at t = 0
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

    // 4. Aerodynamic Fallback Supercar Builder
    function createFallbackCar(bodyColor, accentColor) {
      const car = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        metalness: 0.65,
        roughness: 0.2,
      });

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 4.6), bodyMat);
      chassis.position.y = 0.6;
      chassis.name = 'paintable';
      car.add(chassis);

      const hood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 1.6), bodyMat);
      hood.position.set(0, 0.55, -1.7);
      hood.rotation.x = 0.14;
      hood.name = 'paintable_hood';
      car.add(hood);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 0.58, 2.1),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
      );
      cabin.position.set(0, 1.15, -0.1);
      car.add(cabin);

      const spoiler = new THREE.Mesh(
        new THREE.BoxGeometry(2.25, 0.15, 0.5),
        new THREE.MeshBasicMaterial({ color: accentColor })
      );
      spoiler.position.set(0, 1.25, 2.05);
      spoiler.name = 'spoiler';
      car.add(spoiler);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 16);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      [
        [-1.1, 0.42, -1.4],
        [1.1, 0.42, -1.4],
        [-1.1, 0.42, 1.4],
        [1.1, 0.42, 1.4],
      ].forEach(([wx, wy, wz]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.position.set(wx, wy, wz);
        car.add(w);
      });

      return car;
    }

    // Attach Nitro Flames Helper
    function attachNitroFlames(targetGroup) {
      const flameGeo = new THREE.ConeGeometry(0.3, 1.8, 8);
      flameGeo.rotateX(Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

      const leftFlame = new THREE.Mesh(flameGeo, flameMat);
      leftFlame.position.set(-0.55, 0.5, 2.9);
      leftFlame.visible = false;
      leftFlame.name = 'leftFlame';

      const rightFlame = leftFlame.clone();
      rightFlame.position.x = 0.55;
      rightFlame.name = 'rightFlame';

      targetGroup.add(leftFlame, rightFlame);
    }

    // 5. Player Car (Tries loading /models/sportscar.glb first, falls back cleanly)
    const playerCar = new THREE.Group();
    const fallbackMesh = createFallbackCar(skinRef.current.color, skinRef.current.accent);
    playerCar.add(fallbackMesh);
    attachNitroFlames(playerCar);
    scene.add(playerCar);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/sportscar.glb',
      (gltf) => {
        playerCar.remove(fallbackMesh);
        const model = gltf.scene;
        model.scale.set(1.6, 1.6, 1.6);
        // Rotate 180 deg if model faces +Z instead of -Z
        model.rotation.y = Math.PI;
        model.name = 'glbModel';
        playerCar.add(model);
      },
      undefined,
      () => {
        // Silently keep fallback supercar if .glb is not yet placed in public/models/
      }
    );

    // 6. Ramps & Nitro Bottles placed along the Curved Circuit
    const ramps = [];
    const pickups = [];
    const rampGeo = new THREE.BoxGeometry(5.5, 0.4, 9);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 });
    const pickupGeo = new THREE.OctahedronGeometry(0.9);
    const pickupMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

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

    // 7. AI Opponents following the Track Spline
    const bots = [
      { mesh: createFallbackCar(0x10b981, 0xffffff), t: 0.02, speedT: 0.00058, offset: -5 },
      { mesh: createFallbackCar(0xf97316, 0xffffff), t: 0.035, speedT: 0.00063, offset: 5 },
      { mesh: createFallbackCar(0x3b82f6, 0xffffff), t: 0.05, speedT: 0.00054, offset: 0 },
    ];
    bots.forEach((b) => scene.add(b.mesh));

    // 8. Controls & Physics Variables
    const keys = {};
    const onKeyDown = (e) => (keys[e.code] = true);
    const onKeyUp = (e) => (keys[e.code] = false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let speed = 0;
    let heading = Math.PI; // Faces -Z initially
    let velocityY = 0;
    let nitro = 100;
    let score = 0;
    let barrelRollAngle = 0;
    let isRolling = false;
    let currentLap = 1;
    let passedCheckpoint = false;
    let raceFinished = false;
    let lastSkinId = skinRef.current.id;

    // Pre-sample curve points for fast track-boundary & lap detection
    const samplePoints = trackCurve.getPoints(200);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Update Skin Colors Live
      if (lastSkinId !== skinRef.current.id) {
        lastSkinId = skinRef.current.id;
        playerCar.traverse((child) => {
          if (child.isMesh && (child.name.startsWith('paintable') || child.name.includes('Body'))) {
            child.material.color.setHex(skinRef.current.color);
          }
          if (child.isMesh && child.name === 'spoiler') {
            child.material.color.setHex(skinRef.current.accent);
          }
        });
      }

      const forward = keys['KeyW'] || keys['ArrowUp'];
      const brake = keys['KeyS'] || keys['ArrowDown'];
      const left = keys['KeyA'] || keys['ArrowLeft'];
      const right = keys['KeyD'] || keys['ArrowRight'];
      const wantsBoost = keys['Space'] && nitro > 2 && forward && !raceFinished;

      // Speed & Nitro
      const maxSpeed = wantsBoost ? 3.5 : 2.2;
      if (forward && !raceFinished) {
        speed = THREE.MathUtils.lerp(speed, maxSpeed, wantsBoost ? 0.06 : 0.032);
      } else if (brake && !raceFinished) {
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

      // Nitro Flames
      const leftFlame = playerCar.getObjectByName('leftFlame');
      const rightFlame = playerCar.getObjectByName('rightFlame');
      if (leftFlame && rightFlame) {
        leftFlame.visible = wantsBoost;
        rightFlame.visible = wantsBoost;
        if (wantsBoost) {
          const pulse = 0.8 + Math.random() * 0.6;
          leftFlame.scale.set(1, 1, pulse);
          rightFlame.scale.set(1, 1, pulse);
        }
      }

      // Turning & Forward Velocity
      if (Math.abs(speed) > 0.05) {
        const turnDir = (left ? 1 : 0) - (right ? 1 : 0);
        heading += turnDir * 0.034 * (speed > 0 ? 1 : -1);
      }
      playerCar.rotation.y = heading - Math.PI;

      playerCar.position.x += Math.sin(heading) * speed;
      playerCar.position.z += Math.cos(heading) * speed;
      score += Math.floor(Math.max(0, speed));

      // Keep car near track & track Lap Progress
      let closestDist = Infinity;
      let closestIdx = 0;
      for (let i = 0; i < samplePoints.length; i++) {
        const d = playerCar.position.distanceToSquared(samplePoints[i]);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      }

      // Soft guardrail pushback if going off-road
      const distFromCenter = Math.sqrt(closestDist);
      if (distFromCenter > roadWidth / 2 - 1.2) {
        const closestPt = samplePoints[closestIdx];
        const pullDir = new THREE.Vector3().subVectors(closestPt, playerCar.position).setY(0).normalize();
        playerCar.position.addScaledVector(pullDir, distFromCenter - (roadWidth / 2 - 1.2));
        speed *= 0.96;
      }

      // Checkpoint at halfway (index ~100) & Lap Completion near index 0
      if (closestIdx > 85 && closestIdx < 115) {
        passedCheckpoint = true;
      }
      if (passedCheckpoint && (closestIdx < 12 || closestIdx > 188)) {
        passedCheckpoint = false;
        if (currentLap < TOTAL_LAPS) {
          currentLap += 1;
          score += 1000;
        } else {
          raceFinished = true;
        }
      }

      // Ramp Launch & Barrel Roll
      ramps.forEach((ramp) => {
        if (playerCar.position.distanceTo(ramp.position) < 4.5 && playerCar.position.y < 0.6 && speed > 1.2) {
          velocityY = 0.44;
          isRolling = true;
          barrelRollAngle = 0;
          nitro = Math.min(100, nitro + 25);
          score += 250;
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

      // Nitro Pickups
      pickups.forEach((p) => {
        p.rotation.y += 0.05;
        if (p.visible && playerCar.position.distanceTo(p.position) < 3.5) {
          p.visible = false;
          nitro = Math.min(100, nitro + 35);
          score += 150;
          setTimeout(() => (p.visible = true), 6000);
        }
      });

      // Move AI Bots along Spline
      bots.forEach((bot) => {
        bot.t = (bot.t + bot.speedT) % 1;
        const pt = trackCurve.getPointAt(bot.t);
        const tan = trackCurve.getTangentAt(bot.t).normalize();
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);

        bot.mesh.position.copy(pt).addScaledVector(norm, bot.offset);
        bot.mesh.lookAt(bot.mesh.position.clone().sub(tan));

        // Knockdown on Nitro Boost
        if (playerCar.position.distanceTo(bot.mesh.position) < 3.2) {
          if (wantsBoost) {
            bot.t = (bot.t + 0.06) % 1;
            nitro = Math.min(100, nitro + 30);
            score += 500;
          } else {
            speed *= 0.65;
          }
        }
      });

      // Chase Camera aligned to Car Heading
      const targetFov = wantsBoost ? 82 : 65 + speed * 5;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
      camera.updateProjectionMatrix();

      const camOffset = new THREE.Vector3(
        -Math.sin(heading) * 10,
        4.4,
        -Math.cos(heading) * 10
      );
      camera.position.lerp(playerCar.position.clone().add(camOffset), 0.14);

      const lookTarget = playerCar.position.clone().add(
        new THREE.Vector3(Math.sin(heading) * 12, 1.3, Math.cos(heading) * 12)
      );
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);

      setHud({
        speed: Math.max(0, Math.round(speed * 115)),
        nitro: Math.round(nitro),
        isBoosting: wantsBoost,
        score,
        lap: currentLap,
        finished: raceFinished,
        airborne: playerCar.position.y > 0.2,
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
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-4 pointer-events-none">
        <div className="flex items-center gap-4 bg-slate-900/85 border border-cyan-500/40 backdrop-blur-md px-5 py-2.5 rounded-xl">
          <div>
            <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
              NITRO HORIZON 3D
            </h1>
            <p className="text-xs text-slate-400">WASD Drive • SPACE Nitro</p>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Lap</div>
            <div className="text-xl font-black text-cyan-400 font-mono">
              {hud.lap} / {TOTAL_LAPS}
            </div>
          </div>
        </div>

        {/* Free Instant Skin Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/85 border border-slate-700 backdrop-blur-md p-2 rounded-xl pointer-events-auto">
          <span className="text-xs font-semibold text-slate-400 px-2">SKIN:</span>
          {CAR_SKINS.map((skin) => (
            <button
              key={skin.id}
              onClick={() => setSelectedSkin(skin)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedSkin.id === skin.id
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {skin.name}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/85 border border-fuchsia-500/40 backdrop-blur-md px-5 py-2.5 rounded-xl text-right">
          <div className="text-xs text-slate-400 uppercase">Score</div>
          <div className="text-2xl font-black text-white font-mono">
            {hud.score.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Race Finish Overlay */}
      {hud.finished && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-cyan-500/50 p-8 rounded-2xl text-center max-w-sm">
            <h2 className="text-3xl font-black text-cyan-400 mb-2">FINISH!</h2>
            <p className="text-slate-300 mb-4">
              Final Stunt Score: <span className="font-mono font-bold text-white">{hud.score.toLocaleString()}</span>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition cursor-pointer"
            >
              RACE AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Airborne Barrel Roll Badge */}
      {hud.airborne && !hud.finished && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 font-black px-5 py-1.5 rounded-full text-sm tracking-widest animate-bounce">
          BARREL ROLL +250!
        </div>
      )}

      {/* Bottom HUD */}
      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">
        <div className="w-72 bg-slate-900/85 border border-slate-700 backdrop-blur-md p-4 rounded-2xl">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className={hud.isBoosting ? 'text-cyan-400 animate-pulse' : 'text-slate-300'}>
              {hud.isBoosting ? 'NITRO OVERDRIVE!' : 'NITRO BOOST'}
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

        <div className="bg-slate-900/85 border border-cyan-500/40 backdrop-blur-md px-6 py-4 rounded-2xl text-right">
          <div className="text-5xl font-black font-mono text-white tracking-tight">
            {hud.speed}
          </div>
          <div className="text-xs font-bold tracking-widest text-cyan-400">KM/H</div>
        </div>
      </div>
    </div>
  );
}