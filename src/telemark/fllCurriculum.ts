import type {CurriculumLesson, CurriculumUnit, Tier} from './curriculum';

interface FllUnitSeed {
  title: string;
  desc: string;
  overview: string;
  outcomes: string[];
  lessons: Array<{slug: string; title: string; code?: string; challenge?: boolean}>;
}

const FLL_UNIT_SEEDS: FllUnitSeed[] = [
  {
    title: "Mechanical Foundations and First Routes",
    desc: "Build with simple machines, secure your robot, then program a measured route.",
    overview: "First see mission mechanisms as combinations of simple machines, build and support one, then learn the editor, hub ports, distances, and turns.",
    outcomes: [
      "Identify simple machines in mission models and robot attachments.",
      "Build a secure, supported mechanism for one mission action.",
      "Explain the Robot Game task and current rule source.",
      "Run a Pybricks program on a Prime Hub or in Telemark.",
      "Measure a route with DriveBase.straight() and DriveBase.turn().",
    ],
    lessons: [
      {slug: "design-as-simple-machines", title: "Design with Simple Machines", code: "F0.M1"},
      {slug: "what-simple-machines-do", title: "What Simple Machines Do", code: "F0.M2"},
      {slug: "read-missions-as-machines", title: "Read Missions as Machines", code: "F0.M3"},
      {slug: "build-a-mission-mechanism", title: "Build a Mission Mechanism", code: "F0.M4"},
      {slug: "secure-and-support-the-robot", title: "Secure and Support the Robot", code: "F0.M5"},
      {slug: "what-is-fll-challenge", title: "What FLL Challenge Is", code: "F0.1"},
      {slug: "spike-app-and-simulator", title: "Set Up Pybricks and Telemark", code: "F0.2"},
      {slug: "motor-pairs-and-distance", title: "Drive a Measured Distance", code: "F0.3"},
      {slug: "turns-and-steering", title: "Turn and Steer", code: "F0.4"},
      {slug: "precision-route-challenge", title: "Precision Route Challenge", code: "F0.5", challenge: true},
    ],
  },
  {
    title: "Sensors and First Mission Tools",
    desc: "Read light, range, and heading, then control a simple attachment.",
    overview: "Start with sensor values you can print and measure. Add threshold decisions only after you know the range on your own field.",
    outcomes: [
      "Measure reflected light and distance with Pybricks sensors.",
      "Read and reset Prime Hub heading safely.",
      "Move a tool motor through a measured angle.",
    ],
    lessons: [
      {slug: "color-and-reflected-light", title: "Color and Reflected Light"},
      {slug: "distance-and-wait-until", title: "Distance and Wait Until"},
      {slug: "hub-heading", title: "Hub Heading and Reset"},
      {slug: "attachment-motors", title: "Attachment Motors and Objects"},
      {slug: "retrieve-deliver-challenge", title: "Retrieve and Deliver Challenge", challenge: true},
    ],
  },
  {
    title: "Reliable First Mission Runs",
    desc: "Use Python functions, launch marks, calibration, and a match timer.",
    overview: "A mission route needs a repeatable start and useful checks. Name reusable actions, measure outcomes, and keep recovery time in the plan.",
    outcomes: [
      "Define a parameterized Python function for a mission action.",
      "Calibrate a drive route with measured trials.",
      "Plan a two-objective run within the match time.",
    ],
    lessons: [
      {slug: "my-blocks", title: "Python Functions and Parameters"},
      {slug: "launch-plan-and-home", title: "Launch Marks and Home"},
      {slug: "calibration-and-repeatability", title: "Calibration and Repeatability"},
      {slug: "mission-order-and-time", title: "Mission Order, Recovery, and Time"},
      {slug: "mission-run-capstone", title: "First Mission Run Capstone", challenge: true},
    ],
  },
  {
    title: "Python Data for Robot Programs",
    desc: "Use values, variables, arithmetic, and printed measurements.",
    overview: "Move from copying commands to choosing values. Store dimensions and sensor readings with clear units so you can change a route without searching through every line.",
    outcomes: [
      "Choose useful Python values and names.",
      "Convert centimeters to millimeters before DriveBase calls.",
      "Print measured values to support debugging.",
    ],
    lessons: [
      {slug: "python-values", title: "Numbers, Booleans, and Text"},
      {slug: "variables-and-units", title: "Variables and Units"},
      {slug: "math-for-motion", title: "Arithmetic for Motion"},
      {slug: "strings-and-output", title: "Print Useful Diagnostics"},
      {slug: "data-check-challenge", title: "Data Check Challenge", challenge: true},
    ],
  },
  {
    title: "Decisions from Robot Data",
    desc: "Use comparisons, branches, and tested thresholds.",
    overview: "Turn readings into safe actions. Every condition needs a known unit and a test for the boundary case.",
    outcomes: [
      "Write if, elif, and else branches.",
      "Combine conditions with Boolean operators.",
      "Use hysteresis when readings fluctuate near a threshold.",
    ],
    lessons: [
      {slug: "compare-readings", title: "Compare Sensor Readings"},
      {slug: "if-elif-else", title: "Choose One Branch"},
      {slug: "and-or-not", title: "Combine Conditions"},
      {slug: "thresholds-and-hysteresis", title: "Avoid Threshold Chatter"},
      {slug: "decision-challenge", title: "Decision Challenge", challenge: true},
    ],
  },
  {
    title: "Loops, Timing, and Safe Stops",
    desc: "Repeat work without leaving motors running indefinitely.",
    overview: "Use bounded loops and a stopwatch around sensor waits. Every continuous drive needs an explicit stop path.",
    outcomes: [
      "Repeat measured actions with range().",
      "Use while loops with a clear exit.",
      "Add timeouts and safe cleanup to continuous motion.",
    ],
    lessons: [
      {slug: "for-range", title: "Repeat a Known Count"},
      {slug: "while-and-stop", title: "Repeat Until a Cue"},
      {slug: "wait-and-stopwatch", title: "Wait and Measure Time"},
      {slug: "timeouts", title: "Add a Timeout"},
      {slug: "loop-challenge", title: "Loop and Timeout Challenge", challenge: true},
    ],
  },
  {
    title: "Functions and Route Data",
    desc: "Make small actions reusable and keep route data separate from movement code.",
    overview: "Functions reduce duplicated commands. Parameter names and return values let teammates inspect what each route step requires and produces.",
    outcomes: [
      "Define and call focused functions.",
      "Return a measured result.",
      "Represent a route as a list of steps.",
    ],
    lessons: [
      {slug: "function-definitions", title: "Define and Call Functions"},
      {slug: "parameters-and-return", title: "Parameters and Return Values"},
      {slug: "scope-and-constants", title: "Scope and Calibration Constants"},
      {slug: "lists-and-routes", title: "Represent a Route with a List"},
      {slug: "function-challenge", title: "Reusable Route Challenge", challenge: true},
    ],
  },
  {
    title: "Motors and Attachments",
    desc: "Control direction, angle, targets, and safe tool motion.",
    overview: "An attachment needs its own measured range. Learn the difference between a relative motor move and a target angle, then protect the tool from binding.",
    outcomes: [
      "Check motor direction with a small movement.",
      "Use relative and absolute motor angles appropriately.",
      "Test tool clearance before combining it with a route.",
    ],
    lessons: [
      {slug: "motor-directions", title: "Check Motor Direction"},
      {slug: "motor-angles", title: "Relative Tool Angles"},
      {slug: "motor-targets", title: "Target Angles"},
      {slug: "gearing-and-stalls", title: "Gearing, Load, and Stalls"},
      {slug: "attachment-control-challenge", title: "Attachment Control Challenge", challenge: true},
    ],
  },
  {
    title: "DriveBase Geometry and Navigation",
    desc: "Measure the chassis and choose straight, turn, arc, or continuous drive commands.",
    overview: "DriveBase uses wheel geometry to convert millimeters and degrees into motor motion. Each route is only as accurate as those measurements and the launch pose.",
    outcomes: [
      "Measure wheel diameter and axle track.",
      "Choose a movement command for a path shape.",
      "Use heading feedback without conflicting IMU resets.",
    ],
    lessons: [
      {slug: "drivebase-geometry", title: "Wheel Diameter and Axle Track"},
      {slug: "straight-and-turn", title: "Straight and Turn Segments"},
      {slug: "curves-and-settings", title: "Arcs and Speed Settings"},
      {slug: "drive-and-heading", title: "Continuous Drive and Heading"},
      {slug: "navigation-challenge", title: "Navigation Challenge", challenge: true},
    ],
  },
  {
    title: "Color Sensing on the Field",
    desc: "Calibrate reflected light, stop at a line, and use color labels cautiously.",
    overview: "A color sensor is useful when its reading is measured on your field. Learn when a numeric reflection threshold is more reliable than a color classification.",
    outcomes: [
      "Build a threshold from real readings.",
      "Stop at a line with a timeout.",
      "Use color labels and proportional correction only after calibration.",
    ],
    lessons: [
      {slug: "reflection-calibration", title: "Calibrate Reflected Light"},
      {slug: "line-stop", title: "Stop at a Dark Line"},
      {slug: "color-classification", title: "Classify a Field Color"},
      {slug: "line-following", title: "Follow an Edge Briefly"},
      {slug: "sensor-route-challenge", title: "Sensor Route Challenge", challenge: true},
    ],
  },
  {
    title: "Range, Contact, and Heading",
    desc: "Combine range measurements with contact and IMU checks.",
    overview: "Different sensors answer different questions. A range reading estimates separation, a force sensor detects contact, and the IMU estimates rotation.",
    outcomes: [
      "Recognize an invalid ultrasonic reading.",
      "Use a force sensor on hardware as a contact cue.",
      "Keep IMU resets and DriveBase gyro control consistent.",
    ],
    lessons: [
      {slug: "ultrasonic-range", title: "Read Ultrasonic Range"},
      {slug: "force-contact", title: "Use a Force Sensor on Hardware"},
      {slug: "imu-heading", title: "Read and Reset Heading"},
      {slug: "sensor-fallback", title: "Handle Missing or Conflicting Cues"},
      {slug: "sensor-fusion-challenge", title: "Sensor Check Challenge", challenge: true},
    ],
  },
  {
    title: "Mission Programs and Mechanisms",
    desc: "Break missions into actions, fit attachments, and coordinate movement.",
    overview: "A complete mission includes approach, tool action, confirmation, and return. Organize code so each part can be tested before a full run.",
    outcomes: [
      "Write a mission function with a clear start and finish.",
      "Account for attachment clearance in route design.",
      "Choose sequential or parallel actions deliberately.",
    ],
    lessons: [
      {slug: "mission-decomposition", title: "Break a Mission into Actions"},
      {slug: "attachment-geometry", title: "Plan Attachment Clearance"},
      {slug: "launch-programs", title: "Choose a Mission Program"},
      {slug: "parallel-actions", title: "Coordinate Drive and Tool Motion"},
      {slug: "mission-cycle-challenge", title: "Mission Cycle Challenge", challenge: true},
    ],
  },
  {
    title: "Calibration and Reliability",
    desc: "Use repeated trials to separate systematic error from random error.",
    overview: "A reliable mission has measured geometry, consistent launches, and a recorded fallback when a sensor or mechanism fails.",
    outcomes: [
      "Collect repeated trial results.",
      "Adjust wheel diameter before axle track.",
      "Test failures with a safe recovery path.",
    ],
    lessons: [
      {slug: "repeatability-data", title: "Record Repeatability"},
      {slug: "calibrate-diameter", title: "Calibrate Wheel Diameter"},
      {slug: "calibrate-track", title: "Calibrate Axle Track"},
      {slug: "failure-recovery", title: "Recover from a Failed Cue"},
      {slug: "reliability-challenge", title: "Reliability Challenge", challenge: true},
    ],
  },
  {
    title: "Match Strategy and Time",
    desc: "Choose mission order using measured time, success rate, and recovery cost.",
    overview: "A match plan should make it clear what the team launches first, what it skips after a failure, and how much time remains for a return.",
    outcomes: [
      "Estimate a mission's expected value from points and success rate.",
      "Budget 150 seconds with a reserve.",
      "Write a route order and recovery decision.",
    ],
    lessons: [
      {slug: "mission-value", title: "Compare Mission Value"},
      {slug: "time-budget", title: "Budget the Match"},
      {slug: "route-order", title: "Order Missions"},
      {slug: "risk-and-recovery", title: "Plan a Skip Decision"},
      {slug: "match-plan-challenge", title: "Match Plan Challenge", challenge: true},
    ],
  },
  {
    title: "Full FLL Program and Handoff",
    desc: "Integrate mission code, review it with teammates, and run a complete match rehearsal.",
    overview: "Finish with a program another team member can launch, inspect, test, and revise. The final result includes source code and measured evidence.",
    outcomes: [
      "Organize configuration and mission functions.",
      "Review code for units, stops, and assumptions.",
      "Demonstrate a full field run and hand off a test log.",
    ],
    lessons: [
      {slug: "program-architecture", title: "Organize the Program"},
      {slug: "code-review", title: "Review Units and Stops"},
      {slug: "integration-test", title: "Test the Whole Route"},
      {slug: "rehearsal", title: "Rehearse a Match"},
      {slug: "full-match-capstone", title: "Full Match Capstone", challenge: true},
    ],
  },
];

const unitSlug = (index: number) => 'fll-unit-' + String(index).padStart(2, '0');

export const FLL_UNITS: CurriculumUnit[] = FLL_UNIT_SEEDS.map((seed, index) => {
  const slug = unitSlug(index);
  const next = FLL_UNIT_SEEDS[index + 1];
  return {
    id: 'FLL_UNIT_' + String(index).padStart(2, '0'),
    label: 'FLL Unit ' + index,
    title: seed.title,
    desc: seed.desc,
    tier: (index < 4 ? 'Beginner' : index < 11 ? 'Intermediate' : 'Advanced') as Tier,
    slug,
    startPath: '/fll/unit-' + String(index).padStart(2, '0') + '/' + seed.lessons[0].slug,
    nextPath: next ? '/fll/unit-' + String(index + 1).padStart(2, '0') + '/' + next.lessons[0].slug : '/fll/references',
    nextLabel: next ? 'FLL Unit ' + (index + 1) + ': ' + next.title : 'FLL references',
    lessonCount: seed.lessons.length,
    overview: seed.overview,
    outcomes: seed.outcomes,
  };
});

export const FLL_LESSONS: CurriculumLesson[] = FLL_UNIT_SEEDS.flatMap((seed, unitIndex) => {
  const slug = unitSlug(unitIndex);
  return seed.lessons.map((item, lessonIndex) => {
    const code = item.code ?? 'F' + unitIndex + '.' + (lessonIndex + 1);
    return {
      id: slug + '/' + item.slug,
      label: code + ' · ' + item.title,
      title: 'Lesson ' + code + ': ' + item.title,
      path: '/fll/unit-' + String(unitIndex).padStart(2, '0') + '/' + item.slug,
      unitSlug: slug,
      unitLabel: 'FLL Unit ' + unitIndex,
      unitTitle: seed.title,
    };
  });
});

export const FLL_UNIT_COUNT = FLL_UNITS.length;
export const FLL_LESSON_COUNT = FLL_LESSONS.length;

export function getFllUnitBySlug(slug: string): CurriculumUnit | undefined {
  return FLL_UNITS.find((unit) => unit.slug === slug);
}

export function getFllLessonsForUnit(slug: string): CurriculumLesson[] {
  return FLL_LESSONS.filter((lesson) => lesson.unitSlug === slug);
}

export function isFllChallenge(lessonId: string): boolean {
  const [unitSlugValue, lessonSlug] = lessonId.split('/');
  const index = FLL_UNITS.findIndex((unit) => unit.slug === unitSlugValue);
  return index >= 0 && FLL_UNIT_SEEDS[index].lessons.some(
    (item) => item.slug === lessonSlug && item.challenge,
  );
}
