// src/components/Editor/LocationEditor.tsx
import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  AlertCircle,
  MapPin,
  FileText,
  Lightbulb,
  Trash2,
  Home,
  TreePine,
  Car,
  Brain,
} from "lucide-react";
import { Location } from "../../types/structured";

interface LocationUsage {
  id: string;
  type: string;
  title: string;
  filename: string;
  mentions: number;
}

interface LocationFormData {
  name: string;
  description: string;
  type: "indoor" | "outdoor" | "vehicle" | "abstract";
  names: {
    short: string;
    full: string;
    description: string;
  };
  parentLocation: string;
  color: string;
  active: boolean;
}

interface LocationEditorProps {
  location: Location;
  onSave: (location: Location) => Promise<void>;
  onCancel: () => void;
  onDelete?: (locationId: string) => Promise<boolean>;
  getLocationUsage: (locationId: string) => LocationUsage[];
  isModified: boolean;
  onContentChange: () => void;
}

const LocationEditor: React.FC<LocationEditorProps> = ({
  location,
  onSave,
  onCancel,
  onDelete,
  getLocationUsage,
  isModified,
  onContentChange,
}) => {
  const [activeTab, setActiveTab] = useState<"basic" | "hierarchy" | "usage">(
    "basic"
  );
  const [formData, setFormData] = useState<LocationFormData>({
    name: location.name,
    description: location.description || "",
    type: location.type || "indoor",
    names: {
      short: location.names?.short || "",
      full: location.names?.full || "",
      description: location.names?.description || "",
    },
    parentLocation: location.parentLocation || "",
    color: location.color || "#ef4444",
    active: location.active,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [usage, setUsage] = useState<LocationUsage[]>([]);

  useEffect(() => {
    setUsage(getLocationUsage(location.id));
  }, [location.id, getLocationUsage]);

  const handleInputChange = (field: keyof LocationFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    onContentChange();
  };

  const handleNamesChange = (
    field: keyof LocationFormData["names"],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      names: {
        ...prev.names,
        [field]: value,
      },
    }));
    onContentChange();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Location name is required");
      return;
    }

    try {
      const updatedLocation: Location = {
        ...location,
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        parentLocation: formData.parentLocation.trim() || undefined,
        names: {
          short: formData.names.short.trim() || undefined,
          full: formData.names.full.trim() || undefined,
          description: formData.names.description.trim() || undefined,
        },
        updatedAt: new Date().toISOString(),
      };

      await onSave(updatedLocation);
    } catch (error) {
      console.error("Failed to save location:", error);
      alert("Failed to save location. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (usage.length > 0) {
      alert(
        `Cannot delete ${location.name}. Location is used in ${usage.length} file(s).`
      );
      return;
    }

    try {
      const success = await onDelete(location.id);
      if (success) {
        onCancel(); // Close the editor
      }
    } catch (error) {
      console.error("Failed to delete location:", error);
      alert("Failed to delete location. Please try again.");
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "indoor":
        return <Home size={20} />;
      case "outdoor":
        return <TreePine size={20} />;
      case "vehicle":
        return <Car size={20} />;
      case "abstract":
        return <Brain size={20} />;
      default:
        return <MapPin size={20} />;
    }
  };

  return (
    <div className="location-editor">
      {/* Header */}
      <div className="location-editor-header">
        <div className="header-info">
          <div className="location-icon" style={{ color: formData.color }}>
            {getTypeIcon(formData.type)}
          </div>
          <h2>Edit Location</h2>
          {isModified && <span className="modified-indicator">●</span>}
        </div>

        <div className="header-actions">
          <button
            className="location-btn-save"
            onClick={handleSave}
            disabled={!isModified}
          >
            <Save size={16} />
            Save
          </button>

          {onDelete && (
            <button
              className="location-btn-delete"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={usage.length > 0}
              title={
                usage.length > 0
                  ? `Cannot delete: used in ${usage.length} files`
                  : "Delete location"
              }
            >
              <Trash2 size={16} />
            </button>
          )}

          <button className="location-btn-close" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="location-editor-tabs">
        <button
          className={`location-tab-btn ${
            activeTab === "basic" ? "active" : ""
          }`}
          onClick={() => setActiveTab("basic")}
        >
          Basic Info
        </button>
        <button
          className={`location-tab-btn ${
            activeTab === "hierarchy" ? "active" : ""
          }`}
          onClick={() => setActiveTab("hierarchy")}
        >
          Hierarchy
        </button>
        <button
          className={`location-tab-btn ${
            activeTab === "usage" ? "active" : ""
          }`}
          onClick={() => setActiveTab("usage")}
        >
          Usage ({usage.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="location-editor-content">
        {activeTab === "basic" && (
          <div className="tab-panel">
            <div className="form-group">
              <label htmlFor="name">Location Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Academy Library"
                className="location-form-input"
              />
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="form-select"
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="abstract">Abstract</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="color">Color</label>
                <input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  className="form-color"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe this location..."
                className="location-form-textarea"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="short-name">Short Name</label>
              <input
                id="short-name"
                type="text"
                value={formData.names.short}
                onChange={(e) => handleNamesChange("short", e.target.value)}
                placeholder="e.g., Library"
                className="location-form-input"
              />
              <small>Used in narrative text</small>
            </div>

            <div className="form-group">
              <label htmlFor="full-name">Full Name</label>
              <input
                id="full-name"
                type="text"
                value={formData.names.full}
                onChange={(e) => handleNamesChange("full", e.target.value)}
                placeholder="e.g., The Grand Academy Library"
                className="location-form-input"
              />
              <small>Used in formal descriptions</small>
            </div>

            <div className="form-group">
              <label htmlFor="description-name">Descriptive Name</label>
              <input
                id="description-name"
                type="text"
                value={formData.names.description}
                onChange={(e) =>
                  handleNamesChange("description", e.target.value)
                }
                placeholder="e.g., The quiet, ancient library"
                className="location-form-input"
              />
              <small>Used in atmospheric descriptions</small>
            </div>

            <div className="form-group-row">
              <label className="location-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) =>
                    handleInputChange("active", e.target.checked)
                  }
                />
                <span className="checkbox-text">Active Location</span>
                <small>
                  Inactive locations won't appear in quick-add lists
                </small>
              </label>
            </div>
          </div>
        )}

        {activeTab === "hierarchy" && (
          <div className="tab-panel">
            <div className="hierarchy-info">
              <AlertCircle size={16} />
              <p>Configure location hierarchy and relationships</p>
            </div>

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
                className="location-form-input"
              />
              <small>The larger location this place is part of</small>
            </div>

            <div className="form-group">
              <label>Sub-locations</label>
              <div className="sub-locations-list">
                {location.subLocations && location.subLocations.length > 0 ? (
                  location.subLocations.map((subLocId) => (
                    <div key={subLocId} className="sub-location-item">
                      <MapPin size={14} />
                      <span>{subLocId}</span>
                    </div>
                  ))
                ) : (
                  <p className="feature-placeholder">
                    No sub-locations defined
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "usage" && (
          <div className="tab-panel">
            <div className="usage-header">
              <h3>Location Usage ({usage.length} files)</h3>
              {usage.length > 0 && (
                <p className="usage-warning">
                  <AlertCircle size={16} />
                  This location cannot be deleted while in use
                </p>
              )}
            </div>

            {usage.length === 0 ? (
              <div className="no-usage">
                <MapPin size={48} className="no-usage-icon" />
                <p>This location is not used in any files</p>
                <small>It's safe to delete if no longer needed</small>
              </div>
            ) : (
              <div className="usage-list">
                {usage.map((item) => (
                  <div key={item.id} className="usage-item">
                    <div className="usage-icon">{getUsageIcon(item.type)}</div>
                    <div className="usage-details">
                      <h4>{item.title}</h4>
                      <p className="usage-filename">{item.filename}</p>
                      <p className="usage-mentions">{item.mentions} mentions</p>
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Location</h3>
            <p>
              Are you sure you want to delete "{location.name}"? This action
              cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="location-btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn-confirm-delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationEditor;
