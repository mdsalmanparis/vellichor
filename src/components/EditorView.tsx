import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Mark, mergeAttributes, InputRule } from '@tiptap/core';
import { common, createLowlight } from 'lowlight';
import { supabase } from '../lib/supabase';
import { EditorToolbar } from './EditorToolbar';
import { useDataStore } from '../store/useDataStore';
import { CodeBlockComponent } from './CodeBlockComponent';
import { Download } from 'lucide-react';
import { jsonToMarkdown, jsonToIpynb, triggerDownload } from '../lib/exportUtils';
import { useModalStore } from '../store/useModalStore';

const lowlight = createLowlight(common);

const getLocalContent = (pageId: string) => {
  const data = localStorage.getItem(`vellichor_page_${pageId}`);
  return data ? JSON.parse(data) : null;
};

const setLocalContent = (pageId: string, content: any) => {
  localStorage.setItem(`vellichor_page_${pageId}`, JSON.stringify({ content, timestamp: Date.now() }));
};

const AestheticQuote = Mark.create({
  name: 'aestheticQuote',
  inclusive: false,
  parseHTML() {
    return [{ tag: 'span[data-quote]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-quote': '', class: 'aesthetic-quote' }), 0];
  },
  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)"([^"]+)"$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const fullMatch = match[0];
          const textMatch = match[1];
          const start = range.from + fullMatch.indexOf('"');
          const end = range.to;
          
          tr.insertText(`"${textMatch}"`, start, end);
          tr.addMark(start, start + textMatch.length + 2, this.type.create());
        },
      }),
    ];
  },
});

export function EditorView() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const { updatePageContent } = useDataStore();
  const { select } = useModalStore();
  const cloudSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<any>(null);
  const hasUnsavedChangesRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      AestheticQuote,
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
        addKeyboardShortcuts() {
          return {
            ...this.parent?.(),
            Backspace: ({ editor }) => {
              const { state } = editor;
              const { selection } = state;
              const { $anchor, empty } = selection;
              
              if (!empty) return false;
              
              // Prevent backspace from deleting the code block when at the very start
              if ($anchor.parent.type.name === 'codeBlock' && $anchor.parentOffset === 0) {
                 return true; 
              }
              return false;
            }
          }
        }
      }).configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'min-w-full border-collapse border border-border my-4 rounded-lg overflow-hidden',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-border bg-surface hover:bg-surfaceHover transition-colors',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border px-4 py-2 font-semibold text-left bg-surfaceHover text-textPrimary',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border px-4 py-2 relative',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      contentRef.current = json;
      hasUnsavedChangesRef.current = true;
      
      // Save locally immediately to prevent data loss (offline cache first)
      if (id) setLocalContent(id, json);
      
      // Debounced cloud save (30 minutes = 1800000ms) to avoid high DB writes
      if (cloudSaveTimeoutRef.current) clearTimeout(cloudSaveTimeoutRef.current);
      cloudSaveTimeoutRef.current = setTimeout(() => {
        if (id && hasUnsavedChangesRef.current) {
          updatePageContent(id, json);
          hasUnsavedChangesRef.current = false;
        }
      }, 1800000);
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      if (!id) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pages')
        .select('title, content, updated_at')
        .eq('id', id)
        .single();

      if (!isMounted) return;

      const localData = getLocalContent(id);
      let finalContent = data?.content || '';

      if (localData && data) {
        const cloudTime = new Date(data.updated_at).getTime();
        // If local cache is newer than cloud (e.g., browser crashed before 10 min sync), use local
        if (localData.timestamp > cloudTime) {
          finalContent = localData.content;
          // Sync it up to cloud
          updatePageContent(id, finalContent);
        }
      }

      if (data && !error) {
        setTitle(data.title);
        if (editor) {
          editor.commands.setContent(finalContent);
          contentRef.current = finalContent;
        }
      }
      setLoading(false);
    }
    loadPage();

    return () => {
      isMounted = false;
      // Sync to cloud on unmount (navigation or close) only if there are actual unsaved changes
      if (id && contentRef.current && hasUnsavedChangesRef.current) {
        updatePageContent(id, contentRef.current);
        hasUnsavedChangesRef.current = false;
      }
      if (cloudSaveTimeoutRef.current) clearTimeout(cloudSaveTimeoutRef.current);
    };
  }, [id, editor]);

  const handleTitleChange = async (e: any) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Save title immediately (or debounce if preferred, but for UX simple is fine)
    if (id) {
      await supabase.from('pages').update({ title: newTitle }).eq('id', id);
    }
  };

  const handleExport = async () => {
    if (!editor) return;
    const format = await select({
      title: 'Export Document',
      options: [
        { label: 'Markdown (.md)', value: 'md' },
        { label: 'Jupyter Notebook (.ipynb)', value: 'ipynb' }
      ]
    });
    
    if (format === 'md') {
      const md = jsonToMarkdown(editor.getJSON(), title || 'Untitled');
      triggerDownload(md, `${title || 'Untitled'}.md`, 'text/markdown');
    } else if (format === 'ipynb') {
      const ipynb = jsonToIpynb(editor.getJSON(), title || 'Untitled');
      triggerDownload(JSON.stringify(ipynb, null, 2), `${title || 'Untitled'}.ipynb`, 'application/json');
    }
  };

  if (loading) return <div className="flex-1 p-12 text-textSecondary">Loading page...</div>;

  return (
      <div className="flex-1 flex flex-col h-full bg-surface relative">
        <div className="sticky top-0 z-20 bg-surface border-b border-border p-2 flex justify-between items-center pr-6 overflow-x-auto scrollbar-hide">
          <EditorToolbar editor={editor} />
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surfaceHover text-textSecondary hover:text-textPrimary rounded-md transition-colors border border-border"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl w-full mx-auto pb-32">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
          placeholder="Page Title"
          className="text-3xl md:text-4xl font-serif font-bold text-textPrimary bg-transparent border-none outline-none w-full mb-6 md:mb-8 placeholder:text-textSecondary/50"
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
