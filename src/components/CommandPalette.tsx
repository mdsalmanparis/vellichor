import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Command } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { pages } = useDataStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activePages = pages.filter(p => !p.is_deleted);
  const filteredPages = activePages
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8); // Top 8 results

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredPages.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredPages.length) % filteredPages.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPages[selectedIndex]) {
        setIsOpen(false);
        navigate(`/page/${filteredPages[selectedIndex].id}`);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-border bg-surfaceHover">
          <Search className="text-textSecondary mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-textPrimary text-lg placeholder-textSecondary"
            placeholder="Search for pages..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1 text-xs text-textSecondary font-medium bg-border px-2 py-1 rounded">
            <Command size={12} /> K
          </div>
        </div>

        {filteredPages.length > 0 ? (
          <div className="py-2 max-h-[60vh] overflow-y-auto">
            <div className="px-3 pb-2 text-xs font-semibold text-textSecondary uppercase tracking-wider">Pages</div>
            {filteredPages.map((page, index) => (
              <div
                key={page.id}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/page/${page.id}`);
                }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  selectedIndex === index ? 'bg-accent/10 border-l-2 border-accent' : 'border-l-2 border-transparent hover:bg-surfaceHover'
                }`}
              >
                <FileText 
                  className={`${selectedIndex === index ? 'text-accent' : 'text-textSecondary'}`} 
                  size={18} 
                />
                <span className={`font-medium ${selectedIndex === index ? 'text-textPrimary' : 'text-textSecondary'}`}>
                  {page.title}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-textSecondary">
            <Search size={32} className="mb-3 opacity-20" />
            <p>No pages found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
