import * as React from "react";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BackgroundJobTrackerProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: string[];
  currentStepIndex: number;
  status?: "idle" | "running" | "success" | "error";
  errorStepIndex?: number;
}

export function BackgroundJobTracker({
  steps,
  currentStepIndex,
  status = "idle",
  errorStepIndex,
  className,
  ...props
}: BackgroundJobTrackerProps) {
  return (
    <div className={cn("flex flex-col space-y-4", className)} {...props}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex || status === "success";
        const isActive = index === currentStepIndex && status === "running";
        const isPending = index > currentStepIndex || (index === currentStepIndex && status === "idle");
        const isError = status === "error" && (errorStepIndex === index || (errorStepIndex === undefined && isActive));

        return (
          <div key={index} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : isError ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : isActive ? (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div
              className={cn(
                "text-sm font-medium",
                isCompleted && "text-foreground",
                isActive && "text-foreground animate-pulse",
                isPending && "text-muted-foreground",
                isError && "text-red-500"
              )}
            >
              {step}
            </div>
          </div>
        );
      })}
    </div>
  );
}
