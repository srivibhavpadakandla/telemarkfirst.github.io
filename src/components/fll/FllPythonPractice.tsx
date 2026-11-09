import React, {useEffect, useMemo, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {usePrismTheme} from '@docusaurus/theme-common';
import {Highlight} from 'prism-react-renderer';
import {fllPythonPracticeConfig, type FllPythonFrame, type FllPythonRunResult} from '@site/src/telemark/fllPythonPractice';
import {highlightedWordParts, wordAt} from '@site/src/components/pythonWordHighlight';
import {getFllLessonsForUnit} from '@site/src/telemark/fllCurriculum';
import {getFllSceneProfile} from '@site/src/telemark/fllSceneProfiles';
import {initialFllScene} from '@site/src/telemark/blocks/fllInterpreter';
import {useAuth} from '@site/src/telemark/useAuth';
import {useProgress} from '@site/src/telemark/useProgress';
import {trackEvent} from '@site/src/telemark/analytics';
import ConfirmDialog from '../ConfirmDialog';
import FllRobotScene3D from './FllRobotScene3D';
import styles from './FllPythonPractice.module.css';

interface Props {lessonId: string}
type RuntimeState = 'loading' | 'ready' | 'running' | 'error';
type WorkerMessage =
  | {type: 'ready'}
  | {type: 'load-error'; message: string}
  | {type: 'result'; requestId: number; result: FllPythonRunResult}
  | {type: 'worker-error'; requestId: number; message: string};

const storageKey = (lessonId: string) => `telemark:fll:python:v1:${lessonId}`;
function readCode(lessonId: string, fallback: string): string {
  try { return window.localStorage.getItem(storageKey(lessonId)) ?? fallback; } catch { return fallback; }
}

function saveCode(lessonId: string, value: string): void {
  try { window.localStorage.setItem(storageKey(lessonId), value); } catch { /* Storage can be unavailable in private browsing. */ }
}

function sampledFrames(frames: FllPythonFrame[]): FllPythonFrame[] {
  if (frames.length <= 80) return frames;
  const stride = Math.ceil(frames.length / 80);
  return frames.filter((_, index) => index % stride === 0 || index === frames.length - 1);
}

export default function FllPythonPractice({lessonId}: Props): React.JSX.Element {
  const config = useMemo(() => fllPythonPracticeConfig(lessonId), [lessonId]);
  const profile = useMemo(() => getFllSceneProfile(lessonId), [lessonId]);
  const initialScene = useMemo(() => initialFllScene(profile.fieldObjects), [profile]);
  const workerUrl = useBaseUrl('/simulator/fll-python-worker.js');
  const shellRef = useRef<HTMLDivElement>(null);
  const runButtonRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const syntaxRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLPreElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const pendingImportRef = useRef<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestRef = useRef(0);
  const runTimerRef = useRef<number | null>(null);
  const [workerEpoch, setWorkerEpoch] = useState(0);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>('loading');
  const [code, setCode] = useState(config.starter);
  const [activeWord, setActiveWord] = useState('');
  const [result, setResult] = useState<FllPythonRunResult | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState<'reset' | 'import' | null>(null);
  const [saving, setSaving] = useState(false);
  const {user} = useAuth();
  const prismTheme = usePrismTheme();
  const {isComplete, markManyComplete, markSkipped} = useProgress(user);
  const recorded = isComplete(lessonId);

  useEffect(() => {
    setCode(readCode(lessonId, config.starter));
    setActiveWord('');
    setResult(null);
    setStepIndex(-1);
    setPlaying(false);
  }, [lessonId, config.starter]);

  useEffect(() => {
    const worker = new Worker(workerUrl);
    workerRef.current = worker;
    setRuntimeState('loading');
    const loadTimer = window.setTimeout(() => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      setRuntimeState('error');
      setMessage('Python took too long to load. Use Retry Python to start it again.');
    }, 25000);
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const data = event.data;
      if (data.type === 'ready') {
        window.clearTimeout(loadTimer);
        setRuntimeState('ready');
        setMessage('');
      } else if (data.type === 'load-error') {
        window.clearTimeout(loadTimer);
        setRuntimeState('error');
        setMessage(`${data.message} Use Retry Python to try again.`);
      } else if (data.type === 'result' && data.requestId === requestRef.current) {
        if (runTimerRef.current !== null) window.clearTimeout(runTimerRef.current);
        runTimerRef.current = null;
        setRuntimeState('ready');
        setResult(data.result);
        const frames = sampledFrames(data.result.playback);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setStepIndex(reduced ? frames.length - 1 : -1);
        setPlaying(!reduced && frames.length > 0);
        if (data.result.error) {
          const position = data.result.errorLine ? ` on line ${data.result.errorLine}` : '';
          setMessage(`${data.result.errorType === 'compile' ? 'Python syntax error' : 'Python run error'}${position}: ${data.result.error}`);
        } else {
          setMessage(`Route finished in ${data.result.scene.elapsedSeconds.toFixed(1)} simulated seconds.`);
        }
      } else if (data.type === 'worker-error' && data.requestId === requestRef.current) {
        if (runTimerRef.current !== null) window.clearTimeout(runTimerRef.current);
        runTimerRef.current = null;
        setRuntimeState('ready');
        setMessage(`Python could not run the program: ${data.message}`);
      }
    };
    worker.onerror = () => {
      window.clearTimeout(loadTimer);
      if (runTimerRef.current !== null) window.clearTimeout(runTimerRef.current);
      runTimerRef.current = null;
      setRuntimeState('error');
      setMessage('The Python worker stopped. Use Retry Python to start it again.');
    };
    worker.postMessage({type: 'boot'});
    return () => {
      window.clearTimeout(loadTimer);
      if (runTimerRef.current !== null) window.clearTimeout(runTimerRef.current);
      runTimerRef.current = null;
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
  }, [workerUrl, workerEpoch]);

  const playback = useMemo(() => sampledFrames(result?.playback ?? []), [result]);
  useEffect(() => {
    if (!playing || playback.length === 0) return undefined;
    if (stepIndex >= playback.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setStepIndex((index) => index + 1), 115);
    return () => window.clearTimeout(timer);
  }, [playing, playback, stepIndex]);

  const checks = config.checks.map((check) => ({label: check.label, passed: Boolean(result && check.test(result))}));
  const allPassed = config.challenge && result?.error === null && checks.every((check) => check.passed);
  const shown = stepIndex >= 0 ? playback[stepIndex] : null;
  const scene = shown?.scene ?? (result && playback.length === 0 ? result.scene : initialScene);
  const trail = useMemo(() => [initialScene, ...playback.slice(0, stepIndex + 1).map((item) => item.scene)], [playback, stepIndex, initialScene]);
  const sourceStep = shown && result ? result.playback.indexOf(shown) : -1;
  const interactionTrail = useMemo(() => [initialScene, ...(result?.playback.slice(0, sourceStep + 1).map((item) => item.scene) ?? [])], [result, sourceStep, initialScene]);
  const updateCode = (value: string) => {
    setCode(value);
    setActiveWord('');
    saveCode(lessonId, value);
    setResult(null);
    setStepIndex(-1);
    setPlaying(false);
    setMessage('Code changed. Run Python to inspect the route.');
  };

  const run = () => {
    if (playing) { setPlaying(false); setMessage('Playback paused.'); return; }
    if (result && stepIndex < playback.length - 1) { setPlaying(true); setMessage('Playback continued.'); return; }
    if (runtimeState !== 'ready' || !workerRef.current) return;
    requestRef.current += 1;
    const requestId = requestRef.current;
    setRuntimeState('running');
    setResult(null);
    setStepIndex(-1);
    setPlaying(false);
    setMessage('Compiling and running Python.');
    trackEvent('fll_simulator_launch', {lesson_id: lessonId});
    workerRef.current.postMessage({type: 'run', requestId, source: code, fieldObjects: profile.fieldObjects});
    runTimerRef.current = window.setTimeout(() => {
      workerRef.current?.terminate();
      workerRef.current = null;
      runTimerRef.current = null;
      setRuntimeState('loading');
      setMessage('The program exceeded the eight second worker limit. Check loop conditions. Python is restarting.');
      setWorkerEpoch((epoch) => epoch + 1);
    }, 8000);
  };

  const stop = () => {
    if (runtimeState === 'running') {
      workerRef.current?.terminate();
      workerRef.current = null;
      if (runTimerRef.current !== null) window.clearTimeout(runTimerRef.current);
      runTimerRef.current = null;
      setRuntimeState('loading');
      setMessage('Program stopped. Python is restarting.');
      setWorkerEpoch((epoch) => epoch + 1);
    } else if (playing) {
      setPlaying(false);
      setMessage('Playback stopped at the current step.');
    }
  };

  const step = () => {
    if (!result || !playback.length) return;
    setPlaying(false);
    const next = Math.min(stepIndex + 1, playback.length - 1);
    setStepIndex(next);
    setMessage(`Showing step ${next + 1} of ${playback.length}, from Python line ${playback[next].line}.`);
  };

  const focusLine = (line: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    const lines = code.split('\n');
    const start = lines.slice(0, Math.max(0, line - 1)).reduce((sum, value) => sum + value.length + 1, 0);
    editor.focus();
    editor.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0));
  };

  const updateActiveWord = () => {
    const editor = editorRef.current;
    if (editor) setActiveWord(wordAt(editor.value, editor.selectionStart, editor.selectionEnd));
  };

  const editorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); runButtonRef.current?.focus(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(); return; }
    if (event.key !== 'Tab' || event.shiftKey) return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const next = `${code.slice(0, start)}    ${code.slice(end)}`;
    updateCode(next);
    window.requestAnimationFrame(() => target.setSelectionRange(start + 4, start + 4));
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([code], {type: 'text/x-python'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lessonId.replace('/', '-')}.py`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage('Python file downloaded.');
  };

  const importCode = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 20000) { setMessage('Use a Python file smaller than 20 KB.'); return; }
    const text = await file.text();
    if (code !== config.starter) { pendingImportRef.current = text; setConfirmation('import'); }
    else { updateCode(text); setMessage('Python file imported.'); }
  };

  const record = async () => {
    if (!allPassed) return;
    setSaving(true);
    try {
      await markManyComplete(getFllLessonsForUnit(lessonId.split('/')[0]).map((lesson) => lesson.id));
      trackEvent('fll_challenge_pass', {lesson_id: lessonId, unit: config.unit});
      setMessage('Unit progress recorded.');
    } catch {
      setMessage('Progress could not be saved. Check your connection and try again.');
    } finally { setSaving(false); }
  };

  const skip = async () => {
    setSaving(true);
    try { await markSkipped(lessonId); setMessage('Challenge marked as skipped.'); }
    catch { setMessage('Progress could not be saved. Check your connection and try again.'); }
    finally { setSaving(false); }
  };

  return <section className={styles.practice} aria-label="FLL Python field simulator">
    <header className={styles.intro}>
      <div><h2>Python field simulator</h2><p>{config.goal}</p></div>
      <button type="button" className={styles.utility} onClick={() => void shellRef.current?.requestFullscreen()}>Fullscreen</button>
    </header>
    <div className={styles.shell} ref={shellRef}>
      <div className={styles.toolbar}>
        <button type="button" className={`${styles.utility} ${styles.fullscreenExit}`} onClick={() => void document.exitFullscreen()}>Exit fullscreen</button>
        <button ref={runButtonRef} type="button" className={styles.primary} onClick={run} disabled={runtimeState === 'loading' || runtimeState === 'error' || runtimeState === 'running'}>
          {runtimeState === 'loading' ? 'Loading Python' : runtimeState === 'running' ? 'Running Python' : playing ? 'Pause playback' : result && stepIndex < playback.length - 1 ? 'Continue playback' : 'Run Python'}
        </button>
        <button type="button" className={styles.utility} onClick={step} disabled={!result || playback.length === 0 || runtimeState === 'running'}>Step</button>
        <button type="button" className={styles.utility} onClick={stop} disabled={runtimeState !== 'running' && !playing}>Stop</button>
        <span className={styles.toolbarDivider} aria-hidden="true" />
        <button type="button" className={styles.utility} onClick={() => setConfirmation('reset')}>Restore starter</button>
        <button type="button" className={styles.utility} onClick={download}>Download .py</button>
        <button type="button" className={styles.utility} onClick={() => importRef.current?.click()}>Import .py</button>
        <input ref={importRef} type="file" accept=".py,.txt,text/x-python,text/plain" hidden onChange={(event) => void importCode(event)} />
        {runtimeState === 'error' && <button type="button" className={styles.utility} onClick={() => { setMessage(''); setWorkerEpoch((epoch) => epoch + 1); }}>Retry Python</button>}
      </div>
      <div className={runtimeState === 'error' || result?.error || /could not|exceeded|smaller than/.test(message) ? styles.notice : styles.srOnly} role="status" aria-live="polite">
        {message}{result?.errorLine && <button type="button" className={styles.lineButton} onClick={() => focusLine(result.errorLine!)}>Go to line {result.errorLine}</button>}
      </div>
      <div className={styles.workspace}>
        <div className={styles.editorPanel}>
          <div className={styles.panelHeader}><h3>main.py</h3></div>
          <div className={styles.codeFrame}>
            <pre ref={gutterRef} className={styles.gutter} aria-hidden="true">{code.split('\n').map((_, index) => index + 1).join('\n')}</pre>
            <div className={styles.editorStack}>
              <Highlight theme={prismTheme} code={code} language="python">
                {({tokens, getLineProps, getTokenProps}) => <pre ref={syntaxRef} className={styles.syntax} aria-hidden="true"><code>{tokens.map((line, lineIndex) => <React.Fragment key={lineIndex}><span {...getLineProps({line})}>{line.map((token, tokenIndex) => {
                  const tokenProps = getTokenProps({token});
                  return <span key={tokenIndex} className={tokenProps.className} style={tokenProps.style}>{highlightedWordParts(tokenProps.children, activeWord)}</span>;
                })}</span>{lineIndex < tokens.length - 1 ? '\n' : null}</React.Fragment>)}</code></pre>}
              </Highlight>
              <textarea ref={editorRef} className={styles.editor} value={code} spellCheck={false} wrap="off" readOnly={runtimeState === 'running'} aria-label="Pybricks Python code editor" aria-describedby={`fll-python-help-${config.unit}`} onChange={(event) => updateCode(event.target.value)} onSelect={updateActiveWord} onClick={updateActiveWord} onKeyUp={updateActiveWord} onBlur={() => setActiveWord('')} onScroll={(event) => { if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop; if (syntaxRef.current) { syntaxRef.current.scrollTop = event.currentTarget.scrollTop; syntaxRef.current.scrollLeft = event.currentTarget.scrollLeft; } }} onKeyDown={editorKeyDown} />
            </div>
          </div>
          <p id={`fll-python-help-${config.unit}`} className={styles.editorHelp}>Use Ctrl+Enter to run. Press Escape to leave the editor, or Shift+Tab to move to the previous control. Distances use millimeters. The model assumes motor A is mounted opposite motor B, so the starter sets A to counterclockwise. Test final code on a physical robot.</p>
        </div>
        <div className={styles.fieldPanel}>
          <FllRobotScene3D key={lessonId} profile={profile} scene={scene} trail={trail} interactionTrail={interactionTrail} currentStep={shown ? stepIndex + 1 : 0} totalSteps={playback.length} playing={playing} />
        </div>
      </div>
      {result?.output && <div className={styles.outputPanel}><h3>Output</h3><pre className={styles.output}>{result.output}</pre></div>}
      {result && result.profiles.length > 0 && <details className={styles.profiles}>
        <summary>Calibration profiles <span>{result.repeatabilityPasses} of 3 returned home</span></summary>
        <div className={styles.profileTableWrap}><table className={styles.profileTable}><thead><tr><th scope="col">Wheel distance</th><th scope="col">Final position</th><th scope="col">Heading</th><th scope="col">Score</th><th scope="col">Home</th></tr></thead><tbody>{result.profiles.map((profile) => <tr key={profile.wheelBiasPercent}><th scope="row">{profile.wheelBiasPercent > 0 ? '+' : ''}{profile.wheelBiasPercent}%</th><td>{profile.xCm.toFixed(0)}, {profile.zCm.toFixed(0)} cm</td><td>{profile.headingDeg.toFixed(0)}°</td><td>{profile.score} pts</td><td>{profile.error ? 'Error' : profile.atHome ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div>
      </details>}
      {config.challenge && <div className={styles.challenge}>
        <div><h3>Challenge checks</h3><p>These checks use the simulated field. Repeat the route on your robot to check real wheel slip, sensor values, and launch alignment.</p></div>
        <ul className={styles.checkList}>{checks.map((check) => <li key={check.label} className={check.passed ? styles.passed : ''}><span aria-hidden="true">{check.passed && <svg viewBox="0 0 16 16" focusable="false"><path d="m3 8 3 3 7-7" /></svg>}</span>{check.label}</li>)}</ul>
        <div className={styles.challengeActions}><button type="button" className={styles.primary} disabled={!allPassed || saving || recorded} onClick={() => void record()}>{recorded ? 'Unit progress recorded' : saving ? 'Saving...' : 'Record unit complete'}</button><button type="button" className={styles.utility} disabled={saving || recorded} onClick={() => void skip()}>Skip challenge</button>{recorded && <Link to={config.unit >= 14 ? '/fll/references' : `/fll/unit-${String(config.unit + 1).padStart(2, '0')}`}>Continue</Link>}</div>
      </div>}
    </div>
    <ConfirmDialog open={confirmation !== null} title={confirmation === 'import' ? 'Replace this Python program?' : 'Restore the starter program?'} description={confirmation === 'import' ? 'Importing this file replaces the current code in this lesson.' : 'Restoring the starter replaces your current code in this lesson.'} confirmLabel={confirmation === 'import' ? 'Replace and import' : 'Restore starter'} danger onCancel={() => { pendingImportRef.current = null; setConfirmation(null); }} onConfirm={() => { if (confirmation === 'import' && pendingImportRef.current !== null) { updateCode(pendingImportRef.current); setMessage('Python file imported.'); } else if (confirmation === 'reset') { updateCode(config.starter); setMessage('Starter program restored.'); } pendingImportRef.current = null; setConfirmation(null); }} />
  </section>;
}
