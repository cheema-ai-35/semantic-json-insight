import { DiffNode, formatValue, getDiffStats } from "@/lib/jsonDiff";
import { ChevronDown, ChevronRight, Plus, Minus, Edit3, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DiffViewerProps {
  diffs: DiffNode[];
}

const DiffIcon = ({ type }: { type: DiffNode["type"] }) => {
  switch (type) {
    case "added":
      return <Plus className="h-4 w-4 text-success" />;
    case "removed":
      return <Minus className="h-4 w-4 text-destructive" />;
    case "modified":
      return <Edit3 className="h-4 w-4 text-warning" />;
    default:
      return <Check className="h-4 w-4 text-muted-foreground" />;
  }
};

const DiffNodeComponent = ({ node, level = 0 }: { node: DiffNode; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;

  const getBackgroundClass = () => {
    if (isLeaf) {
      switch (node.type) {
        case "added":
          return "bg-diff-added-bg border-l-4 border-success";
        case "removed":
          return "bg-diff-removed-bg border-l-4 border-destructive";
        case "modified":
          return "bg-diff-modified-bg border-l-4 border-warning";
        default:
          return "bg-muted/30 border-l-4 border-muted";
      }
    }
    return "";
  };

  const getTextClass = () => {
    switch (node.type) {
      case "added":
        return "text-success font-medium";
      case "removed":
        return "text-destructive font-medium";
      case "modified":
        return "text-warning font-medium";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="mb-1">
      <div
        className={cn(
          "flex items-start gap-2 py-2 px-3 rounded-md transition-all hover:bg-muted/50",
          getBackgroundClass()
        )}
        style={{ marginLeft: `${level * 20}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-0.5 hover:bg-background/50 rounded p-0.5 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        <DiffIcon type={node.type} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-foreground">
              {node.path}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs capitalize",
                node.type === "added" && "border-success text-success",
                node.type === "removed" && "border-destructive text-destructive",
                node.type === "modified" && "border-warning text-warning",
                node.type === "unchanged" && "border-muted text-muted-foreground"
              )}
            >
              {node.type}
            </Badge>
          </div>

          {isLeaf && (
            <div className="mt-1 space-y-1">
              {node.oldValue !== undefined && node.type !== "added" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Old:</span>
                  <code className="text-xs font-mono bg-background/50 px-2 py-1 rounded text-destructive">
                    {formatValue(node.oldValue)}
                  </code>
                </div>
              )}
              {node.newValue !== undefined && node.type !== "removed" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">New:</span>
                  <code className="text-xs font-mono bg-background/50 px-2 py-1 rounded text-success">
                    {formatValue(node.newValue)}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {node.children?.map((child, index) => (
            <DiffNodeComponent key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const DiffViewer = ({ diffs }: DiffViewerProps) => {
  const stats = getDiffStats(diffs);

  if (diffs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No differences to display. Compare two JSON objects to see results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success" />
          <span className="text-sm font-medium">{stats.added} Added</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="text-sm font-medium">{stats.removed} Removed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-warning" />
          <span className="text-sm font-medium">{stats.modified} Modified</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-muted" />
          <span className="text-sm font-medium">{stats.unchanged} Unchanged</span>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4 max-h-[600px] overflow-auto">
        {diffs.map((diff, index) => (
          <DiffNodeComponent key={index} node={diff} />
        ))}
      </div>
    </div>
  );
};
