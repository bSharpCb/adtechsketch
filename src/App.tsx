import { useCallback, useEffect, useState } from 'react'
import { DefaultSizeStyle, Tldraw, useValue, type Editor, type TLComponents } from 'tldraw'
import 'tldraw/tldraw.css'

import {
  loadIndex, getActiveBoardId, setActiveBoardId,
  loadBoard, createBoard, saveBoard,
  serializeBoard, importBoardFromJSON,
} from './boards/storage'
import { BoardManager } from './boards/BoardManager'
import { StampMenu } from './stamps/StampMenu'
import { StampShapeUtil } from './stamps/StampShape'
import { useAutosave } from './canvas/useAutosave'
import { useRightClickPan } from './canvas/useRightClickPan'
import { useShapeRecognition } from './canvas/useShapeRecognition'
import { exportPng } from './export/exportImage'

const HIDDEN: TLComponents = {
  MainMenu: null,
  PageMenu: null,
  NavigationPanel: null,
  HelpMenu: null,
  Toolbar: null,
  StylePanel: null,
  DebugPanel: null,
  QuickActions: null,
  ActionsMenu: null,
  MenuPanel: null,
  ZoomMenu: null,
}

const SHAPE_UTILS = [StampShapeUtil]

type Panel = null | 'boards' | 'stamps' | 'export' | 'share'

const TOOLBAR_TOOLS = [
  { id: 'select', label: 'Select' },
  { id: 'draw', label: 'Pen' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'text', label: 'Text' },
] as const

function ToolIcon({ id }: { id: string }) {
  switch (id) {
    case 'select':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
          <path d="M3.5 2L13 20l2.2-8.2L23 9.6 3.5 2z" />
        </svg>
      )
    case 'draw':
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
        </svg>
      )
    case 'arrow':
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <line x1="4" y1="12" x2="19" y2="12" />
          <polyline points="13 6 20 12 13 18" />
        </svg>
      )
    case 'text':
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="4 6 4 4 20 4 20 6" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="9" y1="20" x2="15" y2="20" />
        </svg>
      )
    default:
      return null
  }
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const currentToolId = useValue(
    'current-tool',
    () => editor?.getCurrentToolId() ?? '',
    [editor],
  )
  if (!editor) return <div className="boardsharp-toolbar" aria-hidden />
  return (
    <div className="boardsharp-toolbar" role="toolbar" aria-label="Tools">
      {TOOLBAR_TOOLS.map(tool => (
        <button
          key={tool.id}
          type="button"
          className={`boardsharp-tool${currentToolId === tool.id ? ' active' : ''}`}
          onClick={() => editor.setCurrentTool(tool.id)}
          title={tool.label}
          aria-label={tool.label}
          aria-pressed={currentToolId === tool.id}
        >
          <ToolIcon id={tool.id} />
        </button>
      ))}
    </div>
  )
}

const SIZES = ['s', 'm', 'l', 'xl'] as const
const SIZE_TOOLS = new Set(['draw', 'arrow', 'text'])

function SizeSelector({ editor }: { editor: Editor | null }) {
  const currentToolId = useValue(
    'size-current-tool',
    () => editor?.getCurrentToolId() ?? '',
    [editor],
  )
  const currentSize = useValue(
    'size-current-style',
    () => (editor ? editor.getStyleForNextShape(DefaultSizeStyle) : null),
    [editor],
  )
  if (!editor) return null
  if (!SIZE_TOOLS.has(currentToolId)) return null

  const apply = (value: typeof SIZES[number]) => {
    editor.run(() => {
      editor.setStyleForNextShapes(DefaultSizeStyle, value)
      if (editor.getSelectedShapeIds().length > 0) {
        editor.setStyleForSelectedShapes(DefaultSizeStyle, value)
      }
    })
  }

  return (
    <div className="boardsharp-toolbar" role="toolbar" aria-label="Size">
      {SIZES.map(size => (
        <button
          key={size}
          type="button"
          className={`boardsharp-tool boardsharp-tool--size${currentSize === size ? ' active' : ''}`}
          onClick={() => apply(size)}
          title={`Size ${size.toUpperCase()}`}
          aria-label={`Size ${size.toUpperCase()}`}
          aria-pressed={currentSize === size}
        >
          {size.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function ColorSelector({ editor }: { editor: Editor | null }) {
  const state = useValue(
    'stamp-color-state',
    () => {
      if (!editor) return null
      const stamps = editor.getSelectedShapes().filter(s => s.type === 'stamp')
      if (stamps.length === 0) return null
      const first = stamps[0].props as { fillColor: string; textColor: string }
      return { ids: stamps.map(s => s.id), fill: first.fillColor, text: first.textColor }
    },
    [editor],
  )

  if (!editor || !state) return null

  const apply = (key: 'fillColor' | 'textColor', value: string) => {
    editor.updateShapes(
      state.ids.map(id => ({ id, type: 'stamp', props: { [key]: value } } as never)),
    )
  }

  return (
    <div className="boardsharp-toolbar" role="toolbar" aria-label="Stamp colors">
      <label className="boardsharp-color" title="Fill color">
        Fill
        <input
          type="color"
          className="boardsharp-color__input"
          value={state.fill}
          onChange={e => apply('fillColor', e.currentTarget.value)}
        />
      </label>
      <label className="boardsharp-color" title="Text color">
        Text
        <input
          type="color"
          className="boardsharp-color__input"
          value={state.text}
          onChange={e => apply('textColor', e.currentTarget.value)}
        />
      </label>
    </div>
  )
}

export default function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [activeBoardId, setActiveId] = useState<string | null>(null)
  const [activeBoardName, setActiveName] = useState<string>('Board')
  const [panel, setPanel] = useState<Panel>(null)

  // Initialise: ensure at least one board exists and pick the active one
  useEffect(() => {
    let id = getActiveBoardId()
    let index = loadIndex()
    if (!id || !index.find(b => b.id === id)) {
      if (index.length === 0) {
        const b = createBoard('Board 1')
        index = [b]
      }
      id = index[0].id
      setActiveBoardId(id)
    }
    setActiveId(id)
    const meta = index.find(b => b.id === id)
    if (meta) setActiveName(meta.name)
  }, [])

  // On mount + when active board changes, load and set defaults
  useEffect(() => {
    if (!editor || !activeBoardId) return
    const snap = loadBoard(activeBoardId)
    if (snap) {
      try {
        editor.loadSnapshot(snap)
      } catch (e) {
        console.warn('Failed to load board snapshot', e)
      }
    } else {
      // Empty new board: persist the initial empty snapshot
      try {
        saveBoard(activeBoardId, editor.getSnapshot())
      } catch (e) {
        console.warn('Failed to seed empty board', e)
      }
    }
    editor.setCurrentTool('draw')
  }, [editor, activeBoardId])

  useAutosave(editor, activeBoardId)
  useRightClickPan(editor, container)
  useShapeRecognition(editor, container)

  const switchTo = useCallback((id: string) => {
    if (!editor) return
    const snap = loadBoard(id)
    try {
      if (snap) {
        editor.loadSnapshot(snap)
      } else {
        // Brand-new board: clear current shapes
        const ids = [...editor.getCurrentPageShapeIds()]
        if (ids.length) editor.deleteShapes(ids)
        saveBoard(id, editor.getSnapshot())
      }
    } catch (e) {
      console.warn('Failed to switch board', e)
    }
    setActiveBoardId(id)
    setActiveId(id)
    const meta = loadIndex().find(b => b.id === id)
    if (meta) setActiveName(meta.name)
    setPanel(null)
  }, [editor])

  // Keyboard shortcuts: P / E / T / Shift+D / Delete
  useEffect(() => {
    if (!editor) return
    const isTyping = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false
      if (el.isContentEditable) return true
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      // Shift+D duplicate (don't intercept Cmd/Ctrl+D)
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'd') {
        const sel = editor.getSelectedShapeIds()
        if (sel.length > 0) {
          e.preventDefault()
          editor.duplicateShapes(sel)
        }
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return

      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault()
          editor.setCurrentTool('draw')
          break
        case 'e':
          e.preventDefault()
          editor.setCurrentTool('eraser')
          break
        case 't': {
          const sel = editor.getSelectedShapeIds()
          if (sel.length === 1) {
            e.preventDefault()
            editor.setEditingShape(sel[0])
          } else {
            e.preventDefault()
            editor.setCurrentTool('text')
          }
          break
        }
        case 'delete':
        case 'backspace': {
          const sel = editor.getSelectedShapeIds()
          if (sel.length) {
            e.preventDefault()
            editor.deleteShapes(sel)
          }
          break
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor])

  const doExport = async () => {
    if (!editor) return
    setPanel(null)
    const name = (activeBoardName || 'board').replace(/[^\w.\- ]/g, '_')
    try {
      await exportPng(editor, name)
    } catch (e) {
      console.warn('Export failed', e)
      window.alert('Export failed — see console for details.')
    }
  }

  const handleShareSave = () => {
    if (!activeBoardId) return
    const json = serializeBoard(activeBoardId, activeBoardName)
    if (!json) {
      window.alert('Could not save: board data not found.')
      return
    }
    const safeName = (activeBoardName || 'board').replace(/[^\w.\- ]/g, '_')
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setPanel(null)
  }

  const handleShareUpload = () => {
    setPanel(null)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      let text: string
      try {
        text = await file.text()
      } catch {
        window.alert('Could not read the selected file.')
        return
      }
      const meta = importBoardFromJSON(text)
      if (!meta) {
        window.alert('Could not import: file is not a valid BoardSharp board.')
        return
      }
      switchTo(meta.id)
    }
    input.click()
  }

  return (
    <div className="boardsharp-app">
      <div className="boardsharp-topbar">
        <div className="boardsharp-topbar__section boardsharp-topbar__section--left">
          <span className="boardsharp-topbar__brand">BoardSharp</span>
          <span className="boardsharp-topbar__board">{activeBoardName}</span>
        </div>
        <Toolbar editor={editor} />
        <SizeSelector editor={editor} />
        <ColorSelector editor={editor} />
        <div className="boardsharp-topbar__section boardsharp-topbar__section--right">
          <button
            className={panel === 'boards' ? 'active' : ''}
            onClick={() => setPanel(panel === 'boards' ? null : 'boards')}
          >
            Boards
          </button>
          <button
            className={panel === 'stamps' ? 'active' : ''}
            onClick={() => setPanel(panel === 'stamps' ? null : 'stamps')}
          >
            Stamps
          </button>
          <button
            className={panel === 'export' ? 'active' : ''}
            onClick={() => setPanel(panel === 'export' ? null : 'export')}
          >
            Export
          </button>
          <button
            className={panel === 'share' ? 'active' : ''}
            onClick={() => setPanel(panel === 'share' ? null : 'share')}
          >
            Share
          </button>
        </div>
      </div>
      <div className="boardsharp-canvas-wrap" ref={setContainer}>
        <Tldraw
          onMount={(e) => setEditor(e)}
          components={HIDDEN}
          shapeUtils={SHAPE_UTILS}
        />
        <div className="boardsharp-overlay">
          {panel === 'boards' && (
            <BoardManager
              activeId={activeBoardId}
              onSwitch={switchTo}
              onClose={() => setPanel(null)}
            />
          )}
          {panel === 'stamps' && editor && (
            <StampMenu editor={editor} onClose={() => setPanel(null)} />
          )}
          {panel === 'export' && (
            <div className="boardsharp-panel">
              <div className="boardsharp-panel__header">
                <span>Export</span>
                <button
                  className="boardsharp-panel__close"
                  onClick={() => setPanel(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="boardsharp-export-list">
                <button onClick={() => doExport()}>PNG image</button>
              </div>
            </div>
          )}
          {panel === 'share' && (
            <div className="boardsharp-panel">
              <div className="boardsharp-panel__header">
                <span>Share</span>
                <button
                  className="boardsharp-panel__close"
                  onClick={() => setPanel(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="boardsharp-export-list">
                <button onClick={handleShareSave}>Save board</button>
                <button onClick={handleShareUpload}>Upload board</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
