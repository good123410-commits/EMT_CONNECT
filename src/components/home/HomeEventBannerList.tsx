import * as WebBrowser from 'expo-web-browser';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_FONT, APP_RADIUS } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import type { HomeBanner } from '@/types/homeDashboard';

type HomeEventBannerListProps = {
  banners: HomeBanner[];
};

/** 배너 최소 높이 — 기존 124pt 대비 약 1.6배 */
const BANNER_MIN_HEIGHT = 200;
/** 카드 너비 대비 높이 비율 (≈ 1.9:1, 시원한 히어로 비율) */
const BANNER_HEIGHT_RATIO = 0.52;
const BANNER_GAP = 10;
const HORIZONTAL_INSET = 16;
const BANNER_BOTTOM_SPACING = 24;

function resolveBannerHeight(cardWidth: number): number {
  return Math.max(BANNER_MIN_HEIGHT, Math.round(cardWidth * BANNER_HEIGHT_RATIO));
}

async function openBannerLink(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
      enableBarCollapsing: true,
    });
  } catch {
    // ignore
  }
}

function BannerPagination({
  count,
  activeIndex,
  overlaid = false,
}: {
  count: number;
  activeIndex: number;
  overlaid?: boolean;
}) {
  const { colors } = useThemedColors();

  if (count <= 1) return null;

  return (
    <View
      className="flex-row items-center justify-center gap-1.5"
      style={overlaid ? undefined : { marginTop: 10 }}
    >
      {Array.from({ length: count }, (_, index) => {
        const active = index === activeIndex;
        return (
          <View
            key={index}
            style={{
              width: active ? 18 : 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: overlaid
                ? active
                  ? '#FFFFFF'
                  : 'rgba(255,255,255,0.45)'
                : active
                  ? colors.blue
                  : colors.border,
            }}
          />
        );
      })}
    </View>
  );
}

/** 하단 텍스트 가독성용 다단 그라데이션 오버레이 (linear-gradient 미사용 환경) */
function BannerGradientOverlay({ height }: { height: number }) {
  const overlayHeight = Math.round(height * 0.58);

  return (
    <View
      pointerEvents="none"
      className="absolute bottom-0 left-0 right-0"
      style={{ height: overlayHeight }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0)' }} />
      <View style={{ height: overlayHeight * 0.28, backgroundColor: 'rgba(0,0,0,0.18)' }} />
      <View style={{ height: overlayHeight * 0.24, backgroundColor: 'rgba(0,0,0,0.38)' }} />
      <View style={{ height: overlayHeight * 0.24, backgroundColor: 'rgba(0,0,0,0.62)' }} />
      <View style={{ height: overlayHeight * 0.24, backgroundColor: 'rgba(0,0,0,0.78)' }} />
    </View>
  );
}

function BannerSlide({
  banner,
  width,
  height,
}: {
  banner: HomeBanner;
  width: number;
  height: number;
}) {
  const { colors, semantic } = useThemedColors();
  const [imageReady, setImageReady] = useState(false);
  const hasLink = Boolean(banner.linkUrl.trim());
  const title = banner.title.trim();
  const description = banner.description.trim();
  const hasText = Boolean(title || description);

  const openBanner = () => {
    const url = banner.linkUrl.trim();
    if (!url) return;
    void openBannerLink(url);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title || '이벤트 배너'}
      accessibilityHint={hasLink ? '탭하여 자세히 보기' : undefined}
      onPress={openBanner}
      disabled={!hasLink}
      style={{
        width,
        height,
        borderRadius: APP_RADIUS.cardLg,
        overflow: 'hidden',
        backgroundColor: colors.surfaceElevated,
      }}
    >
      {banner.imageUrl ? (
        <>
          <Image
            source={{ uri: banner.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(true)}
          />
          {!imageReady ? (
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ backgroundColor: colors.surfaceElevated }}
            >
              <ActivityIndicator color={colors.blue} size="small" />
            </View>
          ) : null}
          {hasText ? <BannerGradientOverlay height={height} /> : null}
          {hasText ? (
            <View
              className="absolute bottom-0 left-0 right-0 px-4"
              style={{ paddingTop: 28, paddingBottom: 36 }}
            >
              {title ? (
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: APP_FONT.bold,
                    fontSize: 16,
                    lineHeight: 22,
                    color: '#FFFFFF',
                  }}
                >
                  {title}
                </Text>
              ) : null}
              {description ? (
                <Text
                  numberOfLines={2}
                  style={{
                    marginTop: title ? 4 : 0,
                    fontFamily: APP_FONT.regular,
                    fontSize: 13,
                    lineHeight: 18,
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {description}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : (
        <View className="flex-1 justify-center px-5 py-4">
          <View className="mb-2 flex-row items-center gap-2">
            <AppIcon name="bullhorn-outline" size={20} color={colors.blue} />
            <Text
              numberOfLines={2}
              style={{
                flex: 1,
                fontFamily: APP_FONT.bold,
                fontSize: 16,
                lineHeight: 22,
                color: semantic.text,
              }}
            >
              {title || '공지'}
            </Text>
            {hasLink ? <AppIcon name="chevron-right" size={20} color={semantic.mutedText} /> : null}
          </View>
          {description ? (
            <Text
              numberOfLines={3}
              style={{
                fontFamily: APP_FONT.regular,
                fontSize: 13,
                lineHeight: 19,
                color: semantic.subText,
              }}
            >
              {description}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

/**
 * 홈 이벤트/공지 배너 — 가로 스와이프 캐러셀
 */
export function HomeEventBannerList({ banners }: HomeEventBannerListProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<HomeBanner>>(null);

  const cardWidth = screenWidth - HORIZONTAL_INSET * 2;
  const bannerHeight = resolveBannerHeight(cardWidth);
  const snapInterval = cardWidth + BANNER_GAP;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / snapInterval);
      if (nextIndex !== activeIndex && nextIndex >= 0 && nextIndex < banners.length) {
        setActiveIndex(nextIndex);
      }
    },
    [activeIndex, banners.length, snapInterval],
  );

  if (banners.length === 0) return null;

  const showPagination = banners.length > 1;

  return (
    <View style={{ marginBottom: BANNER_BOTTOM_SPACING, marginHorizontal: -HORIZONTAL_INSET }}>
      <View style={{ height: bannerHeight }}>
        <FlatList
          ref={listRef}
          data={banners}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={snapInterval}
          snapToAlignment="start"
          disableIntervalMomentum
          style={{ height: bannerHeight }}
          contentContainerStyle={{ paddingHorizontal: HORIZONTAL_INSET }}
          ItemSeparatorComponent={() => <View style={{ width: BANNER_GAP }} />}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <BannerSlide banner={item} width={cardWidth} height={bannerHeight} />
          )}
        />

        {showPagination ? (
          <View
            pointerEvents="none"
            className="absolute bottom-3 left-0 right-0 items-center"
          >
            <BannerPagination count={banners.length} activeIndex={activeIndex} overlaid />
          </View>
        ) : null}
      </View>
    </View>
  );
}
