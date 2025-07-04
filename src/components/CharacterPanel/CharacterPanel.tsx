// src/components/CharacterPanel/CharacterPanel.tsx
import React, { useState, useMemo } from "react";
import { Search, Pin, PinOff, User } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { Character } from "../../type";

interface CharacterPanelProps {}

const CharacterPanel: React.FC<CharacterPanelProps> = () => {
  const { characters } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dialogueInputs, setDialogueInputs] = useState<Record<string, string>>(
    {}
  );
  const [pinnedCharacters, setPinnedCharacters] = useState<Set<string>>(
    new Set()
  );

  // Filter characters based on search and pinned status
  const filteredCharacters = useMemo(() => {
    let filtered = characters.filter(
      (char) =>
        char.active &&
        char.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Show pinned characters first
    return filtered.sort((a, b) => {
      const aPinned = pinnedCharacters.has(a.id);
      const bPinned = pinnedCharacters.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [characters, searchQuery, pinnedCharacters]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleDialogueInputChange = (characterId: string, value: string) => {
    setDialogueInputs((prev) => ({
      ...prev,
      [characterId]: value,
    }));
  };

  const handleAddDialogue = (character: Character) => {
    const dialogue = dialogueInputs[character.id]?.trim();
    if (!dialogue) return;

    // Send custom event to editor for cursor insertion
    const event = new CustomEvent("insertDialogue", {
      detail: {
        characterName: character.name,
        dialogue: dialogue,
      },
    });
    window.dispatchEvent(event);

    // Clear the input
    setDialogueInputs((prev) => ({
      ...prev,
      [character.id]: "",
    }));
  };

  const handleKeyPress = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    character: Character
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAddDialogue(character);
    }
  };

  const handleTogglePin = (characterId: string) => {
    setPinnedCharacters((prev) => {
      const newPinned = new Set(prev);
      if (newPinned.has(characterId)) {
        newPinned.delete(characterId);
      } else {
        newPinned.add(characterId);
      }
      return newPinned;
    });
  };

  const handleQuickDialogue = (character: Character, text: string) => {
    const event = new CustomEvent("insertDialogue", {
      detail: {
        characterName: character.name,
        dialogue: text,
      },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="character-panel">
      <div className="panel-header">
        <h3>Characters</h3>
        <div className="character-count">
          {filteredCharacters.length} of {characters.length}
        </div>
      </div>

      {/* Search */}
      <div className="character-search">
        <Search className="search-icon" size={16} />
        <input
          type="text"
          placeholder="Search characters..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Character List */}
      <div className="character-list">
        {filteredCharacters.length === 0 ? (
          <div className="no-characters">
            <User size={48} color="#6e7681" />
            <p>No characters found</p>
            <small>
              Add characters from the sidebar to start inserting dialogue
            </small>
          </div>
        ) : (
          filteredCharacters.map((character) => (
            <div key={character.id} className="character-item">
              {/* Character Header */}
              <div className="character-header">
                <span className="character-name">{character.name}</span>
                <button
                  className={`pin-button ${
                    pinnedCharacters.has(character.id) ? "pinned" : ""
                  }`}
                  onClick={() => handleTogglePin(character.id)}
                  title={
                    pinnedCharacters.has(character.id) ? "Unpin" : "Pin to top"
                  }
                >
                  {pinnedCharacters.has(character.id) ? (
                    <Pin size={14} />
                  ) : (
                    <PinOff size={14} />
                  )}
                </button>
              </div>

              <p className="character-traits">{character.traits}</p>

              {/* Dialogue Input */}
              <div className="dialogue-input">
                <textarea
                  className="dialogue-text"
                  placeholder={`What does ${character.name} say?`}
                  value={dialogueInputs[character.id] || ""}
                  onChange={(e) =>
                    handleDialogueInputChange(character.id, e.target.value)
                  }
                  onKeyPress={(e) => handleKeyPress(e, character)}
                  rows={2}
                />
                <div className="dialogue-actions">
                  <button
                    className="dialogue-add-btn"
                    onClick={() => handleAddDialogue(character)}
                    disabled={!dialogueInputs[character.id]?.trim()}
                  >
                    Add Dialogue
                  </button>
                  <button
                    className="dialogue-quick-btn"
                    onClick={() => handleQuickDialogue(character, "...")}
                    title="Add pause"
                  >
                    ...
                  </button>
                  <button
                    className="dialogue-quick-btn"
                    onClick={() => handleQuickDialogue(character, "*thinks*")}
                    title="Add thought"
                  >
                    💭
                  </button>
                </div>
              </div>

              {/* Character Details (collapsible) */}
              <div className="character-details">
                <p className="character-bio">{character.bio}</p>
                {character.appearance && (
                  <p className="character-appearance">
                    <strong>Appearance:</strong> {character.appearance}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CharacterPanel;
