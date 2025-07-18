// src/components/CharacterPanel/CharacterPanel.tsx - Updated for new editor
import React, { useState, useMemo } from "react";
import { Search, Pin, PinOff, User, Plus } from "lucide-react";
import { Character } from "../../types";
import { useProjectStore } from "../../store/projectStore";

interface CharacterPanelProps {}

const CharacterPanel: React.FC<CharacterPanelProps> = () => {
  const { characters, addCharacter, openCharacterTab } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pinnedCharacters, setPinnedCharacters] = useState<Set<string>>(
    new Set()
  );

  // Filter characters based on search
  const filteredCharacters = useMemo(() => {
    if (!characters) return [];

    let filtered = characters.filter(
      (character) =>
        character.active &&
        character.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Show pinned characters first
    return filtered.sort((a, b) => {
      const aPinned = pinnedCharacters.has(a.id);
      const bPinned = pinnedCharacters.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [characters, searchQuery, pinnedCharacters]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTogglePin = (characterId: string) => {
    setPinnedCharacters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  };

  // ฟังก์ชันใหม่สำหรับส่ง character ref ไป editor
  const handleInsertCharacter = (character: Character) => {
    const event = new CustomEvent("insertCharacterRef", {
      detail: { characterId: character.id },
    });
    window.dispatchEvent(event);
  };

  const handleOpenCharacter = (character: Character) => {
    if (openCharacterTab) {
      openCharacterTab(character);
    }
  };

  const handleQuickAdd = async () => {
    const name = prompt("Character name:");
    if (!name?.trim()) return;

    try {
      if (addCharacter) {
        await addCharacter({
          name: name.trim(),
          traits: "",
          bio: "",
          appearance: "",
          active: true,
        });
      }
    } catch (error) {
      console.error("Failed to add character:", error);
      alert("Failed to add character. Please try again.");
    }
  };

  return (
    <div className="character-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <User size={20} />
          <h3>Characters</h3>
        </div>
        <button
          className="add-btn"
          onClick={handleQuickAdd}
          title="Quick add character"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="search-container">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search characters..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {/* Character List */}
      <div className="character-list">
        {filteredCharacters.length === 0 ? (
          <div className="empty-state">
            <p>No characters found</p>
          </div>
        ) : (
          filteredCharacters.map((character) => (
            <CharacterItem
              key={character.id}
              character={character}
              isPinned={pinnedCharacters.has(character.id)}
              onTogglePin={() => handleTogglePin(character.id)}
              onInsert={() => handleInsertCharacter(character)}
              onView={() => handleOpenCharacter(character)}
            />
          ))
        )}
      </div>

      {/* Panel Footer */}
      <div className="panel-footer">
        <div className="quick-stats">
          <span>{filteredCharacters.length} active</span>
          <span>•</span>
          <span>{pinnedCharacters.size} pinned</span>
        </div>
      </div>
    </div>
  );
};

// ========================================
// CHARACTER ITEM COMPONENT
// ========================================

interface CharacterItemProps {
  character: Character;
  isPinned: boolean;
  onTogglePin: () => void;
  onInsert: () => void;
  onView: () => void;
}

const CharacterItem: React.FC<CharacterItemProps> = ({
  character,
  isPinned,
  onTogglePin,
  onInsert,
  onView,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCharacterClick = () => {
    // คลิกที่ชื่อตัวละครเพื่อเปิด tab
    onView();
  };

  const handleInsertClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInsert();
  };

  return (
    <div
      className={`character-item ${isPinned ? "pinned" : ""} ${
        isExpanded ? "expanded" : ""
      }`}
    >
      <div className="character-header">
        <div
          className="character-info"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="character-avatar">
            {character.name.charAt(0).toUpperCase()}
          </div>
          <div className="character-details">
            <h4
              className="character-name"
              onClick={(e) => {
                e.stopPropagation();
                handleCharacterClick();
              }}
              style={{ cursor: "pointer" }}
            >
              {character.name}
            </h4>
            {character.traits && (
              <p className="character-traits">{character.traits}</p>
            )}
          </div>
        </div>

        <div className="character-actions">
          <button
            className={`pin-btn ${isPinned ? "pinned" : ""}`}
            onClick={onTogglePin}
            title={isPinned ? "Unpin character" : "Pin character"}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
        </div>
      </div>

      {/* Insert Button - แยกออกมาให้เห็นชัด */}
      <div className="character-insert">
        <button
          className="insert-btn"
          onClick={handleInsertClick}
          title={`Insert ${character.name} reference`}
        >
          <span className="insert-icon">@</span>
          Insert {character.name}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="character-expanded">
          {character.bio && (
            <div className="character-bio">
              <strong>Bio:</strong>
              <p>{character.bio}</p>
            </div>
          )}
          {character.appearance && (
            <div className="character-appearance">
              <strong>Appearance:</strong>
              <p>{character.appearance}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterPanel;
