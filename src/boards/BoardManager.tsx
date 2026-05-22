import { useState } from 'react'
import {
  loadIndex, createBoard, deleteBoard, renameBoard,
  type BoardMeta,
} from './storage'

export function BoardManager({
  activeId,
  onSwitch,
  onClose,
}: {
  activeId: string | null
  onSwitch: (id: string) => void
  onClose: () => void
}) {
  const [boards, setBoards] = useState<BoardMeta[]>(() => loadIndex())

  const refresh = () => setBoards(loadIndex())

  const handleNew = () => {
    const name = window.prompt('Name for new board?', `Board ${boards.length + 1}`)
    if (!name) return
    const b = createBoard(name)
    refresh()
    onSwitch(b.id)
  }
  const handleRename = (id: string, oldName: string) => {
    const name = window.prompt('Rename board', oldName)
    if (!name) return
    renameBoard(id, name)
    refresh()
  }
  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    deleteBoard(id)
    refresh()
  }

  return (
    <div className="boardsharp-panel">
      <div className="boardsharp-panel__header">
        <span>Boards</span>
        <button className="boardsharp-panel__close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="boardsharp-panel__body">
        <button className="boardsharp-new-board" onClick={handleNew}>+ New board</button>
        {boards.length === 0 && (
          <div style={{ color: '#6b7280', padding: 8 }}>No boards yet.</div>
        )}
        {boards.map(b => (
          <div
            key={b.id}
            className={`boardsharp-board-row${b.id === activeId ? ' active' : ''}`}
          >
            <button
              className="boardsharp-board-row__name"
              onClick={() => onSwitch(b.id)}
            >
              {b.name}
            </button>
            <button
              className="boardsharp-board-row__act"
              onClick={() => handleRename(b.id, b.name)}
              title="Rename"
            >
              edit
            </button>
            <button
              className="boardsharp-board-row__act"
              onClick={() => handleDelete(b.id, b.name)}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
