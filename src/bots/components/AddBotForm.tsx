'use client';

import Button from '@/ui/components/Button';
import Input from '@/ui/components/Input';
import type { BotPersona } from '@/bots/types';
import { useState } from 'react';
import styles from './AddBotForm.module.css';
import Select, { SelectOption } from '@/ui/components/Select';

type CreateBotAction = (formData: FormData) => void | Promise<void>;

interface AddBotFormProps {
  action: CreateBotAction;
}

interface AddBotFormState {
  displayName: string;
  persona: BotPersona;
  difficultyPct: number;
  streakCap: number;
  budgetMin: number;
  budgetMax: number;
}

const DEFAULT_STATE: AddBotFormState = {
  displayName: '',
  persona: 'regular',
  difficultyPct: 35,
  streakCap: 7,
  budgetMin: 12,
  budgetMax: 20,
};

const NAME_PREFIXES = [
  'Swift',
  'Calm',
  'Bright',
  'Quiet',
  'Silver',
  'Neon',
  'Mellow',
  'Lucky',
];

const NAME_SUFFIXES = [
  'Grid',
  'Cipher',
  'Nova',
  'Logic',
  'Matrix',
  'Rune',
  'Pilot',
  'Orbit',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function randomPersona(): BotPersona {
  const personas: BotPersona[] = ['casual', 'regular', 'committed-light'];
  return pickRandom(personas);
}

function randomState(): AddBotFormState {
  const persona = randomPersona();

  const personaDefaults: Record<
    BotPersona,
    Pick<
      AddBotFormState,
      'difficultyPct' | 'streakCap' | 'budgetMin' | 'budgetMax'
    >
  > = {
    casual: {
      difficultyPct: randomInt(18, 32),
      streakCap: randomInt(3, 6),
      budgetMin: randomInt(8, 14),
      budgetMax: randomInt(15, 21),
    },
    regular: {
      difficultyPct: randomInt(30, 48),
      streakCap: randomInt(5, 9),
      budgetMin: randomInt(12, 18),
      budgetMax: randomInt(19, 25),
    },
    'committed-light': {
      difficultyPct: randomInt(42, 60),
      streakCap: randomInt(8, 13),
      budgetMin: randomInt(16, 22),
      budgetMax: randomInt(23, 28),
    },
  };

  const defaults = personaDefaults[persona];
  const budgetMin = Math.max(0, defaults.budgetMin);
  const budgetMax = Math.max(budgetMin, defaults.budgetMax);

  return {
    displayName: `${pickRandom(NAME_PREFIXES)}${pickRandom(NAME_SUFFIXES)}${randomInt(10, 99)}`,
    persona,
    difficultyPct: defaults.difficultyPct,
    streakCap: defaults.streakCap,
    budgetMin,
    budgetMax,
  };
}

export default function AddBotForm({ action }: AddBotFormProps) {
  const [state, setState] = useState<AddBotFormState>(DEFAULT_STATE);

  return (
    <form action={action} className={styles.createForm}>
      <h2 className={styles.sectionTitle}>Add bot</h2>

      <div className={styles.inlineFields}>
        <label className={styles.label}>
          Username
          <Input
            name='displayName'
            value={state.displayName}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                displayName: event.target.value,
              }))
            }
            required
          />
        </label>

        <label className={styles.label}>
          Persona
          <Select
            name='persona'
            value={state.persona}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                persona: event.target.value as BotPersona,
              }))
            }
            className={styles.select}
          >
            <SelectOption value='casual'>casual</SelectOption>
            <SelectOption value='regular'>regular</SelectOption>
            <SelectOption value='committed-light'>committed-light</SelectOption>
          </Select>
        </label>

        <label className={styles.label}>
          Difficulty %
          <Input
            type='number'
            name='difficultyPct'
            min={0}
            max={100}
            value={state.difficultyPct}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                difficultyPct: Number(event.target.value),
              }))
            }
            required
          />
        </label>

        <label className={styles.label}>
          Streak cap
          <Input
            type='number'
            name='streakCap'
            min={1}
            value={state.streakCap}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                streakCap: Number(event.target.value),
              }))
            }
            required
          />
        </label>
      </div>

      <div className={styles.inlineFields}>
        <label className={styles.label}>
          Budget min
          <Input
            type='number'
            name='budgetMin'
            min={0}
            value={state.budgetMin}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                budgetMin: Number(event.target.value),
              }))
            }
            required
          />
        </label>

        <label className={styles.label}>
          Budget max
          <Input
            type='number'
            name='budgetMax'
            min={0}
            value={state.budgetMax}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                budgetMax: Number(event.target.value),
              }))
            }
            required
          />
        </label>
      </div>

      <div className={styles.createActionsRow}>
        <Button type='button' onClick={() => setState(randomState())}>
          Randomize
        </Button>
        <Button type='submit'>Create bot</Button>
      </div>
    </form>
  );
}
