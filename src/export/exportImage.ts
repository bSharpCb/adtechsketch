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

