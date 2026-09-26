/**
 * Physio set-up: what is being treated (pathway), the current phase, and
 * confirming the programme for it. Exercises reach the patient only once
 * confirmed; any change to the pathway or phase needs confirming again.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, Banner, BigButton, Card, ListRow } from '../ui';
import { colors, radii, spacing } from '../../theme';
import type { ExercisePlan } from '../../services/pose/exercisePlan';
import { PHASES, pathwaysFor, pathwayOf } from '../../services/care/pathways';
import {
  confirmProgramme,
  episodeStatus,
  setEpisode,
  setSpecialistApproved,
} from '../../services/care/episode';

const Choice: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
  detail?: string;
}> = ({ label, selected, onPress, testID, detail }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
    aria-checked={selected}
    testID={testID}
    style={({ pressed }) => [
      styles.choice,
      selected && styles.choiceSelected,
      pressed && !selected && styles.choicePressed,
    ]}
  >
    <Icon
      name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
      size={24}
      color={selected ? colors.primary : colors.textSecondary}
    />
    <View style={styles.flex}>
      <AppText variant="bodyStrong">{label}</AppText>
      {detail ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {detail}
        </AppText>
      ) : null}
    </View>
  </Pressable>
);

const date = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const CareEpisodeCard: React.FC<{
  plan: ExercisePlan;
  onChange: (plan: ExercisePlan) => void;
}> = ({ plan, onChange }) => {
  const episode = plan.episode;
  const pathway = pathwayOf(episode?.pathway);
  const status = episodeStatus(plan);
  const options = pathwaysFor(plan.joint);

  return (
    <Card style={styles.card} testID="care-episode-card">
      <AppText variant="label" color={colors.textSecondary} accessibilityRole="header">
        WHAT WE’RE TREATING
      </AppText>
      <View accessibilityRole="radiogroup">
        {options.map((p) => (
          <Choice
            key={p.id}
            label={p.label}
            detail={p.specialistOnly ? 'Specialist programme needed' : undefined}
            selected={episode?.pathway === p.id}
            onPress={() => onChange(setEpisode(plan, p.id))}
            testID={`pathway-${p.id}`}
          />
        ))}
      </View>

      {pathway && episode ? (
        <>
          {pathway.note ? (
            <AppText variant="body" color={colors.textSecondary} testID="pathway-note">
              {pathway.note}
            </AppText>
          ) : null}
          <AppText variant="label" color={colors.textSecondary} style={styles.section}>
            CURRENT PHASE
          </AppText>
          <View accessibilityRole="radiogroup">
            {pathway.phases.map((id) => (
              <Choice
                key={id}
                label={PHASES[id].label}
                detail={
                  PHASES[id].coaching === 'comfort'
                    ? 'The app won’t push for more range'
                    : undefined
                }
                selected={episode.phase === id}
                onPress={() => onChange(setEpisode(plan, pathway.id, id))}
                testID={`phase-${id}`}
              />
            ))}
          </View>
          <AppText variant="caption" color={colors.textSecondary}>
            The phase changes only when you change it here, never by date.
          </AppText>

          {pathway.specialistOnly ? (
            <ListRow
              icon="verified-user"
              title="Specialist programme approved"
              description="The exercises below follow this patient’s signed specialist programme"
              toggle={{
                value: Boolean(episode.specialistApproved),
                onChange: (v) => onChange(setSpecialistApproved(plan, v)),
                testID: 'specialist-approved-toggle',
              }}
              last
            />
          ) : null}

          {status === 'ready' && episode.confirmedAt ? (
            <Banner
              tone="success"
              message={`Programme confirmed ${date(episode.confirmedAt)}. The patient sees today’s exercises.`}
              testID="programme-confirmed"
            />
          ) : status === 'needs_specialist' ? (
            <Banner
              tone="warning"
              message="No exercises are offered until a specialist programme is approved."
              testID="programme-needs-specialist"
            />
          ) : (
            <>
              <Banner
                tone="info"
                message="Choose today’s exercises below, then confirm. Until then the patient sees that their programme is being prepared."
                testID="programme-needs-confirmation"
              />
              <BigButton
                label="Confirm programme"
                icon="check"
                onPress={() => onChange(confirmProgramme(plan))}
                disabled={!plan.routine?.length}
                testID="programme-confirm"
              />
            </>
          )}
        </>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  flex: { flex: 1 },
  section: { marginTop: spacing.sm },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  choiceSelected: { backgroundColor: colors.primarySoft },
  choicePressed: { backgroundColor: colors.surfaceMuted },
});

export default CareEpisodeCard;
