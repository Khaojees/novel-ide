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
      case "fullname":
        return character.names.fullname;
      case "nickname":
        return character.names?.nickname || character.names.fullname;
      case "reference":
        return character.names?.reference || character.names.fullname;
      default:
        return character.names.fullname;
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
      title={character?.bio || character?.names.fullname || "Unknown character"}
    >
      👤 {getDisplayName()}
    </span>
  );
};
