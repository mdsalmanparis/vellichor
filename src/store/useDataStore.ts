import { create } from 'zustand';
import type { Folder, Section, Page } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

interface DataState {
  folders: Folder[];
  sections: Section[];
  pages: Page[];
  loading: boolean;
  activeFolderId: string | null;
  activeSectionId: string | null;
  activePageId: string | null;
  
  setActiveIds: (folderId: string | null, sectionId: string | null, pageId: string | null) => void;
  
  fetchData: () => Promise<void>;
  
  addFolder: (title: string) => Promise<void>;
  addSection: (folderId: string, title: string) => Promise<void>;
  addPage: (folderId: string, sectionId: string | null, title: string) => Promise<Page | null>;
  
  removeFolder: (id: string) => Promise<void>;
  restoreFolder: (id: string) => Promise<void>;
  hardDeleteFolder: (id: string) => Promise<void>;
  
  removeSection: (id: string) => Promise<void>;
  restoreSection: (id: string) => Promise<void>;
  hardDeleteSection: (id: string) => Promise<void>;
  
  removePage: (id: string) => Promise<void>;
  restorePage: (id: string) => Promise<void>;
  hardDeletePage: (id: string) => Promise<void>;
  
  updatePageContent: (pageId: string, content: any) => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
  folders: [],
  sections: [],
  pages: [],
  loading: false,
  activeFolderId: null,
  activeSectionId: null,
  activePageId: null,

  setActiveIds: (folderId, sectionId, pageId) => set({
    activeFolderId: folderId,
    activeSectionId: sectionId,
    activePageId: pageId,
  }),

  fetchData: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ loading: true });
    
    const [foldersRes, sectionsRes, pagesRes] = await Promise.all([
      supabase.from('folders').select('*').order('created_at', { ascending: true }),
      supabase.from('sections').select('*').order('created_at', { ascending: true }),
      supabase.from('pages').select('id, folder_id, section_id, user_id, title, created_at, updated_at').order('created_at', { ascending: true }) // Exclude content initially for performance
    ]);

    set({
      folders: foldersRes.data || [],
      sections: sectionsRes.data || [],
      pages: (pagesRes.data as Page[]) || [],
      loading: false
    });
  },

  addFolder: async (title) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    const { data, error } = await supabase
      .from('folders')
      .insert({ title, user_id: user.id })
      .select()
      .single();
      
    if (data && !error) {
      set(state => ({ folders: [...state.folders, data] }));
    }
  },

  addSection: async (folderId, title) => {
    const { data, error } = await supabase
      .from('sections')
      .insert({ title, folder_id: folderId })
      .select()
      .single();
      
    if (data && !error) {
      set(state => ({ sections: [...state.sections, data] }));
    }
  },

  addPage: async (folderId, sectionId, title) => {
    const user = useAuthStore.getState().user;
    if (!user) return null;

    const { data, error } = await supabase
      .from('pages')
      .insert({ title, folder_id: folderId, section_id: sectionId, user_id: user.id, content: {} })
      .select()
      .single();
      
    if (data && !error) {
      set(state => ({ pages: [...state.pages, data] }));
      return data;
    }
    return null;
  },

  removeFolder: async (id) => {
    const { error } = await supabase.from('folders').update({ is_deleted: true }).eq('id', id);
    if (!error) {
      set(state => ({ folders: state.folders.map(f => f.id === id ? { ...f, is_deleted: true } : f) }));
    }
  },
  restoreFolder: async (id) => {
    const { error } = await supabase.from('folders').update({ is_deleted: false }).eq('id', id);
    if (!error) {
      set(state => ({ folders: state.folders.map(f => f.id === id ? { ...f, is_deleted: false } : f) }));
    }
  },
  hardDeleteFolder: async (id) => {
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (!error) {
      set(state => ({ folders: state.folders.filter(f => f.id !== id) }));
    }
  },

  removeSection: async (id) => {
    const { error } = await supabase.from('sections').update({ is_deleted: true }).eq('id', id);
    if (!error) {
      set(state => ({ sections: state.sections.map(s => s.id === id ? { ...s, is_deleted: true } : s) }));
    }
  },
  restoreSection: async (id) => {
    const { error } = await supabase.from('sections').update({ is_deleted: false }).eq('id', id);
    if (!error) {
      set(state => ({ sections: state.sections.map(s => s.id === id ? { ...s, is_deleted: false } : s) }));
    }
  },
  hardDeleteSection: async (id) => {
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (!error) {
      set(state => ({ sections: state.sections.filter(s => s.id !== id) }));
    }
  },

  removePage: async (id) => {
    const { error } = await supabase.from('pages').update({ is_deleted: true }).eq('id', id);
    if (!error) {
      set(state => ({ pages: state.pages.map(p => p.id === id ? { ...p, is_deleted: true } : p) }));
    }
  },
  restorePage: async (id) => {
    const { error } = await supabase.from('pages').update({ is_deleted: false }).eq('id', id);
    if (!error) {
      set(state => ({ pages: state.pages.map(p => p.id === id ? { ...p, is_deleted: false } : p) }));
    }
  },
  hardDeletePage: async (id) => {
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (!error) {
      set(state => ({ pages: state.pages.filter(p => p.id !== id) }));
    }
  },

  updatePageContent: async (pageId, content) => {
    const { error } = await supabase
      .from('pages')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', pageId);
      
    if (!error) {
      // Update local state if needed (though we mostly refetch or optimistic update)
    }
  }
}));
