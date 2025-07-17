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
import { AutocompleteDropdown } from "./AutocompleteDropdown";
import { TextSpan } from "./TextSpan";
import { LocationTag } from "./LocationTag";
import { CharacterTag } from "./CharacterTag";

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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  // Listen for events from CharacterPanel and LocationPanel
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

    const handleInsertLocationTag = (event: CustomEvent) => {
      const { locationId } = event.detail;
      insertLocationTag(locationId);
    };

    window.addEventListener(
      "insertDialogue",
      handleInsertDialogue as EventListener
    );
    window.addEventListener(
      "insertCharacterTag",
      handleInsertCharacterTag as EventListener
    );
    window.addEventListener(
      "insertLocationTag",
      handleInsertLocationTag as EventListener
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
      window.removeEventListener(
        "insertLocationTag",
        handleInsertLocationTag as EventListener
      );
    };
  }, [insertCharacterTag, insertLocationTag, insertText]);

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
        >
          |
        </span>
      </div>

      {/* Autocomplete Dropdown */}
      {showAutocomplete && (
        <AutocompleteDropdown
          position={autocompletePosition}
          query={autocompleteQuery}
          suggestions={getAutocompleteSuggestions()}
          onSelect={handleAutocompleteSelect}
          onClose={() => setShowAutocomplete(false)}
        />
      )}
    </div>
  );
};

export default StructuredEditor;
