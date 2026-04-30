"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function Editor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener nofollow" } }),
      Image,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none min-h-[400px] focus:outline-none px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  return (
    <div className="rounded-md border bg-white">
      <div className="flex flex-wrap gap-1 border-b bg-slate-50 px-2 py-1">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          B
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <i>I</i>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
          H2
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
          H3
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          • List
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          1. List
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
          " Quote
        </Btn>
        <Btn
          onClick={() => {
            const url = window.prompt("URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          Link
        </Btn>
        <Btn onClick={() => editor.chain().focus().unsetLink().run()}>Unlink</Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function Btn({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm ${active ? "bg-slate-900 text-white" : "hover:bg-slate-200"}`}
    >
      {children}
    </button>
  );
}
