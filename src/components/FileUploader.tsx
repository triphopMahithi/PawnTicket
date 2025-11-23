import { useState, useCallback } from "react";
import { Upload, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export function FileUploader({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedTypes = ["image/jpeg", "image/png", "application/pdf"],
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`ไฟล์ ${file.name} ไม่ใช่ประเภทที่รองรับ (JPG, PNG, PDF)`);
      return false;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`ไฟล์ ${file.name} มีขนาดเกิน ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const validFiles: File[] = [];
      Array.from(newFiles).forEach((file) => {
        if (files.length + validFiles.length >= maxFiles) {
          toast.error(`สามารถอัพโหลดได้สูงสุด ${maxFiles} ไฟล์`);
          return;
        }
        if (validateFile(file)) {
          validFiles.push(file);
        }
      });

      if (validFiles.length > 0) {
        onFilesChange([...files, ...validFiles]);
        toast.success(`อัพโหลด ${validFiles.length} ไฟล์สำเร็จ`);
      }
    },
    [files, maxFiles, onFilesChange]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    toast.success("ลบไฟล์สำเร็จ");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        )}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-2">
          ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          รองรับ JPG, PNG, PDF (สูงสุด {maxSizeMB}MB ต่อไฟล์)
        </p>
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button type="button" variant="secondary" asChild>
            <span>เลือกไฟล์</span>
          </Button>
        </label>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group border rounded-lg overflow-hidden"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-muted">
                  <FileIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-2 bg-card">
                <p className="text-xs truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
