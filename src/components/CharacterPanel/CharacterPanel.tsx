// src/components/CharacterPanel/CharacterPanel.tsx - Updated for Structured Editor
import React, { useState, useMemo } from "react";
import {
  Search,
  Pin,
  PinOff,
  User,
  Plus,
  Edit3,
  Eye,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { CharacterContext } from "../../types/structured";
import { Character } from "../../types";

interface CharacterPanelProps {}

const CharacterPanel: React.FC<CharacterPanelProps> = () => {
  const { characters, getCharacterUsage, openCharacterTab } = useProjectStore();

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

  return (
    <div className="character-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-title">
          <User size={18} />
          <span>Characters</span>
        </div>
        <button
          className="add-btn"
          onClick={() => {
            /* TODO: Open character creation form */
          }}
          title="Add new character"
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

      {/* Characters List */}
      <div className="characters-list">
        {filteredCharacters.length === 0 ? (
          <div className="empty-state">
            <User size={48} className="empty-icon" />
            <p>No characters found</p>
          </div>
        ) : (
          filteredCharacters.map((character) => (
            <CharacterItem
              key={character.id}
              character={character}
              isPinned={pinnedCharacters.has(character.id)}
              onTogglePin={() => handleTogglePin(character.id)}
              onInsertDialogue={(text) => handleAddDialogue(character)}
              onInsertCharacter={(context) =>
                handleInsertCharacter(character, context)
              }
              onView={() => openCharacterTab(character.id)}
              dialogueInput={dialogueInputs[character.id] || ""}
              onDialogueInputChange={(value) =>
                handleDialogueInputChange(character.id, value)
              }
              onKeyPress={(e) => handleKeyPress(e, character)}
              usage={getCharacterUsage(character.id)}
            />
          ))
        )}
      </div>

      {/* Panel Footer */}
      <div className="panel-footer">
        <div className="quick-stats">
          <span>{filteredCharacters.length} characters</span>
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
  onInsertDialogue: (text: string) => void;
  onInsertCharacter: (context: CharacterContext) => void;
  onView: () => void;
  dialogueInput: string;
  onDialogueInputChange: (value: string) => void;
  onKeyPress: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  usage: any[];
}

const CharacterItem: React.FC<CharacterItemProps> = ({
  character,
  isPinned,
  onTogglePin,
  onInsertDialogue,
  onInsertCharacter,
  onView,
  dialogueInput,
  onDialogueInputChange,
  onKeyPress,
  usage,
}) => {
  const [showDialogueInput, setShowDialogueInput] = useState(false);

  const getCharacterIcon = () => {
    // You could customize this based on character traits or type
    return "👤";
  };

  return (
    <div className="character-item">
      <div className="character-header">
        <div className="character-info">
          <span className="character-icon">{getCharacterIcon()}</span>
          <div className="character-details">
            <h4 className="character-name">{character.name}</h4>
            {character.names?.dialogue &&
              character.names.dialogue !== character.name && (
                <span className="character-dialogue-name">
                  "{character.names.dialogue}"
                </span>
              )}
            {usage.length > 0 && (
              <span className="usage-count">{usage.length} mentions</span>
            )}
          </div>
        </div>

        <div className="character-actions">
          <button
            className={`pin-btn ${isPinned ? "pinned" : ""}`}
            onClick={onTogglePin}
            title={isPinned ? "Unpin character" : "Pin character"}
          >
            {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
        </div>
      </div>

      {/* Character Bio Preview */}
      {character.bio && (
        <div className="character-bio">
          {character.bio.substring(0, 100)}
          {character.bio.length > 100 && "..."}
        </div>
      )}

      {/* Quick Insert Actions */}
      <div className="character-quick-actions">
        <button
          className="quick-action-btn dialogue-btn"
          onClick={() => setShowDialogueInput(!showDialogueInput)}
          title="Add dialogue"
        >
          <MessageCircle size={14} />
          Dialogue
        </button>

        <button
          className="quick-action-btn narrative-btn"
          onClick={() => onInsertCharacter("narrative")}
          title="Insert in narrative"
        >
          <BookOpen size={14} />
          Narrative
        </button>

        <button
          className="quick-action-btn reference-btn"
          onClick={() => onInsertCharacter("reference")}
          title="Insert as reference"
        >
          <Eye size={14} />
          Reference
        </button>

        <button
          className="quick-action-btn view-btn"
          onClick={onView}
          title="View character details"
        >
          <Edit3 size={14} />
          Edit
        </button>
      </div>

      {/* Dialogue Input */}
      {showDialogueInput && (
        <div className="dialogue-input-container">
          <textarea
            value={dialogueInput}
            onChange={(e) => onDialogueInputChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder={`What does ${character.name} say?`}
            className="dialogue-input"
            rows={2}
            autoFocus
          />
          <div className="dialogue-actions">
            <button
              className="dialogue-add-btn"
              onClick={() => {
                onInsertDialogue(dialogueInput);
                setShowDialogueInput(false);
              }}
              disabled={!dialogueInput.trim()}
            >
              Add
            </button>
            <button
              className="dialogue-cancel-btn"
              onClick={() => setShowDialogueInput(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Dialogue Buttons */}
      <div className="quick-dialogue-buttons">
        <button
          className="quick-dialogue-btn"
          onClick={() => onInsertDialogue("...")}
          title="Add pause"
        >
          ...
        </button>
        <button
          className="quick-dialogue-btn"
          onClick={() => onInsertDialogue("💭")}
          title="Add thought"
        >
          💭
        </button>
        <button
          className="quick-dialogue-btn"
          onClick={() => onInsertDialogue("*sigh*")}
          title="Add sigh"
        >
          *sigh*
        </button>
      </div>
    </div>
  );
};

export default CharacterPanel;
