// src/store/projectStore.ts - Enhanced with Character Editor support
import { create } from "zustand";
import {
  Character,
  Chapter,
  Idea,
  Tab,
  ProjectState,
  CharacterUsage,
} from "../type";
import { mockFileAPI } from "../api/mockFileAPI";

const getFileAPI = () => window.electronAPI || mockFileAPI;

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Project data
  projectPath: null,
  characters: [],
  chapters: [],
  ideas: [],

  // Editor state
  openTabs: [],
  activeTab: null,
  currentContent: "",
  isContentModified: false,

  // Actions
  setProjectPath: (path: string) => {
    set({ projectPath: path });
  },

  clearProject: () => {
    set({
      projectPath: null,
      characters: [],
      chapters: [],
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
      // Create directory structure
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

      // Create initial characters.json file
      const charactersData = { characters: [] };
      const charactersPath = `${projectDir}/characters/characters.json`;
      const charactersResult = await fileAPI.writeFile(
        charactersPath,
        JSON.stringify(charactersData, null, 2)
      );

      if (!charactersResult.success) {
        throw new Error(
          `Failed to create characters file: ${charactersResult.error}`
        );
      }

      // Set project path and load
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
          console.log("Loaded characters:", characters);
        } catch (parseError) {
          console.error("Error parsing characters.json:", parseError);
        }
      }

      // Load chapters (existing logic)
      const chaptersDir = `${projectDir}/chapters`;
      const chaptersResult = await fileAPI.readDirectory(chaptersDir);
      let chapters: Chapter[] = [];

      if (chaptersResult.success && chaptersResult.files) {
        const mdFiles = chaptersResult.files.filter((f) => f.endsWith(".md"));

        for (const filename of mdFiles) {
          const filePath = `${chaptersDir}/${filename}`;
          const fileResult = await fileAPI.readFile(filePath);

          if (fileResult.success && fileResult.content) {
            // Parse frontmatter and content
            const parts = fileResult.content.split("---");
            let frontmatter: any = {};
            let content = fileResult.content;

            if (parts.length >= 3) {
              try {
                const yamlStr = parts[1].trim();
                frontmatter = parseYAML(yamlStr);
                content = parts.slice(2).join("---").trim();
              } catch (error) {
                console.error(
                  `Error parsing frontmatter in ${filename}:`,
                  error
                );
              }
            }

            chapters.push({
              id: filename.replace(".md", ""),
              filename,
              path: filePath,
              order: frontmatter.order || 999,
              title: frontmatter.title || filename.replace(".md", ""),
              tags: frontmatter.tags || [],
              characters: frontmatter.characters || [],
              location: frontmatter.location || "",
              content: fileResult.content,
            });
          } else {
            console.error(`Failed to read file ${filename}:`, fileResult.error);
          }
        }

        chapters.sort((a, b) => a.order - b.order);
        console.log("Final sorted chapters:", chapters);
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

      // Update store state
      set({
        characters,
        chapters,
        ideas,
        openTabs: [],
        activeTab: null,
      });

      // Auto-open first chapter if available
      if (chapters.length > 0) {
        get().openTab(chapters[0]);
      }

      console.log("Project loaded successfully!");
      console.log(`- Characters: ${characters.length}`);
      console.log(`- Chapters: ${chapters.length}`);
      console.log(`- Ideas: ${ideas.length}`);
    } catch (error) {
      console.error("Error loading project:", error);
      throw error;
    }
  },

  // Enhanced tab management
  openTab: (item: Chapter | Idea) => {
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
        name: "title" in item ? item.title : item.filename.replace(".md", ""),
        type: "title" in item ? "chapter" : "idea",
        path: item.path,
        content: item.content,
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

  // NEW: Open character tab
  openCharacterTab: (character: Character) => {
    const { openTabs } = get();
    const existingTab = openTabs.find((tab) => tab.id === character.id);

    if (existingTab) {
      set({
        activeTab: existingTab.id,
        currentContent: "", // Character editor doesn't use currentContent
      });
    } else {
      const newTab: Tab = {
        id: character.id,
        name: character.name,
        type: "character",
        path: "", // Characters don't have individual file paths
        content: "", // Character data is handled separately
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

      // Update tab as saved
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

  // Enhanced character management
  addCharacter: async (character: Omit<Character, "id">): Promise<void> => {
    const { characters, projectPath } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return;

    const newCharacter: Character = {
      ...character,
      id: character.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
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

  // NEW: Update character
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

      // Update character data in open tabs
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

  // NEW: Delete character
  deleteCharacter: async (id: string): Promise<boolean> => {
    const { characters, projectPath, openTabs } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return false;

    // Check if character is in use
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

      // Close character tab if open
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
      throw error;
    }
  },

  // NEW: Get character usage
  getCharacterUsage: (characterId: string): CharacterUsage[] => {
    const { characters, chapters, ideas } = get();
    const character = characters.find((c) => c.id === characterId);
    if (!character) return [];

    const usage: CharacterUsage[] = [];

    // Check chapters
    chapters.forEach((chapter) => {
      // Check frontmatter
      if (
        chapter.characters.includes(characterId) ||
        chapter.characters.includes(character.name)
      ) {
        usage.push({
          id: chapter.id,
          type: "chapter",
          filename: chapter.filename,
          title: chapter.title,
          usageType: "frontmatter",
        });
      }

      // Check dialogue patterns
      const dialoguePattern = new RegExp(`^\\s*${character.name}\\s*:`, "gm");
      const dialogueMatches = chapter.content.match(dialoguePattern);
      if (dialogueMatches) {
        usage.push({
          id: chapter.id,
          type: "chapter",
          filename: chapter.filename,
          title: chapter.title,
          usageType: "dialogue",
          context: dialogueMatches[0],
        });
      }

      // Check narrative mentions
      const narrativePattern = new RegExp(`\\b${character.name}\\b`, "g");
      const narrativeMatches = chapter.content.match(narrativePattern);
      if (
        narrativeMatches &&
        narrativeMatches.length > (dialogueMatches?.length || 0)
      ) {
        usage.push({
          id: chapter.id,
          type: "chapter",
          filename: chapter.filename,
          title: chapter.title,
          usageType: "narrative",
        });
      }
    });

    // Check ideas
    ideas.forEach((idea) => {
      if (idea.content.includes(character.name)) {
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

  // Existing methods...
  addChapter: async (title: string): Promise<void> => {
    const { chapters, projectPath } = get();
    const fileAPI = getFileAPI();

    if (!projectPath) return;

    const nextOrder = Math.max(...chapters.map((c) => c.order), 0) + 1;
    const filename = `${nextOrder.toString().padStart(3, "0")}-${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}.md`;

    const frontmatter = `---
order: ${nextOrder}
title: "${title}"
tags: []
characters: []
location: ""
---

# ${title}

Start writing your chapter here...
`;

    try {
      const filePath = `${projectPath}/chapters/${filename}`;
      const result = await fileAPI.writeFile(filePath, frontmatter);

      if (!result.success) {
        throw new Error(`Failed to create chapter: ${result.error}`);
      }

      const newChapter: Chapter = {
        id: filename.replace(".md", ""),
        filename,
        path: filePath,
        order: nextOrder,
        title,
        tags: [],
        characters: [],
        location: "",
        content: frontmatter,
      };

      const updatedChapters = [...chapters, newChapter].sort(
        (a, b) => a.order - b.order
      );

      set({ chapters: updatedChapters });
      console.log("Chapter added successfully!");
    } catch (error) {
      console.error("Error adding chapter:", error);
      throw error;
    }
  },

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
    // This method can be enhanced later for smarter dialogue insertion
    const dialogueText = `${characterName}: "${dialogue}"`;
    const { currentContent } = get();
    const newContent = currentContent + "\n\n" + dialogueText + "\n\n";
    get().updateContent(newContent);
  },
}));

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

    // Remove quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Parse arrays
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

    // Parse numbers
    if (!isNaN(Number(value)) && value !== "") {
      value = Number(value);
    }

    result[key] = value;
  }

  return result;
}
