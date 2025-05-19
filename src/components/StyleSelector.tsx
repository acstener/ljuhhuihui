
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export interface ToneStyle {
  id: string;
  name: string;
  description: string;
}

const defaultStyle: ToneStyle = {
  id: "my-voice",
  name: "Your Authentic Voice",
  description: "Generate content that sounds exactly like you - raw, unfiltered, and authentic to your natural speaking style."
};

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
  // We're enforcing only one style option now
  const allStyles = [defaultStyle, ...customStyles];
  
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Content Style</h3>
        <p className="text-sm text-muted-foreground">Your content will be generated in your authentic voice</p>
      </div>
      
      <RadioGroup 
        value={selectedStyle} 
        onValueChange={onChange}
        className="grid grid-cols-1 gap-4"
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
