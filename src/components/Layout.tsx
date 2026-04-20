import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ConsoleSidebar } from './ConsoleSidebar';
import { GlobalModals } from './GlobalModals';
import { CommandPalette } from './CommandPalette';
import { useDataStore } from '../store/useDataStore';

export function Layout() {
  const { fetchData } = useDataStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
  const [isCollapsed, setIsCollapsed] = useState(false);    // Desktop shrink/expand
  const location = useLocation();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden relative">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-border bg-surface shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-surfaceHover rounded text-textSecondary">
            <Menu size={20} />
          </button>
          <span className="font-heading font-bold text-lg text-textPrimary tracking-tight">Vellichor</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar Wrapper - Dynamic Width */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-all duration-300 ease-in-out bg-surface md:bg-transparent 
        border-r border-border md:border-r-0
        ${isCollapsed ? 'w-20' : 'w-72 md:w-64'}
      `}>
        <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      </div>

      <main className="flex-1 flex h-full overflow-hidden relative">
        <div className="flex-1 flex flex-col h-full bg-surface md:shadow-[-4px_0_24px_-10px_rgba(0,0,0,0.05)] z-10 overflow-hidden relative md:border-l md:border-border md:rounded-tl-2xl md:mt-2">
          <Outlet />
        </div>
        <div className="hidden md:flex h-full">
          <ConsoleSidebar />
        </div>
      </main>
      <GlobalModals />
      <CommandPalette />
    </div>
  );
}