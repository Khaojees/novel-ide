import React, { useState } from "react";
import { Plus, Users, BookOpen, Lightbulb, FileText } from "lucide-react";

interface SidebarProps {}

interface SidebarItem {
  id: string;
  name: string;
  type: "character" | "chapter" | "idea";
  active?: boolean;
}

const Sidebar: React.FC<SidebarProps> = () => {
  // Mock data - will be replaced with real data from store
  const [characters] = useState<SidebarItem[]>([
    { id: "1", name: "Alex", type: "character" },
    { id: "2", name: "Sarah", type: "character" },
    { id: "3", name: "Marcus", type: "character" },
  ]);

  const [chapters] = useState<SidebarItem[]>([
    {
      id: "1",
      name: "Chapter 1 - The Beginning",
      type: "chapter",
      active: true,
    },
    { id: "2", name: "Chapter 2 - Discovery", type: "chapter" },
    { id: "3", name: "Chapter 3 - Conflict", type: "chapter" },
  ]);

  const [ideas] = useState<SidebarItem[]>([
    { id: "1", name: "Plot Ideas", type: "idea" },
    { id: "2", name: "World Setting", type: "idea" },
    { id: "3", name: "Character Backstories", type: "idea" },
  ]);

  const handleItemClick = (item: SidebarItem) => {
    console.log("Opening:", item.name);
    // Will integrate with store later
  };

  const handleAddCharacter = () => {
    console.log("Add new character");
    // Will open character creation modal
  };

  const handleAddChapter = () => {
    console.log("Add new chapter");
    // Will create new chapter file
  };

  const handleAddIdea = () => {
    console.log("Add new idea");
    // Will create new idea file
  };

  const renderSection = (
    title: string,
    items: SidebarItem[],
    icon: React.ReactNode,
    onAdd: () => void
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
          <Plus size={16} />
        </button>
      </div>

      <div className="section-items">
        {items.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${item.active ? "active" : ""}`}
            onClick={() => handleItemClick(item)}
          >
            <span className="item-name">{item.name}</span>
          </div>
        ))}

        <button className="add-button" onClick={onAdd}>
          <Plus size={14} />
          <span>Add {title.slice(0, -1)}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Project Explorer</h2>
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
        handleAddChapter
      )}

      {renderSection("Ideas", ideas, <Lightbulb size={16} />, handleAddIdea)}
    </div>
  );
};

export default Sidebar;
