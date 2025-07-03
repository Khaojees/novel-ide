import React, { useState, useCallback } from "react";
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
  React.useEffect(() => {
    if (editor && activeTabData) {
      editor.commands.setContent(currentContent);
    }
  }, [activeTab, editor, currentContent]);

  const handleTabClick = (tabId: string) => {
    // Tab switching is handled by the store
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

  if (openTabs.length === 0) {
    return (
      <div className="editor-container">
        <div className="editor-placeholder">
          <FileText size={48} />
          <p>Open a chapter or idea to start writing</p>
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
        <span className="word-count">
          {editor?.storage.characterCount?.words() || 0} words
        </span>
        <span className="file-status">
          {isContentModified ? "Modified" : "Saved"}
        </span>
      </div>
    </div>
  );
};

export default Editor;
