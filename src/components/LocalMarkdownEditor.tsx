import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './LocalMarkdownEditor.module.css';

type Selection = {block: string; element: HTMLElement; mount: HTMLDivElement; label: string};
type Draft = {
  block: string;
  originalRaw: string;
  originalText: string;
  text: string;
  before: string;
  after: string;
  deleted: boolean;
};

const API_PATH = '/__telemark/local-markdown-editor';
const BLOCK_ATTRIBUTE = 'data-telemark-edit-block';

function blockLabel(element: HTMLElement): string {
  if (/^H[1-6]$/.test(element.tagName)) return 'Heading';
  if (element.tagName === 'LI') return 'List item';
  if (element.tagName === 'TD' || element.tagName === 'TH') return 'Table cell';
  return 'Paragraph';
}

function visibleBlockText(raw: string, element: HTMLElement): {text: string; before: string; after: string} {
  if (/^H[1-6]$/.test(element.tagName)) {
    const heading = /^([ \t]{0,3}#{1,6}[ \t]+)([^\r\n]*?)([ \t]*)$/.exec(raw);
    if (heading) return {text: heading[2], before: heading[1], after: heading[3]};
  }
  if (element.tagName === 'LI') {
    const item = /^([ \t]*(?:[-+*]|\d+[.)])[ \t]+)([^\r\n]+)$/.exec(raw);
    if (item) return {text: item[2], before: item[1], after: ''};
  }
  return {text: raw, before: '', after: ''};
}

function hasChanges(draft: Draft): boolean {
  return draft.deleted || draft.before + draft.text + draft.after !== draft.originalRaw;
}

export default function LocalMarkdownEditor({source}: {source: string}): React.JSX.Element {
  const apiUrl = useBaseUrl(API_PATH);
  const [editMode, setEditMode] = useState(false);
  const [availableBlocks, setAvailableBlocks] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectedRef = useRef<Selection | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const draftsRef = useRef<Record<string, Draft>>({});
  const revisionRef = useRef('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCount = Object.values(drafts).filter(hasChanges).length;
  const draft = selection ? drafts[selection.block] : undefined;

  function updateDrafts(next: Record<string, Draft>) {
    draftsRef.current = next;
    setDrafts(next);
  }

  function changeDraft(block: string, update: (current: Draft) => Draft) {
    const current = draftsRef.current[block];
    if (!current) return;
    updateDrafts({...draftsRef.current, [block]: update(current)});
    setMessage('');
    setError(false);
  }

  function clearSelection() {
    const current = selectedRef.current;
    if (current) {
      current.element.removeAttribute('data-telemark-editing');
      current.mount.remove();
    }
    selectedRef.current = null;
    setSelection(null);
    setLoading(false);
  }

  function toggleEditMode() {
    if (savingRef.current) return;
    if (editMode) {
      if (pendingCount && !window.confirm(`Discard ${pendingCount} unsaved change${pendingCount === 1 ? '' : 's'}?`)) return;
      clearSelection();
      updateDrafts({});
      revisionRef.current = '';
      setMessage('');
      setError(false);
    }
    setEditMode(!editMode);
  }

  useEffect(() => {
    if (!pendingCount) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [pendingCount]);

  useEffect(() => {
    if (selection && draft && !draft.deleted && !loading) textareaRef.current?.focus();
  }, [selection, draft?.block, loading]);

  useEffect(() => {
    const markdown = document.querySelector<HTMLElement>('.theme-doc-markdown');
    if (!markdown) return;
    for (const element of Array.from(markdown.querySelectorAll<HTMLElement>(`[${BLOCK_ATTRIBUTE}]`))) {
      const block = element.getAttribute(BLOCK_ATTRIBUTE) || '';
      const pending = drafts[block] && hasChanges(drafts[block]);
      if (editMode && pending) element.setAttribute('data-telemark-edit-pending', 'true');
      else element.removeAttribute('data-telemark-edit-pending');
      if (editMode && drafts[block]?.deleted) element.setAttribute('data-telemark-edit-deleted', 'true');
      else element.removeAttribute('data-telemark-edit-deleted');
    }
  }, [drafts, editMode]);

  useEffect(() => {
    if (!editMode) return;
    const markdown = document.querySelector<HTMLElement>('.theme-doc-markdown');
    markdown?.setAttribute('data-telemark-edit-enabled', 'true');
    const previous = new Map<HTMLElement, {tabIndex: string | null; role: string | null; label: string | null}>();
    function prepareBlocks() {
      const blocks = Array.from(markdown?.querySelectorAll<HTMLElement>(`[${BLOCK_ATTRIBUTE}]`) || []);
      setAvailableBlocks(blocks.length);
      for (const element of blocks) {
        if (previous.has(element)) continue;
        previous.set(element, {
          tabIndex: element.getAttribute('tabindex'),
          role: element.getAttribute('role'),
          label: element.getAttribute('aria-label'),
        });
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `Edit ${blockLabel(element).toLowerCase()}: ${element.textContent?.trim().slice(0, 80) || 'text'}`);
      }
    }
    prepareBlocks();
    const observer = new MutationObserver(prepareBlocks);
    if (markdown) observer.observe(markdown, {childList: true, subtree: true});

    async function selectBlock(element: HTMLElement) {
      if (savingRef.current || selectedRef.current?.element === element) return;
      clearSelection();
      const block = element.getAttribute(BLOCK_ATTRIBUTE);
      if (!block) return;
      const mount = document.createElement('div');
      mount.className = styles.mount;
      if (['LI', 'TD', 'TH'].includes(element.tagName)) element.appendChild(mount);
      else element.after(mount);
      element.setAttribute('data-telemark-editing', 'true');
      const nextSelection = {block, element, mount, label: blockLabel(element)};
      selectedRef.current = nextSelection;
      setSelection(nextSelection);
      setMessage('');
      setError(false);
      if (draftsRef.current[block]) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `${apiUrl}?source=${encodeURIComponent(source)}&block=${encodeURIComponent(block)}`,
          {cache: 'no-store'},
        );
        const page = await response.json() as {content?: string; revision?: string; error?: string};
        if (!response.ok || typeof page.content !== 'string' || !page.revision) {
          throw new Error(page.error || 'Could not load this text block.');
        }
        if (selectedRef.current !== nextSelection) return;
        if (revisionRef.current && revisionRef.current !== page.revision) {
          throw new Error('This page changed on disk. Copy your staged edits, then reload before editing more.');
        }
        revisionRef.current = page.revision;
        const formatted = visibleBlockText(page.content, element);
        updateDrafts({...draftsRef.current, [block]: {
          block,
          originalRaw: page.content,
          originalText: formatted.text,
          text: formatted.text,
          before: formatted.before,
          after: formatted.after,
          deleted: false,
        }});
      } catch (cause) {
        if (selectedRef.current !== nextSelection) return;
        setError(true);
        setMessage(cause instanceof Error ? cause.message : 'Could not load this text block.');
      } finally {
        if (selectedRef.current === nextSelection) setLoading(false);
      }
    }

    function targetBlock(target: EventTarget | null): HTMLElement | null {
      if (!(target instanceof Element)) return null;
      if (target.closest(`.${styles.mount}`)) return null;
      const element = target.closest<HTMLElement>(`[${BLOCK_ATTRIBUTE}]`);
      return element?.closest('.theme-doc-markdown') ? element : null;
    }

    function onClick(event: MouseEvent) {
      const element = targetBlock(event.target);
      if (!element) return;
      event.preventDefault();
      event.stopPropagation();
      void selectBlock(element);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const element = targetBlock(event.target);
      if (!element || event.target !== element) return;
      event.preventDefault();
      void selectBlock(element);
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      markdown?.removeAttribute('data-telemark-edit-enabled');
      observer.disconnect();
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      for (const [element, {tabIndex, role, label}] of previous) {
        if (tabIndex === null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', tabIndex);
        if (role === null) element.removeAttribute('role');
        else element.setAttribute('role', role);
        if (label === null) element.removeAttribute('aria-label');
        else element.setAttribute('aria-label', label);
        element.removeAttribute('data-telemark-edit-pending');
        element.removeAttribute('data-telemark-edit-deleted');
      }
    };
  }, [editMode, apiUrl, source]);

  useEffect(() => () => {
    selectedRef.current?.mount.remove();
    selectedRef.current?.element.removeAttribute('data-telemark-editing');
  }, []);

  async function saveChanges() {
    if (savingRef.current) return;
    const pendingDrafts = Object.values(draftsRef.current).filter(hasChanges);
    const changes = pendingDrafts.map((item) => (
      item.deleted
        ? {block: item.block, delete: true}
        : {block: item.block, content: item.before + item.text + item.after}
    ));
    if (!changes.length) return;
    if (!revisionRef.current) {
      setError(true);
      setMessage('Could not identify this page version. Reload before saving.');
      return;
    }
    if (pendingDrafts.some((item) => !item.deleted && !item.text.trim())) {
      setError(true);
      setMessage('A text block is empty. Use Delete block to remove it, or enter text before saving.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setMessage('');
    setError(false);
    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({source, revision: revisionRef.current, changes}),
      });
      const result = await response.json() as {revision?: string; error?: string};
      if (!response.ok || !result.revision) {
        throw new Error(result.error || 'Could not save these changes.');
      }
      clearSelection();
      updateDrafts({});
      revisionRef.current = '';
      setMessage(`${changes.length} change${changes.length === 1 ? '' : 's'} saved to the local Markdown file. The page will update shortly.`);
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : 'Could not save these changes.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <section className={styles.editor} aria-label="Local text editing">
      <div className={`${styles.toolbar} ${editMode ? styles.editingToolbar : ''}`}>
        <button type="button" className={styles.modeButton} onClick={toggleEditMode} disabled={saving}>
          {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </button>
        {editMode && (
          <>
            <span className={styles.instructions}>
              {availableBlocks ? 'Select text to edit or delete.' : 'No editable Markdown text on this page.'}
            </span>
            <span className={styles.pending} role="status">{pendingCount} unsaved</span>
            <button type="button" className={styles.saveButton} onClick={() => void saveChanges()} disabled={!pendingCount || saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        )}
        {editMode && message && <span role={error ? 'alert' : 'status'} className={error ? styles.error : styles.status}>{message}</span>}
      </div>
      {!editMode && message && <p role={error ? 'alert' : 'status'} className={error ? styles.error : styles.status}>{message}</p>}
      {selection && createPortal(
        <div className={styles.inlineEditor}>
          <div className={styles.inlineHeading}>
            <strong>{selection.label}</strong>
            <button type="button" className={styles.secondaryButton} onClick={clearSelection} disabled={saving}>Close</button>
          </div>
          {loading ? (
            <p role="status" className={styles.status}>Loading text…</p>
          ) : draft ? (
            <>
              {draft.deleted ? (
                <p className={styles.status}>This block will be removed when you save.</p>
              ) : (
                <>
                  <label className={styles.label} htmlFor="telemark-local-block-text">Text in this block</label>
                  <textarea
                    id="telemark-local-block-text"
                    ref={textareaRef}
                    className={styles.textarea}
                    value={draft.text}
                    onChange={(event) => changeDraft(selection.block, (current) => ({...current, text: event.target.value}))}
                    onKeyDown={(event) => {
                      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                        event.preventDefault();
                        void saveChanges();
                      }
                    }}
                    rows={Math.min(12, Math.max(3, draft.text.split('\n').length + 1))}
                    spellCheck
                  />
                </>
              )}
              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} onClick={() => changeDraft(selection.block, (current) => ({...current, text: current.originalText, deleted: false}))} disabled={saving || !hasChanges(draft)}>
                  Revert block
                </button>
                <button type="button" className={styles.deleteButton} onClick={() => changeDraft(selection.block, (current) => ({...current, deleted: !current.deleted}))} disabled={saving}>
                  {draft.deleted ? 'Restore block' : 'Delete block'}
                </button>
                <span className={styles.hint}>Changes stay staged as you edit other blocks. Save Changes when ready.</span>
              </div>
            </>
          ) : null}
          {message && !draft && <p role={error ? 'alert' : 'status'} className={error ? styles.error : styles.status}>{message}</p>}
        </div>,
        selection.mount,
      )}
    </section>
  );
}
