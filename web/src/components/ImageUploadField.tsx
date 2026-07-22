import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { uploadImageFile, validateImageFile } from '../services/storageService';

type ImageUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export function ImageUploadField({
  value,
  onChange,
  folder,
  label = '이미지 업로드',
  hint = 'JPG, PNG, WEBP, GIF · 최대 5MB',
  disabled = false,
  onError,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = async (file: File | null | undefined) => {
    if (!file || disabled || uploading) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      onError?.(validationError);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      const publicUrl = await uploadImageFile(file, folder);
      setPreviewUrl(null);
      onChange(publicUrl);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    void handleFile(file);
  };

  const displayUrl = previewUrl ?? value ?? null;

  const handleRemove = () => {
    onChange('');
    setPreviewUrl(null);
  };

  return (
    <div className="image-upload">
      <span className="image-upload-label">{label}</span>
      <div
        className={`image-upload-zone${dragOver ? ' image-upload-zone--drag' : ''}${disabled ? ' image-upload-zone--disabled' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled && !uploading) inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="image-upload-input"
          onChange={onInputChange}
          disabled={disabled || uploading}
        />
        {displayUrl ? (
          <div className="image-upload-preview-wrap">
            <img src={displayUrl} alt="" className="image-upload-preview" />
            {uploading ? <div className="image-upload-overlay">업로드 중…</div> : null}
          </div>
        ) : (
          <div className="image-upload-placeholder">
            <span className="image-upload-icon">📁</span>
            <p className="image-upload-title">클릭하거나 이미지를 끌어다 놓으세요</p>
            <p className="image-upload-hint">{hint}</p>
          </div>
        )}
      </div>
      {displayUrl && !uploading ? (
        <div className="image-upload-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
            다른 이미지 선택
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleRemove}>
            제거
          </button>
        </div>
      ) : null}
    </div>
  );
}

export async function uploadEditorImage(file: File, folder: string): Promise<string> {
  return uploadImageFile(file, folder);
}
