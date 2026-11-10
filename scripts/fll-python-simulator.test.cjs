const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadPyodide} = require('../static/pyodide/pyodide.js');

const root = path.resolve(__dirname, '..');
const runtimeDirectory = path.join(root, 'static/pyodide');
const modelPath = path.join(root, 'static/simulator/fll-pybricks-shim.py');

const setup = `from pybricks.hubs import PrimeHub
from pybricks.pupdevices import Motor, ColorSensor, UltrasonicSensor
from pybricks.parameters import Port, Direction
from pybricks.robotics import DriveBase
hub = PrimeHub()
left = Motor(Port.A, Direction.COUNTERCLOCKWISE)
right = Motor(Port.B)
robot = DriveBase(left, right, wheel_diameter=56, axle_track=112)
color_sensor = ColorSensor(Port.C)
attachment = Motor(Port.E)
`;

async function main() {
  const python = await loadPyodide({indexURL: `${runtimeDirectory}/`});
  python.runPython(fs.readFileSync(modelPath, 'utf8'));
  const runStudent = python.globals.get('run_student');
  const run = (source, fieldObjects) => JSON.parse(fieldObjects === undefined
    ? runStudent(source)
    : runStudent(source, JSON.stringify(fieldObjects)));
  try {
    const roundTrip = run(`${setup}\nrobot.straight(900)\nrobot.turn(180)\nrobot.straight(900)\n`);
    assert.equal(roundTrip.error, null);
    assert.equal(roundTrip.scene.missions.crossedLine, true);
    assert.equal(roundTrip.scene.missions.atHome, true);
    assert.equal(roundTrip.repeatabilityPasses, 3);
    assert.equal(roundTrip.profiles.length, 3);
    assert.ok(roundTrip.playback.length > 3);

    const noField = run(`${setup}\nrobot.straight(750)\n`, []);
    const lineAtSensor = run(`${setup}\nrobot.straight(750)\n`, ['line']);
    const lineCrossing = run(`${setup}\nrobot.straight(810)\n`, ['line']);
    assert.equal(noField.error, null);
    assert.equal(noField.scene.missions.crossedLine, false, 'a hidden line must not count as crossed');
    assert.equal(noField.scene.reflection, 78, 'a hidden line must not change the color sensor');
    assert.equal(noField.scene.score, 0);
    assert.equal(lineAtSensor.error, null);
    assert.equal(lineAtSensor.scene.missions.crossedLine, false, 'the front sensor reaches the line before the robot center');
    assert.equal(lineAtSensor.scene.reflection, 18);
    assert.equal(lineAtSensor.scene.score, 0);
    assert.equal(lineCrossing.scene.missions.crossedLine, true);
    assert.equal(lineCrossing.scene.reflection, 78, 'the sensor has left the line after the center crosses');
    assert.equal(lineCrossing.scene.score, 10);
    assert.match(run(`${setup}\nrobot.straight(750)\nprint(color_sensor.color())\n`, ['line']).output, /BLACK/);
    assert.match(run(`${setup}\nrobot.straight(810)\nprint(color_sensor.color())\n`, ['line']).output, /WHITE/);
    const turnedSensor = run(`${setup}\nrobot.straight(784)\nprint(color_sensor.reflection())\nrobot.turn(90)\nprint(color_sensor.reflection())\n`, ['line']);
    assert.match(turnedSensor.output, /78\s+18/, 'the sensor footprint must rotate with the robot');

    const rangeSource = `${setup}\ndistance_sensor = UltrasonicSensor(Port.D)\nprint(distance_sensor.distance())\nrobot.straight(100)\n`;
    const obstacleOnly = run(rangeSource, ['obstacle']);
    assert.equal(obstacleOnly.error, null);
    assert.match(obstacleOnly.output, /^230\s*$/m, 'the focused obstacle starts 230 mm ahead of the sensor');
    assert.equal(obstacleOnly.scene.distanceCm, 13, 'a 100 mm approach must reduce the range by 100 mm');
    const offLaneObstacle = run(rangeSource, ['line', 'obstacle']);
    assert.equal(offLaneObstacle.error, null);
    assert.match(offLaneObstacle.output, /^2000\s*$/m, 'the shared-field obstacle keeps its original off-lane position');
    const obstacleCollision = run(`${setup}\nrobot.straight(200)\n`, ['obstacle']);
    assert.match(obstacleCollision.error, /collided/i, 'the focused obstacle must also participate in collision checks');
    assert.equal(obstacleCollision.scene.collision, true);

    const syntax = run('if True print("bad")');
    assert.equal(syntax.errorType, 'compile');
    assert.equal(syntax.errorLine, 1);
    assert.match(syntax.error, /invalid syntax/);

    const runtime = run(`${setup}\nrobot.fly(300)\n`);
    assert.equal(runtime.errorType, 'runtime');
    assert.equal(runtime.errorLine, 12);
    assert.match(runtime.error, /fly/);

    const blockedImport = run('import js');
    assert.equal(blockedImport.errorType, 'runtime');
    assert.match(blockedImport.error, /unavailable in the simulator/);

    const loopLimit = run('while True:\n    pass\n');
    assert.equal(loopLimit.errorType, 'limit');
    assert.match(loopLimit.error, /too many Python lines/);

    const defaultWheel = run(`${setup}\nrobot.straight(500)\n`);
    const declaredLargeWheel = run(`${setup.replace('wheel_diameter=56', 'wheel_diameter=70')}\nrobot.straight(500)\n`);
    assert.equal(defaultWheel.error, null);
    assert.equal(declaredLargeWheel.error, null);
    assert.ok(defaultWheel.scene.xCm > declaredLargeWheel.scene.xCm + 8,
      'a larger declared wheel diameter must reduce the physical distance');
    assert.equal(declaredLargeWheel.scene.xCm, -60);

    const defaultAxle = run(`${setup}\nrobot.turn(360)\n`);
    const declaredWideAxle = run(`${setup.replace('axle_track=112', 'axle_track=140')}\nrobot.turn(360)\n`);
    assert.equal(defaultAxle.error, null);
    assert.equal(declaredWideAxle.error, null);
    assert.ok(declaredWideAxle.scene.headingDeg > defaultAxle.scene.headingDeg + 80,
      'a wider declared axle track must increase physical turn angle');

    const forwardLeftMotor = run(`from pybricks.pupdevices import Motor\nfrom pybricks.parameters import Port, Direction\nleft = Motor(Port.A, Direction.COUNTERCLOCKWISE)\nleft.run_angle(360, 180)\n`);
    const reverseLeftMotor = run(`from pybricks.pupdevices import Motor\nfrom pybricks.parameters import Port, Direction\nleft = Motor(Port.A, Direction.CLOCKWISE)\nleft.run_angle(360, 180)\n`);
    assert.ok(forwardLeftMotor.scene.xCm > -100 && reverseLeftMotor.scene.xCm < -100,
      'direct motor commands must respect positive_direction');

    const fullMission = run(`${setup}\nrobot.straight(900)\nrobot.turn(-90)\nrobot.straight(80)\nprint(color_sensor.reflection())\nattachment.run_angle(300, 60)\nrobot.turn(90)\nrobot.straight(650)\nrobot.turn(-90)\nrobot.straight(580)\nrobot.turn(90)\nrobot.straight(230)\nattachment.run_angle(300, -60)\nrobot.turn(180)\nrobot.straight(1780)\nrobot.turn(-90)\nrobot.straight(660)\n`);
    assert.equal(fullMission.error, null);
    assert.equal(fullMission.scene.score, 60);
    assert.equal(fullMission.scene.missions.atHome, true);
    assert.ok(fullMission.scene.elapsedSeconds < 150);
    assert.ok(fullMission.sensorReads.color > 0);

    const worker = fs.readFileSync(path.join(root, 'static/simulator/fll-python-worker.js'), 'utf8');
    assert.match(worker, /importScripts/);
    assert.match(worker, /pyodide\.js/);
    assert.match(worker, /fll-pybricks-shim\.py/);
    assert.ok(fs.existsSync(path.join(runtimeDirectory, 'pyodide.asm.wasm')));
    assert.ok(fs.existsSync(path.join(runtimeDirectory, 'python_stdlib.zip')));
    assert.ok(fs.existsSync(path.join(runtimeDirectory, 'LICENSE')));
    console.log('FLL Python worker model, error handling, geometry, and full mission checks passed');
  } finally {
    runStudent.destroy();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
