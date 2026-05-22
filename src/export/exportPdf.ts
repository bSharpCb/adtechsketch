import jsPDF from 'jspdf'
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

async function svgToPng(svg: string, w: number, h: number): Promise<{ dataUrl: string; w: number; h: number }> {
  const scale = 2
  const W = Math.max(1, Math.round(w * scale))
  const H = Math.max(1, Math.round(h * scale))
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = (e) => reject(e)
      im.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2D context')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    ctx.drawImage(img, 0, 0, W, H)
    return { dataUrl: canvas.toDataURL('image/png'), w: W, h: H }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function exportPdf(editor: Editor, name: string): Promise<void> {
  const ids = [...editor.getCurrentPageShapeIds()]
  if (!ids.length) return
  const res = await editor.getSvgString(ids, { background: true })
  if (!res) return
  const svg: string = typeof res === 'string' ? res : (res as { svg: string }).svg
  if (!svg) return

  let width = (res as { width?: number }).width ?? 0
  let height = (res as { height?: number }).height ?? 0
  if (!width || !height) {
    const vb = svg.match(/viewBox="([^"]+)"/)
    if (vb) {
      const parts = vb[1].split(/\s+/).map(Number)
      width = parts[2] || 800
      height = parts[3] || 600
    } else {
      width = 800
      height = 600
    }
  }

  const { dataUrl, w: pngW, h: pngH } = await svgToPng(svg, width, height)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const ratio = Math.min(pageW / pngW, pageH / pngH)
  const drawW = pngW * ratio
  const drawH = pngH * ratio
  const dx = (pageW - drawW) / 2
  const dy = (pageH - drawH) / 2
  pdf.addImage(dataUrl, 'PNG', dx, dy, drawW, drawH)
  const blob = pdf.output('blob')
  download(blob, `${name}.pdf`)
}
