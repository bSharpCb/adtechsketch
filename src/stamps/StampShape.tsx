import { useEffect, useRef, useState } from 'react'
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  useEditor,
  useValue,
  type RecordProps,
  type TLBaseShape,
} from 'tldraw'
import { T } from '@tldraw/validate'

export type StampProps = {
  w: number
  h: number
  partner: string
  domain: string
  fillColor: string
  textColor: string
  geo: string
  categoryId: string
}

export type StampShape = TLBaseShape<'stamp', StampProps>

const FLAGSHIP_FEATURES: Record<string, string[]> = {
  permutive: [
    'Segmentation',
    'Contextual Targeting',
    'Lookalike Modeling',
    'Sales Planning',
    'Campaign Optimization',
    'Brand Safety',
  ],
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Module-level bridge between the React-rendered contentEditable elements
// and the ShapeUtil's onEditEnd lifecycle. onEditEnd fires synchronously
// inside tldraw's setEditingShape(null) before React reconciles, so it can
// read the live (still-mounted) contentEditable DOM and commit pending edits.
const flagshipEditRefs = new Map<string, {
  partner: HTMLElement | null
  bullets: HTMLElement | null
  header?: HTMLElement | null
}>()

function readBulletsText(el: HTMLElement | null): string[] {
  if (!el) return []
  return (el.innerText || '')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

function clearbitUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`
}

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
}

function GeoBackground({ geo, w, h, fill }: { geo: string; w: number; h: number; fill: string }) {
  const inset = 1
  const W = w - inset * 2
  const H = h - inset * 2
  const borderStroke = '#000000'
  const borderWidth = 2
  switch (geo) {
    case 'oval':
      return (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={W / 2}
          ry={H / 2}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
    case 'diamond':
      return (
        <polygon
          points={`${w / 2},${inset} ${w - inset},${h / 2} ${w / 2},${h - inset} ${inset},${h / 2}`}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
    case 'rhombus':
      return (
        <polygon
          points={`${w * 0.25},${inset} ${w - inset},${inset} ${w * 0.75},${h - inset} ${inset},${h - inset}`}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
    case 'pentagon':
      return (
        <polygon
          points={`${w / 2},${inset} ${w - inset},${h * 0.4} ${w * 0.83},${h - inset} ${w * 0.17},${h - inset} ${inset},${h * 0.4}`}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
    case 'hexagon':
      return (
        <polygon
          points={`${w * 0.25},${inset} ${w * 0.75},${inset} ${w - inset},${h / 2} ${w * 0.75},${h - inset} ${w * 0.25},${h - inset} ${inset},${h / 2}`}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
    case 'octagon':
      return (
        <polygon
          points={`${w * 0.3},${inset} ${w * 0.7},${inset} ${w - inset},${h * 0.3} ${w - inset},${h * 0.7} ${w * 0.7},${h - inset} ${w * 0.3},${h - inset} ${inset},${h * 0.7} ${inset},${h * 0.3}`}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
    case 'trapezoid':
      return (
        <polygon
          points={`${w * 0.2},${inset} ${w * 0.8},${inset} ${w - inset},${h - inset} ${inset},${h - inset}`}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
    case 'triangle':
      return (
        <polygon
          points={`${w / 2},${inset} ${w - inset},${h - inset} ${inset},${h - inset}`}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
    case 'star': {
      const cx = w / 2
      const cy = h / 2
      const rOut = Math.min(w, h) / 2 - inset
      const rIn = rOut * 0.4
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? rOut : rIn
        const ang = -Math.PI / 2 + (i * Math.PI) / 5
        pts.push(`${cx + r * Math.cos(ang)},${cy + r * Math.sin(ang)}`)
      }
      return (
        <polygon
          points={pts.join(' ')}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
    }
    case 'cylinder': {
      const rxBody = Math.max(1, (w - inset * 2) / 2)
      const ryTop = Math.min(h * 0.14, w * 0.2)
      const sw = Math.max(1, Math.min(w, h) * 0.008)
      const silhouette =
        `M ${inset} ${ryTop} ` +
        `A ${rxBody} ${ryTop} 0 0 1 ${w - inset} ${ryTop} ` +
        `L ${w - inset} ${h - ryTop} ` +
        `A ${rxBody} ${ryTop} 0 0 1 ${inset} ${h - ryTop} Z`
      const topFront =
        `M ${inset} ${ryTop} ` +
        `A ${rxBody} ${ryTop} 0 0 0 ${w - inset} ${ryTop}`
      return (
        <>
          <path
            d={silhouette}
            fill={fill}
            stroke={borderStroke}
            strokeWidth={borderWidth}
          />
          <path
            d={topFront}
            fill="none"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth={sw}
          />
        </>
      )
    }
    case 'cloud': {
      const d =
        `M ${w * 0.25} ${h * 0.88} ` +
        `C ${w * 0.05} ${h * 0.88} ${w * 0.05} ${h * 0.55} ${w * 0.2} ${h * 0.5} ` +
        `C ${w * 0.18} ${h * 0.22} ${w * 0.48} ${h * 0.18} ${w * 0.5} ${h * 0.4} ` +
        `C ${w * 0.55} ${h * 0.18} ${w * 0.82} ${h * 0.22} ${w * 0.8} ${h * 0.5} ` +
        `C ${w * 0.95} ${h * 0.55} ${w * 0.95} ${h * 0.88} ${w * 0.75} ${h * 0.88} Z`
      // Scale the cloud 1.3x around the shape's center while keeping the
      // shape's bounding box (and the content placed on top of it) unchanged.
      const scale = 1.3
      return (
        <path
          d={d}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth / scale}
          transform={`translate(${w / 2} ${h / 2}) scale(${scale}) translate(${-w / 2} ${-h / 2})`}
        />
      )
    }
    case 'heart': {
      const d =
        `M ${w * 0.5} ${h * 0.92} ` +
        `C ${w * 0.1} ${h * 0.65} ${w * 0.02} ${h * 0.25} ${w * 0.28} ${h * 0.13} ` +
        `C ${w * 0.42} ${h * 0.05} ${w * 0.5} ${h * 0.2} ${w * 0.5} ${h * 0.32} ` +
        `C ${w * 0.5} ${h * 0.2} ${w * 0.58} ${h * 0.05} ${w * 0.72} ${h * 0.13} ` +
        `C ${w * 0.98} ${h * 0.25} ${w * 0.9} ${h * 0.65} ${w * 0.5} ${h * 0.92} Z`
      return (
        <path
          d={d}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
    }
    case 'laptop': {
      // Open laptop: rectangular screen + trapezoidal keyboard base wider at
      // the bottom than at the top.
      const screenH = h * 0.65
      const gap = h * 0.02
      const baseY = screenH + gap
      const screenInsetX = w * 0.08
      const screenW = w - screenInsetX * 2
      const elements: JSX.Element[] = []
      elements.push(
        <rect
          key="screen"
          x={screenInsetX}
          y={inset}
          width={screenW}
          height={screenH - inset}
          rx={4}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />,
      )
      elements.push(
        <polygon
          key="base"
          points={`${screenInsetX},${baseY} ${w - screenInsetX},${baseY} ${w - inset},${h - inset} ${inset},${h - inset}`}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />,
      )
      const bezel = Math.max(1, Math.min(w, h) * 0.012)
      elements.push(
        <rect
          key="bezel"
          x={screenInsetX + bezel}
          y={inset + bezel}
          width={screenW - bezel * 2}
          height={screenH - inset - bezel * 2}
          rx={3}
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth={Math.max(0.5, bezel * 0.6)}
        />,
      )
      return <>{elements}</>
    }
    case 'phone': {
      // Rounded rectangle body + small home-button circle near the bottom.
      const r = Math.min(w, h) * 0.04
      const cy = h - h * 0.06 - r
      const bodyR = Math.min(W, H) * 0.08
      return (
        <>
          <rect
            x={inset}
            y={inset}
            width={W}
            height={H}
            rx={bodyR}
            fill={fill}
            stroke={borderStroke}
            strokeWidth={borderWidth}
          />
          <circle
            cx={w / 2}
            cy={cy}
            r={r}
            fill="rgba(0,0,0,0.22)"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={Math.max(0.8, r * 0.15)}
          />
        </>
      )
    }
    case 'monitor': {
      // Computer monitor / TV: rounded-rect screen + thin stand neck + flat base.
      const screenH = h * 0.78
      const neckH = h * 0.07
      const neckW = w * 0.16
      const baseW = w * 0.42
      const elements: JSX.Element[] = []
      elements.push(
        <rect
          key="screen"
          x={inset}
          y={inset}
          width={W}
          height={screenH - inset}
          rx={6}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />,
      )
      elements.push(
        <rect
          key="neck"
          x={(w - neckW) / 2}
          y={screenH}
          width={neckW}
          height={neckH}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />,
      )
      elements.push(
        <rect
          key="base"
          x={(w - baseW) / 2}
          y={screenH + neckH}
          width={baseW}
          height={Math.max(2, h - screenH - neckH - inset)}
          rx={2}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />,
      )
      // Subtle inner border on the screen to suggest a bezel
      const bezel = Math.max(1, Math.min(w, h) * 0.012)
      elements.push(
        <rect
          key="bezel"
          x={inset + bezel}
          y={inset + bezel}
          width={W - bezel * 2}
          height={screenH - inset - bezel * 2}
          rx={4}
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth={Math.max(0.5, bezel * 0.6)}
        />,
      )
      return <>{elements}</>
    }
    case 'radio': {
      // Boombox-style: rounded body + vertical speaker grill on the left
      // + tuning dial on the right.
      const bodyR = Math.min(w, h) * 0.06
      const elements: JSX.Element[] = []
      elements.push(
        <rect
          key="body"
          x={inset}
          y={inset}
          width={W}
          height={H}
          rx={bodyR}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />,
      )
      // Speaker grill: 3 vertical lines on the left
      const grillStart = w * 0.1
      const grillSpacing = w * 0.04
      const grillTop = h * 0.27
      const grillBottom = h * 0.73
      const grillStroke = 'rgba(0,0,0,0.35)'
      const grillW = Math.max(1, w * 0.012)
      for (let i = 0; i < 3; i++) {
        const x = grillStart + i * grillSpacing
        elements.push(
          <line
            key={`grill${i}`}
            x1={x}
            y1={grillTop}
            x2={x}
            y2={grillBottom}
            stroke={grillStroke}
            strokeWidth={grillW}
          />,
        )
      }
      // Tuning dial on the right
      const dialCx = w * 0.85
      const dialCy = h * 0.5
      const dialR = Math.min(w * 0.05, h * 0.13)
      elements.push(
        <circle
          key="dial"
          cx={dialCx}
          cy={dialCy}
          r={dialR}
          fill="rgba(0,0,0,0.2)"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={Math.max(0.8, dialR * 0.18)}
        />,
      )
      // Antenna line above the dial for extra "radio" cue
      const antennaX = dialCx
      const antennaTop = h * 0.08
      const antennaBottom = h * 0.28
      elements.push(
        <line
          key="antenna"
          x1={antennaX}
          y1={antennaTop}
          x2={antennaX}
          y2={antennaBottom}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={Math.max(0.8, w * 0.008)}
        />,
      )
      return <>{elements}</>
    }
    case 'table': {
      // Excel-style table: filled background + darker header row + light grid lines.
      const headerH = H * 0.24
      const rows = 4 // total rows incl. header
      const cols = 3
      const bodyH = H - headerH
      const rowH = bodyH / (rows - 1)
      const colW = W / cols
      const lineColor = 'rgba(255,255,255,0.45)'
      const lineWidth = Math.max(0.5, Math.min(w, h) * 0.006)
      const elements: JSX.Element[] = []
      elements.push(
        <rect
          key="bg"
          x={inset}
          y={inset}
          width={W}
          height={H}
          rx={3}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />,
      )
      elements.push(
        <rect
          key="header"
          x={inset}
          y={inset}
          width={W}
          height={headerH}
          fill="rgba(0,0,0,0.22)"
        />,
      )
      // Horizontal lines: below header + between body rows
      for (let i = 0; i < rows - 1; i++) {
        const y = inset + headerH + rowH * i
        if (i === rows - 2) break // no line at the bottom edge
        elements.push(
          <line
            key={`hl${i}`}
            x1={inset}
            y1={y}
            x2={inset + W}
            y2={y}
            stroke={lineColor}
            strokeWidth={lineWidth}
          />,
        )
      }
      // Vertical column dividers (span the whole height)
      for (let j = 1; j < cols; j++) {
        const x = inset + colW * j
        elements.push(
          <line
            key={`vl${j}`}
            x1={x}
            y1={inset}
            x2={x}
            y2={inset + H}
            stroke={lineColor}
            strokeWidth={lineWidth}
          />,
        )
      }
      return <>{elements}</>
    }
    case 'rectangle':
    default:
      return (
        <rect
          x={inset}
          y={inset}
          width={W}
          height={H}
          rx={6}
          fill={fill}
          stroke={borderStroke}
          strokeWidth={borderWidth}
        />
      )
  }
}

function StampView({ shape }: { shape: StampShape }) {
  const editor = useEditor()
  const { w, h, partner, domain, fillColor, textColor, geo, categoryId } = shape.props
  const meta = shape.meta as { headerText?: string; logoUrl?: string }
  const headerText = meta.headerText
  const overrideLogo = meta.logoUrl
  const isEditable = STAMPS_EDITABLE_CATEGORIES.has(categoryId)
  const isEditing = useValue(
    'stamp-editing',
    () => editor.getEditingShapeId() === shape.id,
    [editor, shape.id],
  )
  const [logoState, setLogoState] = useState<'clearbit' | 'favicon' | 'none'>('clearbit')
  const [overrideFailed, setOverrideFailed] = useState(false)
  const partnerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const logoUrl =
    overrideLogo && !overrideFailed
      ? overrideLogo
      : !domain
        ? null
        : logoState === 'clearbit'
          ? clearbitUrl(domain)
          : logoState === 'favicon'
            ? faviconUrl(domain)
            : null

  useEffect(() => {
    if (!isEditable || !isEditing || !partnerRef.current) return
    const el = partnerRef.current
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [isEditable, isEditing])

  useEffect(() => {
    if (!isEditable || !isEditing) return
    flagshipEditRefs.set(shape.id, {
      partner: partnerRef.current,
      bullets: null,
      header: headerRef.current,
    })
    return () => {
      flagshipEditRefs.delete(shape.id)
    }
  }, [isEditable, isEditing, shape.id])

  const commitPartner = (text: string) => {
    const clean = text.trim() || partner
    if (clean === partner) return
    editor.updateShapes([{
      id: shape.id,
      type: 'stamp',
      props: { partner: clean },
    } as never])
  }

  const stopPointerIfEditing = (e: React.PointerEvent | React.MouseEvent) => {
    if (isEditing) e.stopPropagation()
  }

  // Cloud (CDP) stamps use a larger shape but keep the content sized as if it
  // were a standard 200x120 stamp — the extra space cushions the content
  // away from the cloud's top bumps.
  const isCloud = geo === 'cloud'
  const isCylinder = geo === 'cylinder'
  const isMonitor = geo === 'monitor'
  const isRadio = geo === 'radio'
  const isLaptop = geo === 'laptop'
  const isPhone = geo === 'phone'
  // Identity Providers and Social Media use a smaller shape but boost internal
  // ratios so the rendered logo + label end up the same physical size as the
  // legacy 200x120 rectangle layout.
  const isCompact = categoryId === 'identity' || categoryId === 'social-media'

  const contentW = isCloud ? Math.min(w, 200) : w
  const contentH = isCloud ? Math.min(h, 120) : h
  const offsetX = (w - contentW) / 2
  // Cloud has empty space above (top bumps), so bias the content downward
  // instead of centering it in the bounding box.
  const offsetY = isCloud
    ? Math.max(0, (h - contentH) * 1.25)
    : (h - contentH) / 2

  // Per-geo padding so content stays within the visible body of the shape
  // (above the monitor stand, inside the radio body, inside the laptop screen,
  // above the phone's home button, etc.).
  const padLeft = isRadio ? contentW * 0.22 : isCompact ? contentW * 0.05 : contentW * 0.1
  const padRight = isRadio ? contentW * 0.22 : isCompact ? contentW * 0.05 : contentW * 0.1
  const padTop =
    isMonitor ? contentH * 0.08 :
    isLaptop ? contentH * 0.06 :
    isPhone ? contentH * 0.08 :
    isRadio ? contentH * 0.15 :
    isCompact ? contentH * 0.06 :
    contentH * 0.12
  const padBottom =
    isMonitor ? contentH * 0.28 :
    isLaptop ? contentH * 0.38 :
    isPhone ? contentH * 0.16 :
    isRadio ? contentH * 0.15 :
    isCompact ? contentH * 0.06 :
    contentH * 0.12

  const innerW = Math.max(0, contentW - padLeft - padRight)
  const innerH = Math.max(0, contentH - padTop - padBottom)

  // For cylinder (database) icons, bias content downward so the top "rim" of
  // the cylinder reads as empty space — that's the classic database look.
  const contentPadTop = isCylinder ? contentH * 0.18 : 0
  const effectiveInnerH = Math.max(0, innerH - contentPadTop)

  const hasHeader = !!headerText
  const headerCharBudget = Math.max(6, (headerText ?? '').length)
  // When the stamp has a header, the header IS the primary label — size it
  // big like a title. The body ("1P Data") becomes a subtitle.
  // The char-budget cap uses ~1.7 so the header text always fits on a single
  // line (avg sans-serif glyph is ~0.55 em wide, so 1/0.55 ≈ 1.8 is the
  // absolute upper bound). Sitting just under that keeps a small margin.
  const headerFontSize = hasHeader
    ? Math.max(
        10,
        Math.min(
          effectiveInnerH * 0.4,
          contentH * 0.22,
          innerW * 0.22,
          (innerW * 1.7) / headerCharBudget,
        ),
      )
    : 0
  const headerH = hasHeader ? headerFontSize * 1.4 : 0
  const bodyH = Math.max(0, effectiveInnerH - headerH)

  const hasLogo = !!logoUrl && logoState !== 'none'
  const logoMaxRatio = isCompact ? 0.6 : isCylinder ? 0.55 : 0.55
  const logoWMaxRatio = isCompact ? 0.75 : isCylinder ? 0.8 : 0.7
  const logoH = hasLogo ? Math.min(bodyH * logoMaxRatio, innerW * logoWMaxRatio) : 0
  const labelH = Math.max(0, bodyH - logoH - (hasLogo ? contentH * 0.04 : 0))
  const charBudget = Math.max(7, partner.length)
  const labelHRatio = isCompact ? 0.65 : isCylinder ? 0.7 : hasHeader ? 0.4 : 0.55
  // Stamps with no logo and no header have the most room for the partner text
  // (most generous caps). With a header, the body becomes secondary so caps shrink.
  const labelWRatio = isCompact ? 0.16 : isCylinder ? 0.18 : hasHeader ? 0.12 : hasLogo ? 0.13 : 0.18
  const labelCharRatio = isCompact ? 3.0 : isCylinder ? 3.3 : hasHeader ? 2.0 : hasLogo ? 2.7 : 3.2
  const naturalFontSize = Math.max(
    7,
    Math.min(
      labelH * labelHRatio,
      innerW * labelWRatio,
      (innerW * labelCharRatio) / charBudget,
    ),
  )
  // Digital property body text ("1P Data") is locked to the same physical size
  // across all variants (Web / App / Audio / CTV / FAST). Each variant's
  // smaller dimension is set to 140 by default so this multiplier yields the
  // same ~18px result, and resize scales the text proportionally.
  const isDigitalProperty = categoryId === 'digital-properties'
  const fontSize = isDigitalProperty && hasHeader
    ? Math.max(8, (Math.min(contentW, contentH) / 140) * 18)
    : naturalFontSize

  return (
    <HTMLContainer style={{ pointerEvents: 'all' }}>
      <div style={{ position: 'relative', width: w, height: h, color: textColor, userSelect: 'none' }}>
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ position: 'absolute', inset: 0, display: 'block', overflow: 'visible' }}
        >
          <GeoBackground geo={geo} w={w} h={h} fill={fillColor} />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: offsetX + padLeft,
            top: offsetY + padTop,
            width: innerW,
            height: innerH,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            paddingTop: contentPadTop,
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          {hasHeader && (
            <div
              ref={headerRef}
              key={`stamp-header-${isEditing ? 'edit' : 'static'}`}
              contentEditable={isEditable && isEditing}
              suppressContentEditableWarning
              spellCheck={false}
              onPointerDown={stopPointerIfEditing}
              onMouseDown={stopPointerIfEditing}
              onBlur={(e) => {
                if (!isEditable || !isEditing) return
                const text = e.currentTarget.textContent?.trim() ?? ''
                const next = text.length > 0 ? text : headerText
                if (next === headerText) return
                editor.updateShapes([{
                  id: shape.id,
                  type: 'stamp',
                  meta: { ...meta, headerText: next },
                } as never])
              }}
              onKeyDown={(e) => {
                if (!isEditing) return
                if (e.key === 'Enter') {
                  e.preventDefault()
                  ;(e.currentTarget as HTMLDivElement).blur()
                }
              }}
              style={{
                flex: '0 0 auto',
                height: headerH,
                fontSize: headerFontSize,
                fontWeight: 600,
                lineHeight: 1.2,
                opacity: 0.75,
                textAlign: 'center',
                outline: isEditing ? '1px dashed rgba(0,0,0,0.3)' : 'none',
                borderRadius: 3,
                cursor: isEditing ? 'text' : 'default',
              }}
            >
              {headerText}
            </div>
          )}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: hasLogo ? contentH * 0.04 : 0,
              overflow: 'hidden',
            }}
          >
          {hasLogo && logoUrl && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 4,
                padding: Math.max(2, contentH * 0.02),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: logoH,
                maxWidth: innerW * 0.8,
              }}
            >
              <img
                src={logoUrl}
                alt=""
                draggable={false}
                onError={() => {
                  if (overrideLogo && !overrideFailed) {
                    setOverrideFailed(true)
                  } else {
                    setLogoState(prev =>
                      prev === 'clearbit' ? 'favicon' : 'none',
                    )
                  }
                }}
                style={{
                  height: Math.max(0, logoH - contentH * 0.04),
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            </div>
          )}
          <div
            ref={partnerRef}
            key={`stamp-partner-${isEditing ? 'edit' : 'static'}`}
            contentEditable={isEditable && isEditing}
            suppressContentEditableWarning
            spellCheck={false}
            onPointerDown={stopPointerIfEditing}
            onMouseDown={stopPointerIfEditing}
            onBlur={(e) => {
              if (isEditable && isEditing) {
                commitPartner(e.currentTarget.textContent || '')
              }
            }}
            onKeyDown={(e) => {
              if (!isEditing) return
              if (e.key === 'Enter') {
                e.preventDefault()
                ;(e.currentTarget as HTMLDivElement).blur()
              }
            }}
            style={{
              fontSize,
              fontWeight: 600,
              lineHeight: 1.15,
              wordBreak: 'break-word',
              textShadow: '0 1px 2px rgba(0,0,0,0.15)',
              outline: isEditing ? '1px dashed rgba(0,0,0,0.35)' : 'none',
              borderRadius: 4,
              padding: isEditing ? '2px 6px' : 0,
              cursor: isEditing ? 'text' : 'default',
              minWidth: isEditing ? '40%' : undefined,
            }}
          >
            {partner}
          </div>
          </div>
        </div>
      </div>
    </HTMLContainer>
  )
}

const STAMPS_EDITABLE_CATEGORIES = new Set(['permutive', 'digital-properties'])

function FlagshipStampView({ shape }: { shape: StampShape }) {
  const editor = useEditor()
  const isEditing = useValue(
    'flagship-editing',
    () => editor.getEditingShapeId() === shape.id,
    [editor, shape.id],
  )

  const { w, h, partner, domain, fillColor, textColor, geo, categoryId } = shape.props
  const meta = shape.meta as { kind?: string; features?: string[] }
  const [logoState, setLogoState] = useState<'clearbit' | 'favicon' | 'none'>('clearbit')
  const partnerRef = useRef<HTMLDivElement>(null)
  const bulletsRef = useRef<HTMLDivElement>(null)

  const logoUrl = !domain
    ? null
    : logoState === 'clearbit'
      ? clearbitUrl(domain)
      : logoState === 'favicon'
        ? faviconUrl(domain)
        : null

  const features = meta.features ?? FLAGSHIP_FEATURES[categoryId] ?? []

  useEffect(() => {
    if (!isEditing || !partnerRef.current) return
    const el = partnerRef.current
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [isEditing])

  // Register the editing DOM refs so the ShapeUtil's onEditEnd can read them
  // before React reconciles them away.
  useEffect(() => {
    if (!isEditing) return
    flagshipEditRefs.set(shape.id, {
      partner: partnerRef.current,
      bullets: bulletsRef.current,
    })
    return () => {
      flagshipEditRefs.delete(shape.id)
    }
  }, [isEditing, shape.id])

  const commitPartner = (text: string) => {
    const clean = text.trim() || partner
    if (clean === partner) return
    editor.updateShapes([{
      id: shape.id,
      type: 'stamp',
      props: { partner: clean },
    } as never])
  }

  const commitFeatures = () => {
    const items = readBulletsText(bulletsRef.current)
    if (
      items.length === features.length &&
      items.every((x, i) => x === features[i])
    ) return
    editor.updateShapes([{
      id: shape.id,
      type: 'stamp',
      meta: { ...meta, features: items },
    } as never])
  }

  const stopPointer = (e: React.PointerEvent | React.MouseEvent | React.WheelEvent) => {
    if (isEditing) e.stopPropagation()
  }

  // Oval (circle) flagship shapes need much larger insets so content stays
  // within the elliptical fill instead of overflowing the corners of the bbox.
  const isOval = geo === 'oval'
  const padX = isOval ? w * 0.16 : w * 0.07
  const padY = isOval ? h * 0.16 : h * 0.05
  const innerW = Math.max(0, w - padX * 2)
  const innerH = Math.max(0, h - padY * 2)

  // Header at top: logo + partner name. Bullets fill the remainder.
  const headerH = innerH * 0.28
  const hasLogo = !!logoUrl && logoState !== 'none'
  const logoH = hasLogo ? Math.min(headerH * 0.55, innerW * 0.55) : 0
  const nameH = Math.max(0, headerH - logoH - (hasLogo ? h * 0.012 : 0))
  const charBudget = Math.max(7, partner.length)
  const nameFontSize = Math.max(
    10,
    Math.min(nameH * 0.75, innerW * 0.14, (innerW * 2.8) / charBudget),
  )

  const bulletsH = innerH - headerH
  const lineSlots = Math.max(1, features.length)
  const bulletFontSize = Math.max(
    9,
    Math.min(innerW * 0.07, (bulletsH / lineSlots) * 0.55),
  )

  return (
    <HTMLContainer style={{ pointerEvents: 'all' }}>
      <div
        style={{
          position: 'relative',
          width: w,
          height: h,
          color: textColor,
          userSelect: 'none',
        }}
      >
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ position: 'absolute', inset: 0, display: 'block', overflow: 'visible' }}
        >
          <GeoBackground geo={geo} w={w} h={h} fill={fillColor} />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: padX,
            top: padY,
            width: innerW,
            height: innerH,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              height: headerH,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: hasLogo ? h * 0.012 : 0,
              textAlign: 'center',
            }}
          >
            {hasLogo && logoUrl && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 4,
                  padding: Math.max(2, h * 0.01),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxHeight: logoH,
                  maxWidth: innerW * 0.65,
                }}
              >
                <img
                  src={logoUrl}
                  alt=""
                  draggable={false}
                  onError={() =>
                    setLogoState(prev =>
                      prev === 'clearbit' ? 'favicon' : 'none',
                    )
                  }
                  style={{
                    height: Math.max(0, logoH - h * 0.02),
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />
              </div>
            )}
            <div
              ref={partnerRef}
              key={`partner-${isEditing ? 'edit' : 'static'}`}
              contentEditable={isEditing}
              suppressContentEditableWarning
              spellCheck={false}
              onPointerDown={stopPointer}
              onMouseDown={stopPointer}
              onBlur={(e) => commitPartner(e.currentTarget.textContent || '')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  ;(e.currentTarget as HTMLDivElement).blur()
                }
              }}
              style={{
                fontSize: nameFontSize,
                fontWeight: 700,
                lineHeight: 1.15,
                wordBreak: 'break-word',
                textShadow: '0 1px 2px rgba(0,0,0,0.18)',
                outline: isEditing ? '1px dashed rgba(255,255,255,0.5)' : 'none',
                borderRadius: 4,
                padding: isEditing ? '2px 6px' : 0,
                cursor: isEditing ? 'text' : 'default',
                minWidth: isEditing ? '40%' : undefined,
              }}
            >
              {partner}
            </div>
          </div>
          {(features.length > 0 || isEditing) && (
            isEditing ? (
              <div
                ref={bulletsRef}
                key="bullets-edit"
                className="boardsharp-flagship-bullets"
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                onPointerDown={stopPointer}
                onMouseDown={stopPointer}
                onWheel={stopPointer}
                onBlur={commitFeatures}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  paddingLeft: innerW * 0.06,
                  paddingRight: innerW * 0.04,
                  outline: '1px dashed rgba(255,255,255,0.4)',
                  borderRadius: 4,
                  cursor: 'text',
                  ['--bullet-font-size' as unknown as string]: `${bulletFontSize}px`,
                  ['--bullet-gap' as unknown as string]: `${bulletFontSize * 0.45}px`,
                } as React.CSSProperties}
                dangerouslySetInnerHTML={{
                  __html: features.map(f => `<div>${escapeHtml(f)}</div>`).join(''),
                }}
              />
            ) : (
              <div
                key="bullets-static"
                className="boardsharp-flagship-bullets"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  paddingLeft: innerW * 0.06,
                  paddingRight: innerW * 0.04,
                  ['--bullet-font-size' as unknown as string]: `${bulletFontSize}px`,
                  ['--bullet-gap' as unknown as string]: `${bulletFontSize * 0.45}px`,
                } as React.CSSProperties}
              >
                {features.map((f, i) => (
                  <div key={`${i}-${f}`}>{f}</div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </HTMLContainer>
  )
}

export class StampShapeUtil extends BaseBoxShapeUtil<StampShape> {
  static override type = 'stamp' as const

  static override props: RecordProps<StampShape> = {
    w: T.nonZeroNumber,
    h: T.nonZeroNumber,
    partner: T.string,
    domain: T.string,
    fillColor: T.string,
    textColor: T.string,
    geo: T.string,
    categoryId: T.string,
  }

  override getDefaultProps(): StampProps {
    return {
      w: 180,
      h: 110,
      partner: 'Stamp',
      domain: '',
      fillColor: '#4263eb',
      textColor: '#ffffff',
      geo: 'rectangle',
      categoryId: 'ad-servers',
    }
  }

  override component(shape: StampShape) {
    const kind = (shape.meta as { kind?: string }).kind
    if (kind === 'flagship') return <FlagshipStampView shape={shape} />
    return <StampView shape={shape} />
  }

  override canEdit(shape: StampShape): boolean {
    return STAMPS_EDITABLE_CATEGORIES.has(shape.props.categoryId)
  }

  override onEditEnd(shape: StampShape) {
    const refs = flagshipEditRefs.get(shape.id)
    if (!refs) return

    const partnerText = refs.partner?.textContent?.trim() ?? ''
    const nextPartner = partnerText.length > 0 ? partnerText : shape.props.partner
    const partnerChanged = nextPartner !== shape.props.partner

    const kind = (shape.meta as { kind?: string }).kind
    const isFlagship = kind === 'flagship'
    const meta = shape.meta as {
      features?: string[]
      kind?: string
      headerText?: string
    }

    let featuresChanged = false
    let nextFeatures: string[] = []
    if (isFlagship && refs.bullets) {
      const currentFeatures =
        meta.features ?? FLAGSHIP_FEATURES[shape.props.categoryId] ?? []
      nextFeatures = readBulletsText(refs.bullets)
      featuresChanged =
        nextFeatures.length !== currentFeatures.length ||
        nextFeatures.some((x, i) => x !== currentFeatures[i])
    }

    let headerChanged = false
    let nextHeader: string | undefined = meta.headerText
    if (refs.header) {
      const headerText = refs.header.textContent?.trim() ?? ''
      nextHeader = headerText.length > 0 ? headerText : meta.headerText
      headerChanged = nextHeader !== meta.headerText
    }

    if (!partnerChanged && !featuresChanged && !headerChanged) return

    const updatedMeta = { ...meta }
    if (featuresChanged) updatedMeta.features = nextFeatures
    if (headerChanged) updatedMeta.headerText = nextHeader

    this.editor.updateShapes([{
      id: shape.id,
      type: 'stamp',
      ...(partnerChanged ? { props: { partner: nextPartner } } : {}),
      ...(featuresChanged || headerChanged ? { meta: updatedMeta } : {}),
    } as never])
  }

  override indicator(shape: StampShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={6} />
  }

  override canResize() {
    return true
  }
}
