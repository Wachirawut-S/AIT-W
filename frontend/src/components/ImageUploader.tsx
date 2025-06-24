"use client";

import { useState } from "react";
import { Button, Typography } from "@mui/material";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

interface Props {
  imagePath: string | undefined;
  onChange: (path: string | undefined) => void;
}

const MAX_SIZE = 200 * 1024;

export default function ImageUploader({ imagePath, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { token } = useAuth();

  const handleFile = async (file: File) => {
    if (file.size > MAX_SIZE) {
      setError("File too large (200KB max)");
      return;
    }
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/assignments/image", form, {
        headers: { "Content-Type": "multipart/form-data", ...(token? { Authorization: `Bearer ${token}`}: {}) },
      });
      onChange(data.path);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.detail || "upload error";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {imagePath && (
        <img
          src={imagePath.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${imagePath}` : imagePath}
          alt="preview"
          style={{ maxWidth: 120, maxHeight: 120 }}
        />
      )}
      <Button component="label" size="small" disabled={uploading}>
        {imagePath ? "Change" : "Upload"}
        <input type="file" hidden accept="image/*" onChange={(e)=>e.target.files && handleFile(e.target.files[0])} />
      </Button>
      {imagePath && (
        <Button size="small" color="error" onClick={() => onChange(undefined)}>Remove</Button>
      )}
      {error && <Typography color="error" variant="caption">{error}</Typography>}
    </div>
  );
} 