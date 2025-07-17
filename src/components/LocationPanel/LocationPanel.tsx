// src/components/LocationPanel/LocationPanel.tsx - Complete Fixed Version
import React, { useState, useMemo } from "react";
import {
  Search,
  Pin,
  PinOff,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Home,
  TreePine,
  Car,
  Brain,
  X,
} from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { Location } from "../../types/structured";
import { useConfirm } from "../ConfirmDialogContext/ConfirmDialogContext";
import "./LocationPanel.css";

interface LocationPanelProps {}

const LocationPanel: React.FC<LocationPanelProps> = () => {
  const {
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    getLocationUsage,
    openLocationTab,
  } = useProjectStore();

  const confirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pinnedLocations, setPinnedLocations] = useState<Set<string>>(
    new Set()
  );
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Filter locations based on search and pinned status
  const filteredLocations = useMemo(() => {
    if (!locations) return [];

    let filtered = locations.filter(
      (location) =>
        location.active &&
        location.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Show pinned locations first
    return filtered.sort((a, b) => {
      const aPinned = pinnedLocations.has(a.id);
      const bPinned = pinnedLocations.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [locations, searchQuery, pinnedLocations]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTogglePin = (locationId: string) => {
    setPinnedLocations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const handleInsertLocation = (location: Location) => {
    // Send custom event to editor for location insertion
    const event = new CustomEvent("insertLocationTag", {
      detail: { locationId: location.id },
    });
    window.dispatchEvent(event);
  };

  const handleAddLocation = async (locationData: Omit<Location, "id">) => {
    if (!addLocation) return;

    try {
      await addLocation(locationData);
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add location:", error);
      alert("Failed to add location. Please try again.");
    }
  };

  const handleUpdateLocation = async (
    id: string,
    updates: Partial<Location>
  ) => {
    if (!updateLocation) return;

    try {
      await updateLocation(id, updates);
      setEditingLocation(null);
    } catch (error) {
      console.error("Failed to update location:", error);
      alert("Failed to update location. Please try again.");
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    if (!deleteLocation || !getLocationUsage) return;

    const usage = getLocationUsage(location.id);

    if (usage.length > 0) {
      alert(
        `Cannot delete "${location.name}". Location is used in ${usage.length} file(s).`
      );
      return;
    }

    const isConfirmed = await confirm({
      title: "Delete Location",
      message: `Are you sure you want to delete "${location.name}"?`,
    });

    if (isConfirmed) {
      try {
        const success = await deleteLocation(location.id);
        if (!success) {
          alert("Failed to delete location. Please try again.");
        }
      } catch (error) {
        console.error("Failed to delete location:", error);
        alert("Failed to delete location. Please try again.");
      }
    }
  };

  const handleOpenLocation = (location: Location) => {
    if (openLocationTab) {
      openLocationTab(location.id);
    }
  };

  const handleQuickAdd = async () => {
    const name = prompt("Location name:");
    if (!name?.trim()) return;

    try {
      if (addLocation) {
        await addLocation({
          name: name.trim(),
          description: "",
          type: "indoor",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to add location:", error);
      alert("Failed to add location. Please try again.");
    }
  };

  return (
    <div className="location-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-title">
          <MapPin size={18} />
          <span>Locations</span>
        </div>
        <div className="header-actions">
          <span className="location-count">{locations?.length || 0}</span>
          <button
            className="add-btn"
            onClick={() => setShowAddForm(true)}
            title="Add new location"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-container">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {/* Add Location Form */}
      {showAddForm && (
        <LocationForm
          onSubmit={handleAddLocation}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Location Form */}
      {editingLocation && (
        <LocationForm
          location={editingLocation}
          onSubmit={(data) => handleUpdateLocation(editingLocation.id, data)}
          onCancel={() => setEditingLocation(null)}
        />
      )}

      {/* Locations List */}
      <div className="locations-list">
        {filteredLocations.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} className="empty-icon" />
            <p>No locations found</p>
            {searchQuery ? (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </button>
            ) : (
              <button className="quick-add-btn" onClick={handleQuickAdd}>
                <Plus size={16} />
                Add location
              </button>
            )}
          </div>
        ) : (
          filteredLocations.map((location) => (
            <LocationItem
              key={location.id}
              location={location}
              isPinned={pinnedLocations.has(location.id)}
              onTogglePin={() => handleTogglePin(location.id)}
              onInsert={() => handleInsertLocation(location)}
              onView={() => handleOpenLocation(location)}
              onEdit={() => setEditingLocation(location)}
              onDelete={() => handleDeleteLocation(location)}
              usage={getLocationUsage ? getLocationUsage(location.id) : []}
            />
          ))
        )}
      </div>

      {/* Panel Footer */}
      <div className="panel-footer">
        <div className="quick-stats">
          <span>{filteredLocations.length} active</span>
          <span>•</span>
          <span>{pinnedLocations.size} pinned</span>
        </div>
      </div>
    </div>
  );
};

// ========================================
// LOCATION ITEM COMPONENT
// ========================================

interface LocationItemProps {
  location: Location;
  isPinned: boolean;
  onTogglePin: () => void;
  onInsert: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  usage: any[];
}

const LocationItem: React.FC<LocationItemProps> = ({
  location,
  isPinned,
  onTogglePin,
  onInsert,
  onView,
  onEdit,
  onDelete,
  usage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getLocationIcon = () => {
    switch (location.type) {
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

  const getDisplayName = () => {
    return location.names?.short || location.name;
  };

  const getTypeLabel = () => {
    if (!location.type) return "Unknown";
    return location.type.charAt(0).toUpperCase() + location.type.slice(1);
  };

  return (
    <div
      className={`location-item ${isPinned ? "pinned" : ""} ${
        isExpanded ? "expanded" : ""
      }`}
    >
      <div className="location-header">
        <div
          className="location-info"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span
            className="location-icon"
            style={{ color: location.color || "#ef4444" }}
          >
            {getLocationIcon()}
          </span>
          <div className="location-details">
            <h4 className="location-name">{getDisplayName()}</h4>
            <div className="location-meta">
              <span className="location-type">{getTypeLabel()}</span>
              {usage.length > 0 && (
                <span className="usage-count">{usage.length} mentions</span>
              )}
            </div>
          </div>
        </div>

        <div className="location-actions">
          <button
            className={`pin-btn ${isPinned ? "pinned" : ""}`}
            onClick={onTogglePin}
            title={isPinned ? "Unpin location" : "Pin location"}
          >
            {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
        </div>
      </div>

      {/* Description */}
      {location.description && isExpanded && (
        <div className="location-description">
          {location.description.length > 150
            ? `${location.description.substring(0, 150)}...`
            : location.description}
        </div>
      )}

      {/* Hierarchy */}
      {location.parentLocation && isExpanded && (
        <div className="location-hierarchy">
          <span className="hierarchy-label">Part of:</span>
          <span className="parent-location">{location.parentLocation}</span>
        </div>
      )}

      {/* Display Names */}
      {isExpanded && (location.names?.full || location.names?.description) && (
        <div className="location-names">
          {location.names?.full && (
            <div className="name-item">
              <strong>Full name:</strong> {location.names.full}
            </div>
          )}
          {location.names?.description && (
            <div className="name-item">
              <strong>Descriptive:</strong> {location.names.description}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="location-quick-actions">
        <button
          className="quick-action-btn insert-btn"
          onClick={onInsert}
          title="Insert location in text"
        >
          <MapPin size={14} />
          Insert
        </button>

        <button
          className="quick-action-btn view-btn"
          onClick={onView}
          title="View location details"
        >
          <Eye size={14} />
          View
        </button>

        <button
          className="quick-action-btn edit-btn"
          onClick={onEdit}
          title="Edit location"
        >
          <Edit3 size={14} />
          Edit
        </button>

        <button
          className="quick-action-btn delete-btn"
          onClick={onDelete}
          title="Delete location"
          disabled={usage.length > 0}
        >
          <Trash2 size={14} />
          {usage.length > 0 ? "In Use" : "Delete"}
        </button>
      </div>

      {/* Usage Information */}
      {isExpanded && usage.length > 0 && (
        <div className="location-usage">
          <h5>Used in:</h5>
          <div className="usage-list">
            {usage.slice(0, 3).map((use, index) => (
              <div key={index} className="usage-item">
                <span className="usage-file">{use.title}</span>
                <span className="usage-mentions">{use.mentions} times</span>
              </div>
            ))}
            {usage.length > 3 && (
              <div className="usage-more">
                +{usage.length - 3} more files...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================
// LOCATION FORM COMPONENT
// ========================================

interface LocationFormProps {
  location?: Location;
  onSubmit: (data: Omit<Location, "id">) => void;
  onCancel: () => void;
}

const LocationForm: React.FC<LocationFormProps> = ({
  location,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: location?.name || "",
    description: location?.description || "",
    type: location?.type || ("indoor" as const),
    names: {
      short: location?.names?.short || "",
      full: location?.names?.full || "",
      description: location?.names?.description || "",
    },
    parentLocation: location?.parentLocation || "",
    color: location?.color || "#ef4444",
    active: location?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Location name is required");
      return;
    }

    onSubmit({
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      parentLocation: formData.parentLocation.trim() || undefined,
      names: {
        short: formData.names.short.trim() || undefined,
        full: formData.names.full.trim() || undefined,
        description: formData.names.description.trim() || undefined,
      },
      subLocations: location?.subLocations || [],
      createdAt: location?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

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
    <div className="location-form">
      <div className="form-header">
        <h3>{location ? "Edit Location" : "Add New Location"}</h3>
        <button className="form-close" onClick={onCancel} title="Close form">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Location Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="e.g., Academy Library"
            className="form-input"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Location Type</label>
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
                >
                  {getTypeIcon(type)}
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </button>
              )
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe this location..."
            className="form-textarea"
            rows={3}
          />
        </div>

        <div className="form-section">
          <h4>Display Names</h4>

          <div className="form-group">
            <label htmlFor="short-name">Short Name</label>
            <input
              id="short-name"
              type="text"
              value={formData.names.short}
              onChange={(e) => handleNamesChange("short", e.target.value)}
              placeholder="e.g., Library"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="full-name">Full Name</label>
            <input
              id="full-name"
              type="text"
              value={formData.names.full}
              onChange={(e) => handleNamesChange("full", e.target.value)}
              placeholder="e.g., The Grand Academy Library"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="desc-name">Descriptive Name</label>
            <input
              id="desc-name"
              type="text"
              value={formData.names.description}
              onChange={(e) => handleNamesChange("description", e.target.value)}
              placeholder="e.g., The quiet, ancient library"
              className="form-input"
            />
          </div>
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
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="color">Color</label>
            <div className="color-input-group">
              <input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                className="form-color"
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
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleInputChange("active", e.target.checked)}
              />
              <span className="checkbox-text">Active Location</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            {location ? "Update" : "Create"} Location
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationPanel;
