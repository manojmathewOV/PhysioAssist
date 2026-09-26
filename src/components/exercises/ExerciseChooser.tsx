/**
 * Step 1 of the Exercise tab (native and web).
 *
 * For the patient: with a routine from the physio, the next exercise and "I'm
 * ready" (TodayPrep), no choosing; without one, pick an exercise and Start.
 * Everything that configures the plan (goals, today's exercises, videos,
 * demonstrations) is in "Physio set-up", out of the everyday path.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, BigButton, Card, ListRow, Screen } from '../ui';
import { colors, radii, spacing } from '../../theme';
import type { MainTabParamList } from '../../navigation/types';
import ExerciseSelector from './ExerciseSelector';
import { EXERCISE_OPTIONS, ExerciseKey, ExerciseOption } from './exerciseCatalog';
import PlanEditor, { Stepper } from './PlanEditor';
import TodaysRoutineCard from './TodaysRoutineCard';
import TodayPrep, { ProgrammeWaiting } from './TodayPrep';
import CareEpisodeCard from './CareEpisodeCard';
import { episodeStatus, exercisesAllowed } from '../../services/care/episode';
import type { TodaysRoutine } from '../../services/pose/routine';
import {
  inRoutine,
  moveRoutineItem,
  updateRoutineItem,
} from '../../services/pose/routine';
import { movementOf } from '../../services/movement/exerciseMovement';
import ExerciseVideo from '../video/ExerciseVideo';
import { VideoLinkEditor } from '../video/VideoLinkEditor';
import { parseYouTubeId, parseYouTubeStart } from '../../utils/youtube';
import {
  ExercisePlan,
  jointLabel,
  limitMovement,
  routineItem,
} from '../../services/pose/exercisePlan';

interface ExerciseChooserProps {
  selectedKey: ExerciseKey;
  onSelect: (key: ExerciseKey) => void;
  onStart: () => void;
  /** Shows a spinner on Start (e.g. while the camera opens). */
  starting?: boolean;
  /** Optional message above the list (e.g. a Banner). */
  notice?: React.ReactNode;
  /** The patient's plan: joint of interest and their physio's goal. */
  plan?: ExercisePlan | null;
  onPlanChange?: (plan: ExercisePlan) => void;
  /** Record the physio's demonstration of the selected exercise. */
  onRecordDemo?: () => void;
  /** Build the demonstration from a video file (web). */
  onUploadVideo?: () => void;
  /** Shown while a video is being analysed, e.g. "Watching the video… 40%". */
  demoStatus?: string;
  /** Today's routine, when the physio assigned one. */
  routine?: TodaysRoutine;
  /** Start the next exercise of today's routine. */
  onStartRoutine?: () => void;
  /** Add the selected exercise to the routine, or take it out (physio set-up). */
  onToggleRoutine?: (exerciseId: string) => void;
  /** Start a particular exercise (doing one of today's again). */
  onStartExercise?: (exerciseId: string) => void;
}

/** "Goal 120° · don't raise your arm past 140° · 10 times". */
const planDetails = (plan: ExercisePlan) =>
  [
    plan.goalDegrees !== undefined && `Goal ${plan.goalDegrees}°`,
    plan.extensionGoalDegrees !== undefined &&
      `straighten to within ${plan.extensionGoalDegrees}°`,
    plan.limitDegrees !== undefined &&
      `don't ${limitMovement(plan.joint)} past ${plan.limitDegrees}°`,
    plan.reps !== undefined && `${plan.reps} times`,
  ]
    .filter(Boolean)
    .join(' · ') || 'No goal set yet';

const TIPS = [
  { icon: 'social-distance', text: 'Stand about 2 metres away' },
  { icon: 'accessibility', text: 'Make sure your whole body is in view' },
];

const ExerciseChooser: React.FC<ExerciseChooserProps> = ({
  selectedKey,
  onSelect,
  onStart,
  starting,
  notice,
  plan,
  onPlanChange,
  onRecordDemo,
  onUploadVideo,
  demoStatus,
  routine,
  onStartRoutine,
  onToggleRoutine,
  onStartExercise,
}) => {
  const [setupOpen, setSetupOpen] = useState(false);
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [editingPlan, setEditingPlan] = useState(false);
  const [editingVideo, setEditingVideo] = useState(false);
  const selected = EXERCISE_OPTIONS.find((o) => o.key === selectedKey);
  const toItem = (o: ExerciseOption) => ({ ...o, id: o.exercise.id, name: o.title });
  const forPlan = EXERCISE_OPTIONS.filter(
    (o) => !plan || o.exercise.primaryJoint === plan.joint
  ).map(toItem);
  const others = plan
    ? EXERCISE_OPTIONS.filter((o) => o.exercise.primaryJoint !== plan.joint).map(toItem)
    : [];
  const selectedItem = [...forPlan, ...others].find((i) => i.key === selectedKey);
  const reference =
    plan?.reference && plan.reference.exerciseId === selected?.exercise.id
      ? plan.reference
      : undefined;
  const removeDemo = () => {
    if (plan && onPlanChange) onPlanChange({ ...plan, reference: undefined });
  };
  const exerciseId = selected?.exercise.id;
  const videoLink = exerciseId ? plan?.videos?.[exerciseId] : undefined;
  const videoId = parseYouTubeId(videoLink);
  /** Set or clear this exercise's video; a demonstration made with another video no longer applies. */
  const setVideo = (link?: string) => {
    if (!plan || !onPlanChange || !exerciseId) return;
    const videos = { ...plan.videos };
    if (link) videos[exerciseId] = link;
    else delete videos[exerciseId];
    const staleDemo =
      plan.reference?.exerciseId === exerciseId &&
      plan.reference.videoId !== undefined &&
      plan.reference.videoId !== parseYouTubeId(link);
    onPlanChange({ ...plan, videos, reference: staleDemo ? undefined : plan.reference });
    setEditingVideo(false);
  };

  // First visit (or "Change"): choose the joint we're working on
  if (onPlanChange && (!plan || editingPlan)) {
    return (
      <Screen
        testID="exercise-plan-setup"
        title={plan ? 'My plan' : 'Let’s set up your plan'}
        subtitle="Your physiotherapist can help you fill this in."
      >
        <PlanEditor
          value={plan}
          onSave={(next) => {
            onPlanChange(next);
            setEditingPlan(false);
          }}
          onCancel={plan ? () => setEditingPlan(false) : undefined}
        />
      </Screen>
    );
  }

  const hasRoutine = Boolean(routine?.items.length);
  const openHelp = () => navigation.navigate('HomeTab', { screen: 'Help' });

  // Not confirmed for this stage of recovery: no exercises for the patient
  if (plan && !setupOpen && !exercisesAllowed(plan)) {
    return (
      <ProgrammeWaiting
        needsSpecialist={episodeStatus(plan) === 'needs_specialist'}
        onOpenSetup={() => setSetupOpen(true)}
        onHelp={openHelp}
      />
    );
  }

  // The patient's day, when the physio set one: no choosing
  if (plan && routine && hasRoutine && !setupOpen && onStartRoutine) {
    return (
      <TodayPrep
        routine={routine}
        plan={plan}
        onReady={onStartRoutine}
        onRepeat={(id) => onStartExercise?.(id)}
        onOpenSetup={() => setSetupOpen(true)}
        onHelp={openHelp}
        starting={starting}
        notice={notice}
      />
    );
  }
  const setup = setupOpen;
  const selectedItemRoutine =
    plan && selected ? routineItem(plan, selected.exercise.id) : undefined;
  const isHold = selected ? movementOf(selected.exercise.id).mode === 'hold' : false;
  const routineIndex =
    plan?.routine?.findIndex((i) => i.exerciseId === selected?.exercise.id) ?? -1;

  return (
    <Screen
      testID={setup ? 'exercise-physio-setup' : 'exercise-chooser'}
      title={setup ? 'Physio set-up' : 'Choose an exercise'}
      subtitle={
        setup
          ? 'For your physiotherapist or carer: the plan, today’s exercises and videos.'
          : 'Tap one, then press Start.'
      }
      footer={
        setup ? (
          <>
            <BigButton
              label="Done"
              icon="check"
              onPress={() => setSetupOpen(false)}
              testID="exercise-setup-done"
            />
            <BigButton
              variant="secondary"
              label={selected ? `Try ${selected.title.toLowerCase()}` : 'Try it'}
              icon="play-arrow"
              onPress={onStart}
              loading={starting}
              testID="start-exercise-button"
              accessibilityHint="Opens the camera for the selected exercise"
            />
          </>
        ) : (
          <BigButton
            label={selected ? `Start ${selected.title.toLowerCase()}` : 'Start'}
            icon="play-arrow"
            onPress={onStart}
            loading={starting}
            testID="start-exercise-button"
            accessibilityHint="Opens the camera and starts counting your repetitions"
          />
        )
      }
    >
      {notice}
      {setup && plan && onPlanChange ? (
        <CareEpisodeCard plan={plan} onChange={onPlanChange} />
      ) : null}
      {setup && hasRoutine && routine ? <TodaysRoutineCard routine={routine} /> : null}
      {setup && plan ? (
        <Card style={styles.plan} testID="exercise-plan-summary">
          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <Icon name="my-location" size={24} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label" color={colors.textSecondary}>
                WORKING ON
              </AppText>
              <AppText variant="heading">{jointLabel(plan.side, plan.joint)}</AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {planDetails(plan)}
              </AppText>
            </View>
          </View>
          <BigButton
            variant="ghost"
            compact
            icon="edit"
            label="Change my plan"
            onPress={() => setEditingPlan(true)}
            testID="exercise-plan-change"
            style={styles.helpLink}
          />
        </Card>
      ) : null}
      {setup && plan && selected && onToggleRoutine ? (
        <Card style={styles.routineToggle} testID="exercise-routine-card">
          <ListRow
            icon="playlist-add-check"
            title={`${selected.title} in today’s session`}
            description="The exercises the patient does each day, in order"
            toggle={{
              value: inRoutine(plan, selected.exercise.id),
              onChange: () => onToggleRoutine(selected.exercise.id),
              testID: 'exercise-routine-toggle',
            }}
            last={!selectedItemRoutine}
          />
          {selectedItemRoutine && onPlanChange ? (
            <View style={styles.routineControls} testID="exercise-routine-controls">
              {isHold ? (
                <Stepper
                  label="Rest still for"
                  value={selectedItemRoutine.holdSeconds ?? 30}
                  unit="seconds"
                  step={10}
                  min={10}
                  max={600}
                  onChange={(v) =>
                    onPlanChange(
                      updateRoutineItem(plan, selected.exercise.id, { holdSeconds: v })
                    )
                  }
                  testID="routine-hold"
                />
              ) : (
                <Stepper
                  label="Repetitions"
                  value={
                    selectedItemRoutine.reps ??
                    plan.reps ??
                    selected.exercise.targetRepetitions
                  }
                  unit="times"
                  step={1}
                  min={1}
                  max={50}
                  onChange={(v) =>
                    onPlanChange(
                      updateRoutineItem(plan, selected.exercise.id, { reps: v })
                    )
                  }
                  testID="routine-reps"
                />
              )}
              <View style={styles.videoActions}>
                <BigButton
                  variant="ghost"
                  compact
                  icon="arrow-upward"
                  label="Earlier"
                  disabled={routineIndex <= 0}
                  onPress={() =>
                    onPlanChange(moveRoutineItem(plan, selected.exercise.id, -1))
                  }
                  testID="routine-move-earlier"
                />
                <BigButton
                  variant="ghost"
                  compact
                  icon="arrow-downward"
                  label="Later"
                  disabled={
                    routineIndex < 0 || routineIndex >= (plan.routine?.length ?? 0) - 1
                  }
                  onPress={() =>
                    onPlanChange(moveRoutineItem(plan, selected.exercise.id, 1))
                  }
                  testID="routine-move-later"
                />
              </View>
            </View>
          ) : null}
        </Card>
      ) : null}
      {setup && plan && selected && onPlanChange ? (
        <Card style={styles.plan} testID="exercise-video-card">
          <AppText variant="label" color={colors.textSecondary}>
            {`${selected.title.toUpperCase()} VIDEO`}
          </AppText>
          {editingVideo ? (
            <VideoLinkEditor
              initial={videoLink}
              onSave={setVideo}
              onCancel={() => setEditingVideo(false)}
            />
          ) : videoId ? (
            <>
              <ExerciseVideo
                videoId={videoId}
                start={parseYouTubeStart(videoLink)}
                testID="chooser-video"
              />
              <AppText variant="body" color={colors.textSecondary}>
                Watch it first, then follow along. It plays during the exercise too.
              </AppText>
              <View style={styles.videoActions}>
                <BigButton
                  variant="ghost"
                  compact
                  icon="edit"
                  label="Change video"
                  onPress={() => setEditingVideo(true)}
                  testID="exercise-video-change"
                />
                <BigButton
                  variant="ghost"
                  compact
                  icon="delete-outline"
                  label="Remove"
                  onPress={() => setVideo(undefined)}
                  testID="exercise-video-remove"
                />
              </View>
            </>
          ) : (
            <>
              <AppText variant="body" color={colors.textSecondary}>
                Your physio can add a YouTube video showing how to do this exercise.
              </AppText>
              <BigButton
                variant="secondary"
                compact
                icon="smart-display"
                label="Add a YouTube video"
                onPress={() => setEditingVideo(true)}
                testID="exercise-video-add"
              />
            </>
          )}
        </Card>
      ) : null}
      {setup && plan && selected && (onRecordDemo || onUploadVideo) ? (
        <Card style={styles.plan} testID="exercise-demo">
          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <Icon
                name={reference ? 'verified' : 'videocam'}
                size={24}
                color={reference ? colors.success : colors.primary}
              />
            </View>
            <View style={styles.flex}>
              <AppText variant="label" color={colors.textSecondary}>
                {`COMPARE ${selected.title.toUpperCase()} WITH`}
              </AppText>
              <AppText variant="bodyStrong">
                {reference
                  ? `Your physio’s ${reference.source === 'video' ? 'video' : 'demonstration'}`
                  : 'Your physio’s demonstration'}
              </AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {demoStatus ??
                  (reference
                    ? `Reaches about ${reference.peakDegrees}°, ${(
                        reference.repDurationMs / 1000
                      ).toFixed(1)} s per repetition`
                    : videoId
                      ? 'Not recorded yet. Your physio can do the exercise once along with the video while the camera watches.'
                      : 'Not recorded yet. Your physio can do the exercise once while the camera watches.')}
              </AppText>
            </View>
          </View>
          {reference ? (
            <BigButton
              variant="ghost"
              compact
              icon="delete-outline"
              label="Remove demonstration"
              onPress={removeDemo}
              testID="exercise-demo-remove"
              style={styles.helpLink}
            />
          ) : (
            <View style={styles.demoActions}>
              {onRecordDemo ? (
                <BigButton
                  variant="secondary"
                  compact
                  icon="fiber-manual-record"
                  label="Record demonstration"
                  onPress={onRecordDemo}
                  disabled={Boolean(demoStatus)}
                  testID="exercise-demo-record"
                />
              ) : null}
              {onUploadVideo ? (
                <BigButton
                  variant="ghost"
                  compact
                  icon="upload-file"
                  label="Use a video file"
                  onPress={onUploadVideo}
                  disabled={Boolean(demoStatus)}
                  testID="exercise-demo-upload"
                />
              ) : null}
            </View>
          )}
        </Card>
      ) : null}
      <ExerciseSelector
        exercises={forPlan}
        selectedExercise={selectedItem}
        onExerciseSelect={(item: ExerciseOption) => onSelect(item.key)}
      />
      {others.length ? (
        <>
          <AppText variant="label" color={colors.textSecondary} style={styles.others}>
            OTHER EXERCISES
          </AppText>
          <ExerciseSelector
            exercises={others}
            selectedExercise={selectedItem}
            onExerciseSelect={(item: ExerciseOption) => onSelect(item.key)}
          />
        </>
      ) : null}

      {setup ? null : (
        <>
          <Card style={styles.setup} testID="exercise-setup-tips">
            <AppText
              variant="label"
              color={colors.textSecondary}
              accessibilityRole="header"
            >
              BEFORE YOU START
            </AppText>
            {TIPS.map((tip) => (
              <View key={tip.icon} style={styles.tip}>
                <View style={styles.tipIcon}>
                  <Icon name={tip.icon} size={24} color={colors.warning} />
                </View>
                <AppText variant="bodyStrong" style={styles.flex}>
                  {tip.text}
                </AppText>
              </View>
            ))}
            <BigButton
              variant="ghost"
              compact
              icon="help-outline"
              label="How to set up"
              onPress={openHelp}
              testID="exercise-setup-help"
              style={styles.helpLink}
            />
          </Card>
          {onPlanChange ? (
            <BigButton
              variant="ghost"
              compact
              icon="tune"
              label="Physio set-up"
              onPress={() => setSetupOpen(true)}
              testID="exercise-setup-open"
              style={styles.helpLink}
              accessibilityHint="For your physiotherapist or carer: exercises, goals and videos"
            />
          ) : null}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  setup: { gap: spacing.md, marginTop: spacing.sm },
  plan: { gap: spacing.sm },
  routineToggle: { paddingVertical: 0 },
  routineControls: { paddingBottom: spacing.sm },
  demoActions: { gap: spacing.sm },
  videoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  others: { marginTop: spacing.md, marginLeft: spacing.xs },
  tip: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpLink: { alignSelf: 'flex-start', marginLeft: -spacing.md },
});

export default ExerciseChooser;
