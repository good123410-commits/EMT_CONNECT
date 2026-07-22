import { useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { uploadAttachmentFile, validateAttachmentFile } from '../services/storageService';

type FileUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
};

function fileNameFromUrl(url: string): string {
  if (!url) return '';
  try {
    const pathname = new URL(url).pathname;
    const segment = decodeURIComponent(pathname.split('/').pop() ?? '');
    const dash = segment.indexOf('-');
    return dash > 0 && dash < 40 ? segment.slice(dash + 1) : segment;
  } catch {
    return url.split('/').pop() ?? url;
  }
}

export function FileUploadField({
  value,
  onChange,
  folder,
  label = '첨부파일 업로드',
  hint = 'PDF, Word, Excel, PPT, ZIP, TXT, HWP · 최대 10MB',
  disabled = false,
  onError,
}: FileUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const displayName = fileName || (value ? fileNameFromUrl(value) : '');

  const handleFile = async (file: File | null | undefined) => {
    if (!file || disabled || uploading) return;

    const validationError = validateAttachmentFile(file);
    if (validationError) {
      onError?.(validationError);
      return;
    }

    setUploading(true);
    setFileName(file.name);
    try {
      const publicUrl = await uploadAttachmentFile(file, folder);
      onChange(publicUrl);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : '파일 업로드에 실패했습니다.');
      setFileName(null);
    } finally {
      setUploading(false);
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
    void handleFile(e.dataTransfer.files?.[0]);
  };

  const handleRemove = () => {
    onChange('');
    setFileName(null);
  };

  return (
    <div className="file-upload">
      <span className="image-upload-label">{label}</span>
      <div
        className={`file-upload-zone${dragOver ? ' file-upload-zone--drag' : ''}${disabled ? ' file-upload-zone--disabled' : ''}`}
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
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.hwp,application/pdf"
          className="image-upload-input"
          onChange={onInputChange}
          disabled={disabled || uploading}
        />
        {value || uploading ? (
          <div className="file-upload-attached">
            <span className="file-upload-icon" aria-hidden>
              📎
            </span>
            <div className="file-upload-meta">
              <p className="file-upload-name">{uploading ? '업로드 중…' : displayName || '첨부파일'}</p>
              {value && !uploading ? (
                <a href={value} className="file-upload-link" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  미리보기 / 다운로드
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="image-upload-placeholder">
            <span className="image-upload-icon">📁</span>
            <p className="image-upload-title">클릭하거나 파일을 끌어다 놓으세요</p>
            <p className="image-upload-hint">{hint}</p>
          </div>
        )}
      </div>
      {(value || fileName) && !uploading ? (
        <div className="image-upload-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
            다른 파일 선택
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleRemove}>
            제거
          </button>
        </div>
      ) : null}
    </div>
  );
}
