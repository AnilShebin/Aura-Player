export interface TTMLWord {
  text: string
  startMs: number
  endMs: number
  isBackground?: boolean
}

export interface TTMLLine {
  startMs: number
  endMs: number
  agent: string
  words: TTMLWord[]
  isInstrumental?: boolean
}

export interface TTMLMetadata {
  songwriters?: string[]
}

export interface TTMLLyrics {
  lines: TTMLLine[]
  metadata?: TTMLMetadata
}
