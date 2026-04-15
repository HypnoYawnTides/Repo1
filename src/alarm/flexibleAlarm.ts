export type SleepSourceMode = 'manual' | 'screen-off' | 'later-of-both';

export type DemoSettings = {
  baseAlarmMinutes: number;
  latestAlarmMinutes: number;
  sleepGoalMinutes: number;
  sleepSourceMode: SleepSourceMode;
  weekdaysOnly: boolean;
};

export type AlarmPreview = {
  fallbackToBase: boolean;
  hitLatestLimit: boolean;
  adjustedAlarmMinutes: number;
  reason: string;
  sleepReferenceLabel: string;
};

export const DEFAULT_SETTINGS: DemoSettings = {
  baseAlarmMinutes: 7 * 60,
  latestAlarmMinutes: 8 * 60 + 30,
  sleepGoalMinutes: 6 * 60,
  sleepSourceMode: 'later-of-both',
  weekdaysOnly: true,
};

export function formatMinutes(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function parseTimeValue(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function resolveSleepReferenceMinutes(
  manualSleepMinutes: number | null,
  screenOffMinutes: number,
  mode: SleepSourceMode,
): number | null {
  if (mode === 'manual') {
    return manualSleepMinutes;
  }

  if (mode === 'screen-off') {
    return screenOffMinutes;
  }

  if (manualSleepMinutes === null) {
    return screenOffMinutes;
  }

  return Math.max(manualSleepMinutes, screenOffMinutes);
}

export function buildAlarmPreview(
  settings: DemoSettings,
  manualSleepMinutes: number | null,
  screenOffMinutes: number,
): AlarmPreview {
  const sleepReferenceMinutes = resolveSleepReferenceMinutes(
    manualSleepMinutes,
    screenOffMinutes,
    settings.sleepSourceMode,
  );

  if (sleepReferenceMinutes === null) {
    return {
      fallbackToBase: true,
      hitLatestLimit: false,
      adjustedAlarmMinutes: settings.baseAlarmMinutes,
      reason: '还没有记录入睡时间，先按基础闹钟执行。',
      sleepReferenceLabel: '未记录',
    };
  }

  const overnightReference =
    sleepReferenceMinutes >= 12 * 60
      ? sleepReferenceMinutes - 24 * 60
      : sleepReferenceMinutes;
  const recommendedAlarm = overnightReference + settings.sleepGoalMinutes;

  if (recommendedAlarm <= settings.baseAlarmMinutes) {
    return {
      fallbackToBase: true,
      hitLatestLimit: false,
      adjustedAlarmMinutes: settings.baseAlarmMinutes,
      reason: '按基础闹钟起床时，睡眠已达到目标时长，无需顺延。',
      sleepReferenceLabel: formatMinutes(sleepReferenceMinutes),
    };
  }

  if (recommendedAlarm >= settings.latestAlarmMinutes) {
    return {
      fallbackToBase: false,
      hitLatestLimit: true,
      adjustedAlarmMinutes: settings.latestAlarmMinutes,
      reason: '晚睡触发了顺延，但已达到你设定的最晚上限。',
      sleepReferenceLabel: formatMinutes(sleepReferenceMinutes),
    };
  }

  return {
    fallbackToBase: false,
    hitLatestLimit: false,
    adjustedAlarmMinutes: recommendedAlarm,
    reason: '根据你的晚睡时间，闹钟已自动顺延到更合理的起床点。',
    sleepReferenceLabel: formatMinutes(sleepReferenceMinutes),
  };
}
