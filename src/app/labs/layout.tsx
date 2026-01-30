import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Labs // Design Playground',
    description: 'Experiment with different UI styles and dock layouts for your Avalansa OS.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
