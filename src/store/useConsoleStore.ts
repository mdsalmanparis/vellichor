import { create } from 'zustand';

interface Log {
  id: string;
  language: string;
  code: string;
  stdout: string;
  stderr: string;
  image?: string;
  timestamp: number;
}

interface ConsoleState {
  isOpen: boolean;
  logs: Log[];
  loading: boolean;
  toggleConsole: () => void;
  openConsole: () => void;
  closeConsole: () => void;
  addLog: (log: Omit<Log, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  setLoading: (loading: boolean) => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  isOpen: false,
  logs: [],
  loading: false,
  toggleConsole: () => set((state) => ({ isOpen: !state.isOpen })),
  openConsole: () => set({ isOpen: true }),
  closeConsole: () => set({ isOpen: false }),
  addLog: (log) => set((state) => ({
    logs: [...state.logs, { ...log, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }]
  })),
  clearLogs: () => set({ logs: [] }),
  setLoading: (loading) => set({ loading })
}));
