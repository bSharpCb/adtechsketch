// Local helper that mirrors tldraw's internal `toRichText` (from @tldraw/tlschema/lib/misc/TLRichText).
// We don't import it directly because tldraw doesn't re-export it through its public surface.
// The shape of TLRichText is a TipTap-style JSON document.

export function toRichText(text: string): unknown {
  const lines = text.split('\n')
  const content = lines.map(line => {
    if (!line) return { type: 'paragraph' }
    return { type: 'paragraph', content: [{ type: 'text', text: line }] }
  })
  return { type: 'doc', content }
}
