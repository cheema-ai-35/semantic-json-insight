/**
 * JSON Utility Functions
 * Handles JSON validation, formatting, and parsing
 */

export interface JsonValidationResult {
  isValid: boolean;
  error?: string;
  parsed?: any;
}

/**
 * Validate and parse JSON string
 */
export function validateJSON(jsonString: string): JsonValidationResult {
  if (!jsonString || jsonString.trim() === "") {
    return {
      isValid: false,
      error: "Empty JSON input",
    };
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      isValid: true,
      parsed,
    };
  } catch (error) {
    const e = error as Error;
    return {
      isValid: false,
      error: e.message,
    };
  }
}

/**
 * Format JSON with proper indentation
 */
export function formatJSON(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    return String(obj);
  }
}

/**
 * Minify JSON
 */
export function minifyJSON(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    return String(obj);
  }
}

/**
 * Get sample JSON for demo purposes
 */
export function getSampleJSON(): { left: string; right: string } {
  const left = {
    name: "John Doe",
    age: 30,
    email: "john@example.com",
    address: {
      street: "123 Main St",
      city: "New York",
      country: "USA",
    },
    hobbies: ["reading", "gaming", "cooking"],
    settings: {
      notifications: true,
      theme: "dark",
    },
  };

  const right = {
    name: "John Doe",
    age: 31,
    email: "john.doe@example.com",
    address: {
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      country: "USA",
    },
    hobbies: ["reading", "gaming", "photography"],
    settings: {
      notifications: false,
      theme: "dark",
      language: "en",
    },
  };

  return {
    left: formatJSON(left),
    right: formatJSON(right),
  };
}
