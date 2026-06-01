"use client";

import React, { useCallback, useEffect, useState } from "react";
import { BookOpen, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/hooks/useToast";
import {
  listFacilityPresets,
  createFacilityPreset,
  updateFacilityPreset,
  deleteFacilityPreset,
} from "@/services/facilityPresetService";
import { FacilityPreset } from "@/types/facilityPresetTypes";
import { ProcessStep } from "@/types/simulationTypes";

interface FacilityPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProcessFlow: ProcessStep[];
  /** Flight date of the current scenario (YYYY-MM-DD). Stored as reference_date when saving a preset. */
  referenceDate: string | null;
  /** Current schedule interval (minutes). Stored with the preset so the grid unit is restored on load. */
  scheduleIntervalMinutes: number | null;
  onLoadPreset: (processFlow: ProcessStep[], referenceDate: string | null, scheduleIntervalMinutes: number | null) => void;
}

type ModalView = "list" | "save";
type SaveMode = "new" | "overwrite";

export default function FacilityPresetModal({
  isOpen,
  onClose,
  currentProcessFlow,
  referenceDate,
  scheduleIntervalMinutes,
  onLoadPreset,
}: FacilityPresetModalProps) {
  const { toast } = useToast();
  const [view, setView] = useState<ModalView>("list");
  const [presets, setPresets] = useState<FacilityPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Save form
  const [saveMode, setSaveMode] = useState<SaveMode>("new");
  const [newPresetName, setNewPresetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Overwrite
  const [selectedOverwriteId, setSelectedOverwriteId] = useState<string | null>(null);
  const [overwritingPreset, setOverwritingPreset] = useState<FacilityPreset | null>(null);

  // Rename
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete confirm
  const [deletingPreset, setDeletingPreset] = useState<FacilityPreset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load confirm
  const [loadingPreset, setLoadingPreset] = useState<FacilityPreset | null>(null);

  const fetchPresets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listFacilityPresets();
      setPresets(res.data.presets);
    } catch {
      toast({ title: "Error", description: "Failed to load presets", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      setView("list");
      setNewPresetName("");
      setSaveMode("new");
      setSelectedOverwriteId(null);
      setEditingPresetId(null);
      fetchPresets();
    }
  }, [isOpen, fetchPresets]);

  const handleSaveNew = async () => {
    if (!newPresetName.trim()) return;
    setIsSaving(true);
    try {
      const res = await createFacilityPreset({
        name: newPresetName.trim(),
        process_flow: currentProcessFlow as unknown as Record<string, unknown>[],
        reference_date: referenceDate,
        schedule_interval_minutes: scheduleIntervalMinutes,
      });
      setPresets((prev) => [res.data, ...prev]);
      toast({ title: "Preset saved", description: `"${res.data.name}" has been saved.` });
      setNewPresetName("");
      setView("list");
    } catch {
      toast({ title: "Error", description: "Failed to save preset", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverwritePreset = async () => {
    if (!selectedOverwriteId) return;
    const target = presets.find((p) => p.preset_id === selectedOverwriteId);
    if (!target) return;
    setOverwritingPreset(target);
  };

  const handleConfirmOverwrite = async () => {
    if (!overwritingPreset) return;
    setIsSaving(true);
    try {
      await updateFacilityPreset(overwritingPreset.preset_id, {
        process_flow: currentProcessFlow as unknown as Record<string, unknown>[],
        reference_date: referenceDate,
        schedule_interval_minutes: scheduleIntervalMinutes,
      });
      setPresets((prev) =>
        prev.map((p) =>
          p.preset_id === overwritingPreset.preset_id
            ? { ...p, process_flow: currentProcessFlow as unknown as Record<string, unknown>[], reference_date: referenceDate }
            : p
        )
      );
      toast({ title: "Preset updated", description: `"${overwritingPreset.name}" has been overwritten.` });
      setOverwritingPreset(null);
      setSelectedOverwriteId(null);
      setView("list");
    } catch {
      toast({ title: "Error", description: "Failed to overwrite preset", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartRename = (preset: FacilityPreset) => {
    setEditingPresetId(preset.preset_id);
    setEditingName(preset.name);
  };

  const handleRename = async (preset: FacilityPreset) => {
    if (!editingName.trim() || editingName.trim() === preset.name) {
      setEditingPresetId(null);
      return;
    }
    setIsRenaming(true);
    try {
      await updateFacilityPreset(preset.preset_id, { name: editingName.trim() });
      setPresets((prev) =>
        prev.map((p) =>
          p.preset_id === preset.preset_id ? { ...p, name: editingName.trim() } : p
        )
      );
      toast({ title: "Preset renamed", description: `Renamed to "${editingName.trim()}"` });
      setEditingPresetId(null);
    } catch {
      toast({ title: "Error", description: "Failed to rename preset", variant: "destructive" });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeletePreset = async () => {
    if (!deletingPreset) return;
    setIsDeleting(true);
    try {
      await deleteFacilityPreset(deletingPreset.preset_id);
      setPresets((prev) => prev.filter((p) => p.preset_id !== deletingPreset.preset_id));
      toast({ title: "Preset deleted", description: `"${deletingPreset.name}" has been deleted.` });
      setDeletingPreset(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete preset", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLoadPreset = (preset: FacilityPreset) => {
    onLoadPreset(preset.process_flow as unknown as ProcessStep[], preset.reference_date, preset.schedule_interval_minutes);
    toast({ title: "Preset loaded", description: `"${preset.name}" applied to current scenario.` });
    setLoadingPreset(null);
    onClose();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Facility Presets
            </DialogTitle>
          </DialogHeader>

          {view === "list" && (
            <div className="flex flex-col flex-1 overflow-hidden gap-4">
              {/* Save current as preset */}
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5"
                onClick={() => {
                  setNewPresetName("");
                  setView("save");
                }}
              >
                <Plus className="h-4 w-4" />
                Save current facilities as preset
              </Button>

              {/* Preset list */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size={24} />
                </div>
              ) : presets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                  <BookOpen className="h-8 w-8 opacity-40" />
                  <p className="text-sm">No presets saved yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
                  {presets.map((preset) => (
                    <div
                      key={preset.preset_id}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 bg-white hover:border-primary/30 transition-colors"
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        {editingPresetId === preset.preset_id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(preset);
                              if (e.key === "Escape") setEditingPresetId(null);
                            }}
                            className="h-7 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {preset.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 mt-0.5">
                          {formatDate(preset.updated_at)} · {preset.process_flow.length} process{preset.process_flow.length !== 1 ? "es" : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {editingPresetId === preset.preset_id ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleRename(preset)}
                              disabled={isRenaming}
                            >
                              {isRenaming ? <Spinner size={12} /> : <Save className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditingPresetId(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-primary border-primary/30 hover:bg-primary/5"
                              onClick={() => setLoadingPreset(preset)}
                            >
                              Load
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => handleStartRename(preset)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                              onClick={() => setDeletingPreset(preset)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "save" && (
            <div className="flex flex-col gap-4">
              {/* Mode tabs */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    saveMode === "new"
                      ? "bg-primary text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setSaveMode("new")}
                >
                  Create new
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    saveMode === "overwrite"
                      ? "bg-primary text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => { setSaveMode("overwrite"); setSelectedOverwriteId(null); }}
                  disabled={presets.length === 0}
                >
                  Overwrite existing
                </button>
              </div>

              {/* New preset */}
              {saveMode === "new" && (
                <>
                  <p className="text-sm text-gray-600">
                    Save the current facility configuration ({currentProcessFlow.length} process{currentProcessFlow.length !== 1 ? "es" : ""}) as a new preset.
                  </p>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Preset name</label>
                    <Input
                      placeholder="e.g. ICN T2 Standard"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveNew()}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setView("list")}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveNew}
                      disabled={!newPresetName.trim() || isSaving}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      {isSaving ? <Spinner size={14} /> : <Save className="h-4 w-4 mr-1" />}
                      Save
                    </Button>
                  </div>
                </>
              )}

              {/* Overwrite existing */}
              {saveMode === "overwrite" && (
                <>
                  <p className="text-sm text-gray-600">
                    Select a preset to overwrite. Its name will be kept — only the facility configuration will be replaced.
                  </p>
                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                    {presets.map((preset) => (
                      <button
                        key={preset.preset_id}
                        onClick={() => setSelectedOverwriteId(preset.preset_id)}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                          selectedOverwriteId === preset.preset_id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 bg-white hover:border-primary/30"
                        }`}
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 truncate">{preset.name}</span>
                          <span className="text-xs text-gray-400 mt-0.5">
                            {formatDate(preset.updated_at)} · {preset.process_flow.length} process{preset.process_flow.length !== 1 ? "es" : ""}
                          </span>
                        </div>
                        {selectedOverwriteId === preset.preset_id && (
                          <div className="h-4 w-4 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setView("list")}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleOverwritePreset}
                      disabled={!selectedOverwriteId || isSaving}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      {isSaving ? <Spinner size={14} /> : <Save className="h-4 w-4 mr-1" />}
                      Overwrite
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Load confirmation dialog */}
      <AlertDialog
        open={!!loadingPreset}
        onOpenChange={(open) => !open && setLoadingPreset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Loading &quot;{loadingPreset?.name}&quot; will replace the current facility configuration. This action can be undone by loading another preset or editing manually.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => loadingPreset && handleLoadPreset(loadingPreset)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Load Preset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Overwrite confirmation dialog */}
      <AlertDialog
        open={!!overwritingPreset}
        onOpenChange={(open) => !open && setOverwritingPreset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              The facility configuration of &quot;{overwritingPreset?.name}&quot; will be replaced with the current one. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOverwrite}
              disabled={isSaving}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {isSaving ? <Spinner size={14} /> : "Overwrite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deletingPreset}
        onOpenChange={(open) => !open && setDeletingPreset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deletingPreset?.name}&quot; will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePreset}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? <Spinner size={14} /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
