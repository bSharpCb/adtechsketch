import { useEffect } from 'react'
import type { Editor } from 'tldraw'

const THRESHOLD = 4

export function useRightClickPan(editor: Editor | null, container: HTMLElement | null) {
  useEffect(() => {
    if (!editor || !container) return

    let dragging = false
    let crossedThreshold = false
    let startX = 0
    let startY = 0
    let startCam = { x: 0, y: 0, z: 1 }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 2) return
      e.preventDefault()
      e.stopPropagation()
      dragging = true
      crossedThreshold = false
      startX = e.clientX
      startY = e.clientY
      const cam = editor.getCamera()
      startCam = { x: cam.x, y: cam.y, z: cam.z }
      try { container.setPointerCapture?.(e.pointerId) } catch { /* ignore */ }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (!crossedThreshold) {
        if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return
        crossedThreshold = true
      }
      e.preventDefault()
      e.stopPropagation()
      const z = startCam.z || 1
      editor.setCamera({ x: startCam.x + dx / z, y: startCam.y + dy / z, z })
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      e.preventDefault()
      e.stopPropagation()
      try { container.releasePointerCapture?.(e.pointerId) } catch { /* ignore */ }
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    container.addEventListener('pointerdown', onPointerDown, true)
    container.addEventListener('pointermove', onPointerMove, true)
    container.addEventListener('pointerup', onPointerUp, true)
    container.addEventListener('pointercancel', onPointerUp, true)
    container.addEventListener('contextmenu', onContextMenu, true)

    return () => {
      container.removeEventListener('pointerdown', onPointerDown, true)
      container.removeEventListener('pointermove', onPointerMove, true)
      container.removeEventListener('pointerup', onPointerUp, true)
      container.removeEventListener('pointercancel', onPointerUp, true)
      container.removeEventListener('contextmenu', onContextMenu, true)
    }
  }, [editor, container])
}
