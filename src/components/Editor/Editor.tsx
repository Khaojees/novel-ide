// src/components/Editor/Editor.tsx
import React, { useState, useEffect, useCallback } from "react";
import { X, Save, Users, BookOpen, Lightbulb } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
// Import CharacterEditor as type-safe
import CharacterEditor from "./CharacterEditor";
import { Character, Tab } from "../../type";

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
    characters,
    openTab,
    openCharacterTab,
    updateCharacter,
    deleteCharacter,
    getCharacterUsage,
  } = useProjectStore();

  const [localContent, setLocalContent] = useState(currentContent);

  // Sync local content with store
  useEffect(() => {
    setLocalContent(currentContent);
  }, [currentContent]);

  // Helper function to determine tab type
  const getTabType = (tab: any): "character" | "chapter" | "idea" => {
    if (tab.type) {
      return tab.type as "character" | "chapter" | "idea";
    }

    // Fallback: determine by checking if id exists in different arrays
    const isCharacter = characters.some((char) => char.id === tab.id);
    const isChapter = chapters.some((chapter) => chapter.id === tab.id);
    const isIdea = ideas.some((idea) => idea.id === tab.id);

    if (isCharacter) return "character";
    if (isChapter) return "chapter";
    if (isIdea) return "idea";

    return "chapter"; // default
  };

  // Helper function to get tab icon
  const getTabIcon = (type: "character" | "chapter" | "idea"): JSX.Element => {
    switch (type) {
      case "character":
        return <Users size={14} />;
      case "chapter":
        return <BookOpen size={14} />;
      case "idea":
        return <Lightbulb size={14} />;
      default:
        return <BookOpen size={14} />;
    }
  };

  // Helper function to get emoji icon for CSS ::before fallback
  const getTabEmoji = (type: "character" | "chapter" | "idea"): string => {
    switch (type) {
      case "character":
        return "👤";
      case "chapter":
        return "📖";
      case "idea":
        return "💡";
      default:
        return "📄";
    }
  };

  const handleTabClick = (tabId: string) => {
    const tab = openTabs.find((t) => t.id === tabId);
    if (tab) {
      // Find the original item and open it
      const chapter = chapters.find((c) => c.id === tabId);
      const idea = ideas.find((i) => i.id === tabId);
      const character = characters.find((char) => char.id === tabId);

      if (chapter) {
        openTab(chapter);
      } else if (idea) {
        openTab(idea);
      } else if (character) {
        openCharacterTab(character);
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

  const handleSave = useCallback(async () => {
    try {
      await saveCurrentFile();
    } catch (error) {
      console.error("Failed to save:", error);
    }
  }, [saveCurrentFile]);

  const activeTabData = openTabs.find((tab) => tab.id === activeTab);

  // Type guard for character tab
  const isCharacterTab = (
    tab: any
  ): tab is Tab & { type: "character"; characterData: Character } => {
    return tab?.type === "character" && tab?.characterData;
  };

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
  }, [handleSave]);

  return (
    <div className="editor-container">
      {/* Color-Coded Tabs */}
      <div className="editor-tabs">
        {openTabs.map((tab) => {
          const tabType = getTabType(tab);
          const isActive = activeTab === tab.id;
          const isModified = tab.modified;

          return (
            <div
              key={tab.id}
              className={`editor-tab ${tabType} ${isActive ? "active" : ""} ${
                isModified ? "modified" : ""
              }`}
              onClick={() => handleTabClick(tab.id)}
              title={`${tab.name} (${tabType})`}
              data-emoji={getTabEmoji(tabType)} // For CSS ::before if needed
            >
              {/* Icon */}
              <span className="tab-icon">{getTabIcon(tabType)}</span>

              {/* Tab name */}
              <span className="tab-name">{tab.name}</span>

              {/* Modified indicator */}
              {isModified && (
                <span
                  className="modified-indicator"
                  title="File has unsaved changes"
                >
                  ●
                </span>
              )}

              {/* Close button */}
              <button
                className="tab-close"
                onClick={(e) => handleCloseTab(tab.id, e)}
                title="Close tab"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor Content */}
      <div className="editor-content">
        {activeTabData ? (
          isCharacterTab(activeTabData) ? (
            /* Character Editor */
            <CharacterEditor
              character={activeTabData.characterData}
              onSave={async (character) => {
                await updateCharacter(character.id, character);
              }}
              onCancel={() => closeTab(activeTabData.id)}
              onDelete={deleteCharacter}
              usage={getCharacterUsage(activeTabData.id)}
              isModified={activeTabData.modified || false}
              onModifiedChange={(modified) => {
                // Update tab modified state
                const updatedTabs = openTabs.map((tab) =>
                  tab.id === activeTabData.id ? { ...tab, modified } : tab
                );
                // This would need to be added to the store, for now just log
                console.log("Character modified:", modified);
              }}
            />
          ) : (
            /* Regular Text Editor */
            <div className="editor-workspace">
              {/* Toolbar with save button and file info */}
              <div className="editor-toolbar">
                <div className="toolbar-left">
                  <button
                    className="toolbar-button"
                    onClick={handleSave}
                    disabled={!activeTabData.modified}
                    title={
                      activeTabData.modified
                        ? "Save file (Ctrl+S)"
                        : "No changes to save"
                    }
                  >
                    <Save size={16} />
                    Save
                  </button>

                  {/* File type indicator */}
                  <span
                    className={`file-type-badge ${getTabType(
                      activeTabData
                    )}-theme`}
                  >
                    {getTabIcon(getTabType(activeTabData))}
                    {getTabType(activeTabData).charAt(0).toUpperCase() +
                      getTabType(activeTabData).slice(1)}
                  </span>
                </div>

                <div className="editor-info">
                  <span className="word-count">
                    Words:{" "}
                    {
                      localContent.split(/\s+/).filter((w) => w.length > 0)
                        .length
                    }
                  </span>
                  <span className="char-count">
                    Characters: {localContent.length}
                  </span>
                  {activeTabData.modified && (
                    <span className="unsaved-indicator">● Unsaved changes</span>
                  )}
                </div>
              </div>

              {/* Text Editor */}
              <textarea
                className="editor-textarea"
                value={localContent}
                onChange={handleContentChange}
                placeholder={`Start writing your ${getTabType(
                  activeTabData
                )}...`}
                autoFocus
              />
            </div>
          )
        ) : (
          /* Empty state */
          <div className="editor-placeholder">
            <h3>Welcome to Novel IDE</h3>
            <p>
              Select a chapter, idea, or character from the sidebar to start
              working.
            </p>

            <div className="editor-tips">
              <h4>Quick Tips:</h4>
              <ul>
                <li>
                  <span className="tip-icon">👤</span>
                  Click characters to edit their profiles
                </li>
                <li>
                  <span className="tip-icon">📖</span>
                  Create chapters to organize your story
                </li>
                <li>
                  <span className="tip-icon">💡</span>
                  Use ideas to capture plot points and world-building
                </li>
                <li>
                  <span className="tip-icon">⌨️</span>
                  Press Ctrl+S to save your work
                </li>
                <li>
                  <span className="tip-icon">🎯</span>
                  Use the Character Panel to quickly insert dialogue
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
