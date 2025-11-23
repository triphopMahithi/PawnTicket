import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  loading?: boolean;
  colorClass?: string;
}

export function StatisticsCard({
  title,
  value,
  icon: Icon,
  trend,
  loading,
  colorClass = "text-primary",
}: StatisticsCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-3xl font-bold text-foreground">{value}</p>
          )}
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-primary/10 ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}