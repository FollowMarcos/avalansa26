import { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { ReactFlowProvider } from "@xyflow/react";
import { WorkflowCanvas } from "@/components/create-lab/WorkflowCanvas";
import { FloatingActionBar } from "@/components/create-lab/FloatingActionBar";
import { AnnotationModal } from "@/components/create-lab/AnnotationModal";
import { Header } from "@/components/create-lab/Header";
import { GlobalImageHistory } from "@/components/create-lab/GlobalImageHistory";
import { GroupsOverlay } from "@/components/create-lab/GroupsOverlay";
import "@xyflow/react/dist/style.css";

export const metadata: Metadata = {
  title: "Create Lab | Workflow Studio",
  description: "Node-based workflow system for image generation and annotation",
};

export default function CreateLabPage() {
  return (
    <PageShell showDock={true} dockPosition="left" className="p-0" noDockPadding>
      <ReactFlowProvider>
        <div className="h-screen flex flex-col bg-[#0a0a0a] relative">
          <Header />
          <div className="flex-1 relative">
            <WorkflowCanvas />
            <GroupsOverlay />
          </div>
          <FloatingActionBar />
          <AnnotationModal />
          <GlobalImageHistory />
        </div>
      </ReactFlowProvider>
    </PageShell>
  );
}
