// ========================================
// CHARACTER ITEM COMPONENT - Updated with 3 Insert Buttons
// ========================================

import { useState } from "react";
import { Character } from "../../types";
import { Pin, PinOff, MessageCircle, BookOpen, Eye } from "lucide-react";

interface CharacterItemProps {
  character: Character;
  isPinned: boolean;
  onTogglePin: () => void;
  onInsertCharacter: (
    characterId: string,
    nameType: "dialogue" | "narrative" | "reference"
  ) => void;
  onView: () => void;
}

export const CharacterItem: React.FC<CharacterItemProps> = ({
  character,
  isPinned,
  onTogglePin,
  onInsertCharacter,
  onView,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCharacterClick = () => {
    // คลิกที่ชื่อตัวละครเพื่อเปิด tab
    onView();
  };

  // Helper function to get name for each type
  const getNameByType = (type: "fullname" | "nickname" | "reference") => {
    switch (type) {
      case "fullname":
        return character.names?.fullname;
      case "nickname":
        return character.names?.nickname || character.names?.fullname;
      case "reference":
        return character.names?.reference || character.names?.fullname;
      default:
        return character.names?.fullname;
    }
  };

  const handleInsertDialogue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInsertCharacter(character.id, "dialogue");
  };

  const handleInsertNarrative = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInsertCharacter(character.id, "narrative");
  };

  const handleInsertReference = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInsertCharacter(character.id, "reference");
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
            {character.names.fullname.charAt(0).toUpperCase()}
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
              {character.names.fullname}
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

      {/* Multiple Insert Buttons */}
      <div className="character-insert-buttons">
        <button
          className="insert-btn dialogue"
          onClick={handleInsertDialogue}
          title={`Insert fullname: ${getNameByType("fullname")}`}
        >
          <MessageCircle size={12} />
          <span className="insert-label">{getNameByType("fullname")}</span>
        </button>

        <button
          className="insert-btn narrative"
          onClick={handleInsertNarrative}
          title={`Insert nickname: ${getNameByType("nickname")}`}
        >
          <BookOpen size={12} />
          <span className="insert-label">{getNameByType("nickname")}</span>
        </button>

        <button
          className="insert-btn reference"
          onClick={handleInsertReference}
          title={`Insert reference name: ${getNameByType("reference")}`}
        >
          <Eye size={12} />
          <span className="insert-label">{getNameByType("reference")}</span>
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
