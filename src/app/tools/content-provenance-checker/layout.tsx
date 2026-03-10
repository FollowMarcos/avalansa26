import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Content Provenance Checker — Avalansa',
    description:
        'Check if images have Content Credentials (C2PA) metadata — detect AI-generated content, verify provenance, all in your browser.',
    openGraph: {
        title: 'Content Provenance Checker — Avalansa',
        description:
            'Free, private, browser-based Content Credentials (C2PA) checker. Detect AI-generated images and verify provenance without uploading.',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
