// src/api/mockFileAPI.ts
import { ElectronAPI } from "../type";

// Mock file system using localStorage
class MockFileSystem {
  private storage: Storage;

  constructor() {
    this.storage = localStorage;
  }

  private getKey(path: string): string {
    return `mock-fs:${path}`;
  }

  private getFolderKey(path: string): string {
    return `mock-fs-folder:${path}`;
  }

  async readFile(
    filePath: string
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const content = this.storage.getItem(this.getKey(filePath));
      if (content === null) {
        return { success: false, error: "File not found" };
      }
      return { success: true, content };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async writeFile(
    filePath: string,
    content: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.storage.setItem(this.getKey(filePath), content);

      // Also update the parent directory listing
      const parentDir = filePath.substring(0, filePath.lastIndexOf("/"));
      if (parentDir) {
        const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
        const dirResult = await this.readDirectory(parentDir);
        const existingFiles = dirResult.files || [];

        if (!existingFiles.includes(fileName)) {
          const updatedFiles = [...existingFiles, fileName];
          this.storage.setItem(
            this.getFolderKey(parentDir),
            JSON.stringify(updatedFiles)
          );
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async createDirectory(
    dirPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create directory marker
      this.storage.setItem(this.getFolderKey(dirPath), JSON.stringify([]));

      // Update parent directory if exists
      const parentDir = dirPath.substring(0, dirPath.lastIndexOf("/"));
      if (parentDir) {
        const folderName = dirPath.substring(dirPath.lastIndexOf("/") + 1);
        const dirResult = await this.readDirectory(parentDir);
        const existingFiles = dirResult.files || [];

        if (!existingFiles.includes(folderName)) {
          const updatedFiles = [...existingFiles, folderName];
          this.storage.setItem(
            this.getFolderKey(parentDir),
            JSON.stringify(updatedFiles)
          );
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async readDirectory(
    dirPath: string
  ): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      const filesData = this.storage.getItem(this.getFolderKey(dirPath));
      if (filesData === null) {
        return { success: false, error: "Directory not found" };
      }

      const files = JSON.parse(filesData);
      return { success: true, files };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async deleteFile(
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.storage.removeItem(this.getKey(filePath));

      // Update parent directory listing
      const parentDir = filePath.substring(0, filePath.lastIndexOf("/"));
      if (parentDir) {
        const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
        const dirResult = await this.readDirectory(parentDir);
        const existingFiles = dirResult.files || [];

        const updatedFiles = existingFiles.filter((f) => f !== fileName);
        this.storage.setItem(
          this.getFolderKey(parentDir),
          JSON.stringify(updatedFiles)
        );
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async selectDirectory(): Promise<{ canceled: boolean; filePaths: string[] }> {
    // Simulate directory selection
    return new Promise((resolve) => {
      const projectName = prompt("Enter project name for mock directory:");
      if (projectName) {
        const mockPath = `/projects/${projectName}`;
        resolve({ canceled: false, filePaths: [mockPath] });
      } else {
        resolve({ canceled: true, filePaths: [] });
      }
    });
  }
}

const mockFileSystem = new MockFileSystem();

export const mockFileAPI: ElectronAPI = {
  selectDirectory: () => mockFileSystem.selectDirectory(),
  readFile: (filePath: string) => mockFileSystem.readFile(filePath),
  writeFile: (filePath: string, content: string) =>
    mockFileSystem.writeFile(filePath, content),
  createDirectory: (dirPath: string) => mockFileSystem.createDirectory(dirPath),
  readDirectory: (dirPath: string) => mockFileSystem.readDirectory(dirPath),
  deleteFile: (filePath: string) => mockFileSystem.deleteFile(filePath),

  // Menu handlers (mock implementation)
  onMenuNewProject: (callback: () => void) => {
    // In browser mode, we'll handle this through UI
    console.log("Mock: onMenuNewProject registered");
  },
  onMenuOpenProject: (callback: () => void) => {
    console.log("Mock: onMenuOpenProject registered");
  },
  onMenuSave: (callback: () => void) => {
    console.log("Mock: onMenuSave registered");
  },
  removeAllListeners: (channel: string) => {
    console.log("Mock: removeAllListeners", channel);
  },
};

// Initialize some mock data for testing
export const initializeMockData = () => {
  // Create sample project structure
  const sampleProjects = [
    "/projects/fantasy-novel",
    "/projects/sci-fi-story",
    "/projects/mystery-book",
  ];

  sampleProjects.forEach((projectPath) => {
    // Create directories
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
    folders.forEach((folder) => {
      mockFileSystem.createDirectory(`${projectPath}/${folder}`);
    });

    // Create sample characters.json
    const charactersData = {
      characters: [
        {
          id: "hero",
          name: "Hero",
          traits: "Brave, determined, kind-hearted",
          bio: "The main protagonist of our story",
          appearance: "Medium height with bright eyes",
          active: true,
        },
        {
          id: "villain",
          name: "Villain",
          traits: "Cunning, ambitious, ruthless",
          bio: "The main antagonist seeking power",
          appearance: "Tall and imposing figure",
          active: true,
        },
      ],
    };

    mockFileSystem.writeFile(
      `${projectPath}/characters/characters.json`,
      JSON.stringify(charactersData, null, 2)
    );

    // Create sample chapter
    const chapterContent = `---
order: 1
title: "Chapter 1 - The Beginning"
tags: [intro, setup]
characters: [hero]
location: "Village Square"
---

# Chapter 1 - The Beginning

The morning sun cast long shadows across the cobblestone square...

Hero: "Today feels different somehow."

*The adventure begins...*
`;

    mockFileSystem.writeFile(
      `${projectPath}/chapters/001-beginning.md`,
      chapterContent
    );

    // Create sample idea
    const ideaContent = `# Plot Ideas

## Main Quest
- Hero discovers ancient artifact
- Villain seeks the same artifact
- Race against time to save the kingdom

## Character Development
- Hero learns to trust others
- Villain's tragic backstory revealed
- Friendship overcomes adversity
`;

    mockFileSystem.writeFile(`${projectPath}/ideas/plot-ideas.md`, ideaContent);
  });

  console.log("Mock data initialized with sample projects");
};
