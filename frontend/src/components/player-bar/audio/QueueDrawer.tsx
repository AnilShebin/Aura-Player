import React from 'react'
import { motion } from 'framer-motion'
import { X, Music } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'

export const QueueDrawer: React.FC = () => {
  const { 
    showQueue, 
    setShowQueue, 
    playQueue, 
    currentQueueIndex,
    playSongDirect
  } = useMusicStore()

  return (
    <motion.div
      initial={false}
      animate={{ width: showQueue ? 360 : 0 }}
      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      className="absolute right-0 top-0 bottom-0 z-20 h-full overflow-hidden border-l border-border/20 bg-background/95 backdrop-blur-xl"
      style={{ willChange: 'width' }}
    >
      {/* Inner fixed-width content — stays 360px wide, hidden by parent overflow:hidden */}
      <div className="w-[360px] h-full flex flex-col pb-[92px]">

        <div className="pt-14 pb-4 px-4 border-b border-border/30 flex items-center justify-between shrink-0">
          <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Upcoming Tracks</span>
          <button onClick={() => setShowQueue(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {playQueue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <p className="text-[16px] font-bold text-foreground mb-2">Queue is empty</p>
              <p className="text-[13px] text-muted-foreground">Play a song to populate the queue.</p>
            </div>
          ) : (
            playQueue.map((song, i) => {
              const isCurrent = i === currentQueueIndex
              return (
                <div 
                  key={song.id || song.filePath}
                  onClick={() => playSongDirect(song, playQueue)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isCurrent ? 'bg-primary/20 border border-primary/20' : 'hover:bg-secondary/50 border border-transparent'}`}
                >
                  <div className="w-8 h-8 rounded bg-secondary overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music size={12} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-bold truncate leading-none mb-1 ${isCurrent ? 'text-primary' : 'text-foreground'}`}>{song.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate leading-none">{song.artist}</p>
                  </div>
                  {isCurrent && (
                    <div className="flex gap-0.5 items-end h-4 shrink-0">
                      <span className="w-0.5 h-2 bg-primary rounded-full animate-[musicbar_0.8s_ease-in-out_infinite]" />
                      <span className="w-0.5 h-4 bg-primary rounded-full animate-[musicbar_0.8s_ease-in-out_0.2s_infinite]" />
                      <span className="w-0.5 h-3 bg-primary rounded-full animate-[musicbar_0.8s_ease-in-out_0.4s_infinite]" />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </motion.div>
  )
}
