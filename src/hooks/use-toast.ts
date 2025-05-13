
// Import from sonner.tsx instead of toast.tsx
import { useToast as useShadcnToast } from "@/components/ui/toaster";
import { toast as sonnerToast } from "@/components/ui/sonner";

export const useToast = useShadcnToast;
export const toast = sonnerToast;
