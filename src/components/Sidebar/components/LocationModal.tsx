// src/components/Sidebar/components/LocationModal.tsx
import React, { useState } from "react";
import { X, MapPin, Home, TreePine, Car, Brain } from "lucide-react";
import { Location } from "../../../types/structured";

interface LocationModalProps {
  onClose: () => void;
  onSave: (locationData: Omit<Location, "id">) => Promise<void>;
}

const LocationModal: React.FC<LocationModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "indoor" as "indoor" | "outdoor" | "vehicle" | "abstract",
    names: {
      short: "",
      full: "",
      description: "",
    },
    parentLocation: "",
    color: "#ef4444",
    active: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNamesChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      names: {
        ...prev.names,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);

    try {
      const locationData: Omit<Location, "id"> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        names: {
          short: formData.names.short.trim() || undefined,
          full: formData.names.full.trim() || undefined,
          description: formData.names.description.trim() || undefined,
        },
        parentLocation: formData.parentLocation.trim() || undefined,
        color: formData.color,
        active: formData.active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(locationData);
    } catch (error) {
      console.error("Failed to create location:", error);
      alert("Failed to create location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "indoor":
        return <Home size={16} />;
      case "outdoor":
        return <TreePine size={16} />;
      case "vehicle":
        return <Car size={16} />;
      case "abstract":
        return <Brain size={16} />;
      default:
        return <MapPin size={16} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content location-modal" // เปลี่ยนจาก "modal location-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <MapPin size={20} />
            <h3>Add New Location</h3>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-form">
          {" "}
          {/* เปลี่ยนจาก <form className="modal-content"> */}
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h4>Basic Information</h4>

              <div className="form-group">
                <label htmlFor="location-name">Location Name *</label>
                <input
                  id="location-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter location name..."
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="location-type">Type</label>
                <div className="type-selector">
                  {(["indoor", "outdoor", "vehicle", "abstract"] as const).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        className={`type-option ${
                          formData.type === type ? "selected" : ""
                        }`}
                        onClick={() => handleInputChange("type", type)}
                        disabled={isLoading}
                      >
                        {getTypeIcon(type)}
                        <span>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location-description">Description</label>
                <textarea
                  id="location-description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe this location..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Display Names */}
            <div className="form-section">
              <h4>Display Names</h4>
              <p className="form-description">
                Configure how this location appears in different contexts
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name-short">Short Name</label>
                  <input
                    id="name-short"
                    type="text"
                    value={formData.names.short}
                    onChange={(e) => handleNamesChange("short", e.target.value)}
                    placeholder="e.g., Library"
                    disabled={isLoading}
                  />
                  <small>Used in quick references</small>
                </div>

                <div className="form-group">
                  <label htmlFor="name-full">Full Name</label>
                  <input
                    id="name-full"
                    type="text"
                    value={formData.names.full}
                    onChange={(e) => handleNamesChange("full", e.target.value)}
                    placeholder="e.g., The Grand Royal Library"
                    disabled={isLoading}
                  />
                  <small>Used in formal descriptions</small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name-description">Descriptive Name</label>
                <input
                  id="name-description"
                  type="text"
                  value={formData.names.description}
                  onChange={(e) =>
                    handleNamesChange("description", e.target.value)
                  }
                  placeholder="e.g., The quiet, ancient library"
                  disabled={isLoading}
                />
                <small>Used in atmospheric descriptions</small>
              </div>
            </div>

            {/* Hierarchy */}
            <div className="form-section">
              <h4>Location Hierarchy</h4>

              <div className="form-group">
                <label htmlFor="parent-location">Parent Location</label>
                <input
                  id="parent-location"
                  type="text"
                  value={formData.parentLocation}
                  onChange={(e) =>
                    handleInputChange("parentLocation", e.target.value)
                  }
                  placeholder="e.g., Academy Campus"
                  disabled={isLoading}
                />
                <small>The larger location this place is part of</small>
              </div>
            </div>

            {/* Appearance */}
            <div className="form-section">
              <h4>Appearance</h4>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location-color">Color</label>
                  <div className="color-input-group">
                    <input
                      id="location-color"
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        handleInputChange("color", e.target.value)
                      }
                      disabled={isLoading}
                    />
                    <span
                      className="color-preview"
                      style={{ backgroundColor: formData.color }}
                    >
                      📍 {formData.name || "Sample"}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="location-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        handleInputChange("active", e.target.checked)
                      }
                      disabled={isLoading}
                    />
                    <span className="checkbox-text">Active Location</span>
                  </label>
                  <small>
                    Inactive locations won't appear in quick-add lists
                  </small>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!formData.name.trim() || isLoading}
              >
                {isLoading ? "Creating..." : "Create Location"}
              </button>
            </div>
          </form>
        </div>{" "}
        {/* ปิด modal-form */}
      </div>
    </div>
  );
};

export default LocationModal;
