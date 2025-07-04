// src/components/Sidebar/Sidebar.tsx
import React from "react";
import { Plus, Users, BookOpen, Lightbulb } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { Character, Chapter, Idea } from "../../type";

const Sidebar: React.FC = () => {
  const { characters, chapters, ideas, openTab, addCharacter, projectPath } =
    useProjectStore();

  const handleItemClick = (item: Chapter | Idea) => {
    console.log("Opening:", item);
    openTab(item);
  };

  const handleAddCharacter = () => {
    // Simple prompt for now - later we'll make a proper modal
    const name = prompt("Enter character name:");
    const traits = prompt("Enter character traits:");
    const bio = prompt("Enter character bio:");

    if (name && traits && bio) {
      addCharacter({
        name,
        traits,
        bio,
        appearance: "",
        active: true,
      }).catch((error) => {
        console.error("Failed to add character:", error);
        alert("Failed to add character. Please try again.");
      });
    }
  };

  const handleAddChapter = () => {
    console.log("Add new chapter");
    // TODO: Implement chapter creation
    alert("Chapter creation not yet implemented. Coming soon!");
  };

  const handleAddIdea = () => {
    console.log("Add new idea");
    // TODO: Implement idea creation
    alert("Idea creation not yet implemented. Coming soon!");
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
    </div>
  );
};

export default Sidebar;
