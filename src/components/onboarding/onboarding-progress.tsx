'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const STEPS = [
  { path: '/onboarding/username', label: 'Username', step: 1 },
  { path: '/onboarding/bio', label: 'Bio', step: 2 },
  { path: '/onboarding/interests', label: 'Interests', step: 3 },
];

export function OnboardingProgress() {
  const pathname = usePathname();
  const currentStep = STEPS.find((s) => pathname.startsWith(s.path))?.step ?? 1;

  return (
    <nav aria-label="Onboarding progress" className="flex items-center justify-center gap-2">
      {STEPS.map((step, index) => (
        <div key={step.path} className="flex items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            aria-current={currentStep === step.step ? 'step' : undefined}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              currentStep >= step.step
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <span aria-hidden="true">{step.step}</span>
            <span className="sr-only">{step.label}</span>
          </motion.div>
          {index < STEPS.length - 1 && (
            <div
              aria-hidden="true"
              className={cn(
                'w-12 h-0.5 mx-2 transition-colors',
                currentStep > step.step ? 'bg-primary' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </nav>
  );
}
