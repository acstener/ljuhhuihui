
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MainNavProps {
  items?: NavItem[];
  className?: string;
}

export function MainNav({ items, className }: MainNavProps) {
  return (
    <nav className={cn("flex gap-2", className)}>
      {items?.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent"
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
