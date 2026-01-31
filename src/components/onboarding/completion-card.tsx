'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CompletionCardProps {
  name: string | null;
  username: string | null;
}

export function CompletionCard({ name, username }: CompletionCardProps) {
  const router = useRouter();

  // Auto-redirect after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="text-center">
        <CardHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto"
          >
            <CheckCircle className="h-16 w-16 text-green-500" aria-hidden="true" />
          </motion.div>
          <CardTitle className="text-2xl">
            Welcome, {name || username}!
          </CardTitle>
          <CardDescription>Your profile is all set up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground" role="status">Redirecting you to the app...</p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/')}
              className="text-sm font-medium underline underline-offset-4 hover:text-primary transition-colors"
            >
              Continue now
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
