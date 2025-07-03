// Character types
export interface Character {
  id: string;
  name: string;
  traits: string;
  bio: string;
  appearance?: string;
  active: boolean;
}

export interface CharactersData {
  characters: Character[];
}

// Chapter types
export interface Chapter {
  id: string;
  filename: string;
  path: string;
  order: number;
  title: string;
  tags: string[];
  characters: string[];
  location: string;
  content: string;
}

// Idea types
export interface Idea {
  id: string;
  filename: string;
  path: string;
  content: string;
}

// Tab types
export interface Tab {
  id: string;
  name: string;
  type: "chapter" | "idea" | "character";
  path: string;
  content: string;
  modified?: boolean;
}

// Project store types
export interface ProjectState {
  // Project data
  projectPath: string | null;
  characters: Character[];
  chapters: Chapter[];
  ideas: Idea[];

  // Editor state
  openTabs: Tab[];
  activeTab: string | null;
  currentContent: string;
  isContentModified: boolean;

  // Actions
  setProjectPath: (path: string) => void;
  createNewProject: (projectDir: string) => Promise<void>;
  loadProject: (projectDir: string) => Promise<void>;
  openTab: (item: Chapter | Idea) => void;
  closeTab: (tabId: string) => void;
  updateContent: (content: string) => void;
  saveCurrentFile: () => Promise<void>;
  addCharacter: (character: Omit<Character, "id">) => Promise<void>;
  insertDialogue: (characterName: string, dialogue: string) => void;
}

// Electron API types
export interface ElectronAPI {
  selectDirectory: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  readFile: (
    filePath: string
  ) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (
    filePath: string,
    content: string
  ) => Promise<{ success: boolean; error?: string }>;
  createDirectory: (
    dirPath: string
  ) => Promise<{ success: boolean; error?: string }>;
  readDirectory: (
    dirPath: string
  ) => Promise<{ success: boolean; files?: string[]; error?: string }>;
  deleteFile: (
    filePath: string
  ) => Promise<{ success: boolean; error?: string }>;

  onMenuNewProject: (callback: () => void) => void;
  onMenuOpenProject: (callback: () => void) => void;
  onMenuSave: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Global window interface
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
