// src/types/structured.ts
// ========================================
// 🏗 STRUCTURED CONTENT TYPES
// ========================================

export type ContentNodeType = "text" | "character" | "location" | "linebreak";
export type CharacterContext = "dialogue" | "narrative" | "reference";

export interface BaseContentNode {
  id: string;
  type: ContentNodeType;
  content: string;

  // Position tracking for editor
  startPos?: number;
  endPos?: number;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface TextNode extends BaseContentNode {
  type: "text";
  // No additional properties
}

export interface CharacterNode extends BaseContentNode {
  type: "character";
  characterId: string;
  context: CharacterContext;

  // Optional metadata
  emotion?: string; // 'angry', 'sad', 'happy', etc.
  volume?: string; // 'whisper', 'shout', 'normal'
  target?: string; // who they're talking to
  interruption?: boolean; // if interrupting someone
}

export interface LocationNode extends BaseContentNode {
  type: "location";
  locationId: string;

  // Optional metadata
  descriptor?: string; // 'inside', 'outside', 'near', etc.
}

export interface LineBreakNode extends BaseContentNode {
  type: "linebreak";
  // No additional properties
}

export type ContentNode =
  | TextNode
  | CharacterNode
  | LocationNode
  | LineBreakNode;

// ========================================
// 📄 STRUCTURED CHAPTER
// ========================================

export interface StructuredChapter {
  id: string;
  filename: string;
  path: string;

  // Version for migration compatibility
  version: "2.0";

  metadata: {
    order: number;
    title: string;
    tags: string[];
    characters: string[]; // character IDs used in this chapter
    locations: string[]; // location IDs used in this chapter

    // Stats
    wordCount?: number;
    characterCount?: number;
    estimatedReadTime?: number; // minutes

    // Timestamps
    createdAt: string;
    updatedAt: string;
  };

  // Main content as structured nodes
  content: ContentNode[];

  // Optional: backup of original markdown (for migration)
  originalMarkdown?: string;
}

// ========================================
// 🏢 LOCATION TYPE (new)
// ========================================

export interface Location {
  id: string;
  name: string;
  description?: string;
  type?: "indoor" | "outdoor" | "vehicle" | "abstract";

  // Hierarchy support
  parentLocation?: string; // ID of parent location
  subLocations?: string[]; // IDs of child locations

  // Display names for different contexts
  names?: {
    short?: string; // "ห้องสมุด"
    full?: string; // "ห้องสมุดใหญ่ของโรงเรียน"
    description?: string; // "ห้องสมุดที่เงียบสงบ"
  };

  // Visual
  color?: string;
  active: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ========================================
// 📊 CONTENT ANALYSIS TYPES
// ========================================

export interface ContentStats {
  totalWords: number;
  totalCharacters: number;

  // Character usage
  characterUsage: {
    [characterId: string]: {
      dialogueCount: number;
      narrativeCount: number;
      referenceCount: number;
      totalMentions: number;
      firstAppearance?: number; // node index
      lastAppearance?: number; // node index
    };
  };

  // Location usage
  locationUsage: {
    [locationId: string]: {
      mentionCount: number;
      firstAppearance?: number;
      lastAppearance?: number;
    };
  };

  // Content distribution
  dialoguePercentage: number;
  narrativePercentage: number;
  actionPercentage: number;
}

// ========================================
// 🔄 CONVERSION UTILITIES
// ========================================

export interface ConversionResult {
  success: boolean;
  nodes?: ContentNode[];
  errors?: string[];
  warnings?: string[];
}

export interface MigrationReport {
  totalChapters: number;
  successfulMigrations: number;
  failedMigrations: number;

  details: {
    [chapterId: string]: {
      success: boolean;
      originalWordCount: number;
      newWordCount: number;
      charactersDetected: string[];
      locationsDetected: string[];
      errors?: string[];
    };
  };
}

// ========================================
// 🎯 EDITOR STATE TYPES
// ========================================

export interface EditorState {
  content: ContentNode[];

  // Cursor and selection
  cursorPosition: number;
  selectionStart?: number;
  selectionEnd?: number;

  // UI state
  showAutocomplete: boolean;
  autocompleteQuery: string;
  autocompleteType?: "character" | "location";

  // History for undo/redo
  history: ContentNode[][];
  historyIndex: number;

  // Modification tracking
  isModified: boolean;
  lastSaved?: string;
}

export interface AutocompleteItem {
  id: string;
  name: string;
  type: "character" | "location";
  context?: CharacterContext;
  description?: string;

  // For ranking search results
  relevanceScore?: number;
  recentlyUsed?: boolean;
}

// ========================================
// 🔧 UTILITY FUNCTIONS TYPES
// ========================================

export type NodeRenderer = (
  node: ContentNode,
  index: number
) => React.ReactNode;

export type NodeUpdater = (
  nodes: ContentNode[],
  nodeId: string,
  updates: Partial<ContentNode>
) => ContentNode[];

export type CharacterReplacer = (
  nodes: ContentNode[],
  oldCharacterId: string,
  newCharacterId: string
) => ContentNode[];

// ========================================
// 🎨 THEME & STYLING TYPES
// ========================================

export interface TagTheme {
  dialogue: {
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
  };
  narrative: {
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
  };
  reference: {
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
  };
  location: {
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
  };
}

export interface EditorTheme {
  tags: TagTheme;
  background: string;
  textColor: string;

  // Interactive states
  hover: {
    backgroundColor: string;
    transform?: string;
  };
  active: {
    backgroundColor: string;
    borderColor: string;
  };

  // Error states
  error: {
    backgroundColor: string;
    borderColor: string;
  };
}

// ========================================
// 📁 FILE FORMAT TYPES
// ========================================

export interface StructuredChapterFile {
  // File header
  fileType: "structured-chapter";
  version: "2.0";

  // Chapter data
  chapter: StructuredChapter;

  // Checksum for integrity verification
  checksum?: string;
}

export interface LegacyChapterFile {
  fileType: "markdown-chapter";
  version: "1.0";

  // Raw markdown content
  markdown: string;

  // Parsed frontmatter
  frontmatter: {
    order: number;
    title: string;
    tags: string[];
    characters: string[];
    location: string;
  };
}

// ========================================
// 🚀 EXPORT TYPES (future use)
// ========================================

export interface ExportOptions {
  format: "markdown" | "html" | "pdf" | "epub" | "plaintext";

  // Character name formatting
  characterNameFormat: {
    dialogue: "original" | "display" | "custom";
    narrative: "original" | "display" | "custom";
    reference: "original" | "display" | "custom";
    customMapping?: { [characterId: string]: string };
  };

  // Location formatting
  locationNameFormat: {
    display: "short" | "full" | "description" | "custom";
    customMapping?: { [locationId: string]: string };
  };

  // Output options
  includeMetadata: boolean;
  includeStats: boolean;
  addLineNumbers: boolean;

  // Styling (for HTML/PDF)
  theme?: "light" | "dark" | "print";
  fontSize?: number;
  fontFamily?: string;
}

export interface ExportResult {
  success: boolean;
  format: string;
  content?: string;
  filePath?: string;

  // Statistics
  totalWords: number;
  totalCharacters: number;
  totalPages?: number;

  errors?: string[];
  warnings?: string[];
}
