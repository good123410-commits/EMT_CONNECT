import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from 'react-native';
import {
  DEFAULT_GUIDE_FONT_ID,
  DEFAULT_GUIDE_FONT_SIZE,
  GUIDE_FONT_OPTIONS,
  GUIDE_FONT_SIZE_OPTIONS,
  getGuideFontOption,
  type GuideFontSize,
} from '@/constants/guideFonts';
import { loadGuideFont, useGuideFont, useGuideFontCatalog } from '@/hooks/useGuideFontLoader';

export type GuideTypographyStyle = {
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  color: string;
};

type DropdownKind = 'font' | 'size';

type GuideTypographyToolbarProps = {
  active: boolean;
  fontId: string;
  fontSize: GuideFontSize;
  onChangeFontId: (fontId: string) => void;
  onChangeFontSize: (fontSize: GuideFontSize) => void;
};

export function buildGuideTextStyle(
  fontFamily: string | undefined,
  fontSize: number,
  lineHeightMultiplier = 1.65,
): GuideTypographyStyle {
  const style: GuideTypographyStyle = {
    fontSize,
    lineHeight: Math.round(fontSize * lineHeightMultiplier),
    color: '#1e293b',
  };

  if (fontFamily) {
    style.fontFamily = fontFamily;
  }

  return style;
}

export function GuideTypographyToolbar({
  active,
  fontId,
  fontSize,
  onChangeFontId,
  onChangeFontSize,
}: GuideTypographyToolbarProps) {
  const [openMenu, setOpenMenu] = useState<DropdownKind | null>(null);
  const [selectingFont, setSelectingFont] = useState(false);
  const { ready } = useGuideFontCatalog(active);
  const { fontFamily } = useGuideFont(fontId);

  const selectedFontLabel = getGuideFontOption(fontId).label;
  const previewStyle = useMemo(
    () => buildGuideTextStyle(fontFamily, fontSize),
    [fontFamily, fontSize],
  );

  const toggleMenu = (kind: DropdownKind) => {
    setOpenMenu((prev) => (prev === kind ? null : kind));
  };

  const handleSelectFont = async (nextFontId: string) => {
    setSelectingFont(true);
    try {
      if (nextFontId !== DEFAULT_GUIDE_FONT_ID) {
        await loadGuideFont(nextFontId);
      }
      onChangeFontId(nextFontId);
      setOpenMenu(null);
    } finally {
      setSelectingFont(false);
    }
  };

  const handleSelectSize = (nextSize: GuideFontSize) => {
    onChangeFontSize(nextSize);
    setOpenMenu(null);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.toolbarRow}>
        <Pressable
          style={[styles.triggerButton, openMenu === 'font' && styles.triggerButtonActive]}
          onPress={() => toggleMenu('font')}
        >
          <Ionicons name="text" size={15} color={openMenu === 'font' ? '#dc2626' : '#475569'} />
          <Text
            style={[
              styles.triggerLabel,
              openMenu === 'font' && styles.triggerLabelActive,
              fontFamily ? { fontFamily } : undefined,
            ]}
            numberOfLines={1}
          >
            {selectedFontLabel}
          </Text>
          <Ionicons
            name={openMenu === 'font' ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#94a3b8"
          />
        </Pressable>

        <Pressable
          style={[
            styles.triggerButton,
            styles.sizeTriggerButton,
            openMenu === 'size' && styles.triggerButtonActive,
          ]}
          onPress={() => toggleMenu('size')}
        >
          <Ionicons
            name="resize-outline"
            size={15}
            color={openMenu === 'size' ? '#dc2626' : '#475569'}
          />
          <Text style={[styles.triggerLabel, openMenu === 'size' && styles.triggerLabelActive]}>
            {fontSize}px
          </Text>
          <Ionicons
            name={openMenu === 'size' ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#94a3b8"
          />
        </Pressable>
      </View>

      {openMenu === 'font' ? (
        <View style={styles.inlineMenu}>
          {!ready || selectingFont ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#0f172a" />
              <Text style={styles.loadingText}>
                {selectingFont ? '폰트 적용 중...' : '폰트 불러오는 중...'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.menuScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="always"
            >
              {GUIDE_FONT_OPTIONS.map((option) => {
                const selected = fontId === option.id;
                const optionFamily =
                  option.id === DEFAULT_GUIDE_FONT_ID ? undefined : option.family;

                return (
                  <Pressable
                    key={option.id}
                    style={[styles.menuItem, selected && styles.menuItemSelected]}
                    onPress={() => void handleSelectFont(option.id)}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        selected && styles.menuItemTextSelected,
                        optionFamily ? { fontFamily: optionFamily } : undefined,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.menuItemMeta}>
                      {option.source === 'google'
                        ? 'Google Fonts'
                        : option.source === 'noonnu'
                          ? '눈누'
                          : '시스템 기본'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : null}

      {openMenu === 'size' ? (
        <View style={styles.inlineMenu}>
          {GUIDE_FONT_SIZE_OPTIONS.map((size) => {
            const selected = fontSize === size;
            return (
              <Pressable
                key={size}
                style={[styles.menuItem, selected && styles.menuItemSelected]}
                onPress={() => handleSelectSize(size)}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    selected && styles.menuItemTextSelected,
                    { fontSize: Math.min(size, 22) },
                  ]}
                >
                  {size === DEFAULT_GUIDE_FONT_SIZE ? `${size}px · 기본` : `${size}px`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Text style={[styles.previewHint, previewStyle as TextStyle]}>
        미리보기 · {selectedFontLabel} / {fontSize}px
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
    zIndex: 20,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 10,
  },
  triggerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sizeTriggerButton: {
    flexGrow: 0,
    flexBasis: 112,
    maxWidth: 132,
  },
  triggerButtonActive: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
  },
  triggerLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  triggerLabelActive: {
    color: '#dc2626',
  },
  inlineMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  menuScroll: {
    maxHeight: 240,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  menuItemSelected: {
    backgroundColor: '#fff1f2',
  },
  menuItemText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  menuItemTextSelected: {
    color: '#dc2626',
    fontWeight: '700',
  },
  menuItemMeta: {
    marginTop: 2,
    fontSize: 10,
    color: '#94a3b8',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 11,
    color: '#64748b',
  },
  previewHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
  },
});
