import React from 'react'
import { Home, Heart, Disc, Music, Folder, Settings, Search } from 'lucide-react'
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
  const isPlaying = useMusicStore(state => state.isPlaying)

  // Use a constant !pl-[13px] and !pr-3. When collapsed, the padding becomes !px-[13px].
  // By maintaining justify-start, the icon remains locked at exactly 13px from the left edge, preventing animation jump.
  const itemBaseStyles = "w-full flex items-center rounded-[6px] !text-[13.5px] !font-light !tracking-tight transition-all duration-200 group/menu-button cursor-pointer relative !gap-2.5 !pl-[13px] !pr-3 !py-2.5 !h-10 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!px-[13px]"

  const getLinkClass = (isActive: boolean) => {
    if (isActive) {
      // Force text color to remain red even on hover to block any default white hover colors
      return `${itemBaseStyles} !bg-[#2c2c2e]/70 !text-[#fa586a] hover:!text-[#fa586a] hover:!bg-[#2c2c2e]/70`
    }
    // Inactive items: default to gray #8e8e93 and hover to soft light-gray #d1d1d6 (same as legacy)
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
      return "w-4 h-4 shrink-0 !text-[#fa586a] hover:!text-[#fa586a] group-hover/menu-button:!text-[#fa586a]"
    }
    return "w-4 h-4 shrink-0 !text-[#8e8e93] group-hover/menu-button:!text-[#d1d1d6] transition-colors duration-200"
  }

  return (
    <Sidebar collapsible="icon" className={`${isMaximized ? 'bg-transparent !border-r-0' : 'bg-[#161616]/80 backdrop-blur-2xl !border-r !border-white/5'}`} {...props}>
      {/* Sidebar Header: Unify Logo header to prevent jumping */}
      <SidebarHeader className="pt-8 pb-3 !pl-[23px] bg-transparent transition-all duration-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              onClick={() => setCurrentTab('listen-now')}
              className="cursor-pointer hover:opacity-90 transition-opacity flex items-center h-5"
            >
              {!sidebarCollapsed ? (
                <svg height="20" viewBox="0 0 92 20" width="92" xmlns="http://www.w3.org/2000/svg" className="fill-foreground" aria-hidden="true">
                  <defs>
                    <linearGradient id="aura-logo-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#fa586a" />
                    </linearGradient>
                  </defs>
                  {/* Secondary Wave (Lower opacity for depth) */}
                  <path 
                    d="M3 10h2c1.2 0 1.8-7.5 3-7.5s1.8 14 3 14 1.8-11 3-11 1.8 8 3 8 1.8-3.5 3-3.5" 
                    stroke="url(#aura-logo-grad)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                    opacity="0.45"
                    className={isPlaying ? "animate-pulse-glow" : ""}
                  />
                  {/* Primary Wave */}
                  <path 
                    d="M1 10h2.5c1.2 0 1.8-7.5 3-7.5s1.8 14 3 14 1.8-11 3-11 1.8 8 3 8 1.8-3.5 3-3.5" 
                    stroke="url(#aura-logo-grad)" 
                    strokeWidth="2.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                    className={isPlaying ? "animate-pulse-glow" : ""}
                  />
                  {/* "Music" Text Path shifted to the right for a clean gap */}
                  <g transform="translate(7, 0)">
                    <path d="M34.752 19.746V6.243h-.088l-5.433 13.503h-2.074L21.711 6.243h-.087v13.503h-2.548V1.399h3.235l5.833 14.621h.1l5.82-14.62h3.248v18.347h-2.56zm16.649 0h-2.586v-2.263h-.062c-.725 1.602-2.061 2.504-4.072 2.504-2.86 0-4.61-1.894-4.61-4.958V6.37h2.698v8.125c0 2.034.95 3.127 2.81 3.127 1.95 0 3.124-1.373 3.124-3.458V6.37H51.4v13.376zm7.394-13.618c3.06 0 5.046 1.73 5.134 4.196h-2.536c-.15-1.296-1.087-2.11-2.598-2.11-1.462 0-2.436.724-2.436 1.793 0 .839.6 1.41 2.023 1.741l2.136.496c2.686.636 3.71 1.704 3.71 3.636 0 2.442-2.236 4.12-5.333 4.12-3.285 0-5.26-1.64-5.509-4.183h2.673c.25 1.398 1.187 2.085 2.836 2.085 1.623 0 2.623-.687 2.623-1.78 0-.865-.487-1.373-1.924-1.704l-2.136-.508c-2.498-.585-3.735-1.806-3.735-3.75 0-2.391 2.049-4.032 5.072-4.032zM66.1 2.836c0-.878.7-1.577 1.561-1.577.862 0 1.55.7 1.55 1.577 0 .864-.688 1.576-1.55 1.576a1.573 1.573 0 0 1-1.56-1.576zm.212 3.534h2.698v13.376h-2.698zm14.089 4.603c-.275-1.424-1.324-2.556-3.085-2.556-2.086 0-3.46 1.767-3.46 4.64 0 2.938 1.386 4.642 3.485 4.642 1.66 0 2.748-.928 3.06-2.48H83C82.713 18.067 80.477 20 77.317 20c-3.76 0-6.208-2.62-6.208-6.942 0-4.247 2.448-6.93 6.183-6.93 3.385 0 5.446 2.213 5.683 4.845h-2.573z" />
                  </g>
                </svg>
              ) : (
                <svg height="20" viewBox="0 0 22 20" width="22" xmlns="http://www.w3.org/2000/svg" className="fill-foreground" aria-hidden="true">
                  <defs>
                    <linearGradient id="aura-logo-grad-collapsed" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#fa586a" />
                    </linearGradient>
                  </defs>
                  {/* Secondary Wave */}
                  <path 
                    d="M3 10h2c1.2 0 1.8-7.5 3-7.5s1.8 14 3 14 1.8-11 3-11 1.8 8 3 8 1.8-3.5 3-3.5" 
                    stroke="url(#aura-logo-grad-collapsed)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                    opacity="0.45"
                    className={isPlaying ? "animate-pulse-glow" : ""}
                  />
                  {/* Primary Wave */}
                  <path 
                    d="M1 10h2.5c1.2 0 1.8-7.5 3-7.5s1.8 14 3 14 1.8-11 3-11 1.8 8 3 8 1.8-3.5 3-3.5" 
                    stroke="url(#aura-logo-grad-collapsed)" 
                    strokeWidth="2.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                    className={isPlaying ? "animate-pulse-glow" : ""}
                  />
                </svg>
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
                  className={`flex items-center rounded-[6px] transition-all duration-200 cursor-pointer !bg-[#282828] hover:!bg-[#323232] !text-[#8e8e93] hover:!text-[#d1d1d6] active:!bg-[#282828] active:!text-[#d1d1d6] !h-9
                    ${sidebarCollapsed
                      ? "!w-9 !pl-[10px] !ml-[5px]"
                      : "!w-full !pl-[15px] !ml-0"
                    }`}
                >
                  <Search size={16} className="!text-[#8e8e93] shrink-0 transition-colors duration-200" />
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
              <SidebarMenuItem className="relative">
                {currentTab === 'listen-now' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full z-20" />
                )}
                <SidebarMenuButton
                  onClick={() => setCurrentTab('listen-now')}
                  isActive={currentTab === 'listen-now'}
                  tooltip="Listen Now"
                  className={getLinkClass(currentTab === 'listen-now')}
                >
                  <span className={getIconWrapperClass(currentTab === 'listen-now')}>
                    <Home className={getIconClass(currentTab === 'listen-now')} />
                  </span>
                  {!sidebarCollapsed && <span>Listen Now</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="relative">
                {currentTab === 'favorites' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full z-20" />
                )}
                <SidebarMenuButton
                  onClick={() => setCurrentTab('favorites')}
                  isActive={currentTab === 'favorites'}
                  tooltip="Favorites"
                  className={getLinkClass(currentTab === 'favorites')}
                >
                  <span className={getIconWrapperClass(currentTab === 'favorites')}>
                    <Heart className={getIconClass(currentTab === 'favorites')} />
                  </span>
                  {!sidebarCollapsed && <span>Favorites</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="relative">
                {(currentTab === 'albums' || currentTab === 'album-detail') && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full z-20" />
                )}
                <SidebarMenuButton
                  onClick={() => setCurrentTab('albums')}
                  isActive={currentTab === 'albums' || currentTab === 'album-detail'}
                  tooltip="Albums"
                  className={getLinkClass(currentTab === 'albums' || currentTab === 'album-detail')}
                >
                  <span className={getIconWrapperClass(currentTab === 'albums' || currentTab === 'album-detail')}>
                    <Disc className={getIconClass(currentTab === 'albums' || currentTab === 'album-detail')} />
                  </span>
                  {!sidebarCollapsed && <span>Albums</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="relative">
                {currentTab === 'songs' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full z-20" />
                )}
                <SidebarMenuButton
                  onClick={() => setCurrentTab('songs')}
                  isActive={currentTab === 'songs'}
                  tooltip="Songs"
                  className={getLinkClass(currentTab === 'songs')}
                >
                  <span className={getIconWrapperClass(currentTab === 'songs')}>
                    <Music className={getIconClass(currentTab === 'songs')} />
                  </span>
                  {!sidebarCollapsed && <span>Songs</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="relative">
                {currentTab === 'folders' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full z-20" />
                )}
                <SidebarMenuButton
                  onClick={() => setCurrentTab('folders')}
                  isActive={currentTab === 'folders'}
                  tooltip="Folders"
                  className={getLinkClass(currentTab === 'folders')}
                >
                  <span className={getIconWrapperClass(currentTab === 'folders')}>
                    <Folder className={getIconClass(currentTab === 'folders')} />
                  </span>
                  {!sidebarCollapsed && <span>Folders</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-white/5 p-3 flex flex-col gap-1.5 bg-transparent">
        <SidebarMenu className="space-y-[2px]">
          <SidebarMenuItem className="relative">
            {currentTab === 'settings' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full z-20" />
            )}
            <SidebarMenuButton
              onClick={() => setCurrentTab('settings')}
              isActive={currentTab === 'settings'}
              tooltip="Settings"
              className={getLinkClass(currentTab === 'settings')}
            >
              <span className={getIconWrapperClass(currentTab === 'settings')}>
                <Settings className={getIconClass(currentTab === 'settings')} />
              </span>
              {!sidebarCollapsed && <span>Settings</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
