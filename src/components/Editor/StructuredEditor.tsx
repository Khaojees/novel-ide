// src/components/Editor/StructuredEditor.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ContentNode,
  CharacterNode,
  LocationNode,
  TextNode,
  StructuredChapter,
  CharacterContext,
  AutocompleteItem,
  Location,
} from "../../types/structured";
import {
  createTextNode,
  createCharacterNode,
  createLocationNode,
  insertNodeAt,
  updateNode,
  renderNodesToText,
} from "../../utils/contentUtils";
import { Character } from "../../types";

interface StructuredEditorProps {
  chapter: StructuredChapter;
  characters: Character[];
  locations: Location[];
  onContentChange: (nodes: ContentNode[]) => void;
  onSave: () => void;
  isModified: boolean;
}

const StructuredEditor: React.FC<StructuredEditorProps> = ({
  chapter,
  characters,
  locations,
  onContentChange,
  onSave,
  isModified,
}) => {
  const [nodes, setNodes] = useState<ContentNode[]>(chapter.content);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState<string>("");
  const [autocompletePosition, setAutocompletePosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const editorRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Update nodes when chapter changes
  useEffect(() => {
    setNodes(chapter.content);
  }, [chapter.content]);

  // Notify parent of changes
  useEffect(() => {
    onContentChange(nodes);
  }, [nodes, onContentChange]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        onSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSave]);

  // Insert character tag at cursor position
  const insertCharacterTag = useCallback(
    (characterId: string, context: CharacterContext) => {
      const newNode = createCharacterNode(characterId, context);
      const newNodes = insertNodeAt(nodes, cursorPosition, newNode);
      setNodes(newNodes);
      setCursorPosition(cursorPosition + 1);
      setShowAutocomplete(false);
    },
    [nodes, cursorPosition]
  );

  // Insert location tag at cursor position
  const insertLocationTag = useCallback(
    (locationId: string) => {
      const newNode = createLocationNode(locationId);
      const newNodes = insertNodeAt(nodes, cursorPosition, newNode);
      setNodes(newNodes);
      setCursorPosition(cursorPosition + 1);
      setShowAutocomplete(false);
    },
    [nodes, cursorPosition]
  );

  // Insert text at cursor position
  const insertText = useCallback(
    (text: string) => {
      const newNode = createTextNode(text);
      const newNodes = insertNodeAt(nodes, cursorPosition, newNode);
      setNodes(newNodes);
      setCursorPosition(cursorPosition + 1);
    },
    [nodes, cursorPosition]
  );

  // Handle @ symbol for autocomplete
  const handleAtSymbol = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "@") {
      const rect = editorRef.current?.getBoundingClientRect();
      if (rect) {
        // Get cursor position relative to editor
        const selection = window.getSelection();
        let x = 0;
        let y = 0;

        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rangeRect = range.getBoundingClientRect();
          x = rangeRect.left - rect.left;
          y = rangeRect.top - rect.top + 20;
        } else {
          // Fallback to center of editor if no selection
          x = rect.width / 2;
          y = 100;
        }

        setAutocompletePosition({ x, y });
        setShowAutocomplete(true);
        setAutocompleteQuery("");
      }
    }
  }, []);

  // Handle text input in autocomplete
  const handleAutocompleteInput = useCallback((query: string) => {
    setAutocompleteQuery(query);
  }, []);

  // Get autocomplete suggestions
  const getAutocompleteSuggestions = useCallback((): AutocompleteItem[] => {
    const suggestions: AutocompleteItem[] = [];

    // Add characters
    characters
      .filter(
        (char) =>
          char.active &&
          char.name.toLowerCase().includes(autocompleteQuery.toLowerCase())
      )
      .forEach((char) => {
        suggestions.push({
          id: char.id,
          name: char.name,
          type: "character",
          description: char.bio?.substring(0, 50) + "...",
        });
      });

    // Add locations
    locations
      .filter(
        (loc) =>
          loc.active &&
          loc.name.toLowerCase().includes(autocompleteQuery.toLowerCase())
      )
      .forEach((loc) => {
        suggestions.push({
          id: loc.id,
          name: loc.name,
          type: "location",
          description: loc.description?.substring(0, 50) + "...",
        });
      });

    return suggestions.slice(0, 10); // Limit to 10 suggestions
  }, [characters, locations, autocompleteQuery]);

  // Handle autocomplete selection
  const handleAutocompleteSelect = useCallback(
    (item: AutocompleteItem, context?: CharacterContext) => {
      if (item.type === "character") {
        insertCharacterTag(item.id, context || "narrative");
      } else if (item.type === "location") {
        insertLocationTag(item.id);
      }
    },
    [insertCharacterTag, insertLocationTag]
  );

  // Listen for events from CharacterPanel
  useEffect(() => {
    const handleInsertDialogue = (event: CustomEvent) => {
      const { characterId, text } = event.detail;

      // Insert character tag for dialogue
      insertCharacterTag(characterId, "dialogue");

      // Insert dialogue text
      if (text) {
        insertText(`"${text}"`);
      }
    };

    const handleInsertCharacterTag = (event: CustomEvent) => {
      const { characterId, context } = event.detail;
      insertCharacterTag(characterId, context);
    };

    window.addEventListener(
      "insertDialogue",
      handleInsertDialogue as EventListener
    );
    window.addEventListener(
      "insertCharacterTag",
      handleInsertCharacterTag as EventListener
    );

    return () => {
      window.removeEventListener(
        "insertDialogue",
        handleInsertDialogue as EventListener
      );
      window.removeEventListener(
        "insertCharacterTag",
        handleInsertCharacterTag as EventListener
      );
    };
  }, [insertCharacterTag, insertText]);

  // Render individual node
  const renderNode = (node: ContentNode, index: number) => {
    const isActive = index === cursorPosition;

    switch (node.type) {
      case "character":
        return (
          <CharacterTag
            key={node.id}
            node={node as CharacterNode}
            character={characters.find((c) => c.id === node.characterId)}
            isActive={isActive}
            onClick={() => setCursorPosition(index)}
            onEdit={() => openCharacterEditor(node.characterId)}
          />
        );

      case "location":
        return (
          <LocationTag
            key={node.id}
            node={node as LocationNode}
            location={locations.find((l) => l.id === node.locationId)}
            isActive={isActive}
            onClick={() => setCursorPosition(index)}
            onEdit={() => openLocationEditor(node.locationId)}
          />
        );

      case "text":
        return (
          <TextSpan
            key={node.id}
            node={node as TextNode}
            isActive={isActive}
            onClick={() => setCursorPosition(index)}
            onTextChange={(newText) => {
              const updatedNodes = updateNode(nodes, node.id, {
                content: newText,
              });
              setNodes(updatedNodes);
            }}
            onKeyDown={handleAtSymbol}
          />
        );

      case "linebreak":
        return <br key={node.id} />;

      default:
        return null;
    }
  };

  const openCharacterEditor = (characterId: string) => {
    // TODO: Implement character editor opening
    console.log("Open character editor for:", characterId);
  };

  const openLocationEditor = (locationId: string) => {
    // TODO: Implement location editor opening
    console.log("Open location editor for:", locationId);
  };

  return (
    <div className="structured-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left"></div>

        <div className="toolbar-right">
          <span className="word-count">
            {
              renderNodesToText(nodes, characters, locations).split(/\s+/)
                .length
            }{" "}
            words
          </span>
          <button
            className={`save-btn ${isModified ? "modified" : ""}`}
            onClick={onSave}
            disabled={!isModified}
          >
            💾 {isModified ? "Save" : "Saved"}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable={false}
        onKeyDown={handleAtSymbol}
        tabIndex={0}
      >
        {nodes.map((node, index) => renderNode(node, index))}

        {/* Cursor */}
        <span
          className="cursor"
          style={{
            display: showAutocomplete ? "none" : "inline-block",
          }}
        />
      </div>

      {/* Autocomplete Dropdown */}
      {showAutocomplete && (
        <AutocompleteDropdown
          ref={autocompleteRef}
          position={autocompletePosition}
          query={autocompleteQuery}
          suggestions={getAutocompleteSuggestions()}
          onSelect={handleAutocompleteSelect}
          onClose={() => setShowAutocomplete(false)}
          onQueryChange={handleAutocompleteInput}
        />
      )}
    </div>
  );
};

// ========================================
// CHARACTER TAG COMPONENT
// ========================================

interface CharacterTagProps {
  node: CharacterNode;
  character?: Character;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
}

const CharacterTag: React.FC<CharacterTagProps> = ({
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
    className += ` context-${node.context}`;
    if (isActive) className += " active";
    if (!character) className += " error";
    return className;
  };

  return (
    <span
      className={getTagClass()}
      onClick={onClick}
      onDoubleClick={onEdit}
      title={`${character?.name || "Unknown"} (${node.context})`}
      style={{
        backgroundColor: character?.color || "#3b82f6",
        color: "white",
      }}
    >
      {getDisplayName()}
      {node.context === "dialogue" && ":"}
      {node.emotion && <span className="emotion-indicator">😊</span>}
    </span>
  );
};

// ========================================
// LOCATION TAG COMPONENT
// ========================================

interface LocationTagProps {
  node: LocationNode;
  location?: Location;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
}

const LocationTag: React.FC<LocationTagProps> = ({
  node,
  location,
  isActive,
  onClick,
  onEdit,
}) => {
  const getDisplayName = () => {
    if (!location) return "[Unknown Location]";
    return location.names?.short || location.name;
  };

  const getTagClass = () => {
    let className = "location-tag";
    if (isActive) className += " active";
    if (!location) className += " error";
    return className;
  };

  return (
    <span
      className={getTagClass()}
      onClick={onClick}
      onDoubleClick={onEdit}
      title={location?.description || location?.name || "Unknown location"}
      style={{
        backgroundColor: location?.color || "#ef4444",
        color: "white",
      }}
    >
      📍 {getDisplayName()}
    </span>
  );
};

// ========================================
// TEXT SPAN COMPONENT
// ========================================

interface TextSpanProps {
  node: TextNode;
  isActive: boolean;
  onClick: () => void;
  onTextChange: (newText: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

const TextSpan: React.FC<TextSpanProps> = ({
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

// ========================================
// AUTOCOMPLETE DROPDOWN
// ========================================

interface AutocompleteDropdownProps {
  position: { x: number; y: number };
  query: string;
  suggestions: AutocompleteItem[];
  onSelect: (item: AutocompleteItem, context?: CharacterContext) => void;
  onClose: () => void;
  onQueryChange: (query: string) => void;
}

const AutocompleteDropdown = React.forwardRef<
  HTMLDivElement,
  AutocompleteDropdownProps
>(({ position, query, suggestions, onSelect, onClose, onQueryChange }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{
    item: AutocompleteItem;
    show: boolean;
  }>({
    item: suggestions[0],
    show: false,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          if (suggestions[selectedIndex].type === "character") {
            setContextMenu({ item: suggestions[selectedIndex], show: true });
          } else {
            onSelect(suggestions[selectedIndex]);
          }
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  return (
    <div
      ref={ref}
      className="autocomplete-dropdown"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search characters or locations..."
        className="autocomplete-input"
        autoFocus
      />

      <div className="autocomplete-suggestions">
        {suggestions.map((item, index) => (
          <div
            key={item.id}
            className={`suggestion-item ${
              index === selectedIndex ? "selected" : ""
            }`}
            onClick={() => {
              if (item.type === "character") {
                setContextMenu({ item, show: true });
              } else {
                onSelect(item);
              }
            }}
          >
            <span className="suggestion-icon">
              {item.type === "character" ? "👤" : "📍"}
            </span>
            <div className="suggestion-content">
              <div className="suggestion-name">{item.name}</div>
              {item.description && (
                <div className="suggestion-description">{item.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Context menu for character insertion */}
      {contextMenu.show && (
        <div className="context-menu">
          <button onClick={() => onSelect(contextMenu.item, "dialogue")}>
            💬 Add as Dialogue
          </button>
          <button onClick={() => onSelect(contextMenu.item, "narrative")}>
            📝 Add as Narrative
          </button>
          <button onClick={() => onSelect(contextMenu.item, "reference")}>
            👁 Add as Reference
          </button>
        </div>
      )}
    </div>
  );
});

export default StructuredEditor;
