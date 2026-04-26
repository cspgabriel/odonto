"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadLandingAsset } from "@/lib/actions/landing-settings-actions";
import { toast } from "sonner";
import Image from "next/image";

export interface ImageUploadFieldProps {
  label?: string;
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  assetType?: string;
  recommendedSize?: string;
  maxSizeMB?: number;
  className?: string;
  imageClassName?: string;
}

export function ImageUploadField({
  label,
  currentImageUrl,
  onImageUploaded,
  assetType = "general",
  recommendedSize,
  maxSizeMB = 5,
  className,
  imageClassName = "h-40",
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image must be under ${maxSizeMB}MB`);
      return;
    }

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file); // key should be "file" based on server capability
    formData.append("type", assetType);

    // In a real app, you'd upload here. modifying for mock/demo if needed
    // adapting to existing function signature if imported
    try {
        const result = await uploadLandingAsset(formData);
        
        if (result.success) {
        setPreviewUrl(result.url);
        onImageUploaded(result.url);
        toast.success("Image uploaded successfully");
        } else {
        setPreviewUrl(currentImageUrl || null);
        toast.error(result.error);
        }
    } catch (err) {
        toast.error("Upload failed");
        setPreviewUrl(currentImageUrl || null);
    } finally {
        setUploading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        {label ? <Label>{label}</Label> : <span />}
        {recommendedSize && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {recommendedSize}
            </span>
        )}
      </div>

      {previewUrl ? (
        <div className="relative group">
          <div className={`relative w-full ${imageClassName} rounded-lg border overflow-hidden bg-muted/50`}>
            <Image
              src={previewUrl}
              alt={label || "Uploaded image"}
              fill
              className="object-contain p-2"
              unoptimized
            />
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
             <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={triggerUpload}
                disabled={uploading}
                className="h-8"
              >
                Change
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
                className="h-8"
              >
                Remove
              </Button>
          </div>
        </div>
      ) : (
        <div 
            onClick={triggerUpload}
            className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors ${imageClassName}`}
        >
          <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground/70 text-center px-2">
            Click to upload
            <br />
            <span className="text-[10px]">Max {maxSizeMB}MB</span>
          </p>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id={`upload-${assetType}`}
      />
      
      {uploading && (
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Uploading...
          </div>
      )}
    </div>
  );
}
