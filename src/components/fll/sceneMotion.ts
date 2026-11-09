import type {FllSceneState} from '@site/src/telemark/blocks/fllInterpreter';

export interface FllVisualPose {
  xCm: number;
  zCm: number;
  headingDeg: number;
  attachmentDeg: number;
  objectX: number;
  objectZ: number;
  cargoLiftCm: number;
  targetProgress: number;
}

export function visualPose(scene: FllSceneState): FllVisualPose {
  return {
    xCm: scene.xCm,
    zCm: scene.zCm,
    headingDeg: scene.headingDeg,
    attachmentDeg: scene.attachmentDeg,
    objectX: scene.objectX,
    objectZ: scene.objectZ,
    cargoLiftCm: scene.missions.carryingObject ? 3 : 0,
    targetProgress: scene.missions.targetActive ? 1 : 0,
  };
}

export function interpolatePose(from: FllVisualPose, to: FllVisualPose, progress: number): FllVisualPose {
  const t = Math.min(1, Math.max(0, progress));
  const mix = (start: number, end: number) => start + (end - start) * t;
  return {
    xCm: mix(from.xCm, to.xCm),
    zCm: mix(from.zCm, to.zCm),
    // The shim accumulates heading, so a full turn must stay a full turn.
    headingDeg: mix(from.headingDeg, to.headingDeg),
    attachmentDeg: mix(from.attachmentDeg, to.attachmentDeg),
    objectX: mix(from.objectX, to.objectX),
    objectZ: mix(from.objectZ, to.objectZ),
    cargoLiftCm: mix(from.cargoLiftCm, to.cargoLiftCm),
    targetProgress: mix(from.targetProgress, to.targetProgress),
  };
}

export function wheelTravelCm(from: FllVisualPose, to: FllVisualPose, axleTrackCm = 11.2): {left: number; right: number} {
  const middleHeading = (from.headingDeg + to.headingDeg) * Math.PI / 360;
  const forward = (to.xCm - from.xCm) * Math.cos(middleHeading)
    + (to.zCm - from.zCm) * Math.sin(middleHeading);
  const turn = (to.headingDeg - from.headingDeg) * Math.PI / 180;
  return {
    left: forward + turn * axleTrackCm / 2,
    right: forward - turn * axleTrackCm / 2,
  };
}
