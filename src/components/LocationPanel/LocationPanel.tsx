// src/components/LocationPanel/LocationPanel.tsx - Simplified Version
import React, { useState, useMemo } from "react";
import {
  Search,
  Pin,
  PinOff,
  MapPin,
  Plus,
  Home,
  TreePine,
  Car,
  Brain,
} from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { Location } from "../../types/structured";

interface LocationPanelProps {}

const LocationPanel: React.FC<LocationPanelProps> = () => {
  const { locations, addLocation, getLocationUsage, openLocationTab } =
    useProjectStore();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pinnedLocations, setPinnedLocations] = useState<Set<string>>(
    new Set()
  );

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
            onClick={handleQuickAdd}
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
              <button className="clear-search-btn" onClick={handleQuickAdd}>
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
// SIMPLIFIED LOCATION ITEM COMPONENT
// ========================================

interface LocationItemProps {
  location: Location;
  isPinned: boolean;
  onTogglePin: () => void;
  onInsert: () => void;
  onView: () => void;
  usage: any[];
}

const LocationItem: React.FC<LocationItemProps> = ({
  location,
  isPinned,
  onTogglePin,
  onInsert,
  onView,
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

  const handleLocationClick = () => {
    // คลิกที่ชื่อสถานที่เพื่อเปิด tab
    onView();
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
            <h4
              className="location-name"
              onClick={(e) => {
                e.stopPropagation();
                handleLocationClick();
              }}
              style={{ cursor: "pointer" }}
            >
              {getDisplayName()}
            </h4>
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

      {/* Simplified Quick Actions - Only Insert */}
      <div className="location-quick-actions">
        <button
          className="quick-action-btn insert-btn"
          onClick={onInsert}
          title="Insert location in text"
        >
          <MapPin size={14} />
          Insert
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

export default LocationPanel;
