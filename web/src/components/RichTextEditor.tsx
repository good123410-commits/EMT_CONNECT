import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadEditorImage } from './ImageUploadField';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  imageFolder?: string;
  onUploadError?: (message: string) => void;
  minHeight?: number;
  variant?: 'default' | 'article';
};

const FONT_FAMILIES = [
  { label: '기본', value: 'inherit' },
  { label: '맑은 고딕', value: 'Malgun Gothic, sans-serif' },
  { label: '나눔고딕', value: 'Nanum Gothic, sans-serif' },
  { label: '고딕', value: 'sans-serif' },
  { label: '명조', value: 'serif' },
];

const FONT_SIZES = [
  { label: '작게', value: '2' },
  { label: '보통', value: '3' },
  { label: '크게', value: '4' },
  { label: '아주 크게', value: '5' },
];

const COLORS = ['#1e293b', '#dc2626', '#2563eb', '#059669', '#7c3aed', '#d97706'];
const BG_COLORS = ['#ffffff', '#fef9c3', '#ecfdf5', '#eff6ff', '#f5f3ff', '#fef2f2'];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  imageFolder = 'community',
  onUploadError,
  minHeight = 220,
  variant = 'default',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const syncContent = useCallback(() => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const exec = (command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    syncContent();
  };

  const handleImagePick = () => {
    if (imageUploading) return;
    imageInputRef.current?.click();
  };

  const handleImageFile = async (file: File | null | undefined) => {
    if (!file) return;
    setImageUploading(true);
    try {
      const url = await uploadEditorImage(file, imageFolder);
      exec('insertImage', url);
    } catch (err) {
      onUploadError?.(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setImageUploading(false);
    }
  };

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="서식 도구">
        <select
          className="rte-select"
          defaultValue="inherit"
          onChange={(e) => exec('fontName', e.target.value)}
          aria-label="글꼴"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          className="rte-select"
          defaultValue="3"
          onChange={(e) => exec('fontSize', e.target.value)}
          aria-label="글자 크기"
        >
          {FONT_SIZES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <div className="rte-colors" aria-label="글자 색상">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="rte-color-btn"
              style={{ background: color }}
              title={`글자색 ${color}`}
              onClick={() => exec('foreColor', color)}
            />
          ))}
        </div>
        <div className="rte-colors" aria-label="배경 색상">
          {BG_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="rte-color-btn rte-color-btn--bg"
              style={{ background: color }}
              title={`배경색 ${color}`}
              onClick={() => exec('hiliteColor', color)}
            />
          ))}
        </div>
        <span className="rte-divider" />
        <button type="button" className="rte-btn" onClick={() => exec('bold')} title="굵게">
          <strong>B</strong>
        </button>
        <button type="button" className="rte-btn" onClick={() => exec('italic')} title="기울임">
          <em>I</em>
        </button>
        <button type="button" className="rte-btn" onClick={() => exec('formatBlock', 'blockquote')} title="인용구">
          ❝
        </button>
        <span className="rte-divider" />
        <button type="button" className="rte-btn" onClick={() => exec('justifyLeft')} title="왼쪽 정렬">
          ≡
        </button>
        <button type="button" className="rte-btn" onClick={() => exec('justifyCenter')} title="가운데 정렬">
          ≡
        </button>
        <button type="button" className="rte-btn" onClick={() => exec('justifyRight')} title="오른쪽 정렬">
          ≡
        </button>
        <span className="rte-divider" />
        <button
          type="button"
          className="rte-btn rte-btn--image"
          onClick={handleImagePick}
          disabled={imageUploading}
          title="이미지 파일 업로드"
        >
          {imageUploading ? '업로드 중…' : '🖼 이미지 첨부'}
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="image-upload-input"
          onChange={(e) => {
            void handleImageFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <div
        ref={editorRef}
        className={`rte-body${variant === 'article' ? ' rte-body--article' : ''}`}
        style={{ minHeight }}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={syncContent}
        onBlur={syncContent}
        suppressContentEditableWarning
      />
    </div>
  );
}

export function stripHtml(html: string): string {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent ?? div.innerText ?? '').replace(/\s+/g, ' ').trim();
}
