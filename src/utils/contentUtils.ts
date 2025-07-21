// src/utils/contentUtils.ts
// ========================================
// 🔧 CONTENT UTILITIES
// ========================================

import { Character } from "../types";
import {
  CharacterContext,
  CharacterNode,
  ContentNode,
  ContentStats,
  ConversionResult,
  LineBreakNode,
  Location,
  LocationNode,
  TextNode,
} from "../types/structured";

// ========================================
// 🏗 NODE CREATORS
// ========================================

let nodeCounter = 0;

const generateNodeId = (type: string): string => {
  return `${type}-${Date.now()}-${++nodeCounter}`;
};

export const createTextNode = (content: string): TextNode => ({
  id: generateNodeId("text"),
  type: "text",
  content,
  createdAt: new Date().toISOString(),
});

export const createCharacterNode = (
  characterId: string,
  context: CharacterContext,
  emotion?: string,
  target?: string
): CharacterNode => ({
  id: generateNodeId("char"),
  type: "character",
  content: "",
  characterId,
  context,
  emotion,
  target,
  createdAt: new Date().toISOString(),
});

export const createLocationNode = (
  locationId: string,
  descriptor?: string
): LocationNode => ({
  id: generateNodeId("loc"),
  type: "location",
  content: "",
  locationId,
  descriptor,
  createdAt: new Date().toISOString(),
});

export const createLineBreakNode = (): LineBreakNode => ({
  id: generateNodeId("br"),
  type: "linebreak",
  content: "",
  createdAt: new Date().toISOString(),
});

// ========================================
// 📝 CONTENT MANIPULATION
// ========================================

export const insertNodeAt = (
  nodes: ContentNode[],
  index: number,
  newNode: ContentNode
): ContentNode[] => {
  return [...nodes.slice(0, index), newNode, ...nodes.slice(index)];
};

export const removeNodeAt = (
  nodes: ContentNode[],
  index: number
): ContentNode[] => {
  return nodes.filter((_, i) => i !== index);
};

export const updateNode = (
  nodes: ContentNode[],
  nodeId: string,
  updates: Partial<ContentNode>
): any[] => {
  return nodes.map((node) =>
    node.id === nodeId
      ? { ...node, ...updates, updatedAt: new Date().toISOString() }
      : node
  );
};

export const replaceCharacterInNodes = (
  nodes: ContentNode[],
  oldCharacterId: string,
  newCharacterId: string
): ContentNode[] => {
  return nodes.map((node) => {
    if (node.type === "character" && node.characterId === oldCharacterId) {
      return {
        ...node,
        characterId: newCharacterId,
        updatedAt: new Date().toISOString(),
      };
    }
    return node;
  });
};

export const replaceLocationInNodes = (
  nodes: ContentNode[],
  oldLocationId: string,
  newLocationId: string
): ContentNode[] => {
  return nodes.map((node) => {
    if (node.type === "location" && node.locationId === oldLocationId) {
      return {
        ...node,
        locationId: newLocationId,
        updatedAt: new Date().toISOString(),
      };
    }
    return node;
  });
};

// ========================================
// 🔍 CONTENT ANALYSIS
// ========================================

export const calculateContentStats = (
  nodes: ContentNode[],
  characters: Character[],
  locations: Location[]
): ContentStats => {
  const stats: ContentStats = {
    totalWords: 0,
    totalCharacters: 0,
    characterUsage: {},
    locationUsage: {},
    dialoguePercentage: 0,
    narrativePercentage: 0,
    actionPercentage: 0,
  };

  let dialogueNodes = 0;
  let narrativeNodes = 0;
  let actionNodes = 0;

  nodes.forEach((node, index) => {
    // Count words and characters
    if (node.type === "text") {
      const words = node.content.trim().split(/\s+/).length;
      stats.totalWords += words;
      stats.totalCharacters += node.content.length;
    }

    // Track character usage
    if (node.type === "character") {
      const charId = node.characterId;

      if (!stats.characterUsage[charId]) {
        stats.characterUsage[charId] = {
          dialogueCount: 0,
          narrativeCount: 0,
          referenceCount: 0,
          totalMentions: 0,
          firstAppearance: index,
        };
      }

      const usage = stats.characterUsage[charId];

      switch (node.context) {
        case "dialogue":
          usage.dialogueCount++;
          dialogueNodes++;
          break;
        case "narrative":
          usage.narrativeCount++;
          narrativeNodes++;
          break;
        case "reference":
          usage.referenceCount++;
          break;
      }

      usage.totalMentions++;
      usage.lastAppearance = index;
    }

    // Track location usage
    if (node.type === "location") {
      const locId = node.locationId;

      if (!stats.locationUsage[locId]) {
        stats.locationUsage[locId] = {
          mentionCount: 0,
          firstAppearance: index,
        };
      }

      stats.locationUsage[locId].mentionCount++;
      stats.locationUsage[locId].lastAppearance = index;
    }
  });

  // Calculate percentages
  const totalContentNodes = dialogueNodes + narrativeNodes + actionNodes;
  if (totalContentNodes > 0) {
    stats.dialoguePercentage = (dialogueNodes / totalContentNodes) * 100;
    stats.narrativePercentage = (narrativeNodes / totalContentNodes) * 100;
    stats.actionPercentage = (actionNodes / totalContentNodes) * 100;
  }

  return stats;
};

export const getCharacterUsageInChapter = (
  nodes: ContentNode[],
  characterId: string
): {
  totalMentions: number;
  contexts: { dialogue: number; narrative: number; reference: number };
  positions: number[];
} => {
  const usage = {
    totalMentions: 0,
    contexts: { dialogue: 0, narrative: 0, reference: 0 },
    positions: [] as number[],
  };

  nodes.forEach((node, index) => {
    if (node.type === "character" && node.characterId === characterId) {
      usage.totalMentions++;
      usage.contexts[node.context]++;
      usage.positions.push(index);
    }
  });

  return usage;
};

// ========================================
// 🔄 MARKDOWN CONVERSION
// ========================================

export const parseMarkdownToNodes = (
  markdownContent: string,
  characters: Character[],
  locations: Location[]
): ConversionResult => {
  const result: ConversionResult = {
    success: true,
    nodes: [],
    errors: [],
    warnings: [],
  };

  try {
    // Remove frontmatter
    const contentWithoutFrontmatter = markdownContent.replace(
      /^---[\s\S]*?---\n/,
      ""
    );
    const lines = contentWithoutFrontmatter.split("\n");

    lines.forEach((line, lineIndex) => {
      if (!line.trim()) {
        // Empty line
        result.nodes!.push(createLineBreakNode());
        return;
      }

      // Check for dialogue pattern: "CharacterName: 'text'"
      const dialogueMatch = line.match(/^(.+?):\s*"(.+)"$/);
      if (dialogueMatch) {
        const speakerName = dialogueMatch[1].trim();
        const dialogueText = dialogueMatch[2];

        // Find character by name or dialogue name
        const character = characters.find(
          (c) => c.name === speakerName || c.names?.dialogue === speakerName
        );

        if (character) {
          // Add character node for speaker
          result.nodes!.push(createCharacterNode(character.id, "dialogue"));

          // Add text node for dialogue content
          result.nodes!.push(createTextNode(`"${dialogueText}"`));
        } else {
          // Unknown character - add warning and keep as text
          result.warnings!.push(
            `Line ${lineIndex + 1}: Unknown character "${speakerName}"`
          );
          result.nodes!.push(createTextNode(line));
        }
      } else {
        // Regular text - parse for character and location mentions
        result.nodes!.push(
          ...parseTextForMentions(line, characters, locations)
        );
      }

      // Add line break after each line
      result.nodes!.push(createLineBreakNode());
    });
  } catch (error) {
    result.success = false;
    result.errors!.push(`Failed to parse markdown: ${error}`);
  }

  return result;
};

const parseTextForMentions = (
  text: string,
  characters: Character[],
  locations: Location[]
): ContentNode[] => {
  const nodes: ContentNode[] = [];

  // Find all mentions (characters and locations)
  const mentions: Array<{
    type: "character" | "location";
    id: string;
    name: string;
    start: number;
    end: number;
    context?: CharacterContext;
  }> = [];

  // Find character mentions
  characters.forEach((character) => {
    const patterns = [
      character.name,
      character.names?.narrative,
      character.names?.dialogue,
      character.names?.reference,
    ].filter(Boolean) as string[];

    patterns.forEach((pattern) => {
      const regex = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, "g");
      let match;

      while ((match = regex.exec(text)) !== null) {
        // Determine context based on surrounding text
        const context = determineCharacterContext(text, match.index, pattern);

        mentions.push({
          type: "character",
          id: character.id,
          name: pattern,
          start: match.index,
          end: match.index + pattern.length,
          context,
        });
      }
    });
  });

  // Find location mentions
  locations.forEach((location) => {
    const patterns = [
      location.name,
      location.names?.short,
      location.names?.full,
    ].filter(Boolean) as string[];

    patterns.forEach((pattern) => {
      const regex = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, "g");
      let match;

      while ((match = regex.exec(text)) !== null) {
        mentions.push({
          type: "location",
          id: location.id,
          name: pattern,
          start: match.index,
          end: match.index + pattern.length,
        });
      }
    });
  });

  // Sort mentions by position
  mentions.sort((a, b) => a.start - b.start);

  // Remove overlapping mentions (keep the first one)
  const cleanMentions = mentions.filter((mention, index) => {
    if (index === 0) return true;
    const previous = mentions[index - 1];
    return mention.start >= previous.end;
  });

  // Build nodes
  let textStart = 0;

  cleanMentions.forEach((mention) => {
    // Add text before mention
    if (mention.start > textStart) {
      const textContent = text.substring(textStart, mention.start);
      if (textContent) {
        nodes.push(createTextNode(textContent));
      }
    }

    // Add mention node
    if (mention.type === "character") {
      nodes.push(
        createCharacterNode(mention.id, mention.context || "narrative")
      );
    } else {
      nodes.push(createLocationNode(mention.id));
    }

    textStart = mention.end;
  });

  // Add remaining text
  if (textStart < text.length) {
    const remainingText = text.substring(textStart);
    if (remainingText) {
      nodes.push(createTextNode(remainingText));
    }
  }

  // If no mentions found, return the whole text as a single node
  if (nodes.length === 0) {
    nodes.push(createTextNode(text));
  }

  return nodes;
};

const determineCharacterContext = (
  text: string,
  position: number,
  characterName: string
): CharacterContext => {
  const beforeText = text.substring(0, position).toLowerCase();
  const afterText = text
    .substring(position + characterName.length)
    .toLowerCase();

  // Check for dialogue patterns
  if (beforeText.trim().endsWith(":") || afterText.trim().startsWith(":")) {
    return "dialogue";
  }

  // Check for action verbs after character name
  const actionVerbs = [
    "เดิน",
    "พูด",
    "มอง",
    "หัน",
    "วิ่ง",
    "นั่ง",
    "ยืน",
    "ยิ้ม",
    "หัวเราะ",
  ];
  const nextWords = afterText.trim().split(/\s+/).slice(0, 2);

  if (nextWords.some((word) => actionVerbs.includes(word))) {
    return "narrative";
  }

  // Check for possessive or reference patterns
  const referencePatterns = ["ของ", "ที่", "ซึ่ง", "เขา", "เธอ"];
  if (
    referencePatterns.some((pattern) => afterText.trim().startsWith(pattern))
  ) {
    return "reference";
  }

  // Default to narrative
  return "narrative";
};

// ========================================
// 📄 RENDER TO TEXT
// ========================================

export const renderNodesToText = (
  nodes: ContentNode[],
  characters: Character[],
  locations: Location[]
): string => {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
          return node.content;

        case "character":
          const character = characters.find((c) => c.id === node.characterId);
          if (!character) return "[Unknown Character]";

          switch (node.context) {
            case "dialogue":
              const dialogueName = character.names?.dialogue || character.name;
              return dialogueName + (node.content ? "" : ":");
            case "narrative":
              return character.names?.narrative || character.name;
            case "reference":
              return character.names?.reference || character.name;
            default:
              return character.name;
          }

        case "location":
          const location = locations.find((l) => l.id === node.locationId);
          if (!location) return "[Unknown Location]";
          return location.names?.short || location.name;

        case "linebreak":
          return "\n";

        default:
          return "";
      }
    })
    .join("");
};

// ========================================
// 🛠 UTILITY HELPERS
// ========================================

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const validateNodes = (nodes: ContentNode[]): string[] => {
  const errors: string[] = [];

  nodes.forEach((node, index) => {
    if (!node.id) {
      errors.push(`Node at index ${index} missing ID`);
    }

    if (node.type === "character" && !node.characterId) {
      errors.push(`Character node at index ${index} missing characterId`);
    }

    if (node.type === "location" && !node.locationId) {
      errors.push(`Location node at index ${index} missing locationId`);
    }
  });

  return errors;
};

export const cleanupNodes = (nodes: ContentNode[]): ContentNode[] => {
  return nodes.filter((node, index) => {
    // Remove consecutive line breaks
    if (node.type === "linebreak") {
      const nextNode = nodes[index + 1];
      return !(nextNode && nextNode.type === "linebreak");
    }

    // Remove empty text nodes
    if (node.type === "text") {
      return node.content.trim().length > 0;
    }

    return true;
  });
};

// Helper functions สำหรับแปลง HTML <-> ContentNode[]
export function convertHtmlToContentNodes(htmlContent: string): ContentNode[] {
  // console.log("🔍 HTML Input:", JSON.stringify(htmlContent));

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  console.log("📋 tempDiv childNodes:", tempDiv.childNodes);

  const nodes: ContentNode[] = [];

  // ฟังก์ชันช่วยสำหรับ parse nodes recursively
  const processNode = (
    node: Node,
    index: number,
    parentType: string = "root",
    isLast: boolean = false
  ) => {
    console.log(`📝 Processing ${parentType} node ${index}:`, {
      nodeType: node.nodeType,
      nodeName: node.nodeName,
      textContent: node.textContent,
      innerHTML: (node as any).innerHTML,
    });

    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || "";
      console.log("📄 TEXT_NODE content:", JSON.stringify(textContent));

      // แยก text ด้วย newlines แทนที่จะ trim ทิ้ง
      const lines = textContent.split("\n");
      console.log("📄 Split lines:", lines);

      lines.forEach((line, lineIndex) => {
        // เอาข้อความที่มีเนื้อหา (รวม whitespace) แต่ไม่เอาบรรทัดว่างเปล่า
        if (line.length > 0) {
          // เปลี่ยนจาก line.trim() เป็น line.length เพื่อ preserve spaces
          const textNode = {
            id: `text-${Date.now()}-${index}-${lineIndex}-${Math.random()}`,
            type: "text" as const,
            content: line,
            createdAt: new Date().toISOString(),
          };
          console.log("➕ Adding text node:", textNode);
          nodes.push(textNode);
        }

        // เพิ่ม linebreak ถ้ายังไม่ใช่บรรทัดสุดท้าย
        if (lineIndex < lines.length - 1) {
          const brNode = {
            id: `br-${Date.now()}-${index}-${lineIndex}-${Math.random()}`,
            type: "linebreak" as const,
            content: "",
            createdAt: new Date().toISOString(),
          };
          console.log("➕ Adding linebreak node:", brNode);
          nodes.push(brNode);
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      console.log("🏷️ ELEMENT_NODE:", element.tagName);

      if (element.tagName === "CHAR-REF") {
        const characterId = element.getAttribute("id") || "";
        const content = element.textContent || "";
        const charNode = {
          id: `char-${Date.now()}-${index}-${Math.random()}`,
          type: "character" as const,
          characterId,
          content,
          context: "narrative" as const,
          createdAt: new Date().toISOString(),
        };
        console.log("➕ Adding character node:", charNode);
        nodes.push(charNode);
      } else if (element.tagName === "LOC-REF") {
        const locationId = element.getAttribute("id") || "";
        const content = element.textContent || "";
        const locNode = {
          id: `loc-${Date.now()}-${index}-${Math.random()}`,
          type: "location" as const,
          locationId,
          content,
          createdAt: new Date().toISOString(),
        };
        console.log("➕ Adding location node:", locNode);
        nodes.push(locNode);
      } else if (element.tagName === "BR") {
        const brNode = {
          id: `br-${Date.now()}-${index}-${Math.random()}`,
          type: "linebreak" as const,
          content: "",
          createdAt: new Date().toISOString(),
        };
        console.log("➕ Adding BR linebreak node:", brNode);
        nodes.push(brNode);
      } else if (element.tagName === "DIV") {
        // Handle <div> elements - parse child nodes ข้างใน
        console.log("📦 DIV element, processing children...");

        // เช็คว่า div นี้มีแค่ <br> อย่างเดียวหรือเปล่า
        const hasOnlyBr =
          element.childNodes.length === 1 &&
          element.firstChild?.nodeName === "BR";

        // เช็คว่า child node สุดท้ายเป็น <br> หรือเปล่า
        const lastChildIsBr = element.lastChild?.nodeName === "BR";

        // ถ้า div มีแค่ <br> ก็แค่เพิ่ม linebreak อย่างเดียว
        if (hasOnlyBr) {
          const brNode = {
            id: `br-${Date.now()}-${index}-empty-div-${Math.random()}`,
            type: "linebreak" as const,
            content: "",
            createdAt: new Date().toISOString(),
          };
          // console.log("➕ Adding empty DIV linebreak node:", brNode);
          nodes.push(brNode);
        } else {
          // Process child nodes recursively สำหรับ div ที่มีเนื้อหา
          const divChildren = Array.from(element.childNodes);
          divChildren.forEach((childNode, childIndex) => {
            processNode(
              childNode,
              childIndex,
              "div-child",
              childIndex === divChildren.length - 1
            );
          });

          // ไม่เพิ่ม linebreak หลัง div ถ้า:
          // 1. เป็น div สุดท้าย หรือ
          // 2. child node สุดท้ายเป็น <br> อยู่แล้ว (เพราะ <br> จัดการ linebreak ให้แล้ว)
          if (!isLast && !lastChildIsBr) {
            const brNode = {
              id: `br-${Date.now()}-${index}-content-div-${Math.random()}`,
              type: "linebreak" as const,
              content: "",
              createdAt: new Date().toISOString(),
            };
            // console.log("➕ Adding content DIV linebreak node:", brNode);
            nodes.push(brNode);
          }
        }
      }
    }
  };

  // Process root level nodes
  const childNodes = Array.from(tempDiv.childNodes);
  childNodes.forEach((node, index) => {
    processNode(node, index, "root", index === childNodes.length - 1);

    // เพิ่ม linebreak ระหว่าง root level nodes (ยกเว้น node สุดท้าย)
    // และไม่เพิ่มถ้า node ถัดไปเป็น DIV (เพราะ DIV จัดการ linebreak เอง)
    const nextNode = childNodes[index + 1];
    const shouldAddLinebreak =
      index < childNodes.length - 1 && // ไม่ใช่ node สุดท้าย
      node.nodeType === Node.ELEMENT_NODE && // node ปัจจุบันเป็น element
      (node as Element).tagName !== "DIV" && // ไม่ใช่ DIV
      nextNode?.nodeType === Node.ELEMENT_NODE && // node ถัดไปเป็น element
      (nextNode as Element).tagName === "DIV"; // node ถัดไปเป็น DIV

    if (shouldAddLinebreak) {
      const brNode = {
        id: `br-${Date.now()}-root-${index}-${Math.random()}`,
        type: "linebreak" as const,
        content: "",
        createdAt: new Date().toISOString(),
      };
      // console.log("➕ Adding root level linebreak node:", brNode);
      nodes.push(brNode);
    }
  });

  // console.log("✅ convertHtmlToContentNodes OUTPUT:", nodes);
  return nodes;
}

export function convertContentNodesToHtml(nodes: ContentNode[]): string {
  // console.log("🔄 convertContentNodesToHtml INPUT:", nodes);

  const html = nodes
    .map((node, index) => {
      let result = "";
      switch (node.type) {
        case "text":
          result = node.content;
          // console.log(`📝 Node ${index} (text):`, JSON.stringify(result));
          break;
        case "character":
          result = `<char-ref id="${(node as any).characterId}">${
            node.content
          }</char-ref>`;
          // console.log(`👤 Node ${index} (character):`, result);
          break;
        case "location":
          result = `<loc-ref id="${(node as any).locationId}">${
            node.content
          }</loc-ref>`;
          // console.log(`📍 Node ${index} (location):`, result);
          break;
        case "linebreak":
          result = "\n";
          // console.log(`⏎ Node ${index} (linebreak):`, JSON.stringify(result));
          break;
        default:
          result = "";
          // console.log(`❓ Node ${index} (unknown):`, node);
          break;
      }
      return result;
    })
    .join("");

  // console.log("✅ convertContentNodesToHtml OUTPUT:", JSON.stringify(html));
  return html;
}
