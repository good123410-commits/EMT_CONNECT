import { useEffect, useState } from 'react';
import { useAppHeaderContext } from '@/contexts/AppHeaderContext';
import { useRootRoute, useShowAppNavigationHeader } from '@/hooks/useRootRoute';
import { navigationRef } from '@/navigation/navigationRef';
import { resolveNavigationHeaderMeta } from '@/utils/navigationTitle';

export function useAppNavigationHeaderState() {
  const { override } = useAppHeaderContext();
  const rootRoute = useRootRoute();
  const visible = useShowAppNavigationHeader();
  const [meta, setMeta] = useState(() => resolveNavigationHeaderMeta(override?.title));

  useEffect(() => {
    const sync = () => {
      setMeta(resolveNavigationHeaderMeta(override?.title));
    };

    sync();
    const unsubscribe = navigationRef.addListener('state', sync);
    return unsubscribe;
  }, [override?.title, rootRoute]);

  if (override?.hidden) {
    return {
      visible: false,
      title: '',
      canGoBack: false,
      showBack: false,
      onBack: undefined,
    };
  }

  return {
    visible,
    title: override?.title ?? meta.title,
    canGoBack: override?.showBack ?? meta.canGoBack,
    showBack: override?.showBack ?? meta.canGoBack,
    onBack: override?.onBack,
  };
}
