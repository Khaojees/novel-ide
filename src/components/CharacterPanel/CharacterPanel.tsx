// src/components/CharacterPanel/CharacterPanel.tsx - Updated for new editor
import React, { useState, useMemo } from "react";
import { Search, User, Plus } from "lucide-react";
import { Character } from "../../types";
import { useProjectStore } from "../../store/projectStore";
import { CharacterItem } from "./CharacterItem";

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
  const handleInsertCharacter = (
    characterId: string,
    nameType: "dialogue" | "narrative" | "reference"
  ) => {
    const event = new CustomEvent("insertCharacterRef", {
      detail: {
        characterId: characterId,
        nameType: nameType,
      },
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
              onInsertCharacter={handleInsertCharacter}
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

export default CharacterPanel;
