import { create } from "zustand";
import { persist } from "zustand/middleware";
import matter from "gray-matter";
import {
  ProjectState,
  Character,
  Chapter,
  Idea,
  CharactersData,
  Tab,
} from ".././type";

// Mock file operations for browser testing
const mockFileAPI = {
  selectDirectory: async () => ({
    canceled: false,
    filePaths: ["/mock/project"],
  }),
  readFile: async (filePath: string) => {
    // Mock file contents
    if (filePath.includes("characters.json")) {
      const mockCharacters: CharactersData = {
        characters: [
          {
            id: "alex",
            name: "Alex",
            traits: "Brave, determined, mysterious past",
            bio: "The main protagonist who discovers hidden powers.",
            appearance: "Tall with piercing blue eyes",
            active: true,
          },
          {
            id: "sarah",
            name: "Sarah",
            traits: "Smart, cautious, loyal friend",
            bio: "Alex's best friend and voice of reason.",
            appearance: "Short brown hair, glasses",
            active: true,
          },
        ],
      };
      return {
        success: true,
        content: JSON.stringify(mockCharacters, null, 2),
      };
    }

    if (filePath.includes("001-beginning.md")) {
      return {
        success: true,
        content: `---
order: 1
title: "Chapter 1 - The Beginning"
tags: [intro]
characters: [alex]
location: "The Academy"
---

# Chapter 1 - The Beginning

The morning sun cast long shadows across the courtyard as Alex stepped through the academy gates for the first time.

Alex: "This place is bigger than I imagined."

The ancient stones seemed to whisper secrets of generations past, and Alex couldn't shake the feeling that something extraordinary was about to begin.`,
      };
    }

    return {
      success: true,
      content: "# New Document\n\nStart writing here...",
    };
  },
  writeFile: async (filePath: string, content: string) => {
    console.log("Mock saving file:", filePath);
    return { success: true };
  },
  createDirectory: async (dirPath: string) => {
    console.log("Mock creating directory:", dirPath);
    return { success: true };
  },
  readDirectory: async (dirPath: string) => {
    if (dirPath.includes("chapters")) {
      return { success: true, files: ["001-beginning.md", "002-discovery.md"] };
    }
    if (dirPath.includes("ideas")) {
      return { success: true, files: ["plot-ideas.md", "world-building.md"] };
    }
    return { success: true, files: [] };
  },
  deleteFile: async (filePath: string) => {
    console.log("Mock deleting file:", filePath);
    return { success: true };
  },
};

// Use either electron API or mock API
const getFileAPI = () => window.electronAPI || mockFileAPI;

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Project state
      projectPath: null,
      characters: [],
      chapters: [],
      ideas: [],
      openTabs: [],
      activeTab: null,

      // Editor state
      currentContent: "",
      isContentModified: false,

      // Set project path
      setProjectPath: (path: string) => set({ projectPath: path }),

      // Create new project
      createNewProject: async (projectDir: string): Promise<void> => {
        const fileAPI = getFileAPI();

        console.log("Creating new project at:", projectDir);

        // Create folder structure
        const folders = [
          "characters",
          "chapters",
          "ideas",
          "world",
          "locations",
          "snippets",
          "assets",
          "archive",
        ];

        for (const folder of folders) {
          const folderPath = `${projectDir}/${folder}`;
          await fileAPI.createDirectory(folderPath);
        }

        // Create initial characters.json
        const charactersPath = `${projectDir}/characters/characters.json`;
        const initialCharacters: CharactersData = {
          characters: [
            {
              id: "protagonist",
              name: "Main Character",
              traits: "Brave, determined, mysterious past",
              bio: "The story's main protagonist...",
              appearance: "Tall with piercing eyes",
              active: true,
            },
          ],
        };
        await fileAPI.writeFile(
          charactersPath,
          JSON.stringify(initialCharacters, null, 2)
        );

        // Create first chapter
        const chapterPath = `${projectDir}/chapters/001-beginning.md`;
        const chapterTemplate = `---
order: 1
title: "Chapter 1 - The Beginning"
tags: [intro]
characters: [protagonist]
location: ""
---

# Chapter 1 - The Beginning

Write your story here...

Main Character: "This is where it all begins."
`;
        await fileAPI.writeFile(chapterPath, chapterTemplate);

        // Load the project
        await get().loadProject(projectDir);
      },

      // Load existing project
      loadProject: async (projectDir: string): Promise<void> => {
        const fileAPI = getFileAPI();

        console.log("Loading project from:", projectDir);

        set({ projectPath: projectDir });

        // Load characters
        const charactersPath = `${projectDir}/characters/characters.json`;
        const charactersResult = await fileAPI.readFile(charactersPath);
        let characters: Character[] = [];
        if (charactersResult.success && charactersResult.content) {
          try {
            const parsed: CharactersData = JSON.parse(charactersResult.content);
            characters = parsed.characters || [];
          } catch (e) {
            console.error("Error parsing characters:", e);
          }
        }

        // Load chapters
        const chaptersDir = `${projectDir}/chapters`;
        const chaptersResult = await fileAPI.readDirectory(chaptersDir);
        let chapters: Chapter[] = [];
        if (chaptersResult.success && chaptersResult.files) {
          for (const filename of chaptersResult.files.filter((f) =>
            f.endsWith(".md")
          )) {
            const filePath = `${chaptersDir}/${filename}`;
            const fileResult = await fileAPI.readFile(filePath);
            if (fileResult.success && fileResult.content) {
              const parsed = matter(fileResult.content);
              chapters.push({
                id: filename.replace(".md", ""),
                filename,
                path: filePath,
                order: parsed.data.order || 0,
                title: parsed.data.title || "Untitled",
                tags: parsed.data.tags || [],
                characters: parsed.data.characters || [],
                location: parsed.data.location || "",
                content: parsed.content,
              });
            }
          }
          chapters.sort((a, b) => a.order - b.order);
        }

        // Load ideas
        const ideasDir = `${projectDir}/ideas`;
        const ideasResult = await fileAPI.readDirectory(ideasDir);
        let ideas: Idea[] = [];
        if (ideasResult.success && ideasResult.files) {
          for (const filename of ideasResult.files.filter((f) =>
            f.endsWith(".md")
          )) {
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

        set({ characters, chapters, ideas });

        // Auto-open first chapter if available
        if (chapters.length > 0) {
          get().openTab(chapters[0]);
        }
      },

      // Open tab
      openTab: (item: Chapter | Idea): void => {
        const { openTabs } = get();
        const existingTab = openTabs.find((tab) => tab.id === item.id);

        if (!existingTab) {
          const newTab: Tab = {
            id: item.id,
            name: "title" in item ? item.title : item.filename,
            type: "title" in item ? "chapter" : "idea",
            path: item.path,
            content: item.content || "",
            modified: false,
          };

          set({
            openTabs: [...openTabs, newTab],
            activeTab: item.id,
            currentContent: item.content || "",
            isContentModified: false,
          });
        } else {
          set({
            activeTab: item.id,
            currentContent: existingTab.content || "",
            isContentModified: false,
          });
        }
      },

      // Close tab
      closeTab: (tabId: string): void => {
        const { openTabs, activeTab } = get();
        const newTabs = openTabs.filter((tab) => tab.id !== tabId);
        const newActiveTab =
          activeTab === tabId
            ? newTabs.length > 0
              ? newTabs[0].id
              : null
            : activeTab;

        set({
          openTabs: newTabs,
          activeTab: newActiveTab,
          currentContent: newActiveTab
            ? newTabs.find((tab) => tab.id === newActiveTab)?.content || ""
            : "",
          isContentModified: false,
        });
      },

      // Update content
      updateContent: (content: string): void => {
        set({ currentContent: content, isContentModified: true });

        // Update tab content
        const { openTabs, activeTab } = get();
        const updatedTabs = openTabs.map((tab) =>
          tab.id === activeTab ? { ...tab, content, modified: true } : tab
        );
        set({ openTabs: updatedTabs });
      },

      // Save current file
      saveCurrentFile: async (): Promise<void> => {
        const { activeTab, openTabs, currentContent, projectPath, chapters } =
          get();
        if (!activeTab || !projectPath) return;

        const fileAPI = getFileAPI();
        const activeTabData = openTabs.find((tab) => tab.id === activeTab);
        if (!activeTabData) return;

        const filePath = activeTabData.path;

        // For chapters, maintain frontmatter
        if (activeTabData.type === "chapter") {
          const chapterData = chapters.find((ch) => ch.id === activeTab);

          if (chapterData) {
            const frontmatter = {
              order: chapterData.order,
              title: chapterData.title,
              tags: chapterData.tags,
              characters: chapterData.characters,
              location: chapterData.location,
            };

            const fullContent = matter.stringify(currentContent, frontmatter);
            await fileAPI.writeFile(filePath, fullContent);
          }
        } else {
          await fileAPI.writeFile(filePath, currentContent);
        }

        // Update tab modified status
        const updatedTabs = openTabs.map((tab) =>
          tab.id === activeTab ? { ...tab, modified: false } : tab
        );

        set({ isContentModified: false, openTabs: updatedTabs });
        console.log("File saved:", activeTabData.name);
      },

      // Add character
      addCharacter: async (character: Omit<Character, "id">): Promise<void> => {
        const { characters, projectPath } = get();
        if (!projectPath) return;

        const fileAPI = getFileAPI();
        const newCharacter: Character = {
          ...character,
          id: Date.now().toString(),
        };
        const newCharacters = [...characters, newCharacter];

        const charactersPath = `${projectPath}/characters/characters.json`;
        const charactersData: CharactersData = { characters: newCharacters };

        await fileAPI.writeFile(
          charactersPath,
          JSON.stringify(charactersData, null, 2)
        );

        set({ characters: newCharacters });
        console.log("Character added:", newCharacter.name);
      },

      // Add chapter
      addChapter: async (title: string): Promise<void> => {
        const { chapters, projectPath } = get();
        if (!projectPath) return;

        const fileAPI = getFileAPI();
        const order = chapters.length + 1;
        const filename = `${order.toString().padStart(3, "0")}-${title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")}.md`;
        const filePath = `${projectPath}/chapters/${filename}`;

        const chapterTemplate = `---
order: ${order}
title: "${title}"
tags: []
characters: []
location: ""
---

# ${title}

Write your chapter here...
`;

        await fileAPI.writeFile(filePath, chapterTemplate);

        const newChapter: Chapter = {
          id: filename.replace(".md", ""),
          filename,
          path: filePath,
          order,
          title,
          tags: [],
          characters: [],
          location: "",
          content: `# ${title}\n\nWrite your chapter here...`,
        };

        const newChapters = [...chapters, newChapter].sort(
          (a, b) => a.order - b.order
        );
        set({ chapters: newChapters });

        // Auto-open the new chapter
        get().openTab(newChapter);
        console.log("Chapter added:", title);
      },

      // Add idea
      addIdea: async (name: string): Promise<void> => {
        const { ideas, projectPath } = get();
        if (!projectPath) return;

        const fileAPI = getFileAPI();
        const filename = `${name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")}.md`;
        const filePath = `${projectPath}/ideas/${filename}`;

        const ideaTemplate = `# ${name}\n\nWrite your ideas here...`;

        await fileAPI.writeFile(filePath, ideaTemplate);

        const newIdea: Idea = {
          id: filename.replace(".md", ""),
          filename,
          path: filePath,
          content: ideaTemplate,
        };

        const newIdeas = [...ideas, newIdea];
        set({ ideas: newIdeas });

        // Auto-open the new idea
        get().openTab(newIdea);
        console.log("Idea added:", name);
      },

      // Insert dialogue
      insertDialogue: (characterName: string, dialogue: string): void => {
        const { currentContent } = get();
        const newContent =
          currentContent + `\n\n${characterName}: "${dialogue}"`;
        get().updateContent(newContent);
        console.log("Dialogue inserted:", characterName);
      },
    }),
    {
      name: "novel-ide-storage",
      partialize: (state) => ({
        projectPath: state.projectPath,
        openTabs: state.openTabs,
        activeTab: state.activeTab,
      }),
    }
  )
);
