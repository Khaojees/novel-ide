// src/store/projectStore.ts - Complete Enhanced Version
import { create } from "zustand";
import {
  Character,
  Chapter,
  Idea,
  Tab,
  ProjectState,
  CharacterUsage,
} from "../types";
import {
  StructuredChapter,
  Location,
  ContentNode,
  ContentStats,
} from "../types/structured";
import { mockFileAPI } from "../api/mockFileAPI";

const getFileAPI = () => window.electronAPI || mockFileAPI;

// Extended ProjectState interface
interface ExtendedProjectState
  extends Omit<ProjectState, "chapters" | "openTab" | "openCharacterTab"> {
  chapters: StructuredChapter[];
  locations: Location[];

  openTab: (item: Chapter | Idea | StructuredChapter) => void;
  openTabById: (type: string, id: string, title: string) => void;
  openCharacterTab: (character: Character) => void;
  openCharacterTabById: (characterId: string) => void;
  openLocationTab?: (locationId: string) => void;

  updateChapterContent?: (id: string, nodes: ContentNode[]) => Promise<void>;
  getChapterStats?: (id: string) => ContentStats;

  addLocation?: (location: Omit<Location, "id">) => Promise<void>;
  updateLocation?: (id: string, updates: Partial<Location>) => Promise<void>;
  deleteLocation?: (id: string) => Promise<boolean>;
  getLocationUsage?: (locationId: string) => any[];
  deleteChapter?: (id: string) => Promise<boolean>;
}

export const useProjectStore = create<ExtendedProjectState>((set, get) => ({
  // Project data
  projectPath: null,
  characters: [],
  chapters: [],
  locations: [],
  ideas: [],

  // Editor state
  openTabs: [],
  activeTab: null,
  currentContent: "",
  isContentModified: false,

  setProjectPath: (path: string) => {
    set({ projectPath: path });
  },

  clearProject: () => {
    set({
      projectPath: null,
      characters: [],
      chapters: [],
      locations: [],
      ideas: [],
      openTabs: [],
      activeTab: null,
      currentContent: "",
      isContentModified: false,
    });
  },

  createNewProject: async (projectDir: string): Promise<void> => {
    const fileAPI = getFileAPI();

    try {
      const directories = [
        `${projectDir}/characters`,
        `${projectDir}/chapters`,
        `${projectDir}/ideas`,
        `${projectDir}/world`,
        `${projectDir}/locations`,
        `${projectDir}/snippets`,
        `${projectDir}/assets`,
        `${projectDir}/archive`,
      ];

      for (const dir of directories) {
        const result = await fileAPI.createDirectory(dir);
        if (!result.success) {
          throw new Error(`Failed to create directory ${dir}: ${result.error}`);
        }
      }

      const charactersData = { characters: [] };
      const locationsData = { locations: [] };

      const charactersPath = `${projectDir}/characters/characters.json`;
      const locationsPath = `${projectDir}/locations/locations.json`;

      const charactersResult = await fileAPI.writeFile(
        charactersPath,
        JSON.stringify(charactersData, null, 2)
      );

      const locationsResult = await fileAPI.writeFile(
        locationsPath,
        JSON.stringify(locationsData, null, 2)
      );

      if (!charactersResult.success) {
        throw new Error(
          `Failed to create characters file: ${charactersResult.error}`
        );
      }

      if (!locationsResult.success) {
        throw new Error(
          `Failed to create locations file: ${locationsResult.error}`
        );
      }

      set({ projectPath: projectDir });
      await get().loadProject(projectDir);

      console.log("New project created successfully!");
    } catch (error) {
      console.error("Error creating new project:", error);
      throw error;
    }
  },

  loadProject: async (projectDir: string): Promise<void> => {
    const fileAPI = getFileAPI();

    try {
      set({ projectPath: projectDir });

      // Load characters
      const charactersPath = `${projectDir}/characters/characters.json`;
      const charactersResult = await fileAPI.readFile(charactersPath);
      let characters: Character[] = [];

      if (charactersResult.success && charactersResult.content) {
        try {
          const charactersData = JSON.parse(charactersResult.content);
          characters = charactersData.characters || [];
        } catch (parseError) {
          console.error("Error parsing characters.json:", parseError);
        }
      }

      // Load locations
      const locationsPath = `${projectDir}/locations/locations.json`;
      const locationsResult = await fileAPI.readFile(locationsPath);
      let locations: Location[] = [];

      if (locationsResult.success && locationsResult.content) {
        try {
          const locationsData = JSON.parse(locationsResult.content);
          locations = locationsData.locations || [];
        } catch (parseError) {
          console.error("Error parsing locations.json:", parseError);
        }
      }

      // Load chapters - support both .md and .json
      const chaptersDir = `${projectDir}/chapters`;
      const chaptersResult = await fileAPI.readDirectory(chaptersDir);
      let chapters: StructuredChapter[] = [];

      if (chaptersResult.success && chaptersResult.files) {
        const chapterFiles = chaptersResult.files.filter(
          (f) => f.endsWith(".md") || f.endsWith(".json")
        );

        for (const filename of chapterFiles) {
          const filePath = `${chaptersDir}/${filename}`;
          const fileResult = await fileAPI.readFile(filePath);

          if (fileResult.success && fileResult.content) {
            if (filename.endsWith(".json")) {
              try {
                const structuredChapter = JSON.parse(fileResult.content);
                chapters.push(structuredChapter);
              } catch (parseError) {
                console.error(`Error parsing ${filename}:`, parseError);
              }
            } else {
              const legacyChapter = convertMarkdownToStructured(
                filename,
                filePath,
                fileResult.content
              );
              chapters.push(legacyChapter);
            }
          }
        }

        chapters.sort((a, b) => a.metadata.order - b.metadata.order);
      }

      // Load ideas
      const ideasDir = `${projectDir}/ideas`;
      const ideasResult = await fileAPI.readDirectory(ideasDir);
      let ideas: Idea[] = [];

      if (ideasResult.success && ideasResult.files) {
        const mdFiles = ideasResult.files.filter((f) => f.endsWith(".md"));

        for (const filename of mdFiles) {
          const filePath = `${ideasDir}/${filename}`;
          const fileResult = await fileAPI.readFile(filePath);

          if (fileResult.success && fileResult.content) {
            ideas.push({
              id: filename.replace(".md", ""),
              filename,
              path: filePath,
              content: fileResult.content,
            });
          }
        }
      }

      set({
        characters,
        locations,
        chapters,
        ideas,
        openTabs: [],
        activeTab: null,
      });

      if (chapters.length > 0) {
        get().openTab(chapters[0]);
      }

      console.log("Project loaded successfully!");
      console.log(`- Characters: ${characters.length}`);
      console.log(`- Locations: ${locations.length}`);
      console.log(`- Chapters: ${chapters.length}`);
      console.log(`- Ideas: ${ideas.length}`);
    } catch (error) {
      console.error("Error loading project:", error);
      throw error;
    }
  },

  // Tab management
  openTab: (item: Chapter | Idea | StructuredChapter) => {
    const { openTabs } = get();
    const existingTab = openTabs.find((tab) => tab.id === item.id);

    if (existingTab) {
      set({
        activeTab: existingTab.id,
        currentContent: existingTab.content,
      });
    } else {
      const newTab: Tab = {
        id: item.id,
        name:
          "metadata" in item
            ? item.metadata.title
            : "title" in item
            ? item.title
            : item.filename.replace(".md", ""),
        type:
          "metadata" in item ? "chapter" : "title" in item ? "chapter" : "idea",
        path: item.path,
        content:
          "content" in item
            ? typeof item.content === "string"
              ? item.content
              : JSON.stringify(item.content, null, 2)
            : "",
        modified: false,
      };

      set({
        openTabs: [...openTabs, newTab],
        activeTab: newTab.id,
        currentContent: newTab.content,
        isContentModified: false,
      });
    }
  },

  openTabById: (type: string, id: string, title: string) => {
    const { openTabs } = get();
    const existingTab = openTabs.find((tab) => tab.id === id);

    if (existingTab) {
      set({ activeTab: id });
      return;
    }

    const newTab: Tab = {
      id,
      name: title,
      type: type as any,
      path: "",
      content: "",
      modified: false,
    };

    set({
      openTabs: [...openTabs, newTab],
      activeTab: id,
      isContentModified: false,
    });
  },

  openCharacterTab: (character: Character) => {
    const { openTabs } = get();
    const existingTab = openTabs.find((tab) => tab.id === character.id);

    if (existingTab) {
      set({
        activeTab: existingTab.id,
        currentContent: "",
      });
    } else {
      const newTab: Tab = {
        id: character.id,
        name: character.names.fullname,
        type: "character",
        path: "",
        content: "",
        modified: false,
        characterData: character,
      };

      set({
        openTabs: [...openTabs, newTab],
        activeTab: newTab.id,
        currentContent: "",
        isContentModified: false,
      });
    }
  },

  openCharacterTabById: (characterId: string) => {
    const { characters } = get();
    const character = characters.find((c) => c.id === characterId);
    if (character) {
      get().openCharacterTab(character);
    }
  },

  openLocationTab: (locationId: string) => {
    const { locations } = get();
    const location = locations.find((l) => l.id === locationId);
    if (location) {
      get().openTabById("location", locationId, location.names?.fullname);
    }
  },

  closeTab: (tabId: string) => {
    const { openTabs, activeTab } = get();
    const updatedTabs = openTabs.filter((tab) => tab.id !== tabId);

    let newActiveTab = activeTab;
    if (activeTab === tabId) {
      newActiveTab = updatedTabs.length > 0 ? updatedTabs[0].id : null;
    }

    set({
      openTabs: updatedTabs,
      activeTab: newActiveTab,
      currentContent: newActiveTab
        ? updatedTabs.find((t) => t.id === newActiveTab)?.content || ""
        : "",
      isContentModified: false,
    });
  },

  updateContent: (content: string) => {
    const { openTabs, activeTab } = get();

    if (activeTab) {
      const updatedTabs = openTabs.map((tab) =>
        tab.id === activeTab ? { ...tab, content, modified: true } : tab
      );

      set({
        openTabs: updatedTabs,
        currentContent: content,
        isContentModified: true,
      });
    }
  },

  saveCurrentFile: async (): Promise<void> => {
    const { openTabs, activeTab, projectPath } = get();
    const fileAPI = getFileAPI();

    if (!activeTab || !projectPath) return;

    const activeTabData = openTabs.find((tab) => tab.id === activeTab);
    if (!activeTabData || !activeTabData.modified) return;

    try {
      const result = await fileAPI.writeFile(
        activeTabData.path,
        activeTabData.content
      );
      if (!result.success) {
        throw new Error(`Failed to save file: ${result.error}`);
      }

      const updatedTabs = openTabs.map((tab) =>
        tab.id === activeTab ? { ...tab, modified: false } : tab
      );

      set({
        openTabs: updatedTabs,
        isContentModified: false,
      });

      console.log("File saved successfully!");
    } catch (error) {
      console.error("Error saving file:", error);
      throw error;
    }
  },

  // Character management
  addCharacter: async (character: Omit<Character, "id">): Promise<void> => {
    const { characters, projectPath } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return;

    const newCharacter: Character = {
      ...character,
      id:
        character.names.fullname.toLowerCase().replace(/\s+/g, "-") +
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
    const { characters, projectPath, openTabs } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return;

    const updatedCharacters = characters.map((char) =>
      char.id === id ? { ...char, ...updates } : char
    );

    const charactersData = { characters: updatedCharacters };

    try {
      const charactersPath = `${projectPath}/characters/characters.json`;
      const result = await fileAPI.writeFile(
        charactersPath,
        JSON.stringify(charactersData, null, 2)
      );

      if (!result.success) {
        throw new Error(`Failed to update character: ${result.error}`);
      }

      const updatedTabs = openTabs.map((tab) =>
        tab.type === "character" && tab.id === id
          ? {
              ...tab,
              characterData: updatedCharacters.find((c) => c.id === id),
              modified: false,
            }
          : tab
      );

      set({
        characters: updatedCharacters,
        openTabs: updatedTabs,
      });

      console.log("Character updated successfully!");
    } catch (error) {
      console.error("Error updating character:", error);
      throw error;
    }
  },

  deleteCharacter: async (id: string): Promise<boolean> => {
    const { characters, projectPath, openTabs } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return false;

    const usage = get().getCharacterUsage(id);
    if (usage.length > 0) {
      console.warn(`Cannot delete character: used in ${usage.length} files`);
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

      const updatedTabs = openTabs.filter(
        (tab) => !(tab.type === "character" && tab.id === id)
      );
      const newActiveTab = updatedTabs.length > 0 ? updatedTabs[0].id : null;

      set({
        characters: updatedCharacters,
        openTabs: updatedTabs,
        activeTab: newActiveTab,
      });

      console.log("Character deleted successfully!");
      return true;
    } catch (error) {
      console.error("Error deleting character:", error);
      return false;
    }
  },

  getCharacterUsage: (characterId: string): CharacterUsage[] => {
    const { characters, chapters, ideas } = get();
    const character = characters.find((c) => c.id === characterId);
    if (!character) return [];

    const usage: CharacterUsage[] = [];

    chapters.forEach((chapter) => {
      if (
        chapter.metadata.characters.includes(characterId) ||
        chapter.metadata.characters.includes(character.names.fullname)
      ) {
        usage.push({
          id: chapter.id,
          type: "chapter",
          filename: chapter.filename,
          title: chapter.metadata.title,
          usageType: "frontmatter",
        });
      }

      const characterNodes = chapter.content.filter(
        (node: any) =>
          node.type === "character" && node.characterId === characterId
      );

      if (characterNodes.length > 0) {
        usage.push({
          id: chapter.id,
          type: "chapter",
          filename: chapter.filename,
          title: chapter.metadata.title,
          usageType: "dialogue",
          context: `${characterNodes.length} mentions`,
        });
      }
    });

    ideas.forEach((idea) => {
      if (idea.content.includes(character.names.fullname)) {
        usage.push({
          id: idea.id,
          type: "idea",
          filename: idea.filename,
          title: idea.filename.replace(".md", ""),
          usageType: "narrative",
        });
      }
    });

    return usage;
  },

  // Chapter management
  addChapter: async (title: string): Promise<void> => {
    const { chapters, projectPath } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return;

    const nextOrder = Math.max(...chapters.map((c) => c.metadata.order), 0) + 1;
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

  deleteChapter: async (id: string): Promise<boolean> => {
    const { chapters, projectPath, openTabs, activeTab } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return false;

    const chapter = chapters.find((c) => c.id === id);
    if (!chapter) return false;

    try {
      // ลบไฟล์จาก file system
      const result = await fileAPI.deleteFile(chapter.path);

      if (!result.success) {
        throw new Error(`Failed to delete chapter file: ${result.error}`);
      }

      // อัปเดต chapters array
      const updatedChapters = chapters.filter((c) => c.id !== id);

      // ปิด tab ถ้าเปิดอยู่
      const updatedTabs = openTabs.filter((tab) => tab.id !== id);
      const newActiveTab = updatedTabs.length > 0 ? updatedTabs[0].id : null;

      set({
        chapters: updatedChapters,
        openTabs: updatedTabs,
        activeTab: activeTab === id ? newActiveTab : activeTab,
      });

      console.log("Chapter deleted successfully!");
      return true;
    } catch (error) {
      console.error("Error deleting chapter:", error);
      return false;
    }
  },

  updateChapterContent: async (
    id: string,
    nodes: ContentNode[]
  ): Promise<void> => {
    const { chapters, projectPath } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return;

    const chapter = chapters.find((c) => c.id === id);
    if (!chapter) return;

    // Extract used characters and locations (ES5 compatible)
    const characterIds = nodes
      .filter((node: any) => node.type === "character")
      .map((node: any) => node.characterId);
    const usedCharacters = Array.from(new Set(characterIds));

    const locationIds = nodes
      .filter((node: any) => node.type === "location")
      .map((node: any) => node.locationId);
    const usedLocations = Array.from(new Set(locationIds));

    const updatedChapter: StructuredChapter = {
      ...chapter,
      content: nodes,
      metadata: {
        ...chapter.metadata,
        characters: usedCharacters,
        locations: usedLocations,
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

  getChapterStats: (id: string): ContentStats => {
    const { chapters } = get();
    const chapter = chapters.find((c) => c.id === id);

    if (!chapter) {
      return {
        totalWords: 0,
        totalCharacters: 0,
        characterUsage: {},
        locationUsage: {},
        fullnamePercentage: 0,
        nicknamePercentage: 0,
        actionPercentage: 0,
      };
    }

    return {
      totalWords: chapter.metadata.wordCount || 0,
      totalCharacters: chapter.metadata.characterCount || 0,
      characterUsage: {},
      locationUsage: {},
      fullnamePercentage: 0,
      nicknamePercentage: 0,
      actionPercentage: 0,
    };
  },

  // Location management
  addLocation: async (location: Omit<Location, "id">): Promise<void> => {
    const { locations, projectPath } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return;

    const newLocation: Location = {
      ...location,
      id:
        location.names.fullname.toLowerCase().replace(/\s+/g, "-") +
        "-" +
        Date.now(),
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
    const { locations, projectPath } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return;

    const updatedLocations = locations.map((loc) =>
      loc.id === id ? { ...loc, ...updates } : loc
    );

    const locationsData = { locations: updatedLocations };

    try {
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
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  },

  deleteLocation: async (id: string): Promise<boolean> => {
    const { locations, projectPath } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return false;

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
        (node: any) =>
          node.type === "location" && node.locationId === locationId
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

  // Ideas management
  addIdea: async (name: string): Promise<void> => {
    const { ideas, projectPath } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return;

    const filename = `${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}.md`;

    const content = `# ${name}

Write your ideas here...
`;

    try {
      const filePath = `${projectPath}/ideas/${filename}`;
      const result = await fileAPI.writeFile(filePath, content);

      if (!result.success) {
        throw new Error(`Failed to create idea: ${result.error}`);
      }

      const newIdea: Idea = {
        id: filename.replace(".md", ""),
        filename,
        path: filePath,
        content,
      };

      set({ ideas: [...ideas, newIdea] });
      console.log("Idea added successfully!");
    } catch (error) {
      console.error("Error adding idea:", error);
      throw error;
    }
  },

  insertDialogue: (characterName: string, dialogue: string) => {
    const dialogueText = `${characterName}: "${dialogue}"`;
    const { currentContent } = get();
    const newContent = currentContent + "\n\n" + dialogueText + "\n\n";
    get().updateContent(newContent);
  },
}));

// Helper function to convert legacy markdown to structured
function convertMarkdownToStructured(
  filename: string,
  path: string,
  content: string
): StructuredChapter {
  const parts = content.split("---");
  let frontmatter: any = {};
  let mainContent = content;

  if (parts.length >= 3) {
    try {
      const yamlStr = parts[1].trim();
      frontmatter = parseYAML(yamlStr);
      mainContent = parts.slice(2).join("---").trim();
    } catch (error) {
      console.error(`Error parsing frontmatter in ${filename}:`, error);
    }
  }

  const contentNodes: ContentNode[] = [
    {
      id: "legacy-content-1",
      type: "text",
      content: mainContent,
      createdAt: new Date().toISOString(),
    },
  ];

  const structuredChapter: StructuredChapter = {
    id: filename.replace(".md", ""),
    filename: filename.replace(".md", ".json"),
    path: path.replace(".md", ".json"),
    version: "2.0",
    metadata: {
      order: frontmatter.order || 999,
      title: frontmatter.title || filename.replace(".md", ""),
      tags: frontmatter.tags || [],
      characters: frontmatter.characters || [],
      locations: frontmatter.locations || [],
      wordCount: 0,
      characterCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    content: contentNodes,
    originalMarkdown: content,
  };

  return structuredChapter;
}

// Helper function to parse YAML frontmatter
function parseYAML(yamlStr: string): any {
  const lines = yamlStr.split("\n");
  const result: any = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value: any = trimmed.substring(colonIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value.startsWith("[") && value.endsWith("]")) {
      const arrayContent = value.slice(1, -1).trim();
      if (arrayContent) {
        value = arrayContent.split(",").map((item: string) => {
          item = item.trim();
          if (
            (item.startsWith('"') && item.endsWith('"')) ||
            (item.startsWith("'") && item.endsWith("'"))
          ) {
            return item.slice(1, -1);
          }
          return item;
        });
      } else {
        value = [];
      }
    }

    if (!isNaN(Number(value)) && value !== "") {
      value = Number(value);
    }

    result[key] = value;
  }

  return result;
}
