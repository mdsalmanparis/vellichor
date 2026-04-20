import { X, Terminal, Trash2, PlayCircle, Maximize2, Minimize2 } from 'lucide-react';
import { useConsoleStore } from '../store/useConsoleStore';
import { useState } from 'react';

export function ConsoleSidebar() {
  const { isOpen, logs, loading, closeConsole, clearLogs } = useConsoleStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <aside 
      className={`h-full flex flex-col bg-surface text-text-primary border-l border-border z-20 shadow-[-10px_0_30px_rgba(139,92,246,0.05)] transition-all duration-300 ${
        isExpanded ? 'w-[600px] max-w-[50vw]' : 'w-80'
      }`}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-surface-hover/50">
        <div className="flex items-center gap-2 font-heading text-sm font-semibold text-accent">
          <Terminal size={16} />
          <span className="tracking-tight uppercase text-xs">Console Output</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-1.5 hover:bg-surface-hover rounded-md text-text-secondary hover:text-accent transition-colors" 
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button 
            onClick={clearLogs} 
            className="p-1.5 hover:bg-surface-hover rounded-md text-text-secondary hover:text-red-500 transition-colors" 
            title="Clear Console"
          >
            <Trash2 size={14} />
          </button>
          <button 
            onClick={closeConsole} 
            className="p-1.5 hover:bg-surface-hover rounded-md text-text-secondary hover:text-accent transition-colors" 
            title="Close Console"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] space-y-6">
        {logs.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary/50 text-center space-y-2">
            <Terminal size={32} strokeWidth={1} />
            <p className="font-sans text-sm">
              No execution logs yet.<br/>Run a code block to see output!
            </p>
          </div>
        )}
        
        {logs.map((log) => (
          <div key={log.id} className="space-y-3 border-b border-border/50 pb-5 last:border-0">
            <div className="flex items-center justify-between text-[10px]">
              <span className="bg-accent/10 text-accent px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-accent/20">
                {log.language}
              </span>
              <span className="text-text-secondary tabular-nums">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            
            {log.stdout && (
              <pre className="whitespace-pre-wrap break-words text-emerald-600 dark:text-emerald-400 m-0 leading-relaxed bg-emerald-50/50 dark:bg-emerald-500/5 p-2 rounded-lg">
                {log.stdout}
              </pre>
            )}
            
            {log.stderr && (
              <pre className="whitespace-pre-wrap break-words text-red-500 m-0 leading-relaxed bg-red-50/50 dark:bg-red-500/5 p-2 rounded-lg">
                {log.stderr}
              </pre>
            )}

            {log.image && (
              <div className="mt-2 rounded-xl overflow-hidden border border-border bg-white shadow-sm ring-4 ring-purple-50">
                <img src={log.image} alt="Execution Output Plot" className="w-full h-auto object-contain" />
              </div>
            )}
            
            {!log.stdout && !log.stderr && !log.image && (
              <span className="text-text-secondary/60 italic text-xs">Program exited with no output.</span>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex items-center gap-3 text-accent py-2">
            <div className="relative">
              <PlayCircle size={18} className="animate-spin opacity-20" />
              <PlayCircle size={18} className="absolute top-0 left-0 animate-pulse" />
            </div>
            <span className="font-heading font-medium text-sm">Executing script...</span>
          </div>
        )}
      </div>
    </aside>
  );
}