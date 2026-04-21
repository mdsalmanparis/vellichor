import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { 
  Folder as FolderIcon, FileText, ChevronRight, ChevronDown, 
  Plus, LogOut, Moon, Sun, Trash2,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { TrashModal } from './TrashModal';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { folders, pages } = useDataStore();
  const { signOut, user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const activeFolders = folders.filter(f => !f.is_deleted);
  const activePages = pages.filter(p => !p.is_deleted);

  const toggleFolder = (id: string) => !isCollapsed && setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));

  // Helper for creating content (omitted logic for brevity, same as yours)
  const handleCreateFolder = async () => { /* ... */ };

  return (
    <aside className="w-full h-full flex flex-col text-sm text-textSecondary select-none transition-all duration-300">
      {/* Header with Toggle */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <h2 className="font-heading font-bold text-xl text-textPrimary tracking-tight">Vellichor</h2>}
        <button onClick={onToggle} className="p-1.5 hover:bg-surfaceHover rounded-md text-textSecondary transition-colors">
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation Area */}
      <div className={`flex-1 overflow-y-auto px-2 space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {activeFolders.map(folder => (
          <div key={folder.id} className="w-full space-y-0.5">
            <div 
              className={`flex items-center px-2 py-1.5 hover:bg-surfaceHover rounded-md cursor-pointer group ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              onClick={() => toggleFolder(folder.id)}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                {!isCollapsed && (expandedFolders[folder.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                <FolderIcon size={isCollapsed ? 20 : 14} className="text-accent shrink-0" />
                {!isCollapsed && <span className="truncate text-textPrimary font-medium">{folder.title}</span>}
              </div>
            </div>

            {/* Sub-items (Hidden when collapsed) */}
            {!isCollapsed && expandedFolders[folder.id] && (
              <div className="pl-4 space-y-0.5">
                {activePages.filter(p => p.folder_id === folder.id && !p.section_id).map(page => (
                  <div key={page.id} onClick={() => navigate(`/page/${page.id}`)} className="flex items-center justify-between px-2 py-1.5 hover:bg-surfaceHover rounded-md cursor-pointer ml-3 group/page text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={12} className="opacity-60 shrink-0" />
                      <span className="truncate">{page.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button onClick={handleCreateFolder} className={`flex items-center gap-2 px-4 py-2 mt-4 text-textSecondary hover:text-textPrimary hover:bg-surfaceHover rounded-md transition-all ${isCollapsed ? 'justify-center w-10' : 'w-full'}`}>
          <Plus size={isCollapsed ? 20 : 16} />
          {!isCollapsed && <span>New Folder</span>}
        </button>
      </div>

      {/* Recycle Bin */}
      <div className="px-2 py-2 mt-auto">
        <button 
          onClick={() => setIsTrashOpen(true)}
          className={`flex items-center gap-2 py-2 text-textSecondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all border border-transparent ${isCollapsed ? 'justify-center w-full px-0' : 'w-full px-4'}`}
        >
          <Trash2 size={isCollapsed ? 20 : 14} />
          {!isCollapsed && <span className="text-sm font-medium">Recycle Bin</span>}
        </button>
      </div>

      {/* User & Theme Footer */}
      <div className={`p-4 border-t border-border flex ${isCollapsed ? 'flex-col gap-4 items-center' : 'items-center justify-between'}`}>
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          {!isCollapsed && <span className="truncate text-[10px]">{user?.email}</span>}
        </div>
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'gap-1'}`}>
          <button onClick={toggleTheme} className="p-1.5 hover:bg-surfaceHover rounded-md text-textSecondary">
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={signOut} className="p-1.5 hover:bg-surfaceHover rounded-md text-textSecondary">
            <LogOut size={14} />
          </button>
        </div>
      </div>
      
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
    </aside>
  );
}