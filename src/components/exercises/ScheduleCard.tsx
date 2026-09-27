/**
 * Physio set-up: when the day's exercises happen. Either the plain "times a
 * day" routine, or mini-sessions spread through the day: a gap between them
 * and the waking window.
 *
 * The fields start empty: the app never suggests an interval or a window
 * (those are clinical decisions). What's entered is saved as a draft, and the
 * patient is offered nothing until every required field is valid.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Banner, BigButton, Card, ListRow } from '../ui';
import { colors, radii, spacing } from '../../theme';
import type { ExercisePlan } from '../../services/pose/exercisePlan';
import { ScheduleDraft, scheduleProblems } from '../../services/pose/schedule';

const numberOf = (text: string): number | undefined => {
  const t = text.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboard?: 'numeric' | 'default';
  testID: string;
}> = ({ label, value, onChange, placeholder, keyboard = 'default', testID }) => (
  <View style={styles.field}>
    <AppText variant="bodyStrong" style={styles.flex}>
      {label}
    </AppText>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      keyboardType={keyboard === 'numeric' ? 'decimal-pad' : 'default'}
      accessibilityLabel={label}
      style={styles.input}
      testID={testID}
    />
  </View>
);

export const ScheduleCard: React.FC<{
  plan: ExercisePlan;
  onChange: (plan: ExercisePlan) => void;
}> = ({ plan, onChange }) => {
  const schedule = plan.schedule;
  const [minH, setMinH] = useState('');
  const [maxH, setMaxH] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  // Show what is saved (empty where nothing was entered)
  useEffect(() => {
    setMinH(schedule?.minHours !== undefined ? String(schedule.minHours) : '');
    setMaxH(schedule?.maxHours !== undefined ? String(schedule.maxHours) : '');
    setStart(schedule?.window?.start ?? '');
    setEnd(schedule?.window?.end ?? '');
  }, [schedule]);

  const draft: ScheduleDraft = {
    kind: 'interval',
    minHours: numberOf(minH),
    maxHours: numberOf(maxH),
    window: { start: start.trim() || undefined, end: end.trim() || undefined },
  };
  const problems = schedule ? scheduleProblems(schedule) : [];

  return (
    <Card style={styles.card} testID="schedule-card">
      <ListRow
        icon="schedule"
        title="Mini-sessions through the day"
        description="Short rounds of all the exercises, a set time apart, only while awake"
        toggle={{
          value: schedule !== undefined,
          // On: an empty draft (nothing offered until completed). Off: times a day
          onChange: (on) =>
            onChange({ ...plan, schedule: on ? { kind: 'interval' } : undefined }),
          testID: 'schedule-toggle',
        }}
        last={schedule === undefined}
      />
      {schedule ? (
        <View style={styles.body}>
          <Field
            label="Hours between mini-sessions"
            value={minH}
            onChange={setMinH}
            placeholder="hours"
            keyboard="numeric"
            testID="schedule-min-hours"
          />
          <Field
            label="Up to (optional)"
            value={maxH}
            onChange={setMaxH}
            placeholder="hours"
            keyboard="numeric"
            testID="schedule-max-hours"
          />
          <Field
            label="Day starts"
            value={start}
            onChange={setStart}
            placeholder="HH:MM"
            testID="schedule-window-start"
          />
          <Field
            label="Day ends"
            value={end}
            onChange={setEnd}
            placeholder="HH:MM"
            testID="schedule-window-end"
          />
          <BigButton
            variant="secondary"
            compact
            icon="save"
            label="Save timing"
            onPress={() => onChange({ ...plan, schedule: draft })}
            testID="schedule-save"
          />
          {problems.length ? (
            <Banner
              tone="warning"
              message={`Not complete, so the patient is offered nothing yet. ${problems.join(' ')}`}
              testID="schedule-problems"
            />
          ) : (
            <Banner
              tone="success"
              message="Timing complete. Confirm the programme to apply it."
              testID="schedule-complete"
            />
          )}
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { paddingVertical: 0, gap: 0 },
  body: { gap: spacing.sm, paddingBottom: spacing.md },
  flex: { flex: 1 },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    minWidth: 96,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
  },
});

export default ScheduleCard;
