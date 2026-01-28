'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import {
  usernameSchema,
  type UsernameFormData,
} from '@/lib/validations/onboarding';
import {
  checkUsernameAvailable,
  updateProfile,
} from '@/utils/supabase/profiles.client';
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

interface UsernameFormProps {
  initialUsername: string;
}

export function UsernameForm({ initialUsername }: UsernameFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isChecking, setIsChecking] = useState(false);

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: initialUsername,
    },
    mode: 'onChange',
  });

  async function onSubmit(data: UsernameFormData) {
    setIsChecking(true);

    const isAvailable = await checkUsernameAvailable(data.username);

    if (!isAvailable) {
      form.setError('username', {
        type: 'manual',
        message: 'This username is already taken',
      });
      setIsChecking(false);
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({ username: data.username });
      setIsChecking(false);

      if (result) {
        router.push('/onboarding/bio');
      } else {
        form.setError('username', {
          type: 'manual',
          message: 'Failed to save username. Please try again.',
        });
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your_username"
                    autoComplete="off"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  3-20 characters, letters, numbers, and underscores only
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || isChecking || !form.formState.isValid}
            aria-label={isPending || isChecking ? 'Checking username availability...' : 'Continue'}
          >
            {isPending || isChecking ? (
              <span role="status" className="flex items-center gap-2">
                Checking...
              </span>
            ) : 'Continue'}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
