import React, { useState, useEffect, useMemo } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import FloatingFarmerBubble from '@/components/FloatingFarmerBubble';
import Dashboard from "./pages/Dashboard";
import GovernmentSchemes from "./pages/GovernmentSchemes";
import FertilizerAdvisor from "./pages/FertilizerAdvisor";
import CropHealth from "./pages/CropHealth";
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound'; // Added missing import
import './i18n'; // Initialize i18n
import EquipmentRental from './pages/EquipmentRental';
import { RoleProvider } from '@/contexts/RoleContext';


const App: React.FC = (): JSX.Element => {
  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number }>({ 
    x: window.innerWidth - 100, 
    y: window.innerHeight - 100 
  });

  const queryClient = useMemo(() => new QueryClient(), []);

  // Function to constrain position to viewport bounds
  const constrainToViewport = (pos: { x: number; y: number }): { x: number; y: number } => {
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 80;
    return {
      x: Math.max(0, Math.min(pos.x, maxX)),
      y: Math.max(0, Math.min(pos.y, maxY))
    };
  };

  // Handle window resize to keep bubble in view
  useEffect((): (() => void) => {
    const handleResize = (e: Event): void => {
      setBubblePosition(prev => constrainToViewport(prev));
    };

    window.addEventListener('resize', handleResize as EventListener);
    return () => window.removeEventListener('resize', handleResize as EventListener);
  }, []);

  // Initialize bubble position on component mount
  useEffect(() => {
    const initialPosition = constrainToViewport(bubblePosition);
    if (initialPosition.x !== bubblePosition.x || initialPosition.y !== bubblePosition.y) {
      setBubblePosition(initialPosition);
    }
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <RoleProvider>  
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <SidebarProvider>
                <div className="min-h-screen flex w-full bg-background relative">
                  {/* Move the navigation logic to a component that has access to useNavigate */}
                  <ChatBubbleContainer 
                    bubblePosition={bubblePosition} 
                    setBubblePosition={setBubblePosition} 
                  />
                  {/* Sidebar */}
                  <AppSidebar />

                  {/* Main Content */}
                  <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Global Sidebar Trigger */}
                    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/20 px-4 py-3 flex items-center justify-between relative">
                      <div className="flex items-center space-x-4">
                        <SidebarTrigger />
                      </div>
                      <div className="flex items-center">
                        <LanguageSelector />
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto p-6">
                      <ErrorBoundary>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/chat" element={<Chat />} />
                          <Route path="/schemes" element={<GovernmentSchemes />} />
                          <Route path="/fertilizer" element={<FertilizerAdvisor />} />
                          <Route path="/crop-health" element={<CropHealth />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/rental" element={<EquipmentRental />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ErrorBoundary>
                    </div>
                  </main>
                  
                </div>
              </SidebarProvider>
            </BrowserRouter>
            <Sonner position="bottom-right" />
          </TooltipProvider>
        </QueryClientProvider>
         </RoleProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

// Separate component to handle chat bubble with navigation
const ChatBubbleContainer: React.FC<{ 
  bubblePosition: { x: number; y: number }, 
  setBubblePosition: (pos: { x: number; y: number }) => void 
}> = ({ bubblePosition, setBubblePosition }) => {
  const navigate = useNavigate();
  
  const handleOpenChat = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    console.log('Navigating to chat page');
    // Use both methods to ensure navigation works
    window.location.pathname = '/chat';
    navigate('/chat');
  };
  
  return (
    <div className="fixed z-50">
      <FloatingFarmerBubble 
        onOpenChat={handleOpenChat}
        isMinimized={false}
        position={bubblePosition}
        onPositionChange={setBubblePosition}
      />
    </div>
  );
};

export default App;
