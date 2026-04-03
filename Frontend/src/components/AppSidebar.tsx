import React from 'react';
import {
  MessageCircle,
  FileText,
  Sparkles,
  Camera,
  Bell,
  User,
  Settings,
  Home,
  Leaf
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
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
import farmerAvatar from '@/assets/farmer-avatar.png';
import { Tractor } from 'lucide-react';

// Navigation items with translation keys
const navigationItems = [
  { titleKey: 'nav.home', url: '/', icon: Home },
  { titleKey: 'nav.chat', url: '/chat', icon: MessageCircle },
  { titleKey: 'nav.schemes', url: '/schemes', icon: FileText },
  { titleKey: 'nav.fertilizer', url: '/fertilizer', icon: Sparkles },
  { titleKey: 'nav.cropHealth', url: '/crop-health', icon: Camera },
  { titleKey: 'nav.rental', url: '/rental', icon: Tractor },
];

const userItems = [
  { titleKey: 'nav.notifications', url: '/notifications', icon: Bell },
  { titleKey: 'nav.profile', url: '/profile', icon: User },
  { titleKey: 'nav.settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useLanguage();
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar
      className="transition-all duration-500 ease-in-out border-r border-border/20 bg-sidebar shadow-sm group/sidebar"
      collapsible="icon"
      variant="sidebar"
    >
          <SidebarHeader className="p-3 border-b border-border/10">
            <div className="flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
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

      <SidebarContent className="px-2 py-4">
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

        {/* Profile Card */}
        {!isCollapsed && (
          <div className="mt-auto p-4 animate-sidebar-slide-in">
            <div className="bg-sidebar-accent/50 rounded-xl p-4 shadow-sm border border-sidebar-border/50 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-3">
                <img
                  src={farmerAvatar}
                  alt="Farmer Profile"
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{t('sidebar.farmerName')}</p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">{t('sidebar.farmerTitle')}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-sidebar-foreground/70 space-y-1">
                <p className="truncate">{t('sidebar.location')}</p>
                <p className="truncate">{t('sidebar.landSize')}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}