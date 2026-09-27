import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, View } from 'react-native';
import { useThemedColors } from '@/hooks/useThemedColors';
import type { HomeBanner } from '@/types/homeDashboard';
import {
  resolveBannerImageUrl,
  resolveBannerPosterUrl,
  resolveBannerVideoUrl,
  resolveHomeBannerMediaType,
} from '@/utils/homeBannerMedia';

type HomeEventBannerMediaProps = {
  banner: HomeBanner;
  width: number;
  height: number;
  /** 현재 캐러셀에 보이는 슬라이드 */
  isActiveSlide: boolean;
  /** 인접 슬라이드까지 미디어 로드 (±1) */
  shouldLoadMedia: boolean;
};

function BannerVideoLayer({
  videoUrl,
  posterUrl,
  width,
  height,
  shouldPlay,
}: {
  videoUrl: string;
  posterUrl: string | null;
  width: number;
  height: number;
  shouldPlay: boolean;
}) {
  const { colors } = useThemedColors();
  const [ready, setReady] = useState(false);

  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.audioMixingMode = 'mixWithOthers';
  });

  useEffect(() => {
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay, player]);

  return (
    <View style={{ width, height, backgroundColor: colors.surfaceElevated }}>
      {posterUrl && !ready ? (
        <Image
          source={{ uri: posterUrl }}
          style={{ position: 'absolute', width, height }}
          resizeMode="cover"
        />
      ) : null}
      {!ready ? (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator color={colors.blue} size="small" />
        </View>
      ) : null}
      <VideoView
        player={player}
        style={{ width, height }}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
        allowsFullscreen={false}
        onFirstFrameRender={() => setReady(true)}
      />
    </View>
  );
}

function BannerImageLayer({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) {
  const { colors } = useThemedColors();
  const [ready, setReady] = useState(false);

  return (
    <View style={{ width, height, backgroundColor: colors.surfaceElevated }}>
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        onLoad={() => setReady(true)}
        onError={() => setReady(true)}
      />
      {!ready ? (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator color={colors.blue} size="small" />
        </View>
      ) : null}
    </View>
  );
}

function BannerWebVideoLayer({
  videoUrl,
  posterUrl,
  width,
  height,
  shouldPlay,
}: {
  videoUrl: string;
  posterUrl: string | null;
  width: number;
  height: number;
  shouldPlay: boolean;
}) {
  const { colors } = useThemedColors();

  return (
    <View style={{ width, height, backgroundColor: colors.surfaceElevated, overflow: 'hidden' }}>
      {/* @ts-expect-error web video element */}
      <video
        src={videoUrl}
        poster={posterUrl ?? undefined}
        muted
        loop
        playsInline
        autoPlay={shouldPlay}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </View>
  );
}

export function HomeEventBannerMedia({
  banner,
  width,
  height,
  isActiveSlide,
  shouldLoadMedia,
}: HomeEventBannerMediaProps) {
  const mediaType = resolveHomeBannerMediaType(banner);
  const posterUrl = resolveBannerPosterUrl(banner);
  const imageUrl = resolveBannerImageUrl(banner);
  const videoUrl = resolveBannerVideoUrl(banner);
  const shouldPlay = isActiveSlide && shouldLoadMedia;

  if (!shouldLoadMedia) {
    if (posterUrl || imageUrl) {
      return <BannerImageLayer uri={posterUrl ?? imageUrl!} width={width} height={height} />;
    }
    return <View style={{ width, height }} />;
  }

  if (mediaType === 'video' && videoUrl) {
    if (Platform.OS === 'web') {
      return (
        <BannerWebVideoLayer
          videoUrl={videoUrl}
          posterUrl={posterUrl}
          width={width}
          height={height}
          shouldPlay={shouldPlay}
        />
      );
    }
    return (
      <BannerVideoLayer
        videoUrl={videoUrl}
        posterUrl={posterUrl}
        width={width}
        height={height}
        shouldPlay={shouldPlay}
      />
    );
  }

  if (imageUrl) {
    return <BannerImageLayer uri={imageUrl} width={width} height={height} />;
  }

  return <View style={{ width, height }} />;
}
