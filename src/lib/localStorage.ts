// lib/localStorage.ts
// 🎯 TIER 1: LocalStorage utility for persisting architecture designs

import { Node, Edge } from "@/components/generative-ai/ArchitectureCanvas";

// 🎯 LEARNING: Interface for saved designs
export interface SavedDesign {
  id: string;              // Unique ID (timestamp-based)
  prompt: string;          // User's original input
  timestamp: number;       // When it was created (ms since epoch)
  nodes: Node[];           // Architecture components
  edges: Edge[];           // Connections
  explanations: string[];  // AI-generated insights
}

// 🎯 LEARNING: localStorage key (like a database table name)
const STORAGE_KEY = "buildwise_saved_designs";

/**
 * 🎯 FUNCTION: Save a new design to localStorage
 * 
 * How it works:
 * 1. Get existing designs from localStorage
 * 2. Add new design at the start (newest first)
 * 3. Keep only last 3 designs (slice off old ones)
 * 4. Save back to localStorage
 * 
 * @param design - The design to save (without id/timestamp)
 */
export function saveDesign(design: Omit<SavedDesign, "id" | "timestamp">): void {
  try {
    // Get existing designs (or empty array if none)
    const existing = loadDesigns();
    
    // Create new design with unique ID and timestamp
    const newDesign: SavedDesign = {
      ...design,
      id: `design_${Date.now()}`, // Unique ID: "design_1699392847123"
      timestamp: Date.now(),       // Current time in milliseconds
    };
    
    // Add to start of array (newest first)
    const updated = [newDesign, ...existing];
    
    // Keep only last 3 designs
    const limited = updated.slice(0, 3);
    
    // Save to localStorage (must convert to JSON string)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    
    console.log("✅ Design saved to localStorage:", newDesign.id);
  } catch (error) {
    // localStorage might be full or disabled
    console.error("❌ Failed to save design:", error);
  }
}

/**
 * 🎯 FUNCTION: Load all saved designs from localStorage
 * 
 * @returns Array of saved designs (newest first), or empty array if none
 */
export function loadDesigns(): SavedDesign[] {
  try {
    // Get data from localStorage
    const data = localStorage.getItem(STORAGE_KEY);
    
    // If no data, return empty array
    if (!data) return [];
    
    // Parse JSON string back to array
    const designs: SavedDesign[] = JSON.parse(data);
    
    return designs;
  } catch (error) {
    console.error("❌ Failed to load designs:", error);
    return [];
  }
}

/**
 * 🎯 FUNCTION: Get a specific design by ID
 * 
 * @param id - The design ID to find
 * @returns The design, or undefined if not found
 */
export function getDesignById(id: string): SavedDesign | undefined {
  const designs = loadDesigns();
  return designs.find((d) => d.id === id);
}

/**
 * 🎯 FUNCTION: Delete a specific design
 * 
 * @param id - The design ID to delete
 */
export function deleteDesign(id: string): void {
  try {
    const designs = loadDesigns();
    const filtered = designs.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log("✅ Design deleted:", id);
  } catch (error) {
    console.error("❌ Failed to delete design:", error);
  }
}

/**
 * 🎯 FUNCTION: Clear all saved designs
 */
export function clearAllDesigns(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("✅ All designs cleared");
  } catch (error) {
    console.error("❌ Failed to clear designs:", error);
  }
}

/**
 * 🎯 FUNCTION: Format timestamp for display
 * 
 * @param timestamp - Milliseconds since epoch
 * @returns Human-readable date/time string
 * 
 * Example: 1699392847123 → "Nov 7, 2:34 PM"
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  
  // Format: "Nov 7, 2:34 PM"
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
