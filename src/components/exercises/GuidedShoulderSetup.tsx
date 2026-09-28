import { parseYouTubeId } from '../../utils/youtube';
/** Explicit local programme editing; never supplies a default clinical dose. */
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText, BigButton, Card } from '../ui';
import { colors, spacing } from '../../theme';
import {
  GUIDED_SHOULDER,
  GUIDED_SHOULDER_REVISION,
} from '../../services/care/guidedShoulder';
import type { ExercisePlan, PrescribedExercise } from '../../services/pose/exercisePlan';
const integer = (text: string) =>
  /^\d+$/.test(text.trim()) && Number.isSafeInteger(Number(text)) && Number(text) > 0
    ? Number(text)
    : undefined;
export default function GuidedShoulderSetup({
  plan,
  onChange,
}: {
  plan: ExercisePlan;
  onChange: (plan: ExercisePlan) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [hold, setHold] = useState('');
  const [video, setVideo] = useState('');
  if (plan.joint !== 'shoulder' || plan.episode?.pathway !== 'frozen_shoulder')
    return null;
  const choose = (id: string) => {
    const item = plan.routine?.find((x) => x.exerciseId === id);
    setSelected(id);
    setVideo(plan.videos?.[id] ?? '');
    setMinimum(String(item?.reps ?? item?.repRange?.min ?? ''));
    setMaximum(item?.repRange ? String(item.repRange.max) : '');
    setHold(item?.holdSeconds === undefined ? '' : String(item.holdSeconds));
  };
  const min = integer(minimum),
    max = maximum.trim() ? integer(maximum) : undefined;
  const seconds = hold.trim() ? Number(hold) : undefined;
  const valid = Boolean(
    selected &&
      (!video.trim() || parseYouTubeId(video.trim())) &&
      min &&
      (!maximum.trim() || (max && max >= min)) &&
      (seconds === undefined || (Number.isFinite(seconds) && seconds > 0))
  );
  const existing = plan.routine?.some((x) => x.exerciseId === selected);
  const apply = () => {
    if (!valid || !selected || !min) return;
    const previous = plan.routine?.find((x) => x.exerciseId === selected);
    const item: PrescribedExercise = {
      ...previous,
      exerciseId: selected,
      instructionRevision: GUIDED_SHOULDER_REVISION,
      reps: max === undefined ? min : undefined,
      repRange: max === undefined ? undefined : { min, max },
      holdSeconds: seconds,
    };
    onChange({
      ...plan,
      videos: { ...(plan.videos ?? {}), [selected]: video.trim() },
      routine: existing
        ? plan.routine!.map((x) => (x.exerciseId === selected ? item : x))
        : [...(plan.routine ?? []), item],
    });
  };
  return (
    <Card style={styles.card} testID="guided-shoulder-setup">
      <AppText variant="heading">Lying shoulder movements</AppText>
      <AppText variant="body">
        Use only movements and amounts in the programme you were given. These are guided
        activities, not camera measurements.
      </AppText>
      {Object.values(GUIDED_SHOULDER).map((x) => (
        <BigButton
          key={x.id}
          label={x.name}
          variant={selected === x.id ? 'secondary' : 'ghost'}
          compact
          onPress={() => choose(x.id)}
          testID={`choose-${x.id}`}
        />
      ))}
      {selected ? (
        <>
          <AppText variant="bodyStrong">Enter the prescribed amount</AppText>
          <View style={styles.row}>
            <View style={styles.field}>
              <AppText variant="label">Repetitions</AppText>
              <TextInput
                style={styles.input}
                value={minimum}
                onChangeText={setMinimum}
                keyboardType="number-pad"
                accessibilityLabel="Repetitions"
                testID="guided-dose-min"
              />
            </View>
            <View style={styles.field}>
              <AppText variant="label">Up to (optional)</AppText>
              <TextInput
                style={styles.input}
                value={maximum}
                onChangeText={setMaximum}
                keyboardType="number-pad"
                accessibilityLabel="Maximum repetitions, optional"
                testID="guided-dose-max"
              />
            </View>
          </View>
          <AppText variant="label">
            Hold per repetition, seconds (only if prescribed)
          </AppText>
          <TextInput
            style={styles.input}
            value={hold}
            onChangeText={setHold}
            keyboardType="decimal-pad"
            accessibilityLabel="Hold seconds per repetition, optional"
            testID="guided-dose-hold"
          />
          <AppText variant="label">Reference video link (optional)</AppText>
          <TextInput
            style={styles.input}
            value={video}
            onChangeText={setVideo}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            accessibilityLabel="Reference video link, optional"
            testID="guided-video-url"
          />
          {video.trim() && !parseYouTubeId(video.trim()) ? (
            <AppText variant="body">
              Enter a supported YouTube link or leave this blank.
            </AppText>
          ) : null}
          <AppText variant="body">
            No dose is filled in automatically. After applying, check and confirm the
            programme above.
          </AppText>
          <BigButton
            label={existing ? 'Update this amount' : 'Add to programme'}
            disabled={!valid}
            onPress={apply}
            testID="guided-dose-apply"
          />
          {existing ? (
            <BigButton
              label="Remove this movement"
              variant="secondary"
              onPress={() =>
                onChange({
                  ...plan,
                  routine: plan.routine?.filter((x) => x.exerciseId !== selected),
                })
              }
              testID="guided-dose-remove"
            />
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  field: { flexGrow: 1, minWidth: 100 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: colors.text,
  },
});
