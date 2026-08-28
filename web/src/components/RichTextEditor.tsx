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
  /** 관리자 대시보드 등 넓은 편집 영역 */
  admin?: boolean;
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

function AlignIcon({ align }: { align: 'left' | 'center' | 'right' }) {
  const lines =
    align === 'left'
      ? [14, 10, 12]
      : align === 'center'
        ? [12, 14, 10]
        : [10, 14, 12];

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      {lines.map((width, index) => (
        <rect
          key={index}
          x={align === 'right' ? 16 - width : align === 'center' ? (16 - width) / 2 : 0}
          y={2 + index * 5}
          width={width}
          height="2"
          rx="1"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  imageFolder = 'community',
  onUploadError,
  minHeight = 360,
  variant = 'default',
  admin = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const resolvedMinHeight = admin ? Math.max(minHeight, 520) : minHeight;

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

  const rteClassName = ['rte', admin ? 'rte--admin' : ''].filter(Boolean).join(' ');

  return (
    <div className={rteClassName}>
      <div className="rte-toolbar" role="toolbar" aria-label="서식 도구">
        <div className="rte-toolbar-group">
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
        </div>

        <span className="rte-divider" aria-hidden />

        <div className="rte-toolbar-group rte-toolbar-group--colors">
          <span className="rte-toolbar-label">글자</span>
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

        <span className="rte-divider" aria-hidden />

        <div className="rte-toolbar-group rte-toolbar-group--colors">
          <span className="rte-toolbar-label">배경</span>
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

        <span className="rte-divider" aria-hidden />

        <div className="rte-toolbar-group">
          <button type="button" className="rte-btn" onClick={() => exec('bold')} title="굵게" aria-label="굵게">
            <strong>B</strong>
          </button>
          <button type="button" className="rte-btn" onClick={() => exec('italic')} title="기울임" aria-label="기울임">
            <em>I</em>
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={() => exec('formatBlock', 'blockquote')}
            title="인용구"
            aria-label="인용구"
          >
            ❝
          </button>
        </div>

        <span className="rte-divider" aria-hidden />

        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn"
            onClick={() => exec('justifyLeft')}
            title="왼쪽 정렬"
            aria-label="왼쪽 정렬"
          >
            <AlignIcon align="left" />
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={() => exec('justifyCenter')}
            title="가운데 정렬"
            aria-label="가운데 정렬"
          >
            <AlignIcon align="center" />
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={() => exec('justifyRight')}
            title="오른쪽 정렬"
            aria-label="오른쪽 정렬"
          >
            <AlignIcon align="right" />
          </button>
        </div>

        <span className="rte-divider" aria-hidden />

        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn rte-btn--image"
            onClick={handleImagePick}
            disabled={imageUploading}
            title="이미지 파일 업로드"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
              <path d="M21 16l-5.5-5.5L5 20" />
            </svg>
            {imageUploading ? '업로드 중…' : '이미지'}
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
      </div>
      <div
        ref={editorRef}
        className={`rte-body${variant === 'article' ? ' rte-body--article' : ''}`}
        style={{ minHeight: resolvedMinHeight }}
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
