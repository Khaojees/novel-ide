import { Character } from "../../types";
import { CharacterNode } from "../../types/structured";

interface CharacterTagProps {
  node: CharacterNode;
  character?: Character;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
}

export const CharacterTag: React.FC<CharacterTagProps> = ({
  node,
  character,
  isActive,
  onClick,
  onEdit,
}) => {
  const getDisplayName = () => {
    if (!character) return "[Unknown Character]";

    switch (node.context) {
      case "dialogue":
        return character.names?.dialogue || character.name;
      case "narrative":
        return character.names?.narrative || character.name;
      case "reference":
        return character.names?.reference || character.name;
      default:
        return character.name;
    }
  };

  const getTagClass = () => {
    let className = "character-tag";
    if (isActive) className += " active";
    if (!character) className += " error";
    className += ` ${node.context}`;
    return className;
  };

  return (
    <span
      className={getTagClass()}
      onClick={onClick}
      onDoubleClick={onEdit}
      title={character?.bio || character?.name || "Unknown character"}
    >
      👤 {getDisplayName()}
    </span>
  );
};
