// src/components/Editor/CharacterEditor.tsx
import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  AlertCircle,
  Users,
  FileText,
  Lightbulb,
  Trash2,
} from "lucide-react";
import { Character, CharacterUsage, CharacterFormData } from "../../types";

interface CharacterEditorProps {
  character: Character;
  onSave: (character: Character) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => Promise<boolean>;
  usage: CharacterUsage[];
  isModified: boolean;
  onModifiedChange: (modified: boolean) => void;
}

const CharacterEditor: React.FC<CharacterEditorProps> = ({
  character,
  onSave,
  onCancel,
  onDelete,
  usage,
  isModified,
  onModifiedChange,
}) => {
  const [formData, setFormData] = useState<CharacterFormData>({
    name: character.name,
    traits: character.traits,
    bio: character.bio,
    appearance: character.appearance || "",
    active: character.active,
    names: {
      dialogue: character.names?.dialogue || character.name,
      narrative: character.names?.narrative || character.name,
      reference: character.names?.reference || "เขา/เธอ",
    },
    relationships: character.relationships || [],
    tags: character.tags || [],
    notes: character.notes || "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "basic" | "names" | "relationships" | "usage"
  >("basic");

  // Track if form has changes
  useEffect(() => {
    const hasChanges =
      formData.name !== character.name ||
      formData.traits !== character.traits ||
      formData.bio !== character.bio ||
      formData.appearance !== (character.appearance || "") ||
      formData.active !== character.active ||
      formData.names?.dialogue !==
        (character.names?.dialogue || character.name) ||
      formData.names?.narrative !==
        (character.names?.narrative || character.name) ||
      formData.names?.reference !== (character.names?.reference || "เขา/เธอ") ||
      formData.notes !== (character.notes || "");

    onModifiedChange(hasChanges);
  }, [formData, character, onModifiedChange]);

  const handleInputChange = (field: keyof CharacterFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNamesChange = (
    field: keyof NonNullable<CharacterFormData["names"]>,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      names: {
        ...prev.names,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Character name is required");
      return;
    }

    const updatedCharacter: Character = {
      ...character,
      name: formData.name.trim(),
      traits: formData.traits.trim(),
      bio: formData.bio.trim(),
      appearance: formData.appearance.trim(),
      active: formData.active,
      names: formData.names,
      relationships: formData.relationships,
      tags: formData.tags,
      notes: formData.notes?.trim(),
    };

    try {
      await onSave(updatedCharacter);
    } catch (error) {
      console.error("Failed to save character:", error);
      alert("Failed to save character. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (usage.length > 0) {
      alert(
        `Cannot delete ${character.name}. Character is used in ${usage.length} file(s).`
      );
      return;
    }

    try {
      const success = await onDelete(character.id);
      if (success) {
        onCancel(); // Close the editor
      }
    } catch (error) {
      console.error("Failed to delete character:", error);
      alert("Failed to delete character. Please try again.");
    }

    setShowDeleteConfirm(false);
  };

  const getUsageIcon = (type: string) => {
    switch (type) {
      case "chapter":
        return <FileText size={14} />;
      case "idea":
        return <Lightbulb size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  return (
    <div className="character-editor">
      {/* Header */}
      <div className="character-editor-header">
        <div className="header-info">
          <Users className="character-icon" size={20} />
          <h2>Edit Character</h2>
          {isModified && <span className="modified-indicator">●</span>}
        </div>

        <div className="header-actions">
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={!isModified}
          >
            <Save size={16} />
            Save
          </button>

          {onDelete && (
            <button
              className="btn-delete"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={usage.length > 0}
              title={
                usage.length > 0
                  ? `Cannot delete: used in ${usage.length} files`
                  : "Delete character"
              }
            >
              <Trash2 size={16} />
            </button>
          )}

          <button className="btn-close" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="character-editor-tabs">
        <button
          className={`tab-btn ${activeTab === "basic" ? "active" : ""}`}
          onClick={() => setActiveTab("basic")}
        >
          Basic Info
        </button>
        <button
          className={`tab-btn ${activeTab === "names" ? "active" : ""}`}
          onClick={() => setActiveTab("names")}
        >
          Names & Dialogue
        </button>
        <button
          className={`tab-btn ${activeTab === "relationships" ? "active" : ""}`}
          onClick={() => setActiveTab("relationships")}
        >
          Relationships
        </button>
        <button
          className={`tab-btn ${activeTab === "usage" ? "active" : ""}`}
          onClick={() => setActiveTab("usage")}
        >
          Usage ({usage.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="character-editor-content">
        {activeTab === "basic" && (
          <div className="tab-panel">
            <div className="form-group">
              <label htmlFor="name">Character Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter character name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="traits">Personality Traits</label>
              <input
                id="traits"
                type="text"
                value={formData.traits}
                onChange={(e) => handleInputChange("traits", e.target.value)}
                placeholder="e.g., Brave, mysterious, hot-tempered"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="appearance">Physical Appearance</label>
              <input
                id="appearance"
                type="text"
                value={formData.appearance}
                onChange={(e) =>
                  handleInputChange("appearance", e.target.value)
                }
                placeholder="e.g., Tall with piercing blue eyes"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Biography & Background</label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Character's background story, history, motivations..."
                className="form-textarea"
                rows={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any additional notes about this character..."
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) =>
                    handleInputChange("active", e.target.checked)
                  }
                />
                <span className="checkbox-text">Active Character</span>
                <small>
                  Inactive characters won't appear in quick-add lists
                </small>
              </label>
            </div>
          </div>
        )}

        {activeTab === "names" && (
          <div className="tab-panel">
            <div className="names-info">
              <AlertCircle size={16} />
              <p>
                Configure how this character's name appears in different
                contexts
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="dialogue-name">Dialogue Name</label>
              <input
                id="dialogue-name"
                type="text"
                value={formData.names?.dialogue || ""}
                onChange={(e) => handleNamesChange("dialogue", e.target.value)}
                placeholder="Name used in dialogue (e.g., Alex)"
                className="form-input"
              />
              <small>Used for: Alex: "Hello world!"</small>
            </div>

            <div className="form-group">
              <label htmlFor="narrative-name">Narrative Name</label>
              <input
                id="narrative-name"
                type="text"
                value={formData.names?.narrative || ""}
                onChange={(e) => handleNamesChange("narrative", e.target.value)}
                placeholder="Name used in narration (e.g., อเล็กซ์)"
                className="form-input"
              />
              <small>Used for: อเล็กซ์เดินเข้ามาในห้อง</small>
            </div>

            <div className="form-group">
              <label htmlFor="reference-name">Reference Name</label>
              <input
                id="reference-name"
                type="text"
                value={formData.names?.reference || ""}
                onChange={(e) => handleNamesChange("reference", e.target.value)}
                placeholder="Pronoun/reference (e.g., เขา, เธอ)"
                className="form-input"
              />
              <small>Used for: เขาหันมามอง</small>
            </div>
          </div>
        )}

        {activeTab === "relationships" && (
          <div className="tab-panel">
            <div className="form-group">
              <label>Character Relationships</label>
              <p className="feature-placeholder">
                🚧 Relationship tracking will be implemented in a future update
              </p>
            </div>
          </div>
        )}

        {activeTab === "usage" && (
          <div className="tab-panel">
            <div className="usage-header">
              <h3>Character Usage ({usage.length} files)</h3>
              {usage.length > 0 && (
                <p className="usage-warning">
                  <AlertCircle size={16} />
                  This character cannot be deleted while in use
                </p>
              )}
            </div>

            {usage.length === 0 ? (
              <div className="usage-empty">
                <p>This character is not used in any files yet.</p>
              </div>
            ) : (
              <div className="usage-list">
                {usage.map((item, index) => (
                  <div key={index} className="usage-item">
                    <div className="usage-icon">{getUsageIcon(item.type)}</div>
                    <div className="usage-details">
                      <div className="usage-title">{item.title}</div>
                      <div className="usage-meta">
                        {item.filename} • {item.usageType}
                        {item.lineNumber && ` • Line ${item.lineNumber}`}
                      </div>
                      {item.context && (
                        <div className="usage-context">"{item.context}"</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Delete Character</h3>
            <p>
              Are you sure you want to delete <strong>{character.name}</strong>?
            </p>
            <p>This action cannot be undone.</p>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterEditor;
