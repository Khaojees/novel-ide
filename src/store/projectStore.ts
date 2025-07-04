// src/store/projectStore.ts
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
                bio: "The story's main protagonist...",
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
- Character backstories
- World building notes

## Themes
- What themes do you want to explore?
- Character arcs
- Emotional journey

## Research Notes
- Add research notes here
- Historical context
- Technical details
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

            for (const filename of mdFiles) {
              const filePath = `${chaptersDir}/${filename}`;
              const fileResult = await fileAPI.readFile(filePath);

              if (fileResult.success && fileResult.content) {
                try {
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
                } catch (e) {
                  console.error(`Error parsing chapter ${filename}:`, e);
                }
              }
            }

            chapters.sort((a, b) => a.order - b.order);
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
          set({ activeTab: existingTab.id });
        } else {
          const newTab: Tab = {
            id: item.id,
            name: "title" in item ? item.title : item.filename,
            type: "title" in item ? "chapter" : "idea",
            path: item.path,
            content: item.content,
            modified: false,
          };

          set({
            openTabs: [...openTabs, newTab],
            activeTab: newTab.id,
            currentContent: newTab.content,
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
          id: character.name.toLowerCase().replace(/\s+/g, "-"),
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

      // Insert dialogue (placeholder - will be implemented with editor)
      insertDialogue: (characterName: string, dialogue: string) => {
        console.log(`Inserting dialogue for ${characterName}: "${dialogue}"`);
        // This will be implemented when we have the TipTap editor
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
