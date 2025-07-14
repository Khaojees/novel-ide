// src/components/Sidebar/Sidebar.tsx
import React, { useState } from "react";
import { Plus, Users, BookOpen, Lightbulb } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { Character, Chapter, Idea } from "../../type";
import { CharacterModal } from "./components/CharacterModal";
import { ChapterModal } from "./components/ChapterModal";
import { IdeaModal } from "./components/IdeaModal";

const Sidebar: React.FC = () => {
  const {
    characters,
    chapters,
    ideas,
    openTab,
    addCharacter,
    addChapter,
    addIdea,
    projectPath,
  } = useProjectStore();

  // Modal states
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);

  const handleItemClick = (item: Chapter | Idea) => {
    console.log("Opening:", item);
    openTab(item);
  };

  const handleAddCharacter = () => {
    setShowCharacterModal(true);
  };

  const handleAddChapter = () => {
    setShowChapterModal(true);
  };

  const handleAddIdea = () => {
    setShowIdeaModal(true);
  };

  const renderSection = (
    title: string,
    items: (Chapter | Idea | Character)[],
    icon: React.ReactNode,
    onAdd: () => void,
    onItemClick?: (item: Chapter | Idea) => void
  ) => (
    <div className="sidebar-section">
      <div className="section-header">
        <div className="section-title">
          {icon}
          <h3>{title}</h3>
        </div>
        <button
          className="add-icon-btn"
          onClick={onAdd}
          title={`Add ${title.slice(0, -1)}`}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="section-items">
        {items.map((item) => (
          <div
            key={item.id}
            className="sidebar-item"
            onClick={() => onItemClick && onItemClick(item as Chapter | Idea)}
          >
            <span className="item-name">
              {"title" in item
                ? item.title
                : "name" in item
                ? item.name
                : item.filename}
            </span>
          </div>
        ))}

        <button className="add-button" onClick={onAdd}>
          <Plus size={14} />
          <span>Add {title.slice(0, -1)}</span>
        </button>
      </div>
    </div>
  );

  // Show loading state if no project is loaded
  if (!projectPath) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Project Explorer</h2>
        </div>
        <div className="sidebar-placeholder">
          <p>No project loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Project Explorer</h2>
        <div className="project-info">
          <span className="project-path">{projectPath.split("/").pop()}</span>
        </div>
      </div>

      {renderSection(
        "Characters",
        characters,
        <Users size={16} />,
        handleAddCharacter
      )}

      {renderSection(
        "Chapters",
        chapters,
        <BookOpen size={16} />,
        handleAddChapter,
        handleItemClick
      )}

      {renderSection(
        "Ideas",
        ideas,
        <Lightbulb size={16} />,
        handleAddIdea,
        handleItemClick
      )}

      {/* Character Modal */}
      {showCharacterModal && (
        <CharacterModal
          onClose={() => setShowCharacterModal(false)}
          onSave={async (characterData) => {
            try {
              await addCharacter(characterData);
              setShowCharacterModal(false);
            } catch (error) {
              console.error("Failed to add character:", error);
              alert("Failed to add character. Please try again.");
            }
          }}
        />
      )}

      {/* Chapter Modal */}
      {showChapterModal && (
        <ChapterModal
          onClose={() => setShowChapterModal(false)}
          onSave={async (title) => {
            try {
              await addChapter(title);
              setShowChapterModal(false);
            } catch (error) {
              console.error("Failed to add chapter:", error);
              alert("Failed to add chapter. Please try again.");
            }
          }}
        />
      )}

      {/* Idea Modal */}
      {showIdeaModal && (
        <IdeaModal
          onClose={() => setShowIdeaModal(false)}
          onSave={async (name) => {
            try {
              await addIdea(name);
              setShowIdeaModal(false);
            } catch (error) {
              console.error("Failed to add idea:", error);
              alert("Failed to add idea. Please try again.");
            }
          }}
        />
      )}
    </div>
  );
};

export default Sidebar;
