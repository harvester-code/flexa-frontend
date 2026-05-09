import { type ReactNode, type ElementType } from "react";
import { CardHeader, CardTitle } from "@/components/ui/Card";

interface SimulationCardHeaderProps {
  icon: ElementType;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  iconSize?: "sm" | "md";
}

export default function SimulationCardHeader({
  icon: Icon,
  title,
  description,
  actions,
  iconSize = "md",
}: SimulationCardHeaderProps) {
  const iconClass = iconSize === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className={`${iconClass} text-primary`} />
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-default-900">{title}</div>
          {description && (
            <p className="text-sm font-normal text-default-500">{description}</p>
          )}
        </div>
        {actions}
      </CardTitle>
    </CardHeader>
  );
}
