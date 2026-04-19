import { X, Folder, FileText, FolderTree, RefreshCw, Trash2 } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrashModal({ isOpen, onClose }: TrashModalProps) {
  const { 
    folders, sections, pages, 
    restoreFolder, hardDeleteFolder,
    restoreSection, hardDeleteSection,
    restorePage, hardDeletePage
  } = useDataStore();

  if (!isOpen) return null;

  const deletedFolders = folders.filter(f => f.is_deleted);
  const deletedSections = sections.filter(s => s.is_deleted);
  const deletedPages = pages.filter(p => p.is_deleted);

  const isEmpty = deletedFolders.length === 0 && deletedSections.length === 0 && deletedPages.length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surfaceHover">
          <div className="flex items-center gap-2">
            <Trash2 className="text-red-400" size={18} />
            <h2 className="font-medium text-textPrimary">Recycle Bin</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-border rounded text-textSecondary">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center text-textSecondary opacity-50 py-12">
              <Trash2 size={48} className="mb-4" />
              <p>Your trash is empty.</p>
            </div>
          ) : (
            <>
              {deletedFolders.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Deleted Folders</h3>
                  {deletedFolders.map(folder => (
                    <div key={folder.id} className="flex items-center justify-between p-3 bg-surfaceHover rounded-lg border border-border">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Folder className="text-accent shrink-0" size={16} />
                        <span className="truncate text-textPrimary text-sm">{folder.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => restoreFolder(folder.id)} className="flex items-center gap-1 text-xs text-green-500 hover:bg-green-500/10 px-2 py-1 rounded">
                          <RefreshCw size={12} /> Restore
                        </button>
                        <button onClick={() => hardDeleteFolder(folder.id)} className="flex items-center gap-1 text-xs text-red-400 hover:bg-red-400/10 px-2 py-1 rounded">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {deletedSections.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mt-4">Deleted Sections</h3>
                  {deletedSections.map(section => (
                    <div key={section.id} className="flex items-center justify-between p-3 bg-surfaceHover rounded-lg border border-border">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FolderTree className="text-textSecondary shrink-0" size={16} />
                        <span className="truncate text-textPrimary text-sm">{section.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => restoreSection(section.id)} className="flex items-center gap-1 text-xs text-green-500 hover:bg-green-500/10 px-2 py-1 rounded">
                          <RefreshCw size={12} /> Restore
                        </button>
                        <button onClick={() => hardDeleteSection(section.id)} className="flex items-center gap-1 text-xs text-red-400 hover:bg-red-400/10 px-2 py-1 rounded">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {deletedPages.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mt-4">Deleted Pages</h3>
                  {deletedPages.map(page => (
                    <div key={page.id} className="flex items-center justify-between p-3 bg-surfaceHover rounded-lg border border-border">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="text-textSecondary shrink-0" size={16} />
                        <span className="truncate text-textPrimary text-sm">{page.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => restorePage(page.id)} className="flex items-center gap-1 text-xs text-green-500 hover:bg-green-500/10 px-2 py-1 rounded">
                          <RefreshCw size={12} /> Restore
                        </button>
                        <button onClick={() => hardDeletePage(page.id)} className="flex items-center gap-1 text-xs text-red-400 hover:bg-red-400/10 px-2 py-1 rounded">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
