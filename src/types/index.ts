// src/type/index.ts - Updated with Character Editor support

// Character types
export interface Character {
  id: string;
  traits: string;
  bio: string;
  appearance?: string;
  active: boolean;
  // เพิ่ม fields สำหรับ future structured data
  names: {
    fullname: string; // ชื่อตอนพูด
    nickname?: string; // ชื่อตอนเล่าเรื่อง
    reference?: string; // ชื่อตอนอ้างอิง
  };
  relationships?: string[];
  tags?: string[];
  notes?: string;
  color?: string;
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

// Tab types - Enhanced with character support
export interface Tab {
  id: string;
  name: string;
  type: "chapter" | "idea" | "character" | "location";
  path: string;
  content: string;
  modified?: boolean;
  // เพิ่ม metadata สำหรับ character tabs
  characterData?: Character;
  title?: string;
}

// Character usage tracking
export interface CharacterUsage {
  id: string;
  type: "chapter" | "idea";
  filename: string;
  title: string;
  usageType: "frontmatter" | "dialogue" | "narrative";
  lineNumber?: number;
  context?: string;
}

// Project store types - Enhanced
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

  // Actions - Enhanced with character support
  setProjectPath: (path: string) => void;
  clearProject: () => void;
  createNewProject: (projectDir: string) => Promise<void>;
  loadProject: (projectDir: string) => Promise<void>;

  // Tab management
  openTab: (item: Chapter | Idea) => void;
  openCharacterTab: (character: Character) => void; // NEW!
  closeTab: (tabId: string) => void;
  updateContent: (content: string) => void;
  saveCurrentFile: () => Promise<void>;

  // Content management
  addCharacter: (character: Omit<Character, "id">) => Promise<void>;
  updateCharacter: (id: string, character: Partial<Character>) => Promise<void>; // NEW!
  deleteCharacter: (id: string) => Promise<boolean>; // NEW!
  getCharacterUsage: (id: string) => CharacterUsage[]; // NEW!

  addChapter: (title: string) => Promise<void>;
  addIdea: (name: string) => Promise<void>;
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
  onMenuCloseProject: (callback: () => void) => void;
  onMenuSave: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Global window interface
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// Character Editor specific types
export interface CharacterFormData {
  traits: string;
  bio: string;
  appearance: string;
  active: boolean;
  names: {
    fullname: string;
    nickname?: string;
    reference?: string;
  };
  relationships?: string[];
  tags?: string[];
  notes?: string;
}

export interface CharacterEditorProps {
  character: Character;
  onSave: (character: Character) => Promise<void>;
  onCancel: () => void;
  usage: CharacterUsage[];
}
