import React from 'react'
import { Home, Heart, Disc, Music, Folder, Settings, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isMaximized?: boolean
}

export function AppSidebar({ isMaximized, ...props }: AppSidebarProps) {
  const currentTab = useMusicStore(state => state.currentTab)
  const setCurrentTab = useMusicStore(state => state.setCurrentTab)
  const sidebarCollapsed = useMusicStore(state => state.sidebarCollapsed)
  const playlists = useMusicStore(state => state.playlists)
  const setCreatePlaylistOpen = useMusicStore(state => state.setCreatePlaylistOpen)
  const selectedPlaylist = useMusicStore(state => state.selectedPlaylist)
  const setSelectedPlaylist = useMusicStore(state => state.setSelectedPlaylist)
  const [playlistsExpanded, setPlaylistsExpanded] = React.useState(true)

  // Use a constant !pl-[13px] and !pr-3. When collapsed, the padding becomes !px-[13px].
  // By maintaining justify-start, the icon remains locked at exactly 13px from the left edge, preventing animation jump.
  const itemBaseStyles = "w-full flex items-center rounded-lg !text-[14px] !font-normal !tracking-tight transition-all duration-200 group/menu-button cursor-pointer relative !gap-2.5 !pl-[13px] !pr-3 !py-2.5 !h-10 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!px-[13px]"

  const getLinkClass = (isActive: boolean) => {
    if (isActive) {
      return `${itemBaseStyles} !bg-white/10 !text-[#fa586a] hover:!text-[#fa586a] hover:!bg-white/15`
    }
    return `${itemBaseStyles} !text-[#8e8e93] hover:!text-[#d1d1d6] hover:!bg-white/5`
  }

  // Wrap icons in a span to apply padding, preventing the Lucide SVG from squishing/scaling when expanded.
  // Scope the group hover selector specifically to group-hover/menu-button to prevent global sidebar hover triggers.
  const getIconWrapperClass = (isActive: boolean) => {
    const base = "flex items-center justify-center shrink-0 transition-colors duration-200 w-5 h-5"
    const color = isActive
      ? "!text-[#fa586a] hover:!text-[#fa586a] group-hover/menu-button:!text-[#fa586a]"
      : "!text-[#8e8e93] group-hover/menu-button:!text-[#d1d1d6]"
    return `${base} ${color}`
  }

  const getIconClass = (isActive: boolean) => {
    if (isActive) {
      return "w-[18px] h-[18px] shrink-0 !text-[#fa586a] hover:!text-[#fa586a] group-hover/menu-button:!text-[#fa586a]"
    }
    return "w-[18px] h-[18px] shrink-0 !text-[#8e8e93] group-hover/menu-button:!text-[#d1d1d6] transition-colors duration-200"
  }

  return (
    <Sidebar collapsible="icon" className={`${isMaximized ? 'bg-transparent !border-r-0' : 'bg-[#161616]/80 backdrop-blur-2xl !border-r !border-white/5'}`} {...props}>
      {/* Sidebar Header: Unify Logo header to prevent jumping */}
      <SidebarHeader className="pt-8 pb-3 !pl-[23px] bg-transparent transition-all duration-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              onClick={() => setCurrentTab('listen-now')}
              className="cursor-pointer hover:opacity-90 transition-opacity flex items-center h-8 gap-3 select-none"
            >
              <svg height="22" viewBox="0 0 32 32" width="22" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
                <defs>
                  <linearGradient id="aura-new-logo-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="60%" stopColor="#d1d1d6" />
                    <stop offset="100%" stopColor="#8e8e93" />
                  </linearGradient>
                </defs>
                <g fill="url(#aura-new-logo-grad)">
                  <rect x="2" y="16" width="2.4" height="12" rx="1.2" />
                  <rect x="6" y="9.5" width="2.4" height="18.5" rx="1.2" />
                  <rect x="10" y="4.5" width="2.4" height="16" rx="1.2" />
                  <rect x="14" y="0" width="2.4" height="14" rx="1.2" />
                  <rect x="18" y="4.5" width="2.4" height="16" rx="1.2" />
                  <rect x="22" y="9.5" width="2.4" height="18.5" rx="1.2" />
                  <rect x="26" y="16" width="2.4" height="12" rx="1.2" />
                </g>
              </svg>

              {!sidebarCollapsed && (
                <span className="text-[17px] font-bold tracking-[0.25em] text-white/90 font-sans mt-0.5">
                  AURA
                </span>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className="bg-transparent">
        {/* Search Group: Unified Search box with layout math to lock Search icon position */}
        <SidebarGroup className="py-2 px-3 bg-transparent">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div
                  onClick={() => setCurrentTab('search')}
                  className={`flex items-center rounded-lg transition-all duration-200 cursor-pointer !bg-[#1c1c1e] hover:!bg-[#2c2c2e] !text-[#8e8e93] hover:!text-[#d1d1d6] active:!bg-[#1c1c1e] active:!text-[#d1d1d6] !h-9
                    ${sidebarCollapsed
                      ? "!w-9 !pl-[10px] !ml-[5px]"
                      : "!w-full !pl-[15px] !ml-0"
                    }`}
                >
                  <Search size={16} strokeWidth={1.8} className="!text-[#8e8e93] shrink-0 transition-colors duration-200" />
                  {!sidebarCollapsed && (
                    <span className="text-[12px] !font-light pl-2.5">
                      Search
                    </span>
                  )}
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Library Group */}
        <SidebarGroup className="py-2 px-3 bg-transparent">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-[2px]">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setCurrentTab('listen-now')}
                  isActive={currentTab === 'listen-now'}
                  tooltip="Listen Now"
                  className={getLinkClass(currentTab === 'listen-now')}
                >
                  <span className={getIconWrapperClass(currentTab === 'listen-now')}>
                    <Home strokeWidth={1.8} className={getIconClass(currentTab === 'listen-now')} />
                  </span>
                  {!sidebarCollapsed && <span>Listen Now</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setCurrentTab('favorites')}
                  isActive={currentTab === 'favorites'}
                  tooltip="Favorites"
                  className={getLinkClass(currentTab === 'favorites')}
                >
                  <span className={getIconWrapperClass(currentTab === 'favorites')}>
                    <Heart strokeWidth={1.8} className={getIconClass(currentTab === 'favorites')} />
                  </span>
                  {!sidebarCollapsed && <span>Favorites</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setCurrentTab('albums')}
                  isActive={currentTab === 'albums' || currentTab === 'album-detail'}
                  tooltip="Albums"
                  className={getLinkClass(currentTab === 'albums' || currentTab === 'album-detail')}
                >
                  <span className={getIconWrapperClass(currentTab === 'albums' || currentTab === 'album-detail')}>
                    <Disc strokeWidth={1.8} className={getIconClass(currentTab === 'albums' || currentTab === 'album-detail')} />
                  </span>
                  {!sidebarCollapsed && <span>Albums</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setCurrentTab('songs')}
                  isActive={currentTab === 'songs'}
                  tooltip="Songs"
                  className={getLinkClass(currentTab === 'songs')}
                >
                  <span className={getIconWrapperClass(currentTab === 'songs')}>
                    <Music strokeWidth={1.8} className={getIconClass(currentTab === 'songs')} />
                  </span>
                  {!sidebarCollapsed && <span>Songs</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setCurrentTab('folders')}
                  isActive={currentTab === 'folders'}
                  tooltip="Folders"
                  className={getLinkClass(currentTab === 'folders')}
                >
                  <span className={getIconWrapperClass(currentTab === 'folders')}>
                    <Folder strokeWidth={1.8} className={getIconClass(currentTab === 'folders')} />
                  </span>
                  {!sidebarCollapsed && <span>Folders</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Playlists Group */}
        <SidebarGroup className="py-2 px-3 bg-transparent">
          <div className="flex items-center justify-between px-3 py-1.5 shrink-0 text-[#8e8e93] select-none">
            {!sidebarCollapsed ? (
              <>
                <span className="text-[11px] font-bold uppercase tracking-wider">Playlists</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCreatePlaylistOpen(true)
                    }}
                    className="w-5 h-5 rounded-md hover:bg-white/10 flex items-center justify-center text-[#8e8e93] hover:text-white cursor-pointer active:scale-95 transition-all"
                    title="Create Playlist"
                  >
                    <span className="text-[15px] font-normal leading-none">+</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPlaylistsExpanded(!playlistsExpanded)
                    }}
                    className="w-5 h-5 rounded-md hover:bg-white/10 flex items-center justify-center text-[#8e8e93] hover:text-white cursor-pointer active:scale-95 transition-all"
                    title={playlistsExpanded ? "Collapse Playlists" : "Expand Playlists"}
                  >
                    {playlistsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </>
            ) : (
              <div
                onClick={() => setCurrentTab('playlists')}
                className="w-full flex items-center justify-center cursor-pointer text-[#8e8e93] hover:text-white transition-colors"
                title="All Playlists"
              >
                <Music size={18} strokeWidth={1.8} />
              </div>
            )}
          </div>
          
          {!sidebarCollapsed && playlistsExpanded && (
            <SidebarGroupContent className="mt-1">
              <SidebarMenu className="space-y-[2px]">
                {/* All Playlists */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setCurrentTab('playlists')}
                    isActive={currentTab === 'playlists'}
                    tooltip="All Playlists"
                    className={getLinkClass(currentTab === 'playlists')}
                  >
                    <span className={getIconWrapperClass(currentTab === 'playlists')}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={getIconClass(currentTab === 'playlists')}>
                        <rect width="7" height="7" x="3" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="14" rx="1" />
                        <rect width="7" height="7" x="3" y="14" rx="1" />
                      </svg>
                    </span>
                    <span>All Playlists</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Individual Playlists list */}
                {playlists.map((playlist) => {
                  const isActive = currentTab === 'playlist-detail' && selectedPlaylist?.id === playlist.id
                  const isFav = playlist.id === 'favs'
                  const isGradient = playlist.coverUrl.startsWith('linear-gradient')
                  return (
                    <SidebarMenuItem key={playlist.id}>
                      <SidebarMenuButton
                        onClick={() => setSelectedPlaylist(playlist)}
                        isActive={isActive}
                        tooltip={playlist.name}
                        className={getLinkClass(isActive)}
                      >
                        <span className={getIconWrapperClass(isActive)}>
                          {isFav ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={getIconClass(isActive)}>
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ) : isGradient ? (
                            <span 
                              style={{ background: playlist.coverUrl }} 
                              className="w-4.5 h-4.5 rounded border border-white/10 shrink-0"
                            />
                          ) : (
                            <img src={playlist.coverUrl} className="w-4.5 h-4.5 rounded object-cover border border-white/10 shrink-0" alt="" />
                          )}
                        </span>
                        <span className="truncate pr-1">{playlist.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-white/5 p-3 flex flex-col gap-1.5 bg-transparent">
        <SidebarMenu className="space-y-[2px]">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setCurrentTab('settings')}
              isActive={currentTab === 'settings'}
              tooltip="Settings"
              className={getLinkClass(currentTab === 'settings')}
            >
              <span className={getIconWrapperClass(currentTab === 'settings')}>
                <Settings strokeWidth={1.8} className={getIconClass(currentTab === 'settings')} />
              </span>
              {!sidebarCollapsed && <span>Settings</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
