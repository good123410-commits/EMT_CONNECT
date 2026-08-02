type ShortcodeCallButtonProps = {
  phone?: string;
  label?: string;
};

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function ShortcodeCallButton({ phone = '119', label }: ShortcodeCallButtonProps) {
  const dial = normalizePhone(phone) || '119';
  const title = label?.trim() || `응급 신고 ${dial}`;

  return (
    <a className="community-shortcode-119" href={`tel:${dial}`}>
      <span className="community-shortcode-119__icon" aria-hidden>
        📞
      </span>
      <span className="community-shortcode-119__text">
        <strong>{title}</strong>
        <span>탭하면 즉시 전화 앱으로 연결됩니다</span>
      </span>
      <span className="community-shortcode-119__dial">{dial}</span>
    </a>
  );
}
