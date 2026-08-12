import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  type ImageLoadEvent,
  Pressable,
  Text,
  View,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_FONT, APP_RADIUS, APP_SHADOW } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import type { HomeBanner } from '@/types/homeDashboard';

type HomeEventBannerListProps = {
  banners: HomeBanner[];
};

const BANNER_GAP = 16;
const DEFAULT_ASPECT_RATIO = 16 / 9;
const PLACEHOLDER_HEIGHT = 180;
const MAX_IMAGE_HEIGHT = 280;
const MIN_IMAGE_HEIGHT = 140;

function clampContainerHeight(width: number, aspectRatio: number): number {
  if (width <= 0) return MIN_IMAGE_HEIGHT;
  const naturalHeight = width / aspectRatio;
  return Math.min(MAX_IMAGE_HEIGHT, Math.max(MIN_IMAGE_HEIGHT, naturalHeight));
}

function BannerImage({ uri, width }: { uri: string; width: number }) {
  const { colors } = useThemedColors();
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [imageReady, setImageReady] = useState(false);
  const canvasBg = colors.surfaceElevated;

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
          backgroundColor: canvasBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.blue} size="small" />
      </View>
    );
  }

  return (
    <View
      style={{
        width: '100%',
        height: containerHeight,
        backgroundColor: canvasBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!imageReady ? (
        <ActivityIndicator
          color={colors.blue}
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

function HomeEventBannerCard({ banner }: { banner: HomeBanner }) {
  const { colors } = useThemedColors();
  const [cardWidth, setCardWidth] = useState(0);
  const hasText = Boolean(banner.title.trim() || banner.description.trim());
  const hasLink = Boolean(banner.linkUrl.trim());

  const openBanner = () => {
    const url = banner.linkUrl.trim();
    if (!url) return;
    void openBannerLink(url);
  };

  return (
    <Pressable
      className="active:opacity-95 bg-kemix-surface"
      style={{
        width: '100%',
        borderRadius: APP_RADIUS.card,
        ...APP_SHADOW.cardSoft,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);
        if (nextWidth > 0 && nextWidth !== cardWidth) {
          setCardWidth(nextWidth);
        }
      }}
      onPress={openBanner}
      disabled={!hasLink}
    >
      {banner.imageUrl ? (
        <BannerImage uri={banner.imageUrl} width={cardWidth} />
      ) : (
        <View
          className="items-center justify-center bg-kemix-surface-elevated"
          style={{
            width: '100%',
            height: PLACEHOLDER_HEIGHT,
          }}
        >
          <AppIcon name="image-outline" size={36} color={colors.blue} />
        </View>
      )}

      {hasText ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 }}>
          {banner.title ? (
            <Text
              numberOfLines={2}
              className="text-kemix-text"
              style={{
                fontFamily: APP_FONT.bold,
                fontSize: 15,
                lineHeight: 21,
              }}
            >
              {banner.title}
            </Text>
          ) : null}
          {banner.description ? (
            <Text
              numberOfLines={2}
              className="text-kemix-text-secondary"
              style={{
                marginTop: banner.title ? 4 : 0,
                fontFamily: APP_FONT.regular,
                fontSize: 13,
                lineHeight: 19,
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
                  color: colors.blue,
                }}
              >
                자세히 보기
              </Text>
              <AppIcon name="chevron-right" size={16} color={colors.blue} />
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export function HomeEventBannerList({ banners }: HomeEventBannerListProps) {
  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: BANNER_GAP }}>
      {banners.map((banner) => (
        <HomeEventBannerCard key={banner.id} banner={banner} />
      ))}
    </View>
  );
}
