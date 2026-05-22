import { useEffect } from 'react'
import type { Editor } from 'tldraw'
import { saveBoard } from '../boards/storage'

export function useAutosave(editor: Editor | null, boardId: string | null) {
  useEffect(() => {
    if (!editor || !boardId) return
    let timer: number | null = null
    const flush = () => {
      try {
        const snapshot = editor.getSnapshot()
        saveBoard(boardId, snapshot)
      } catch (e) {
        console.warn('autosave failed', e)
      }
    }
    const unsub = editor.store.listen(
      () => {
        if (timer != null) window.clearTimeout(timer)
        timer = window.setTimeout(flush, 500)
      },
      { source: 'user', scope: 'document' },
    )
    return () => {
      unsub()
      if (timer != null) window.clearTimeout(timer)
    }
  }, [editor, boardId])
}
