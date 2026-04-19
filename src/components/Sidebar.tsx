import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useModalStore } from '../store/useModalStore';
import { 
  Folder as FolderIcon, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  LogOut,
  FolderPlus,
  FilePlus2,
  Moon,
  Sun,
  Trash2
} from 'lucide-react';
import { TrashModal } from './TrashModal';


export function Sidebar() {
  const { folders, sections, pages, addFolder, addSection, addPage, removeFolder, removeSection, removePage } = useDataStore();
  const { signOut, user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { confirm, prompt } = useModalStore();
  const navigate = useNavigate();
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const activeFolders = folders.filter(f => !f.is_deleted);
  const activeSections = sections.filter(s => !s.is_deleted);
  const activePages = pages.filter(p => !p.is_deleted);

  const toggleFolder = (id: string) => setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSection = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCreateFolder = async () => {
    const title = await prompt({ title: 'Create Folder', placeholder: 'Folder name...' });
    if (title) await addFolder(title);
  };

  const handleCreateSection = async (folderId: string) => {
    const title = await prompt({ title: 'Create Section', placeholder: 'Section name...' });
    if (title) {
      await addSection(folderId, title);
      setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
    }
  };

  const handleCreatePage = async (folderId: string, sectionId: string | null = null) => {
    const title = await prompt({ title: 'Create Page', placeholder: 'Page title...' });
    if (title) {
      const page = await addPage(folderId, sectionId, title);
      if (page) {
        if (sectionId) setExpandedSections(prev => ({ ...prev, [sectionId]: true }));
        else setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
        navigate(`/page/${page.id}`);
      }
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({ title: 'Delete Folder', message: 'Are you sure? All contents will be deleted.' });
    if (isConfirmed) removeFolder(id);
  };

  const handleDeleteSection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({ title: 'Delete Section', message: 'Are you sure? All pages inside will be deleted.' });
    if (isConfirmed) removeSection(id);
  };

  const handleDeletePage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({ title: 'Delete Page', message: 'Are you sure you want to delete this page?' });
    if (isConfirmed) removePage(id);
  };

  return (
    <aside className="w-64 h-full flex flex-col text-sm text-textSecondary select-none">
      <div className="p-4 flex items-center justify-between">
        <h2 className="font-serif font-bold text-xl text-textPrimary tracking-tight">Vellichor</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {activeFolders.map(folder => (
          <div key={folder.id} className="space-y-0.5">
            <div 
              className="flex items-center justify-between px-2 py-1.5 hover:bg-surfaceHover rounded-md cursor-pointer group"
              onClick={() => toggleFolder(folder.id)}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                {expandedFolders[folder.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <FolderIcon size={14} className="text-accent" />
                <span className="truncate text-textPrimary font-medium">{folder.title}</span>
              </div>
              <div className="hidden group-hover:flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleCreateSection(folder.id); }} className="p-1 hover:bg-border rounded text-textSecondary" title="Add Section"><FolderPlus size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleCreatePage(folder.id); }} className="p-1 hover:bg-border rounded text-textSecondary" title="Add Page"><FilePlus2 size={12} /></button>
                <button onClick={(e) => handleDeleteFolder(folder.id, e)} className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded text-textSecondary" title="Delete Folder"><Trash2 size={12} /></button>
              </div>
            </div>

            {expandedFolders[folder.id] && (
              <div className="pl-4 space-y-0.5">
                {/* Pages directly under folder */}
                {activePages.filter(p => p.folder_id === folder.id && !p.section_id).map(page => (
                  <div 
                    key={page.id}
                    onClick={() => navigate(`/page/${page.id}`)}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-surfaceHover rounded-md cursor-pointer ml-3 group/page"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={14} className="opacity-60 shrink-0" />
                      <span className="truncate">{page.title}</span>
                    </div>
                    <button onClick={(e) => handleDeletePage(page.id, e)} className="hidden group-hover/page:block p-1 hover:bg-red-500/10 hover:text-red-400 rounded text-textSecondary" title="Delete Page"><Trash2 size={12} /></button>
                  </div>
                ))}

                {/* Sections under folder */}
                {activeSections.filter(s => s.folder_id === folder.id).map(section => (
                  <div key={section.id} className="space-y-0.5 ml-3">
                    <div 
                      className="flex items-center justify-between px-2 py-1.5 hover:bg-surfaceHover rounded-md cursor-pointer group"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {expandedSections[section.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span className="truncate text-textPrimary">{section.title}</span>
                      </div>
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCreatePage(folder.id, section.id); }} 
                          className="p-1 hover:bg-border rounded text-textSecondary"
                          title="Add Page"
                        >
                          <FilePlus2 size={12} />
                        </button>
                        <button onClick={(e) => handleDeleteSection(section.id, e)} className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded text-textSecondary" title="Delete Section"><Trash2 size={12} /></button>
                      </div>
                    </div>

                    {expandedSections[section.id] && (
                      <div className="pl-5 space-y-0.5">
                        {activePages.filter(p => p.section_id === section.id).map(page => (
                          <div 
                            key={page.id}
                            onClick={() => navigate(`/page/${page.id}`)}
                            className="flex items-center justify-between px-2 py-1.5 hover:bg-surfaceHover rounded-md cursor-pointer group/spage"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText size={14} className="opacity-60 shrink-0" />
                              <span className="truncate">{page.title}</span>
                            </div>
                            <button onClick={(e) => handleDeletePage(page.id, e)} className="hidden group-hover/spage:block p-1 hover:bg-red-500/10 hover:text-red-400 rounded text-textSecondary" title="Delete Page"><Trash2 size={12} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button 
          onClick={handleCreateFolder}
          className="w-full flex items-center gap-2 px-4 py-2 mt-4 text-textSecondary hover:text-textPrimary hover:bg-surfaceHover rounded-md transition-colors"
        >
          <Plus size={16} />
          <span>New Folder</span>
        </button>
      </div>

      <div className="px-4 py-2 mt-auto">
        <button 
          onClick={() => setIsTrashOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-textSecondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors border border-transparent hover:border-red-500/20"
        >
          <Trash2 size={14} />
          <span className="text-sm font-medium">Recycle Bin</span>
        </button>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <span className="truncate text-xs">{user?.email}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-1.5 hover:bg-surfaceHover rounded-md text-textSecondary" title="Toggle Theme">
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={signOut} className="p-1.5 hover:bg-surfaceHover rounded-md text-textSecondary" title="Log Out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
      
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
    </aside>
  );
}
