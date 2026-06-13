# Graph Report - .  (2026-06-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 529 nodes · 882 edges · 75 communities (67 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0772c4b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 67 edges
2. `useMusicStore` - 49 edges
3. `LibraryService` - 16 edges
4. `Song` - 15 edges
5. `PlaybackService` - 12 edges
6. `PlaybackService` - 12 edges
7. `useSmoothScroll()` - 9 edges
8. `PlaybackService` - 9 edges
9. `SettingsService` - 9 edges
10. `parseLyrics()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `NewLibraryService()`  [INFERRED]
  main.go → internal/library/service.go
- `main()` --calls--> `NewLyricsService()`  [INFERRED]
  main.go → internal/lyrics/service.go
- `main()` --calls--> `GetThumbnailPath()`  [INFERRED]
  main.go → internal/library/resize.go
- `main()` --calls--> `NewSettingsService()`  [INFERRED]
  main.go → internal/settings/service.go
- `main()` --calls--> `NewUpdaterService()`  [INFERRED]
  main.go → internal/updater/service.go

## Import Cycles
- None detected.

## Communities (75 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (23): Event, DB, LibraryService, Mutex, AlbumSummary, cleanDisplayTitle(), cleanM4AMetadataString(), determineAlbumArtist() (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (30): AppSidebar(), AppSidebarProps, useIsMobile(), Sidebar(), SidebarContent(), SidebarContext, SidebarContextProps, SidebarFooter() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (17): KaraokeView(), KaraokeViewProps, InstrumentalDots, LyricLine, LyricLineItem, LyricLineItemProps, SyncedLyricsProps, TTMLLine (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (17): LyricsSearchPanel(), LyricsSearchPanelProps, CATEGORIES, RecentSearchItem, Search(), EditPlaylistModalProps, PRESET_GRADIENTS, AlbumSummary (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (10): Image, DB, SettingsService, UpdaterService, GetThumbnailPath(), ResizeNearest(), main(), NewSettingsService() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (14): DB, LyricsService, LRCLibSearchResult, LRCLibTrack, LyricLine, LyricsResult, parseLRC(), parseLyrics() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (5): $$createType2, $$createType1, LRCLibSearchResult, LyricLine, LyricsResult

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (11): MarqueeText, PlayerBar(), ProgressBar(), VolumeControl, VolumeControlProps, LosslessIcon(), LosslessIconProps, SpatialAudioIcon() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (6): $$createType1, $$createType3, AlbumSummary, $$createType1, $$createType2, Song

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (14): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), Breadcrumb(), BreadcrumbEllipsis() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (3): $$createType1, $$createType2, DB

### Community 12 - "Community 12"
Cohesion: 0.21
Nodes (5): App, Mutex, PlaybackService, PlayerStatus, NewPlaybackService()

### Community 13 - "Community 13"
Cohesion: 0.21
Nodes (5): App, Mutex, PlaybackService, PlayerStatus, NewPlaybackService()

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (9): Button(), buttonVariants, Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (11): QueueDrawer(), useSmoothScroll(), Albums(), useGridColumns(), Songs(), SortField, SortOrder, GetAlbums() (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.28
Nodes (6): CardMarquee, ListenNow(), SongContextMenu(), Song, SongRow, SongRowProps

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (5): PlaylistDetail(), EditPlaylistModal(), PlaylistCover(), PlaylistCoverProps, ToggleFavorite()

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (7): Input(), Separator(), Skeleton(), Tooltip(), TooltipContent(), TooltipProvider(), TooltipTrigger()

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (3): PlaybackService, PlayerStatus, NewPlaybackService()

### Community 22 - "Community 22"
Cohesion: 0.31
Nodes (9): mpvEvent, mpvEventEndFile, mpvEventProperty, Pointer, cGoString(), mpvCommand(), mpvSetFlag(), mpvSetFloat() (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.31
Nodes (9): mpvEvent, mpvEventEndFile, mpvEventProperty, Pointer, cGoString(), mpvCommand(), mpvSetFlag(), mpvSetFloat() (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.24
Nodes (8): LyricsDrawer(), SyncedLyrics(), Favorites(), Playlists(), AmbientBackdrop(), UpdateDialog(), CollectionContextMenu(), useMusicStore

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (8): AddFolder(), $$createType0, DeleteFolder(), GetFolders(), IsFirstTime(), SetFirstTime(), OnboardingWelcome(), OnboardingWelcomeProps

### Community 26 - "Community 26"
Cohesion: 0.40
Nodes (4): AlbumArtwork, AlbumArtworkProps, AlbumCard, AlbumCardProps

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (4): LRCLibSearchResult, LyricLine, LyricsResult, SearchOnlineLyrics()

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (4): Settings(), SettingSection, GetCurrentVersion(), UpdateInfo

### Community 30 - "Community 30"
Cohesion: 0.40
Nodes (4): TitleBar(), TitleBarProps, WindowControls(), WindowControlsProps

### Community 31 - "Community 31"
Cohesion: 0.50
Nodes (3): CreatePlaylistModal(), CreatePlaylistModalProps, PRESET_GRADIENTS

## Knowledge Gaps
- **64 isolated node(s):** `$$createType1`, `$$createType3`, `$$createType1`, `$$createType2`, `$$createType2` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useMusicStore` connect `Community 24` to `Community 1`, `Community 2`, `Community 3`, `Community 7`, `Community 15`, `Community 17`, `Community 18`, `Community 26`, `Community 28`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 9` to `Community 1`, `Community 10`, `Community 19`, `Community 14`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 4` to `Community 0`, `Community 5`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `$$createType1`, `$$createType3`, `$$createType1` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._