import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Bold, Italic, List, ListOrdered, Heading2, Quote } from "lucide-react";
import NepaliInput from "./NepaliInput";

interface RichNepaliEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  id?: string;
  name?: string;
  required?: boolean;
}

const RichNepaliEditor = forwardRef<HTMLTextAreaElement, RichNepaliEditorProps>(
  ({ value, onChange, placeholder, className, rows = 12, id, name, required = false }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [selectedText, setSelectedText] = useState("");

    useImperativeHandle(ref, () => textareaRef.current as any);

    const getSelectedText = () => {
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        return {
          text: value.substring(start, end),
          start,
          end,
        };
      }
      return { text: "", start: 0, end: 0 };
    };

    const insertFormat = (before: string, after: string = "") => {
      const { text, start, end } = getSelectedText();
      
      if (textareaRef.current) {
        const newValue =
          value.substring(0, start) +
          before +
          text +
          after +
          value.substring(end);
        
        onChange(newValue);

        // Restore cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = start + before.length + text.length;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      }
    };

    const formatBold = () => insertFormat("**", "**");
    const formatItalic = () => insertFormat("_", "_");
    const formatHeading = () => {
      const { text, start, end } = getSelectedText();
      const newValue = value.substring(0, start) + "## " + text + "\n" + value.substring(end);
      onChange(newValue);
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(
            start + 3 + text.length,
            start + 3 + text.length
          );
          textareaRef.current?.focus();
        }, 0);
      }
    };

    const formatBulletList = () => {
      const { text, start, end } = getSelectedText();
      const lines = text.split("\n");
      const formattedLines = lines.map(line => (line.trim() ? "• " + line : line));
      const newText = formattedLines.join("\n");
      const newValue = value.substring(0, start) + newText + value.substring(end);
      onChange(newValue);
    };

    const formatNumberedList = () => {
      const { text, start, end } = getSelectedText();
      const lines = text.split("\n");
      const formattedLines = lines.map((line, i) => (line.trim() ? `${i + 1}. ` + line : line));
      const newText = formattedLines.join("\n");
      const newValue = value.substring(0, start) + newText + value.substring(end);
      onChange(newValue);
    };

    const formatQuote = () => {
      const { text, start, end } = getSelectedText();
      const lines = text.split("\n");
      const formattedLines = lines.map(line => "> " + line);
      const newText = formattedLines.join("\n");
      const newValue = value.substring(0, start) + newText + value.substring(end);
      onChange(newValue);
    };

    const formatButtons = [
      { icon: Bold, tooltip: "बोल्ड (Ctrl+B)", action: formatBold, label: "B" },
      { icon: Italic, tooltip: "इटालिक (Ctrl+I)", action: formatItalic, label: "I" },
      { icon: Heading2, tooltip: "शीर्षक", action: formatHeading },
      { icon: List, tooltip: "बुलेट सूची", action: formatBulletList },
      { icon: ListOrdered, tooltip: "नम्बर सूची", action: formatNumberedList },
      { icon: Quote, tooltip: "उद्धरण", action: formatQuote },
    ];

    return (
      <div className="flex flex-col gap-3">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100 flex-wrap">
          {formatButtons.map((btn, idx) => {
            const Icon = btn.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={btn.action}
                title={btn.tooltip}
                className="p-2 hover:bg-primary hover:text-white text-slate-600 rounded-lg transition-all active:scale-95 flex items-center justify-center"
                style={{ minWidth: "36px", minHeight: "36px" }}
              >
                {btn.icon ? <Icon size={16} /> : <span className="font-bold text-sm">{btn.label}</span>}
              </button>
            );
          })}
          <div className="flex-grow" />
          <span className="text-xs text-slate-400 font-medium mr-2">
            **बोल्ड** _इटालिक_ &gt; उद्धरण • बुलेट
          </span>
        </div>

        {/* Editor */}
        <NepaliInput
          ref={textareaRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
          type="textarea"
          rows={rows}
          id={id}
          name={name}
          required={required}
        />

        {/* Tips */}
        <div className="text-xs text-slate-500 font-medium space-y-1 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="font-bold text-blue-700">✓ फरम्यात सुझाभाउ:</p>
          <ul className="space-y-0.5 ml-2">
            <li>• <strong>**पाठ**</strong> = बोल्ड</li>
            <li>• <strong>_पाठ_</strong> = इटालिक</li>
            <li>• <strong>## शीर्षक</strong> = शीर्षक</li>
            <li>• <strong>&gt; पाठ</strong> = उद्धरण</li>
          </ul>
        </div>
      </div>
    );
  }
);

RichNepaliEditor.displayName = "RichNepaliEditor";

export default RichNepaliEditor;
