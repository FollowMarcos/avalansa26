import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Image Safety Analyzer — Avalansa',
    description:
        'Classify images for NSFW content directly in your browser using AI. No uploads, no servers — fully private and client-side.',
    openGraph: {
        title: 'Image Safety Analyzer — Avalansa',
        description:
            'Free, private, browser-based image safety classification powered by TensorFlow.js and nsfwjs.',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
