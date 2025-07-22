import { Location, LocationNode } from "../../types/structured";

interface LocationTagProps {
  node: LocationNode;
  location?: Location;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
}

export const LocationTag: React.FC<LocationTagProps> = ({
  node,
  location,
  isActive,
  onClick,
  onEdit,
}) => {
  const getDisplayName = () => {
    if (!location) return "[Unknown Location]";
    return location.names.fullname || location.names?.shortname;
  };

  const getTagClass = () => {
    let className = "location-tag";
    if (isActive) className += " active";
    if (!location) className += " error";
    return className;
  };

  return (
    <span
      className={getTagClass()}
      onClick={onClick}
      onDoubleClick={onEdit}
      title={
        location?.description || location?.names.fullname || "Unknown location"
      }
      style={{
        backgroundColor: location?.color || "#ef4444",
        color: "white",
      }}
    >
      📍 {getDisplayName()}
    </span>
  );
};
