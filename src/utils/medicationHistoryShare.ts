import { Linking, Platform, Share } from 'react-native';
import type { MedicationHistoryEntry, MedicationRegistration } from '@/types/medicationLog';
import { formatHistoryTime } from '@/utils/medicationTimer';

export function buildMedicationHistoryText(
  history: MedicationHistoryEntry[],
  registration: MedicationRegistration | null,
): string {
  const lines: string[] = [
    'KEMIX 약물 복용 기록지',
    '────────────────────',
  ];

  if (registration) {
    for (const med of registration.medications) {
      const label = med.drugName.trim() || '약물';
      lines.push(
        `[${label}] ${med.dosePerServing || '—'} · ${med.intervalHours}시간 간격`,
      );
    }
    lines.push('');
  }

  if (history.length === 0) {
    lines.push('복용 기록이 없습니다.');
  } else {
    lines.push('복용 기록:');
    for (const entry of history) {
      lines.push(
        `${formatHistoryTime(entry.takenAt)} · ${entry.drugName} · ${entry.dosePerServing}`,
      );
    }
  }

  lines.push('');
  lines.push('※ 의료 행위·처방을 대체하지 않는 참고 기록입니다.');
  return lines.join('\n');
}

export async function shareMedicationHistoryText(text: string): Promise<void> {
  await Share.share({
    message: text,
    title: 'KEMIX 약물 복용 기록지',
  });
}

export async function emailMedicationHistory(text: string, email?: string | null): Promise<void> {
  const subject = encodeURIComponent('KEMIX 약물 복용 기록지');
  const body = encodeURIComponent(text);
  const to = email?.trim() ? encodeURIComponent(email.trim()) : '';
  const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
  const can = await Linking.canOpenURL(mailto);
  if (!can) {
    throw new Error('이메일 앱을 열 수 없습니다.');
  }
  await Linking.openURL(mailto);
}

export async function printMedicationHistory(text: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.print === 'function') {
    const html = `
      <html><head><title>KEMIX 약물 복용 기록지</title>
      <style>body{font-family:sans-serif;padding:24px;line-height:1.6}pre{white-space:pre-wrap}</style>
      </head><body><pre>${text.replace(/</g, '&lt;')}</pre></body></html>`;
    const win = window.open('', '_blank');
    if (!win) throw new Error('인쇄 창을 열 수 없습니다.');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    return;
  }
  await Share.share({ message: text, title: 'KEMIX 약물 복용 기록지 (인쇄용)' });
}
