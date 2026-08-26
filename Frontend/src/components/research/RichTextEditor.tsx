'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  List, 
  ListOrdered, 
  Table as TableIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// MenuBar component for editor controls
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  if (!editor) {
    return null;
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setIsTableDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-t-lg bg-slate-50">
        <div className="flex items-center gap-1 border-r pr-2">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} disabled={!editor.can().chain().focus().setTextAlign('left').run()}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} disabled={!editor.can().chain().focus().setTextAlign('center').run()}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} disabled={!editor.can().chain().focus().setTextAlign('right').run()}>
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={!editor.can().chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={!editor.can().chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsTableDialogOpen(true)}
        >
          <TableIcon className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Table</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rows" className="text-right">
                Rows
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRows(Math.max(1, rows - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRows(rows + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cols" className="text-right">
                Columns
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCols(Math.max(1, cols - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="cols"
                  type="number"
                  min="1"
                  value={cols}
                  onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCols(cols + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertTable}>Create Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Main Editor Component
interface RichTextEditorProps {
  content: string;
  onChange: (richText: string) => void;
  onSelectionUpdate?: (selectedText: string) => void;
}

export default function RichTextEditor({ content, onChange, onSelectionUpdate }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-slate-300',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-slate-100',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 p-2',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      onSelectionUpdate?.(selectedText);
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[200px] max-h-[600px] overflow-y-auto resize-y',
      },
    },
    immediatelyRender: false,
  });

  const handleResize = () => {
    const element = document.querySelector('.ProseMirror');
    if (element instanceof HTMLElement) {
      const currentHeight = element.clientHeight;
      element.style.height = `${currentHeight + 100}px`;
    }
  };

  return (
    <div className="border rounded-lg">
      <MenuBar editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} className="bg-white" />
        <div className="absolute bottom-2 right-2 flex items-center gap-2 text-sm text-slate-500">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResize}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 