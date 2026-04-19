import { create } from 'zustand';

interface ConfirmOptions {
  title: string;
  message: string;
}

interface PromptOptions {
  title: string;
  placeholder?: string;
  defaultValue?: string;
}

interface SelectOptions {
  title: string;
  options: { label: string; value: string }[];
}

interface ModalState {
  confirmState: (ConfirmOptions & { resolve: (value: boolean) => void }) | null;
  promptState: (PromptOptions & { resolve: (value: string | null) => void }) | null;
  selectState: (SelectOptions & { resolve: (value: string | null) => void }) | null;
  
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  select: (options: SelectOptions) => Promise<string | null>;
  
  resolveConfirm: (value: boolean) => void;
  resolvePrompt: (value: string | null) => void;
  resolveSelect: (value: string | null) => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  confirmState: null,
  promptState: null,
  selectState: null,

  confirm: (options) => {
    return new Promise((resolve) => {
      set({ confirmState: { ...options, resolve } });
    });
  },

  prompt: (options) => {
    return new Promise((resolve) => {
      set({ promptState: { ...options, resolve } });
    });
  },

  select: (options) => {
    return new Promise((resolve) => {
      set({ selectState: { ...options, resolve } });
    });
  },

  resolveConfirm: (value) => {
    const state = get().confirmState;
    if (state) {
      state.resolve(value);
      set({ confirmState: null });
    }
  },

  resolvePrompt: (value) => {
    const state = get().promptState;
    if (state) {
      state.resolve(value);
      set({ promptState: null });
    }
  },

  resolveSelect: (value) => {
    const state = get().selectState;
    if (state) {
      state.resolve(value);
      set({ selectState: null });
    }
  }
}));
