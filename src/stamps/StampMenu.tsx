import { useMemo, useState } from 'react'
import type { Editor } from 'tldraw'
import { createShapeId } from 'tldraw'
import {
  STAMP_CATEGORIES, STAMP_GROUPS, COLOR_HEX,
  type Partner, type StampCategory, type StampGroup,
} from './categories'

type RenderItem =
  | { kind: 'category'; cat: StampCategory }
  | { kind: 'group'; group: StampGroup; cats: StampCategory[] }

// The synthetic "Generic" stamp every category exposes: no logo, label reads
// the category's `genericLabel` (e.g. "DSP" for DSPs), falling back to the name.
function genericPartner(cat: StampCategory): Partner {
  return { name: 'Generic', domain: '', displayName: cat.genericLabel ?? cat.name }
}

function buildTree(): RenderItem[] {
  const items: RenderItem[] = []
  const seenGroups = new Set<string>()
  for (const cat of STAMP_CATEGORIES) {
    if (!cat.groupId) {
      items.push({ kind: 'category', cat })
      continue
    }
    if (seenGroups.has(cat.groupId)) continue
    const group = STAMP_GROUPS.find(g => g.id === cat.groupId)
    if (!group) {
      items.push({ kind: 'category', cat })
      continue
    }
    const cats = STAMP_CATEGORIES.filter(c => c.groupId === cat.groupId)
    items.push({ kind: 'group', group, cats })
    seenGroups.add(cat.groupId)
  }
  return items
}

export function StampMenu({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const tree = useMemo(() => buildTree(), [])

  // Top-level categories start expanded. Nested categories start collapsed
  // unless their parent group opts in via `nestedDefaultOpen`.
  const [openCats, setOpenCats] = useState<Set<string>>(
    () =>
      new Set(
        STAMP_CATEGORIES.filter(c => {
          if (!c.groupId) return true
          const group = STAMP_GROUPS.find(g => g.id === c.groupId)
          return group?.nestedDefaultOpen === true
        }).map(c => c.id),
      ),
  )
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(STAMP_GROUPS.filter(g => g.defaultOpen).map(g => g.id)),
  )

  const toggleCat = (id: string) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const drop = (cat: StampCategory, partner: Partner) => {
    const bounds = editor.getViewportPageBounds()
    const isFlagship = partner.flagship === true
    const isWarehouse = cat.id === 'warehouses'
    const isCdp = cat.id === 'cdps'
    const isDigitalProperty = cat.id === 'digital-properties'
    const isCompactCat = cat.id === 'identity' || cat.id === 'social-media'
    const defaultH =
      isFlagship ? 480 :
      isWarehouse ? 180 :
      isCdp ? 150 :
      isDigitalProperty ? 160 :
      isCompactCat ? 95 :
      120
    const defaultW =
      isFlagship ? 480 :
      isWarehouse ? 140 :
      isCdp ? 250 :
      isDigitalProperty ? 120 :
      isCompactCat ? 140 :
      200
    const h = partner.defaultH ?? defaultH
    const w = partner.defaultW ?? defaultW
    const x = bounds.x + bounds.w / 2 - w / 2
    const y = bounds.y + bounds.h / 2 - h / 2
    const id = createShapeId()
    const displayedPartner = partner.displayName ?? partner.name
    const textColor = isDigitalProperty ? '#111827' : '#ffffff'
    const geo = partner.geo ?? cat.geo
    const meta: Record<string, unknown> = {}
    if (isFlagship) meta.kind = 'flagship'
    if (partner.headerText) meta.headerText = partner.headerText
    if (partner.logoUrl) meta.logoUrl = partner.logoUrl
    editor.createShapes([{
      id,
      type: 'stamp',
      x,
      y,
      props: {
        w,
        h,
        partner: displayedPartner,
        domain: partner.domain,
        fillColor: COLOR_HEX[partner.color ?? cat.color] ?? '#4263eb',
        textColor,
        geo,
        categoryId: cat.id,
      },
      meta,
    } as never])
    editor.setCurrentTool('select')
    editor.select(id)
  }

  const renderCategory = (cat: StampCategory) => (
    <div key={cat.id} className="boardsharp-cat">
      <div className="boardsharp-cat__header" onClick={() => toggleCat(cat.id)}>
        <span className="boardsharp-cat__swatch" style={{ background: COLOR_HEX[cat.color] ?? '#888' }} />
        <span>{openCats.has(cat.id) ? '▾' : '▸'} {cat.name}</span>
      </div>
      {openCats.has(cat.id) && (
        <div className="boardsharp-cat__list">
          {(cat.noGeneric ? cat.partners : [...cat.partners, genericPartner(cat)]).map(p => (
            <button
              key={p.name}
              className="boardsharp-cat__partner"
              onClick={() => drop(cat, p)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="boardsharp-panel">
      <div className="boardsharp-panel__header">
        <span>Stamps</span>
        <button className="boardsharp-panel__close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="boardsharp-panel__body">
        {tree.map(item => {
          if (item.kind === 'category') return renderCategory(item.cat)
          const isOpen = openGroups.has(item.group.id)
          return (
            <div key={item.group.id} className="boardsharp-group">
              <div className="boardsharp-group__header" onClick={() => toggleGroup(item.group.id)}>
                <span>{isOpen ? '▾' : '▸'} {item.group.name}</span>
              </div>
              {isOpen && (
                <div className="boardsharp-group__list">
                  {item.cats.map(c => renderCategory(c))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
