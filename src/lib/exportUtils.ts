import type { JSONContent } from '@tiptap/react';

export function jsonToMarkdown(json: JSONContent, title: string): string {
  let md = `# ${title}\n\n`;
  
  if (json.type === 'doc' && json.content) {
    json.content.forEach(node => {
      md += nodeToMarkdown(node) + '\n\n';
    });
  }
  return md.trim();
}

function nodeToMarkdown(node: JSONContent): string {
  if (node.type === 'heading') {
    const level = node.attrs?.level || 1;
    return `${'#'.repeat(level)} ${getText(node)}`;
  }
  if (node.type === 'paragraph') {
    return getText(node);
  }
  if (node.type === 'codeBlock') {
    const lang = node.attrs?.language || '';
    return `\`\`\`${lang}\n${getText(node)}\n\`\`\``;
  }
  if (node.type === 'blockquote') {
    return `> ${getText(node)}`;
  }
  if (node.type === 'bulletList') {
    return node.content?.map(li => `- ${getText(li)}`).join('\n') || '';
  }
  if (node.type === 'orderedList') {
    return node.content?.map((li, i) => `${i + 1}. ${getText(li)}`).join('\n') || '';
  }
  return getText(node);
}

function getText(node: JSONContent): string {
  if (node.type === 'text') {
    let text = node.text || '';
    if (node.marks) {
      node.marks.forEach(mark => {
        if (mark.type === 'bold') text = `**${text}**`;
        if (mark.type === 'italic') text = `*${text}*`;
        if (mark.type === 'code') text = `\`${text}\``;
        if (mark.type === 'link') text = `[${text}](${mark.attrs?.href || ''})`;
      });
    }
    return text;
  }
  if (node.content) {
    return node.content.map(getText).join('');
  }
  return '';
}

export function jsonToIpynb(json: JSONContent, title: string) {
  const cells: any[] = [];
  
  cells.push({
    cell_type: 'markdown',
    metadata: {},
    source: [`# ${title}\n`]
  });
  
  if (json.type === 'doc' && json.content) {
    let currentMd: string[] = [];
    
    json.content.forEach(node => {
      if (node.type === 'codeBlock') {
        if (currentMd.length > 0) {
          cells.push({
            cell_type: 'markdown',
            metadata: {},
            source: [currentMd.join('\n\n')]
          });
          currentMd = [];
        }
        
        cells.push({
          cell_type: 'code',
          execution_count: null,
          metadata: {},
          outputs: [],
          source: getText(node).split('\n').map((line, i, arr) => line + (i === arr.length - 1 ? '' : '\n'))
        });
      } else {
        currentMd.push(nodeToMarkdown(node));
      }
    });
    
    if (currentMd.length > 0) {
      cells.push({
        cell_type: 'markdown',
        metadata: {},
        source: [currentMd.join('\n\n')]
      });
    }
  }
  
  return {
    cells,
    metadata: {
      language_info: {
        name: "python"
      }
    },
    nbformat: 4,
    nbformat_minor: 5
  };
}

export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
