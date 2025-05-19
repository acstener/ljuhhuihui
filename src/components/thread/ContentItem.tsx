
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Trash } from "lucide-react";

export interface ContentItemProps {
  content: {
    tweet: string;
    topic?: string;
    edited?: boolean;
  };
  index: number;
  onUpdate: (index: number, newText: string) => void;
  onDelete: (index: number) => void;
  onCopy: (text: string) => void;
}

export const ContentItem = ({ 
  content, 
  index, 
  onUpdate, 
  onDelete, 
  onCopy 
}: ContentItemProps) => {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        {content.topic && (
          <Badge variant="outline" className="text-xs">
            {content.topic}
          </Badge>
        )}
        {content.edited && (
          <Badge variant="secondary" className="text-xs">
            Edited
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <Textarea 
          value={content.tweet} 
          onChange={(e) => onUpdate(index, e.target.value)}
          className="min-h-[100px]"
        />
        <div className="flex justify-between mt-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(index)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onCopy(content.tweet)}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
