import { TTMLLyrics, TTMLLine, TTMLWord } from './ttmlModels'

// Helper to convert time format (e.g. "29.730" or "1:06.630") to milliseconds
export function parseTimeToMs(timeStr: string | null): number {
  if (!timeStr) return 0
  const parts = timeStr.trim().split(':')
  if (parts.length === 1) {
    // Just seconds, e.g. "29.730"
    return Math.round(parseFloat(parts[0]) * 1000)
  }
  if (parts.length === 2) {
    // MM:SS.mmm, e.g. "1:06.630"
    const mins = parseInt(parts[0], 10)
    const secs = parseFloat(parts[1])
    return Math.round((mins * 60 + secs) * 1000)
  }
  if (parts.length === 3) {
    // HH:MM:SS.mmm
    const hrs = parseInt(parts[0], 10)
    const mins = parseInt(parts[1], 10)
    const secs = parseFloat(parts[2])
    return Math.round((hrs * 3600 + mins * 60 + secs) * 1000)
  }
  return 0
}

export function parseTTML(xmlStr: string): TTMLLyrics {
  const startIdx = xmlStr.indexOf('<')
  if (startIdx >= 0) {
    xmlStr = xmlStr.slice(startIdx)
  }
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'application/xml')

  // Check for parser errors
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    console.error('TTML XML parsing error:', parserError.textContent)
  }

  const lines: TTMLLine[] = []

  // Use getElementsByTagNameNS to match elements in any namespace (XML namespace-aware)
  const pElements = doc.getElementsByTagNameNS ? doc.getElementsByTagNameNS('*', 'p') : doc.getElementsByTagName('p')

  for (let i = 0; i < pElements.length; i++) {
    const pEl = pElements[i]
    
    // Parse line attributes
    const beginAttr = pEl.getAttribute('begin')
    const endAttr = pEl.getAttribute('end')
    
    // Check both standard ttm:agent and simply agent
    let agent = pEl.getAttribute('ttm:agent') || pEl.getAttribute('agent') || ''
    
    // If agent is still empty, look at parent div or other ancestors
    if (!agent) {
      let parent: HTMLElement | null = pEl.parentElement
      while (parent) {
        const parentAgent = parent.getAttribute('ttm:agent') || parent.getAttribute('agent')
        if (parentAgent) {
          agent = parentAgent
          break
        }
        parent = parent.parentElement
      }
    }

    const startMs = parseTimeToMs(beginAttr)
    const endMs = parseTimeToMs(endAttr)

    // Now extract child elements/text nodes recursively to preserve nested spans and spaces!
    const words: TTMLWord[] = []
    let pendingText = ''

    function processNode(node: Node, parentRole: string) {
      if (node.nodeType === 1) { // ELEMENT_NODE
        const el = node as HTMLElement
        const localName = el.localName || el.nodeName.toLowerCase()
        
        if (localName === 'span') {
          const wBegin = el.getAttribute('begin')
          const wEnd = el.getAttribute('end')
          const wDur = el.getAttribute('dur')
          const currentRole = el.getAttribute('ttm:role') || el.getAttribute('role') || parentRole
          const isBackground = currentRole === 'x-bg'

          // Check if it has child spans
          const childSpans = Array.from(el.childNodes).filter(
            c => c.nodeType === 1 && ((c as Element).localName === 'span' || c.nodeName === 'span')
          )

          if (childSpans.length > 0) {
            // It has child spans, recurse into them
            for (const child of Array.from(el.childNodes)) {
              processNode(child, currentRole)
            }
          } else {
            // It is a leaf span
            let text = el.textContent || ''
            if (pendingText) {
              text = pendingText + text
              pendingText = ''
            }

            let wStartMs = wBegin ? parseTimeToMs(wBegin) : startMs
            if (wBegin && wStartMs < startMs) {
              wStartMs += startMs
            }

            let wEndMs = endMs
            if (wEnd) {
              wEndMs = parseTimeToMs(wEnd)
              if (wEndMs < startMs) {
                wEndMs += startMs
              }
            } else if (wDur) {
              wEndMs = wStartMs + parseTimeToMs(wDur)
            }

            const wordObj: TTMLWord = {
              text,
              startMs: wStartMs,
              endMs: wEndMs
            }
            if (isBackground) {
              wordObj.isBackground = true
            }
            words.push(wordObj)
          }
        } else {
          // Some other element, recurse
          for (const child of Array.from(el.childNodes)) {
            processNode(child, parentRole)
          }
        }
      } else if (node.nodeType === 3) { // TEXT_NODE
        const text = node.textContent || ''
        if (text) {
          if (words.length > 0) {
            words[words.length - 1].text += text
          } else {
            pendingText += text
          }
        }
      }
    }

    const childNodes = Array.from(pEl.childNodes)
    for (const child of childNodes) {
      processNode(child, '')
    }

    // If there's still pendingText and no words were created, create one single word
    if (pendingText && words.length === 0) {
      words.push({
        text: pendingText,
        startMs,
        endMs
      })
    } else if (pendingText && words.length > 0) {
      // Append any trailing pendingText to the last word
      words[words.length - 1].text += pendingText
    }

    for (const w of words) {
      if (w.isBackground && w.text) {
        w.text = w.text.replace(/^\s*\(\s*/g, '').replace(/\s*\)\s*$/g, '')
      }
    }

    lines.push({
      startMs,
      endMs,
      agent,
      words
    })
  }

  // Sort lines by startMs to ensure correct display order
  lines.sort((a, b) => a.startMs - b.startMs)

  // Inject instrumental breaks
  const finalLines: TTMLLine[] = []
  
  // Check for intro instrumental break
  if (lines.length > 0 && lines[0].startMs >= 3500) {
    finalLines.push({
      startMs: 0,
      endMs: lines[0].startMs,
      agent: lines[0].agent || '',
      words: [],
      isInstrumental: true
    })
  }

  for (let i = 0; i < lines.length; i++) {
    finalLines.push(lines[i])
    if (i < lines.length - 1) {
      const currentEnd = lines[i].endMs
      const nextStart = lines[i + 1].startMs
      const gap = nextStart - currentEnd
      if (gap >= 3500) {
        finalLines.push({
          startMs: currentEnd,
          endMs: nextStart,
          agent: lines[i + 1].agent || '',
          words: [],
          isInstrumental: true
        })
      }
    }
  }

  // Parse songwriters metadata
  const songwriterElements = doc.getElementsByTagNameNS ? doc.getElementsByTagNameNS('*', 'songwriter') : doc.getElementsByTagName('songwriter')
  const songwriters: string[] = []
  for (let i = 0; i < songwriterElements.length; i++) {
    const name = songwriterElements[i].textContent?.trim()
    if (name) {
      songwriters.push(name)
    }
  }

  return { 
    lines: finalLines,
    metadata: songwriters.length > 0 ? { songwriters } : undefined
  }
}
