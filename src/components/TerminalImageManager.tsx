"use client";

import { useEffect, useState } from "react";
import { Upload, Trash2, Image as ImageIcon, Download } from "lucide-react";
import { createClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
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

interface TerminalImageManagerProps {
  airport?: string | null;
  terminal?: string | null;
  className?: string;
}

function TerminalImageManager({ airport, terminal, className }: TerminalImageManagerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const hasIdentifiers = Boolean(airport && terminal);

  // Generate image file name with extension
  const getImageFileName = (
    airportCode: string,
    terminalCode: string,
    extension: string = "jpg"
  ) => {
    return `${airportCode}-${terminalCode}.${extension}`;
  };

  // Get file extension from filename or mime type
  const getFileExtension = (file: File): string => {
    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension) return extension;

    // Fallback to mime type
    const mimeMap: { [key: string]: string } = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };
    return mimeMap[file.type] || "jpg";
  };

  // Load image (try multiple extensions)
  const loadImage = async (airportCode: string, terminalCode: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try different extensions in order
      const extensions = ["jpg", "jpeg", "png", "svg", "webp"];

      for (const ext of extensions) {
        const fileName = getImageFileName(airportCode, terminalCode, ext);
        const { data, error: signedUrlError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(fileName, 3600);

        if (!signedUrlError && data) {
          setImageUrl(data.signedUrl);
          setIsLoading(false);
          return;
        }
      }

      setImageUrl(null);
    } catch (err) {
      console.error("Error loading image:", err);
      setError(err instanceof Error ? err.message : "Failed to load image");
      setImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload image
  const handleUpload = async (file: File) => {
    if (!airport || !terminal) return;

    setIsUploading(true);
    setError(null);

    try {
      const extension = getFileExtension(file);
      const fileName = getImageFileName(airport, terminal, extension);

      // Upload image (allow overwrite)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true, // Overwrite if exists
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Reload image after successful upload
      await loadImage(airport, terminal);
      toast({
        title: "Success",
        description: `Image uploaded as ${fileName}`,
      });
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete image (try all possible extensions)
  const handleDelete = async () => {
    if (!airport || !terminal) return;

    setIsLoading(true);
    setError(null);

    try {
      const extensions = ["jpg", "jpeg", "png", "svg", "webp"];
      const filesToDelete = extensions.map((ext) =>
        getImageFileName(airport, terminal, ext)
      );

      // Delete all possible variations
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete);

      if (deleteError) {
        throw deleteError;
      }

      // Fallback to default.jpg after successful deletion
      await loadImage(airport, terminal);
      toast({
        title: "Success",
        description: "Image deleted successfully!",
      });
    } catch (err) {
      console.error("Error deleting image:", err);
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsLoading(false);
    }
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Only image files are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size cannot exceed 5MB.",
        variant: "destructive",
      });
      return;
    }

    handleUpload(file);
  };

  // Download image
  const handleDownload = async () => {
    if (!airport || !terminal || !imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Get extension from blob type
      const extension = blob.type.split("/")[1] || "jpg";
      const fileName = getImageFileName(airport, terminal, extension);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: `Downloaded as ${fileName}`,
      });
    } catch (err) {
      console.error("Error downloading image:", err);
      toast({
        title: "Download Failed",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load image when codes change
  useEffect(() => {
    if (airport && terminal) {
      loadImage(airport, terminal);
    } else {
      setImageUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airport, terminal]);

  return (
    <div className={className}>
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-muted">
            {!hasIdentifiers ? (
              <div className="flex h-96 flex-col items-center justify-center gap-4">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select an airport and terminal to view the layout image.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex h-96 items-center justify-center">
                <Spinner size={32} />
              </div>
            ) : imageUrl ? (
              <div className="space-y-4 p-4">
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleDownload}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    <Download />
                    Download
                  </Button>

                  <label>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        <Upload />
                        {isUploading ? "Updating..." : "Update"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={isLoading || !imageUrl}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Terminal Image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this image? This action
                          cannot be undone. All image files for {airport}-{terminal}
                          will be removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="overflow-hidden rounded-lg bg-white">
                  <img
                    src={imageUrl}
                    alt={`${airport} ${terminal} Terminal Layout`}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-96 flex-col items-center justify-center gap-4">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No image available
                </p>

                <div className="flex gap-2">
                  <label>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        <Upload />
                        {isUploading ? "Uploading..." : "Upload"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={isLoading || !imageUrl}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Terminal Image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this image? This action
                          cannot be undone. All image files for {airport}-{terminal}
                          will be removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TerminalImageManager;
