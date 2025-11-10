import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, FileJson } from "lucide-react";
import { validateJSON } from "@/lib/jsonUtils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DiffNode } from "@/lib/jsonDiff";

interface InlineDiffEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  diffs?: DiffNode[];
  isReference?: boolean;
}

export const InlineDiffEditor = ({
  value,
  onChange,
  label,
  placeholder = "Paste your JSON here...",
  diffs = [],
  isReference = false,
}: InlineDiffEditorProps) => {
  const { toast } = useToast();
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [highlightedLines, setHighlightedLines] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (value.trim() === "") {
      setIsValid(true);
      setErrorMessage("");
      return;
    }

    const validation = validateJSON(value);
    setIsValid(validation.isValid);
    setErrorMessage(validation.error || "");
  }, [value]);

  useEffect(() => {
    if (!diffs || diffs.length === 0 || !value) {
      setHighlightedLines(new Map());
      return;
    }

    const lines = value.split('\n');
    const lineMap = new Map<number, string>();

    // Build a map of paths to line numbers
    const pathToLine = new Map<string, number>();
    let currentPath = '';
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      // Extract keys from the line
      const keyMatch = trimmed.match(/^"([^"]+)":/);
      if (keyMatch) {
        const key = keyMatch[1];
        // Simple path tracking (this is a basic implementation)
        if (currentPath) {
          pathToLine.set(`${currentPath}.${key}`, index);
        } else {
          pathToLine.set(key, index);
        }
      }
    });

    // Collect all changed paths from diffs
    const collectPaths = (nodes: DiffNode[], paths: Set<string>) => {
      nodes.forEach(node => {
        if (node.type !== 'unchanged') {
          paths.add(node.path);
        }
        if (node.children) {
          collectPaths(node.children, paths);
        }
      });
    };

    const changedPaths = new Set<string>();
    collectPaths(diffs, changedPaths);

    // Map paths to line numbers and assign colors
    changedPaths.forEach(path => {
      const diff = findDiffByPath(diffs, path);
      if (!diff) return;

      // Find the line that contains this path
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Extract the key from the path
        const pathParts = path.split('.');
        const lastPart = pathParts[pathParts.length - 1];
        
        if (trimmed.includes(`"${lastPart}":`)) {
          // Determine color based on diff type and reference side
          let colorClass = '';
          if (isReference) {
            // Reference side: show removals and modifications
            if (diff.type === 'removed') {
              colorClass = 'removed';
            } else if (diff.type === 'modified') {
              colorClass = 'modified';
            }
          } else {
            // Comparison side: show additions and modifications
            if (diff.type === 'added') {
              colorClass = 'added';
            } else if (diff.type === 'modified') {
              colorClass = 'modified';
            }
          }
          
          if (colorClass) {
            lineMap.set(index, colorClass);
          }
        }
      });
    });

    setHighlightedLines(lineMap);
  }, [diffs, value, isReference]);

  const findDiffByPath = (nodes: DiffNode[], path: string): DiffNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findDiffByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied!",
        description: "JSON copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    onChange("");
    toast({
      title: "Cleared",
      description: "Input has been cleared",
    });
  };

  const renderHighlightedJson = () => {
    if (!value) return null;
    const lines = value.split('\n');
    
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden font-mono text-sm whitespace-pre-wrap break-words p-3">
        {lines.map((line, index) => {
          const highlight = highlightedLines.get(index);
          return (
            <div
              key={index}
              className={cn(
                "leading-[1.5]",
                highlight === 'added' && "bg-diff-added-bg border-l-2 border-l-diff-added -ml-1 pl-1",
                highlight === 'removed' && "bg-diff-removed-bg border-l-2 border-l-diff-removed -ml-1 pl-1",
                highlight === 'modified' && "bg-diff-modified-bg border-l-2 border-l-diff-modified -ml-1 pl-1"
              )}
            >
              <span className="invisible">{line || ' '}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          {isReference && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Reference
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!value}
            className="h-8 w-8 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!value}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="relative h-full">
          {renderHighlightedJson()}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full h-full min-h-[400px] font-mono text-sm resize-none bg-transparent relative z-10 p-3 outline-none border rounded-md transition-colors",
              !isValid && value ? "border-destructive" : "border-input",
              "focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
            spellCheck={false}
          />
        </div>
        {!isValid && errorMessage && (
          <div className="absolute bottom-2 left-2 right-2 bg-destructive/10 border border-destructive/20 rounded-md p-2 z-20">
            <p className="text-xs text-destructive font-medium">
              Invalid JSON: {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};