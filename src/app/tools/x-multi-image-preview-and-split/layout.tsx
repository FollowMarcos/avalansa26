import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'X // Multi-Image Laboratory',
    description: 'The ultimate tool for slicing and previewing multi-image posts on X (Twitter). Sliced perfectly for timeline and vertical stack views.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
