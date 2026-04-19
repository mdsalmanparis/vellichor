import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Play, Trash2, TerminalSquare } from 'lucide-react';
import { useConsoleStore } from '../store/useConsoleStore';
import { useModalStore } from '../store/useModalStore';

export const CodeBlockComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const { openConsole, addLog, setLoading } = useConsoleStore();
  const { confirm } = useModalStore();

  const language = node.attrs.language || 'python';

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
      className="group relative rounded-xl overflow-hidden bg-[#f8f9fa] dark:bg-[#1e1e1e] my-6 border border-[#e5e7eb] dark:border-[#333] shadow-sm"
    >
      <div className="flex items-center justify-between px-4 py-2 bg-[#f3f4f6] dark:bg-[#2d2d2d] border-b border-[#e5e7eb] dark:border-[#333]" contentEditable={false}>
        <select
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          className="bg-transparent text-textSecondary dark:text-gray-400 text-xs font-mono outline-none cursor-pointer hover:text-textPrimary dark:hover:text-white transition-colors"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript (Node)</option>
          <option value="bash">Bash</option>
        </select>

        <div className="flex items-center gap-2 transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100">
          <button
            onClick={handleRunExternal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-surfaceHover hover:bg-border text-textPrimary text-xs font-medium rounded transition-colors dark:bg-[#333] dark:hover:bg-[#444] dark:text-white"
            title="Run in Native Terminal"
          >
            <TerminalSquare size={14} />
            Console
          </button>
          <button
            onClick={handleRun}
            className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-green-600/10 hover:bg-green-600/20 text-green-700 dark:text-green-400 text-xs font-medium rounded transition-colors"
          >
            <Play size={14} />
            Run
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-400 p-1 rounded transition-colors"
            title="Delete block"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <pre className="!m-0 !bg-transparent p-4 overflow-x-auto font-mono text-[13px] leading-relaxed">
        <NodeViewContent as={"code" as any} className="!bg-transparent" />
      </pre>
    </NodeViewWrapper>
  );
};
