import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import { APP_COLORS, APP_FONT, APP_SPACING } from '@/constants/appTheme';
import { CHEMICAL_SCREEN_TITLE, SETTINGS_SCREEN_TITLE } from '@/constants/navigationHeader';
import { UTILITY_TOOL_ITEMS } from '@/constants/utilityTools';
import { useSettingsMenu } from '@/contexts/SettingsMenuContext';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { navigateToChemicalScreen, navigateToMainTab } from '@/navigation/mainTabNavigation';
import { navigateToUtilityTool } from '@/navigation/utilityNavigation';
import type { MedicalMapTab } from '@/types/medicalMap';
import type { UtilityToolRoute } from '@/constants/utilityTools';

type ServiceItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: AppIconName;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
};

type ServiceSection = {
  id: string;
  title: string;
  items: ServiceItem[];
};

function ServiceRow({ item }: { item: ServiceItem }) {
  return (
    <Pressable
      className="flex-row items-center py-3.5 active:opacity-80"
      onPress={item.onPress}
      accessibilityRole="button"
    >
      <View
        className="mr-3.5 h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: item.iconBg }}
      >
        <AppIcon name={item.icon} size={22} color={item.iconColor} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-semibold text-kemix-text" style={{ fontFamily: APP_FONT.semibold }}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text className="mt-0.5 text-xs leading-4 text-kemix-text-secondary">{item.subtitle}</Text>
        ) : null}
      </View>
      <AppIcon name="chevron-right" size={20} color={APP_COLORS.textMuted} />
    </Pressable>
  );
}

function mapMedicalItem(tab: MedicalMapTab, label: string, icon: AppIconName, iconColor: string, iconBg: string): ServiceItem {
  return {
    id: `map-${tab}`,
    title: label,
    icon,
    iconColor,
    iconBg,
    onPress: () => navigateToMainTab('Map', { initialTab: tab }),
  };
}

export function AllServicesScreen() {
  const fabBottomInset = useGlobalFabBottomInset();
  const { openSettings } = useSettingsMenu();

  const utilityItems: ServiceItem[] = UTILITY_TOOL_ITEMS.map((tool) => ({
    id: tool.id,
    title: tool.title,
    icon: tool.icon as AppIconName,
    iconColor: tool.accent,
    iconBg: tool.accentBg,
    onPress: () => navigateToUtilityTool(tool.route as UtilityToolRoute),
  }));

  const sections: ServiceSection[] = [
    {
      id: 'settings',
      title: '계정 · 설정',
      items: [
        {
          id: 'settings',
          title: SETTINGS_SCREEN_TITLE,
          subtitle: '개인정보, 알림, 앱 정보',
          icon: 'cog-outline',
          iconColor: APP_COLORS.textPrimary,
          iconBg: APP_COLORS.surfaceElevated,
          onPress: openSettings,
        },
      ],
    },
    {
      id: 'medical',
      title: '의료정보',
      items: [
        mapMedicalItem('aed', 'AED', 'heart-pulse', '#F87171', '#3A1F1F'),
        mapMedicalItem('er', '응급실', 'hospital-box', '#60A5FA', '#1A2A40'),
        mapMedicalItem('pediatric', '소아 의료기관', 'baby-face-outline', '#F472B6', '#3A1F2E'),
        mapMedicalItem('pharmacy', '약국', 'medical-bag-outline', '#34D399', '#1A2E28'),
        mapMedicalItem('privateEms', '민간 구급차', 'ambulance', '#FB923C', '#3A2618'),
      ],
    },
    {
      id: 'tools',
      title: '응급 유틸',
      items: [
        {
          id: 'chemical',
          title: CHEMICAL_SCREEN_TITLE,
          subtitle: '의약품 성분 · 효능 검색',
          icon: 'flask-outline',
          iconColor: '#A78BFA',
          iconBg: '#2A2240',
          onPress: navigateToChemicalScreen,
        },
        ...utilityItems,
      ],
    },
    {
      id: 'community',
      title: '커뮤니티',
      items: [
        {
          id: 'paramedic',
          title: EMS_COMMUNITY_TAB_LABEL,
          subtitle: '구급대원 전용 커뮤니티',
          icon: 'account-group-outline',
          iconColor: '#4ADE80',
          iconBg: '#1A2E22',
          onPress: () => navigateToMainTab('Paramedic'),
        },
      ],
    },
    {
      id: 'main',
      title: '바로가기',
      items: [
        {
          id: 'home',
          title: '홈',
          icon: 'home-outline',
          iconColor: APP_COLORS.blueSoft,
          iconBg: APP_COLORS.blueLight,
          onPress: () => navigateToMainTab('Home'),
        },
        {
          id: 'guide',
          title: '응급 가이드',
          icon: 'medical-bag',
          iconColor: '#F87171',
          iconBg: '#3A1F1F',
          onPress: () => navigateToMainTab('Guide'),
        },
      ],
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-kemix-bg"
      contentContainerStyle={{
        paddingHorizontal: APP_SPACING.screen,
        paddingTop: APP_SPACING.screenTop,
        paddingBottom: fabBottomInset,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="mb-1 text-2xl font-bold text-kemix-text" style={{ fontFamily: APP_FONT.bold }}>
        전체
      </Text>
      <Text className="mb-5 text-sm text-kemix-text-secondary">
        KON의 주요 서비스와 설정을 한곳에서 확인하세요.
      </Text>

      {sections.map((section) => (
        <View key={section.id} className="mb-5">
          <Text
            className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-kemix-muted"
            style={{ fontFamily: APP_FONT.semibold }}
          >
            {section.title}
          </Text>
          <View
            className="overflow-hidden rounded-2xl border border-kemix-border bg-kemix-surface px-4"
          >
            {section.items.map((item, index) => (
              <View key={item.id}>
                <ServiceRow item={item} />
                {index < section.items.length - 1 ? (
                  <View className="h-px bg-kemix-border-light" />
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
