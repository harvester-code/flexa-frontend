import { useState } from "react";
import { PassengerRuleBase } from "./types";

interface UsePassengerRuleDnDOptions<T extends PassengerRuleBase> {
  rules: T[];
  onReorder: (newRules: T[]) => void;
}

export function usePassengerRuleDnD<T extends PassengerRuleBase>({
  rules,
  onReorder,
}: UsePassengerRuleDnDOptions<T>) {
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
  const [dragOverRuleId, setDragOverRuleId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, ruleId: string) => {
    setDraggingRuleId(ruleId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ruleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, ruleId: string) => {
    e.preventDefault();
    if (draggingRuleId !== ruleId) {
      setDragOverRuleId(ruleId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverRuleId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetRuleId: string) => {
    e.preventDefault();
    if (!draggingRuleId || draggingRuleId === targetRuleId) return;

    const dragIndex = rules.findIndex((r) => r.id === draggingRuleId);
    const dropIndex = rules.findIndex((r) => r.id === targetRuleId);
    if (dragIndex === -1 || dropIndex === -1) return;

    const newRules = [...rules];
    const [dragged] = newRules.splice(dragIndex, 1);
    newRules.splice(dropIndex, 0, dragged);

    onReorder(newRules);
    setDraggingRuleId(null);
    setDragOverRuleId(null);
  };

  const handleDragEnd = () => {
    setDraggingRuleId(null);
    setDragOverRuleId(null);
  };

  const getDragProps = (ruleId: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => handleDragStart(e, ruleId),
    onDragOver: handleDragOver,
    onDragEnter: (e: React.DragEvent) => handleDragEnter(e, ruleId),
    onDragLeave: handleDragLeave,
    onDrop: (e: React.DragEvent) => handleDrop(e, ruleId),
    onDragEnd: handleDragEnd,
  });

  const getDragClassName = (ruleId: string, base: string) =>
    `${base} ${draggingRuleId === ruleId ? "scale-95 opacity-50" : ""} ${dragOverRuleId === ruleId ? "border-purple-400 bg-purple-50" : ""}`.trim();

  return { draggingRuleId, dragOverRuleId, getDragProps, getDragClassName };
}
