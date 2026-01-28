'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { bioSchema, type BioFormData } from '@/lib/validations/onboarding';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface BioFormProps {
  initialBio: string;
}

export function BioForm({ initialBio }: BioFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BioFormData>({
    resolver: zodResolver(bioSchema),
    defaultValues: {
      bio: initialBio,
    },
    mode: 'onChange',
  });

  const bioValue = form.watch('bio') ?? '';
  const charCount = bioValue.length;

  async function onSubmit(data: BioFormData) {
    startTransition(async () => {
      const result = await updateProfile({ bio: data.bio || null });

      if (result) {
        router.push('/onboarding/interests');
      } else {
        form.setError('bio', {
          type: 'manual',
          message: 'Failed to save bio. Please try again.',
        });
      }
    });
  }

  function handleSkip() {
    router.push('/onboarding/interests');
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
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a bit about yourself..."
                    className="resize-none h-24"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormDescription className="flex justify-between" aria-live="polite">
                  <span>Optional, but recommended</span>
                  <span className={charCount > 200 ? 'text-destructive' : ''}>
                    {charCount}/200
                  </span>
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
              aria-label={isPending ? 'Saving bio...' : 'Continue'}
            >
              {isPending ? (
                <span role="status" className="flex items-center gap-2">
                  Saving...
                </span>
              ) : 'Continue'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
