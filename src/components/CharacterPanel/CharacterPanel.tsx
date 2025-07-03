import React, { useState, useMemo } from "react";
import { Search, User, Plus, Pin, PinOff } from "lucide-react";
import { Character } from "../../type";
import { useProjectStore } from "../../store/projectStore";
interface CharacterPanelProps {}

const CharacterPanel: React.FC<CharacterPanelProps> = () => {
  const { characters, addCharacter, insertDialogue } = useProjectStore();
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

    insertDialogue(character.name, dialogue);

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

  const handleAddCharacter = () => {
    const name = prompt("Character name:");
    if (name?.trim()) {
      const traits = prompt("Character traits:") || "Add traits here...";
      const bio = prompt("Character bio:") || "Add biography here...";

      addCharacter({
        name: name.trim(),
        traits,
        bio,
        active: true,
      });
    }
  };

  return (
    <div className="character-panel">
      <div className="panel-header">
        <h3>Characters</h3>
        <button
          className="add-character-btn"
          onClick={handleAddCharacter}
          title="Add Character"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="search-container">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="character-search"
          placeholder="Search characters..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Character List */}
      <div className="character-list">
        {filteredCharacters.length === 0 ? (
          <div className="empty-state">
            <User size={32} />
            <p>No characters found</p>
          </div>
        ) : (
          filteredCharacters.map((character) => (
            <div key={character.id} className="character-card">
              <div className="character-header">
                <div className="character-info">
                  <h4 className="character-name">{character.name}</h4>
                  <button
                    className={`pin-button ${
                      pinnedCharacters.has(character.id) ? "pinned" : ""
                    }`}
                    onClick={() => handleTogglePin(character.id)}
                    title={
                      pinnedCharacters.has(character.id)
                        ? "Unpin"
                        : "Pin to top"
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
              </div>

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
                <button
                  className="dialogue-add-btn"
                  onClick={() => handleAddDialogue(character)}
                  disabled={!dialogueInputs[character.id]?.trim()}
                >
                  Add Dialogue
                </button>
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

      {/* Quick Actions */}
      <div className="panel-footer">
        <button className="quick-action-btn" onClick={handleAddCharacter}>
          <Plus size={16} />
          New Character
        </button>
      </div>
    </div>
  );
};

export default CharacterPanel;
