// src/components/Editor/StructuredEditor.tsx
import React, { useRef, useEffect, useCallback, useState } from "react";
import { Character } from "../../types";
import { Location, StructuredChapter } from "../../types/structured";
import { Save, Trash2, RotateCcw } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { useConfirm } from "../ConfirmDialogContext/ConfirmDialogContext";
import { convertContentNodesToHtml } from "../../utils/contentUtils";

interface StructuredEditorProps {
  chapter: StructuredChapter;
  characters: Character[];
  locations: Location[];
  onContentChange: (htmlContent: string) => void;
  onSave: () => void;
  isModified: boolean;
}

const StructuredEditor: React.FC<StructuredEditorProps> = ({
  chapter,
  characters,
  locations,
  onContentChange,
  onSave,
  isModified,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  // Fix: เปลี่ยนจาก ContentNode[] เป็น string
  const [lastHtml, setLastHtml] = useState<string>("");
  const { deleteChapter } = useProjectStore();
  const confirm = useConfirm();

  // Register custom elements for character and location references
  useEffect(() => {
    // Character reference element
    if (!customElements.get("char-ref")) {
      customElements.define(
        "char-ref",
        class extends HTMLElement {
          connectedCallback() {
            this.contentEditable = "false";
            this.style.cssText = `
            display: inline;
            background: var(--character-color, #10b981);
            color: white;
            padding: 2px 6px;
            margin: 0 1px;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            user-select: none;
            font-size: inherit;
            line-height: inherit;
          `;

            // Add hover effect
            this.addEventListener("mouseenter", () => {
              this.style.transform = "translateY(-1px)";
              this.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.3)";
            });

            this.addEventListener("mouseleave", () => {
              this.style.transform = "translateY(0)";
              this.style.boxShadow = "none";
            });
          }
        }
      );
    }

    // Location reference element
    if (!customElements.get("loc-ref")) {
      customElements.define(
        "loc-ref",
        class extends HTMLElement {
          connectedCallback() {
            this.contentEditable = "false";
            this.style.cssText = `
            display: inline;
            background: var(--location-color, #a855f7);
            color: white;
            padding: 2px 6px;
            margin: 0 1px;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            user-select: none;
            font-size: inherit;
            line-height: inherit;
          `;

            // Add hover effect
            this.addEventListener("mouseenter", () => {
              this.style.transform = "translateY(-1px)";
              this.style.boxShadow = "0 2px 8px rgba(168, 85, 247, 0.3)";
            });

            this.addEventListener("mouseleave", () => {
              this.style.transform = "translateY(0)";
              this.style.boxShadow = "none";
            });
          }
        }
      );
    }
  }, []);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    const htmlContent = editorRef.current.innerHTML;
    if (htmlContent !== lastHtml) {
      setLastHtml(htmlContent);
      onContentChange(htmlContent);
    }
  }, [lastHtml, onContentChange]);

  // Update refs when character/location names change
  useEffect(() => {
    if (!editorRef.current) return;

    let updated = false;

    // Update character refs
    const charRefs = editorRef.current.querySelectorAll("char-ref");
    charRefs.forEach((ref) => {
      const charId = ref.getAttribute("id");
      const character = characters.find((c) => c.id === charId);
      if (character && ref.textContent !== character.name) {
        ref.textContent = character.name;
        updated = true;
      }
    });

    // Update location refs
    const locRefs = editorRef.current.querySelectorAll("loc-ref");
    locRefs.forEach((ref) => {
      const locId = ref.getAttribute("id");
      const location = locations.find((l) => l.id === locId);
      if (location && ref.textContent !== location.name) {
        ref.textContent = location.name;
        updated = true;
      }
    });

    // If refs were updated, notify parent
    if (updated) {
      handleInput();
    }
  }, [characters, locations, handleInput]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const selection = window.getSelection();
      if (!selection || !selection.anchorNode) return;

      // Handle Backspace/Delete for ref deletion
      if (e.key === "Backspace" || e.key === "Delete") {
        const range = selection.getRangeAt(0);
        const { startContainer, startOffset } = range;

        // Check if cursor is right after a ref element
        if (e.key === "Backspace" && startOffset === 0) {
          const previousSibling = startContainer.previousSibling;
          if (
            previousSibling &&
            (previousSibling.nodeName === "CHAR-REF" ||
              previousSibling.nodeName === "LOC-REF")
          ) {
            e.preventDefault();
            previousSibling.remove();
            handleInput();
            return;
          }
        }

        // Check if cursor is right before a ref element (for Delete key)
        if (e.key === "Delete") {
          const nextSibling = startContainer.nextSibling;
          if (
            nextSibling &&
            (nextSibling.nodeName === "CHAR-REF" ||
              nextSibling.nodeName === "LOC-REF")
          ) {
            e.preventDefault();
            nextSibling.remove();
            handleInput();
            return;
          }
        }

        // If selection includes ref elements, delete them
        if (!range.collapsed) {
          const contents = range.extractContents();
          const refElements = contents.querySelectorAll("char-ref, loc-ref");
          if (refElements.length > 0) {
            e.preventDefault();
            range.deleteContents();
            handleInput();
            return;
          }
        }
      }

      // Ctrl+S to save
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        onSave();
      }

      // Prevent editing inside ref elements
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "CHAR-REF" ||
          activeElement.tagName === "LOC-REF")
      ) {
        e.preventDefault();
      }
    },
    [handleInput, onSave]
  );

  // Insert character reference at cursor
  const insertCharacterRef = useCallback(
    (characterId: string) => {
      const character = characters.find((c) => c.id === characterId);
      if (!character || !editorRef.current) return;

      editorRef.current.focus();
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const charRef = document.createElement("char-ref");
      charRef.setAttribute("id", characterId);
      charRef.textContent = character.name;

      range.deleteContents();
      range.insertNode(charRef);

      // Move cursor after the ref
      range.setStartAfter(charRef);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    },
    [characters, handleInput]
  );

  // Insert location reference at cursor
  const insertLocationRef = useCallback(
    (locationId: string) => {
      const location = locations.find((l) => l.id === locationId);
      if (!location || !editorRef.current) return;

      editorRef.current.focus();
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const locRef = document.createElement("loc-ref");
      locRef.setAttribute("id", locationId);
      locRef.textContent = location.name;

      range.deleteContents();
      range.insertNode(locRef);

      // Move cursor after the ref
      range.setStartAfter(locRef);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    },
    [locations, handleInput]
  );

  // Listen to custom events from character/location panels
  useEffect(() => {
    const handleInsertCharacter = (e: CustomEvent) => {
      insertCharacterRef(e.detail.characterId);
    };

    const handleInsertLocation = (e: CustomEvent) => {
      insertLocationRef(e.detail.locationId);
    };

    // Listen to events from panels
    window.addEventListener(
      "insertCharacterRef",
      handleInsertCharacter as EventListener
    );
    window.addEventListener(
      "insertLocationRef",
      handleInsertLocation as EventListener
    );
    window.addEventListener(
      "insertLocationTag",
      handleInsertLocation as EventListener
    ); // legacy support

    return () => {
      window.removeEventListener(
        "insertCharacterRef",
        handleInsertCharacter as EventListener
      );
      window.removeEventListener(
        "insertLocationRef",
        handleInsertLocation as EventListener
      );
      window.removeEventListener(
        "insertLocationTag",
        handleInsertLocation as EventListener
      );
    };
  }, [insertCharacterRef, insertLocationRef]);

  // Set initial content
  useEffect(() => {
    if (editorRef.current) {
      // ใช้ฟังก์ชัน convertContentNodesToHtml แทนการ manual map
      let htmlContent = "";

      if (Array.isArray(chapter.content)) {
        // ใช้ฟังก์ชันที่มีอยู่แล้วแทนการ manual convert
        htmlContent = convertContentNodesToHtml(chapter.content);
      } else if (typeof chapter.content === "string") {
        htmlContent = chapter.content;
      }

      console.log("🔄 Setting initial content:", htmlContent);

      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
        setLastHtml(htmlContent);
      }
    }
  }, [chapter.content]);

  const handleDiscardChanges = () => {
    if (editorRef.current) {
      // ใช้ฟังก์ชัน convertContentNodesToHtml แทนการ manual map
      let originalContent = "";

      if (Array.isArray(chapter.content)) {
        originalContent = convertContentNodesToHtml(chapter.content);
      } else if (typeof chapter.content === "string") {
        originalContent = chapter.content;
      }

      console.log("🔄 Discarding to:", originalContent);

      editorRef.current.innerHTML = originalContent;
      setLastHtml(originalContent);
      onContentChange(originalContent);
    }
  };

  const handleDeleteChapter = async () => {
    const confirmed = await confirm({
      title: "Delete Chapter",
      message: `Are you sure you want to delete "${chapter.metadata.title}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed && deleteChapter) {
      try {
        await deleteChapter(chapter.id);
      } catch (error) {
        console.error("Failed to delete chapter:", error);
        alert("Failed to delete chapter. Please try again.");
      }
    }
  };

  // Count words for display
  const getWordCount = () => {
    if (!editorRef.current) return 0;
    const text = editorRef.current.textContent || "";
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  return (
    <div className="structured-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <h3>{chapter.metadata.title}</h3>
        </div>

        <div className="toolbar-right">
          <span className="word-count">{getWordCount()} words</span>

          <button
            className={`save-btn ${isModified ? "modified" : ""}`}
            onClick={onSave}
            disabled={!isModified}
          >
            <Save size={16} />
            {isModified ? "Save" : "Saved"}
          </button>

          {isModified && (
            <button
              className="discard-btn"
              onClick={handleDiscardChanges}
              title="Discard changes"
            >
              <RotateCcw size={16} />
              Discard
            </button>
          )}

          <button
            className="delete-btn"
            onClick={handleDeleteChapter}
            title="Delete chapter"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          padding: "20px",
          lineHeight: "1.8",
          fontSize: "16px",
          outline: "none",
          background: "#0d1117",
          color: "#e6edf3",
          minHeight: "400px",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
        suppressContentEditableWarning={true}
        data-placeholder="Start writing your chapter here..."
      />
    </div>
  );
};

export default StructuredEditor;
