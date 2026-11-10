import type {FllSceneState} from './blocks/fllInterpreter';
import {isFllChallenge} from './fllCurriculum';
import {getFllSceneProfile} from './fllSceneProfiles';

export interface FllPythonFrame {
  kind: string;
  line: number;
  scene: FllSceneState;
}

export interface FllPythonRunResult {
  scene: FllSceneState;
  playback: FllPythonFrame[];
  events: string[];
  output: string;
  error: string | null;
  errorType: 'compile' | 'runtime' | 'limit' | null;
  errorLine: number | null;
  operations: number;
  methods: string[];
  syntax: {loops: number; decisions: number; functions: number; lists: number; variableArguments: number};
  calledFunctions: Record<string, number>;
  sensorReads: {color: number; distance: number; heading: number; force: number};
  repeatabilityPasses: number;
  profiles: Array<{wheelBiasPercent: number; xCm: number; zCm: number; headingDeg: number; score: number; atHome: boolean; error: string | null}>;
}

export interface FllPythonCheck {
  label: string;
  test: (result: FllPythonRunResult) => boolean;
}

export interface FllPythonPracticeConfig {
  lessonId: string;
  unit: number;
  challenge: boolean;
  goal: string;
  starter: string;
  checks: FllPythonCheck[];
}

const SETUP = `from pybricks.hubs import PrimeHub
from pybricks.pupdevices import Motor, ColorSensor, UltrasonicSensor, ForceSensor
from pybricks.parameters import Port, Direction, Stop, Color
from pybricks.robotics import DriveBase
from pybricks.tools import wait, StopWatch

hub = PrimeHub()
left_motor = Motor(Port.A, Direction.COUNTERCLOCKWISE)
right_motor = Motor(Port.B)
robot = DriveBase(left_motor, right_motor, wheel_diameter=56, axle_track=112)
color_sensor = ColorSensor(Port.C)
distance_sensor = UltrasonicSensor(Port.D)
attachment = Motor(Port.E)
force_sensor = ForceSensor(Port.F)

# Add your route below.
`;

const STARTERS: Record<number, string> = {
  0: 'robot.straight(300)',
  1: 'print(color_sensor.reflection())\nrobot.straight(300)',
  2: 'robot.straight(300)\nrobot.turn(90)',
  3: 'distance_mm = 300\nrobot.straight(distance_mm)',
  4: 'if distance_sensor.distance() > 200:\n    robot.straight(300)',
  5: 'for segment in range(3):\n    robot.straight(100)',
  6: 'def drive_segment(distance_mm):\n    robot.straight(distance_mm)\n\ndrive_segment(300)',
  7: 'attachment.run_angle(300, 60)\nrobot.straight(300)',
  8: 'robot.straight(300)\nrobot.turn(90)',
  9: 'while color_sensor.reflection() > 35:\n    robot.drive(120, 0)\n    wait(100)\nrobot.stop()',
  10: 'print(distance_sensor.distance())\nprint(hub.imu.heading())',
  11: 'robot.straight(300)\nrobot.turn(90)',
  12: 'robot.settings(straight_speed=180, turn_rate=80)\nrobot.straight(300)',
  13: 'watch = StopWatch()\nrobot.straight(300)\nprint(watch.time())',
  14: 'robot.straight(300)\nrobot.turn(90)',
};

function starterForLesson(lessonId: string, unit: number): string {
  const profile = getFllSceneProfile(lessonId);
  const parts = profile.robotParts;
  if (lessonId === 'fll-unit-01/color-and-reflected-light') return 'print("Before:", color_sensor.reflection())\nrobot.straight(750)\nprint("Line:", color_sensor.reflection())';
  if (lessonId === 'fll-unit-01/distance-and-wait-until') return `watch = StopWatch()
robot.drive(100, 0)
while distance_sensor.distance() > 150 and watch.time() < 3000:
    wait(10)
robot.stop()
print("Range mm:", distance_sensor.distance())`;
  if (lessonId === 'fll-unit-01/hub-heading') return 'robot.stop()\nhub.imu.reset_heading(0)\nrobot.turn(90)\nprint("Heading:", hub.imu.heading())';
  if (lessonId === 'fll-unit-01/attachment-motors') return 'attachment.run_angle(200, 90)\nattachment.run_angle(200, -90)';
  if (lessonId === 'fll-unit-04/thresholds-and-hysteresis') return 'robot.straight(750)\nprint("Reflection:", color_sensor.reflection())';
  if (!parts.includes('drivebase')) {
    if (parts.includes('ultrasonicSensor') && parts.includes('colorSensor')) return 'print("Range mm:", distance_sensor.distance())\nprint("Reflection:", color_sensor.reflection())';
    if (parts.includes('ultrasonicSensor')) return 'print("Range mm:", distance_sensor.distance())';
    if (parts.includes('colorSensor')) return 'print("Reflection:", color_sensor.reflection())';
    if (parts.includes('attachment')) return 'attachment.run_angle(300, 60)\nprint("Attachment angle:", attachment.angle())';
    return 'print("Plan a route, then record the objective order and time.")';
  }
  if (profile.fieldObjects.length === 1 && profile.fieldObjects[0] === 'obstacle') {
    return 'print("Range mm:", distance_sensor.distance())\nrobot.straight(50)\nprint("New range mm:", distance_sensor.distance())';
  }
  return STARTERS[unit] ?? STARTERS[0];
}

const has = (result: FllPythonRunResult, event: string) => result.events.includes(event);
const count = (result: FllPythonRunResult, event: string) => result.events.filter((item) => item === event).length;
const noCrash = (result: FllPythonRunResult) => result.error === null && !result.scene.collision;
const hasMotion = (result: FllPythonRunResult) => result.events.some((event) => event.startsWith('drive.') || event === 'motor.run_angle');
const home = (result: FllPythonRunResult) => result.scene.missions.atHome;

const CHALLENGES: Record<number, {goal: string; checks: FllPythonCheck[]}> = {
  0: {goal: 'Cross the dark line and return to the home area with measured moves.', checks: [
    {label: 'Cross the dark line', test: (r) => r.scene.missions.crossedLine},
    {label: 'Use a measured turn', test: (r) => has(r, 'drive.turn')},
    {label: 'Return to home without a collision', test: (r) => noCrash(r) && home(r)},
  ]},
  1: {goal: 'Read a field sensor, collect the object, and release it inside the delivery area.', checks: [
    {label: 'Read a color or distance sensor', test: (r) => r.sensorReads.color > 0 || r.sensorReads.distance > 0},
    {label: 'Move the attachment', test: (r) => has(r, 'motor.run_angle')},
    {label: 'Deliver the loose object without a collision', test: (r) => noCrash(r) && r.scene.missions.deliveredObject},
  ]},
  2: {goal: 'Activate the target, deliver the object, and return home in 150 simulated seconds.', checks: [
    {label: 'Activate the target', test: (r) => r.scene.missions.targetActive},
    {label: 'Deliver the object', test: (r) => r.scene.missions.deliveredObject},
    {label: 'Return home within 150 seconds', test: (r) => noCrash(r) && home(r) && r.scene.elapsedSeconds <= 150},
  ]},
  3: {goal: 'Store a measured distance in Python and drive about 300 mm.', checks: [
    {label: 'Pass a Python variable to straight()', test: (r) => r.syntax.variableArguments > 0},
    {label: 'Finish near x = -70 cm', test: (r) => Math.abs(r.scene.xCm + 70) <= 8},
    {label: 'Finish without a collision', test: noCrash},
  ]},
  4: {goal: 'Use a distance reading and a decision to stop a safe route.', checks: [
    {label: 'Read the ultrasonic sensor', test: (r) => r.sensorReads.distance > 0},
    {label: 'Use an if decision', test: (r) => r.syntax.decisions > 0},
    {label: 'Stop without a collision', test: (r) => noCrash(r) && has(r, 'drive.stop')},
  ]},
  5: {goal: 'Use a loop and simulated time to stop at the line or a time limit.', checks: [
    {label: 'Use a Python loop', test: (r) => r.syntax.loops > 0},
    {label: 'Read reflected light or a stopwatch', test: (r) => r.sensorReads.color > 0 || r.methods.includes('time')},
    {label: 'Stop after movement without a collision', test: (r) => noCrash(r) && hasMotion(r) && has(r, 'drive.stop')},
  ]},
  6: {goal: 'Define one route function and call it at least twice.', checks: [
    {label: 'Define a Python function', test: (r) => r.syntax.functions > 0},
    {label: 'Call a route function at least twice', test: (r) => Object.values(r.calledFunctions).some((times) => times >= 2)},
    {label: 'Move without a collision', test: (r) => noCrash(r) && hasMotion(r)},
  ]},
  7: {goal: 'Control the attachment motor and return to the home area.', checks: [
    {label: 'Move the attachment motor', test: (r) => has(r, 'motor.run_angle')},
    {label: 'Drive away and return home', test: (r) => count(r, 'drive.straight') >= 2 && home(r)},
    {label: 'Finish without a collision', test: noCrash},
  ]},
  8: {goal: 'Plan a route with two measured turns and return home.', checks: [
    {label: 'Use at least two measured turns', test: (r) => count(r, 'drive.turn') >= 2},
    {label: 'Cross the line and return home', test: (r) => r.scene.missions.crossedLine && home(r)},
    {label: 'Finish without a collision', test: noCrash},
  ]},
  9: {goal: 'Use reflected light to stop at the dark practice line.', checks: [
    {label: 'Read reflected light', test: (r) => r.sensorReads.color > 0},
    {label: 'Stop over the dark line', test: (r) => r.scene.reflection < 35 && has(r, 'drive.stop')},
    {label: 'Finish without a collision', test: noCrash},
  ]},
  10: {goal: 'Read distance and heading before choosing a safe move.', checks: [
    {label: 'Read ultrasonic distance', test: (r) => r.sensorReads.distance > 0},
    {label: 'Read hub heading', test: (r) => r.sensorReads.heading > 0},
    {label: 'Use a decision and finish without a collision', test: (r) => r.syntax.decisions > 0 && noCrash(r)},
  ]},
  11: {goal: 'Activate the target and deliver the object in one route.', checks: [
    {label: 'Activate the target', test: (r) => r.scene.missions.targetActive},
    {label: 'Deliver the object', test: (r) => r.scene.missions.deliveredObject},
    {label: 'Finish without a collision', test: noCrash},
  ]},
  12: {goal: 'Cross the line and return home in all three wheel calibration profiles.', checks: [
    {label: 'Cross the line', test: (r) => r.scene.missions.crossedLine},
    {label: 'Return home in three calibration profiles', test: (r) => r.repeatabilityPasses === 3},
    {label: 'Finish without a collision', test: noCrash},
  ]},
  13: {goal: 'Complete a scored route and return home within the match time.', checks: [
    {label: 'Complete a target or delivery objective', test: (r) => r.scene.score >= 30},
    {label: 'Return home within 150 seconds', test: (r) => home(r) && r.scene.elapsedSeconds <= 150},
    {label: 'Finish without a collision', test: noCrash},
  ]},
  14: {goal: 'Activate the target, deliver the object, and return home with a sensor check.', checks: [
    {label: 'Activate the target and deliver the object', test: (r) => r.scene.missions.targetActive && r.scene.missions.deliveredObject},
    {label: 'Use a color, distance, or heading reading', test: (r) => Object.values(r.sensorReads).some((value) => value > 0)},
    {label: 'Return home within 150 seconds without a collision', test: (r) => noCrash(r) && home(r) && r.scene.elapsedSeconds <= 150},
  ]},
};

const UNIT_GOALS: Record<number, string> = {
  0: 'Change a measured drive or turn, then compare the route with the field position.',
  1: 'Read a sensor value and test an attachment command on the practice field.',
  2: 'Combine measured moves into an autonomous mission route.',
  3: 'Use Python values and arithmetic to control a measured drive.',
  4: 'Use a sensor reading and a Python decision to choose a safe action.',
  5: 'Use a loop or timer, then check where the robot stops.',
  6: 'Move repeated route steps into Python functions.',
  7: 'Coordinate drive and attachment motors.',
  8: 'Measure a route with turns, arcs, and millimeter distances.',
  9: 'Use reflected light or color as a field landmark.',
  10: 'Combine distance, heading, and approximate contact readings.',
  11: 'Organize a multi-objective mission route.',
  12: 'Test the same route against three wheel calibration profiles.',
  13: 'Check objective order and simulated match time.',
  14: 'Assemble and inspect a full autonomous route.',
};

const LESSON_GOALS: Readonly<Record<string, string>> = {
  'fll-unit-01/color-and-reflected-light': 'Use reflected light to stop at the dark practice line.',
  'fll-unit-01/distance-and-wait-until': 'Drive toward the obstacle, then stop from a range reading or timeout.',
  'fll-unit-01/hub-heading': 'Reset heading, turn right, and compare the reading with the commanded angle.',
  'fll-unit-01/attachment-motors': 'Move the attachment through a known angle and return it to its start.',
  'fll-unit-04/compare-readings': 'Read the obstacle distance and compare it with a threshold in millimeters.',
  'fll-unit-06/scope-and-constants': 'Use a named light threshold while reading the practice line.',
  'fll-unit-07/motor-directions': 'Run the attachment motor in each direction and inspect the lever.',
  'fll-unit-07/motor-angles': 'Move the attachment through a measured angle.',
  'fll-unit-07/motor-targets': 'Command an attachment angle and check where the lever stops.',
  'fll-unit-07/gearing-and-stalls': 'Compare attachment motion with a safe motor limit.',
  'fll-unit-10/ultrasonic-range': 'Read range before and after a short drive toward the obstacle.',
  'fll-unit-10/force-contact': 'Test contact with the target using the force sensor and attachment.',
  'fll-unit-10/imu-heading': 'Turn the robot and compare its heading readings.',
  'fll-unit-10/sensor-fallback': 'Choose a safe stop when the obstacle reading is missing or uncertain.',
  'fll-unit-13/mission-value': 'Compare mission values before choosing a route.',
  'fll-unit-13/time-budget': 'Estimate how much time a route needs.',
  'fll-unit-13/risk-and-recovery': 'Compare the home and target positions when planning recovery.',
};

export function fllPythonPracticeConfig(lessonId: string): FllPythonPracticeConfig {
  const unit = Number.parseInt(lessonId.match(/fll-unit-(\d{2})/)?.[1] ?? '0', 10);
  const challenge = isFllChallenge(lessonId);
  const challengeConfig = CHALLENGES[unit];
  return {
    lessonId,
    unit,
    challenge,
    goal: challenge && challengeConfig ? challengeConfig.goal : LESSON_GOALS[lessonId] ?? UNIT_GOALS[unit] ?? UNIT_GOALS[0],
    starter: `${SETUP}\n${challenge ? '# Write your challenge route here.' : starterForLesson(lessonId, unit)}\n`,
    checks: challenge && challengeConfig ? challengeConfig.checks : [],
  };
}
