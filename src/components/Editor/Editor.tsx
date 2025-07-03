import React, { useState, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { X, Save, FileText } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";

interface EditorProps {}

const Editor: React.FC<EditorProps> = () => {
  const {
    openTabs,
    activeTab,
    currentContent,
    isContentModified,
    closeTab,
    updateContent,
    saveCurrentFile,
  } = useProjectStore();

  const activeTabData = openTabs.find((tab) => tab.id === activeTab);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your story...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: currentContent || "",
    onUpdate: ({ editor }) => {
      updateContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-full p-4",
      },
    },
  });

  // Update editor content when active tab changes
  useEffect(() => {
    if (editor && activeTabData) {
      editor.commands.setContent(currentContent);
    }
  }, [activeTab, editor, currentContent]);

  // Listen for dialogue insertion from character panel
  useEffect(() => {
    const handleDialogueInsertion = (event: CustomEvent) => {
      const { characterName, dialogue } = event.detail;
      insertDialogueAtCursor(characterName, dialogue);
    };

    window.addEventListener(
      "insertDialogue",
      handleDialogueInsertion as EventListener
    );

    return () => {
      window.removeEventListener(
        "insertDialogue",
        handleDialogueInsertion as EventListener
      );
    };
  }, [editor]);

  const insertDialogueAtCursor = (characterName: string, dialogue: string) => {
    if (!editor) return;

    const { selection } = editor.state;
    const { from, to } = selection;

    // Get current line content
    const doc = editor.state.doc;
    const currentPos = from;
    const $pos = doc.resolve(currentPos);
    const line = $pos.parent;
    const lineText = line.textContent;

    // Check if we're in a dialogue line
    const dialoguePattern = /^([^:]+):\s*/;
    const isInDialogue = dialoguePattern.test(lineText);

    if (isInDialogue) {
      // We're in a dialogue line, split it
      const lineStart = $pos.start();
      const lineEnd = $pos.end();
      const beforeCursor = lineText.substring(0, currentPos - lineStart);
      const afterCursor = lineText.substring(currentPos - lineStart);

      const match = beforeCursor.match(dialoguePattern);
      if (match) {
        const originalCharacter = match[1];
        const beforeDialogue = beforeCursor.substring(match[0].length);

        // Create the replacement content
        const newContent = [
          `${originalCharacter}: ${beforeDialogue}`,
          ``,
          `${characterName}: ${dialogue}`,
          ``,
          `${originalCharacter}: ${afterCursor}`,
        ].join("\n");

        // Replace the entire line
        editor
          .chain()
          .focus()
          .setTextSelection({ from: lineStart, to: lineEnd })
          .deleteSelection()
          .insertContent(newContent)
          .run();
      }
    } else {
      // We're in narrative text, split and insert dialogue
      if (from === to) {
        // No selection, just insert at cursor
        const insertContent = `\n\n${characterName}: ${dialogue}\n\n`;
        editor.chain().focus().insertContent(insertContent).run();
      } else {
        // There's a selection, split around it
        const selectedText = editor.state.doc.textBetween(from, to);
        const insertContent = `\n\n${characterName}: ${dialogue}\n\n${selectedText}`;

        editor
          .chain()
          .focus()
          .deleteSelection()
          .insertContent(insertContent)
          .run();
      }
    }
  };

  const handleTabClick = (tabId: string) => {
    useProjectStore.getState().openTabs.find((tab) => tab.id === tabId) &&
      useProjectStore.setState({ activeTab: tabId });
  };

  const handleCloseTab = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    closeTab(tabId);
  };

  const handleSave = () => {
    saveCurrentFile();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Ctrl+S to save
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      handleSave();
    }
  };

  // Get word count
  const getWordCount = () => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  if (openTabs.length === 0) {
    return (
      <div className="editor-container">
        <div className="editor-placeholder">
          <FileText size={48} />
          <p>Open a chapter or idea to start writing</p>
          <div className="editor-tips">
            <h4>Tips:</h4>
            <ul>
              <li>Use the character panel to insert dialogue</li>
              <li>Press Ctrl+S to save</li>
              <li>Create new chapters from the sidebar</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container" onKeyDown={handleKeyDown}>
      {/* Tabs */}
      <div className="editor-tabs">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`editor-tab ${tab.id === activeTab ? "active" : ""}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="tab-name">
              {tab.name}
              {tab.modified && <span className="modified-indicator">•</span>}
            </span>
            <button
              className="tab-close"
              onClick={(e) => handleCloseTab(tab.id, e)}
              title="Close tab"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Save button */}
        <div className="tab-actions">
          <button
            className={`save-button ${isContentModified ? "modified" : ""}`}
            onClick={handleSave}
            disabled={!isContentModified}
            title="Save (Ctrl+S)"
          >
            <Save size={16} />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className="editor-status">
        <span className="word-count">{getWordCount()} words</span>
        <span className="character-count">
          {editor?.storage.characterCount?.characters() ||
            editor?.getText().length ||
            0}{" "}
          characters
        </span>
        <span className="file-status">
          {isContentModified ? "Modified" : "Saved"}
        </span>
      </div>
    </div>
  );
};

export default Editor;
