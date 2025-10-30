import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, FileJson } from "lucide-react";
import { validateJSON } from "@/lib/jsonUtils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface JsonInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

export const JsonInput = ({
  value,
  onChange,
  label,
  placeholder = "Paste your JSON here...",
}: JsonInputProps) => {
  const { toast } = useToast();
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
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
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-full min-h-[400px] font-mono text-sm resize-none transition-colors",
            !isValid && value && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {!isValid && errorMessage && (
          <div className="absolute bottom-2 left-2 right-2 bg-destructive/10 border border-destructive/20 rounded-md p-2">
            <p className="text-xs text-destructive font-medium">
              Invalid JSON: {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
