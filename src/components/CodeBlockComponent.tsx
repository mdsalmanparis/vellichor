import { useState } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Play, Trash2, TerminalSquare, ChevronDown } from 'lucide-react';
import { useConsoleStore } from '../store/useConsoleStore';
import { useModalStore } from '../store/useModalStore';

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript (Node)' },
  { value: 'bash', label: 'Bash' },
];

export const CodeBlockComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const { openConsole, addLog, setLoading } = useConsoleStore();
  const { confirm } = useModalStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const language = node.attrs.language || 'python';
  const currentLanguageLabel = LANGUAGES.find(l => l.value === language)?.label || 'Python';

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Delete Code Block',
      message: 'Are you sure you want to delete this entire code block? This cannot be undone.'
    });
    if (isConfirmed) {
      deleteNode();
    }
  };

  const handleRun = async () => {
    openConsole();
    setLoading(true);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code: node.textContent,
        }),
      });

      const result = await response.json();

      addLog({
        language,
        code: node.textContent,
        stdout: result.stdout || '',
        stderr: result.stderr || result.error || '',
        image: result.image,
      });
    } catch (e: any) {
      addLog({
        language,
        code: node.textContent,
        stdout: '',
        stderr: e.message || 'Failed to connect to execution bridge.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunExternal = async () => {
    try {
      addLog({
        language,
        code: node.textContent,
        stdout: 'Launching native terminal window...',
        stderr: '',
      });
      openConsole();

      const response = await fetch('/api/execute-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code: node.textContent,
        }),
      });
      const result = await response.json();

      addLog({
        language,
        code: node.textContent,
        stdout: result.message || 'Launched successfully.',
        stderr: result.error || '',
      });
    } catch (e: any) {
      addLog({
        language,
        code: node.textContent,
        stdout: '',
        stderr: e.message || 'Failed to connect to execution bridge.',
      });
    }
  };

  // The ultimate developer font stack
  const codeFontFamily = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace";

  return (
    <>
      {/* We inject the JetBrains Mono webfont here so it works instantly without touching your HTML/CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}} />
      
      <NodeViewWrapper
        className="not-prose group relative rounded-xl border border-border my-6 overflow-hidden shadow-sm bg-surface z-20 isolate"
      >
        <div 
          className="flex items-center justify-between px-4 py-2 bg-surfaceHover border-b border-border" 
          contentEditable={false}
        >
          {/* Custom Dropdown Trigger & Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-transparent text-accent text-[13px] font-sans font-medium outline-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {currentLanguageLabel}
              <ChevronDown 
                size={14} 
                className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                
                <div className="absolute top-full left-0 mt-1 w-44 bg-surface border border-border rounded-lg shadow-lg z-20 overflow-hidden py-1.5">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        updateAttributes({ language: lang.value });
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[13px] font-sans transition-colors ${
                        language === lang.value
                          ? 'bg-accent/10 text-accent font-semibold'
                          : 'text-textSecondary hover:bg-surfaceHover hover:text-textPrimary'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100">
            <button
              onClick={handleRunExternal}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-textSecondary hover:text-textPrimary hover:bg-surface text-xs font-medium rounded-md transition-all border border-transparent hover:border-border"
              title="Run in Native Terminal"
            >
              <TerminalSquare size={14} />
              Console
            </button>
            <button
              onClick={handleRun}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-accent hover:text-accent hover:bg-accent/10 text-xs font-medium rounded-md transition-all border border-transparent hover:border-accent/20"
            >
              <Play size={14} />
              Run
            </button>
            
            <div className="w-[1px] h-4 bg-border mx-1 hidden md:block"></div>
            
            <button
              onClick={handleDelete}
              className="text-textSecondary hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-all"
              title="Delete block"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <pre 
          style={{ fontFamily: codeFontFamily, fontVariantLigatures: 'normal' }}
          className="!m-0 bg-surface p-5 overflow-x-auto text-[13px] leading-relaxed text-textPrimary [&>code]:!bg-transparent
          [&_.hljs-keyword]:text-accent
          [&_.hljs-string]:text-green-600 [&_.hljs-string]:dark:text-green-400
          [&_.hljs-title]:text-blue-600 [&_.hljs-title]:dark:text-blue-400
          [&_.hljs-function]:text-indigo-600 [&_.hljs-function]:dark:text-indigo-400
          [&_.hljs-number]:text-orange-600 [&_.hljs-number]:dark:text-orange-400
          [&_.hljs-comment]:text-textSecondary/70
          [&_.hljs-built_in]:text-accent
          [&_.hljs-literal]:text-pink-600 [&_.hljs-literal]:dark:text-pink-400"
        >
          <NodeViewContent as={"code" as any} className="!bg-transparent outline-none" style={{ fontFamily: codeFontFamily }} />
        </pre>
      </NodeViewWrapper>
    </>
  );
};