// ========================================
// CHARACTER ITEM COMPONENT
// ========================================

import { useState } from "react";
import { Character, CharacterUsage } from "../../types";
import { CharacterContext } from "../../types/structured";
import { BookOpen, Edit3, Eye, MessageCircle, Pin, PinOff } from "lucide-react";

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
  usage: CharacterUsage[];
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
  const [showDialogueInput, setShowDialogueInput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getCharacterIcon = () => {
    // You could customize this based on character traits or type
    if (character.color) {
      return "👤";
    }
    return "👤";
  };

  const getDisplayName = () => {
    return character.names?.dialogue || character.name;
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
          <span
            className="character-icon"
            style={{ color: character.color || "#10b981" }}
          >
            {getCharacterIcon()}
          </span>
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
        <button
          className="quick-dialogue-btn"
          onClick={() => onInsertDialogue("*nods*")}
          title="Add action"
        >
          *nods*
        </button>
      </div>

      {/* Usage Information */}
      {isExpanded && usage.length > 0 && (
        <div className="character-usage">
          <h5>Used in:</h5>
          <div className="usage-list">
            {usage.slice(0, 3).map((use, index) => (
              <div key={index} className="usage-item">
                <span className="usage-file">{use.title}</span>
                <span className="usage-type">{use.usageType}</span>
              </div>
            ))}
            {usage.length > 3 && (
              <div className="usage-more">+{usage.length - 3} more...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
