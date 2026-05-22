import { useEffect, useRef } from 'react'
import type { Editor, TLDrawShape, TLShapeId } from 'tldraw'
import { createShapeId } from 'tldraw'
import { recognize } from './recognizer'

type Segment = { type: string; points: { x: number; y: number }[] }

export function useShapeRecognition(editor: Editor | null, container: HTMLElement | null) {
  const skipRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!editor || !container) return

    const autoReplace = (shape: TLDrawShape) => {
      const segments = (shape.props as { segments?: Segment[] }).segments
      if (!segments || segments.length === 0) return
      const pts: { x: number; y: number }[] = []
      for (const seg of segments) {
        for (const p of seg.points) pts.push({ x: p.x, y: p.y })
      }
      const result = recognize(pts)
      if (!result) {
        editor.updateShapes([{
          id: shape.id,
          type: 'draw',
          meta: { ...(shape.meta as Record<string, unknown>), analyzed: true },
        } as never])
        return
      }
      skipRef.current.add(shape.id)
      const newId: TLShapeId = createShapeId()
      editor.markHistoryStoppingPoint('shape-recognition')
      editor.run(() => {
        editor.deleteShapes([shape.id])
        editor.createShapes([{
          id: newId,
          type: 'geo',
          x: shape.x + result.bounds.x,
          y: shape.y + result.bounds.y,
          props: {
            geo: result.shape,
            w: Math.max(20, result.bounds.w),
            h: Math.max(20, result.bounds.h),
            color: 'black',
            fill: 'none',
          },
        } as never])
        editor.select(newId)
      })
    }

    const sweep = () => {
      const ids = editor.getCurrentPageShapeIds()
      ids.forEach(id => {
        if (skipRef.current.has(id)) return
        const s = editor.getShape(id)
        if (!s || s.type !== 'draw') return
        if ((s.meta as { analyzed?: boolean }).analyzed) return
        autoReplace(s as TLDrawShape)
      })
    }

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return
      // Defer so tldraw can finalize the draw shape first.
      setTimeout(sweep, 0)
    }
    container.addEventListener('pointerup', onPointerUp)
    return () => container.removeEventListener('pointerup', onPointerUp)
  }, [editor, container])
}
