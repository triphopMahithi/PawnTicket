import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                  currentStep > step.number
                    ? "bg-success border-success text-success-foreground"
                    : currentStep === step.number
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-border text-muted-foreground"
                )}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step.number}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-sm font-medium",
                    currentStep >= step.number
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground hidden md:block">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-4 transition-all",
                  currentStep > step.number
                    ? "bg-success"
                    : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
