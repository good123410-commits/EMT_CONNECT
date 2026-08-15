import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

export type WriteFieldRule = {
  id: string;
  label: string;
  value: string;
  minLength?: number;
  required?: boolean;
};

export function getFirstWriteValidationError(rules: WriteFieldRule[]): string | null {
  for (const rule of rules) {
    const trimmed = rule.value.trim();
    const isRequired = rule.required !== false;

    if (!isRequired) continue;

    if (rule.minLength !== undefined) {
      if (trimmed.length < rule.minLength) {
        return `${rule.label}은(는) 최소 ${rule.minLength}자 이상 입력해 주세요.`;
      }
      continue;
    }

    if (!trimmed) {
      return `${rule.label}을(를) 입력해 주세요.`;
    }
  }

  return null;
}

export function isWriteFormValid(rules: WriteFieldRule[]): boolean {
  return getFirstWriteValidationError(rules) === null;
}

type WriteFieldLabelProps = {
  children: string;
  required?: boolean;
  optional?: boolean;
};

export function WriteFieldLabel({ children, required, optional }: WriteFieldLabelProps) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <Text
      style={{
        marginBottom: 4,
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 12,
        color: lounge.textMuted,
      }}
    >
      {children}
      {required ? (
        <Text style={{ color: lounge.error, fontFamily: 'Pretendard-Bold' }}> *</Text>
      ) : null}
      {optional ? (
        <Text style={{ fontFamily: 'Pretendard', color: lounge.textMuted }}> (선택)</Text>
      ) : null}
    </Text>
  );
}

type WriteFieldCountProps = {
  value: string;
  minLength: number;
};

/** 필수 텍스트 필드 — 실시간 글자 수 / 최소 기준 */
export function WriteFieldCount({ value, minLength }: WriteFieldCountProps) {
  const { lounge } = useEmsLoungeTheme();
  const count = value.trim().length;
  const met = count >= minLength;

  return (
    <Text
      style={{
        marginTop: 4,
        marginBottom: 12,
        textAlign: 'right',
        fontFamily: 'Pretendard',
        fontSize: 11,
        color: met ? lounge.green : lounge.error,
      }}
    >
      {count} / {minLength}자 이상{met ? ' · 입력 완료' : ''}
    </Text>
  );
}

type WriteFieldStatusProps = {
  value: string;
  label?: string;
};

/** URL·파일명 등 길이 기준이 없는 필수 필드 */
export function WriteFieldStatus({ value, label = '필수 입력' }: WriteFieldStatusProps) {
  const { lounge } = useEmsLoungeTheme();
  const filled = value.trim().length > 0;

  return (
    <Text
      style={{
        marginTop: 4,
        marginBottom: 12,
        textAlign: 'right',
        fontFamily: 'Pretendard',
        fontSize: 11,
        color: filled ? lounge.green : lounge.textMuted,
      }}
    >
      {filled ? '입력 완료' : label}
    </Text>
  );
}

type WriteFormFieldProps = {
  label: string;
  required?: boolean;
  optional?: boolean;
  value?: string;
  minLength?: number;
  showStatus?: boolean;
  children: ReactNode;
};

export function WriteFormField({
  label,
  required,
  optional,
  value,
  minLength,
  showStatus,
  children,
}: WriteFormFieldProps) {
  const hasFooter = (minLength !== undefined && value !== undefined) || (showStatus && value !== undefined);

  return (
    <View style={{ marginBottom: hasFooter ? 0 : 12 }}>
      <WriteFieldLabel required={required} optional={optional}>
        {label}
      </WriteFieldLabel>
      {children}
      {minLength !== undefined && value !== undefined ? (
        <WriteFieldCount value={value} minLength={minLength} />
      ) : null}
      {showStatus && value !== undefined && minLength === undefined ? (
        <WriteFieldStatus value={value} />
      ) : null}
    </View>
  );
}
