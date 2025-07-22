// ========================================
// LOCATION ITEM COMPONENT
// ========================================

import { Brain, Car, Home, MapPin, Pin, PinOff, TreePine } from "lucide-react";
import { useState } from "react";
import { Location } from "../../types/structured";

interface LocationItemProps {
  location: Location;
  isPinned: boolean;
  onTogglePin: () => void;
  onInsert: () => void;
  onView: () => void;
  usage: any[];
}

export const LocationItem: React.FC<LocationItemProps> = ({
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

  const handleInsertClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInsert();
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
            style={{ color: location.color || "#a855f7" }}
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

      {/* Insert Button - แยกออกมาให้เห็นชัด */}
      <div className="location-insert">
        <button
          className="insert-btn"
          onClick={handleInsertClick}
          title={`Insert ${getDisplayName()} reference`}
        >
          <span className="insert-icon">@</span>
          Insert {getDisplayName()}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="location-expanded">
          {location.description && (
            <div className="location-description">
              <strong>Description:</strong>
              <p>{location.description}</p>
            </div>
          )}
          {location.names?.full && (
            <div className="location-full-name">
              <strong>Full name:</strong>
              <p>{location.names.full}</p>
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
