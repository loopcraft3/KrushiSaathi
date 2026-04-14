import React, { useState } from 'react';
import {
  MessageCircle,
  FileText,
  Sparkles,
  Camera,
  Bell,
  User,
  Settings,
  Home,
  Leaf,
  Tractor,
  LogOut,
  MapPin,
  Wheat,
  LayoutGrid,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import farmerAvatar from '@/assets/farmer-avatar.png';

const FARMER_TYPE_META: Record<string, { label: string; icon: string }> = {
  wheat:        { label: 'Wheat Farmer',     icon: '🌾' },
  kharif:       { label: 'Kharif Farmer',    icon: '🌽' },
  rabi:         { label: 'Rabi Farmer',      icon: '🌿' },
  horticulture: { label: 'Horticulture',     icon: '🍎' },
  mixed:        { label: 'Mixed Farming',    icon: '🌱' },
  dairy:        { label: 'Dairy Farmer',     icon: '🐄' },
  organic:      { label: 'Organic Farmer',   icon: '♻️' },
  vendor:       { label: 'Equipment Vendor', icon: '🏪' },
};

const navigationItems = [
  { titleKey: 'nav.home',      url: '/',           icon: Home },
  { titleKey: 'nav.chat',      url: '/chat',        icon: MessageCircle },
  { titleKey: 'nav.schemes',   url: '/schemes',     icon: FileText },
  { titleKey: 'nav.fertilizer',url: '/fertilizer',  icon: Sparkles },
  { titleKey: 'nav.cropHealth',url: '/crop-health', icon: Camera },
  { titleKey: 'nav.rental',    url: '/rental',      icon: Tractor },
];

const userItems = [
  { titleKey: 'nav.notifications', url: '/notifications', icon: Bell },
  { titleKey: 'nav.profile',       url: '/profile',        icon: User },
  { titleKey: 'nav.settings',      url: '/settings',       icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const isCollapsed = state === 'collapsed';
  const isActive = (path: string) => currentPath === path;

  // Hover-expand state for the profile card
  const [cardExpanded, setCardExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');   // redirect to landing after logout
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const ftMeta = user?.farmer_type
    ? FARMER_TYPE_META[user.farmer_type]
    : user?.role === 'vendor' ? FARMER_TYPE_META['vendor'] : null;

  const locationLine = [user?.village, user?.place].filter(Boolean).join(', ');

  return (
    <Sidebar
      className="transition-all duration-500 ease-in-out border-r border-border/20 bg-sidebar shadow-sm group/sidebar"
      collapsible="icon"
      variant="sidebar"
    >
      {/* Header */}
      <SidebarHeader className="p-3 border-b border-border/10">
        <div className="flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg flex-shrink-0">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden min-w-0 flex-1 ml-3 animate-sidebar-slide-in">
              <h1 className="text-lg font-bold text-sidebar-foreground truncate">{t('app.name')}</h1>
              <p className="text-sm text-sidebar-foreground/70 truncate">{t('app.subtitle')}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 flex flex-col h-full">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-sm font-semibold text-sidebar-foreground/70 mb-2">
            {!isCollapsed && (
              <span className="animate-sidebar-fade-in">{t('sidebar.mainFeatures')}</span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="h-12 rounded-xl transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md group justify-center"
                    tooltip={isCollapsed ? t(item.titleKey) : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ease-in-out w-full ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-medium shadow-lg'
                            : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
                      {!isCollapsed && (
                        <span className="font-medium truncate animate-sidebar-slide-in">{t(item.titleKey)}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Section */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-2 text-sm font-semibold text-sidebar-foreground/70 mb-2">
            {!isCollapsed && (
              <span className="animate-sidebar-fade-in">{t('sidebar.account')}</span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {userItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="h-12 rounded-xl transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md group justify-center"
                    tooltip={isCollapsed ? t(item.titleKey) : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ease-in-out w-full ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-medium shadow-lg'
                            : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
                      {!isCollapsed && (
                        <span className="font-medium truncate animate-sidebar-slide-in">{t(item.titleKey)}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── PROFILE CARD AT BOTTOM ── */}
        <div className="mt-auto pt-3 border-t border-border/30">
          {isCollapsed ? (
            /* Collapsed state — just avatar + logout icon */
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/30 shadow-md">
                <img
                  src={farmerAvatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                  }}
                />
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Expanded sidebar — collapsible profile card */
            <div className="mx-2 mb-3">

              {/* ── Profile card: collapsed by default, expands on hover ── */}
              <div
                onMouseEnter={() => setCardExpanded(true)}
                onMouseLeave={() => setCardExpanded(false)}
                onClick={() => navigate('/profile')}
                className="cursor-pointer rounded-xl bg-sidebar-accent/40 border border-sidebar-border/40 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 mb-2 overflow-hidden"
              >
                {/* Always visible: avatar + name + role badge */}
                <div className="flex items-center gap-3 p-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/40 shadow-md flex-shrink-0">
                    <img
                      src={farmerAvatar}
                      alt="Farmer Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div style="width:100%;height:100%;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;"><span style="color:hsl(var(--primary));font-weight:700;font-size:1rem;">${initials}</span></div>`;
                        }
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-sidebar-foreground truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      @{user?.username || user?.name?.toLowerCase().replace(' ', '') || 'user'}
                    </p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold mt-0.5 ${
                      user?.role === 'farmer'
                        ? 'bg-green-500/15 text-green-700 border border-green-500/20'
                        : 'bg-blue-500/15 text-blue-700 border border-blue-500/20'
                    }`}>
                      {user?.role === 'farmer' ? '🌾' : '🏪'} {user?.role}
                    </span>
                  </div>

                  {/* Chevron */}
                  <span className={`text-sidebar-foreground/40 text-xs transition-transform duration-300 flex-shrink-0 ${
                    cardExpanded ? 'rotate-180' : ''
                  }`}>▾</span>
                </div>

                {/* Expandable details — shown on hover */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  cardExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-3 pb-3 space-y-1.5 border-t border-sidebar-border/30 pt-2">
                    {locationLine && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="text-xs text-sidebar-foreground/80 truncate">{locationLine}</span>
                      </div>
                    )}
                    {user?.land_area && (
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="text-xs text-sidebar-foreground/80">{user.land_area} acres</span>
                      </div>
                    )}
                    {ftMeta && (
                      <div className="flex items-center gap-2">
                        <Wheat className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="text-xs text-sidebar-foreground/80 truncate">
                          {ftMeta.icon} {ftMeta.label}
                        </span>
                      </div>
                    )}
                    {user?.crops_grown && user.crops_grown.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Leaf className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="text-xs text-sidebar-foreground/80 truncate">
                          {user.crops_grown.slice(0, 3).join(', ')}{user.crops_grown.length > 3 ? '…' : ''}
                        </span>
                      </div>
                    )}
                    <p className="text-[10px] text-primary/70 font-semibold pt-0.5">
                      Click to edit profile →
                    </p>
                  </div>
                </div>
              </div>

              {/* Logout button — always visible below card */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-semibold transition-all duration-200 border border-destructive/20 hover:border-destructive/40 hover:shadow-sm active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}