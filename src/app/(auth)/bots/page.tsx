import {
  createBotAction,
  deleteBotAction,
  getBotsAdminData,
  setBotSystemEnabledAction,
  updateBotProfileAction,
} from '@/app/actions/bots';
import { isBotOwner } from '@/bots/lib/owner';
import AddBotForm from '@/bots/components/AddBotForm';
import BotScheduleGrid from '@/bots/components/BotScheduleGrid';
import Button from '@/ui/components/Button';
import Input from '@/ui/components/Input';
import { notFound } from 'next/navigation';
import styles from './page.module.css';

interface PageProps {
  searchParams?: Promise<{
    month?: string;
    kind?: string;
    notice?: string;
  }>;
}

export default async function OwnerBotsPage({ searchParams }: PageProps) {
  const owner = await isBotOwner();
  if (!owner) {
    notFound();
  }

  const params = searchParams ? await searchParams : undefined;
  const selectedMonth = params?.month;
  const notice = params?.notice?.trim() ?? '';
  const noticeKind = params?.kind === 'error' ? 'error' : 'success';

  const data = await getBotsAdminData(selectedMonth);
  const totalBots = data.entries.length;
  const activeBots = data.entries.filter((entry) => entry.profile.isActive).length;
  const totalScheduledDays = data.entries.reduce(
    (sum, entry) => sum + entry.scheduledDates.length,
    0,
  );
  const avgDifficulty =
    totalBots === 0
      ? 0
      : Math.round(
          data.entries.reduce((sum, entry) => sum + entry.profile.difficultyPct, 0) /
            totalBots,
        );
  const monthPlayedTotal = data.entries.reduce(
    (sum, entry) => sum + (entry.monthGamesPlayed ?? 0),
    0,
  );

  return (
    <section className={styles.container}>
      <h1 className={styles.title}>Bot Control Panel</h1>
      <p className={styles.subtitle}>
        Owner-only controls for bot difficulty, activity budgets, and simulated
        play schedule.
      </p>

      {notice ? (
        <p
          className={
            noticeKind === 'error' ? styles.noticeError : styles.noticeSuccess
          }
        >
          {notice}
        </p>
      ) : null}

      <section className={styles.overallStats}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Total bots</p>
          <p className={styles.statValue}>{totalBots}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Active bots</p>
          <p className={styles.statValue}>{activeBots}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Avg difficulty</p>
          <p className={styles.statValue}>{avgDifficulty}%</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Scheduled days</p>
          <p className={styles.statValue}>{totalScheduledDays}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Month plays</p>
          <p className={styles.statValue}>{monthPlayedTotal}</p>
        </article>
      </section>

      <form method='GET' className={styles.monthForm}>
        <label htmlFor='month' className={styles.label}>
          Preview month
        </label>
        <Input id='month' name='month' type='month' defaultValue={data.monthKey} />
        <Button type='submit'>Load</Button>
      </form>

      <section className={styles.controlsSection}>
        <form action={setBotSystemEnabledAction} className={styles.toggleForm}>
          <label className={styles.checkboxLabel}>
            <input
              type='checkbox'
              name='systemEnabled'
              defaultChecked={data.systemEnabled}
            />
            Bot system enabled
          </label>
          <Button type='submit' variant='ok'>
            Save system toggle
          </Button>
        </form>

        <AddBotForm action={createBotAction} />
      </section>

      <div className={styles.list}>
        {data.entries.map((entry) => {
          const bot = entry.profile;

          return (
            <article key={bot.uid} className={styles.card}>
              <div className={styles.headerRow}>
                <h2 className={styles.botName}>{bot.displayName}</h2>
                <span className={styles.botMeta}>{bot.uid}</span>
              </div>

              <div className={styles.statsGrid}>
                <p>
                  <strong>Persona:</strong> {bot.persona}
                </p>
                <p>
                  <strong>Month budget:</strong>{' '}
                  {entry.monthBudgetAllocated ?? 'not started'}
                </p>
                <p>
                  <strong>Played:</strong>{' '}
                  {entry.monthGamesPlayed ?? 'not started'}
                </p>
                <p>
                  <strong>Remaining:</strong>{' '}
                  {entry.monthRemaining ?? 'not started'}
                </p>
              </div>

              <form action={updateBotProfileAction} className={styles.editForm}>
                <input type='hidden' name='botId' value={bot.uid} />

                <label className={styles.label}>
                  Display name
                  <Input name='displayName' defaultValue={bot.displayName} required />
                </label>

                <div className={styles.inlineFields}>
                  <label className={styles.label}>
                    Difficulty %
                    <Input
                      type='number'
                      name='difficultyPct'
                      min={0}
                      max={100}
                      defaultValue={bot.difficultyPct}
                      required
                    />
                  </label>

                  <label className={styles.label}>
                    Budget min
                    <Input
                      type='number'
                      name='budgetMin'
                      min={0}
                      defaultValue={bot.budgetMin}
                      required
                    />
                  </label>

                  <label className={styles.label}>
                    Budget max
                    <Input
                      type='number'
                      name='budgetMax'
                      min={0}
                      defaultValue={bot.budgetMax}
                      required
                    />
                  </label>

                  <label className={styles.label}>
                    Streak cap
                    <Input
                      type='number'
                      name='streakCap'
                      min={1}
                      defaultValue={bot.streakCap}
                      required
                    />
                  </label>
                </div>

                <label className={styles.checkboxLabel}>
                  <input type='checkbox' name='isActive' defaultChecked={bot.isActive} />
                  Active
                </label>

                <Button type='submit' variant='ok'>
                  Save bot settings
                </Button>
              </form>

              <form action={deleteBotAction} className={styles.deleteForm}>
                <input type='hidden' name='botId' value={bot.uid} />
                <input type='hidden' name='monthKey' value={data.monthKey} />
                <label className={styles.label}>
                  Type DELETE to confirm
                  <Input name='confirmDelete' placeholder='DELETE' required />
                </label>
                <Button type='submit' variant='danger'>
                  Remove bot
                </Button>
              </form>

              <div>
                <BotScheduleGrid
                  monthKey={data.monthKey}
                  scheduledDates={entry.scheduledDates}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
