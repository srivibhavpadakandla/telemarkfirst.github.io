# Extended-content link audit and placement record

> The selected, lesson-specific links in this record have been inserted under
> `## Extended content`. Sources marked for holdback remain intentionally absent.

## Crawl record

- Crawl date: 2026-09-26
- Input: `linkList.txt`
- Result: all 46 supplied URLs returned an HTTP 200 response.
- Readability: 42 sources exposed usable page content; S05-S07 exposed title/author metadata but no usable captions or transcript; S46 exposed only part of its JavaScript-rendered repository listing.
- Scope: the recommendations below are editorial candidates, not an instruction to add every link. Prefer two or three highly relevant links per lesson and avoid repeating directory/index pages.
- Stability: source IDs are local, stable references for this draft. The linked pages themselves may change.

## Season and version warning

The curriculum is written around the 2025-2026 DECODE season, while the rolling `latest` FIRST documentation and the default branch of the FTC Robot Controller now describe the 2026-2027 BIOBUZZ season. Before placing S04, S16, S36-S45, or any default-branch SDK link, either:

1. replace it with a season-pinned/tagged DECODE URL;
2. label it as current general SDK documentation and verify that the API shown still matches the lesson; or
3. link an archived DECODE page or release.

Pedro Pathing, Road Runner, EasyOpenCV, FTCLib, and other default-branch documentation are also rolling. Pin a release/version when a lesson depends on exact package names, Gradle syntax, or APIs.

## Source catalog

| ID | Source | Crawl status | Best use / editorial note |
| --- | --- | --- | --- |
| S01 | [CTRL ALT FTC](https://www.ctrlaltftc.com/) | 200, full | Control-theory collection. Use the CA deep links below instead of repeatedly linking the home page. |
| S02 | [EasyOpenCV pipeline overview](https://github.com/OpenFTC/EasyOpenCV/blob/master/doc/user_docs/pipelines_overview.md) | 200, full | OpenCV pipeline structure. Rolling default branch; confirm API against the project dependency. |
| S03 | [MantiK FTC external libraries](https://mantik.netlify.app/ftc/external-libraries/) | 200, full | Discovery list for optional libraries. Treat as a directory, not primary API documentation. |
| S04 | [FIRST FTC documentation](https://ftc-docs.firstinspires.org/en/latest/) | 200, full | Official documentation index. Prefer a precise official page; `latest` is now BIOBUZZ. |
| S05 | [FIRST Steps to FTC Coding #4: Simple Autonomous Mode](https://www.youtube.com/watch?v=a3BVNtLyRd8) | 200, metadata only | Possible autonomous supplement. Watch and verify before publishing; transcript/captions were not crawlable. |
| S06 | [FTC Beginner OnBot Java Course: Java Code and Class Structure](https://www.youtube.com/watch?v=2Eca7-HPokg) | 200, metadata only | Possible early-Java supplement. Watch and verify before publishing; it teaches OnBot Java, not necessarily this Android Studio workflow. |
| S07 | [FTC Programming Tutorial: Motor Encoders](https://www.youtube.com/watch?v=q35mTF3xIxg) | 200, metadata only | Possible encoder supplement. Watch and verify code/version before publishing. |
| S08 | [FtcRobotController-PowerPlay fork](https://github.com/ftcwires/FtcRobotController-PowerPlay) | 200, full | Archived season-specific fork. Do not place as current setup guidance. |
| S09 | [Pedro Pathing repository](https://github.com/Pedro-Pathing/PedroPathing) | 200, full | Source/release reference for Unit 15. Prefer the PP documentation links for students. |
| S10 | [Pedro Pathing installation](https://pedropathing.com/docs/pathing/installation) | 200, full | Current installation instructions. Pin the version if copied commands or dependencies are shown in a lesson. |
| S11 | [Marrow: spatial awareness](https://marrow.skeletonarmyftc.com/concepts/spatial-awareness) | 200, full | Coordinate frames, pose, and field-awareness enrichment. |
| S12 | [FTCLib Quickstart](https://github.com/FTCLib/FTCLib-Quickstart) | 200, full | Separate framework/quickstart. Do not mix into the base SDK setup flow without a deliberate FTCLib track and version check. |
| S13 | [Road Runner repository](https://github.com/acmerobotics/road-runner) | 200, full | Advanced comparison/reference. Avoid presenting its current API as Pedro Pathing API. |
| S14 | [Andover Robotics software docs](https://andover-robotics.github.io/software-docs/) | 200, full | Team-authored overview. Useful as optional perspective, not as the canonical SDK source. |
| S15 | [FTC Dashboard build.gradle file](https://github.com/acmerobotics/ftc-dashboard/blob/master/build.gradle) | 200, full | A repository build file, not installation documentation. Do not place directly; use a versioned dashboard guide if needed. |
| S16 | [FIRST: choosing a programming language](https://ftc-docs.firstinspires.org/en/latest/programming_resources/shared/choosing_program_lang/choosing-program-lang.html) | 200, full | Official Blocks/OnBot Java/Android Studio comparison. Rolling `latest`. |
| S17 | [Fire Wires: choosing Blocks or Java](https://firewires.org/coachs-corner-choosing-between-blocks-and-java-programming-for-first-tech-challenge/) | 200, full | Coaching perspective. Pair with S16 rather than treating it as an official rule. |
| S18 | [Loudoun Robotics coaches corner](https://www.loudounrobotics.org/coaches-corner.html) | 200, full | Broad coaching page with weak lesson-level specificity. Do not place unless a precise relevant section is identified. |
| S19 | [Game Manual 0 software concepts index](https://gm0.org/en/latest/docs/software/concepts/index.html) | 200, full | Topic directory. Prefer S30-S33 or another exact GM0 page. |
| S20 | [GM0: programming options](https://gm0.org/en/latest/docs/software/getting-started/options-for-programming.html) | 200, full | Comparison of FTC programming environments. |
| S21 | [GM0: LinearOpMode vs OpMode](https://gm0.org/en/latest/docs/software/getting-started/linear-opmode-vs-opmode.html) | 200, full | Direct supplement for the OpMode lifecycle and type choice. |
| S22 | [GM0: common hardware components](https://gm0.org/en/latest/docs/software/getting-started/common-hardware-components.html) | 200, full | Hardware API overview for motors, servos, and sensors. |
| S23 | [GM0: using Android Studio](https://gm0.org/en/latest/docs/software/getting-started/using-android-studio.html) | 200, full | Android Studio workflow and setup supplement. |
| S24 | [GM0: common programming issues](https://gm0.org/en/latest/docs/software/getting-started/common-issues.html) | 200, full | Troubleshooting companion; best near verification/debugging lessons. |
| S25 | [GM0: mecanum drive](https://gm0.org/en/latest/docs/software/tutorials/mecanum-drive.html) | 200, full | Mecanum mixing and drive implementation. |
| S26 | [GM0: gamepad](https://gm0.org/en/latest/docs/software/tutorials/gamepad.html) | 200, full | Buttons, sticks, triggers, dead zones, and input use. |
| S27 | [GM0: telemetry](https://gm0.org/en/latest/docs/software/tutorials/using-telemetry.html) | 200, full | Telemetry and debugging. |
| S28 | [GM0: encoders](https://gm0.org/en/latest/docs/software/tutorials/encoders.html) | 200, full | Encoder modes, targets, and caveats. |
| S29 | [GM0: bulk reads](https://gm0.org/en/latest/docs/software/tutorials/bulk-reads.html) | 200, full | Advanced performance topic; use only after students understand normal hardware reads. |
| S30 | [GM0: control loops](https://gm0.org/en/latest/docs/software/concepts/control-loops.html) | 200, full | Feedback-loop concepts for closed-loop motion and autonomous correction. |
| S31 | [GM0: finite state machines](https://gm0.org/en/latest/docs/software/concepts/finite-state-machines.html) | 200, full | Nonblocking sequencing and autonomous/mechanism state. |
| S32 | [GM0: kinematics](https://gm0.org/en/latest/docs/software/concepts/kinematics.html) | 200, full | Coordinate motion and drivetrain math; enrichment for Units 12 and 15. |
| S33 | [GM0: odometry](https://gm0.org/en/latest/docs/software/concepts/odometry.html) | 200, full | Localization and encoder-based pose estimation. |
| S34 | [GM0 software glossary](https://gm0.org/en/latest/docs/software/software-glossary.html) | 200, full | Reference glossary, not a lesson-specific reading. Link once from a course resources page rather than from many lessons. |
| S35 | [FTC Resources programming collection](https://ftc-resources.readthedocs.io/en/latest/programming.html#general-resources) | 200, full | Third-party directory. Use for discovery, then link the primary source directly. |
| S36 | [FIRST programming resources index](https://ftc-docs.firstinspires.org/en/latest/programming_resources/index.html) | 200, full | Official directory. Prefer a precise official page; `latest` is now BIOBUZZ. |
| S37 | [FIRST vision overview](https://ftc-docs.firstinspires.org/en/latest/programming_resources/vision/vision_overview/vision-overview.html) | 200, full | Official overview of FTC vision choices. Rolling `latest`. |
| S38 | [FIRST VisionPortal overview](https://ftc-docs.firstinspires.org/en/latest/apriltag/vision_portal/visionportal_overview/visionportal-overview.html) | 200, full | Direct background for VisionPortal setup. Rolling `latest`. |
| S39 | [FIRST VisionPortal camera controls](https://ftc-docs.firstinspires.org/en/latest/apriltag/vision_portal/visionportal_camera_controls/index.html) | 200, full | Exposure, gain, focus, and camera controls. |
| S40 | [FIRST camera calibration](https://ftc-docs.firstinspires.org/en/latest/programming_resources/vision/camera_calibration/camera-calibration.html) | 200, full | Calibration concepts and process. |
| S41 | [FIRST color processing](https://ftc-docs.firstinspires.org/en/latest/color_processing/index.html) | 200, full | Official color/blob processing material for OpenCV-zone lessons. |
| S42 | [FIRST AprilTag introduction](https://ftc-docs.firstinspires.org/en/latest/apriltag/vision_portal/apriltag_intro/apriltag-intro.html) | 200, full | AprilTag concepts and terminology. |
| S43 | [FIRST AprilTag detection values](https://ftc-docs.firstinspires.org/en/latest/apriltag/understanding_apriltag_detection_values/understanding-apriltag-detection-values.html) | 200, full | ID, center, range, bearing, yaw, and pose interpretation. |
| S44 | [FIRST AprilTag test images](https://ftc-docs.firstinspires.org/en/latest/apriltag/opmode_test_images/opmode-test-images.html) | 200, full | Repeatable offline/test-image workflow. |
| S45 | [Official FTC Robot Controller repository](https://github.com/FIRST-Tech-Challenge/FtcRobotController/) | 200, full | Canonical SDK source and releases. Default branch is now BIOBUZZ; link a DECODE tag/release for this course. |
| S46 | [Westside Robotics repositories](https://github.com/WestsideRobotics?tab=repositories) | 200, partial | Dynamic listing was only partly crawlable. Do not place until a specific repository and stable file/commit are selected. |

## Deep-link catalog

These replace broad home-page links where the topic is known.

### CTRL ALT FTC

| ID | Deep link | Best fit |
| --- | --- | --- |
| CA01 | [Why control theory is useful](https://www.ctrlaltftc.com/introduction-to-controls) | Motivation for feedback and closed-loop motion |
| CA02 | [Introduction to open-loop control](https://www.ctrlaltftc.com/introduction-to-open-loop-control) | Raw power, coast, and limits of open-loop control |
| CA03 | [Introduction to closed-loop control](https://www.ctrlaltftc.com/introduction-to-closed-loop-control) | Encoders, sensors, and target correction |
| CA04 | [The PID controller](https://www.ctrlaltftc.com/the-pid-controller) | Advanced feedback enrichment |
| CA05 | [Feedforward control](https://www.ctrlaltftc.com/feedforward-control) | Gravity/friction compensation and advanced path control |
| CA06 | [Motion profiling](https://www.ctrlaltftc.com/advanced/motion-profiling) | Bounded acceleration for slides and autonomous motion |
| CA07 | [FTC motor control](https://www.ctrlaltftc.com/practical-examples/ftc-motor-control) | Motor power, encoders, run modes, and practical control |
| CA08 | [Drivetrain control](https://www.ctrlaltftc.com/practical-examples/drivetrain-control) | Closed-loop drivetrain behavior |
| CA09 | [Dealing with angles](https://www.ctrlaltftc.com/practical-examples/controlling-heading) | IMU heading wraparound and turn control |

### Pedro Pathing

| ID | Deep link | Best fit |
| --- | --- | --- |
| PP01 | [Pedro Pathing introduction](https://pedropathing.com/docs/pathing) | What the library does and when to use it |
| PP02 | [Installation](https://pedropathing.com/docs/pathing/installation) | Version-sensitive setup |
| PP03 | [Tuning](https://pedropathing.com/docs/pathing/tuning) | Drivetrain/localizer/follower calibration |
| PP04 | [Creating a pose](https://pedropathing.com/docs/pathing/guide/pose-creation) | Field coordinates and heading |
| PP05 | [Creating a path](https://pedropathing.com/docs/pathing/guide/path-creation) | Lines, curves, and heading interpolation |
| PP06 | [Following a path](https://pedropathing.com/docs/pathing/guide/path-following) | Follower updates and command sequencing |
| PP07 | [Bézier curves reference](https://pedropathing.com/docs/pathing/reference/beziercurves) | Control points and curve parameterization |

## Lesson-by-lesson placement candidates

The ordering in each row is intentional: strongest/direct source first, enrichment after it. “None” means the supplied list has no source strong enough to justify a lesson-level link.

### Unit 00 — Object-oriented programming foundations

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 0.1 Classes and objects | None | The supplied sources are FTC-focused and do not directly teach Java classes well enough. |
| 0.2 Fields, constructors, methods | None | Keep the reading focused; source a dedicated Java reference later if desired. |
| 0.3 References and identity | None | No direct match in `linkList.txt`. |
| 0.4 Objects working together | None | No direct match in `linkList.txt`. |
| 0.5 Static and nested members | None | No direct match in `linkList.txt`. |

### Unit 01 — Development environment and first OpMode

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 1.1 Prerequisites | S16, S20 | Compare programming environments and explain why this course uses Android Studio/Java. |
| 1.2 Install JDK | S23 | Use only the relevant Android Studio/JDK section; verify current versions. |
| 1.3 Install Android Studio | S23 | Direct setup companion. |
| 1.4 Configure JDK | S23 | Verify screenshots and Gradle JDK labels against the current IDE. |
| 1.5 Get FTC SDK | S45 | Link a DECODE release/tag, not the default branch. |
| 1.6 Open project | S23, S45 | Android Studio workflow plus the pinned SDK README. |
| 1.7 Verify build configuration | S24, S45 | Troubleshooting plus the pinned SDK release notes/README. |
| 1.8 First OpMode | S21, S14 | OpMode models first; team-authored overview only as optional context. |
| 1.9 Connect Control Hub | S24 | Useful troubleshooting, but a precise official Control Hub page should be added later. |
| 1.10 Verification checklist | S24 | Strong “if the check failed” follow-up. |

### Unit 02 — OpMode structure and lifecycle

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 2.1 Registering programs | S21 | Context for annotated OpMode types. |
| 2.2 `init()` method | S21 | Compare iterative lifecycle stages. |
| 2.3 `loop()` lifecycle | S21 | Direct comparison with LinearOpMode. |
| 2.4 Start and stop | S21 | Lifecycle reference. |
| 2.5 Health-check challenge | S27, S24 | Telemetry for observation, common issues for diagnosis. |
| 2.6 Choosing OpMode type | S21, S16 | Direct comparison first; language/environment page second. |
| 2.7 Mastery coding challenge | S21, S27 | Lifecycle recap and telemetry debugging. |

### Unit 03 — Variables and data types

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 3.1 String literals | None | No direct match in `linkList.txt`. |
| 3.2 Double precision | None | No direct match in `linkList.txt`. |
| 3.3 Boolean flags | None | No direct match in `linkList.txt`. |
| 3.4 Integer data types | None | No direct match in `linkList.txt`. |
| 3.5 Dynamic power challenge | S27 | Telemetry is useful for observing changing values; it is not a data-types tutorial. |
| 3.6 Mastery coding challenge | S27 | Optional debugging aid only. |

### Unit 04 — Gamepad input

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 4.1 Button toggles | S26 | Direct gamepad reference. |
| 4.2 Joystick scaling | S26 | Direct stick/dead-zone context. |
| 4.3 Trigger inputs | S26 | Direct gamepad reference. |
| 4.4 Sensitivity curves | S26 | Input context; a dedicated shaping reference would still be useful. |
| 4.5 Arcade-drive challenge | S26, S25 | Inputs first, drivetrain mixing second. |
| 4.6 Mastery coding challenge | S26, S25 | Same pair as a unit recap. |

### Unit 05 — Conditional logic

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 5.1 If statements | None | No direct Java-control-flow source in `linkList.txt`. |
| 5.2 Else-if chaining | None | No direct match in `linkList.txt`. |
| 5.3 Comparison operators | None | No direct match in `linkList.txt`. |
| 5.4 Logical operators | None | No direct match in `linkList.txt`. |
| 5.5 Intake logic challenge | S22 | Hardware context only; do not imply it teaches conditional syntax. |
| 5.6 Mastery coding challenge | S22 | Optional mechanism/hardware context. |

### Unit 06 — Loops, timing, and nonblocking code

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 6.1 `opModeIsActive()` | S21 | Linear versus iterative lifecycle context. |
| 6.2 For loops | None | No direct Java-loop source in `linkList.txt`. |
| 6.3 Runtime timing | S27 | Telemetry can expose elapsed time; not a timing tutorial. |
| 6.4 Hardware arrays | S22 | Identifies common device types; a Java arrays reference would be stronger. |
| 6.5 Nonblocking timer | S31 | Strong conceptual follow-up for state-based, nonblocking behavior. |
| 6.6 Mastery coding challenge | S31 | State-machine enrichment after the challenge. |

### Unit 07 — Hardware mapping and mechanism classes

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 7.1 HardwareMap object | S22 | Common FTC device types and APIs. |
| 7.2 DcMotor mapping | S22, CA07 | Hardware overview followed by practical motor control. |
| 7.3 Sensor mapping | S22 | Broad sensor/device context. |
| 7.4 Name mismatches | S24, S22 | Troubleshooting first, expected hardware names/types second. |
| 7.5 Mechanism classes | S22 | Hardware context only; add a dedicated Java composition reference later if desired. |
| 7.6 Mastery coding challenge | S22, S24 | Hardware recap and troubleshooting. |

### Unit 08 — DC motor behavior

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 8.1 Set power | CA07, S22 | Practical motor control first. |
| 8.2 Set direction | CA07, S25 | Motor behavior plus drivetrain direction context. |
| 8.3 Zero-power behavior | CA07, CA02 | Practical SDK use plus the open-loop mental model. |
| 8.4 Coast vs stop | CA02, CA07 | Explain why an unpowered mechanism can continue moving. |
| 8.5 Linear-slide challenge | S28, CA07 | Encoder follow-up is useful even if the challenge begins with power. |
| 8.6 Mastery coding challenge | CA07, S28, CA03 | Motor control, encoders, then closed-loop enrichment. |

### Unit 09 — Servo control

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 9.1 Set position | S22 | Common servo API and hardware context. |
| 9.2 Scale range | S22 | Supplement only; ensure the lesson remains the source of truth for endpoint safety. |
| 9.3 Servo direction | S22 | Broad servo context. |
| 9.4 Continuous-rotation servo | S22, CA02 | Hardware distinction plus open-loop behavior. |
| 9.5 Dual-servo challenge | S22 | Hardware context; no direct mirrored-servo source was supplied. |
| 9.6 Mastery coding challenge | S22 | Keep to one concise reference. |

### Unit 10 — Encoders and position control

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 10.1 Get current position | S28, CA07 | Direct encoder tutorial followed by broader motor control. |
| 10.2 Ticks to distance | S28 | Direct match. |
| 10.3 Run to position | S28, CA03 | SDK encoder mode plus closed-loop concept. |
| 10.4 Run using encoder | S28, CA08 | Encoder behavior plus drivetrain application. |
| 10.5 Drive and stop | S28, CA03 | Target feedback and stopping behavior. |
| 10.6 Mastery coding challenge | S28, CA04, CA06 | Core encoder reference first; PID and profiling are optional enrichment. |

### Unit 11 — Sensors and sensor-gated mechanisms

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 11.1 Touch sensor | S22 | General sensor API context. |
| 11.2 Potentiometer | S22 | General analog-sensor context; a dedicated REV potentiometer page would be stronger. |
| 11.3 Color sensor | S22 | Physical color sensor only; do not substitute S41, which is camera color processing. |
| 11.4 Distance sensor | S22 | General distance-sensor context. |
| 11.5 Sensor-gated intake | S31, S22, CA03 | State/sequence thinking, hardware context, then feedback enrichment. |
| 11.6 Mastery coding challenge | S31, CA03 | State machines and closed-loop thinking. |

### Unit 12 — IMU and field-centric drive

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 12.1 IMU initialization | S22 | General hardware context; add a season-pinned official IMU page before publication if available. |
| 12.2 Yaw data | CA09, S32 | Heading handling first, kinematics second. |
| 12.3 Field-centric drive | S25, S32, CA09 | Mecanum implementation, coordinate math, then angle handling. |
| 12.4 Pitch and roll | CA09 | Angle conventions are useful, though the page focuses primarily on heading. |
| 12.5 IMU turn | CA09, CA04 | Wrapped heading error followed by PID enrichment. |
| 12.6 Mastery coding challenge | CA09, S32, CA04 | Heading, kinematics, and optional feedback control. |

### Unit 13 — Robot architecture and subsystem integration

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 13.1 Encapsulation | None | No direct Java OOP reference in `linkList.txt`. |
| 13.2 Inheritance | None | No direct Java OOP reference in `linkList.txt`. |
| 13.3 Override | None | No direct Java OOP reference in `linkList.txt`. |
| 13.4 Static constants | None | No direct Java-language reference in `linkList.txt`. |
| 13.5 Robot class | S31 | Optional architecture perspective for stateful subsystems; not a class-design tutorial. |
| 13.6 Build intake | S22, CA07 | Hardware overview and motor control. |
| 13.6 Mastery coding challenge | S31, S22 | Sequencing plus hardware recap. |
| 13.7 Build lift | S28, CA03, CA06 | Encoder feedback and motion-profile enrichment. |
| 13.8 Build robot hardware | S22, S29 | Hardware organization first; bulk reads only as advanced performance enrichment. |
| 13.9 Competition TeleOp | S26, S25, S31 | Inputs, drivetrain behavior, and nonblocking subsystem states. |

### Unit 14 — Vision

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 14.1 VisionPortal | S38, S37, S39 | Portal setup, ecosystem overview, then optional camera controls. |
| 14.2 AprilTag detection | S42, S43, S38 | Concepts, returned values, then portal context. |
| 14.3 Pose data | S43, S11 | Detection pose fields followed by broader spatial-awareness concepts. |
| 14.4 OpenCV zones | S02, S41, S40 | Pipeline structure, official color processing, then calibration. |
| 14.5 Multi-zone challenge | S02, S41, S44 | Pipeline/color references; test images provide a repeatable testing model even though they are AprilTag-focused. |
| 14.6 Mastery coding challenge | S38, S43, S02 | VisionPortal and detection values first; EasyOpenCV only if the challenge uses a custom pipeline. |

### Unit 15 — Advanced autonomous

| Lesson | Suggested further information | Placement note |
| --- | --- | --- |
| 15.1 Limelight | S11 | Spatial-awareness enrichment only. Add official Limelight FTC documentation before publication. |
| 15.2 Pedro Pathing | PP01, PP02, PP03, S09 | Overview, installation, tuning, then source repository. Pin one Pedro release across lesson and links. |
| 15.3 Bézier curves | PP07, PP05, PP04 | Curve reference, path construction, then poses/coordinate inputs. |
| 15.4 Limelight fusion | PP06, S30, CA03, CA05 | Path updates and feedback concepts; add an official Limelight localization/fusion source later. |
| 15.5 Full autonomous | PP04, PP05, PP06, S31 | Pose, path, following, and nonblocking sequence organization. S05 is only a candidate after human review. |
| 15.6 Mastery coding challenge | PP03, PP06, S30, CA06 | Tuning, path execution, feedback loops, and motion profiling. |

## Sources to hold back

Do not add these to lessons in the first placement pass:

- S05-S07 until a person watches each complete video and verifies code, terminology, pacing, and season/version.
- S08 because it is a PowerPlay-era fork.
- S12 unless the curriculum intentionally introduces FTCLib as a separate framework.
- S15 because a raw `build.gradle` file is not stable installation guidance.
- S18 because the crawled page is too broad for a lesson-level citation.
- S34 from individual lessons; place it once in a general course-resources area if desired.
- S46 until a specific repository/file/commit is selected and reviewed.
- S04, S19, S36 when an exact page is already available.

## Ongoing validation checklist

- Keep the lesson text authoritative; label links as “Further information,” not required steps.
- Prefer primary sources: FIRST, the FTC SDK repository, and a library’s own documentation.
- Use the source IDs in commit notes so link replacements remain traceable.
- Recheck final URLs when dependency or season versions change.
- Pin versions/releases wherever code or Gradle syntax is involved.
- Check external pages against the exact SDK, Java, Android Studio, and library versions taught by the course.
- Add an archival warning anywhere a DECODE lesson links to rolling BIOBUZZ documentation.
- Do not embed a video based on metadata alone.
