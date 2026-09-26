/**
 * Step 1 of the Exercise tab (native and web): pick one exercise from large
 * cards, glance at the set-up reminder, then press the one big Start button.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, BigButton, Card, Screen } from '../ui';
import { colors, radii, spacing } from '../../theme';
import type { MainTabParamList } from '../../navigation/types';
import ExerciseSelector from './ExerciseSelector';
import { EXERCISE_OPTIONS, ExerciseKey, ExerciseOption } from './exerciseCatalog';
import PlanEditor from './PlanEditor';
import ExerciseVideo from '../video/ExerciseVideo';
import { VideoLinkEditor } from '../video/VideoLinkEditor';
import { parseYouTubeId, parseYouTubeStart } from '../../utils/youtube';
import {
  ExercisePlan,
  jointLabel,
  limitMovement,
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
}) => {
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

  return (
    <Screen
      testID="exercise-chooser"
      title="Choose an exercise"
      subtitle="Tap one, then press Start."
      footer={
        <BigButton
          label={selected ? `Start ${selected.title.toLowerCase()}` : 'Start'}
          icon="play-arrow"
          onPress={onStart}
          loading={starting}
          testID="start-exercise-button"
          accessibilityHint="Opens the camera and starts counting your repetitions"
        />
      }
    >
      {notice}
      {plan ? (
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
      {plan && selected && onPlanChange ? (
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
      {plan && selected && (onRecordDemo || onUploadVideo) ? (
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

      <Card style={styles.setup} testID="exercise-setup-tips">
        <AppText variant="label" color={colors.textSecondary} accessibilityRole="header">
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
          onPress={() => navigation.navigate('HomeTab', { screen: 'Help' })}
          testID="exercise-setup-help"
          style={styles.helpLink}
        />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  setup: { gap: spacing.md, marginTop: spacing.sm },
  plan: { gap: spacing.sm },
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
