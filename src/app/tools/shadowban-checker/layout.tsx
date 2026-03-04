import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'X Shadowban Checker — Avalansa',
  description:
    'Check if your X (Twitter) account has been shadowbanned. Free, no login required. Tests Search Suggestion Ban, Search Ban, Ghost Ban, and Reply Deboosting.',
  openGraph: {
    title: 'X Shadowban Checker — Avalansa',
    description:
      'Free tool to detect if your X account is shadowbanned across 4 different restriction types.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
