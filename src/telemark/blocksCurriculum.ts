import type {CurriculumLesson, CurriculumUnit, Tier} from './curriculum';

interface BlocksUnitSeed {
  title: string;
  desc: string;
  overview: string;
  outcomes: string[];
  lessons: Array<{slug: string; title: string; challenge?: boolean}>;
}

const BLOCKS_UNIT_SEEDS: BlocksUnitSeed[] = [
  {
    title: 'Start and Sequence Robot Programs',
    desc: 'Connect commands, start a run, and trace a route across the practice field.',
    overview: 'Start with a grid robot and an ordered program. Predict its route, inspect each step, and repair the first command that produces an unexpected result.',
    outcomes: [
      'Connect blocks into an ordered program and use the workspace controls.',
      'Explain how the start event begins a robot route.',
      'Trace position and direction after each command and repair an incorrect route.',
    ],
    lessons: [
      {slug: 'workspace-and-run-controls', title: 'The Workspace and Run Controls'},
      {slug: 'commands-in-order', title: 'Commands Run in Order'},
      {slug: 'start-blocks-and-events', title: 'Start Blocks and Events'},
      {slug: 'step-through-and-debug', title: 'Step Through and Debug a Program'},
      {slug: 'route-runner-challenge', title: 'Coding Challenge: Route Runner', challenge: true},
    ],
  },
  {
    title: 'Values and Robot State',
    desc: 'Represent distances, status text, Boolean flags, and changing mission values.',
    overview: 'Robot programs use values to represent route plans, readings, and status. Choose a data type, store a value, update it, and inspect the result during a run.',
    outcomes: [
      'Distinguish numeric measurements from text labels and Boolean flags.',
      'Create, set, read, and change variables that represent robot state.',
      'Calculate a planned value and trace each change in the workspace.',
    ],
    lessons: [
      {slug: 'numbers-text-booleans', title: 'Numbers, Text, and True or False'},
      {slug: 'set-and-change-variables', title: 'Create, Set, and Change Variables'},
      {slug: 'math-and-text-expressions', title: 'Math and Text Expressions'},
      {slug: 'input-output-tracing', title: 'Inputs, Outputs, and Value Tracing'},
      {slug: 'score-tracker-challenge', title: 'Coding Challenge: Score Tracker', challenge: true},
    ],
  },
  {
    title: 'Conditions and Control',
    desc: 'Use comparisons and Boolean rules to select a response to test data.',
    overview: 'A condition has a true-or-false result. Compare a test reading with a threshold, select one branch, and check the boundary where that selection changes.',
    outcomes: [
      'Compare a test reading with a threshold and identify its Boolean result.',
      'Order if, else if, and else branches so the intended response runs.',
      'Combine readiness and acceptance rules with and, or, and not.',
    ],
    lessons: [
      {slug: 'compare-values', title: 'Compare Two Values'},
      {slug: 'choose-with-if', title: 'Make a Choice with If'},
      {slug: 'else-and-else-if', title: 'Use Else and Else If'},
      {slug: 'and-or-not', title: 'Combine Rules with And, Or, and Not'},
      {slug: 'package-sorter-challenge', title: 'Coding Challenge: Package Sorter', challenge: true},
    ],
  },
  {
    title: 'Loops for Movement and Scanning',
    desc: 'Repeat route steps, count field positions, and stop a loop at the right time.',
    overview: 'Loops express repeated route steps and scan positions. Choose a count or condition, calculate how many actions will run, and check the stopping rule.',
    outcomes: [
      'Use fixed-count, condition-controlled, and counting loops for repeated work.',
      'Trace movement counts and locate off-by-one errors.',
      'Use nested loops for a scan and repair a loop that does not stop.',
    ],
    lessons: [
      {slug: 'repeat-known-count', title: 'Repeat a Known Number of Times'},
      {slug: 'repeat-while-true', title: 'Repeat While a Rule Is True'},
      {slug: 'counting-loops', title: 'Counting Loops and Loop Variables'},
      {slug: 'nested-and-nonstop-loops', title: 'Nested Loops and Programs That Do Not Stop'},
      {slug: 'grid-scanner-challenge', title: 'Coding Challenge: Grid Scanner', challenge: true},
    ],
  },
  {
    title: 'Functions and Route Data',
    desc: 'Reuse named routines and process ordered route or measurement values.',
    overview: 'Functions group repeated robot tasks under clear names. Lists keep route values in order. Use parameters, returns, and loops to process the same data without copying commands.',
    outcomes: [
      'Define and call a named routine from the main program.',
      'Pass a route value into a function and use a returned result.',
      'Read planned values by index and process each item with a loop.',
    ],
    lessons: [
      {slug: 'define-and-call-functions', title: 'Define and Call a Function'},
      {slug: 'function-parameters', title: 'Give Information to a Function'},
      {slug: 'return-a-result', title: 'Return a Result'},
      {slug: 'store-and-process-lists', title: 'Store and Process a List'},
      {slug: 'data-report-challenge', title: 'Coding Challenge: Data Report', challenge: true},
    ],
  },
  {
    title: 'Build and Test a Robot Program',
    desc: 'Combine the foundations, test boundaries, and recognize the same flow in Java.',
    overview: 'Plan a small robot control program, test its parts with normal and boundary inputs, and match block structures to text code before moving to a robotics track.',
    outcomes: [
      'Split a mission requirement into data, decisions, route actions, and reports.',
      'Test normal and boundary values while tracing program state.',
      'Recognize the same variables, conditions, loops, and functions in Java.',
    ],
    lessons: [
      {slug: 'break-programs-into-parts', title: 'Break a Program into Smaller Parts'},
      {slug: 'combine-programming-tools', title: 'Combine State, Decisions, Loops, and Functions'},
      {slug: 'test-cases-and-debugging', title: 'Test Cases and Debugging'},
      {slug: 'blocks-beside-java', title: 'Read Blocks Beside Java-Shaped Code'},
      {slug: 'delivery-controller-challenge', title: 'Final Coding Challenge: Delivery Controller', challenge: true},
    ],
  },
];

const unitSlug = (index: number) => `blocks-unit-${String(index).padStart(2, '0')}`;

export const BLOCKS_UNITS: CurriculumUnit[] = BLOCKS_UNIT_SEEDS.map((seed, index) => {
  const slug = unitSlug(index);
  const next = BLOCKS_UNIT_SEEDS[index + 1];
  return {
    id: `BLOCKS_UNIT_${String(index).padStart(2, '0')}`,
    label: `Unit ${index}`,
    title: seed.title,
    desc: seed.desc,
    tier: 'Beginner' as Tier,
    slug,
    startPath: `/blocks/${slug}/${seed.lessons[0].slug}`,
    nextPath: next ? `/blocks/${unitSlug(index + 1)}/${next.lessons[0].slug}` : '/blocks/next-step',
    nextLabel: next ? `Unit ${index + 1}: ${next.title}` : 'Choose Your Next Step',
    lessonCount: seed.lessons.length,
    overview: seed.overview,
    outcomes: seed.outcomes,
  };
});

export const BLOCKS_LESSONS: CurriculumLesson[] = BLOCKS_UNIT_SEEDS.flatMap(
  (seed, unitIndex) => {
    const slug = unitSlug(unitIndex);
    return seed.lessons.map((lesson, lessonIndex) => ({
      id: `${slug}/${lesson.slug}`,
      label: `${unitIndex}.${lessonIndex + 1} · ${lesson.title}`,
      title: `Lesson ${unitIndex}.${lessonIndex + 1}: ${lesson.title}`,
      path: `/blocks/${slug}/${lesson.slug}`,
      unitSlug: slug,
      unitLabel: `Unit ${unitIndex}`,
      unitTitle: seed.title,
    }));
  },
);

export const BLOCKS_UNIT_COUNT = BLOCKS_UNITS.length;
export const BLOCKS_LESSON_COUNT = BLOCKS_LESSONS.length;

export function getBlocksUnitBySlug(slug: string): CurriculumUnit | undefined {
  return BLOCKS_UNITS.find((unit) => unit.slug === slug);
}

export function getBlocksLessonsForUnit(slug: string): CurriculumLesson[] {
  return BLOCKS_LESSONS.filter((lesson) => lesson.unitSlug === slug);
}

export function isBlocksChallenge(lessonId: string): boolean {
  const [unitSlugValue, lessonSlug] = lessonId.split('/');
  const index = BLOCKS_UNITS.findIndex((unit) => unit.slug === unitSlugValue);
  return index >= 0 && BLOCKS_UNIT_SEEDS[index].lessons.some(
    (lesson) => lesson.slug === lessonSlug && lesson.challenge,
  );
}
