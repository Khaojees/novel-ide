// src/store/projectStore.ts - Updated for Structured Content
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  StructuredChapter,
  Location,
  ContentNode,
  ContentStats,
} from "../types/structured";
import {
  renderNodesToText,
  calculateContentStats,
  replaceCharacterInNodes,
  replaceLocationInNodes,
} from "../utils/contentUtils";
import { Character, CharacterUsage, Tab, Project } from "../types";

interface ProjectState {
  // Basic project data
  project: Project | null;
  projectPath: string | null;

  // Content
  characters: Character[];
  locations: Location[]; // NEW!
  chapters: StructuredChapter[]; // CHANGED!
  ideas: any[]; // Keep as is for now

  // Editor state
  openTabs: Tab[];
  activeTab: string | null;
  currentContent: string;
  isContentModified: boolean;

  // Actions
  setProject: (project: Project, path: string) => void;

  // Character management
  addCharacter: (character: Omit<Character, "id">) => Promise<void>;
  updateCharacter: (id: string, updates: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<boolean>;
  getCharacterUsage: (characterId: string) => CharacterUsage[];

  // Location management (NEW!)
  addLocation: (location: Omit<Location, "id">) => Promise<void>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<boolean>;
  getLocationUsage: (locationId: string) => any[];

  // Chapter management (UPDATED!)
  addChapter: (title: string) => Promise<void>;
  updateChapterContent: (id: string, nodes: ContentNode[]) => Promise<void>;
  deleteChapter: (id: string) => Promise<boolean>;
  getChapterStats: (id: string) => ContentStats;

  // Tab management
  openTab: (type: string, id: string, title: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  openCharacterTab: (characterId: string) => void;
  openLocationTab: (locationId: string) => void; // NEW!

  // Content operations
  updateContent: (content: string) => void;
  saveCurrentFile: () => Promise<void>;

  // Utilities
  loadProject: (path: string) => Promise<boolean>;
  saveProject: () => Promise<boolean>;
  createNewProject: (name: string, path: string) => Promise<boolean>;
}

// Helper function to get file API
const getFileAPI = (): FileAPI => {
  if (typeof window !== "undefined" && window.electronAPI) {
    return window.electronAPI.fileAPI;
  }

  // Mock API for browser testing
  return {
    readFile: async (path: string) => ({ success: true, data: "" }),
    writeFile: async (path: string, data: string) => ({ success: true }),
    createDirectory: async (path: string) => ({ success: true }),
    exists: async (path: string) => ({ success: true, exists: true }),
    readDirectory: async (path: string) => ({ success: true, files: [] }),
    deleteFile: async (path: string) => ({ success: true }),
  };
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      project: null,
      projectPath: null,
      characters: [],
      locations: [], // NEW!
      chapters: [],
      ideas: [],
      openTabs: [],
      activeTab: null,
      currentContent: "",
      isContentModified: false,

      // ========================================
      // PROJECT MANAGEMENT
      // ========================================

      setProject: (project: Project, path: string) => {
        set({ project, projectPath: path });
      },

      createNewProject: async (
        name: string,
        path: string
      ): Promise<boolean> => {
        const fileAPI = getFileAPI();

        try {
          // Create project structure
          const folders = [
            "characters",
            "chapters",
            "locations", // NEW!
            "ideas",
            "world",
            "assets",
            "archive",
          ];

          for (const folder of folders) {
            const folderPath = `${path}/${folder}`;
            const result = await fileAPI.createDirectory(folderPath);
            if (!result.success) {
              throw new Error(`Failed to create folder: ${folder}`);
            }
          }

          // Create initial files
          const initialCharacters = { characters: [] };
          const initialLocations = { locations: [] }; // NEW!

          await fileAPI.writeFile(
            `${path}/characters/characters.json`,
            JSON.stringify(initialCharacters, null, 2)
          );

          await fileAPI.writeFile(
            `${path}/locations/locations.json`, // NEW!
            JSON.stringify(initialLocations, null, 2)
          );

          const project: Project = {
            name,
            version: "2.0", // NEW VERSION!
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            settings: {
              theme: "dark",
              fontSize: 16,
              fontFamily: "system",
              autoSave: true,
              autoSaveInterval: 30000,
            },
          };

          await fileAPI.writeFile(
            `${path}/project.json`,
            JSON.stringify(project, null, 2)
          );

          set({
            project,
            projectPath: path,
            characters: [],
            locations: [],
            chapters: [],
            ideas: [],
          });

          return true;
        } catch (error) {
          console.error("Error creating project:", error);
          return false;
        }
      },

      loadProject: async (path: string): Promise<boolean> => {
        const fileAPI = getFileAPI();

        try {
          // Load project config
          const projectResult = await fileAPI.readFile(`${path}/project.json`);
          if (!projectResult.success) {
            throw new Error("Project file not found");
          }

          const project = JSON.parse(projectResult.data);

          // Load characters
          const charactersResult = await fileAPI.readFile(
            `${path}/characters/characters.json`
          );
          const characters = charactersResult.success
            ? JSON.parse(charactersResult.data).characters
            : [];

          // Load locations (NEW!)
          const locationsResult = await fileAPI.readFile(
            `${path}/locations/locations.json`
          );
          const locations = locationsResult.success
            ? JSON.parse(locationsResult.data).locations
            : [];

          // Load chapters (NEW FORMAT!)
          const chaptersDir = await fileAPI.readDirectory(`${path}/chapters`);
          const chapters: StructuredChapter[] = [];

          if (chaptersDir.success) {
            for (const filename of chaptersDir.files) {
              if (filename.endsWith(".json")) {
                const chapterResult = await fileAPI.readFile(
                  `${path}/chapters/${filename}`
                );
                if (chapterResult.success) {
                  const chapterData = JSON.parse(chapterResult.data);
                  chapters.push(chapterData);
                }
              }
            }
          }

          // Sort chapters by order
          chapters.sort((a, b) => a.metadata.order - b.metadata.order);

          set({
            project,
            projectPath: path,
            characters,
            locations,
            chapters,
            openTabs: [],
            activeTab: null,
          });

          return true;
        } catch (error) {
          console.error("Error loading project:", error);
          return false;
        }
      },

      // ========================================
      // LOCATION MANAGEMENT (NEW!)
      // ========================================

      addLocation: async (
        locationData: Omit<Location, "id">
      ): Promise<void> => {
        const { locations, projectPath } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return;

        const newLocation: Location = {
          ...locationData,
          id:
            locationData.name.toLowerCase().replace(/\s+/g, "-") +
            "-" +
            Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedLocations = [...locations, newLocation];
        const locationsData = { locations: updatedLocations };

        try {
          const locationsPath = `${projectPath}/locations/locations.json`;
          const result = await fileAPI.writeFile(
            locationsPath,
            JSON.stringify(locationsData, null, 2)
          );

          if (!result.success) {
            throw new Error(`Failed to save locations: ${result.error}`);
          }

          set({ locations: updatedLocations });
          console.log("Location added successfully!");
        } catch (error) {
          console.error("Error adding location:", error);
          throw error;
        }
      },

      updateLocation: async (
        id: string,
        updates: Partial<Location>
      ): Promise<void> => {
        const { locations, projectPath, chapters } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return;

        const oldLocation = locations.find((loc) => loc.id === id);
        if (!oldLocation) return;

        const newLocation = {
          ...oldLocation,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        const updatedLocations = locations.map((loc) =>
          loc.id === id ? newLocation : loc
        );

        // Update chapters if location name changed
        if (oldLocation.name !== newLocation.name) {
          const updatedChapters = chapters.map((chapter) => ({
            ...chapter,
            content: replaceLocationInNodes(chapter.content, id, id), // This will trigger re-render
            metadata: {
              ...chapter.metadata,
              updatedAt: new Date().toISOString(),
            },
          }));

          // Save updated chapters
          for (const chapter of updatedChapters) {
            const chapterPath = `${projectPath}/chapters/${chapter.filename}`;
            await fileAPI.writeFile(
              chapterPath,
              JSON.stringify(chapter, null, 2)
            );
          }

          set({ chapters: updatedChapters });
        }

        // Save locations
        const locationsData = { locations: updatedLocations };
        const locationsPath = `${projectPath}/locations/locations.json`;
        const result = await fileAPI.writeFile(
          locationsPath,
          JSON.stringify(locationsData, null, 2)
        );

        if (!result.success) {
          throw new Error(`Failed to update location: ${result.error}`);
        }

        set({ locations: updatedLocations });
        console.log("Location updated successfully!");
      },

      deleteLocation: async (id: string): Promise<boolean> => {
        const { locations, projectPath } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return false;

        // Check if location is in use
        const usage = get().getLocationUsage(id);
        if (usage.length > 0) {
          console.warn(`Cannot delete location: used in ${usage.length} files`);
          return false;
        }

        const updatedLocations = locations.filter((loc) => loc.id !== id);
        const locationsData = { locations: updatedLocations };

        try {
          const locationsPath = `${projectPath}/locations/locations.json`;
          const result = await fileAPI.writeFile(
            locationsPath,
            JSON.stringify(locationsData, null, 2)
          );

          if (!result.success) {
            throw new Error(`Failed to delete location: ${result.error}`);
          }

          set({ locations: updatedLocations });
          console.log("Location deleted successfully!");
          return true;
        } catch (error) {
          console.error("Error deleting location:", error);
          return false;
        }
      },

      getLocationUsage: (locationId: string): any[] => {
        const { chapters } = get();
        const usage: any[] = [];

        chapters.forEach((chapter) => {
          const locationNodes = chapter.content.filter(
            (node) => node.type === "location" && node.locationId === locationId
          );

          if (locationNodes.length > 0) {
            usage.push({
              id: chapter.id,
              type: "chapter",
              title: chapter.metadata.title,
              filename: chapter.filename,
              mentions: locationNodes.length,
            });
          }
        });

        return usage;
      },

      // ========================================
      // CHAPTER MANAGEMENT (UPDATED!)
      // ========================================

      addChapter: async (title: string): Promise<void> => {
        const { chapters, projectPath } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return;

        const nextOrder =
          Math.max(...chapters.map((c) => c.metadata.order), 0) + 1;
        const filename = `${nextOrder.toString().padStart(3, "0")}-${title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}.json`;

        const newChapter: StructuredChapter = {
          id: filename.replace(".json", ""),
          filename,
          path: `${projectPath}/chapters/${filename}`,
          version: "2.0",
          metadata: {
            order: nextOrder,
            title,
            tags: [],
            characters: [],
            locations: [],
            wordCount: 0,
            characterCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          content: [
            {
              id: "heading-1",
              type: "text",
              content: `# ${title}\n\nStart writing your chapter here...`,
              createdAt: new Date().toISOString(),
            },
          ],
        };

        try {
          const result = await fileAPI.writeFile(
            newChapter.path,
            JSON.stringify(newChapter, null, 2)
          );

          if (!result.success) {
            throw new Error(`Failed to create chapter: ${result.error}`);
          }

          const updatedChapters = [...chapters, newChapter].sort(
            (a, b) => a.metadata.order - b.metadata.order
          );

          set({ chapters: updatedChapters });
          console.log("Chapter added successfully!");
        } catch (error) {
          console.error("Error adding chapter:", error);
          throw error;
        }
      },

      updateChapterContent: async (
        id: string,
        nodes: ContentNode[]
      ): Promise<void> => {
        const { chapters, projectPath, characters, locations } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return;

        const chapter = chapters.find((c) => c.id === id);
        if (!chapter) return;

        // Calculate stats
        const stats = calculateContentStats(nodes, characters, locations);
        const textContent = renderNodesToText(nodes, characters, locations);

        // Extract used characters and locations
        const usedCharacters = [
          ...new Set(
            nodes
              .filter((node) => node.type === "character")
              .map((node) => node.characterId)
          ),
        ];

        const usedLocations = [
          ...new Set(
            nodes
              .filter((node) => node.type === "location")
              .map((node) => node.locationId)
          ),
        ];

        const updatedChapter: StructuredChapter = {
          ...chapter,
          content: nodes,
          metadata: {
            ...chapter.metadata,
            characters: usedCharacters,
            locations: usedLocations,
            wordCount: stats.totalWords,
            characterCount: stats.totalCharacters,
            updatedAt: new Date().toISOString(),
          },
        };

        try {
          const result = await fileAPI.writeFile(
            chapter.path,
            JSON.stringify(updatedChapter, null, 2)
          );

          if (!result.success) {
            throw new Error(`Failed to update chapter: ${result.error}`);
          }

          const updatedChapters = chapters.map((c) =>
            c.id === id ? updatedChapter : c
          );

          set({ chapters: updatedChapters });
          console.log("Chapter updated successfully!");
        } catch (error) {
          console.error("Error updating chapter:", error);
          throw error;
        }
      },

      deleteChapter: async (id: string): Promise<boolean> => {
        const { chapters, projectPath, openTabs } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return false;

        const chapter = chapters.find((c) => c.id === id);
        if (!chapter) return false;

        try {
          const result = await fileAPI.deleteFile(chapter.path);
          if (!result.success) {
            throw new Error(`Failed to delete chapter: ${result.error}`);
          }

          const updatedChapters = chapters.filter((c) => c.id !== id);
          const updatedTabs = openTabs.filter((tab) => tab.id !== id);

          set({
            chapters: updatedChapters,
            openTabs: updatedTabs,
            activeTab: updatedTabs.length > 0 ? updatedTabs[0].id : null,
          });

          console.log("Chapter deleted successfully!");
          return true;
        } catch (error) {
          console.error("Error deleting chapter:", error);
          return false;
        }
      },

      getChapterStats: (id: string): ContentStats => {
        const { chapters, characters, locations } = get();
        const chapter = chapters.find((c) => c.id === id);

        if (!chapter) {
          return {
            totalWords: 0,
            totalCharacters: 0,
            characterUsage: {},
            locationUsage: {},
            dialoguePercentage: 0,
            narrativePercentage: 0,
            actionPercentage: 0,
          };
        }

        return calculateContentStats(chapter.content, characters, locations);
      },

      // ========================================
      // CHARACTER MANAGEMENT (UPDATED!)
      // ========================================

      addCharacter: async (
        characterData: Omit<Character, "id">
      ): Promise<void> => {
        const { characters, projectPath } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return;

        const newCharacter: Character = {
          ...characterData,
          id:
            characterData.name.toLowerCase().replace(/\s+/g, "-") +
            "-" +
            Date.now(),
        };

        const updatedCharacters = [...characters, newCharacter];
        const charactersData = { characters: updatedCharacters };

        try {
          const charactersPath = `${projectPath}/characters/characters.json`;
          const result = await fileAPI.writeFile(
            charactersPath,
            JSON.stringify(charactersData, null, 2)
          );

          if (!result.success) {
            throw new Error(`Failed to save characters: ${result.error}`);
          }

          set({ characters: updatedCharacters });
          console.log("Character added successfully!");
        } catch (error) {
          console.error("Error adding character:", error);
          throw error;
        }
      },

      updateCharacter: async (
        id: string,
        updates: Partial<Character>
      ): Promise<void> => {
        const { characters, projectPath, chapters } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return;

        const oldCharacter = characters.find((char) => char.id === id);
        if (!oldCharacter) return;

        const newCharacter = { ...oldCharacter, ...updates };
        const updatedCharacters = characters.map((char) =>
          char.id === id ? newCharacter : char
        );

        // Update chapters if character name changed
        if (oldCharacter.name !== newCharacter.name) {
          const updatedChapters = chapters.map((chapter) => ({
            ...chapter,
            content: replaceCharacterInNodes(chapter.content, id, id), // This will trigger re-render
            metadata: {
              ...chapter.metadata,
              updatedAt: new Date().toISOString(),
            },
          }));

          // Save updated chapters
          for (const chapter of updatedChapters) {
            const chapterPath = `${projectPath}/chapters/${chapter.filename}`;
            await fileAPI.writeFile(
              chapterPath,
              JSON.stringify(chapter, null, 2)
            );
          }

          set({ chapters: updatedChapters });
        }

        // Save characters
        const charactersData = { characters: updatedCharacters };
        const charactersPath = `${projectPath}/characters/characters.json`;
        const result = await fileAPI.writeFile(
          charactersPath,
          JSON.stringify(charactersData, null, 2)
        );

        if (!result.success) {
          throw new Error(`Failed to update character: ${result.error}`);
        }

        set({ characters: updatedCharacters });
        console.log("Character updated successfully!");
      },

      deleteCharacter: async (id: string): Promise<boolean> => {
        const { characters, projectPath } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return false;

        // Check if character is in use
        const usage = get().getCharacterUsage(id);
        if (usage.length > 0) {
          console.warn(
            `Cannot delete character: used in ${usage.length} files`
          );
          return false;
        }

        const updatedCharacters = characters.filter((char) => char.id !== id);
        const charactersData = { characters: updatedCharacters };

        try {
          const charactersPath = `${projectPath}/characters/characters.json`;
          const result = await fileAPI.writeFile(
            charactersPath,
            JSON.stringify(charactersData, null, 2)
          );

          if (!result.success) {
            throw new Error(`Failed to delete character: ${result.error}`);
          }

          set({ characters: updatedCharacters });
          console.log("Character deleted successfully!");
          return true;
        } catch (error) {
          console.error("Error deleting character:", error);
          return false;
        }
      },

      getCharacterUsage: (characterId: string): CharacterUsage[] => {
        const { chapters } = get();
        const usage: CharacterUsage[] = [];

        chapters.forEach((chapter) => {
          const characterNodes = chapter.content.filter(
            (node) =>
              node.type === "character" && node.characterId === characterId
          );

          if (characterNodes.length > 0) {
            usage.push({
              id: chapter.id,
              type: "chapter",
              filename: chapter.filename,
              title: chapter.metadata.title,
              usageType: "structured",
              mentions: characterNodes.length,
            });
          }
        });

        return usage;
      },

      // ========================================
      // TAB MANAGEMENT (UPDATED!)
      // ========================================

      openTab: (type: string, id: string, title: string) => {
        const { openTabs } = get();
        const existingTab = openTabs.find((tab) => tab.id === id);

        if (existingTab) {
          set({ activeTab: id });
          return;
        }

        const newTab: Tab = {
          id,
          type: type as any,
          title,
          modified: false,
        };

        set({
          openTabs: [...openTabs, newTab],
          activeTab: id,
        });
      },

      closeTab: (id: string) => {
        const { openTabs, activeTab } = get();
        const updatedTabs = openTabs.filter((tab) => tab.id !== id);

        let newActiveTab = activeTab;
        if (activeTab === id) {
          newActiveTab = updatedTabs.length > 0 ? updatedTabs[0].id : null;
        }

        set({
          openTabs: updatedTabs,
          activeTab: newActiveTab,
        });
      },

      setActiveTab: (id: string) => {
        set({ activeTab: id });
      },

      openCharacterTab: (characterId: string) => {
        const { characters } = get();
        const character = characters.find((c) => c.id === characterId);
        if (character) {
          get().openTab("character", characterId, character.name);
        }
      },

      openLocationTab: (locationId: string) => {
        // NEW!
        const { locations } = get();
        const location = locations.find((l) => l.id === locationId);
        if (location) {
          get().openTab("location", locationId, location.name);
        }
      },

      // ========================================
      // CONTENT OPERATIONS (SIMPLIFIED!)
      // ========================================

      updateContent: (content: string) => {
        set({ currentContent: content, isContentModified: true });
      },

      saveCurrentFile: async () => {
        const { activeTab, openTabs } = get();
        if (!activeTab) return;

        const tab = openTabs.find((t) => t.id === activeTab);
        if (!tab) return;

        // For structured chapters, this will be handled by updateChapterContent
        // For characters/locations, handled by their respective update functions

        const updatedTabs = openTabs.map((t) =>
          t.id === activeTab ? { ...t, modified: false } : t
        );

        set({
          openTabs: updatedTabs,
          isContentModified: false,
        });

        console.log("File saved successfully!");
      },

      saveProject: async (): Promise<boolean> => {
        const { project, projectPath } = get();
        if (!project || !projectPath) return false;

        const fileAPI = getFileAPI();

        try {
          const updatedProject = {
            ...project,
            updatedAt: new Date().toISOString(),
          };

          const result = await fileAPI.writeFile(
            `${projectPath}/project.json`,
            JSON.stringify(updatedProject, null, 2)
          );

          if (result.success) {
            set({ project: updatedProject });
            return true;
          }

          return false;
        } catch (error) {
          console.error("Error saving project:", error);
          return false;
        }
      },
    }),
    {
      name: "project-store",
      partialize: (state) => ({
        project: state.project,
        projectPath: state.projectPath,
        openTabs: state.openTabs,
        activeTab: state.activeTab,
      }),
    }
  )
);
