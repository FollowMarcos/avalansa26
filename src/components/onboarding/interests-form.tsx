'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import {
  interestsSchema,
  type InterestsFormData,
} from '@/lib/validations/onboarding';
import { updateProfile } from '@/utils/supabase/profiles.client';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface InterestsFormProps {
  initialInterests: string[];
}

export function InterestsForm({ initialInterests }: InterestsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState('');

  const form = useForm<InterestsFormData>({
    resolver: zodResolver(interestsSchema),
    defaultValues: {
      interests: initialInterests,
    },
  });

  const interests = form.watch('interests');

  function addInterest() {
    const trimmed = inputValue.trim();
    if (trimmed && interests.length < 10 && !interests.includes(trimmed)) {
      form.setValue('interests', [...interests, trimmed]);
      setInputValue('');
    }
  }

  function removeInterest(index: number) {
    form.setValue(
      'interests',
      interests.filter((_, i) => i !== index)
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  }

  async function onSubmit(data: InterestsFormData) {
    startTransition(async () => {
      const result = await updateProfile({
        interests: data.interests,
        onboarding_completed: true,
      });

      if (result) {
        router.push('/onboarding/complete');
      } else {
        form.setError('interests', {
          type: 'manual',
          message: 'Failed to save interests. Please try again.',
        });
      }
    });
  }

  function handleSkip() {
    startTransition(async () => {
      const result = await updateProfile({
        interests: [],
        onboarding_completed: true,
      });

      if (result) {
        router.push('/onboarding/complete');
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="interests"
            render={() => (
              <FormItem>
                <FormLabel>Interests</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type an interest and press Enter"
                        disabled={interests.length >= 10}
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addInterest}
                        disabled={!inputValue.trim() || interests.length >= 10}
                      >
                        Add
                      </Button>
                    </div>
                    <ul className="flex flex-wrap gap-2 min-h-[2.5rem]" aria-label="Selected interests">
                      <AnimatePresence>
                        {interests.map((interest, index) => (
                          <motion.li
                            key={interest}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                          >
                            <span>{interest}</span>
                            <button
                              type="button"
                              onClick={() => removeInterest(index)}
                              className="hover:text-destructive transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-full p-1.5 -mr-1"
                              aria-label={`Remove ${interest}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>
                </FormControl>
                <FormDescription aria-live="polite">
                  Add up to 10 interests ({10 - interests.length} remaining)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
              disabled={isPending}
            >
              Skip
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending}
              aria-label={isPending ? 'Finalizing your profile...' : 'Complete Setup'}
            >
              {isPending ? (
                <span role="status" className="flex items-center gap-2">
                  Finishing...
                </span>
              ) : 'Complete Setup'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
