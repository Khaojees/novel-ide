// src/store/projectStore.ts - Fixed version
import { create } from "zustand";
import { persist } from "zustand/middleware";
import matter from "gray-matter";
import {
  ProjectState,
  Character,
  Chapter,
  Idea,
  Tab,
  CharactersData,
} from "../type";
import { mockFileAPI } from "../api/mockFileAPI";

// Get appropriate file API based on environment
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

        try {
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
            const result = await fileAPI.createDirectory(folderPath);
            if (!result.success) {
              throw new Error(
                `Failed to create directory ${folder}: ${result.error}`
              );
            }
          }

          // Create initial characters.json
          const charactersPath = `${projectDir}/characters/characters.json`;
          const initialCharacters: CharactersData = {
            characters: [
              {
                id: "protagonist",
                name: "Main Character",
                traits: "Brave, determined, mysterious past",
                bio: "The story's main protagonist who will discover their destiny.",
                appearance: "Tall with piercing eyes",
                active: true,
              },
            ],
          };

          const charactersResult = await fileAPI.writeFile(
            charactersPath,
            JSON.stringify(initialCharacters, null, 2)
          );

          if (!charactersResult.success) {
            throw new Error(
              `Failed to create characters file: ${charactersResult.error}`
            );
          }

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

*The adventure starts now...*
`;

          const chapterResult = await fileAPI.writeFile(
            chapterPath,
            chapterTemplate
          );
          if (!chapterResult.success) {
            throw new Error(
              `Failed to create first chapter: ${chapterResult.error}`
            );
          }

          // Create initial ideas file
          const ideasPath = `${projectDir}/ideas/initial-ideas.md`;
          const ideasTemplate = `# Story Ideas

## Plot Concepts
- Write your initial story concepts here
- Character backstories and motivations
- World building notes and rules

## Themes to Explore
- What themes do you want to explore?
- Character development arcs
- Emotional journey and conflicts

## Research Notes
- Add research notes here
- Historical context if needed
- Technical details and accuracy
`;

          const ideasResult = await fileAPI.writeFile(ideasPath, ideasTemplate);
          if (!ideasResult.success) {
            throw new Error(
              `Failed to create ideas file: ${ideasResult.error}`
            );
          }

          // Load the newly created project
          await get().loadProject(projectDir);

          console.log("New project created successfully!");
        } catch (error) {
          console.error("Error creating new project:", error);
          throw error;
        }
      },

      // Load existing project
      loadProject: async (projectDir: string): Promise<void> => {
        const fileAPI = getFileAPI();

        console.log("Loading project from:", projectDir);

        try {
          set({ projectPath: projectDir });

          // Load characters
          const charactersPath = `${projectDir}/characters/characters.json`;
          const charactersResult = await fileAPI.readFile(charactersPath);
          let characters: Character[] = [];

          if (charactersResult.success && charactersResult.content) {
            try {
              const parsed: CharactersData = JSON.parse(
                charactersResult.content
              );
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
            const mdFiles = chaptersResult.files.filter((f) =>
              f.endsWith(".md")
            );
            console.log("Found chapter files:", mdFiles);

            for (const filename of mdFiles) {
              const filePath = `${chaptersDir}/${filename}`;
              const fileResult = await fileAPI.readFile(filePath);

              if (fileResult.success && fileResult.content) {
                try {
                  const parsed = matter(fileResult.content);
                  console.log(`Parsing chapter ${filename}:`, parsed.data);

                  chapters.push({
                    id: filename.replace(".md", ""),
                    filename,
                    path: filePath,
                    order: parsed.data.order || 0,
                    title:
                      parsed.data.title ||
                      filename.replace(".md", "").replace(/^\d+-/, ""),
                    tags: parsed.data.tags || [],
                    characters: parsed.data.characters || [],
                    location: parsed.data.location || "",
                    content: parsed.content,
                  });
                } catch (e) {
                  console.error(`Error parsing chapter ${filename}:`, e);
                }
              }
            }

            chapters.sort((a, b) => a.order - b.order);
            console.log("Loaded chapters:", chapters);
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

      // Open tab
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
            name:
              "title" in item ? item.title : item.filename.replace(".md", ""),
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

      // Close tab
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

      // Update content
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

      // Save current file
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

      // Add character
      addCharacter: async (character: Omit<Character, "id">): Promise<void> => {
        const { characters, projectPath } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return;

        const newCharacter: Character = {
          ...character,
          id:
            character.name.toLowerCase().replace(/\s+/g, "-") +
            "-" +
            Date.now(),
        };

        const updatedCharacters = [...characters, newCharacter];
        const charactersData: CharactersData = {
          characters: updatedCharacters,
        };

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

      // Add chapter - Fixed to get proper order
      addChapter: async (title: string): Promise<void> => {
        const { chapters, projectPath } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return;

        // Find the highest order number from existing chapters
        const maxOrder =
          chapters.length > 0 ? Math.max(...chapters.map((ch) => ch.order)) : 0;
        const order = maxOrder + 1;

        // Create filename with proper title slug
        const titleSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
          .replace(/\s+/g, "-") // Replace spaces with dashes
          .replace(/-+/g, "-") // Replace multiple dashes with single dash
          .trim();

        const filename = `${order.toString().padStart(3, "0")}-${titleSlug}.md`;
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

        try {
          const result = await fileAPI.writeFile(filePath, chapterTemplate);
          if (!result.success) {
            throw new Error(`Failed to create chapter: ${result.error}`);
          }

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
        } catch (error) {
          console.error("Error adding chapter:", error);
          throw error;
        }
      },

      // Add idea
      addIdea: async (name: string): Promise<void> => {
        const { ideas, projectPath } = get();
        const fileAPI = getFileAPI();

        if (!projectPath) return;

        const nameSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();

        const filename = `${nameSlug}.md`;
        const filePath = `${projectPath}/ideas/${filename}`;

        const ideaTemplate = `# ${name}

Write your ideas here...

## Notes
- Add your notes
- Brainstorm concepts
- Develop themes
`;

        try {
          const result = await fileAPI.writeFile(filePath, ideaTemplate);
          if (!result.success) {
            throw new Error(`Failed to create idea: ${result.error}`);
          }

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
        } catch (error) {
          console.error("Error adding idea:", error);
          throw error;
        }
      },

      // Insert dialogue (placeholder - will be implemented with editor)
      insertDialogue: (characterName: string, dialogue: string) => {
        console.log(`Inserting dialogue for ${characterName}: "${dialogue}"`);
        // This will be implemented when we have the TipTap editor integration
      },

      // Clear project data
      clearProject: () => {
        console.log("Clearing project data");
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
    }),
    {
      name: "novel-ide-storage",
      partialize: (state) => ({
        projectPath: state.projectPath,
      }),
    }
  )
);
