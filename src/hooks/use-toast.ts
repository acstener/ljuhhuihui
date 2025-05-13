
// Re-export from shadcn-ui
import { useToast as useShadcnToast, toast as shadowToast } from "@/components/ui/toast";

export const useToast = useShadcnToast;
export const toast = shadowToast;
