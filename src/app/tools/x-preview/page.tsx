"use client";

import * as React from "react";
import { motion } from "motion/react";
import { XPreviewProvider, useXPreview } from "@/components/x-preview/x-preview-context";
import { PostComposer } from "@/components/x-preview/post-composer";
import { PreviewFrame } from "@/components/x-preview/preview-frame";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function ModeToggle() {
  const { previewMode, setPreviewMode } = useXPreview();

  return (
    <Tabs
      value={previewMode}
      onValueChange={(value) => setPreviewMode(value as "timeline" | "expanded")}
    >
      <TabsList className="grid grid-cols-2 w-[240px]">
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="expanded">Expanded</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function XPreviewContent() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" aria-label="Go back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">X Post Preview</h1>
              <p className="text-sm text-muted-foreground">
                Preview your posts before publishing
              </p>
            </div>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ willChange: "opacity, transform" }}
            {...(typeof window !== "undefined" &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches && {
                initial: { opacity: 1, y: 0 },
                animate: { opacity: 1, y: 0 },
              })}
          >
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-medium">Compose</h2>
              </div>
              <PostComposer />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:sticky lg:top-24 lg:self-start"
            style={{ willChange: "opacity, transform" }}
            {...(typeof window !== "undefined" &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches && {
                initial: { opacity: 1, y: 0 },
                animate: { opacity: 1, y: 0 },
              })}
          >
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-medium">Preview</h2>
              </div>
              <div className="p-6">
                <PreviewFrame />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function XPreviewPage() {
  return (
    <XPreviewProvider>
      <XPreviewContent />
    </XPreviewProvider>
  );
}
