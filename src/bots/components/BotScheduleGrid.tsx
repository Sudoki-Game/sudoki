import styles from './BotScheduleGrid.module.css';

interface BotScheduleGridProps {
  monthKey: string;
  scheduledDates: string[];
}

interface GridCell {
  dateKey: string | null;
  active: boolean;
}

function buildScheduleGrid(monthKey: string, scheduledDates: string[]): GridCell[] {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;

  const firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const scheduled = new Set(scheduledDates);
  const cells: GridCell[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({ dateKey: null, active: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
    cells.push({
      dateKey,
      active: scheduled.has(dateKey),
    });
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push({ dateKey: null, active: false });
    }
  }

  return cells;
}

function getMonthLabels(monthKey: string): { monthLabel: string; yearLabel: string } {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));

  const monthLabel = date.toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  });

  return {
    monthLabel,
    yearLabel: String(year),
  };
}

function getCellTooltip(dateKey: string | null): string | undefined {
  if (!dateKey) {
    return undefined;
  }

  const [yearPart, monthPart, dayPart] = dateKey.split('-');
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  const day = Number(dayPart);
  const date = new Date(Date.UTC(year, monthIndex, day));

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function BotScheduleGrid({ monthKey, scheduledDates }: BotScheduleGridProps) {
  const cells = buildScheduleGrid(monthKey, scheduledDates);
  const labels = getMonthLabels(monthKey);

  return (
    <div className={styles.container}>
      <p className={styles.title}>Simulated schedule</p>
      <div className={styles.meta}>
        {scheduledDates.length} scheduled day{scheduledDates.length === 1 ? '' : 's'}
      </div>

      <div className={styles.chartWrap}>
        <div className={styles.weekdayRail}>
          <span className={styles.weekday}>Mon</span>
          <span className={styles.weekday}>Wed</span>
          <span className={styles.weekday}>Fri</span>
        </div>

        <div className={styles.grid}>
          {cells.map((cell, index) => (
            <div
              key={`${cell.dateKey ?? 'empty'}-${index}`}
              className={
                cell.dateKey === null
                  ? styles.gridCellEmpty
                  : cell.active
                    ? styles.gridCellActive
                    : styles.gridCellInactive
              }
              title={getCellTooltip(cell.dateKey)}
            />
          ))}
        </div>
      </div>

      <div className={styles.labelsRow}>
        <span>Month: {labels.monthLabel}</span>
        <span>Year: {labels.yearLabel}</span>
      </div>
    </div>
  );
}
