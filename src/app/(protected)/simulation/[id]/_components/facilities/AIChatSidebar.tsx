"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import AIChatPanel from "./AIChatPanel";

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  simulationId: string;
}

export default function AIChatSidebar({
  isOpen,
  onClose,
  simulationId,
}: AIChatSidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-4 right-4 bottom-4 w-[500px] bg-white rounded-lg shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-500">
              Ask questions about your simulation
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat Content */}
        <div className="h-[calc(100%-88px)]">
          <AIChatPanel simulationId={simulationId} />
        </div>
      </div>
    </>
  );
}
