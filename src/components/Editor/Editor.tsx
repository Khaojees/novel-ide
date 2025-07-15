// src/components/Editor/Editor.tsx - Updated for Structured Content
import React, { useState, useEffect, useCallback } from "react";
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

  const confirm = useConfirm();

  // Get current active tab data
  const currentChapter = chapters.find((chapter) => chapter.id === activeTab);
  const currentCharacter = characters.find((char) => char.id === activeTab);
  const currentLocation = locations.find((loc) => loc.id === activeTab);

  // Handle tab close
  const handleCloseTab = useCallback(
    async (tabId: string) => {
      const isModified = contentModified[tabId];

      if (isModified) {
        const isConfirmed = await confirm({
          title: "Alert",
          message:
            "You have unsaved changes. Are you sure you want to close this tab?",
        });

        if (isConfirmed) {
          closeTab(tabId);
          setContentModified((prev) => {
            const newState = { ...prev };
            delete newState[tabId];
            return newState;
          });
        }
      } else {
        closeTab(tabId);
      }
    },
    [closeTab, contentModified]
  );

  // Handle content change for chapters
  const handleChapterContentChange = useCallback(
    (nodes: ContentNode[]) => {
      if (!currentChapter) return;

      setContentModified((prev) => ({
        ...prev,
        [currentChapter.id]: true,
      }));
    },
    [currentChapter]
  );

  // Handle save for chapters
  const handleSaveChapter = useCallback(async () => {
    if (!currentChapter) return;

    try {
      // The content is already updated in the chapter state through handleChapterContentChange
      // We just need to trigger the save
      await updateChapterContent(currentChapter.id, currentChapter.content);

      setContentModified((prev) => ({
        ...prev,
        [currentChapter.id]: false,
      }));
    } catch (error) {
      console.error("Failed to save chapter:", error);
      alert("Failed to save chapter. Please try again.");
    }
  }, [currentChapter, updateChapterContent]);

  // Handle save for characters
  const handleSaveCharacter = useCallback(
    async (character: Character) => {
      try {
        await updateCharacter(character.id, character);

        setContentModified((prev) => ({
          ...prev,
          [character.id]: false,
        }));
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
      try {
        await updateLocation(location.id, location);

        setContentModified((prev) => ({
          ...prev,
          [location.id]: false,
        }));
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
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    currentChapter,
    currentCharacter,
    currentLocation,
    handleSaveChapter,
    handleSaveCharacter,
    handleSaveLocation,
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

  // Get tab color
  const getTabColor = (tab: Tab): string => {
    switch (tab.type) {
      case "character":
        return "#10b981";
      case "chapter":
        return "#3b82f6";
      case "idea":
        return "#f59e0b";
      case "location":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  if (openTabs.length === 0) {
    return (
      <div className="editor-empty">
        <div className="empty-state">
          <BookOpen size={64} className="empty-icon" />
          <h2>No files open</h2>
          <p>
            Select a chapter, character, or location from the sidebar to start
            editing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor">
      {/* Tab Bar */}
      <div className="tab-bar">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => {
              const { setActiveTab } = useProjectStore.getState();
              setActiveTab(tab.id);
            }}
            style={{
              borderTopColor:
                activeTab === tab.id ? getTabColor(tab) : "transparent",
            }}
          >
            <div className="tab-content">
              <div className="tab-icon" style={{ color: getTabColor(tab) }}>
                {getTabIcon(tab)}
              </div>
              <span className="tab-title">{tab.title}</span>
              {contentModified[tab.id] && (
                <span className="modified-indicator">●</span>
              )}
            </div>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseTab(tab.id);
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Editor Content */}
      <div className="editor-content">
        {currentChapter && (
          <StructuredEditor
            key={currentChapter.id}
            chapter={currentChapter}
            characters={characters}
            locations={locations}
            onContentChange={handleChapterContentChange}
            onSave={handleSaveChapter}
            isModified={contentModified[currentChapter.id] || false}
          />
        )}

        {currentCharacter && (
          <CharacterEditor
            key={currentCharacter.id}
            character={currentCharacter}
            onSave={handleSaveCharacter}
            onCancel={() => closeTab(currentCharacter.id)}
            onDelete={async (characterId: string) => {
              const success = await deleteCharacter(characterId);
              if (success) {
                closeTab(characterId);
              }
              return success;
            }}
            getCharacterUsage={getCharacterUsage}
            isModified={contentModified[currentCharacter.id] || false}
            onContentChange={() => {
              setContentModified((prev) => ({
                ...prev,
                [currentCharacter.id]: true,
              }));
            }}
          />
        )}

        {currentLocation && (
          <LocationEditor
            key={currentLocation.id}
            location={currentLocation}
            onSave={handleSaveLocation}
            onCancel={() => closeTab(currentLocation.id)}
            onDelete={async (locationId: string) => {
              const success = await deleteLocation(locationId);
              if (success) {
                closeTab(locationId);
              }
              return success;
            }}
            getLocationUsage={getLocationUsage}
            isModified={contentModified[currentLocation.id] || false}
            onContentChange={() => {
              setContentModified((prev) => ({
                ...prev,
                [currentLocation.id]: true,
              }));
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Editor;
