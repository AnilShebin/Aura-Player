import React, { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Music, Infinity } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

export const QueueDrawer: React.FC = () => {
  const showQueue      = useMusicStore(state => state.showQueue)
  const playQueue      = useMusicStore(state => state.playQueue)
  const currentQueueIndex = useMusicStore(state => state.currentQueueIndex)
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const isMaximized    = useMusicStore(state => state.isMaximized)
  const repeatMode     = useMusicStore(state => state.repeatMode)
  const setRepeatMode  = useMusicStore(state => state.setRepeatMode)
  const clearPlayQueue = useMusicStore(state => state.clearPlayQueue)
  const removeFromPlayQueue = useMusicStore(state => state.removeFromPlayQueue)

  const parentRef = useRef<HTMLDivElement>(null)
  useSmoothScroll(parentRef)

  // Queue shown = everything from current song onward
  // We still use the full playQueue with absolute indices for removal
  const rowVirtualizer = useVirtualizer({
    count: playQueue.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 20,
  })

  const handlePlayQueueItem = useCallback((song: any) => {
    playSongDirect(song, playQueue)
  }, [playSongDirect, playQueue])

  const handleRemove = useCallback((e: React.MouseEvent, absoluteIndex: number) => {
    e.stopPropagation()
    removeFromPlayQueue(absoluteIndex)
  }, [removeFromPlayQueue])

  const handleClear = useCallback(() => {
    clearPlayQueue()
  }, [clearPlayQueue])

  const handleInfinityToggle = useCallback(() => {
    setRepeatMode(repeatMode === 'all' ? 'off' : 'all')
  }, [repeatMode, setRepeatMode])

  const isLooping = repeatMode === 'all'

  return (
    <motion.div
      initial={false}
      animate={{ width: showQueue ? 300 : 0 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className={`${isMaximized ? 'relative' : 'absolute'} right-0 top-0 bottom-0 z-20 h-full overflow-hidden shrink-0 ${
        isMaximized ? 'bg-transparent border-l-0' : 'bg-[#1a1a1a] border-l border-white/[0.06]'
      }`}
      style={{ willChange: 'width' }}
    >
      <div className="w-[300px] h-full flex flex-col pb-[88px]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-6 pb-3 shrink-0">
          <h2 className="text-[18px] font-bold text-white tracking-tight">Up next</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClear}
              className="text-[13px] font-normal text-[#fa586a] hover:opacity-75 transition-opacity cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={handleInfinityToggle}
              title={isLooping ? 'Disable loop' : 'Loop queue'}
              className={`transition-colors cursor-pointer ${isLooping ? 'text-[#fa586a]' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Infinity size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {playQueue.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-2">
            <p className="text-[15px] font-semibold text-white">Queue is empty</p>
            <p className="text-[12px] text-zinc-500 leading-relaxed">Play a song to populate the queue.</p>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="flex-1 overflow-y-auto custom-scrollbar px-3"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const absoluteIndex = virtualItem.index
                const song    = playQueue[absoluteIndex]
                const isCurrent = absoluteIndex === currentQueueIndex

                return (
                  <div
                    key={song.id || song.filePath || absoluteIndex}
                    className="absolute top-0 left-0 w-full group/row"
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translate3d(0, ${virtualItem.start}px, 0)`,
                    }}
                  >
                    <div
                      onClick={() => handlePlayQueueItem(song)}
                      className={`flex items-center gap-3 px-1.5 py-1.5 rounded-lg cursor-pointer transition-colors duration-150 h-[54px] ${
                        isCurrent ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                      } transform-gpu`}
                      style={{ contain: 'layout style' }}
                    >
                      {/* Album Art with Overlap Remove Badge */}
                      <div className="relative shrink-0 select-none">
                        <div className="w-[40px] h-[40px] rounded-[4px] overflow-hidden bg-zinc-800 border border-white/[0.06] shadow-md">
                          {song.coverUrl ? (
                            <img
                              src={song.coverUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={14} className="text-zinc-600" />
                            </div>
                          )}
                        </div>

                        {/* Remove Badge — visible on hover over row */}
                        <button
                          onClick={(e) => handleRemove(e, absoluteIndex)}
                          className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] rounded-full bg-[#ff3b30] border border-white flex items-center justify-center shadow-md opacity-0 group-hover/row:opacity-100 transition-opacity duration-150 cursor-pointer z-10 hover:scale-105 active:scale-95 shrink-0"
                          title="Remove from queue"
                        >
                          <div className="w-[9px] h-[2px] bg-white rounded-full shrink-0" />
                        </button>
                      </div>

                      {/* Title + Artist */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold truncate leading-tight mb-[3px] ${
                          isCurrent ? 'text-[#fa586a]' : 'text-zinc-100'
                        }`}>
                          {song.title}
                        </p>
                        <p className={`text-[11px] truncate leading-tight font-light ${
                          isCurrent ? 'text-zinc-300' : 'text-zinc-400'
                        }`}>
                          {song.artist}
                        </p>
                      </div>

                      {/* Duration — always shown */}
                      <span className={`text-[11px] font-light tabular-nums shrink-0 pr-1 ${
                        isCurrent ? 'text-zinc-300' : 'text-zinc-400'
                      }`}>
                        {song.duration}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
