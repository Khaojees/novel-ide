// src/components/Editor/Editor.tsx
import React, { useState, useEffect } from "react";
import { X, Save, FileText } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";

const Editor: React.FC = () => {
  const {
    openTabs,
    activeTab,
    currentContent,
    closeTab,
    updateContent,
    saveCurrentFile,
    chapters,
    ideas,
    openTab,
  } = useProjectStore();

  const [localContent, setLocalContent] = useState(currentContent);

  // Sync local content with store
  useEffect(() => {
    setLocalContent(currentContent);
  }, [currentContent]);

  const handleTabClick = (tabId: string) => {
    const tab = openTabs.find((t) => t.id === tabId);
    if (tab) {
      // Find the original item and open it
      const chapter = chapters.find((c) => c.id === tabId);
      const idea = ideas.find((i) => i.id === tabId);

      if (chapter) {
        openTab(chapter);
      } else if (idea) {
        openTab(idea);
      }
    }
  };

  const handleCloseTab = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    closeTab(tabId);
  };

  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newContent = event.target.value;
    setLocalContent(newContent);
    updateContent(newContent);
  };

  const handleSave = async () => {
    try {
      await saveCurrentFile();
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const activeTabData = openTabs.find((tab) => tab.id === activeTab);

  // Listen for dialogue insertion events
  useEffect(() => {
    const handleDialogueInsertion = (event: CustomEvent) => {
      const { characterName, dialogue } = event.detail;

      if (activeTabData) {
        // Simple dialogue insertion - just append to current content
        const dialogueText = `\n\n${characterName}: "${dialogue}"\n\n`;
        const newContent = localContent + dialogueText;
        setLocalContent(newContent);
        updateContent(newContent);
      }
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
  }, [activeTabData, localContent, updateContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "s") {
          event.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="editor-container">
      {/* Tabs */}
      <div className="editor-tabs">
        {openTabs.map((tab) => (
          <button
            key={tab.id}
            className={`editor-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <FileText size={14} />
            <span>{tab.name}</span>
            {tab.modified && <span className="modified-indicator">●</span>}
            <button
              className="tab-close"
              onClick={(e) => handleCloseTab(tab.id, e)}
            >
              <X size={12} />
            </button>
          </button>
        ))}
      </div>

      {/* Editor Content */}
      <div className="editor-content">
        {activeTabData ? (
          <div className="editor-workspace">
            <div className="editor-toolbar">
              <button
                className="toolbar-button"
                onClick={handleSave}
                disabled={!activeTabData.modified}
              >
                <Save size={16} />
                Save
              </button>
              <div className="editor-info">
                <span className="word-count">
                  Words:{" "}
                  {localContent.split(/\s+/).filter((w) => w.length > 0).length}
                </span>
                <span className="char-count">
                  Characters: {localContent.length}
                </span>
              </div>
            </div>

            <textarea
              className="editor-textarea"
              value={localContent}
              onChange={handleContentChange}
              placeholder="Start writing your story..."
              autoFocus
            />
          </div>
        ) : (
          <div className="editor-placeholder">
            <h3>Welcome to Novel IDE</h3>
            <p>Select a chapter or idea from the sidebar to start writing.</p>

            <div className="editor-tips">
              <h4>Quick Tips:</h4>
              <ul>
                <li>Use the Character Panel to quickly insert dialogue</li>
                <li>Press Ctrl+S to save your work</li>
                <li>Create new chapters and ideas from the sidebar</li>
                <li>Your work is automatically organized into files</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
