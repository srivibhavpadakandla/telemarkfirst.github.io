/* Pybricks practice runner. Learner code stays inside this disposable worker. */
const pyodideBase = new URL('../pyodide/', self.location.href).href;
const shimUrl = new URL('./fll-pybricks-shim.py', self.location.href).href;
let pythonPromise = null;

function loadPython() {
  if (pythonPromise) return pythonPromise;
  pythonPromise = (async () => {
    importScripts(`${pyodideBase}pyodide.js`);
    if (typeof self.loadPyodide !== 'function') throw new Error('The local Python runtime could not start.');
    const python = await self.loadPyodide({indexURL: pyodideBase});
    const response = await fetch(shimUrl);
    if (!response.ok) throw new Error(`The Pybricks practice model is unavailable (${response.status}).`);
    python.runPython(await response.text());
    return python;
  })();
  return pythonPromise;
}

self.onmessage = async (event) => {
  const data = event.data || {};
  if (data.type === 'boot') {
    try {
      await loadPython();
      self.postMessage({type: 'ready'});
    } catch (error) {
      self.postMessage({type: 'load-error', message: error instanceof Error ? error.message : String(error)});
    }
    return;
  }
  if (data.type !== 'run') return;
  try {
    const python = await loadPython();
    const runStudent = python.globals.get('run_student');
    try {
      const json = runStudent(String(data.source || ''), data.fieldObjects ? JSON.stringify(data.fieldObjects) : null);
      self.postMessage({type: 'result', requestId: data.requestId, result: JSON.parse(json)});
    } finally {
      runStudent.destroy();
    }
  } catch (error) {
    self.postMessage({type: 'worker-error', requestId: data.requestId,
      message: error instanceof Error ? error.message : String(error)});
  }
};
