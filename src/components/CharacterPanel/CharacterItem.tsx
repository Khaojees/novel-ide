// src/components/CharacterPanel/CharacterItem.tsx - Simplified Version
import React, { useState } from "react";
import { Pin, PinOff, MessageCircle, BookOpen, Eye } from "lucide-react";
import { Character } from "../../types";
import { CharacterContext } from "../../types/structured";

interface CharacterItemProps {
  character: Character;
  isPinned: boolean;
  onTogglePin: () => void;
  onInsertDialogue: (text: string) => void;
  onInsertCharacter: (context: CharacterContext) => void;
  onView: () => void;
  dialogueInput: string;
  onDialogueInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  usage: any[];
}

export const CharacterItem: React.FC<CharacterItemProps> = ({
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDialogueInput, setShowDialogueInput] = useState(false);

  const getDisplayName = () => {
    return character.names?.dialogue || character.name;
  };

  const handleCharacterClick = () => {
    // คลิกที่ชื่อตัวละครเพื่อเปิด tab
    onView();
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
            <div className="character-meta">
              <span className="character-dialogue-name">
                {getDisplayName()}
              </span>
              {usage.length > 0 && (
                <span className="usage-count">{usage.length} mentions</span>
              )}
            </div>
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
      {character.bio && isExpanded && (
        <div className="character-bio">
          {character.bio.length > 150
            ? `${character.bio.substring(0, 150)}...`
            : character.bio}
        </div>
      )}

      {/* Character Traits */}
      {character.traits && isExpanded && (
        <div className="character-traits">
          <strong>Traits:</strong> {character.traits}
        </div>
      )}

      {/* Quick Insert Actions - Simplified */}
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
      </div>

      {/* Dialogue Input */}
      {showDialogueInput && (
        <div className="dialogue-input-container">
          <textarea
            value={dialogueInput}
            onChange={(e) => onDialogueInputChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder={`What does ${getDisplayName()} say?`}
            className="dialogue-input"
            rows={2}
            autoFocus
          />
          <div className="dialogue-actions">
            <button
              className="dialogue-add-btn"
              onClick={() => {
                if (dialogueInput.trim()) {
                  onInsertDialogue(dialogueInput.trim());
                  setShowDialogueInput(false);
                }
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

      {/* Usage Information */}
      {isExpanded && usage.length > 0 && (
        <div className="character-usage">
          <h5>Used in:</h5>
          <div className="usage-list">
            {usage.slice(0, 3).map((use, index) => (
              <div key={index} className="usage-item">
                <span className="usage-file">{use.title}</span>
                <span className="usage-mentions">{use.mentions} times</span>
              </div>
            ))}
            {usage.length > 3 && (
              <div className="usage-more">
                +{usage.length - 3} more files...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
