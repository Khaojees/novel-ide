import { useEffect, useState } from "react";
import { AutocompleteItem, CharacterContext } from "../../types/structured";

interface AutocompleteDropdownProps {
  position: { x: number; y: number };
  query: string;
  suggestions: AutocompleteItem[];
  onSelect: (item: AutocompleteItem, context?: CharacterContext) => void;
  onClose: () => void;
}

export const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({
  position,
  query,
  suggestions,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [suggestions, selectedIndex, onSelect, onClose]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className="autocomplete-dropdown"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.id}
          className={`autocomplete-item ${
            index === selectedIndex ? "selected" : ""
          }`}
          onClick={() => onSelect(suggestion)}
        >
          <span className="autocomplete-icon">
            {suggestion.type === "character" ? "👤" : "📍"}
          </span>
          <div className="autocomplete-content">
            <div className="autocomplete-name">{suggestion.name}</div>
            {suggestion.description && (
              <div className="autocomplete-description">
                {suggestion.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
