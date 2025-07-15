// src/components/LocationPanel/LocationPanel.tsx
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
} from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { Location } from "../../types/structured";
import "./LocationPanel.css";
import { useConfirm } from "../ConfirmDialogContext/ConfirmDialogContext";

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
    try {
      await updateLocation(id, updates);
      setEditingLocation(null);
    } catch (error) {
      console.error("Failed to update location:", error);
      alert("Failed to update location. Please try again.");
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    const usage = getLocationUsage(location.id);

    if (usage.length > 0) {
      alert(
        `Cannot delete "${location.name}". Location is used in ${usage.length} file(s).`
      );
      return;
    }

    const isConfirmed = await confirm({
      title: "Delete Item",
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

  return (
    <div className="location-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-title">
          <MapPin size={18} />
          <span>Locations</span>
        </div>
        <button
          className="add-btn"
          onClick={() => setShowAddForm(true)}
          title="Add new location"
        >
          <Plus size={16} />
        </button>
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
            <button
              className="create-first-btn"
              onClick={() => setShowAddForm(true)}
            >
              Create your first location
            </button>
          </div>
        ) : (
          filteredLocations.map((location) => (
            <LocationItem
              key={location.id}
              location={location}
              isPinned={pinnedLocations.has(location.id)}
              onTogglePin={() => handleTogglePin(location.id)}
              onInsert={() => handleInsertLocation(location)}
              onEdit={() => setEditingLocation(location)}
              onDelete={() => handleDeleteLocation(location)}
              onView={() => openLocationTab(location.id)}
              usage={getLocationUsage(location.id)}
            />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="panel-footer">
        <div className="quick-stats">
          <span>{filteredLocations.length} locations</span>
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
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  usage: any[];
}

const LocationItem: React.FC<LocationItemProps> = ({
  location,
  isPinned,
  onTogglePin,
  onInsert,
  onEdit,
  onDelete,
  onView,
  usage,
}) => {
  const getLocationIcon = () => {
    switch (location.type) {
      case "indoor":
        return "🏠";
      case "outdoor":
        return "🌳";
      case "vehicle":
        return "🚗";
      case "abstract":
        return "💭";
      default:
        return "📍";
    }
  };

  return (
    <div className="location-item">
      <div className="location-header">
        <div className="location-info">
          <span className="location-icon">{getLocationIcon()}</span>
          <div className="location-details">
            <h4 className="location-name">{location.name}</h4>
            {location.names?.short &&
              location.names.short !== location.name && (
                <span className="location-short-name">
                  "{location.names.short}"
                </span>
              )}
            {usage.length > 0 && (
              <span className="usage-count">{usage.length} mentions</span>
            )}
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
      {location.description && (
        <div className="location-description">{location.description}</div>
      )}

      {/* Hierarchy */}
      {location.parentLocation && (
        <div className="location-hierarchy">
          <span className="hierarchy-label">Part of:</span>
          <span className="parent-location">{location.parentLocation}</span>
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

  return (
    <div className="location-form">
      <div className="form-header">
        <h3>{location ? "Edit Location" : "Add New Location"}</h3>
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
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Location Type</label>
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

        <div className="form-group-row">
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
