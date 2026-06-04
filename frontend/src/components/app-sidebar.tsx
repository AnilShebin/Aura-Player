import React from 'react'
import { Home, Heart, Disc, Music, Folder, Settings, Search, LogOut } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {
    currentTab,
    setCurrentTab,
    isLoggedIn,
    username,
    setAuthInfo,
    triggerToast,
    sidebarCollapsed,
  } = useMusicStore()

  const handleLogout = () => {
    setAuthInfo({ loggedIn: false, sessionActive: false, username: '' })
    triggerToast("Successfully logged out", "success")
  }

  // Use a constant !pl-[13px] and !pr-3. When collapsed, the padding becomes !px-[13px].
  // By maintaining justify-start, the icon remains locked at exactly 13px from the left edge, preventing animation jump.
  const itemBaseStyles = "w-full flex items-center rounded-lg !text-[13.5px] !font-light !tracking-tight transition-all duration-200 group/menu-button cursor-pointer relative !gap-2.5 !pl-[13px] !pr-3 !py-2.5 !h-10 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!px-[13px]"

  const getLinkClass = (isActive: boolean) => {
    if (isActive) {
      // Force text color to remain red even on hover to block any default white hover colors
      return `${itemBaseStyles} !bg-[#2c2c2e]/70 !text-[#fa233b] hover:!text-[#fa233b] hover:!bg-[#2c2c2e]/70`
    }
    // Inactive items: default to gray #8e8e93 and hover to soft light-gray #d1d1d6 (same as legacy)
    return `${itemBaseStyles} !text-[#8e8e93] hover:!text-[#d1d1d6] hover:!bg-white/5`
  }

  // Wrap icons in a span to apply padding, preventing the Lucide SVG from squishing/scaling when expanded.
  // Scope the group hover selector specifically to group-hover/menu-button to prevent global sidebar hover triggers.
  const getIconWrapperClass = (isActive: boolean) => {
    const base = "flex items-center justify-center shrink-0 transition-colors duration-200 w-5 h-5"
    const color = isActive
      ? "!text-[#fa233b] hover:!text-[#fa233b] group-hover/menu-button:!text-[#fa233b]"
      : "!text-[#8e8e93] group-hover/menu-button:!text-[#d1d1d6]"
    return `${base} ${color}`
  }

  const getIconClass = (isActive: boolean) => {
    if (isActive) {
      return "w-4 h-4 shrink-0 !text-[#fa233b] hover:!text-[#fa233b] group-hover/menu-button:!text-[#fa233b]"
    }
    return "w-4 h-4 shrink-0 !text-[#8e8e93] group-hover/menu-button:!text-[#d1d1d6] transition-colors duration-200"
  }

  return (
    <Sidebar collapsible="icon" className="!border-none bg-transparent" {...props}>
      {/* Sidebar Header: Unify Logo header to prevent jumping */}
      <SidebarHeader className="pt-5 pb-3 !pl-[23px] bg-transparent transition-all duration-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              onClick={() => setCurrentTab('listen-now')}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src="/logos/logo.png"
                alt="Aura Logo"
                className="w-6 h-6 object-contain transition-transform hover:scale-105 duration-200 shrink-0"
              />
              {!sidebarCollapsed && (
                <span className="text-[17px] font-light text-white tracking-wide leading-none pb-[1px] shrink-0">
                  Aura Music
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
                  className={`flex items-center rounded-lg transition-all duration-200 cursor-pointer !bg-[#282828] hover:!bg-[#323232] !text-[#8e8e93] hover:!text-[#d1d1d6] active:!bg-[#282828] active:!text-[#d1d1d6] !h-9
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
          {!sidebarCollapsed && (
            <SidebarGroupLabel className="px-3 py-2 flex items-center justify-between group cursor-default select-none text-[10px] font-bold !text-[#8e8e93] uppercase tracking-[0.1em] mb-1">
              Library
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-[2px]">
              <SidebarMenuItem className="relative">
                {currentTab === 'listen-now' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#fa233c] rounded-r-full z-20" />
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
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#fa233c] rounded-r-full z-20" />
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
                {currentTab === 'albums' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#fa233c] rounded-r-full z-20" />
                )}
                <SidebarMenuButton
                  onClick={() => setCurrentTab('albums')}
                  isActive={currentTab === 'albums'}
                  tooltip="Albums"
                  className={getLinkClass(currentTab === 'albums')}
                >
                  <span className={getIconWrapperClass(currentTab === 'albums')}>
                    <Disc className={getIconClass(currentTab === 'albums')} />
                  </span>
                  {!sidebarCollapsed && <span>Albums</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="relative">
                {currentTab === 'songs' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#fa233c] rounded-r-full z-20" />
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
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#fa233c] rounded-r-full z-20" />
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
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#fa233c] rounded-r-full z-20" />
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

          {isLoggedIn && (
            <SidebarMenuItem className="mt-2 pt-2 border-t border-white/5">
              {/* Collapsed Avatar Profile */}
              <div className="hidden group-data-[collapsible=icon]:flex justify-center py-1">
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/5 shadow-xl hover:scale-105 transition-transform bg-zinc-800 flex items-center justify-center cursor-pointer"
                  title={`Logout (${username})`}
                >
                  <img
                    src="https://is1-ssl.mzstatic.com/image/thumb/KHOaL-7vHb1uoAQT8b0ZVA/80x80cc.jpg"
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </button>
              </div>

              {/* Expanded User Profile Row */}
              <div
                onClick={handleLogout}
                className="flex group-data-[collapsible=icon]:hidden items-center justify-between px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 cursor-pointer group"
                title="Logout"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/5 shadow-xl group-hover:scale-105 transition-transform bg-zinc-800 flex items-center justify-center">
                    <img
                      src="https://is1-ssl.mzstatic.com/image/thumb/KHOaL-7vHb1uoAQT8b0ZVA/80x80cc.jpg"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[14px] !font-light text-white/90 group-hover:text-white transition-colors truncate">
                    {username || 'User'}
                  </span>
                </div>
                <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-[#fa233c] hover:scale-110 transition-all duration-200 shrink-0" />
              </div>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
