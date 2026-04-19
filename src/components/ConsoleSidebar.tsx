import { X, Terminal, Trash2, PlayCircle, Maximize2, Minimize2 } from 'lucide-react';
import { useConsoleStore } from '../store/useConsoleStore';
import { useState } from 'react';

export function ConsoleSidebar() {
  const { isOpen, logs, loading, closeConsole, clearLogs } = useConsoleStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <aside className={`h-full flex flex-col bg-[#1e1e1e] text-[#d4d4d4] border-l border-[#333] z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] transition-all duration-300 ${isExpanded ? 'w-[600px] max-w-[50vw]' : 'w-80'}`}>
      <div className="p-3 border-b border-[#333] flex items-center justify-between bg-[#252526]">
        <div className="flex items-center gap-2 font-mono text-sm">
          <Terminal size={16} className="text-accent" />
          <span>Console Output</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-[#333] rounded-md text-gray-400 hover:text-white" title={isExpanded ? "Collapse" : "Expand"}>
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={clearLogs} className="p-1.5 hover:bg-[#333] rounded-md text-gray-400 hover:text-white" title="Clear Console">
            <Trash2 size={14} />
          </button>
          <button onClick={closeConsole} className="p-1.5 hover:bg-[#333] rounded-md text-gray-400 hover:text-white" title="Close Console">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-6">
        {logs.length === 0 && !loading && (
          <div className="text-center text-gray-500 mt-10">
            No execution logs yet.<br/>Run a code block to see output!
          </div>
        )}
        
        {logs.map((log) => (
          <div key={log.id} className="space-y-2 border-b border-[#333] pb-4 last:border-0">
            <div className="flex items-center justify-between text-gray-500">
              <span className="bg-[#333] text-white px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{log.language}</span>
              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            
            {log.stdout && (
              <pre className="whitespace-pre-wrap break-words text-green-400 m-0">
                {log.stdout}
              </pre>
            )}
            
            {log.stderr && (
              <pre className="whitespace-pre-wrap break-words text-red-400 m-0">
                {log.stderr}
              </pre>
            )}

            {log.image && (
              <div className="mt-2 rounded-md overflow-hidden border border-[#333] bg-white shadow-inner">
                <img src={log.image} alt="Execution Output Plot" className="w-full h-auto object-contain" />
              </div>
            )}
            
            {!log.stdout && !log.stderr && !log.image && (
              <span className="text-gray-500 italic">Program exited with no output.</span>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex items-center gap-2 text-accent animate-pulse">
            <PlayCircle size={14} className="animate-spin" />
            <span>Executing...</span>
          </div>
        )}
      </div>
    </aside>
  );
}
