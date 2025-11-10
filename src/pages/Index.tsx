import { useState } from "react";
import { InlineDiffEditor } from "@/components/InlineDiffEditor";
import { DiffViewer } from "@/components/DiffViewer";
import { Button } from "@/components/ui/button";
import { compareJSON, DiffNode } from "@/lib/jsonDiff";
import { validateJSON, getSampleJSON, formatJSON } from "@/lib/jsonUtils";
import { GitCompare, Sparkles, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [leftJson, setLeftJson] = useState("");
  const [rightJson, setRightJson] = useState("");
  const [diffs, setDiffs] = useState<DiffNode[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const handleCompare = () => {
    setIsComparing(true);

    const leftValidation = validateJSON(leftJson);
    const rightValidation = validateJSON(rightJson);

    if (!leftValidation.isValid) {
      toast({
        title: "Invalid JSON",
        description: `Original JSON: ${leftValidation.error}`,
        variant: "destructive",
      });
      setIsComparing(false);
      return;
    }

    if (!rightValidation.isValid) {
      toast({
        title: "Invalid JSON",
        description: `Modified JSON: ${rightValidation.error}`,
        variant: "destructive",
      });
      setIsComparing(false);
      return;
    }

    try {
      const result = compareJSON(leftValidation.parsed, rightValidation.parsed);
      setDiffs(result);
      toast({
        title: "Comparison Complete",
        description: "JSON objects compared successfully",
      });
    } catch (error) {
      toast({
        title: "Comparison Failed",
        description: "An error occurred during comparison",
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
  };

  const handleLoadSample = () => {
    const sample = getSampleJSON();
    setLeftJson(sample.left);
    setRightJson(sample.right);
    toast({
      title: "Sample Loaded",
      description: "Sample JSON data loaded for comparison",
    });
  };

  const handleFormat = (side: "left" | "right") => {
    const jsonString = side === "left" ? leftJson : rightJson;
    const validation = validateJSON(jsonString);

    if (validation.isValid && validation.parsed) {
      const formatted = formatJSON(validation.parsed);
      if (side === "left") {
        setLeftJson(formatted);
      } else {
        setRightJson(formatted);
      }
      toast({
        title: "Formatted",
        description: "JSON has been formatted",
      });
    } else {
      toast({
        title: "Format Failed",
        description: "Cannot format invalid JSON",
        variant: "destructive",
      });
    }
  };

  const handleExportDiff = () => {
    if (diffs.length === 0) {
      toast({
        title: "No Diff to Export",
        description: "Please compare JSON objects first",
        variant: "destructive",
      });
      return;
    }

    const diffReport = JSON.stringify(diffs, null, 2);
    const blob = new Blob([diffReport], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "json-diff-report.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Diff report downloaded successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                <GitCompare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">JSON Semantic Diff</h1>
                <p className="text-sm text-muted-foreground">
                  Compare JSON objects semantically with multi-level nesting
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Load Sample
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <InlineDiffEditor
              value={leftJson}
              onChange={setLeftJson}
              label="Original JSON"
              placeholder='{"key": "value"}'
              diffs={diffs}
              isReference={true}
            />
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleFormat("left")}
                disabled={!leftJson}
                className="w-full"
              >
                Format JSON
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <InlineDiffEditor
              value={rightJson}
              onChange={setRightJson}
              label="Modified JSON"
              placeholder='{"key": "new value"}'
              diffs={diffs}
              isReference={false}
            />
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleFormat("right")}
                disabled={!rightJson}
                className="w-full"
              >
                Format JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            onClick={handleCompare}
            disabled={!leftJson || !rightJson || isComparing}
            size="lg"
            className="gap-2 px-8"
          >
            <GitCompare className="h-5 w-5" />
            {isComparing ? "Comparing..." : "Compare JSON"}
          </Button>
          
          {diffs.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportDiff}
              size="lg"
              className="gap-2"
            >
              <Download className="h-5 w-5" />
              Export Diff
            </Button>
          )}
        </div>

        {/* Diff Results */}
        {diffs.length > 0 && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Comparison Results
              </h2>
              <p className="text-sm text-muted-foreground">
                Semantic differences between the two JSON objects
              </p>
            </div>
            <DiffViewer diffs={diffs} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 bg-card/30">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Built with React, TypeScript, and Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
