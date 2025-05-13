
// Re-export from shadcn-ui
import { useToast as useShadcnToast } from "@/components/ui/toaster";
import { toast as sonnerToast } from "@/components/ui/sonner";

export const useToast = useShadcnToast;
export const toast = sonnerToast;
