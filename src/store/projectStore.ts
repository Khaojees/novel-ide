import { create } from "zustand";
import { persist } from "zustand/middleware";
import matter from "gray-matter";
import path from "path";
import {
  ProjectState,
  Character,
  Chapter,
  Idea,
  CharactersData,
  Tab,
} from "../types";

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
        if (!window.electronAPI) return;

        const projectName = path.basename(projectDir);

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
          const folderPath = path.join(projectDir, folder);
          await window.electronAPI.createDirectory(folderPath);
        }

        // Create initial characters.json
        const charactersPath = path.join(
          projectDir,
          "characters",
          "characters.json"
        );
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
        await window.electronAPI.writeFile(
          charactersPath,
          JSON.stringify(initialCharacters, null, 2)
        );

        // Create first chapter
        const chapterPath = path.join(
          projectDir,
          "chapters",
          "001-beginning.md"
        );
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
        await window.electronAPI.writeFile(chapterPath, chapterTemplate);

        // Load the project
        await get().loadProject(projectDir);
      },

      // Load existing project
      loadProject: async (projectDir: string): Promise<void> => {
        if (!window.electronAPI) return;

        set({ projectPath: projectDir });

        // Load characters
        const charactersPath = path.join(
          projectDir,
          "characters",
          "characters.json"
        );
        const charactersResult = await window.electronAPI.readFile(
          charactersPath
        );
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
        const chaptersDir = path.join(projectDir, "chapters");
        const chaptersResult = await window.electronAPI.readDirectory(
          chaptersDir
        );
        let chapters: Chapter[] = [];
        if (chaptersResult.success && chaptersResult.files) {
          for (const filename of chaptersResult.files.filter((f) =>
            f.endsWith(".md")
          )) {
            const filePath = path.join(chaptersDir, filename);
            const fileResult = await window.electronAPI.readFile(filePath);
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
          // Sort by order
          chapters.sort((a, b) => a.order - b.order);
        }

        // Load ideas
        const ideasDir = path.join(projectDir, "ideas");
        const ideasResult = await window.electronAPI.readDirectory(ideasDir);
        let ideas: Idea[] = [];
        if (ideasResult.success && ideasResult.files) {
          for (const filename of ideasResult.files.filter((f) =>
            f.endsWith(".md")
          )) {
            const filePath = path.join(ideasDir, filename);
            const fileResult = await window.electronAPI.readFile(filePath);
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
        const { activeTab, openTabs, currentContent, projectPath } = get();
        if (!activeTab || !window.electronAPI || !projectPath) return;

        const activeTabData = openTabs.find((tab) => tab.id === activeTab);
        if (!activeTabData) return;

        const filePath = activeTabData.path;

        // For chapters, maintain frontmatter
        if (activeTabData.path.includes("chapters")) {
          const { chapters } = get();
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
            await window.electronAPI.writeFile(filePath, fullContent);
          }
        } else {
          await window.electronAPI.writeFile(filePath, currentContent);
        }

        // Update tab modified status
        const updatedTabs = openTabs.map((tab) =>
          tab.id === activeTab ? { ...tab, modified: false } : tab
        );

        set({ isContentModified: false, openTabs: updatedTabs });
      },

      // Add character
      addCharacter: async (character: Omit<Character, "id">): Promise<void> => {
        const { characters, projectPath } = get();
        if (!projectPath || !window.electronAPI) return;

        const newCharacter: Character = {
          ...character,
          id: Date.now().toString(),
        };
        const newCharacters = [...characters, newCharacter];

        const charactersPath = path.join(
          projectPath,
          "characters",
          "characters.json"
        );
        const charactersData: CharactersData = { characters: newCharacters };

        await window.electronAPI.writeFile(
          charactersPath,
          JSON.stringify(charactersData, null, 2)
        );

        set({ characters: newCharacters });
      },

      // Insert dialogue
      insertDialogue: (characterName: string, dialogue: string): void => {
        const { currentContent } = get();
        const newContent = currentContent + `\n\n${characterName}: ${dialogue}`;
        get().updateContent(newContent);
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
