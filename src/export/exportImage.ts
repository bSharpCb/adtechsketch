import type { Editor } from 'tldraw'

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportPng(editor: Editor, name: string): Promise<void> {
  const ids = [...editor.getCurrentPageShapeIds()]
  if (!ids.length) return
  const result = await editor.toImage(ids, { format: 'png', background: true })
  if (!result) return
  const blob: Blob = (result as { blob?: Blob }).blob ?? (result as unknown as Blob)
  if (!blob) return
  download(blob, `${name}.png`)
}

export async function exportSvg(editor: Editor, name: string): Promise<void> {
  const ids = [...editor.getCurrentPageShapeIds()]
  if (!ids.length) return
  const res = await editor.getSvgString(ids, { background: true })
  if (!res) return
  const svg: string = typeof res === 'string' ? res : (res as { svg: string }).svg
  if (!svg) return
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  download(blob, `${name}.svg`)
}
