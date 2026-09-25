/**
 * "My plan": the joint we're working on (and which side), plus the standard the
 * physiotherapist set: a goal range, an optional "don't go past" limit, and
 * repetitions. Large tiles and +/- steppers, no typing.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, BigButton, Card, ListRow, SectionTitle } from '../ui';
import { SegmentedControl } from '../ui/SegmentedControl';
import { colors, radii, spacing } from '../../theme';
import {
  BodySide,
  ExercisePlan,
  JOINT_KINDS,
  JointKind,
  hasExtendedSupport,
} from '../../services/pose/exercisePlan';

const JOINT_ICONS: Record<JointKind, string> = {
  shoulder: 'accessibility-new',
  elbow: 'fitness-center',
  hip: 'airline-seat-recline-normal',
  knee: 'directions-walk',
};

/** Sensible starting goals (clinical degrees) when the physio adds one. */
const DEFAULT_GOAL: Record<JointKind, number> = {
  shoulder: 120,
  elbow: 120,
  hip: 90,
  knee: 90,
};

const Stepper: React.FC<{
  label: string;
  value: number;
  unit: string;
  step: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  testID: string;
}> = ({ label, value, unit, step, min, max, onChange, testID }) => (
  <View style={styles.stepper} testID={testID}>
    <AppText variant="bodyStrong" style={styles.flex}>
      {label}
    </AppText>
    <Pressable
      onPress={() => onChange(Math.max(min, value - step))}
      accessibilityRole="button"
      accessibilityLabel={`Less, ${label}`}
      testID={`${testID}-minus`}
      style={({ pressed }) => [styles.stepButton, pressed && styles.stepPressed]}
    >
      <Icon name="remove" size={28} color={colors.primary} />
    </Pressable>
    <AppText
      variant="heading"
      style={styles.stepValue}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${label}: ${value} ${unit}`}
    >
      {`${value}${unit === 'degrees' ? '°' : ''}`}
    </AppText>
    <Pressable
      onPress={() => onChange(Math.min(max, value + step))}
      accessibilityRole="button"
      accessibilityLabel={`More, ${label}`}
      testID={`${testID}-plus`}
      style={({ pressed }) => [styles.stepButton, pressed && styles.stepPressed]}
    >
      <Icon name="add" size={28} color={colors.primary} />
    </Pressable>
  </View>
);

export interface PlanEditorProps {
  value?: ExercisePlan | null;
  onSave: (plan: ExercisePlan) => void;
  onCancel?: () => void;
}

const PlanEditor: React.FC<PlanEditorProps> = ({ value, onSave, onCancel }) => {
  const [joint, setJoint] = useState<JointKind | undefined>(value?.joint);
  const [side, setSide] = useState<BodySide>(value?.side ?? 'left');
  const [goal, setGoal] = useState<number | undefined>(value?.goalDegrees);
  const [limit, setLimit] = useState<number | undefined>(value?.limitDegrees);
  const [reps, setReps] = useState<number | undefined>(value?.reps);

  const chooseJoint = (kind: JointKind) => {
    setJoint(kind);
    if (kind !== joint) {
      // Goals are joint-specific
      setGoal(undefined);
      setLimit(undefined);
    }
  };

  return (
    <View style={styles.editor} testID="plan-editor">
      <AppText variant="heading" accessibilityRole="header">
        Which joint are we working on?
      </AppText>
      <View style={styles.grid} accessibilityRole="radiogroup">
        {JOINT_KINDS.map((j) => {
          const selected = j.kind === joint;
          return (
            <Pressable
              key={j.kind}
              onPress={() => chooseJoint(j.kind)}
              testID={`plan-joint-${j.kind}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${j.label}. ${j.movement}${
                hasExtendedSupport(j.kind) ? '. Full movement guidance' : ''
              }`}
              style={({ pressed }) => [
                styles.tile,
                selected && styles.tileSelected,
                pressed && !selected && styles.tilePressed,
              ]}
            >
              <Icon
                name={JOINT_ICONS[j.kind]}
                size={36}
                color={selected ? colors.onPrimary : colors.primary}
              />
              <AppText
                variant="bodyStrong"
                color={selected ? colors.onPrimary : colors.text}
              >
                {j.label}
              </AppText>
              {selected ? (
                <Icon
                  name="check-circle"
                  size={22}
                  color={colors.onPrimary}
                  style={styles.tick}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <SegmentedControl<BodySide>
        options={[
          { value: 'left', label: 'Left side', testID: 'plan-side-left' },
          { value: 'right', label: 'Right side', testID: 'plan-side-right' },
        ]}
        value={side}
        onChange={setSide}
        accessibilityLabel="Side"
        testID="plan-side"
      />

      {joint ? (
        <>
          <SectionTitle>FROM YOUR PHYSIOTHERAPIST (OPTIONAL)</SectionTitle>
          <Card style={styles.card}>
            <ListRow
              icon="flag"
              title="Goal to reach"
              description="How far your physio wants you to move"
              toggle={{
                value: goal !== undefined,
                onChange: (on) => setGoal(on ? DEFAULT_GOAL[joint] : undefined),
                testID: 'plan-goal-toggle',
              }}
              last={goal === undefined}
            />
            {goal !== undefined ? (
              <Stepper
                label="Goal"
                value={goal}
                unit="degrees"
                step={5}
                min={10}
                max={180}
                onChange={(v) => {
                  setGoal(v);
                  if (limit !== undefined && limit < v) setLimit(v);
                }}
                testID="plan-goal"
              />
            ) : null}
          </Card>
          <Card style={styles.card}>
            <ListRow
              icon="do-not-disturb-on"
              title="Don't go past"
              description="A safe limit, for example after surgery"
              toggle={{
                value: limit !== undefined,
                onChange: (on) =>
                  setLimit(
                    on ? Math.max(goal ?? DEFAULT_GOAL[joint], 30) + 10 : undefined
                  ),
                testID: 'plan-limit-toggle',
              }}
              last={limit === undefined}
            />
            {limit !== undefined ? (
              <Stepper
                label="Limit"
                value={limit}
                unit="degrees"
                step={5}
                min={Math.max(15, goal ?? 15)}
                max={180}
                onChange={setLimit}
                testID="plan-limit"
              />
            ) : null}
          </Card>
          <Card style={styles.card}>
            <ListRow
              icon="repeat"
              title="Repetitions"
              description="How many times, each session"
              toggle={{
                value: reps !== undefined,
                onChange: (on) => setReps(on ? 10 : undefined),
                testID: 'plan-reps-toggle',
              }}
              last={reps === undefined}
            />
            {reps !== undefined ? (
              <Stepper
                label="Repetitions"
                value={reps}
                unit="times"
                step={1}
                min={1}
                max={50}
                onChange={setReps}
                testID="plan-reps"
              />
            ) : null}
          </Card>
        </>
      ) : null}

      <BigButton
        label="Save my plan"
        icon="check"
        disabled={!joint}
        onPress={() =>
          joint && onSave({ joint, side, goalDegrees: goal, limitDegrees: limit, reps })
        }
        testID="plan-save"
      />
      {onCancel ? (
        <BigButton
          variant="ghost"
          label="Cancel"
          onPress={onCancel}
          testID="plan-cancel"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  editor: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexBasis: '46%',
    flexGrow: 1,
    minHeight: 112,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  tileSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  tilePressed: { backgroundColor: colors.primarySoft },
  tick: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  badge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.successSoft,
  },
  badgeSelected: { backgroundColor: colors.onPrimary },
  card: { paddingVertical: 0, gap: 0 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  stepButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPressed: { backgroundColor: colors.surfaceMuted },
  stepValue: { minWidth: 64, textAlign: 'center' },
});

export default PlanEditor;
