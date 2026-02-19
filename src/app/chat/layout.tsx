import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat — Avalansa',
  description: 'Real-time chat with the Avalansa community.',
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
