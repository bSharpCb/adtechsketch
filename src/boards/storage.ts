import type { TLEditorSnapshot } from 'tldraw'

const INDEX_KEY = 'boardsharp:index'
const ACTIVE_KEY = 'boardsharp:activeBoardId'
const BOARD_PREFIX = 'boardsharp:board:'

export type BoardMeta = {
  id: string
  name: string
  updatedAt: number
}

export function loadIndex(): BoardMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as BoardMeta[]
  } catch {
    return []
  }
}

function saveIndex(index: BoardMeta[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index))
}

export function getActiveBoardId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveBoardId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function loadBoard(id: string): TLEditorSnapshot | null {
  try {
    const raw = localStorage.getItem(BOARD_PREFIX + id)
    if (!raw) return null
    return JSON.parse(raw) as TLEditorSnapshot
  } catch {
    return null
  }
}

export function saveBoard(id: string, snapshot: TLEditorSnapshot): void {
  try {
    localStorage.setItem(BOARD_PREFIX + id, JSON.stringify(snapshot))
  } catch (e) {
    console.warn('Could not save board (storage full?):', e)
    return
  }
  const index = loadIndex()
  const existing = index.find(b => b.id === id)
  if (existing) existing.updatedAt = Date.now()
  saveIndex(index)
}

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'b_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function createBoard(name: string): BoardMeta {
  const meta: BoardMeta = { id: newId(), name, updatedAt: Date.now() }
  const index = loadIndex()
  index.push(meta)
  saveIndex(index)
  return meta
}

export function renameBoard(id: string, name: string): void {
  const index = loadIndex()
  const m = index.find(b => b.id === id)
  if (m) { m.name = name; saveIndex(index) }
}

export function deleteBoard(id: string): void {
  const index = loadIndex().filter(b => b.id !== id)
  saveIndex(index)
  localStorage.removeItem(BOARD_PREFIX + id)
}
