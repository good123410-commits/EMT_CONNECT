import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  type ImageLoadEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import {
  APP_BORDER,
  APP_COLORS,
  APP_FONT,
  APP_RADIUS,
  APP_SHADOW,
  APP_SPACING,
} from '@/constants/appTheme';
import type { HomeBanner } from '@/types/homeDashboard';

type HomeEventBannerListProps = {
  banners: HomeBanner[];
};

const BANNER_GAP = 16;
const DEFAULT_ASPECT_RATIO = 16 / 9;
const PLACEHOLDER_HEIGHT = 180;
const MAX_IMAGE_HEIGHT = 280;
const MIN_IMAGE_HEIGHT = 140;
const IMAGE_CANVAS_BG = APP_COLORS.surfaceElevated;

function clampContainerHeight(width: number, aspectRatio: number): number {
  if (width <= 0) return MIN_IMAGE_HEIGHT;
  const naturalHeight = width / aspectRatio;
  return Math.min(MAX_IMAGE_HEIGHT, Math.max(MIN_IMAGE_HEIGHT, naturalHeight));
}

function BannerImage({ uri, width }: { uri: string; width: number }) {
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setAspectRatio(DEFAULT_ASPECT_RATIO);

    if (!uri) return;

    Image.getSize(
      uri,
      (w, h) => {
        if (w > 0 && h > 0) setAspectRatio(w / h);
      },
      () => undefined,
    );
  }, [uri]);

  const containerHeight = clampContainerHeight(width, aspectRatio);

  const handleImageLoad = (event: ImageLoadEvent) => {
    setImageReady(true);
    const source = event.nativeEvent.source;
    if (source?.width > 0 && source?.height > 0) {
      setAspectRatio(source.width / source.height);
    }
  };

  if (width <= 0) {
    return (
      <View
        style={{
          width: '100%',
          height: MIN_IMAGE_HEIGHT,
          backgroundColor: IMAGE_CANVAS_BG,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={APP_COLORS.blue} size="small" />
      </View>
    );
  }

  return (
    <View
      style={{
        width,
        height: containerHeight,
        backgroundColor: IMAGE_CANVAS_BG,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!imageReady ? (
        <ActivityIndicator
          color={APP_COLORS.blue}
          size="small"
          style={{ position: 'absolute' }}
        />
      ) : null}
      <Image
        source={{ uri }}
        style={{ width, height: containerHeight }}
        resizeMode="contain"
        accessibilityRole="image"
        onLoad={handleImageLoad}
        onError={() => setImageReady(true)}
      />
    </View>
  );
}

async function openBannerLink(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
      enableBarCollapsing: true,
    });
  } catch {
    // ignore — 사용자가 닫은 경우 등
  }
}

export function HomeEventBannerList({ banners }: HomeEventBannerListProps) {
  const { width: screenWidth } = useWindowDimensions();
  const bannerWidth = Math.max(0, screenWidth - APP_SPACING.screen * 2);

  if (banners.length === 0 || bannerWidth <= 0) {
    return null;
  }

  const openBanner = (banner: HomeBanner) => {
    const url = banner.linkUrl.trim();
    if (!url) return;
    void openBannerLink(url);
  };

  return (
    <View style={{ gap: BANNER_GAP }}>
      {banners.map((banner) => {
        const hasText = Boolean(banner.title.trim() || banner.description.trim());
        const hasLink = Boolean(banner.linkUrl.trim());

        return (
          <Pressable
            key={banner.id}
            className="active:opacity-95"
            style={{
              width: bannerWidth,
              borderRadius: APP_RADIUS.card,
              backgroundColor: APP_COLORS.surface,
              ...APP_SHADOW.cardSoft,
              ...APP_BORDER.card,
            }}
            onPress={() => openBanner(banner)}
            disabled={!hasLink}
          >
            {banner.imageUrl ? (
              <BannerImage uri={banner.imageUrl} width={bannerWidth} />
            ) : (
              <View
                className="items-center justify-center"
                style={{
                  width: bannerWidth,
                  height: PLACEHOLDER_HEIGHT,
                  backgroundColor: IMAGE_CANVAS_BG,
                }}
              >
                <AppIcon name="image-outline" size={36} color={APP_COLORS.blue} />
              </View>
            )}

            {hasText ? (
              <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 }}>
                {banner.title ? (
                  <Text
                    numberOfLines={2}
                    style={{
                      fontFamily: APP_FONT.bold,
                      fontSize: 15,
                      lineHeight: 21,
                      color: APP_COLORS.textPrimary,
                    }}
                  >
                    {banner.title}
                  </Text>
                ) : null}
                {banner.description ? (
                  <Text
                    numberOfLines={2}
                    style={{
                      marginTop: banner.title ? 4 : 0,
                      fontFamily: APP_FONT.regular,
                      fontSize: 13,
                      lineHeight: 19,
                      color: APP_COLORS.textSecondary,
                    }}
                  >
                    {banner.description}
                  </Text>
                ) : null}
                {hasLink ? (
                  <View className="mt-2.5 flex-row items-center">
                    <Text
                      style={{
                        fontFamily: APP_FONT.medium,
                        fontSize: 12,
                        color: APP_COLORS.blue,
                      }}
                    >
                      자세히 보기
                    </Text>
                    <AppIcon name="chevron-right" size={16} color={APP_COLORS.blue} />
                  </View>
                ) : null}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
