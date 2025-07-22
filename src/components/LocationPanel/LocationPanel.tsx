// src/components/LocationPanel/LocationPanel.tsx - Updated with Insert button
import React, { useState, useMemo } from "react";
import { Search, MapPin, Plus } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { Location } from "../../types/structured";
import { LocationItem } from "./LocationItem";

interface LocationPanelProps {}

const LocationPanel: React.FC<LocationPanelProps> = () => {
  const { locations, addLocation, getLocationUsage, openLocationTab } =
    useProjectStore();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pinnedLocations, setPinnedLocations] = useState<Set<string>>(
    new Set()
  );

  // Filter locations based on search
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

  // ฟังก์ชันใหม่สำหรับส่ง location ref ไป editor
  const handleInsertLocation = (location: Location) => {
    const event = new CustomEvent("insertLocationRef", {
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
        <div className="panel-title">
          <MapPin size={20} />
          <h3>Locations</h3>
        </div>
        <button
          className="add-btn"
          onClick={handleQuickAdd}
          title="Quick add location"
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

      {/* Location List */}
      <div className="location-list">
        {filteredLocations.length === 0 ? (
          <div className="empty-state">
            <p>No locations found</p>
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

export default LocationPanel;
