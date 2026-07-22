import { Text, View } from 'react-native';
import {
  SERVICE_POLICY_FOOTER,
  SERVICE_POLICY_INTRO,
  SERVICE_POLICY_SECTIONS,
  type ServicePolicySection,
} from '@/constants/servicePolicyContent';

function HighlightedBody({ section }: { section: ServicePolicySection }) {
  const highlights = section.highlights ?? [];
  if (highlights.length === 0) {
    return <Text className="text-sm leading-7 text-slate-600">{section.body}</Text>;
  }

  let remaining = section.body;
  const parts: { text: string; highlight: boolean }[] = [];

  while (remaining.length > 0) {
    let earliestIndex = -1;
    let matchedHighlight = '';

    for (const phrase of highlights) {
      const idx = remaining.indexOf(phrase);
      if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
        earliestIndex = idx;
        matchedHighlight = phrase;
      }
    }

    if (earliestIndex === -1) {
      parts.push({ text: remaining, highlight: false });
      break;
    }

    if (earliestIndex > 0) {
      parts.push({ text: remaining.slice(0, earliestIndex), highlight: false });
    }

    parts.push({ text: matchedHighlight, highlight: true });
    remaining = remaining.slice(earliestIndex + matchedHighlight.length);
  }

  return (
    <Text className="text-sm leading-7 text-slate-600">
      {parts.map((part, index) =>
        part.highlight ? (
          <Text key={`${section.id}-hl-${index}`} className="font-bold text-slate-900">
            {part.text}
          </Text>
        ) : (
          <Text key={`${section.id}-tx-${index}`}>{part.text}</Text>
        ),
      )}
    </Text>
  );
}

type ServicePolicyContentProps = {
  showIntro?: boolean;
  showFooter?: boolean;
};

export function ServicePolicyContent({ showIntro = true, showFooter = true }: ServicePolicyContentProps) {
  return (
    <View className="gap-5">
      {showIntro ? (
        <View className="rounded-2xl bg-slate-50 px-4 py-4">
          <Text className="text-sm leading-7 text-slate-700">{SERVICE_POLICY_INTRO}</Text>
        </View>
      ) : null}

      {SERVICE_POLICY_SECTIONS.map((section) => (
        <View key={section.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
          <View className="mb-3 flex-row items-center">
            <View className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
            <Text className="text-base font-bold text-slate-900">{section.title}</Text>
          </View>
          <HighlightedBody section={section} />
          {section.id === 'medical' ? (
            <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
              <Text className="text-center text-sm font-bold text-red-700">
                위급 상황 시 반드시 119에 신고하십시오
              </Text>
            </View>
          ) : null}
        </View>
      ))}

      {showFooter ? (
        <Text className="px-1 text-xs leading-5 text-slate-400">{SERVICE_POLICY_FOOTER}</Text>
      ) : null}
    </View>
  );
}
