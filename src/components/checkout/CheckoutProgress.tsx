import { Check, MoreHorizontal } from "lucide-react";

export type StepStatus = "complete" | "current" | "upcoming";

export interface CheckoutStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface CheckoutProgressProps {
  steps: CheckoutStep[];
}

export const CheckoutProgress = ({ steps }: CheckoutProgressProps) => (
  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const statusClasses =
          step.status === "complete"
            ? "border-emerald-500 bg-emerald-500 text-white"
            : step.status === "current"
            ? "border-emerald-500 bg-white text-emerald-600"
            : "border-muted-foreground/30 bg-muted text-muted-foreground";
        const labelClasses =
          step.status === "complete"
            ? "text-foreground"
            : step.status === "current"
            ? "text-emerald-600"
            : "text-muted-foreground";
        const icon =
          step.status === "complete" ? (
            <Check className="h-4 w-4" />
          ) : step.status === "current" ? (
            <span className="text-sm font-semibold">{index + 1}</span>
          ) : (
            <MoreHorizontal className="h-5 w-5" />
          );
        const connectorClass =
          step.status === "complete"
            ? "bg-emerald-500"
            : step.status === "current"
            ? "bg-emerald-200"
            : "bg-muted-foreground/20";

        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center text-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${statusClasses}`}>
                {icon}
              </div>
              <span className={`mt-2 text-sm font-semibold ${labelClasses}`}>{step.label}</span>
            </div>
            {!isLast && <div className={`mx-3 hidden h-0.5 flex-1 rounded sm:block ${connectorClass}`} />}
          </div>
        );
      })}
    </div>
  </div>
);

export default CheckoutProgress;
