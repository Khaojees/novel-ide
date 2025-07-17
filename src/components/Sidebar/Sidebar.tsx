// // src/components/Sidebar/Sidebar.tsx - Updated for type safety
// import React, { useState } from "react";
// import { Plus, Users, BookOpen, Lightbulb, MapPin } from "lucide-react";
// import { useProjectStore } from "../../store/projectStore";
// import { Character, Idea } from "../../types";
// import { StructuredChapter, Location } from "../../types/structured";
// import { CharacterModal } from "./components/CharacterModal";
// import { ChapterModal } from "./components/ChapterModal";
// import { IdeaModal } from "./components/IdeaModal";
// import LocationModal from "./components/LocationModal";

// const Sidebar: React.FC = () => {
//   const {
//     characters,
//     chapters,
//     locations,
//     ideas,
//     openTab,
//     openCharacterTab,
//     openLocationTab,
//     addCharacter,
//     addChapter,
//     addIdea,
//     addLocation,
//     projectPath,
//   } = useProjectStore();

//   // Modal states
//   const [showCharacterModal, setShowCharacterModal] = useState(false);
//   const [showChapterModal, setShowChapterModal] = useState(false);
//   const [showIdeaModal, setShowIdeaModal] = useState(false);
//   const [showLocationModal, setShowLocationModal] = useState(false);

//   // Handle clicks - type-safe
//   const handleChapterClick = (chapter: StructuredChapter) => {
//     console.log("Opening chapter:", chapter);
//     openTab(chapter);
//   };

//   const handleIdeaClick = (idea: Idea) => {
//     console.log("Opening idea:", idea);
//     openTab(idea);
//   };

//   const handleCharacterClick = (character: Character) => {
//     console.log("Opening character:", character);
//     openCharacterTab(character); // รับ Character object
//   };

//   const handleLocationClick = (location: Location) => {
//     console.log("Opening location:", location);
//     if (openLocationTab) {
//       openLocationTab(location.id); // รับ location ID
//     }
//   };

//   // Add handlers
//   const handleAddCharacter = () => {
//     setShowCharacterModal(true);
//   };

//   const handleAddChapter = () => {
//     setShowChapterModal(true);
//   };

//   const handleAddIdea = () => {
//     setShowIdeaModal(true);
//   };

//   const handleAddLocation = () => {
//     setShowLocationModal(true);
//   };

//   // Character section renderer
//   const renderCharacterSection = () => (
//     <div className="sidebar-section characters">
//       <div className="section-header">
//         <div className="section-title">
//           <Users size={16} />
//           <h3>Characters</h3>
//         </div>
//         <button
//           className="add-icon-btn"
//           onClick={handleAddCharacter}
//           title="Add Character"
//         >
//           <Plus size={14} />
//         </button>
//       </div>

//       <div className="section-items">
//         {characters.map((character) => (
//           <div
//             key={character.id}
//             className="sidebar-item"
//             onClick={() => handleCharacterClick(character)}
//           >
//             <span className="item-name">{character.name}</span>
//             {!character.active && (
//               <span className="inactive-indicator">inactive</span>
//             )}
//           </div>
//         ))}

//         {characters.length === 0 && (
//           <div className="empty-state">No characters yet</div>
//         )}

//         <button className="add-button" onClick={handleAddCharacter}>
//           <Plus size={14} />
//           Add Character
//         </button>
//       </div>
//     </div>
//   );

//   // Location section renderer
//   const renderLocationSection = () => (
//     <div className="sidebar-section locations">
//       <div className="section-header">
//         <div className="section-title">
//           <MapPin size={16} />
//           <h3>Locations</h3>
//         </div>
//         <button
//           className="add-icon-btn"
//           onClick={handleAddLocation}
//           title="Add Location"
//         >
//           <Plus size={14} />
//         </button>
//       </div>

//       <div className="section-items">
//         {locations?.map((location) => (
//           <div
//             key={location.id}
//             className="sidebar-item"
//             onClick={() => handleLocationClick(location)}
//           >
//             <span className="item-name">{location.name}</span>
//             {location.type && (
//               <span className="location-type">{location.type}</span>
//             )}
//           </div>
//         ))}

//         {(!locations || locations.length === 0) && (
//           <div className="empty-state">No locations yet</div>
//         )}

//         <button className="add-button" onClick={handleAddLocation}>
//           <Plus size={14} />
//           Add Location
//         </button>
//       </div>
//     </div>
//   );

//   // Chapter section renderer - type-safe for StructuredChapter
//   const renderChapterSection = () => (
//     <div className="sidebar-section chapters">
//       <div className="section-header">
//         <div className="section-title">
//           <BookOpen size={16} />
//           <h3>Chapters</h3>
//         </div>
//         <button
//           className="add-icon-btn"
//           onClick={handleAddChapter}
//           title="Add Chapter"
//         >
//           <Plus size={14} />
//         </button>
//       </div>

//       <div className="section-items">
//         {chapters.map((chapter) => (
//           <div
//             key={chapter.id}
//             className="sidebar-item"
//             onClick={() => handleChapterClick(chapter)}
//           >
//             <span className="item-name">
//               {`${chapter.metadata.order.toString().padStart(2, "0")}. ${
//                 chapter.metadata.title
//               }`}
//             </span>
//             {chapter.metadata.wordCount && (
//               <span className="word-count">
//                 {chapter.metadata.wordCount} words
//               </span>
//             )}
//           </div>
//         ))}

//         {chapters.length === 0 && (
//           <div className="empty-state">No chapters yet</div>
//         )}

//         <button className="add-button" onClick={handleAddChapter}>
//           <Plus size={14} />
//           Add Chapter
//         </button>
//       </div>
//     </div>
//   );

//   // Idea section renderer - type-safe for Idea
//   const renderIdeaSection = () => (
//     <div className="sidebar-section ideas">
//       <div className="section-header">
//         <div className="section-title">
//           <Lightbulb size={16} />
//           <h3>Ideas</h3>
//         </div>
//         <button
//           className="add-icon-btn"
//           onClick={handleAddIdea}
//           title="Add Idea"
//         >
//           <Plus size={14} />
//         </button>
//       </div>

//       <div className="section-items">
//         {ideas.map((idea) => (
//           <div
//             key={idea.id}
//             className="sidebar-item"
//             onClick={() => handleIdeaClick(idea)}
//           >
//             <span className="item-name">
//               {idea.filename.replace(".md", "")}
//             </span>
//           </div>
//         ))}

//         {ideas.length === 0 && <div className="empty-state">No ideas yet</div>}

//         <button className="add-button" onClick={handleAddIdea}>
//           <Plus size={14} />
//           Add Idea
//         </button>
//       </div>
//     </div>
//   );

//   if (!projectPath) {
//     return (
//       <div className="sidebar">
//         <div className="empty-project">
//           <p>No project loaded</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="sidebar">
//       {/* Project Header */}
//       <div className="project-header">
//         <div className="project-info">
//           <h2>Project</h2>
//           <span className="project-path">{projectPath.split("/").pop()}</span>
//         </div>
//       </div>

//       {/* Characters Section */}
//       {renderCharacterSection()}

//       {/* Locations Section */}
//       {renderLocationSection()}

//       {/* Chapters Section */}
//       {renderChapterSection()}

//       {/* Ideas Section */}
//       {renderIdeaSection()}

//       {/* Modals */}
//       {showCharacterModal && (
//         <CharacterModal
//           onClose={() => setShowCharacterModal(false)}
//           onSave={async (characterData) => {
//             try {
//               await addCharacter(characterData);
//               setShowCharacterModal(false);
//             } catch (error) {
//               console.error("Failed to add character:", error);
//               alert("Failed to add character. Please try again.");
//             }
//           }}
//         />
//       )}

//       {showChapterModal && (
//         <ChapterModal
//           onClose={() => setShowChapterModal(false)}
//           onSave={async (title) => {
//             try {
//               await addChapter(title);
//               setShowChapterModal(false);
//             } catch (error) {
//               console.error("Failed to add chapter:", error);
//               alert("Failed to add chapter. Please try again.");
//             }
//           }}
//         />
//       )}

//       {showIdeaModal && (
//         <IdeaModal
//           onClose={() => setShowIdeaModal(false)}
//           onSave={async (name) => {
//             try {
//               await addIdea(name);
//               setShowIdeaModal(false);
//             } catch (error) {
//               console.error("Failed to add idea:", error);
//               alert("Failed to add idea. Please try again.");
//             }
//           }}
//         />
//       )}

//       {showLocationModal && addLocation && (
//         <LocationModal
//           onClose={() => setShowLocationModal(false)}
//           onSave={async (locationData: Omit<Location, "id">) => {
//             try {
//               await addLocation(locationData);
//               setShowLocationModal(false);
//             } catch (error) {
//               console.error("Failed to add location:", error);
//               alert("Failed to add location. Please try again.");
//             }
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default Sidebar;

// src/components/Sidebar/Sidebar.tsx - แก้ให้มีปุ่มลบ chapter

// src/components/Sidebar/Sidebar.tsx - แก้ให้มีปุ่มลบ chapter

// src/components/Sidebar/Sidebar.tsx - แก้ให้มีปุ่มลบ chapter

import React, { useState, useCallback } from "react";
import { Plus, Users, BookOpen, Lightbulb, MapPin, Trash2 } from "lucide-react";
import { useProjectStore } from "../../store/projectStore";
import { useConfirm } from "../ConfirmDialogContext/ConfirmDialogContext";
import { Character, Idea } from "../../types";
import { Location, StructuredChapter } from "../../types/structured";
import { CharacterModal } from "./components/CharacterModal";
import { ChapterModal } from "./components/ChapterModal";
import { IdeaModal } from "./components/IdeaModal";
import LocationModal from "./components/LocationModal";

const Sidebar: React.FC = () => {
  const {
    projectPath,
    characters,
    chapters,
    ideas,
    locations,
    addCharacter,
    addChapter,
    addIdea,
    addLocation,
    deleteChapter,
    openTab,
    openCharacterTab,
    openLocationTab,
  } = useProjectStore();

  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const confirm = useConfirm();

  // Handle clicks
  const handleCharacterClick = (character: Character) => {
    openCharacterTab(character);
  };

  const handleChapterClick = (chapter: StructuredChapter) => {
    openTab(chapter);
  };

  const handleIdeaClick = (idea: Idea) => {
    openTab(idea);
  };

  const handleLocationClick = (location: Location) => {
    if (openLocationTab) {
      openLocationTab(location.id);
    }
  };

  // Handle chapter delete
  const handleChapterDelete = useCallback(
    async (e: React.MouseEvent, chapterId: string, chapterTitle: string) => {
      e.stopPropagation(); // ป้องกัน click เปิด chapter

      const isConfirmed = await confirm({
        title: "Delete Chapter",
        message: `Are you sure you want to delete "${chapterTitle}"? This action cannot be undone.`,
      });

      if (isConfirmed && deleteChapter) {
        try {
          const success = await deleteChapter(chapterId);
          if (!success) {
            alert("Failed to delete chapter. Please try again.");
          }
        } catch (error) {
          console.error("Failed to delete chapter:", error);
          alert("Failed to delete chapter. Please try again.");
        }
      }
    },
    [deleteChapter, confirm]
  );

  // Add handlers
  const handleAddCharacter = () => {
    setShowCharacterModal(true);
  };

  const handleAddChapter = () => {
    setShowChapterModal(true);
  };

  const handleAddIdea = () => {
    setShowIdeaModal(true);
  };

  const handleAddLocation = () => {
    setShowLocationModal(true);
  };

  // Character section renderer
  const renderCharacterSection = () => (
    <div className="sidebar-section characters">
      <div className="section-header">
        <div className="section-title">
          <Users size={16} />
          <h3>Characters</h3>
        </div>
        <button
          className="add-icon-btn"
          onClick={handleAddCharacter}
          title="Add Character"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="section-items">
        {characters.map((character) => (
          <div
            key={character.id}
            className="sidebar-item"
            onClick={() => handleCharacterClick(character)}
          >
            <span className="item-name">{character.name}</span>
            {!character.active && (
              <span className="inactive-indicator">inactive</span>
            )}
          </div>
        ))}

        {characters.length === 0 && (
          <div className="empty-state">No characters yet</div>
        )}

        <button className="add-button" onClick={handleAddCharacter}>
          <Plus size={14} />
          Add Character
        </button>
      </div>
    </div>
  );

  // Location section renderer
  const renderLocationSection = () => (
    <div className="sidebar-section locations">
      <div className="section-header">
        <div className="section-title">
          <MapPin size={16} />
          <h3>Locations</h3>
        </div>
        <button
          className="add-icon-btn"
          onClick={handleAddLocation}
          title="Add Location"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="section-items">
        {locations?.map((location) => (
          <div
            key={location.id}
            className="sidebar-item"
            onClick={() => handleLocationClick(location)}
          >
            <span className="item-name">{location.name}</span>
            {location.type && (
              <span className="location-type">{location.type}</span>
            )}
          </div>
        ))}

        {(!locations || locations.length === 0) && (
          <div className="empty-state">No locations yet</div>
        )}

        <button className="add-button" onClick={handleAddLocation}>
          <Plus size={14} />
          Add Location
        </button>
      </div>
    </div>
  );

  // Chapter section renderer - เพิ่มปุ่มลบ
  const renderChapterSection = () => (
    <div className="sidebar-section chapters">
      <div className="section-header">
        <div className="section-title">
          <BookOpen size={16} />
          <h3>Chapters</h3>
        </div>
        <button
          className="add-icon-btn"
          onClick={handleAddChapter}
          title="Add Chapter"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="section-items">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="sidebar-item chapter-item"
            onClick={() => handleChapterClick(chapter)}
          >
            <span className="item-name">
              {`${chapter.metadata.order.toString().padStart(2, "0")}. ${
                chapter.metadata.title
              }`}
            </span>
            <div className="item-actions">
              {chapter.metadata.wordCount && (
                <span className="word-count">
                  ({chapter.metadata.wordCount})
                </span>
              )}
              <button
                className="delete-btn"
                onClick={(e) =>
                  handleChapterDelete(e, chapter.id, chapter.metadata.title)
                }
                title="Delete chapter"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        {chapters.length === 0 && (
          <div className="empty-state">No chapters yet</div>
        )}

        <button className="add-button" onClick={handleAddChapter}>
          <Plus size={14} />
          Add Chapter
        </button>
      </div>
    </div>
  );

  // Idea section renderer
  const renderIdeaSection = () => (
    <div className="sidebar-section ideas">
      <div className="section-header">
        <div className="section-title">
          <Lightbulb size={16} />
          <h3>Ideas</h3>
        </div>
        <button
          className="add-icon-btn"
          onClick={handleAddIdea}
          title="Add Idea"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="section-items">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="sidebar-item"
            onClick={() => handleIdeaClick(idea)}
          >
            <span className="item-name">
              {idea.filename.replace(".md", "")}
            </span>
          </div>
        ))}

        {ideas.length === 0 && <div className="empty-state">No ideas yet</div>}

        <button className="add-button" onClick={handleAddIdea}>
          <Plus size={14} />
          Add Idea
        </button>
      </div>
    </div>
  );

  if (!projectPath) {
    return (
      <div className="sidebar">
        <div className="empty-project">
          <p>No project loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      {/* Project Header */}
      <div className="project-header">
        <div className="project-info">
          <h2>Project</h2>
          <span className="project-path">{projectPath.split("/").pop()}</span>
        </div>
      </div>

      {/* Characters Section */}
      {renderCharacterSection()}

      {/* Locations Section */}
      {renderLocationSection()}

      {/* Chapters Section */}
      {renderChapterSection()}

      {/* Ideas Section */}
      {renderIdeaSection()}

      {/* Modals */}
      {showCharacterModal && (
        <CharacterModal
          onClose={() => setShowCharacterModal(false)}
          onSave={async (characterData) => {
            try {
              await addCharacter(characterData);
              setShowCharacterModal(false);
            } catch (error) {
              console.error("Failed to add character:", error);
              alert("Failed to add character. Please try again.");
            }
          }}
        />
      )}

      {showChapterModal && (
        <ChapterModal
          onClose={() => setShowChapterModal(false)}
          onSave={async (chapterData) => {
            try {
              await addChapter(chapterData);
              setShowChapterModal(false);
            } catch (error) {
              console.error("Failed to add chapter:", error);
              alert("Failed to add chapter. Please try again.");
            }
          }}
        />
      )}

      {showIdeaModal && (
        <IdeaModal
          onClose={() => setShowIdeaModal(false)}
          onSave={async (ideaData) => {
            try {
              await addIdea(ideaData);
              setShowIdeaModal(false);
            } catch (error) {
              console.error("Failed to add idea:", error);
              alert("Failed to add idea. Please try again.");
            }
          }}
        />
      )}

      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onSave={async (locationData) => {
            try {
              await addLocation?.(locationData);
              setShowLocationModal(false);
            } catch (error) {
              console.error("Failed to add location:", error);
              alert("Failed to add location. Please try again.");
            }
          }}
        />
      )}
    </div>
  );
};

export default Sidebar;
