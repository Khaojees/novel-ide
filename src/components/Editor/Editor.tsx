// src/components/Editor/Editor.tsx - Complete Fixed Version
import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Users, BookOpen, Lightbulb, MapPin } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import StructuredEditor from "./StructuredEditor";
import CharacterEditor from "./CharacterEditor";
import { Character, Tab } from "../../types";
import { Location, ContentNode } from "../../types/structured";
import LocationEditor from "./LocationEditor";
import { useConfirm } from "../ConfirmDialogContext/ConfirmDialogContext";

const Editor: React.FC = () => {
  const {
    openTabs,
    activeTab,
    closeTab,
    chapters,
    characters,
    locations,
    updateCharacter,
    updateLocation,
    updateChapterContent,
    deleteCharacter,
    deleteLocation,
    getCharacterUsage,
    getLocationUsage,
  } = useProjectStore();

  const [contentModified, setContentModified] = useState<
    Record<string, boolean>
  >({});

  const [latestChapterContent, setLatestChapterContent] = useState<
    Record<string, ContentNode[]>
  >({});

  const confirm = useConfirm();

  const originalContentRef = useRef<string>("");

  // Get current active tab data
  const currentChapter = chapters.find((chapter) => chapter.id === activeTab);
  const currentCharacter = characters.find((char) => char.id === activeTab);
  const currentLocation = locations.find((loc) => loc.id === activeTab);

  // Set active tab - use direct store access
  const setActiveTab = useCallback((tabId: string) => {
    // Direct store update since setActiveTab might not be exposed
    useProjectStore.setState((state) => ({
      ...state,
      activeTab: tabId,
    }));
  }, []);

  // Handle tab close
  const handleCloseTab = useCallback(
    async (tabId: string) => {
      const isModified = contentModified[tabId];
      if (isModified) {
        const isConfirmed = await confirm({
          title: "Unsaved Changes",
          message:
            "You have unsaved changes. Are you sure you want to close this tab?",
        });

        if (!isConfirmed) return;
      }

      closeTab(tabId);
      setContentModified((prev) => {
        const newState = { ...prev };
        delete newState[tabId];
        return newState;
      });
    },
    [closeTab, contentModified, confirm]
  );

  useEffect(() => {
    if (currentChapter) {
      originalContentRef.current = JSON.stringify(currentChapter.content);
    }
  }, [currentChapter?.id, currentChapter]);

  // Handle content change for chapters
  const handleChapterContentChange = useCallback(
    (nodes: ContentNode[]) => {
      if (!currentChapter) return;

      // เก็บ nodes ล่าสุด
      setLatestChapterContent((prev) => ({
        ...prev,
        [currentChapter.id]: nodes,
      }));

      setContentModified((prev) => ({
        ...prev,
        [currentChapter.id]: true,
      }));
    },
    [currentChapter]
  );

  // Handle save for chapters
  const handleSaveChapter = useCallback(async () => {
    if (!currentChapter || !updateChapterContent) return;

    try {
      // ใช้ content ล่าสุดจาก state แทน
      const nodesToSave =
        latestChapterContent[currentChapter.id] || currentChapter.content;
      await updateChapterContent(currentChapter.id, nodesToSave);

      setContentModified((prev) => ({
        ...prev,
        [currentChapter.id]: false,
      }));

      console.log("Chapter saved successfully!");
    } catch (error) {
      console.error("Failed to save chapter:", error);
      alert("Failed to save chapter. Please try again.");
    }
  }, [currentChapter, updateChapterContent, latestChapterContent]);

  // Handle save for characters
  const handleSaveCharacter = useCallback(
    async (character: Character) => {
      try {
        await updateCharacter(character.id, character);

        setContentModified((prev) => ({
          ...prev,
          [character.id]: false,
        }));

        console.log("Character saved successfully!");
      } catch (error) {
        console.error("Failed to save character:", error);
        alert("Failed to save character. Please try again.");
      }
    },
    [updateCharacter]
  );

  // Handle save for locations
  const handleSaveLocation = useCallback(
    async (location: Location) => {
      if (!updateLocation) return;

      try {
        await updateLocation(location.id, location);

        setContentModified((prev) => ({
          ...prev,
          [location.id]: false,
        }));

        console.log("Location saved successfully!");
      } catch (error) {
        console.error("Failed to save location:", error);
        alert("Failed to save location. Please try again.");
      }
    },
    [updateLocation]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();

        if (currentChapter) {
          handleSaveChapter();
        } else if (currentCharacter) {
          handleSaveCharacter(currentCharacter);
        } else if (currentLocation) {
          handleSaveLocation(currentLocation);
        }
      }

      // Close tab with Ctrl+W
      if (e.ctrlKey && e.key === "w" && activeTab) {
        e.preventDefault();
        handleCloseTab(activeTab);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    currentChapter,
    currentCharacter,
    currentLocation,
    activeTab,
    handleSaveChapter,
    handleSaveCharacter,
    handleSaveLocation,
    handleCloseTab,
  ]);

  // Get tab icon
  const getTabIcon = (tab: Tab): JSX.Element => {
    switch (tab.type) {
      case "character":
        return <Users size={14} />;
      case "chapter":
        return <BookOpen size={14} />;
      case "idea":
        return <Lightbulb size={14} />;
      case "location":
        return <MapPin size={14} />;
      default:
        return <BookOpen size={14} />;
    }
  };

  // Get tab title
  const getTabTitle = (tab: Tab): string => {
    return tab.title || tab.name || "Untitled";
  };

  const getTabType = (tab: Tab): string => {
    switch (tab.type) {
      case "character":
        return "character";
      case "chapter":
        return "chapter";
      case "idea":
        return "idea";
      case "location":
        return "location";
      default:
        return "chapter";
    }
  };

  // Show empty state if no tabs
  if (openTabs.length === 0) {
    return (
      <div className="editor-container">
        <div className="editor-empty">
          <div className="empty-state">
            <BookOpen size={64} className="empty-icon" />
            <h2>No files open</h2>
            <p>
              Select a chapter, character, location, or idea from the sidebar to
              start editing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      {/* Tab Bar */}
      <div className="editor-tabs">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`editor-tab ${getTabType(tab)} ${
              activeTab === tab.id ? "active" : ""
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {/* แก้จาก tab-content เป็น tab-icon */}
            <div className="tab-icon">{getTabIcon(tab)}</div>
            {/* แก้จาก tab-title เป็น tab-name */}
            <span className="tab-name">{getTabTitle(tab)}</span>
            {contentModified[tab.id] && (
              <span className="modified-indicator">●</span>
            )}
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseTab(tab.id);
              }}
              title="Close tab"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Editor Content */}
      <div className="editor-content">
        {/* Chapter Editor */}
        {currentChapter && (
          <StructuredEditor
            key={currentChapter.id}
            chapter={currentChapter}
            characters={characters}
            locations={locations || []}
            onContentChange={handleChapterContentChange}
            onSave={handleSaveChapter}
            isModified={contentModified[currentChapter.id] || false}
          />
        )}

        {/* Character Editor */}
        {currentCharacter && (
          <CharacterEditor
            key={currentCharacter.id}
            character={currentCharacter}
            onSave={handleSaveCharacter}
            onCancel={() => closeTab(currentCharacter.id)}
            onDelete={
              deleteCharacter
                ? async (characterId: string) => {
                    try {
                      const success = await deleteCharacter(characterId);
                      if (success) {
                        closeTab(characterId);
                      }
                      return success;
                    } catch (error) {
                      console.error("Failed to delete character:", error);
                      return false;
                    }
                  }
                : undefined
            }
            usage={
              getCharacterUsage ? getCharacterUsage(currentCharacter.id) : []
            }
            isModified={contentModified[currentCharacter.id] || false}
            onModifiedChange={(modified: boolean) => {
              setContentModified((prev) => ({
                ...prev,
                [currentCharacter.id]: modified,
              }));
            }}
          />
        )}

        {/* Location Editor */}
        {currentLocation && updateLocation && (
          <LocationEditor
            key={currentLocation.id}
            location={currentLocation}
            onSave={handleSaveLocation}
            onCancel={() => closeTab(currentLocation.id)}
            onDelete={
              deleteLocation
                ? async (locationId: string) => {
                    try {
                      const success = await deleteLocation(locationId);
                      if (success) {
                        closeTab(locationId);
                      }
                      return success;
                    } catch (error) {
                      console.error("Failed to delete location:", error);
                      return false;
                    }
                  }
                : undefined
            }
            getLocationUsage={getLocationUsage || (() => [])}
            isModified={contentModified[currentLocation.id] || false}
            onContentChange={() => {
              setContentModified((prev) => ({
                ...prev,
                [currentLocation.id]: true,
              }));
            }}
          />
        )}

        {/* Fallback for unsupported tab types */}
        {!currentChapter &&
          !currentCharacter &&
          !currentLocation &&
          activeTab && (
            <div className="editor-fallback">
              <div className="fallback-content">
                <div className="fallback-icon">
                  {getTabIcon(
                    openTabs.find((t) => t.id === activeTab) || ({} as Tab)
                  )}
                </div>
                <h3>Editor not available</h3>
                <p>This content type doesn't have a dedicated editor yet.</p>
                <div className="fallback-info">
                  <strong>Tab ID:</strong> {activeTab}
                  <br />
                  <strong>Type:</strong>{" "}
                  {openTabs.find((t) => t.id === activeTab)?.type || "unknown"}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Editor;
