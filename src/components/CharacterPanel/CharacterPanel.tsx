// src/components/CharacterPanel/CharacterPanel.tsx - Complete Fixed Version
import React, { useState, useMemo } from "react";
import { Search, User, Plus } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { CharacterContext } from "../../types/structured";
import { Character } from "../../types";
import { CharacterItem } from "./CharacterItem";

interface CharacterPanelProps {}

const CharacterPanel: React.FC<CharacterPanelProps> = () => {
  const { characters, getCharacterUsage, openCharacterTab, addCharacter } =
    useProjectStore();

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
      return a.name.localeCompare(b.name);
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

    // Send custom event to structured editor for dialogue insertion
    const event = new CustomEvent("insertDialogue", {
      detail: {
        characterId: character.id,
        text: dialogue,
        context: "dialogue" as CharacterContext,
      },
    });
    window.dispatchEvent(event);

    // Clear the input
    setDialogueInputs((prev) => ({
      ...prev,
      [character.id]: "",
    }));
  };

  const handleInsertCharacter = (
    character: Character,
    context: CharacterContext
  ) => {
    // Send custom event to structured editor for character insertion
    const event = new CustomEvent("insertCharacterTag", {
      detail: {
        characterId: character.id,
        context: context,
      },
    });
    window.dispatchEvent(event);
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
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  };

  const handleOpenCharacter = (character: Character) => {
    // Use openCharacterTab with Character object
    if (openCharacterTab) {
      openCharacterTab(character);
    }
  };

  const handleAddCharacter = async () => {
    // Simple add character - you might want to make this more sophisticated
    const name = prompt("Character name:");
    if (!name?.trim()) return;

    try {
      if (addCharacter) {
        await addCharacter({
          name: name.trim(),
          traits: "",
          bio: "",
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
        <div className="header-title">
          <User size={18} />
          <span>Characters</span>
        </div>
        <div className="header-actions">
          <span className="character-count">{characters.length}</span>
          <button
            className="add-btn"
            onClick={handleAddCharacter}
            title="Add new character"
          >
            <Plus size={16} />
          </button>
        </div>
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

      {/* Characters List */}
      <div className="characters-list">
        {filteredCharacters.length === 0 ? (
          <div className="empty-state">
            <User size={48} className="empty-icon" />
            <p>No characters found</p>
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredCharacters.map((character) => (
            <CharacterItem
              key={character.id}
              character={character}
              isPinned={pinnedCharacters.has(character.id)}
              onTogglePin={() => handleTogglePin(character.id)}
              onInsertDialogue={(text) => {
                // Update the dialogue input and trigger add
                setDialogueInputs((prev) => ({
                  ...prev,
                  [character.id]: text,
                }));
                handleAddDialogue(character);
              }}
              onInsertCharacter={(context) =>
                handleInsertCharacter(character, context)
              }
              onView={() => handleOpenCharacter(character)}
              dialogueInput={dialogueInputs[character.id] || ""}
              onDialogueInputChange={(value) =>
                handleDialogueInputChange(character.id, value)
              }
              onKeyPress={(e) => handleKeyPress(e, character)}
              usage={getCharacterUsage ? getCharacterUsage(character.id) : []}
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
