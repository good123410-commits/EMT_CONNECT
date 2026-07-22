type AdSenseSlotProps = {
  slotId: string;
  className?: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
};

const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined;

/**
 * Google AdSense 광고 슬롯.
 * VITE_ADSENSE_CLIENT_ID 환경변수가 설정된 경우에만 실제 광고를 로드합니다.
 */
export function AdSenseSlot({ slotId, className = '', format = 'auto' }: AdSenseSlotProps) {
  if (!clientId) {
    return (
      <div className={`ad-slot ad-slot--placeholder ${className}`} aria-hidden>
        <span>AdSense · {slotId}</span>
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ad-slot ${className}`}
      style={{ display: 'block' }}
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
