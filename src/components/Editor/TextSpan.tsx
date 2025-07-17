import { useState } from "react";
import { TextNode } from "../../types/structured";

interface TextSpanProps {
  node: TextNode;
  isActive: boolean;
  onClick: () => void;
  onTextChange: (newText: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

export const TextSpan: React.FC<TextSpanProps> = ({
  node,
  isActive,
  onClick,
  onTextChange,
  onKeyDown,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.content);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditText(node.content);
  };

  const handleSubmit = () => {
    onTextChange(editText);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(node.content);
    } else {
      onKeyDown(e);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        className="text-input"
        autoFocus
      />
    );
  }

  return (
    <span
      className={`text-span ${isActive ? "active" : ""}`}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
    >
      {node.content}
    </span>
  );
};
