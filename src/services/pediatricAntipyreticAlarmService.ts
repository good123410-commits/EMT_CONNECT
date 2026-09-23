import {
  cancelScheduledLocalPushNotification,
  ensureNotificationPermissions,
  scheduleLocalPushNotificationAt,
  showLocalPushNotification,
} from '@/services/pushNotificationService';
import {
  ANTIPYRETIC_FAMILY_OPTIONS,
  buildAntipyreticFamilySchedule,
  formatAntipyreticDateTime,
  getFamilyLabel,
  getOtherFamilyLabel,
  getRepresentativeDrugId,
  type AntipyreticDoseHistoryEntry,
  type AntipyreticDrugFamily,
} from '@/utils/pediatricAntipyreticCalc';

const NOTIFICATION_PREFIX = 'antipyretic-family';

function notificationId(kind: 'same' | 'cross' | 'ready', family: AntipyreticDrugFamily): string {
  return `${NOTIFICATION_PREFIX}-${kind}-${family}`;
}

export async function syncAntipyreticDoseNotifications(
  history: AntipyreticDoseHistoryEntry[],
): Promise<void> {
  await ensureNotificationPermissions();

  for (const option of ANTIPYRETIC_FAMILY_OPTIONS) {
    await cancelScheduledLocalPushNotification(notificationId('same', option.id));
    await cancelScheduledLocalPushNotification(notificationId('cross', option.id));
    await cancelScheduledLocalPushNotification(notificationId('ready', option.id));
  }

  for (const option of ANTIPYRETIC_FAMILY_OPTIONS) {
    const schedule = buildAntipyreticFamilySchedule(option.id, history);
    if (!schedule) continue;

    const label = getFamilyLabel(option.id);

    if (schedule.nextSameFamilyAt && schedule.nextSameFamilyAt.getTime() > Date.now()) {
      await scheduleLocalPushNotificationAt(
        schedule.nextSameFamilyAt,
        {
          title: `${label} 복용 가능`,
          body: `동일 계열 다음 복용 가능 시간입니다. (${formatAntipyreticDateTime(schedule.nextSameFamilyAt)})`,
          data: { screen: 'PediatricAntipyreticCalc', family: option.id },
        },
        notificationId('same', option.id),
      );
    }

    if (schedule.nextCrossDoseAt && schedule.nextCrossDoseAt.getTime() > Date.now()) {
      await scheduleLocalPushNotificationAt(
        schedule.nextCrossDoseAt,
        {
          title: `${label} 교차 복용 가능`,
          body: `${getOtherFamilyLabel(option.id)} 투약 후 2시간이 지나 교차 복용이 가능합니다.`,
          data: { screen: 'PediatricAntipyreticCalc', family: option.id },
        },
        notificationId('cross', option.id),
      );
    }

    if (!schedule.canTakeNow) {
      const readyAt = schedule.nextSameFamilyAt && schedule.nextCrossDoseAt
        ? new Date(
            Math.max(schedule.nextSameFamilyAt.getTime(), schedule.nextCrossDoseAt.getTime()),
          )
        : schedule.nextSameFamilyAt ?? schedule.nextCrossDoseAt;

      if (readyAt && readyAt.getTime() > Date.now()) {
        await scheduleLocalPushNotificationAt(
          readyAt,
          {
            title: `${label} 투약 가능`,
            body: '간격 조건이 충족되어 복용을 고려할 수 있습니다. 체중·용량을 다시 확인하세요.',
            data: { screen: 'PediatricAntipyreticCalc', family: option.id },
          },
          notificationId('ready', option.id),
        );
      }
    }
  }
}

export async function notifyAntipyreticDoseRecorded(
  family: AntipyreticDrugFamily,
  takenAt: Date,
): Promise<void> {
  await showLocalPushNotification({
    title: `${getFamilyLabel(family)} 투약 기록됨`,
    body: `${formatAntipyreticDateTime(takenAt)} 투약이 저장되었습니다. 다음 복용 알림을 설정했습니다.`,
    data: { screen: 'PediatricAntipyreticCalc', family },
  });
}

export { getRepresentativeDrugId };
