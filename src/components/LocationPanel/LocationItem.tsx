// ========================================
// LOCATION ITEM COMPONENT - Updated with 3 Insert Buttons
// ========================================

import {
  Brain,
  Car,
  Home,
  MapPin,
  Pin,
  PinOff,
  TreePine,
  Building,
  Navigation,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Location, LocationContext } from "../../types/structured";

interface LocationItemProps {
  location: Location;
  isPinned: boolean;
  onTogglePin: () => void;
  onInsertLocation: (
    locationId: string,
    nameType: "full" | "short" | "description"
  ) => void;
  onView: () => void;
  usage: any[];
}

export const LocationItem: React.FC<LocationItemProps> = ({
  location,
  isPinned,
  onTogglePin,
  onInsertLocation,
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
    return location.names.fullname || location.names.shortname;
  };

  const getTypeLabel = () => {
    if (!location.type) return "Unknown";
    return location.type.charAt(0).toUpperCase() + location.type.slice(1);
  };

  const getIconColor = () => {
    switch (location.type) {
      case "indoor":
        return "#3b82f6"; // Blue
      case "outdoor":
        return "#10b981"; // Green
      case "vehicle":
        return "#f59e0b"; // Orange
      case "abstract":
        return "#8b5cf6"; // Purple
      default:
        return "#a855f7"; // Default purple
    }
  };

  const handleLocationClick = () => {
    onView();
  };

  // Helper function to get name for each type
  const getNameByType = (type: LocationContext) => {
    switch (type) {
      case "fullname":
        return location.names?.fullname;
      case "shortname":
        return location.names?.shortname || location.names?.fullname;
      case "description":
        return location.names?.description || location.names?.fullname;
      default:
        return location.names?.fullname;
    }
  };

  const handleInsertFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInsertLocation(location.id, "full");
  };

  const handleInsertShort = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInsertLocation(location.id, "short");
  };

  const handleInsertDescription = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInsertLocation(location.id, "description");
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
            data-type={location.type}
            style={{ color: getIconColor() }}
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
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
        </div>
      </div>

      {/* Multiple Insert Buttons */}
      <div className="location-insert-buttons">
        <button
          className="insert-btn full"
          onClick={handleInsertFull}
          title={`Insert full name: ${getNameByType("fullname")}`}
        >
          <Building size={12} />
          <span className="insert-label">{getNameByType("fullname")}</span>
        </button>

        <button
          className="insert-btn short"
          onClick={handleInsertShort}
          title={`Insert short name: ${getNameByType("shortname")}`}
        >
          <Navigation size={12} />
          <span className="insert-label">{getNameByType("shortname")}</span>
        </button>

        <button
          className="insert-btn description"
          onClick={handleInsertDescription}
          title={`Insert descriptive name: ${getNameByType("description")}`}
        >
          <Sparkles size={12} />
          <span className="insert-label">{getNameByType("description")}</span>
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="location-expanded">
          <div className="location-full-name">
            <strong>Full name:</strong>
            <p>{location.names.fullname}</p>
          </div>
          {location.description && (
            <div className="location-description">
              <strong>Description:</strong>
              <p>{location.description}</p>
            </div>
          )}
          {location.parentLocation && (
            <div className="location-parent">
              <strong>Part of:</strong>
              <p>{location.parentLocation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
