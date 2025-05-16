
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export interface ToneStyle {
  id: string;
  name: string;
  description: string;
}

const defaultStyles: ToneStyle[] = [
  {
    id: "my-voice",
    name: "Use my tone of voice",
    description: "Generate tweets that sound like they're written by you, matching your natural style and voice."
  },
  {
    id: "shaan-puri",
    name: "Shaan Puri (My First Million)",
    description: "Clear, concise, and value-packed tweets with a focus on actionable business insights."
  },
  {
    id: "greg-isenberg",
    name: "Greg Isenberg",
    description: "Community-focused tweets with memorable hooks and an emphasis on design thinking."
  },
  {
    id: "naval",
    name: "Naval Ravikant",
    description: "Philosophical, timeless wisdom focused on wealth creation, happiness, and mental models."
  },
  {
    id: "levels",
    name: "Levels",
    description: "Data-driven, health-optimized tweets that combine science with practical advice."
  }
];

interface StyleSelectorProps {
  selectedStyle: string;
  onChange: (styleId: string) => void;
  customStyles?: ToneStyle[];
}

export function StyleSelector({ 
  selectedStyle = "my-voice", 
  onChange,
  customStyles = []
}: StyleSelectorProps) {
  const allStyles = [...defaultStyles, ...customStyles];
  
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Select Tweet Style</h3>
        <p className="text-sm text-muted-foreground">Choose how you want your tweets to sound</p>
      </div>
      
      <RadioGroup 
        value={selectedStyle} 
        onValueChange={onChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {allStyles.map((style) => (
          <div key={style.id} className="flex items-start space-x-2">
            <RadioGroupItem value={style.id} id={style.id} className="mt-1" />
            <Label 
              htmlFor={style.id} 
              className="flex flex-col cursor-pointer flex-1"
            >
              <span className="font-medium">{style.name}</span>
              <span className="text-muted-foreground text-sm">{style.description}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
