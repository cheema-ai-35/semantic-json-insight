/**
 * JSON Semantic Diff Library
 * Compares two JSON objects semantically and returns structured diff data
 */

export type DiffType = "added" | "removed" | "modified" | "unchanged";

export interface DiffNode {
  path: string;
  type: DiffType;
  oldValue?: any;
  newValue?: any;
  children?: DiffNode[];
}

/**
 * Deep clone helper
 */
function deepClone(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (typeof obj === "object") {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Check if two values are deeply equal
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Get type of value for display
 */
function getValueType(value: any): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/**
 * Format value for display
 */
export function formatValue(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    return `{${Object.keys(value).length} keys}`;
  }
  return String(value);
}

/**
 * Main diff function - compares two JSON objects semantically
 */
export function compareJSON(
  oldObj: any,
  newObj: any,
  path: string = ""
): DiffNode[] {
  const diffs: DiffNode[] = [];

  // If both are primitive or null
  if (
    (oldObj === null || typeof oldObj !== "object") &&
    (newObj === null || typeof newObj !== "object")
  ) {
    if (!deepEqual(oldObj, newObj)) {
      diffs.push({
        path: path || "/",
        type: "modified",
        oldValue: oldObj,
        newValue: newObj,
      });
    } else {
      diffs.push({
        path: path || "/",
        type: "unchanged",
        oldValue: oldObj,
        newValue: newObj,
      });
    }
    return diffs;
  }

  // If types don't match
  if (getValueType(oldObj) !== getValueType(newObj)) {
    diffs.push({
      path: path || "/",
      type: "modified",
      oldValue: oldObj,
      newValue: newObj,
    });
    return diffs;
  }

  // Handle arrays
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    const maxLength = Math.max(oldObj.length, newObj.length);
    const children: DiffNode[] = [];

    for (let i = 0; i < maxLength; i++) {
      const itemPath = `${path}[${i}]`;
      
      if (i >= oldObj.length) {
        children.push({
          path: itemPath,
          type: "added",
          newValue: newObj[i],
        });
      } else if (i >= newObj.length) {
        children.push({
          path: itemPath,
          type: "removed",
          oldValue: oldObj[i],
        });
      } else {
        const itemDiffs = compareJSON(oldObj[i], newObj[i], itemPath);
        children.push(...itemDiffs);
      }
    }

    diffs.push({
      path: path || "/",
      type: children.some((c) => c.type !== "unchanged") ? "modified" : "unchanged",
      oldValue: oldObj,
      newValue: newObj,
      children,
    });

    return diffs;
  }

  // Handle objects
  if (typeof oldObj === "object" && typeof newObj === "object") {
    const allKeys = new Set([
      ...Object.keys(oldObj || {}),
      ...Object.keys(newObj || {}),
    ]);
    const children: DiffNode[] = [];

    for (const key of allKeys) {
      const keyPath = path ? `${path}.${key}` : key;
      const hasOld = oldObj && key in oldObj;
      const hasNew = newObj && key in newObj;

      if (!hasOld && hasNew) {
        children.push({
          path: keyPath,
          type: "added",
          newValue: newObj[key],
        });
      } else if (hasOld && !hasNew) {
        children.push({
          path: keyPath,
          type: "removed",
          oldValue: oldObj[key],
        });
      } else {
        const keyDiffs = compareJSON(oldObj[key], newObj[key], keyPath);
        children.push(...keyDiffs);
      }
    }

    diffs.push({
      path: path || "/",
      type: children.some((c) => c.type !== "unchanged") ? "modified" : "unchanged",
      oldValue: oldObj,
      newValue: newObj,
      children,
    });

    return diffs;
  }

  return diffs;
}

/**
 * Get statistics about the diff
 */
export function getDiffStats(diffs: DiffNode[]): {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
} {
  let added = 0;
  let removed = 0;
  let modified = 0;
  let unchanged = 0;

  function countDiffs(nodes: DiffNode[]) {
    for (const node of nodes) {
      switch (node.type) {
        case "added":
          added++;
          break;
        case "removed":
          removed++;
          break;
        case "modified":
          modified++;
          break;
        case "unchanged":
          unchanged++;
          break;
      }
      if (node.children) {
        countDiffs(node.children);
      }
    }
  }

  countDiffs(diffs);

  return { added, removed, modified, unchanged };
}
