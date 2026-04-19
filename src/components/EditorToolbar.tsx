
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Heading1, Heading2, 
  Quote, List, ListOrdered, Code, 
  Highlighter, PlayCircle, TerminalSquare,
  Table as TableIcon, Trash2
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

  if (!editor) return null;

  const handleRunAll = async () => {
    const json = editor.getJSON();
    const blocks: { language: string; code: string }[] = [];
    
    const findCodeBlocks = (node: any) => {
      if (node.type === 'codeBlock') {
        const lang = node.attrs?.language || 'python';
        const code = node.content?.map((n: any) => n.text).join('\n') || '';
        blocks.push({ language: lang, code });
      }
      if (node.content) {
        node.content.forEach(findCodeBlocks);
      }
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
    
    const combinedCode = blocks
      .filter(b => b.language === selectedLang)
      .map(b => b.code)
      .join('\n\n# --- Next Block ---\n\n');
      
    openConsole();
    setLoading(true);
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          code: combinedCode,
        }),
      });
      
      const result = await response.json();
      
      addLog({
        language: selectedLang,
        code: combinedCode,
        stdout: result.stdout || '',
        stderr: result.stderr || result.error || '',
        image: result.image,
      });
    } catch (e: any) {
      addLog({
        language: selectedLang,
        code: combinedCode,
        stdout: '',
        stderr: e.message || 'Failed to connect to execution bridge.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllExternal = async () => {
    const json = editor.getJSON();
    const blocks: { language: string; code: string }[] = [];
    
    const findCodeBlocks = (node: any) => {
      if (node.type === 'codeBlock') {
        const lang = node.attrs?.language || 'python';
        const code = node.content?.map((n: any) => n.text).join('\n') || '';
        blocks.push({ language: lang, code });
      }
      if (node.content) {
        node.content.forEach(findCodeBlocks);
      }
    };
    findCodeBlocks(json);
    
    if (blocks.length === 0) return;
    
    const languages = Array.from(new Set(blocks.map(b => b.language)));
    let selectedLang = languages[0];
    
    if (languages.length > 1) {
      const choice = await select({
        title: 'Run All in Native Console',
        options: languages.map(l => ({ label: `Run all ${l} blocks natively`, value: l }))
      });
      if (!choice) return;
      selectedLang = choice;
    }
    
    const combinedCode = blocks
      .filter(b => b.language === selectedLang)
      .map(b => b.code)
      .join('\n\n# --- Next Block ---\n\n');
      
    openConsole();
    setLoading(true);
    
    addLog({
      language: selectedLang,
      code: combinedCode,
      stdout: 'Launching native terminal window...',
      stderr: '',
    });
    
    try {
      const response = await fetch('/api/execute-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          code: combinedCode,
        }),
      });
      
      const result = await response.json();
      
      addLog({
        language: selectedLang,
        code: combinedCode,
        stdout: result.message || 'Launched successfully.',
        stderr: result.error || '',
      });
    } catch (e: any) {
      addLog({
        language: selectedLang,
        code: combinedCode,
        stdout: '',
        stderr: e.message || 'Failed to connect to execution bridge.',
      });
    } finally {
      setLoading(false);
    }
  };

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title, className }: any) => (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-2 rounded-md transition-colors",
        isActive 
          ? "bg-accent text-white" 
          : "text-textSecondary hover:bg-surfaceHover hover:text-textPrimary",
        className
      )}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="flex items-center gap-1 p-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        icon={Heading1}
        title="Heading 1"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        icon={Heading2}
        title="Heading 2"
      />
      
      <div className="w-px h-6 bg-border mx-2" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={Bold}
        title="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={Italic}
        title="Italic"
      />
      
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
          
          const handleHighlight = () => {
            if (isActive) {
              editor.chain().focus().unsetHighlight().run();
            } else {
              const { state } = editor;
              const { from, to } = state.selection;
              
              if (from !== to) {
                const text = state.doc.textBetween(from, to, ' ');
                const trailingSpaces = text.length - text.trimEnd().length;
                const leadingSpaces = text.length - text.trimStart().length;
                
                let start = from + leadingSpaces;
                let end = to - trailingSpaces;
                
                if (start < end) {
                  editor.chain().focus().setTextSelection({ from: start, to: end }).setHighlight({ color }).run();
                  // Optionally restore original selection if needed
                } else {
                  editor.chain().focus().unsetHighlight().run();
                }
              } else {
                editor.chain().focus().setHighlight({ color }).run();
              }
            }
          };

          return (
            <button
              key={color}
              onClick={handleHighlight}
              className={cn(
                "w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110",
                isActive && "ring-2 ring-offset-1"
              )}
              style={{ 
                backgroundColor: color,
                ['--tw-ring-color' as any]: color
              }}
              title={`Highlight ${title}`}
            />
          );
        })}
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetHighlight().run()}
          isActive={false}
          icon={Highlighter}
          title="Remove Highlight"
        />
      </div>
      
      <div className="w-px h-6 bg-border mx-2" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={List}
        title="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        icon={ListOrdered}
        title="Ordered List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        icon={Quote}
        title="Quote"
      />
      
      <div className="w-px h-6 bg-border mx-2" />
      
      <ToolbarButton
        onClick={() => {
          if (!editor.isActive('codeBlock')) {
            editor.chain().focus().setCodeBlock().run();
          }
        }}
        isActive={editor.isActive('codeBlock')}
        icon={Code}
        title="Code Block"
      />

      <div className="w-px h-6 bg-border mx-2" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        isActive={editor.isActive('table')}
        icon={TableIcon}
        title="Insert Table"
      />
      
      {editor.isActive('table') && (
        <div className="flex items-center gap-1 bg-surfaceHover rounded-md p-0.5 border border-border">
          <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 text-xs text-textSecondary hover:text-textPrimary font-medium transition-colors" title="Add Column">Col +</button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-1 text-xs text-textSecondary hover:text-red-400 font-medium transition-colors" title="Delete Column">Col -</button>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 text-xs text-textSecondary hover:text-textPrimary font-medium transition-colors" title="Add Row">Row +</button>
          <button onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-1 text-xs text-textSecondary hover:text-red-400 font-medium transition-colors" title="Delete Row">Row -</button>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 text-red-400 hover:bg-red-400/10 rounded transition-colors" title="Delete Table"><Trash2 size={12} /></button>
        </div>
      )}
      
      <div className="flex-1" />
      
      <div className="hidden md:block w-px h-6 bg-border mx-2" />

      <ToolbarButton
        onClick={handleRunAllExternal}
        isActive={false}
        icon={TerminalSquare}
        title="Run All Code Blocks in Native Console"
        className="hidden md:flex text-textSecondary hover:text-textPrimary hover:bg-surfaceHover"
      />

      <ToolbarButton
        onClick={handleRunAll}
        isActive={false}
        icon={PlayCircle}
        title="Run All Code Blocks"
        className="hidden md:flex text-green-600 hover:text-green-700 hover:bg-green-50"
      />
    </div>
  );
}
