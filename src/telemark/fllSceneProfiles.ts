/** The field pieces a Python lesson needs to explain its route or sensor reading. */
export type FllFieldObject = 'home' | 'line' | 'obstacle' | 'target' | 'cargo' | 'delivery';

/** Movable or measurable robot systems to expose in the lesson view. */
export type FllRobotPart = 'drivebase' | 'colorSensor' | 'ultrasonicSensor' | 'forceSensor' | 'attachment' | 'imu';

/** Mount coordinates in the robot's +X forward, +Y up, +Z right frame. */
export const FLL_COLOR_SENSOR_MOUNT = {xCm: 4.8, yCm: 3.2, zCm: -2.4} as const;
export const FLL_COLOR_SENSOR_TILT_RAD = -Math.PI / 2;

export function fllColorSensorFootprint(pose: {xCm: number; zCm: number; headingDeg: number}): {x: number; z: number} {
  const heading = pose.headingDeg * Math.PI / 180;
  return {
    x: pose.xCm + FLL_COLOR_SENSOR_MOUNT.xCm * Math.cos(heading) - FLL_COLOR_SENSOR_MOUNT.zCm * Math.sin(heading),
    z: pose.zCm + FLL_COLOR_SENSOR_MOUNT.xCm * Math.sin(heading) + FLL_COLOR_SENSOR_MOUNT.zCm * Math.cos(heading),
  };
}

export interface FllSceneProfile {
  lessonId: string;
  fieldObjects: readonly FllFieldObject[];
  robotParts: readonly FllRobotPart[];
  /** Capstones may use every practice mission piece and the whole field. */
  fullMission: boolean;
}

type ProfileFeatures = Omit<FllSceneProfile, 'lessonId'>;
const scene = (fieldObjects: readonly FllFieldObject[], robotParts: readonly FllRobotPart[], fullMission = false): ProfileFeatures =>
  ({fieldObjects, robotParts, fullMission});

const FULL_FIELD: readonly FllFieldObject[] = ['home', 'line', 'obstacle', 'target', 'cargo', 'delivery'];

/**
 * One entry per lesson with a Python simulator. The first five F0.M lessons have
 * no simulator, so they deliberately have no scene profile.
 */
export const FLL_SCENE_PROFILES: Readonly<Record<string, ProfileFeatures>> = {
  'fll-unit-00/what-is-fll-challenge': scene(['home'], ['drivebase']),
  'fll-unit-00/spike-app-and-simulator': scene(['home'], ['drivebase']),
  'fll-unit-00/motor-pairs-and-distance': scene([], ['drivebase']),
  'fll-unit-00/turns-and-steering': scene([], ['drivebase']),
  'fll-unit-00/precision-route-challenge': scene(['home', 'line'], ['drivebase']),

  'fll-unit-01/color-and-reflected-light': scene(['line'], ['drivebase', 'colorSensor']),
  'fll-unit-01/distance-and-wait-until': scene(['obstacle'], ['drivebase', 'ultrasonicSensor']),
  'fll-unit-01/hub-heading': scene([], ['drivebase', 'imu']),
  'fll-unit-01/attachment-motors': scene(['cargo'], ['drivebase', 'attachment']),
  'fll-unit-01/retrieve-deliver-challenge': scene(['home', 'line', 'cargo', 'delivery'], ['drivebase', 'colorSensor', 'ultrasonicSensor', 'attachment']),

  'fll-unit-02/my-blocks': scene([], ['drivebase']),
  'fll-unit-02/launch-plan-and-home': scene(['home'], ['drivebase']),
  'fll-unit-02/calibration-and-repeatability': scene(['home'], ['drivebase']),
  'fll-unit-02/mission-order-and-time': scene([], ['drivebase', 'attachment']),
  'fll-unit-02/mission-run-capstone': scene(FULL_FIELD, ['drivebase', 'attachment'], true),

  'fll-unit-03/python-values': scene([], ['drivebase']),
  'fll-unit-03/variables-and-units': scene([], ['drivebase']),
  'fll-unit-03/math-for-motion': scene([], ['drivebase']),
  'fll-unit-03/strings-and-output': scene(['line', 'obstacle'], ['drivebase', 'colorSensor', 'ultrasonicSensor', 'imu']),
  'fll-unit-03/data-check-challenge': scene([], ['drivebase']),

  'fll-unit-04/compare-readings': scene(['obstacle'], ['ultrasonicSensor']),
  'fll-unit-04/if-elif-else': scene(['line', 'obstacle'], ['drivebase', 'colorSensor', 'ultrasonicSensor']),
  'fll-unit-04/and-or-not': scene(['line', 'obstacle'], ['colorSensor', 'ultrasonicSensor', 'attachment']),
  'fll-unit-04/thresholds-and-hysteresis': scene(['line'], ['drivebase', 'colorSensor']),
  'fll-unit-04/decision-challenge': scene(['line', 'obstacle'], ['drivebase', 'colorSensor', 'ultrasonicSensor']),

  'fll-unit-05/for-range': scene([], ['drivebase']),
  'fll-unit-05/while-and-stop': scene(['line'], ['drivebase', 'colorSensor']),
  'fll-unit-05/wait-and-stopwatch': scene([], ['drivebase']),
  'fll-unit-05/timeouts': scene(['line'], ['drivebase', 'colorSensor']),
  'fll-unit-05/loop-challenge': scene(['line', 'obstacle'], ['drivebase', 'colorSensor', 'ultrasonicSensor']),

  'fll-unit-06/function-definitions': scene([], ['drivebase']),
  'fll-unit-06/parameters-and-return': scene(['line'], ['drivebase', 'colorSensor']),
  'fll-unit-06/scope-and-constants': scene(['line'], ['colorSensor']),
  'fll-unit-06/lists-and-routes': scene([], ['drivebase']),
  'fll-unit-06/function-challenge': scene([], ['drivebase']),

  'fll-unit-07/motor-directions': scene([], ['attachment']),
  'fll-unit-07/motor-angles': scene([], ['attachment']),
  'fll-unit-07/motor-targets': scene([], ['attachment']),
  'fll-unit-07/gearing-and-stalls': scene([], ['attachment']),
  'fll-unit-07/attachment-control-challenge': scene(['home', 'target'], ['drivebase', 'attachment']),

  'fll-unit-08/drivebase-geometry': scene([], ['drivebase']),
  'fll-unit-08/straight-and-turn': scene([], ['drivebase']),
  'fll-unit-08/curves-and-settings': scene([], ['drivebase']),
  'fll-unit-08/drive-and-heading': scene([], ['drivebase', 'imu']),
  'fll-unit-08/navigation-challenge': scene(['home', 'line'], ['drivebase']),

  'fll-unit-09/reflection-calibration': scene(['line'], ['drivebase', 'colorSensor']),
  'fll-unit-09/line-stop': scene(['line'], ['drivebase', 'colorSensor']),
  'fll-unit-09/color-classification': scene(['home', 'target', 'delivery'], ['drivebase', 'colorSensor']),
  'fll-unit-09/line-following': scene(['line'], ['drivebase', 'colorSensor']),
  'fll-unit-09/sensor-route-challenge': scene(['line'], ['drivebase', 'colorSensor']),

  'fll-unit-10/ultrasonic-range': scene(['obstacle'], ['drivebase', 'ultrasonicSensor']),
  'fll-unit-10/force-contact': scene(['target'], ['drivebase', 'forceSensor', 'attachment']),
  'fll-unit-10/imu-heading': scene([], ['drivebase', 'imu']),
  'fll-unit-10/sensor-fallback': scene(['obstacle'], ['drivebase', 'ultrasonicSensor']),
  'fll-unit-10/sensor-fusion-challenge': scene(['obstacle'], ['drivebase', 'ultrasonicSensor', 'imu']),

  'fll-unit-11/mission-decomposition': scene(['home', 'target'], ['drivebase', 'attachment']),
  'fll-unit-11/attachment-geometry': scene(['target'], ['drivebase', 'attachment']),
  'fll-unit-11/launch-programs': scene(['home', 'line', 'target'], ['drivebase', 'attachment']),
  'fll-unit-11/parallel-actions': scene(['target'], ['drivebase', 'attachment']),
  'fll-unit-11/mission-cycle-challenge': scene(FULL_FIELD, ['drivebase', 'attachment'], true),

  'fll-unit-12/repeatability-data': scene(['home'], ['drivebase']),
  'fll-unit-12/calibrate-diameter': scene([], ['drivebase']),
  'fll-unit-12/calibrate-track': scene([], ['drivebase', 'imu']),
  'fll-unit-12/failure-recovery': scene(['line', 'target'], ['drivebase', 'colorSensor', 'attachment']),
  'fll-unit-12/reliability-challenge': scene(['home', 'line'], ['drivebase', 'imu']),

  'fll-unit-13/mission-value': scene([], []),
  'fll-unit-13/time-budget': scene([], []),
  'fll-unit-13/route-order': scene(['home', 'line', 'target', 'cargo', 'delivery'], ['drivebase', 'attachment']),
  'fll-unit-13/risk-and-recovery': scene(['home', 'target'], []),
  'fll-unit-13/match-plan-challenge': scene(FULL_FIELD, ['drivebase', 'attachment'], true),

  'fll-unit-14/program-architecture': scene(['line'], ['drivebase', 'colorSensor']),
  'fll-unit-14/code-review': scene(['obstacle'], ['drivebase', 'ultrasonicSensor']),
  'fll-unit-14/integration-test': scene(['home', 'target'], ['drivebase', 'attachment']),
  'fll-unit-14/rehearsal': scene(['home', 'line', 'target'], ['drivebase', 'attachment']),
  'fll-unit-14/full-match-capstone': scene(FULL_FIELD, ['drivebase', 'colorSensor', 'ultrasonicSensor', 'attachment', 'imu'], true),
};

export function getFllSceneProfile(lessonId: string): FllSceneProfile {
  const features = FLL_SCENE_PROFILES[lessonId];
  if (!features) throw new Error(`No FLL simulator scene profile for ${lessonId}`);
  return {lessonId, ...features};
}

/** Put the only range target in the launch lane so the range exercise can reach it. */
export function getFllObstaclePosition(profile: Pick<FllSceneProfile, 'fieldObjects'>): {x: number; z: number} {
  return profile.fieldObjects.length === 1 && profile.fieldObjects[0] === 'obstacle'
    ? {x: -65, z: 38}
    : {x: 20, z: 0};
}
