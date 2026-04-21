import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Heading1, Heading2, 
  Quote, List, ListOrdered, Code, 
  Highlighter, PlayCircle,
  Table as TableIcon, Trash2, ChevronDown, 
  ArrowDownAZ, ArrowUpZA, Columns, Rows
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useModalStore } from '../store/useModalStore';
import { useConsoleStore } from '../store/useConsoleStore';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const { select } = useModalStore();
  const { openConsole, addLog, setLoading } = useConsoleStore();
  
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [tableRows, setTableRows] = useState('3');
  const [tableCols, setTableCols] = useState('3');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const sortTable = (direction: 'asc' | 'desc') => {
    const { state, dispatch } = editor.view;
    const { selection } = state;
    const { $from } = selection;
    
    let tableDepth = -1;
    let rowDepth = -1;
    let cellDepth = -1;
    
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (node.type.name === 'table') tableDepth = d;
      if (node.type.name === 'tableRow') rowDepth = d;
      if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') cellDepth = d;
    }
    
    if (tableDepth === -1 || cellDepth === -1 || rowDepth === -1) return;
    
    const tableNode = $from.node(tableDepth);
    const rowNode = $from.node(rowDepth);
    const cellNode = $from.node(cellDepth);
    
    let colIndex = 0;
    let found = false;
    rowNode.forEach((child) => {
      if (found) return;
      if (child === cellNode) found = true;
      else colIndex += child.attrs.colspan || 1;
    });
    
    const rows: any[] = [];
    tableNode.forEach((row) => rows.push(row));
    if (rows.length <= 1) return; 
    
    const headerRow = rows[0];
    const bodyRows = rows.slice(1);
    
    bodyRows.sort((a, b) => {
      let cellA: any = null, cellB: any = null;
      let curColA = 0, curColB = 0;
      
      a.forEach((cell: any) => {
        if (curColA === colIndex) cellA = cell;
        curColA += cell.attrs.colspan || 1;
      });
      b.forEach((cell: any) => {
        if (curColB === colIndex) cellB = cell;
        curColB += cell.attrs.colspan || 1;
      });
      
      const textA = cellA ? cellA.textContent : '';
      const textB = cellB ? cellB.textContent : '';
      const numA = parseFloat(textA);
      const numB = parseFloat(textB);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }
      return direction === 'asc' ? textA.localeCompare(textB) : textB.localeCompare(textA);
    });
    
    const tablePos = $from.before(tableDepth);
    let tr = state.tr;
    const newTableNode = state.schema.nodes.table.create(tableNode.attrs, [headerRow, ...bodyRows]);
    tr = tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTableNode);
    dispatch(tr);
    setShowTableMenu(false);
  };

  const handleInsertTable = () => {
    const r = parseInt(tableRows, 10);
    const c = parseInt(tableCols, 10);
    if (r > 0 && c > 0) {
      editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
    }
    setShowInsertModal(false);
  };

  const handleRunAll = async () => {
    const json = editor.getJSON();
    const blocks: { language: string; code: string }[] = [];
    const findCodeBlocks = (node: any) => {
      if (node.type === 'codeBlock') {
        const lang = node.attrs?.language || 'python';
        const code = node.content?.map((n: any) => n.text).join('\n') || '';
        blocks.push({ language: lang, code });
      }
      if (node.content) node.content.forEach(findCodeBlocks);
    };
    findCodeBlocks(json);
    if (blocks.length === 0) return;
    
    const languages = Array.from(new Set(blocks.map(b => b.language)));
    let selectedLang = languages[0];
    if (languages.length > 1) {
      const choice = await select({
        title: 'Run All Code Blocks',
        options: languages.map(l => ({ label: `Run all ${l} blocks`, value: l }))
      });
      if (!choice) return;
      selectedLang = choice;
    }
    const combinedCode = blocks.filter(b => b.language === selectedLang).map(b => b.code).join('\n\n# --- Next Block ---\n\n');
    openConsole(); setLoading(true);
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: selectedLang, code: combinedCode }),
      });
      const result = await response.json();
      addLog({ language: selectedLang, code: combinedCode, stdout: result.stdout || '', stderr: result.stderr || result.error || '', image: result.image });
    } catch (e: any) {
      addLog({ language: selectedLang, code: combinedCode, stdout: '', stderr: e.message || 'Failed to connect.' });
    } finally { setLoading(false); }
  };

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title, className }: any) => (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-2 rounded-md transition-colors flex items-center justify-center",
        isActive ? "bg-accent text-white" : "text-textSecondary hover:bg-surfaceHover hover:text-textPrimary",
        className
      )}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <>
      <div className="flex items-center gap-1 p-1">
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} title="Heading 1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
        
        <div className="w-px h-6 bg-border mx-2" />
        
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic" />
        
        {/* Highlight Colors */}
        <div className="flex items-center gap-0.5 ml-1">
          {[
            { color: '#fde047', title: 'Yellow' },
            { color: '#bae6fd', title: 'Blue' },
            { color: '#fbcfe8', title: 'Pink' },
            { color: '#bbf7d0', title: 'Green' },
            { color: '#fecaca', title: 'Red' }
          ].map(({ color, title }) => {
            const isActive = editor.getAttributes('highlight').color === color;
            return (
              <button
                key={color}
                onClick={() => {
                  if (isActive) editor.chain().focus().unsetHighlight().run();
                  else editor.chain().focus().setHighlight({ color }).run();
                }}
                className={cn("w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110", isActive && "ring-2 ring-offset-1")}
                style={{ backgroundColor: color, ['--tw-ring-color' as any]: color }}
                title={`Highlight ${title}`}
              />
            );
          })}
          <ToolbarButton onClick={() => editor.chain().focus().unsetHighlight().run()} isActive={false} icon={Highlighter} title="Remove Highlight" />
        </div>
        
        <div className="w-px h-6 bg-border mx-2" />
        
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Ordered List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Quote" />
        
        <div className="w-px h-6 bg-border mx-2" />
        
        <ToolbarButton onClick={() => { if (!editor.isActive('codeBlock')) editor.chain().focus().setCodeBlock().run(); }} isActive={editor.isActive('codeBlock')} icon={Code} title="Code Block" />

        <div className="w-px h-6 bg-border mx-2" />
        
        {/* Table Dropdown Menu - Elevated z-index & Purple theming */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              if (editor.isActive('table')) {
                setShowTableMenu(!showTableMenu);
              } else {
                setShowInsertModal(true);
              }
            }}
            className={cn(
              "flex items-center gap-1 p-2 rounded-md transition-all font-medium",
              editor.isActive('table') 
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200" 
                : "text-textSecondary hover:bg-surfaceHover hover:text-textPrimary"
            )}
            title="Table Options"
          >
            <TableIcon size={16} />
            {editor.isActive('table') && <ChevronDown size={14} className={cn("transition-transform", showTableMenu && "rotate-180")} />}
          </button>

          {showTableMenu && editor.isActive('table') && (
            <div className="absolute top-full mt-2 left-0 w-48 bg-surface border border-purple-100 shadow-2xl rounded-xl py-1.5 z-[100] flex flex-col text-sm">
              <div className="px-3 py-1.5 text-xs font-semibold text-purple-500 uppercase tracking-wider">Columns</div>
              <button onClick={() => { editor.chain().focus().addColumnAfter().run(); setShowTableMenu(false); }} className="flex items-center gap-2 px-3 py-1.5 hover:bg-purple-50 text-textPrimary text-left"><Columns size={14} /> Add Column</button>
              <button onClick={() => { editor.chain().focus().deleteColumn().run(); setShowTableMenu(false); }} className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600 text-left"><Trash2 size={14} /> Delete Column</button>
              
              <div className="h-px bg-purple-50 my-1" />
              <div className="px-3 py-1.5 text-xs font-semibold text-purple-500 uppercase tracking-wider">Rows</div>
              <button onClick={() => { editor.chain().focus().addRowAfter().run(); setShowTableMenu(false); }} className="flex items-center gap-2 px-3 py-1.5 hover:bg-purple-50 text-textPrimary text-left"><Rows size={14} /> Add Row</button>
              <button onClick={() => { editor.chain().focus().deleteRow().run(); setShowTableMenu(false); }} className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600 text-left"><Trash2 size={14} /> Delete Row</button>
              
              <div className="h-px bg-purple-50 my-1" />
              <div className="px-3 py-1.5 text-xs font-semibold text-purple-500 uppercase tracking-wider">Sort Content</div>
              <button onClick={() => sortTable('asc')} className="flex items-center gap-2 px-3 py-1.5 hover:bg-purple-50 text-textPrimary text-left"><ArrowDownAZ size={14} /> Sort Ascending</button>
              <button onClick={() => sortTable('desc')} className="flex items-center gap-2 px-3 py-1.5 hover:bg-purple-50 text-textPrimary text-left"><ArrowUpZA size={14} /> Sort Descending</button>

              <div className="h-px bg-purple-50 my-1" />
              <div className="px-3 py-1.5 text-xs font-semibold text-purple-500 uppercase tracking-wider">Manage</div>
              <button onClick={() => { editor.chain().focus().mergeCells().run(); setShowTableMenu(false); }} className="px-3 py-1.5 hover:bg-purple-50 text-textPrimary text-left">Merge Cells</button>
              <button onClick={() => { editor.chain().focus().splitCell().run(); setShowTableMenu(false); }} className="px-3 py-1.5 hover:bg-purple-50 text-textPrimary text-left">Split Cell</button>
              <button onClick={() => { editor.chain().focus().deleteTable().run(); setShowTableMenu(false); }} className="px-3 py-1.5 hover:bg-red-50 text-red-600 text-left mt-1 font-medium">Delete Entire Table</button>
            </div>
          )}
        </div>
        
        <div className="flex-1" />
        
        <ToolbarButton onClick={handleRunAll} isActive={false} icon={PlayCircle} title="Run All Code Blocks" className="hidden md:flex text-green-600 hover:text-green-700 hover:bg-green-50" />
      </div>

      {showInsertModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowInsertModal(false)}>
          <div className="bg-surface p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-purple-100" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-heading font-bold mb-1 text-purple-900">Create Table</h3>
            <p className="text-sm text-textSecondary mb-6">Specify the initial dimensions for your table.</p>
            
            <div className="flex gap-4 mb-8">
              <div className="flex-1">
                <label className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2 block">Rows</label>
                <input type="number" min="1" max="100" value={tableRows} onChange={e => setTableRows(e.target.value)} className="w-full bg-surface border border-purple-200 rounded-xl px-4 py-2.5 text-textPrimary focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-medium" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2 block">Columns</label>
                <input type="number" min="1" max="20" value={tableCols} onChange={e => setTableCols(e.target.value)} className="w-full bg-surface border border-purple-200 rounded-xl px-4 py-2.5 text-textPrimary focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-medium" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowInsertModal(false)} className="px-5 py-2.5 text-sm font-semibold text-textSecondary hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleInsertTable} className="px-5 py-2.5 text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 rounded-xl shadow-md transition-all active:scale-95">Insert Table</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}