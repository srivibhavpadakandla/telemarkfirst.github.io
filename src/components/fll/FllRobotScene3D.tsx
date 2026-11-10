import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import useBaseUrl from '@docusaurus/useBaseUrl';
import type {FllPlaybackFrame, FllSceneState} from '@site/src/telemark/blocks/fllInterpreter';
import {FLL_COLOR_SENSOR_MOUNT, FLL_COLOR_SENSOR_TILT_RAD, getFllObstaclePosition, type FllSceneProfile, type FllFieldObject} from '@site/src/telemark/fllSceneProfiles';
import {BIOGLOW_MODELS, bioglowTouchedModels, createBioglowField, type BioglowField} from './bioglowField';
import {interpolatePose, visualPose, wheelTravelCm, type FllVisualPose} from './sceneMotion';
import styles from './FllRobotScene3D.module.css';

interface Props {
  profile: FllSceneProfile;
  scene: FllSceneState;
  trail: FllSceneState[];
  interactionTrail?: FllSceneState[];
  frame?: FllPlaybackFrame | null;
  currentStep: number;
  totalSteps: number;
  playing: boolean;
}

function disposeObject(object: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Line)) return;
    geometries.add(child.geometry);
    (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    const map = (material as THREE.MeshBasicMaterial).map;
    map?.dispose();
    material.dispose();
  });
}

function brickMesh(size: [number, number, number], color: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({color, roughness: 0.72}));
}

function floorLabel(text: string, x: number, z: number, width = 24): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, 512, 128);
    context.font = '700 56px Arial, sans-serif';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillStyle = '#eaf3f5';
    context.fillText(text, 256, 68);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide}));
  label.rotation.x = -Math.PI / 2;
  label.position.set(x, 0.45, z);
  return label;
}

export default function FllRobotScene3D({profile, scene, trail, interactionTrail, frame, currentStep, totalSteps, playing}: Props): React.JSX.Element {
  const assetBaseUrl = useBaseUrl('/simulator/models/fll/');
  const hostRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<THREE.Line | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const setCameraRef = useRef<((view: 'angled' | 'top') => void) | null>(null);
  const setFieldModeRef = useRef<((mode: 'practice' | 'bioglow') => void) | null>(null);
  const bioglowRef = useRef<BioglowField | null>(null);
  const visualPoseRef = useRef<FllVisualPose>(visualPose(scene));
  const tweenRef = useRef<{from: FllVisualPose; to: FllVisualPose; startMs: number; durationMs: number} | null>(null);
  const applyPoseRef = useRef<((pose: FllVisualPose, reset?: boolean) => void) | null>(null);
  const [webglError, setWebglError] = useState(false);
  const [view, setView] = useState<'angled' | 'top'>('angled');
  const [fieldMode, setFieldMode] = useState<'practice' | 'bioglow'>('practice');
  const [modelState, setModelState] = useState<'loading' | 'loaded' | 'fallback'>('loading');
  const hasObject = (name: FllFieldObject) => profile.fieldObjects.includes(name);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    if (profile.robotParts.length === 0 && profile.fieldObjects.length === 0) {
      setModelState('loaded');
      return undefined;
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
    } catch {
      setWebglError(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const world = new THREE.Scene();
    world.background = new THREE.Color(0x07111a);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 900);
    const focusedRobot = profile.robotParts.length > 0 && !profile.fullMission && profile.fieldObjects.length <= 1;
    const focusPoint = focusedRobot
      ? new THREE.Vector3(scene.xCm + (profile.fieldObjects.length ? 14 : 0), 0, scene.zCm)
      : profile.robotParts.length === 0 && profile.fieldObjects.length === 1
        ? new THREE.Vector3(profile.fieldObjects[0] === 'obstacle' ? getFllObstaclePosition(profile).x : profile.fieldObjects[0] === 'target' ? 38 : -20, 0, profile.fieldObjects[0] === 'obstacle' ? getFllObstaclePosition(profile).z : profile.fieldObjects[0] === 'target' ? 36 : 0)
        : new THREE.Vector3(0, 0, 0);
    const cameraDistance = profile.fullMission ? 190 : focusedRobot ? (profile.fieldObjects.length ? 58 : 36) : profile.fieldObjects.length <= 1 ? 55 : 150;
    const cameraOffset = new THREE.Vector3(cameraDistance * 0.55, cameraDistance * 0.8, cameraDistance * 1.1);
    camera.position.copy(focusPoint).add(cameraOffset);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(focusPoint);
    controls.enableDamping = true;
    controls.minDistance = 24;
    controls.maxDistance = 430;
    controls.maxPolarAngle = Math.PI * 0.48;
    setCameraRef.current = (nextView) => {
      controls.target.copy(focusPoint);
      if (nextView === 'top') { camera.up.set(0, 0, -1); camera.position.copy(focusPoint).add(new THREE.Vector3(0, cameraDistance * 1.55, 0.01)); }
      else { camera.up.set(0, 1, 0); camera.position.copy(focusPoint).add(cameraOffset); }
      camera.lookAt(controls.target);
      controls.update();
    };

    world.add(new THREE.HemisphereLight(0xe7f7ff, 0x17202b, 2.0));
    const sun = new THREE.DirectionalLight(0xffffff, 2.3);
    sun.position.set(-80, 160, 100);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -145; sun.shadow.camera.right = 145;
    sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
    world.add(sun);

    const practiceField = new THREE.Group(); world.add(practiceField);
    const obstaclePosition = getFllObstaclePosition(profile);
    const robotVisible = profile.robotParts.length > 0;
    const drivebaseVisible = profile.robotParts.includes('drivebase');
    const bioglowField = profile.fullMission ? createBioglowField() : null;
    if (bioglowField) { bioglowField.root.visible = false; world.add(bioglowField.root); }
    bioglowRef.current = bioglowField;
    setFieldModeRef.current = (mode) => {
      practiceField.visible = mode === 'practice';
      if (bioglowField) bioglowField.root.visible = mode === 'bioglow';
      requestRenderRef.current?.();
    };
    const mat = brickMesh([236, 2, 108], 0x263746);
    mat.position.y = -1;
    mat.receiveShadow = true;
    practiceField.add(mat);
    const gridPoints: number[] = [];
    for (let x = -100; x <= 100; x += 20) gridPoints.push(x, 0.04, -53, x, 0.04, 53);
    for (let z = -40; z <= 40; z += 20) gridPoints.push(-117, 0.04, z, 117, 0.04, z);
    const grid = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3)), new THREE.LineBasicMaterial({color: 0x90a7b6, transparent: true, opacity: 0.2}));
    grid.visible = profile.fullMission || profile.fieldObjects.length > 1;
    practiceField.add(grid);
    if (hasObject('home')) {
      const home = brickMesh([34, 0.4, 28], 0x2b6d91);
      home.position.set(-100, 0, 38);
      practiceField.add(home, floorLabel('HOME', -100, 18, 22));
    }
    if (hasObject('delivery')) {
      const delivery = brickMesh([34, 0.5, 32], 0x2c7b4a);
      delivery.position.set(78, 0, -28);
      const deliveryRange = new THREE.Mesh(new THREE.RingGeometry(17.5, 18, 48), new THREE.MeshBasicMaterial({color: 0x8de5aa, side: THREE.DoubleSide}));
      deliveryRange.rotation.x = -Math.PI / 2; deliveryRange.position.set(78, 0.37, -28);
      practiceField.add(delivery, deliveryRange, floorLabel('DELIVERY', 77, -45, 26));
    }
    if (hasObject('line')) {
      const line = brickMesh([6, 0.4, 106], 0x111111);
      line.position.set(-20, 0.2, 0);
      practiceField.add(line, floorLabel('LINE', -20, -43, 20));
    }
    const obstacleRoot = new THREE.Group();
    obstacleRoot.position.set(obstaclePosition.x, 0, obstaclePosition.z);
    const obstacleFallback = brickMesh([24, 16, 24], 0xe59035);
    obstacleFallback.position.y = 8; obstacleFallback.castShadow = true;
    obstacleRoot.add(obstacleFallback);
    if (hasObject('obstacle')) practiceField.add(obstacleRoot, floorLabel('OBSTACLE', obstaclePosition.x, obstaclePosition.z - 20, 27));
    const targetRoot = new THREE.Group(); targetRoot.position.set(38, 0, 36);
    const targetFallback = brickMesh([9, 18, 18], 0xd9b62e);
    targetFallback.position.y = 9; targetRoot.add(targetFallback);
    const targetLeverPivot = new THREE.Group(); targetLeverPivot.position.y = 6.64; targetRoot.add(targetLeverPivot);
    if (hasObject('target')) {
      const targetPatch = new THREE.Mesh(new THREE.CircleGeometry(13, 48), new THREE.MeshBasicMaterial({color: 0xd9b62e, side: THREE.DoubleSide}));
      targetPatch.rotation.x = -Math.PI / 2; targetPatch.position.set(38, 0.2, 36);
      const targetRange = new THREE.Mesh(new THREE.RingGeometry(14.2, 14.7, 48), new THREE.MeshBasicMaterial({color: 0xf3d155, side: THREE.DoubleSide}));
      targetRange.rotation.x = -Math.PI / 2; targetRange.position.set(38, 0.36, 36);
      practiceField.add(targetPatch, targetRoot, targetRange, floorLabel('TARGET', 42, 17, 22));
    }
    const cargoRoot = new THREE.Group();
    const cargoFallback = brickMesh([10, 10, 10], 0xb95063);
    cargoFallback.position.y = 5; cargoFallback.castShadow = true; cargoRoot.add(cargoFallback);
    if (hasObject('cargo')) practiceField.add(cargoRoot);
    const wallMaterial = new THREE.MeshStandardMaterial({color: 0xc6d0d8, roughness: 0.7});
    [[236, 8, 3, 0, 3, -55], [236, 8, 3, 0, 3, 55], [3, 8, 108, -119, 3, 0], [3, 8, 108, 119, 3, 0]].forEach(([w, h, d, x, y, z]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMaterial);
      wall.position.set(x, y, z); wall.visible = profile.fullMission || profile.fieldObjects.length > 1; practiceField.add(wall);
    });

    const robot = new THREE.Group();
    const bodyFallback = new THREE.Group();
    const base = brickMesh([13, 6, 10], 0xe3e8eb); base.position.y = 5; base.castShadow = true; bodyFallback.add(base);
    const hub = brickMesh([8, 5, 8], 0x5b6570); hub.position.y = 9; bodyFallback.add(hub);
    if (drivebaseVisible) robot.add(bodyFallback);
    const wheelPivots = [-6.2, 6.2].map((z) => {
      const pivot = new THREE.Group(); pivot.position.set(-2.4, 2.8, z);
      const fallback = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 1.4, 32), new THREE.MeshStandardMaterial({color: 0x16191c}));
      fallback.rotation.x = Math.PI / 2; pivot.add(fallback);
      if (drivebaseVisible) robot.add(pivot);
      return {pivot, fallback};
    });
    const arm = new THREE.Group();
    const armFallback = brickMesh([8.8, 0.9, 1.2], 0x63d2f4); armFallback.position.x = 4.4; arm.add(armFallback);
    arm.position.set(drivebaseVisible ? 4.4 : 0, 5, 0);
    const attachmentMotorMount = new THREE.Group();
    attachmentMotorMount.position.set((drivebaseVisible ? 4.4 : 0) - 2.42, 5, -1.6);
    const attachmentMotorFallback = brickMesh([5, 4, 5], 0x58b7da);
    attachmentMotorMount.add(attachmentMotorFallback);
    if (profile.robotParts.includes('attachment')) robot.add(attachmentMotorMount, arm);
    robot.visible = robotVisible;
    world.add(robot);
    let lastAppliedPose = visualPoseRef.current;
    let leftWheelAngle = 0;
    let rightWheelAngle = 0;
    applyPoseRef.current = (pose, reset = false) => {
      if (reset) { leftWheelAngle = 0; rightWheelAngle = 0; }
      else {
        const travel = wheelTravelCm(lastAppliedPose, pose);
        leftWheelAngle -= travel.left / 2.8;
        rightWheelAngle -= travel.right / 2.8;
      }
      wheelPivots[0].pivot.rotation.z = leftWheelAngle;
      wheelPivots[1].pivot.rotation.z = rightWheelAngle;
      lastAppliedPose = pose;
      robot.position.set(pose.xCm, 0, pose.zCm);
      robot.rotation.y = -pose.headingDeg * Math.PI / 180;
      arm.rotation.z = pose.attachmentDeg * Math.PI / 180;
      cargoRoot.position.set(pose.objectX, pose.cargoLiftCm, pose.objectZ);
      targetLeverPivot.rotation.z = pose.targetProgress * Math.PI / 3;
      if (focusedRobot) {
        const nextFocus = new THREE.Vector3(pose.xCm + (profile.fieldObjects.length ? 14 : 0), 0, pose.zCm);
        camera.position.add(nextFocus.clone().sub(focusPoint));
        focusPoint.copy(nextFocus);
        controls.target.copy(focusPoint);
      }
    };
    applyPoseRef.current(visualPoseRef.current, true);

    const trailMaterial = new THREE.LineBasicMaterial({color: 0x38bdf8});
    const trailLine = new THREE.Line(new THREE.BufferGeometry(), trailMaterial);
    trailLine.position.y = 0.7; trailLine.visible = robotVisible; trailRef.current = trailLine; world.add(trailLine);

    let animation = 0;
    let active = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const modelLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const loadPart = async (file: string, parent: THREE.Group, fallback?: THREE.Object3D) => {
      const {scene: model} = await modelLoader.loadAsync(`${assetBaseUrl}${file}.glb`);
      if (!active) { disposeObject(model); return; }
      model.traverse((part) => { if (part instanceof THREE.Mesh) part.castShadow = true; });
      parent.add(model);
      if (fallback) fallback.visible = false;
      requestRenderRef.current?.();
      return model;
    };
    const loading: Promise<unknown>[] = [];
    if (drivebaseVisible) {
      loading.push(loadPart('drivebase', robot, bodyFallback));
      loading.push(loadPart('wheel', wheelPivots[0].pivot, wheelPivots[0].fallback).then((model) => {
        if (!model || !active) return;
        const opposite = model.clone(true);
        wheelPivots[1].pivot.add(opposite);
        wheelPivots[1].fallback.visible = false;
      }));
    }
    if (profile.robotParts.includes('attachment')) {
      loading.push(loadPart('attachment-motor', attachmentMotorMount, attachmentMotorFallback));
      loading.push(loadPart('tool', arm, armFallback));
    }
    for (const [name, file, location, color] of [
      ['colorSensor', 'color-sensor', [FLL_COLOR_SENSOR_MOUNT.xCm, FLL_COLOR_SENSOR_MOUNT.yCm, FLL_COLOR_SENSOR_MOUNT.zCm], 0x58aadb],
      ['ultrasonicSensor', 'distance-sensor', [drivebaseVisible ? 5 : 0, drivebaseVisible ? 5.1 : 5, 0], 0xa4afba],
      ['forceSensor', 'force-sensor', [drivebaseVisible ? 5 : 0, drivebaseVisible ? 3.4 : 5, 0], 0x9b76ba],
    ] as const) {
      if (!profile.robotParts.includes(name)) continue;
      const mount = new THREE.Group(); mount.position.set(...location);
      if (name === 'colorSensor') mount.rotation.z = FLL_COLOR_SENSOR_TILT_RAD;
      const fallback = brickMesh([3, 3, 3], color); mount.add(fallback); robot.add(mount);
      loading.push(loadPart(file, mount, fallback));
    }
    if (hasObject('obstacle')) loading.push(loadPart('obstacle', obstacleRoot, obstacleFallback));
    if (hasObject('cargo')) loading.push(loadPart('cargo', cargoRoot, cargoFallback));
    if (hasObject('target')) {
      loading.push(loadPart('target-base', targetRoot, targetFallback));
      const leverFallback = brickMesh([8.8, 1.2, 1.2], 0xe7bf39); leverFallback.position.x = 4.4; targetLeverPivot.add(leverFallback);
      loading.push(loadPart('target-lever', targetLeverPivot, leverFallback));
    }
    void Promise.allSettled(loading).then((outcomes) => {
      if (active) setModelState(outcomes.some((item) => item.status === 'rejected') ? 'fallback' : 'loaded');
    });
    const showFallback = () => {
      if (!active) return;
      active = false;
      if (animation) window.cancelAnimationFrame(animation);
      animation = 0;
      renderer.domElement.remove();
      setWebglError(true);
    };
    const draw = () => {
      animation = 0;
      if (!active) return;
      try {
        const tween = tweenRef.current;
        if (tween) {
          const progress = Math.min(1, (performance.now() - tween.startMs) / tween.durationMs);
          const pose = interpolatePose(tween.from, tween.to, progress);
          visualPoseRef.current = pose;
          applyPoseRef.current?.(pose);
          if (progress >= 1) tweenRef.current = null;
        }
        controls.update();
        const moving = Boolean(bioglowField?.root.visible && bioglowField.tick(reducedMotion));
        renderer.render(world, camera);
        if (moving || tweenRef.current) requestRender();
      } catch {
        showFallback();
      }
    };
    const requestRender = () => {
      if (!active || animation || document.hidden) return;
      animation = window.requestAnimationFrame(draw);
    };
    requestRenderRef.current = requestRender;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      showFallback();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    controls.addEventListener('change', requestRender);
    document.addEventListener('visibilitychange', requestRender);

    const resize = () => {
      const width = Math.max(1, host.clientWidth); const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
      requestRender();
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    return () => {
      active = false;
      window.cancelAnimationFrame(animation);
      observer.disconnect();
      document.removeEventListener('visibilitychange', requestRender);
      controls.removeEventListener('change', requestRender);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose(); renderer.dispose();
      disposeObject(world); renderer.domElement.remove(); trailRef.current = null;
      requestRenderRef.current = null; setCameraRef.current = null; setFieldModeRef.current = null; bioglowRef.current = null; applyPoseRef.current = null;
    };
  }, [assetBaseUrl, profile]);

  useEffect(() => {
    const target = visualPose(scene);
    if (frame && currentStep > 0) {
      const previousHeading = visualPoseRef.current.headingDeg;
      const turn = ((target.headingDeg - previousHeading + 540) % 360 + 360) % 360 - 180;
      target.headingDeg = previousHeading + turn;
    }
    if (currentStep === 0 || !applyPoseRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tweenRef.current = null;
      visualPoseRef.current = target;
      applyPoseRef.current?.(target, true);
    } else {
      tweenRef.current = {
        from: visualPoseRef.current,
        to: target,
        startMs: performance.now(),
        durationMs: playing ? (frame ? 420 : 115) : 320,
      };
    }
    if (trailRef.current) {
      trailRef.current.geometry.dispose();
      trailRef.current.geometry = new THREE.BufferGeometry().setFromPoints(trail.map((point) => new THREE.Vector3(point.xCm, 0.7, point.zCm)));
    }
    bioglowRef.current?.setProgress(interactionTrail ?? trail);
    requestRenderRef.current?.();
  }, [scene, trail, interactionTrail, currentStep, playing, frame]);

  const status = currentStep ? `${playing ? 'Running' : 'Showing'} step ${currentStep} of ${totalSteps}${frame ? ` · ${frame.kind}` : ''}` : '';
  const missionText = [hasObject('line') && scene.missions.crossedLine && 'line', hasObject('target') && scene.missions.targetActive && 'target', hasObject('delivery') && scene.missions.deliveredObject && 'delivery'].filter(Boolean).join(', ') || 'none';
  const bioglowTouched = fieldMode === 'bioglow' ? bioglowTouchedModels(interactionTrail ?? trail) : [];
  const touchedNames = [...new Set(bioglowTouched.map((key) => BIOGLOW_MODELS.find((item) => item.key === key)?.name).filter((name): name is string => Boolean(name)))];
  const chooseView = (nextView: 'angled' | 'top') => { setView(nextView); setCameraRef.current?.(nextView); requestRenderRef.current?.(); };
  const chooseField = (nextMode: 'practice' | 'bioglow') => { setFieldMode(nextMode); setFieldModeRef.current?.(nextMode); };
  return (
    <section className={styles.card} aria-label="FLL 3D field simulator">
      <div className={styles.header}>
        <div><h3>{fieldMode === 'bioglow' ? 'BIOGLOW field preview' : profile.fieldObjects.length === 0 ? 'Robot mechanism' : profile.robotParts.length === 0 ? 'Mission model' : 'FLL practice scene'}</h3><p>{fieldMode === 'bioglow' ? 'Future Edition 2026–27 · schematic map' : 'Drag to orbit · scroll to zoom'}</p></div>
        <div className={styles.headerControls}>
          {profile.fullMission && <div className={styles.viewControls} role="group" aria-label="Field map">
            <button type="button" aria-pressed={fieldMode === 'practice'} onClick={() => chooseField('practice')}>Practice</button>
            <button type="button" aria-pressed={fieldMode === 'bioglow'} onClick={() => chooseField('bioglow')}>BIOGLOW</button>
          </div>}
          <div className={styles.viewControls} role="group" aria-label="Field camera view">
            <button type="button" aria-pressed={view === 'angled'} onClick={() => chooseView('angled')}>3D</button>
            <button type="button" aria-pressed={view === 'top'} onClick={() => chooseView('top')}>Top</button>
          </div>
        </div>
      </div>
      <div className={styles.viewport} ref={hostRef}>{profile.robotParts.length === 0 && profile.fieldObjects.length === 0 && <p className={styles.emptyStage}>Use the editor to compare mission choices and timing. This lesson has no moving model.</p>}{webglError && <p className={styles.fallback}>WebGL is unavailable. The program still runs through the telemetry below.</p>}</div>
      {fieldMode === 'practice' && profile.fieldObjects.length > 0 ? <div className={styles.fieldKey} aria-label="Practice field key">
        {hasObject('home') && <span><i className={styles.homeKey} />Home</span>}{hasObject('line') && <span><i className={styles.lineKey} />Line</span>}{hasObject('obstacle') && <span><i className={styles.obstacleKey} />Obstacle</span>}{hasObject('target') && <span><i className={styles.targetKey} />Target</span>}{hasObject('cargo') && <span><i className={styles.cargoKey} />Cargo</span>}{hasObject('delivery') && <span><i className={styles.deliveryKey} />Delivery</span>}
      </div> : fieldMode === 'bioglow' ? <ol className={styles.bioglowKey} aria-label="BIOGLOW model key">{BIOGLOW_MODELS.filter((item) => item.side === 'red').map((item, index) => <li key={item.key}><span>{index + 1}</span>{item.name}</li>)}</ol> : null}
      <p className={styles.modelNote}>{profile.robotParts.length === 0 && profile.fieldObjects.length === 0 ? 'Planning lesson' : modelState === 'loaded' ? 'LDraw models of real LEGO parts' : modelState === 'fallback' ? 'Some parts shown as simplified shapes' : 'Loading LEGO part models'} · {fieldMode === 'bioglow' ? <>Robot contact drives illustrative model reactions. Telemetry and lesson checks still use the Practice field; Future Edition hardware, rules, and scores are not simulated. <a href="https://education.lego.com/en-us/first-lego-league/season-materials/" target="_blank" rel="noopener noreferrer">Official field map and missions</a></> : 'Unofficial practice assemblies; measurements remain simplified.'} <a href="https://www.ldraw.org/docs-main/licenses/legal-info.html" target="_blank" rel="noopener noreferrer">CAD source and license</a></p>
      {status && <p className={styles.stepStatus} role="status">{status}</p>}
      <div className={styles.readout} role="status">
        {profile.robotParts.length > 0 && <span><strong>Pose</strong> {scene.xCm.toFixed(0)}, {scene.zCm.toFixed(0)} cm · {scene.headingDeg.toFixed(0)}°</span>}
        {profile.robotParts.includes('ultrasonicSensor') && <span><strong>Distance</strong> {scene.distanceCm.toFixed(0)} cm</span>}
        {profile.robotParts.includes('colorSensor') && <span><strong>Reflected light</strong> {scene.reflection.toFixed(0)}%</span>}
        {fieldMode === 'bioglow' ? <><span><strong>Route time</strong> {scene.elapsedSeconds.toFixed(1)} s</span><span><strong>Visual reactions</strong> {touchedNames.join(', ') || 'none yet'}</span></> : <><span><strong>Practice time</strong> {scene.elapsedSeconds.toFixed(1)} s{profile.fieldObjects.length > 0 ? ` · ${scene.score} points` : ''}</span>{profile.fieldObjects.some((item) => item === 'line' || item === 'target' || item === 'delivery') && <span><strong>Completed</strong> {missionText}</span>}</>}
      </div>
    </section>
  );
}
