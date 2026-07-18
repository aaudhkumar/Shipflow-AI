import { Badge } from "@/components/ui/badge";

export function FeatureStatusBadge({ status, hasIssue }: { status: string; hasIssue?: boolean }) {
  let colorClass = "bg-muted text-muted-foreground border-border";
  const label = status.replace(/_/g, " ");

  switch (status) {
    case "SUBMITTED":
      colorClass = "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20 hover:bg-blue-500/20";
      break;
    case "CLARIFYING":
    case "CLARIFIED":
      colorClass = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20";
      break;
    case "PRD_GENERATED":
    case "EXECUTION_PLAN_GENERATED":
    case "TASKS_GENERATED":
      colorClass = "bg-purple-500/10 text-purple-600 dark:text-purple-500 border-purple-500/20 hover:bg-purple-500/20";
      break;
    case "PLAN_APPROVED":
    case "IN_DEVELOPMENT":
      colorClass = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20";
      break;
    case "IN_REVIEW":
    case "AWAITING_HUMAN_APPROVAL":
      colorClass = "bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/20 hover:bg-orange-500/20";
      break;
    case "FIX_NEEDED":
    case "REJECTED":
      colorClass = "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20 hover:bg-red-500/20";
      break;
    case "SHIPPED":
      colorClass = "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20 hover:bg-green-500/20";
      break;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`${colorClass} font-medium tracking-tight whitespace-nowrap`}>
        {label}
      </Badge>
      {hasIssue && (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20 font-medium tracking-tight whitespace-nowrap">
          ISSUE
        </Badge>
      )}
    </div>
  );
}
