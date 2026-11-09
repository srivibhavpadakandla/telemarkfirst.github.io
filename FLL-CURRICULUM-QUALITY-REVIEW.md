# FLL lesson quality review

Reviewed November 8, 2026. Fifteen unit agents each reviewed the five lessons in one FLL unit for technical accuracy, simulator alignment, and ease of comprehension. This is an audit; lesson content and simulator behavior were not changed.

## Method and scope

- All 75 worked-example Python snippets executed in the local FLL simulator shim with the course setup and produced no Python runtime errors. Successful execution does not establish that a route completes its stated mission.
- Agents compared lesson instructions with the actual editor starter, field geometry, challenge checks, and applicable Pybricks documentation. Physical-robot behavior was not tested.
- Severity describes the effect on a learner: **high** means a stated activity cannot be completed as described or its result is materially misleading; **medium** means a learner needs unstated setup or a correction; **low** means a smaller clarity or accuracy issue.

## Findings by unit

### F0 — FLL introduction and first routes

**Verdict:** revise practice instructions. F0.1–F0.4 load the same 300 mm starter, which differs from their worked examples.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F0.1](fll/fll-unit-00/0.1-what-is-fll-challenge.mdx) | Medium: “Run the starter” does not produce the shown return-home route. | Load the example or tell learners to enter it first. |
| [F0.2](fll/fll-unit-00/0.2-spike-app-and-simulator.mdx) | Medium: “full course setup” omits devices in the editor; example and starter drive different distances; “reset” does not name the UI control. | Align setup and distance; describe **Restore starter** accurately. |
| [F0.3](fll/fll-unit-00/0.3-motor-pairs-and-distance.mdx) | Low: the forward/backward trial needs an explicit edit sequence. | Show exactly which command to add or replace. |
| [F0.4](fll/fll-unit-00/0.4-turns-and-steering.mdx) | High: “change the second turn” is impossible in the loaded starter, which has no turns. | Load the four-command route or explicitly ask learners to copy it. |
| [F0.5](fll/fll-unit-00/0.5-precision-route-challenge.mdx) | Medium: “Use Reset” names a nonexistent control. | Say “Run Python again”; select the **Practice** view for its line/home landmarks. |

The introduction should also say that this course covers the Robot Game with SPIKE Prime/Pybricks; FLL Challenge has additional components, and the current season has Founders and Future Editions ([FIRST program overview](https://www.firstinspires.org/programs/fll/), [season materials](https://www.firstinspires.org/resources/library/fll/season-materials)).

### F1 — sensors and attachments

**Verdict:** needs revision; two worked activities disagree with the simulated field.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F1.1](fll/fll-unit-01/1.1-color-and-reflected-light.mdx) | Medium: the physical line-seeking loop has no timeout; the example prints only its initial reading. | Add a time limit and show how to inspect a dark reading. |
| [F1.2](fll/fll-unit-01/1.2-distance-and-wait-until.mdx) | High: the route at z=38 misses the obstacle at (20,0) and times out at (-70,38). | Align the route with the named obstacle or name the actual target. |
| [F1.3](fll/fll-unit-01/1.3-hub-heading.mdx) | Low: “mark north” suggests an absolute compass bearing. | Say “mark the launch heading as 0°”; define IMU. |
| [F1.4](fll/fll-unit-01/1.4-attachment-motors.mdx) | Medium: “drive to the red object” has no route guidance, and the starter stops far short. | Provide approach waypoints and explain the repeated `attachment` setup. |
| [F1.5](fll/fll-unit-01/1.5-retrieve-deliver-challenge.mdx) | High: the worked route activates the target but does not retrieve, deliver, or return home; the challenge checks omit home. | Label it a partial route and add checkpoints, or supply a complete route; align checks with the stated goal. |

F1.1–F1.4 share one unit starter although their activities require different code.

### F2 — functions and mission planning

**Verdict:** needs revision for beginners. Appending any F2.1–F2.4 example to the preloaded route causes a field-boundary collision, and the lessons do not tell learners to replace that route.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F2.1](fll/fll-unit-02/2.1-my-blocks.mdx) | Medium: first function lesson omits `def`, indentation, parameter/argument, and call explanation. | Add a compact annotated example and a function-focused reference. |
| [F2.2](fll/fll-unit-02/2.2-launch-plan-and-home.mdx) | Low: the proposed “action” is absent from the return-route example. | Name it a return-route test or add an attachment action. |
| [F2.3](fll/fll-unit-02/2.3-calibration-and-repeatability.mdx) | Medium: three identical simulator runs produce identical results; the displayed table instead shows fixed ±2% wheel-bias profiles. | Ask for one run and profile comparison; reserve run-to-run scatter for physical trials. |
| [F2.4](fll/fll-unit-02/2.4-mission-order-and-time.mdx) | Medium: the example prints milliseconds while practice adds seconds. | Print seconds with a unit label; distinguish simulated driving from human setup time. |
| [F2.5](fll/fll-unit-02/2.5-mission-run-capstone.mdx) | High: the worked route returns home but completes none of its stated field objectives. | Provide staged target, pickup, release, and return checkpoints. |

### F3 — Python values and output

**Verdict:** revise practice instructions. F3.1–F3.4 use a shared short starter, so exercises refer to absent variables or output.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F3.1](fll/fll-unit-03/3.1-python-values.mdx) | Medium: starter has no printed value; example leaves `turn_deg` unused and never shows a decimal. | Load the example; use or remove `turn_deg` and show a decimal. |
| [F3.2](fll/fll-unit-03/3.2-variables-and-units.mdx) | High: learners are asked to change `TARGET_CM`, absent from the editor. | Load the conversion example or give a copy step. |
| [F3.3](fll/fll-unit-03/3.3-math-for-motion.mdx) | Medium: starter has no clearance variable; example prints the calculated value after moving. | Load the example and print before driving. |
| [F3.4](fll/fll-unit-03/3.4-strings-and-output.mdx) | High: starter prints nothing; `print()` on a connected physical robot appears in the Pybricks Code output pane. | Load the example; tell learners where to read its output. |
| [F3.5](fll/fll-unit-03/3.5-data-check-challenge.mdx) | Medium: blank challenge starter has no `target_cm` to “change twice”; unspecified trial values can fail a check expecting a 300 mm endpoint. | Specify trial values, then restore 30 cm for submission, or assess the conversion directly. |

### F4 — decisions

**Verdict:** needs revision. F4.1–F4.4 load the same unrelated `if` starter; the later state and cue examples do not demonstrate their stated behavior.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F4.1](fll/fll-unit-04/4.1-compare-readings.mdx) | Medium: practice requires lists before they are taught in F6.4; the example only prints `False` from its initial 1230 mm reading. | Use three explicit boundary trials and show expected results. |
| [F4.2](fll/fll-unit-04/4.2-if-elif-else.mdx) | Medium: starter has no `elif`/`else`; the example reaches only one branch. | Load the branch example and give test values for all branches. |
| [F4.3](fll/fll-unit-04/4.3-and-or-not.mdx) | Medium: `or` is introduced but never used; “truth table” is not defined. | Explain the table and include a true `or` case. |
| [F4.4](fll/fll-unit-04/4.4-thresholds-and-hysteresis.mdx) | High: resetting `on_line=False` each run cannot retain state for the requested 50→29→35→41 sequence. | Show the sequence in one run, preserving state, with `False, True, True, False` outputs. |
| [F4.5](fll/fll-unit-04/4.5-decision-challenge.mdx) | High: the route times out at (-60,38), before the line; the obstacle is off its path, and checks do not verify line/timeout cases. | Provide routes that meet each cue, or explicitly frame threshold edits as branch tests. |

### F5 — loops and timing

**Verdict:** needs revision. F5.1–F5.4 load the same forward-loop starter despite different requested activities.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F5.1](fll/fll-unit-05/5.1-for-range.mdx) | Medium: the loaded starter lacks the worked example's out-and-back route and printed count. | Load the example or give a replacement step. |
| [F5.2](fll/fll-unit-05/5.2-while-and-stop.mdx) | Medium: starter has no sensor loop; the physical activity can run indefinitely if the line is missed. | Load the loop example, choose **Practice**, and add a time limit. |
| [F5.3](fll/fll-unit-05/5.3-wait-and-stopwatch.mdx) | Medium: starter has no watch/speed controls; text says a `wait(100)` can enlarge a printed time that is read before the wait. | Show two speed trials and correct the timing explanation. |
| [F5.4](fll/fll-unit-05/5.4-timeouts.mdx) | High: three seconds at 120 mm/s cannot reach the line ~770 mm away, so both proposed tests time out. | Use an approximately eight-second limit and clarify the exit-reason test. |
| [F5.5](fll/fll-unit-05/5.5-loop-challenge.mdx) | High: the route times out at (-60,38); it encounters neither the line nor the off-path obstacle. “Reset the program” is not a UI action. | Supply test routes or launch positions for each cue; say “Run Python again.” |

### F6 — functions and routes

**Verdict:** revise before beginner use. F6.1–F6.4 load the same `drive_segment(300)` starter, although their instructions assume lesson-specific code.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F6.1](fll/fll-unit-06/6.1-function-definitions.mdx) | Medium: removing `leave_home()` does not stop motion if the example was appended to the starter; “Reset” is not a control. | Tell learners to replace the starter and use **Run Python** for fresh runs. |
| [F6.2](fll/fll-unit-06/6.2-parameters-and-return.mdx) | High: `max_mm` is a parameter, not the editable call value; 250 and 350 mm both stop before the line. The function checks only the endpoint. | Change the argument and test distances that yield different outcomes, such as 700 and 800 mm. |
| [F6.3](fll/fll-unit-06/6.3-scope-and-constants.mdx) | Medium: only one `is_on_line()` call is shown, and threshold edits at the starting white surface still print `False`. | Show readings and calls before and on the line. |
| [F6.4](fll/fll-unit-06/6.4-lists-and-routes.mdx) | Medium: the loaded editor has no route list or “second pair.” | Load the example and explain pair unpacking in the loop. |
| [F6.5](fll/fll-unit-06/6.5-function-challenge.mdx) | High: example omits the requested printed segment count; checks allow a route that does not return home. | Print the count and add checks for home and count, or narrow the stated requirements. |

### F7 — attachment motors

**Verdict:** revise before release. The reversed-motor demonstration is visually wrong in the simulator, and the capstone checks allow a route that never reaches its target.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F7.1](fll/fll-unit-07/7.1-motor-directions.mdx) | High: example prints a 30° tool angle, but the simulator clamps the reversed visual pose to 0°; it also constructs a second motor on Port E. | Display reversed attachment movement; edit the existing Port E constructor instead of creating a duplicate. |
| [F7.2](fll/fll-unit-07/7.2-motor-angles.mdx) | Medium: starter lacks `start_deg` and a return command; changing the first move to 60° while retaining −90° ends at −30°, which the visual clamps to 0°. | Load the example; explain the −30° result or use a matching −60° return. |
| [F7.3](fll/fll-unit-07/7.3-motor-targets.mdx) | Medium: `CLOSED_DEG` and `run_target()` are absent from the starter. | Load the example or give an explicit replacement step. |
| [F7.4](fll/fll-unit-07/7.4-gearing-and-stalls.mdx) | Medium: hardware comments imply adding another `Motor(Port.E, gears=...)` beneath the existing Port E setup. | Instruct learners to edit the existing constructor on their robot. |
| [F7.5](fll/fll-unit-07/7.5-attachment-control-challenge.mdx) | High: route returns home without reaching the target, but all challenge checks pass; code also combines navigation and tool actions despite asking for separate functions. | Add a target waypoint, separate functions, and checks for `targetActive`, tool return, and home. |

### F8 — drive-base geometry and navigation

**Verdict:** revise practice setup and two prompts. F8.1–F8.4 examples run when they replace the starter; appending them to it causes a field-boundary collision. F8.5 passes its stated route checks.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F8.1](fll/fll-unit-08/8.1-drivebase-geometry.mdx) | Medium: the starter has no wheel-diameter variable to change. | Load the example; compare 56 and 70 mm. |
| [F8.2](fll/fll-unit-08/8.2-straight-and-turn.mdx) | Medium: the starter differs from the route, and the corner-prediction task lacks coordinate scaffolding. | Replace the starter; predict the corner at approximately (-70,38) cm before stepping. |
| [F8.3](fll/fll-unit-08/8.3-curves-and-settings.mdx) | Medium: starter has no arcs/settings; example stays near home, so an obstacle-clearance check is not meaningful. | Load the arc example and test its footprint or use a route near the obstacle. |
| [F8.4](fll/fll-unit-08/8.4-drive-and-heading.mdx) | Medium: starter has no continuous drive, timer, or heading output. | Load the example and give the expected ~+15° heading after one second. |
| [F8.5](fll/fll-unit-08/8.5-navigation-challenge.mdx) | Low: requested heading check after the longest segment occurs only at the end of the example. | Print heading immediately after that 850 mm segment; specify **Practice** view. |

### F9 — color and line sensing

**Verdict:** revise before beginner use. The shared starter is an unbounded line-seeking loop; several worked examples do not reach the sensor cue they discuss.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F9.1](fll/fll-unit-09/9.1-reflection-calibration.mdx) | High: a 750 mm drive stops before the dark line; both five-reading lists contain only 78%, yielding a misleading 78% threshold. | Drive about 800 mm to the line, show both ranges, and confirm a gap. |
| [F9.2](fll/fll-unit-09/9.2-line-stop.mdx) | High: the three-second limit stops at x=-70 cm at 100 mm/s and x=-40 cm at 200 mm/s, before the line. | Use a limit long enough for both speeds to reach the line and record the exit cause. |
| [F9.3](fll/fll-unit-09/9.3-color-classification.mdx) | Medium: example only prints `BLUE` at home; its `Color.GREEN` branch is not exercised and no route is given. | Supply a reachable color-zone route and expected label. |
| [F9.4](fll/fll-unit-09/9.4-line-following.mdx) | Medium: the 300 ms example moves about 1.2 cm on white mat, so it does not follow an edge. | Call it a steering-sign test; give a physical line-edge launch for actual following. |
| [F9.5](fll/fll-unit-09/9.5-sensor-route-challenge.mdx) | High: code omits requested elapsed time and stop reason; checks cover only the line-stop run, not the timeout trial. | Print time and explicit reason; validate or manually review the second trial. |

### F10 — range, force, and heading sensors

**Verdict:** revise before teaching. F10.1–F10.4 share a range/heading starter that omits actions requested by the individual lessons.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F10.1](fll/fll-unit-10/10.1-ultrasonic-range.mdx) | Medium: the route toward the fixed obstacle is not supplied; straight travel from home misses it, while the shown reading is to the yellow target. | Give an obstacle-facing route and a second reading, or name the visible target. |
| [F10.2](fll/fll-unit-10/10.2-force-contact.mdx) | Medium: starter has no force/tool action; example creates another Port F sensor, and the requested physical force measurement never calls `force()`. | Use the existing sensor, stage an approach, and demonstrate `force_sensor.force()`. |
| [F10.3](fll/fll-unit-10/10.3-imu-heading.mdx) | High: with gyro control disabled, `robot.reset(angle=0)` does not reset `hub.imu.heading()`; after a prior 45° turn, reset, and 90° turn, it reads 135°. | Teach `hub.imu.reset_heading(0)` or enable gyro; show a prior turn to make reset observable. |
| [F10.4](fll/fll-unit-10/10.4-sensor-fallback.mdx) | High: proposed 100 and 2000 mm values both stop, so the move branch is never demonstrated; the loop overwrites injected values. | Test 100, a valid >150 mm value, and 2000 in a helper; show each expected branch. |
| [F10.5](fll/fll-unit-10/10.5-sensor-fusion-challenge.mdx) | High: code starts driving before validating range and times out 991 mm from target; checks can pass without movement. | Validate before motion; use a reachable route and check movement, stop, and clearance. |

### F11 — mission construction

**Verdict:** revise before beginner use. Appending any F11.1–F11.4 example to the shared preloaded route causes a boundary collision; each needs a replacement instruction or its own starter.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F11.1](fll/fll-unit-11/11.1-mission-decomposition.mdx) | High: example returns home without reaching or verifying the target; running `return_home(300)` alone from the initial pose crosses a boundary. | Label it a structure fragment or reach the target; state start-pose requirements for function tests. |
| [F11.2](fll/fll-unit-11/11.2-attachment-geometry.mdx) | High: example stops far from target and shows one tool angle; fixed-radius simulator collisions cannot verify tool-sweep clearance. | Show both tool poses and a nearby route; reserve swept clearance validation for the physical build. |
| [F11.3](fll/fll-unit-11/11.3-launch-programs.mdx) | Medium: “target” and “line” branches end before their named landmarks. | Name them menu demonstrations or supply routes that reach the landmarks. |
| [F11.4](fll/fll-unit-11/11.4-parallel-actions.mdx) | Medium: uncommenting the hardware option adds actions to the sequential program, preventing a clean timing comparison. | Show separate replacement programs, timed from the same start pose. |
| [F11.5](fll/fll-unit-11/11.5-mission-cycle-challenge.mdx) | High: example returns home but reaches neither target nor delivery and omits the requested elapsed print; checks omit return home. | Provide staged route checkpoints and add the home check. |

### F12 — calibration and reliability

**Verdict:** revise simulator exercises and capstone checks. The physical calibration formulas are correct, but applying their hypothetical numbers to an already accurate simulator gives misleading comparisons.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F12.1](fll/fll-unit-12/12.1-repeatability-data.mdx) | Low: the worked statistics use sample times without running a route; practice switches to an unrelated 300 mm starter. | Label sample physical data and state which route to use for the profile comparison. |
| [F12.2](fll/fll-unit-12/12.2-calibrate-diameter.mdx) | Medium: 53.76 mm is correct for a physical 480 mm result, but entering it in the default simulator makes a commanded 500 mm drive travel 520.83 mm; starter drives 300 mm. | Separate physical calibration from a simulator sensitivity trial and give explicit setup edits. |
| [F12.3](fll/fll-unit-12/12.3-calibrate-track.mdx) | Medium: 107.52 mm is correct for a physical 375° result, but it makes a default simulated 360° command reach 345.6°; starter has no turn. | State the measurement assumption and provide a 360° simulator comparison. |
| [F12.4](fll/fll-unit-12/12.4-failure-recovery.mdx) | High: normal and forced-failure runs both stop before the dark line and print “Skip tool action”; 150 mm retreat does not retrace a ~225 mm approach. | Use a bounded route that reaches the line; call 150 mm a retreat or measure distance for a return. |
| [F12.5](fll/fll-unit-12/12.5-reliability-challenge.mdx) | High: an 810 mm out-and-back route passes all checks even though the −2% profile never crosses the line; the profile table has no per-profile time requested by the lesson. | Check line crossing and home for each profile; add elapsed time to profiles or revise the record request. |

### F13 — match planning

**Verdict:** revise before beginner use. F13.1–F13.4 are planning-only snippets and do not match the shared moving starter or the physical outcomes requested in practice.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F13.1](fll/fll-unit-13/13.1-mission-value.mdx) | Medium: example estimates one mission at 16 expected points but shows no second mission or time. | Show two named point/probability/time estimates and label expected points as an estimate. |
| [F13.2](fll/fll-unit-13/13.2-time-budget.mdx) | Medium: example correctly totals 131 seconds, but starter has no `mission_times_s` to replace and no timing-data collection steps. | Explain how to time three comparable routes, convert milliseconds to seconds, and replace the starter. |
| [F13.3](fll/fll-unit-13/13.3-route-order.mdx) | High: reordering a list of printed names cannot change elapsed time or ending pose as requested. | Compare two executable route-function orders. |
| [F13.4](fll/fll-unit-13/13.4-risk-and-recovery.mdx) | Medium: example prints a planning choice but never runs a fallback route; its variables are absent from the starter. | Call it a decision-table test with values for each branch, or add executable fallback calls. |
| [F13.5](fll/fll-unit-13/13.5-match-plan-challenge.mdx) | High: “two launches” execute continuously, with no handling pause, per-launch scores, or fallback; only one of three calibration profiles returns home, while checks omit those requirements. | Show a between-launch handoff and per-launch record, add fallback, make the route reliable, and align checks or manual evidence. |

### F14 — integration and final match

**Verdict:** revise F14.1, F14.2, and F14.4. F14.5 meets its simulated target, delivery, home, and time goals.

| Lesson | Finding | Recommended change |
| --- | --- | --- |
| [F14.1](fll/fll-unit-14/14.1-program-architecture.mdx) | Medium: named wheel/track constants never configure `DriveBase`; its 250 mm “line” mission stops before the line, and practice provides no program to reorder. | Apply the constants, give a before/after reorganization task, and reach the line or call it a structure sketch. |
| [F14.2](fll/fll-unit-14/14.2-code-review.mdx) | Medium: code starts moving before range validation; both 1 and 3000 ms trials time out, and the simulator cannot test an unplugged sensor. | Validate first and show distinct exit tests; reserve unplugged-sensor handling for a physical test. |
| [F14.3](fll/fll-unit-14/14.3-integration-test.mdx) | Low: three unchanged simulator runs give the same deterministic 3375 ms result. | Compare calibration profiles or use physical trials to study variability. |
| [F14.4](fll/fll-unit-14/14.4-rehearsal.mdx) | High: “line” and “target” launches reach neither objective; example has no return, relaunch, or handling time despite the full-match recording task. | Call it a logging sketch or supply an actual multi-launch rehearsal. |
| [F14.5](fll/fll-unit-14/14.5-full-match-capstone.mdx) | Pass, low note: example activates target, delivers object, returns home in 36.825 simulated seconds; five-trial and failed-cue evidence is not assessed by checks. | Provide a trial log and failed-cue checklist for manual submission. |

## Recommended repair order

1. **Align lessons with the editor.** Give each lesson its own starter program, or add an explicit “replace the starter with the worked example” step. The current [unit-level starter map](src/telemark/fllPythonPractice.ts) creates a mismatch in most lessons. Tell students to choose **Practice** for line, obstacle, target, and delivery exercises; BIOGLOW is a visual preview of a different field.
2. **Make demonstrations produce their named result.** Fix routes and timeouts that never reach the line, obstacle, target, or delivery area. Label partial snippets as scaffolds and provide waypoints and expected output for each trial.
3. **Align challenge checks with stated goals.** In particular, review F1.5, F6.5, F7.5, F9.5, F10.5, F11.5, F12.5, and F13.5. Treat evidence tasks such as physical trials and written recovery plans as manual submissions when the simulator cannot assess them.
4. **Correct technical and measurement explanations.** Prioritize the F7.1 reversed attachment visual, F10.3 IMU reset claim, F4.4 hysteresis state, and physical-calibration versus simulator examples in F12. Show units beside time and distance readings.
5. **Add beginner scaffolding.** Give exact edit steps, expected intermediate outputs, starting positions, and a clear stop condition for physical sensor loops. Correct “Reset” wording to match the actual UI.

The [Pybricks reference](https://docs.pybricks.com/en/stable/) and [FIRST season materials](https://www.firstinspires.org/resources/library/fll/season-materials) were used for API and competition context. The report's route outcomes are specific to Telemark's fixed practice field, not predictions of physical-robot performance.
