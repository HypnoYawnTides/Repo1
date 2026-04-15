import { useMemo, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  buildAlarmPreview,
  formatMinutes,
  parseTimeValue,
  type DemoSettings,
  type SleepSourceMode,
} from './alarm/flexibleAlarm';

type Screen = 'home' | 'settings' | 'details';

const SLEEP_SOURCE_OPTIONS: Array<{
  value: SleepSourceMode;
  label: string;
  description: string;
}> = [
  {
    value: 'manual',
    label: '手动点击“我要睡了”',
    description: '用户主动确认准备入睡，规则最直接。',
  },
  {
    value: 'screen-off',
    label: '最后停止使用手机时间',
    description: '更轻量，适合不想额外操作的人。',
  },
  {
    value: 'later-of-both',
    label: '两者结合，取更晚值',
    description: '更保守，避免用户点完按钮后仍继续玩手机。',
  },
];

function sleepGoalLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}小时`;
  }

  return `${hours}小时${minutes}分钟`;
}

function toTimeInputValue(totalMinutes: number): string {
  return formatMinutes(totalMinutes);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [flexibleEnabled, setFlexibleEnabled] = useState(true);
  const [settings, setSettings] = useState<DemoSettings>(DEFAULT_SETTINGS);
  const [manualSleepMinutes, setManualSleepMinutes] = useState<number | null>(2 * 60 + 10);
  const [screenOffMinutes, setScreenOffMinutes] = useState(1 * 60 + 40);

  const preview = useMemo(
    () =>
      flexibleEnabled
        ? buildAlarmPreview(settings, manualSleepMinutes, screenOffMinutes)
        : {
            fallbackToBase: true,
            hitLatestLimit: false,
            adjustedAlarmMinutes: settings.baseAlarmMinutes,
            reason: '今晚已关闭弹性闹钟，明早会按基础闹钟响铃。',
            sleepReferenceLabel: manualSleepMinutes === null ? '未记录' : formatMinutes(manualSleepMinutes),
          },
    [flexibleEnabled, manualSleepMinutes, screenOffMinutes, settings],
  );

  const handleSleepNow = () => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    setManualSleepMinutes(minutes);
  };

  const sourceModeLabel =
    SLEEP_SOURCE_OPTIONS.find((option) => option.value === settings.sleepSourceMode)?.label ?? '';

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="topbar">
          <div>
            <h1>{screen === 'settings' ? '设置' : '弹性闹钟'}</h1>
          </div>
          {screen === 'settings' ? (
            <button
              type="button"
              className="icon-button"
              onClick={() => setScreen('home')}
              aria-label="返回"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9 11l-4-4 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 7h10a4 4 0 0 1 0 8H13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="icon-button"
              onClick={() => setScreen('settings')}
              aria-label="打开设置"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 7.25h14M5 12h14M5 16.75h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="9"
                  cy="7.25"
                  r="2.15"
                  fill="#fffdfb"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <circle
                  cx="15"
                  cy="12"
                  r="2.15"
                  fill="#fffdfb"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <circle
                  cx="11"
                  cy="16.75"
                  r="2.15"
                  fill="#fffdfb"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
            </button>
          )}
        </header>

        {screen !== 'settings' && (
          <nav className="tabbar" aria-label="页面切换">
            <button
              type="button"
              className={screen === 'home' ? 'tab active' : 'tab'}
              onClick={() => setScreen('home')}
            >
              今晚
            </button>
            <button
              type="button"
              className={screen === 'details' ? 'tab active' : 'tab'}
              onClick={() => setScreen('details')}
            >
              结果
            </button>
          </nav>
        )}

        {screen === 'home' && (
          <div className="screen">
            <section className="hero-card">
              <p className="card-label">明日预计响铃</p>
              <p className="alarm-time">{formatMinutes(preview.adjustedAlarmMinutes)}</p>
              <div className="meta-row">
                <span>原定 {formatMinutes(settings.baseAlarmMinutes)}</span>
                <span>最晚 {formatMinutes(settings.latestAlarmMinutes)}</span>
              </div>
              <p className="helper-text">{preview.reason}</p>
            </section>

            <section className="panel">
              <div className="panel-row">
                <div>
                  <p className="panel-title">今晚启用弹性闹钟</p>
                  <p className="panel-copy">关闭后，明早将恢复固定闹钟。</p>
                </div>
                <button
                  type="button"
                  className={flexibleEnabled ? 'switch on' : 'switch'}
                  onClick={() => setFlexibleEnabled((current) => !current)}
                  aria-pressed={flexibleEnabled}
                >
                  <span />
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="stack">
                <div className="info-row">
                  <span>参考方式</span>
                  <strong>{sourceModeLabel}</strong>
                </div>
                <div className="info-row">
                  <span>手动入睡时间</span>
                  <strong>{manualSleepMinutes === null ? '未记录' : formatMinutes(manualSleepMinutes)}</strong>
                </div>
                <div className="info-row">
                  <span>停止用手机时间</span>
                  <strong>{formatMinutes(screenOffMinutes)}</strong>
                </div>
              </div>

              <button type="button" className="primary-button" onClick={handleSleepNow}>
                我要睡了
              </button>
            </section>

            <section
              className="panel clickable"
              onClick={() => setScreen('details')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setScreen('details');
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="panel-row">
                <div>
                  <p className="panel-title">查看本次计算依据</p>
                  <p className="panel-copy">原始闹钟、入睡参考时间、顺延结果都在这里。</p>
                </div>
                <span className="chevron">›</span>
              </div>
            </section>
          </div>
        )}

        {screen === 'details' && (
          <div className="screen">
            <section className="detail-card">
              <div className="detail-row">
                <span>原定响铃</span>
                <strong>{formatMinutes(settings.baseAlarmMinutes)}</strong>
              </div>
              <div className="detail-row">
                <span>参考入睡时间</span>
                <strong>{preview.sleepReferenceLabel}</strong>
              </div>
              <div className="detail-row">
                <span>目标睡眠</span>
                <strong>{sleepGoalLabel(settings.sleepGoalMinutes)}</strong>
              </div>
              <div className="detail-row highlight">
                <span>计算后响铃</span>
                <strong>{formatMinutes(preview.adjustedAlarmMinutes)}</strong>
              </div>
              <div className="detail-row">
                <span>最晚上限</span>
                <strong>{formatMinutes(settings.latestAlarmMinutes)}</strong>
              </div>
            </section>

            <section className="panel">
              <p className="panel-title">结果说明</p>
              <p className="panel-copy">{preview.reason}</p>
              <ul className="detail-list">
                <li>{preview.hitLatestLimit ? '本次命中了最晚上限。' : '本次没有触发最晚上限。'}</li>
                <li>{preview.fallbackToBase ? '当前会按基础闹钟响铃。' : '当前会按顺延后的时间响铃。'}</li>
                <li>适用日期：{settings.weekdaysOnly ? '工作日启用' : '每天启用'}</li>
              </ul>
            </section>

            <button type="button" className="secondary-button" onClick={() => setFlexibleEnabled(false)}>
              今晚改回固定闹钟
            </button>
          </div>
        )}

        {screen === 'settings' && (
          <div className="screen">
            <section className="panel form-panel">
              <label className="field">
                <span>基础闹钟</span>
                <input
                  type="time"
                  value={toTimeInputValue(settings.baseAlarmMinutes)}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      baseAlarmMinutes: parseTimeValue(event.target.value),
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>最晚可接受时间</span>
                <input
                  type="time"
                  value={toTimeInputValue(settings.latestAlarmMinutes)}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      latestAlarmMinutes: parseTimeValue(event.target.value),
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>目标睡眠时长</span>
                <select
                  value={settings.sleepGoalMinutes}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      sleepGoalMinutes: Number(event.target.value),
                    }))
                  }
                >
                  <option value={300}>5小时</option>
                  <option value={330}>5小时30分</option>
                  <option value={360}>6小时</option>
                  <option value={390}>6小时30分</option>
                  <option value={420}>7小时</option>
                </select>
              </label>

              <fieldset className="radio-group">
                <legend>入睡参考方式</legend>
                {SLEEP_SOURCE_OPTIONS.map((option) => (
                  <label key={option.value} className="radio-option">
                    <input
                      type="radio"
                      name="sleep-source-mode"
                      checked={settings.sleepSourceMode === option.value}
                      onChange={() =>
                        setSettings((current) => ({
                          ...current,
                          sleepSourceMode: option.value,
                        }))
                      }
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </fieldset>

              <div className="panel-row">
                <div>
                  <p className="panel-title">工作日启用</p>
                  <p className="panel-copy">关闭后，这套规则会对每天都生效。</p>
                </div>
                <button
                  type="button"
                  className={settings.weekdaysOnly ? 'switch on' : 'switch'}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      weekdaysOnly: !current.weekdaysOnly,
                    }))
                  }
                  aria-pressed={settings.weekdaysOnly}
                >
                  <span />
                </button>
              </div>
            </section>

            <section className="panel form-panel">
              <label className="field">
                <span>模拟手动入睡时间</span>
                <input
                  type="time"
                  value={manualSleepMinutes === null ? '02:10' : toTimeInputValue(manualSleepMinutes)}
                  onChange={(event) => setManualSleepMinutes(parseTimeValue(event.target.value))}
                />
              </label>

              <label className="field">
                <span>模拟停止用手机时间</span>
                <input
                  type="time"
                  value={toTimeInputValue(screenOffMinutes)}
                  onChange={(event) => setScreenOffMinutes(parseTimeValue(event.target.value))}
                />
              </label>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
