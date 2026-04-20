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

  return (
    <NodeViewWrapper
      className="not-prose group relative rounded-xl border border-purple-200 dark:border-purple-900/30 my-6 overflow-hidden shadow-sm"
    >
      <div 
        className="flex items-center justify-between px-4 py-2 !bg-purple-100/50 dark:!bg-[#1C1A24] border-b border-purple-200 dark:border-purple-900/30" 
        contentEditable={false}
      >
        {/* Custom Dropdown Trigger & Menu */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-transparent !text-purple-800 dark:!text-purple-300 text-[13px] font-sans font-medium outline-none cursor-pointer hover:!bg-purple-200/60 dark:hover:!bg-purple-900/40 transition-colors"
          >
            {currentLanguageLabel}
            <ChevronDown 
              size={14} 
              className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {isDropdownOpen && (
            <>
              {/* Invisible overlay to close dropdown when clicking outside */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)} 
              />
              
              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 mt-1 w-44 !bg-white dark:!bg-[#1C1A24] border border-purple-100 dark:border-purple-900/50 rounded-lg shadow-lg z-20 overflow-hidden py-1.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      updateAttributes({ language: lang.value });
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[13px] font-sans transition-colors ${
                      language === lang.value
                        ? '!bg-purple-100 !text-purple-900 dark:!bg-purple-900/60 dark:!text-purple-100 font-semibold'
                        : '!text-slate-600 dark:!text-purple-300 hover:!bg-purple-50 dark:hover:!bg-purple-900/30'
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
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 !text-purple-600 hover:!text-purple-900 hover:!bg-purple-200/60 dark:!text-zinc-400 dark:hover:!text-purple-200 dark:hover:!bg-purple-900/40 text-xs font-medium rounded-md transition-all"
            title="Run in Native Terminal"
          >
            <TerminalSquare size={14} />
            Console
          </button>
          <button
            onClick={handleRun}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 !text-purple-600 hover:!text-purple-900 hover:!bg-purple-200/60 dark:!text-zinc-400 dark:hover:!text-purple-200 dark:hover:!bg-purple-900/40 text-xs font-medium rounded-md transition-all"
          >
            <Play size={14} />
            Run
          </button>
          
          <div className="w-[1px] h-4 bg-purple-300 dark:bg-purple-800/50 mx-1 hidden md:block"></div>
          
          <button
            onClick={handleDelete}
            className="!text-purple-400 hover:!text-red-600 hover:!bg-red-50 dark:!text-zinc-500 dark:hover:!text-red-400 dark:hover:!bg-red-950/30 p-1.5 rounded-md transition-all"
            title="Delete block"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Code Editor Area */}
      <pre 
        className="!m-0 !bg-purple-50 dark:!bg-[#16141D] p-5 overflow-x-auto font-mono text-[13px] leading-relaxed !text-purple-950 dark:!text-purple-50 [&>code]:!bg-transparent
        [&_.hljs-keyword]:!text-purple-700 [&_.hljs-keyword]:dark:!text-purple-400
        [&_.hljs-string]:!text-fuchsia-600 [&_.hljs-string]:dark:!text-fuchsia-400
        [&_.hljs-title]:!text-blue-700 [&_.hljs-title]:dark:!text-blue-400
        [&_.hljs-function]:!text-indigo-700 [&_.hljs-function]:dark:!text-indigo-400
        [&_.hljs-number]:!text-pink-600 [&_.hljs-number]:dark:!text-pink-400
        [&_.hljs-comment]:!text-purple-400/80 [&_.hljs-comment]:dark:!text-slate-500
        [&_.hljs-built_in]:!text-purple-600 [&_.hljs-built_in]:dark:!text-purple-300
        [&_.hljs-literal]:!text-fuchsia-600 [&_.hljs-literal]:dark:!text-fuchsia-300"
      >
        <NodeViewContent as={"code" as any} className="!bg-transparent" />
      </pre>
    </NodeViewWrapper>
  );
};