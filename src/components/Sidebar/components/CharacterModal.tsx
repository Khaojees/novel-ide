import { useState } from "react";
import { Character } from "../../../type";

// Simple Modal Components
interface CharacterModalProps {
  onClose: () => void;
  onSave: (character: Omit<Character, "id">) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    traits: "",
    bio: "",
    appearance: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.traits && formData.bio) {
      onSave({
        ...formData,
        active: true,
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Character</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Character name"
              required
            />
          </div>
          <div className="form-group">
            <label>Traits *</label>
            <input
              type="text"
              value={formData.traits}
              onChange={(e) =>
                setFormData({ ...formData, traits: e.target.value })
              }
              placeholder="Brave, kind, mysterious..."
              required
            />
          </div>
          <div className="form-group">
            <label>Bio *</label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Character background and description"
              required
            />
          </div>
          <div className="form-group">
            <label>Appearance</label>
            <input
              type="text"
              value={formData.appearance}
              onChange={(e) =>
                setFormData({ ...formData, appearance: e.target.value })
              }
              placeholder="Physical description"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
