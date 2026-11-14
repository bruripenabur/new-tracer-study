import { Check } from 'lucide-react';

export interface StepDefinition {
  id: number;
  title: string;
  subtitle: string;
}

interface StepperProps {
  steps: StepDefinition[];
  currentStepId: number;
  completedStepIds: number[];
  onStepClick?: (stepId: number) => void;
}

export function Stepper({
  steps,
  currentStepId,
  completedStepIds,
  onStepClick,
}: StepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <nav aria-label="Progres pengisian borang" className="w-full">
      {/* Mobile Compact Stepper */}
      <div className="md:hidden space-y-2.5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <span>
            Langkah{' '}
            <strong className="text-[#0A2342] tabular-nums">
              {currentIndex + 1}
            </strong>{' '}
            dari <span className="tabular-nums">{steps.length}</span>
          </span>
          <span className="font-semibold text-[#0A2342]">
            {steps[currentIndex]?.title}
          </span>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((step, idx) => {
            const isCurrent = step.id === currentStepId;
            const isPast = idx < currentIndex || completedStepIds.includes(step.id);
            return (
              <button
                key={step.id}
                type="button"
                disabled={!isPast && !isCurrent}
                onClick={() => isPast && onStepClick?.(step.id)}
                className={`h-2 rounded-sm transition-colors ${
                  isCurrent
                    ? 'bg-[#D4AF37]'
                    : isPast
                    ? 'bg-[#0A2342]'
                    : 'bg-slate-200'
                }`}
                aria-label={`Langkah ${idx + 1}: ${step.title}`}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop 5-Step Indicator */}
      <ol className="hidden md:grid gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, idx) => {
          const isCurrent = step.id === currentStepId;
          const isCompleted = completedStepIds.includes(step.id) && !isCurrent;
          const canClick = isCompleted || idx < currentIndex;

          return (
            <li key={step.id} className="min-w-0">
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepClick?.(step.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isCurrent
                    ? 'bg-[#0A2342] border-[#0A2342] text-white shadow-md'
                    : isCompleted
                    ? 'bg-white border-emerald-300 text-slate-800 hover:border-[#0A2342]/40 cursor-pointer'
                    : 'bg-slate-50/80 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${
                    isCurrent
                      ? 'bg-[#D4AF37] text-[#0A2342]'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${
                      isCurrent
                        ? 'text-white'
                        : isCompleted
                        ? 'text-slate-900'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isCurrent ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {step.subtitle}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
