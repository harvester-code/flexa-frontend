"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/auth/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Upload, Trash2, Check, Image as ImageIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/hooks/useToast";

const BUCKET_NAME = "airport-terminal-images";

interface StorageImageItem {
  name: string;
  signedUrl: string;
}

interface AirportImageGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  airportCode: string;
  currentImageKey?: string | null;
  onSelect: (imageKey: string) => void;
}

export default function AirportImageGalleryDialog({
  open,
  onOpenChange,
  airportCode,
  currentImageKey,
  onSelect,
}: AirportImageGalleryDialogProps) {
  const [images, setImages] = useState<StorageImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    currentImageKey ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchImages = useCallback(async () => {
    if (!airportCode) return;

    setIsLoading(true);
    try {
      const { data: listData, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list("", { sortBy: { column: "created_at", order: "desc" } });

      if (listError) {
        throw listError;
      }

      const airportPrefix = `${airportCode}-`;
      const matched = (listData ?? []).filter(
        (f) =>
          f.name.startsWith(airportPrefix) &&
          !f.name.endsWith(".emptyFolderPlaceholder")
      );

      const items: StorageImageItem[] = [];
      for (const file of matched) {
        const { data } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(file.name, 3600);

        if (data?.signedUrl) {
          items.push({ name: file.name, signedUrl: data.signedUrl });
        }
      }

      setImages(items);
    } catch (err) {
      console.error("Failed to load images:", err);
      toast({
        title: "Error",
        description: "Failed to load images from storage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [airportCode, supabase, toast]);

  useEffect(() => {
    if (open) {
      setSelectedKey(currentImageKey ?? null);
      fetchImages();
    }
  }, [open, airportCode, fetchImages, currentImageKey]);

  const handleUpload = async (file: File) => {
    if (!airportCode) return;

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const timestamp = Date.now();
      const fileName = `${airportCode}-${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      toast({ title: "Uploaded", description: `${fileName} uploaded.` });
      await fetchImages();
    } catch (err) {
      console.error("Upload failed:", err);
      toast({
        title: "Upload Failed",
        description:
          err instanceof Error ? err.message : "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Only image files are allowed.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Max file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    handleUpload(file);
  };

  const handleDelete = async (imageKey: string) => {
    setDeletingKey(imageKey);
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([imageKey]);

      if (error) throw error;

      if (selectedKey === imageKey) {
        setSelectedKey(null);
      }

      toast({ title: "Deleted", description: `${imageKey} deleted.` });
      await fetchImages();
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete Failed",
        description:
          err instanceof Error ? err.message : "Failed to delete image.",
        variant: "destructive",
      });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleConfirm = () => {
    if (selectedKey) {
      onSelect(selectedKey);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Terminal Layout Images — {airportCode}
          </DialogTitle>
          <DialogDescription>
            Select an image to use as the terminal layout for this scenario, or
            upload a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {images.length} image{images.length !== 1 ? "s" : ""} found
          </p>
          <label>
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              asChild
            >
              <span>
                <Upload className="mr-1 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload New"}
              </span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner size={32} />
            </div>
          ) : images.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
              <p className="text-sm">
                No images for{" "}
                <span className="font-semibold">{airportCode}</span>. Upload one
                to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-1">
              {images.map((img) => {
                const isSelected = selectedKey === img.name;
                return (
                  <div
                    key={img.name}
                    className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary shadow-md"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setSelectedKey(img.name)}
                  >
                    <div className="relative aspect-video bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.signedUrl}
                        alt={img.name}
                        className="h-full w-full object-contain"
                      />

                      {isSelected && (
                        <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow">
                          <Check className="h-4 w-4" />
                        </div>
                      )}

                      <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => e.stopPropagation()}
                              disabled={deletingKey === img.name}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                            onClick={(e) => e.stopPropagation()}
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Image</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete{" "}
                                <span className="font-semibold">
                                  {img.name}
                                </span>
                                ? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(img.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedKey}
            onClick={handleConfirm}
          >
            <Check className="mr-1 h-4 w-4" />
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
