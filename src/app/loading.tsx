import Image from 'next/image'

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 overflow-hidden">
            <div className="relative w-40 h-40 flex items-center justify-center animate-pulse">
                <Image
                    src="/ab.svg"
                    alt="Avalansa Logo"
                    width={120}
                    height={120}
                    priority
                    className="dark:hidden"
                />
                <Image
                    src="/aw.svg"
                    alt="Avalansa Logo"
                    width={120}
                    height={120}
                    priority
                    className="hidden dark:block"
                />
            </div>
            <div className="mt-8 h-1 w-24 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-progress duration-1000 origin-left" />
            </div>
        </div>
    );
}
