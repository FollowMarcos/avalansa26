"use client";

import * as React from "react";
import { useXPreview } from "./x-preview-context";
import { ImageGrid } from "./image-grid";

function TimelineView() {
  const { post } = useXPreview();
  const { images } = post;

  return (
    <div className="p-4 border-b border-[#2f3336] hover:bg-[#080808] transition-colors">
      {images.length > 0 && (
        <div className="mt-3">
          <ImageGrid images={images} variant="timeline" />
        </div>
      )}
    </div>
  );
}

function ExpandedView() {
  const { post } = useXPreview();
  const { images } = post;

  return (
    <div className="flex flex-col">
      {/* Top nav area for expanded view */}
      <div className="flex items-center gap-8 p-4 border-b border-[#2f3336]">
        <button className="text-[#e7e9ea] hover:bg-[#eff3f41a] p-2 rounded-full transition-colors" aria-label="Back">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
            <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-[#e7e9ea]">Post</h2>
      </div>

      <div className="p-4">
        {/* Images - stacked vertically in expanded view */}
        {images.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="rounded-2xl overflow-hidden border border-[#2f3336]"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-auto block"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PreviewFrame() {
  const { previewMode } = useXPreview();

  return (
    <div className="bg-black rounded-2xl overflow-hidden border border-[#2f3336]">
      {previewMode === "timeline" ? <TimelineView /> : <ExpandedView />}
    </div>
  );
}

