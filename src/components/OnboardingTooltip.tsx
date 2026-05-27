import { useState, useEffect, ReactNode } from 'react';

interface OnboardingTooltipProps {
  /** Unique key for this tooltip (stored in localStorage) */
  tooltipKey: string;
  /** The tooltip content */
  children: ReactNode;
  /** The element this tooltip wraps */
  renderTrigger: (show: boolean) => ReactNode;
  /** Position of tooltip relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function OnboardingTooltip({
  tooltipKey,
  children,
  renderTrigger,
  position = 'bottom',
}: OnboardingTooltipProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`onboarding_${tooltipKey}`);
    if (!dismissed) {
      // Show after a short delay so the UI is rendered
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, [tooltipKey]);

  const dismiss = () => {
    localStorage.setItem(`onboarding_${tooltipKey}`, 'dismissed');
    setShow(false);
  };

  const positionClasses: Record<string, string> = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-primary',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-primary',
  };

  return (
    <div className="relative inline-flex">
      {renderTrigger(show)}
      {show && (
        <div className={`absolute z-40 ${positionClasses[position]}`}>
          <div className="relative rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground shadow-lg max-w-64">
            <div className={`absolute ${arrowClasses[position]}`} />
            <div className="flex items-start gap-2">
              <div className="flex-1">{children}</div>
              <button
                onClick={dismiss}
                className="shrink-0 rounded-full p-0.5 hover:bg-primary-foreground/20"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
