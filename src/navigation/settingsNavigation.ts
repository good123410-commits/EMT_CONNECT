import { navigationRef } from '@/navigation/navigationRef';

export function navigateToAdminDashboard(): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('AdminDashboard');
}
