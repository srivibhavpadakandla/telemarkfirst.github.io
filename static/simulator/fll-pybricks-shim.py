"""Deterministic Pybricks practice model for the Telemark FLL field.

This module runs inside a dedicated Pyodide worker. It uses real Python syntax
and control flow, then supplies a focused Pybricks API model. Measurements are
simulated and are not a substitute for a physical robot test.
"""

import ast
import builtins
import json
import math
import sys
import traceback
import types


FIELD_X = 118.0
FIELD_Z = 54.0
ROBOT_RADIUS = 9.0
PHYSICAL_WHEEL_DIAMETER_MM = 56.0
PHYSICAL_AXLE_TRACK_MM = 112.0
OBSTACLE = (20.0, 0.0, 12.0)
CARGO_START = (-5.0, 20.0)
DELIVERY = (78.0, -28.0, 18.0)
TARGET = (38.0, 36.0, 15.0)
MAX_SIM_SECONDS = 150.0
MAX_PYTHON_LINES = 25000
MAX_FRAMES = 300
FIELD_OBJECTS = frozenset(("home", "line", "obstacle", "target", "cargo", "delivery"))
COLOR_SENSOR_FORWARD_CM = 4.8
COLOR_SENSOR_SIDE_CM = -2.4
LINE_HALF_WIDTH_CM = 3.0


class SimulationError(Exception):
    pass


def _distance(x1, z1, x2, z2):
    return math.hypot(x2 - x1, z2 - z1)


def _student_line():
    frame = sys._getframe(1)
    while frame:
        if frame.f_code.co_filename == "<student>":
            return frame.f_lineno
        frame = frame.f_back
    return 1


class Field:
    def __init__(self, wheel_bias=0.0, collect=True, field_objects=None):
        self.field_objects = FIELD_OBJECTS if field_objects is None else field_objects
        self.obstacle = (-65.0, 38.0, 12.0) if self.field_objects == {"obstacle"} else OBSTACLE
        self.x = -100.0
        self.z = 38.0
        self.heading = 0.0
        self.attachment = 0.0
        self.elapsed = 0.0
        self.object_x, self.object_z = CARGO_START
        self.crossed_line = False
        self.target_active = False
        self.carrying_object = False
        self.delivered_object = False
        self.at_home = True
        self.collision = False
        self.wheel_bias = wheel_bias
        self.collect = collect
        self.frames = []
        self.events = []
        self.motors = {}
        self.drive_base = None
        self.imu_offset = 0.0
        self.logs = []
        self.distance_readings = 0
        self.color_readings = 0
        self.heading_readings = 0
        self.force_readings = 0
        self._sample_count = 0
        self.update()

    def snapshot(self):
        return {
            "xCm": round(self.x, 3),
            "zCm": round(self.z, 3),
            "headingDeg": round(self.heading, 3),
            "speedPercent": round(min(100, abs(self.drive_base._speed) / 5), 2) if self.drive_base else 40,
            "attachmentDeg": round(self.attachment, 3),
            "elapsedSeconds": round(self.elapsed, 3),
            "distanceCm": round(self.distance_mm() / 10, 3),
            "reflection": self.reflection(),
            "score": (10 if self.crossed_line else 0) + (20 if self.target_active else 0) + (30 if self.delivered_object else 0),
            "collision": self.collision,
            "objectX": round(self.object_x, 3),
            "objectZ": round(self.object_z, 3),
            "missions": {
                "crossedLine": self.crossed_line,
                "targetActive": self.target_active,
                "carryingObject": self.carrying_object,
                "deliveredObject": self.delivered_object,
                "atHome": self.at_home,
            },
        }

    def frame(self, kind, line=None, force=False):
        if not self.collect or len(self.frames) >= MAX_FRAMES:
            return
        self._sample_count += 1
        if not force and self._sample_count % 2:
            return
        self.frames.append({"kind": kind, "line": line or _student_line(), "scene": self.snapshot()})

    def event(self, name):
        self.events.append(name)

    def color_sensor_position(self):
        heading = math.radians(self.heading)
        forward = COLOR_SENSOR_FORWARD_CM
        side = COLOR_SENSOR_SIDE_CM
        return (self.x + forward * math.cos(heading) - side * math.sin(heading),
                self.z + forward * math.sin(heading) + side * math.cos(heading))

    def reflection(self):
        sensor_x, _ = self.color_sensor_position()
        return 18 if "line" in self.field_objects and abs(sensor_x + 20) <= LINE_HALF_WIDTH_CM else 78

    def color(self):
        sensor_x, sensor_z = self.color_sensor_position()
        if self.reflection() < 35:
            return "BLACK"
        if "target" in self.field_objects and _distance(sensor_x, sensor_z, *TARGET[:2]) < 13:
            return "YELLOW"
        if "delivery" in self.field_objects and _distance(sensor_x, sensor_z, *DELIVERY[:2]) < 16:
            return "GREEN"
        if "home" in self.field_objects and sensor_x < -82 and sensor_z > 25:
            return "BLUE"
        return "WHITE"

    def distance_mm(self):
        heading = math.radians(self.heading)
        nearest = 2000.0
        visible = []
        if "obstacle" in self.field_objects:
            visible.append(self.obstacle)
        if "cargo" in self.field_objects:
            visible.append((self.object_x, self.object_z, 5.0))
        if "target" in self.field_objects:
            visible.append(TARGET)
        for x, z, radius in visible:
            dx, dz = x - self.x, z - self.z
            forward = dx * math.cos(heading) + dz * math.sin(heading)
            side = abs(-dx * math.sin(heading) + dz * math.cos(heading))
            if forward > 0 and side < radius + 5:
                nearest = min(nearest, max(0, (forward - radius) * 10))
        return round(nearest)

    def update(self):
        self.crossed_line = self.crossed_line or ("line" in self.field_objects and self.x >= -20)
        self.at_home = "home" in self.field_objects and self.x < -82 and self.z > 25
        if "target" in self.field_objects and self.attachment >= 45 and _distance(self.x, self.z, *TARGET[:2]) <= TARGET[2]:
            self.target_active = True
        if "cargo" in self.field_objects and not self.carrying_object and not self.delivered_object and self.attachment >= 55:
            if _distance(self.x, self.z, self.object_x, self.object_z) <= 14:
                self.carrying_object = True
        if self.carrying_object:
            heading = math.radians(self.heading)
            self.object_x = self.x + math.cos(heading) * 9
            self.object_z = self.z + math.sin(heading) * 9
            if self.attachment <= 12:
                self.carrying_object = False
                if "delivery" in self.field_objects and _distance(self.object_x, self.object_z, *DELIVERY[:2]) <= DELIVERY[2]:
                    self.delivered_object = True

    def add_time(self, seconds):
        self.elapsed += max(0, seconds)
        if self.elapsed > MAX_SIM_SECONDS:
            raise SimulationError("The route exceeded the 150 second practice limit.")

    def move_wheels(self, left_mm, right_mm, speed_mm_s=200, line=None, kind="drive"):
        nominal_left_mm = left_mm
        nominal_right_mm = right_mm
        actual_left_mm = nominal_left_mm * (1 + self.wheel_bias)
        actual_right_mm = nominal_right_mm * (1 + self.wheel_bias)
        count = max(1, math.ceil(max(abs(actual_left_mm), abs(actual_right_mm)) / 60))
        for _ in range(count):
            left_step = actual_left_mm / count
            right_step = actual_right_mm / count
            nominal_left_step = nominal_left_mm / count
            nominal_right_step = nominal_right_mm / count
            turn_deg = math.degrees((left_step - right_step) / PHYSICAL_AXLE_TRACK_MM)
            middle_heading = math.radians(self.heading + turn_deg / 2)
            center_cm = (left_step + right_step) / 20
            self.x += math.cos(middle_heading) * center_cm
            self.z += math.sin(middle_heading) * center_cm
            self.heading += turn_deg
            self.add_time(max(abs(left_step), abs(right_step)) / max(10, abs(speed_mm_s)))
            if self.drive_base:
                encoder_to_distance = self.drive_base.wheel_diameter / PHYSICAL_WHEEL_DIAMETER_MM
                measured_left = nominal_left_step * encoder_to_distance
                measured_right = nominal_right_step * encoder_to_distance
                self.drive_base._distance += (measured_left + measured_right) / 2
                self.drive_base._angle += math.degrees((measured_left - measured_right) / self.drive_base.axle_track)
            for port, travel in (("A", nominal_left_step), ("B", nominal_right_step)):
                if port in self.motors:
                    orientation = -1 if port == "A" else 1
                    self.motors[port]._angle += travel / (math.pi * PHYSICAL_WHEEL_DIAMETER_MM) * 360 * orientation * self.motors[port].positive_direction
            self.update()
            self.frame(kind, line)
            if abs(self.x) > FIELD_X - ROBOT_RADIUS or abs(self.z) > FIELD_Z - ROBOT_RADIUS:
                self.collision = True
                raise SimulationError("The robot crossed the practice field boundary.")
            if "obstacle" in self.field_objects and _distance(self.x, self.z, *self.obstacle[:2]) < ROBOT_RADIUS + self.obstacle[2]:
                self.collision = True
                raise SimulationError("The robot collided with the practice field obstacle.")
        self.frame(kind, line, force=True)

    def wait(self, milliseconds, line=None):
        ms = float(milliseconds)
        if not math.isfinite(ms) or ms < 0:
            raise ValueError("wait() requires a nonnegative number of milliseconds")
        self.event("wait")
        if ms > 150000:
            raise SimulationError("One wait is longer than the 150 second practice limit.")
        steps = max(1, math.ceil(ms / 250))
        for _ in range(steps):
            dt = ms / steps / 1000
            base = self.drive_base
            if base and (base._drive_speed or base._turn_rate):
                center = base._drive_speed * dt
                delta = math.radians(base._turn_rate * dt)
                scale = PHYSICAL_WHEEL_DIAMETER_MM / base.wheel_diameter
                left = (center + delta * base.axle_track / 2) * scale
                right = (center - delta * base.axle_track / 2) * scale
                self.move_wheels(left, right, max(abs(left / dt), abs(right / dt), 10), line, "drive")
            elif self.motors.get("A") and self.motors.get("B") and (self.motors["A"]._run_speed or self.motors["B"]._run_speed):
                left = -self.motors["A"]._run_speed * self.motors["A"].positive_direction * dt / 360 * math.pi * PHYSICAL_WHEEL_DIAMETER_MM
                right = self.motors["B"]._run_speed * self.motors["B"].positive_direction * dt / 360 * math.pi * PHYSICAL_WHEEL_DIAMETER_MM
                self.move_wheels(left, right, max(abs(left / dt), abs(right / dt), 10), line, "motor")
            else:
                self.add_time(dt)
            attachment = self.motors.get("E")
            if attachment and attachment._run_speed:
                attachment._angle += attachment._run_speed * dt
                self.attachment = max(-90, min(90, attachment._angle * attachment.positive_direction))
                self.update()
        self.frame("wait", line, force=True)


def _make_modules(field):
    root = types.ModuleType("pybricks")
    root.__path__ = []
    modules = {"pybricks": root}
    for name in ("hubs", "pupdevices", "parameters", "robotics", "tools"):
        module = types.ModuleType("pybricks." + name)
        setattr(root, name, module)
        modules[module.__name__] = module

    class Port:
        A, B, C, D, E, F = "A", "B", "C", "D", "E", "F"

    class Direction:
        CLOCKWISE, COUNTERCLOCKWISE = 1, -1

    class Stop:
        COAST, BRAKE, HOLD = "COAST", "BRAKE", "HOLD"

    class Color:
        NONE, BLACK, WHITE, RED, YELLOW, GREEN, BLUE, ORANGE, MAGENTA = (
            "NONE", "BLACK", "WHITE", "RED", "YELLOW", "GREEN", "BLUE", "ORANGE", "MAGENTA"
        )

    class Motor:
        def __init__(self, port, positive_direction=Direction.CLOCKWISE, gears=None, reset_angle=True, profile=None):
            if port not in (Port.A, Port.B, Port.C, Port.D, Port.E, Port.F):
                raise ValueError("Motor port must be Port.A through Port.F")
            self.port = port
            self.positive_direction = positive_direction
            self._angle = 0.0
            self._run_speed = 0.0
            field.motors[port] = self

        def angle(self):
            return round(self._angle)

        def reset_angle(self, angle=0):
            self._angle = float(angle or 0)

        def speed(self, window=100):
            return round(self._run_speed)

        def stalled(self):
            return False

        def done(self):
            return True

        def run(self, speed):
            self._run_speed = float(speed)
            field.event("motor.run")
            field.frame("motor", _student_line(), force=True)

        def dc(self, duty):
            self.run(float(duty) * 8)

        def stop(self):
            self._run_speed = 0.0
            field.event("motor.stop")
            field.frame("motor", _student_line(), force=True)

        brake = stop
        hold = stop

        def run_angle(self, speed, rotation_angle, then=Stop.HOLD, wait=True):
            if not wait:
                raise SimulationError("Motor wait=False is outside this simulator's supported subset.")
            speed = float(speed)
            rotation_angle = float(rotation_angle)
            if speed == 0 and rotation_angle:
                raise ValueError("Motor speed must be nonzero for run_angle()")
            line = _student_line()
            field.event("motor.run_angle")
            if self.port in (Port.A, Port.B):
                orientation = -1 if self.port == Port.A else 1
                wheel_mm = rotation_angle / 360 * math.pi * PHYSICAL_WHEEL_DIAMETER_MM * orientation * self.positive_direction
                field.move_wheels(wheel_mm if self.port == Port.A else 0,
                                  wheel_mm if self.port == Port.B else 0,
                                  abs(speed) / 360 * math.pi * PHYSICAL_WHEEL_DIAMETER_MM, line, "motor")
            else:
                self._angle += rotation_angle
                if self.port == Port.E:
                    field.attachment = max(-90, min(90, self._angle * self.positive_direction))
                field.add_time(abs(rotation_angle) / max(1, abs(speed)))
                field.update()
                field.frame("attachment", line, force=True)

        def run_target(self, speed, target_angle, then=Stop.HOLD, wait=True):
            self.run_angle(speed, float(target_angle) - self._angle, then=then, wait=wait)

        def run_time(self, speed, time, then=Stop.HOLD, wait=True):
            self.run_angle(speed, float(speed) * float(time) / 1000, then=then, wait=wait)

    class DriveBase:
        def __init__(self, left_motor, right_motor, wheel_diameter, axle_track):
            if not isinstance(left_motor, Motor) or not isinstance(right_motor, Motor):
                raise TypeError("DriveBase requires two Motor objects")
            if left_motor.port == right_motor.port:
                raise ValueError("DriveBase motors must use different ports")
            if float(wheel_diameter) <= 0 or float(axle_track) <= 0:
                raise ValueError("Wheel diameter and axle track must be positive millimeters")
            self.left_motor = left_motor
            self.right_motor = right_motor
            self.wheel_diameter = float(wheel_diameter)
            self.axle_track = float(axle_track)
            self._speed = 200.0
            self._acceleration = 400.0
            self._turn_speed = 90.0
            self._turn_acceleration = 180.0
            self._drive_speed = 0.0
            self._turn_rate = 0.0
            self._distance = 0.0
            self._angle = 0.0
            self._gyro = False
            field.drive_base = self

        def settings(self, straight_speed=None, straight_acceleration=None, turn_rate=None, turn_acceleration=None):
            if straight_speed is not None:
                self._speed = abs(float(straight_speed))
            if straight_acceleration is not None:
                self._acceleration = abs(float(straight_acceleration))
            if turn_rate is not None:
                self._turn_speed = abs(float(turn_rate))
            if turn_acceleration is not None:
                self._turn_acceleration = abs(float(turn_acceleration))
            return (self._speed, self._acceleration, self._turn_speed, self._turn_acceleration)

        def straight(self, distance, then=Stop.HOLD, wait=True):
            if not wait:
                raise SimulationError("DriveBase wait=False is outside this simulator's supported subset.")
            self._drive_speed = self._turn_rate = 0.0
            field.event("drive.straight")
            scale = PHYSICAL_WHEEL_DIAMETER_MM / self.wheel_diameter
            field.move_wheels(float(distance) * scale, float(distance) * scale, self._speed * scale, _student_line())

        def turn(self, angle, then=Stop.HOLD, wait=True, absolute=False):
            if not wait:
                raise SimulationError("DriveBase wait=False is outside this simulator's supported subset.")
            delta = float(angle) - self._angle if absolute else float(angle)
            self._drive_speed = self._turn_rate = 0.0
            field.event("drive.turn")
            scale = PHYSICAL_WHEEL_DIAMETER_MM / self.wheel_diameter
            wheel_mm = math.radians(delta) * self.axle_track / 2 * scale
            field.move_wheels(wheel_mm, -wheel_mm,
                              max(10, math.radians(self._turn_speed) * self.axle_track / 2 * scale),
                              _student_line(), "turn")

        def arc(self, radius, angle=None, distance=None, then=Stop.HOLD, wait=True):
            if (angle is None) == (distance is None):
                raise ValueError("arc() needs either angle or distance")
            radius = float(radius)
            if radius == 0:
                raise ValueError("arc() radius cannot be zero")
            if not wait:
                raise SimulationError("DriveBase wait=False is outside this simulator's supported subset.")
            center = float(distance) if distance is not None else abs(radius) * math.radians(float(angle))
            delta = center / radius
            field.event("drive.arc")
            scale = PHYSICAL_WHEEL_DIAMETER_MM / self.wheel_diameter
            field.move_wheels((center + delta * self.axle_track / 2) * scale,
                              (center - delta * self.axle_track / 2) * scale,
                              self._speed * scale, _student_line(), "drive")

        def drive(self, speed, turn_rate):
            self._drive_speed = float(speed)
            self._turn_rate = float(turn_rate)
            field.event("drive.drive")
            field.frame("drive", _student_line(), force=True)

        def stop(self):
            self._drive_speed = self._turn_rate = 0.0
            field.event("drive.stop")
            field.frame("control", _student_line(), force=True)

        brake = stop

        def reset(self, distance=0, angle=0):
            self.stop()
            self._distance = float(distance)
            self._angle = float(angle)
            if self._gyro:
                field.imu_offset = field.heading - float(angle)
            field.event("drive.reset")

        def distance(self):
            return round(self._distance)

        def angle(self):
            return round(self._angle)

        def state(self):
            return (round(self._distance), round(self._drive_speed), round(self._angle), round(self._turn_rate))

        def done(self):
            return True

        def stalled(self):
            return field.collision

        def use_gyro(self, enabled):
            self._gyro = bool(enabled)
            self.stop()
            field.event("drive.use_gyro")

    class IMU:
        def heading(self):
            field.heading_readings += 1
            field.event("imu.heading")
            return round(field.heading - field.imu_offset, 2)

        def reset_heading(self, angle=0):
            if field.drive_base and field.drive_base._gyro and (field.drive_base._drive_speed or field.drive_base._turn_rate):
                raise OSError("Stop the gyro DriveBase before resetting heading")
            field.imu_offset = field.heading - float(angle)
            field.event("imu.reset_heading")
            field.frame("sensor", _student_line(), force=True)

    class PrimeHub:
        def __init__(self, *args, **kwargs):
            self.imu = IMU()

    class ColorSensor:
        def __init__(self, port):
            self.port = port

        def reflection(self):
            field.color_readings += 1
            field.event("color.reflection")
            return field.reflection()

        def color(self, surface=True):
            field.color_readings += 1
            field.event("color.color")
            return field.color()

        def ambient(self):
            field.color_readings += 1
            return 45

        def detectable_colors(self, colors=None):
            return colors if colors is not None else (Color.RED, Color.YELLOW, Color.GREEN, Color.BLUE, Color.WHITE, Color.NONE)

    class UltrasonicSensor:
        def __init__(self, port):
            self.port = port

        def distance(self):
            field.distance_readings += 1
            field.event("ultrasonic.distance")
            return field.distance_mm()

        def presence(self):
            return False

    class ForceSensor:
        def __init__(self, port):
            self.port = port

        def pressed(self, force=3):
            field.force_readings += 1
            field.event("force.pressed")
            return field.attachment >= 45 and (
                _distance(field.x, field.z, *TARGET[:2]) <= TARGET[2]
                or _distance(field.x, field.z, field.object_x, field.object_z) <= 14
            )

        def force(self):
            return 8 if self.pressed() else 0

    class StopWatch:
        def __init__(self):
            self._origin = field.elapsed
            self._paused = False
            self._pause_at = 0.0

        def time(self):
            now = self._pause_at if self._paused else field.elapsed
            return round((now - self._origin) * 1000)

        def reset(self):
            self._origin = field.elapsed

        def pause(self):
            self._paused = True
            self._pause_at = field.elapsed

        def resume(self):
            if self._paused:
                self._origin += field.elapsed - self._pause_at
                self._paused = False

    def wait(milliseconds):
        field.wait(milliseconds, _student_line())

    def run_task(*args, **kwargs):
        raise SimulationError("run_task() is outside this simulator's synchronous Pybricks subset.")

    modules["pybricks.parameters"].Port = Port
    modules["pybricks.parameters"].Direction = Direction
    modules["pybricks.parameters"].Stop = Stop
    modules["pybricks.parameters"].Color = Color
    modules["pybricks.pupdevices"].Motor = Motor
    modules["pybricks.pupdevices"].ColorSensor = ColorSensor
    modules["pybricks.pupdevices"].UltrasonicSensor = UltrasonicSensor
    modules["pybricks.pupdevices"].ForceSensor = ForceSensor
    modules["pybricks.hubs"].PrimeHub = PrimeHub
    modules["pybricks.robotics"].DriveBase = DriveBase
    modules["pybricks.tools"].wait = wait
    modules["pybricks.tools"].StopWatch = StopWatch
    modules["pybricks.tools"].run_task = run_task
    return modules


def _run_once(source, code, tree, wheel_bias=0.0, collect=True, field_objects=None):
    field = Field(wheel_bias=wheel_bias, collect=collect, field_objects=field_objects)
    modules = _make_modules(field)
    original_import = builtins.__import__
    line_count = 0
    called_functions = {}
    error = None
    error_type = None
    error_line = None

    def safe_import(name, globals=None, locals=None, fromlist=(), level=0):
        if level != 0:
            raise ImportError("Relative imports are unavailable in the simulator")
        if name in modules:
            return modules[name] if fromlist else modules["pybricks"]
        if name in ("math", "umath"):
            return original_import("math")
        raise ImportError("Module " + name + " is unavailable in the simulator")

    def write_print(*values, sep=" ", end="\n", **kwargs):
        if kwargs:
            raise TypeError("print() supports sep and end in the simulator")
        if len(field.logs) < 120:
            field.logs.append((str(sep).join(str(value) for value in values) + str(end))[:300])

    allowed_builtins = dict(vars(builtins))
    allowed_builtins["__import__"] = safe_import
    allowed_builtins["print"] = write_print
    for blocked in ("open", "input", "eval", "exec", "compile", "breakpoint", "help", "exit", "quit"):
        allowed_builtins.pop(blocked, None)
    scope = {"__builtins__": allowed_builtins, "__name__": "__main__"}

    def trace(frame, event, arg):
        nonlocal line_count
        if frame.f_code.co_filename == "<student>":
            if event == "call":
                name = frame.f_code.co_name
                if name != "<module>":
                    called_functions[name] = called_functions.get(name, 0) + 1
            elif event == "line":
                line_count += 1
                if line_count > MAX_PYTHON_LINES:
                    raise SimulationError("The program ran too many Python lines. Check your loop stop condition.")
        return trace

    try:
        sys.settrace(trace)
        exec(code, scope, scope)
        field.update()
    except BaseException as exception:
        error = str(exception) or type(exception).__name__
        error_type = "limit" if isinstance(exception, SimulationError) and ("too many" in error or "150 second" in error) else "runtime"
        for item in reversed(traceback.extract_tb(exception.__traceback__)):
            if item.filename == "<student>":
                error_line = item.lineno
                break
        if error_line is None:
            error_line = _student_line()
    finally:
        sys.settrace(None)

    methods = []
    syntax = {"loops": 0, "decisions": 0, "functions": 0, "lists": 0, "variableArguments": 0}
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            target = node.func
            methods.append(target.attr if isinstance(target, ast.Attribute) else target.id if isinstance(target, ast.Name) else "")
            if isinstance(target, ast.Attribute) and target.attr == "straight" and any(isinstance(arg, ast.Name) for arg in node.args):
                syntax["variableArguments"] += 1
        elif isinstance(node, (ast.For, ast.While)):
            syntax["loops"] += 1
        elif isinstance(node, ast.If):
            syntax["decisions"] += 1
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            syntax["functions"] += 1
        elif isinstance(node, ast.List):
            syntax["lists"] += 1
    return {
        "scene": field.snapshot(),
        "playback": field.frames,
        "events": field.events,
        "output": "".join(field.logs)[:5000],
        "error": error,
        "errorType": error_type,
        "errorLine": error_line,
        "operations": line_count,
        "methods": methods,
        "syntax": syntax,
        "calledFunctions": called_functions,
        "sensorReads": {"color": field.color_readings, "distance": field.distance_readings,
                        "heading": field.heading_readings, "force": field.force_readings},
        "repeatabilityPasses": 0,
        "profiles": [],
    }


def run_student(source, field_objects_json=None):
    try:
        chosen_objects = FIELD_OBJECTS if field_objects_json is None else frozenset(json.loads(field_objects_json))
    except (TypeError, ValueError):
        raise ValueError("Invalid practice field profile")
    if not chosen_objects.issubset(FIELD_OBJECTS):
        raise ValueError("Unknown practice field object")
    if not isinstance(source, str) or len(source) > 20000:
        return json.dumps({"error": "Keep the program under 20,000 characters.", "errorType": "compile", "errorLine": 1})
    try:
        tree = ast.parse(source, filename="<student>")
        code = compile(tree, "<student>", "exec")
    except SyntaxError as exception:
        return json.dumps({"error": exception.msg, "errorType": "compile", "errorLine": exception.lineno,
                           "scene": Field(field_objects=chosen_objects).snapshot(), "playback": [], "events": [], "output": "", "operations": 0,
                           "methods": [], "syntax": {"loops": 0, "decisions": 0, "functions": 0, "lists": 0, "variableArguments": 0},
                           "calledFunctions": {}, "sensorReads": {"color": 0, "distance": 0, "heading": 0, "force": 0},
                           "repeatabilityPasses": 0, "profiles": []})
    result = _run_once(source, code, tree, field_objects=chosen_objects)
    if result["error"] is None:
        passes = 0
        profiles = []
        for bias in (-0.02, 0.0, 0.02):
            trial = _run_once(source, code, tree, wheel_bias=bias, collect=False, field_objects=chosen_objects)
            passed = trial["error"] is None and trial["scene"]["missions"]["atHome"]
            profiles.append({"wheelBiasPercent": round(bias * 100),
                             "xCm": trial["scene"]["xCm"], "zCm": trial["scene"]["zCm"],
                             "headingDeg": trial["scene"]["headingDeg"],
                             "score": trial["scene"]["score"],
                             "atHome": trial["scene"]["missions"]["atHome"],
                             "error": trial["error"]})
            if passed:
                passes += 1
        result["repeatabilityPasses"] = passes
        result["profiles"] = profiles
    return json.dumps(result)
