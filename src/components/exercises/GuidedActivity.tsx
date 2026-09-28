/** A real exercise without camera tracking, not simulated practice. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { GuidedExercise } from '../../services/care/guidedShoulder';
import { AppText, Banner, BigButton, Card, Screen } from '../ui';
import { spacing } from '../../theme';
import {
  activityOutcome,
  activityTime,
  readyActivity,
  transitionActivity,
} from '../../services/session/guidedActivity';
import type {
  GuidedActivityOutcome,
  GuidedEvent,
} from '../../services/session/guidedActivity';
import ExerciseVideo from '../video/ExerciseVideo';
import { parseYouTubeId, parseYouTubeStart } from '../../utils/youtube';
import { formatDuration } from './exerciseCatalog';

export interface GuidedActivityProps {
  exercise: GuidedExercise;
  startedAt?: number;
  side: 'left' | 'right';
  amount: string;
  videoLink?: string;
  /** False if the source programme/profile changed after this snapshot. */
  allowed: boolean;
  onExit: () => void;
  onStartAllowed?: () => boolean;
  onRecord?: (outcome: GuidedActivityOutcome) => void;
  saveStatus?: 'saving' | 'saved' | 'failed';
  onRetrySave?: () => void;
}
export default function GuidedActivity({
  exercise,
  startedAt,
  side,
  amount,
  videoLink,
  allowed,
  onExit,
  onStartAllowed,
  onRecord,
  saveStatus,
  onRetrySave,
}: GuidedActivityProps) {
  const [state, setState] = useState(() =>
    startedAt === undefined
      ? readyActivity()
      : transitionActivity(readyActivity(), { type: 'start', at: startedAt })
  );
  const stateRef = useRef(state);
  const [now, setNow] = useState(Date.now);
  const [expired, setExpired] = useState(false);
  const [videoMounted, setVideoMounted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const reportSent = useRef(false);
  const [reported, setReported] = useState<boolean | null>(null);
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const send = useCallback((event: GuidedEvent) => {
    const next = transitionActivity(stateRef.current, event);
    stateRef.current = next;
    setState(next);
    setNow(event.at);
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      setForeground(status === 'active');
      if (status !== 'active') {
        setReviewing(false);
        send({ type: 'interrupt', reason: 'background', at: Date.now() });
      }
    });
    return () => sub.remove();
  }, [send]);
  useEffect(() => {
    if (!focused) {
      setReviewing(false);
      send({ type: 'interrupt', reason: 'background', at: Date.now() });
    }
  }, [focused, send]);
  useEffect(() => {
    if (!allowed)
      send({ type: 'interrupt', reason: 'programme_changed', at: Date.now() });
  }, [allowed, send]);
  useEffect(() => {
    if (state.phase !== 'active' || !focused || !foreground) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.phase, focused, foreground]);
  const time = activityTime(state, now);
  const act = (type: 'start' | 'pause' | 'resume' | 'finish') => {
    if (type === 'start' && onStartAllowed && !onStartAllowed()) {
      setExpired(true);
      return;
    }
    if (type === 'start' || type === 'resume' || type === 'finish') setReviewing(false);
    send({ type, at: Date.now() });
  };
  const report = (completed: boolean) => {
    const outcome = activityOutcome(stateRef.current, completed);
    if (!outcome || reportSent.current) return;
    reportSent.current = true;
    setReported(completed);
    onRecord?.(outcome);
  };
  const paused =
    !focused || !foreground || !allowed || (!reviewing && state.phase !== 'active');
  const videoId = parseYouTubeId(videoLink);
  const outcome = reported === null ? null : activityOutcome(state, reported);
  const disabled =
    expired ||
    !allowed ||
    !foreground ||
    !focused ||
    state.interruption === 'programme_changed';
  return (
    <Screen
      testID="guided-activity"
      title={exercise.name}
      subtitle={`${side === 'left' ? 'Left' : 'Right'} ${exercise.primaryJoint ?? 'side'} · Without camera`}
      footer={
        state.phase === 'finished' ? (
          <BigButton label="Back to exercises" onPress={onExit} testID="guided-done" />
        ) : state.phase === 'ready' ? (
          <>
            <BigButton
              label="Start exercise"
              disabled={disabled}
              onPress={() => act('start')}
              testID="guided-start"
            />
            <BigButton
              label="Back"
              variant="secondary"
              onPress={onExit}
              testID="guided-back"
            />
          </>
        ) : (
          <>
            <BigButton
              label={state.phase === 'paused' ? 'Resume' : 'Pause'}
              disabled={state.phase === 'paused' && disabled}
              onPress={() => act(state.phase === 'paused' ? 'resume' : 'pause')}
              testID="guided-pause"
            />
            <BigButton
              label="Finish / stop"
              variant="secondary"
              onPress={() => act('finish')}
              testID="guided-stop"
            />
          </>
        )
      }
    >
      {expired ? (
        <Banner
          tone="info"
          message="This session is no longer due. Return to your programme for the current instructions."
          testID="guided-expired"
        />
      ) : null}
      {!allowed || state.interruption === 'programme_changed' ? (
        <Banner
          tone="warning"
          message="Your programme changed. Stop here and check the current instructions before starting again."
          testID="guided-plan-changed"
        />
      ) : null}
      {state.phase === 'finished' ? (
        <Card style={styles.card}>
          <AppText variant="heading">Exercise stopped</AppText>
          <AppText variant="body">
            Active time: {formatDuration(time.activeMilliseconds / 1000)}. Pauses are not
            included.
          </AppText>
          <AppText variant="body">No camera measurement was taken.</AppText>
          {outcome ? (
            <AppText testID="guided-report" variant="body">
              {reported
                ? 'You reported completing the exercise.'
                : 'You reported stopping early.'}
            </AppText>
          ) : (
            <>
              <BigButton
                label="I did the whole exercise"
                disabled={time.activeMilliseconds <= 0}
                onPress={() => report(true)}
                testID="guided-completed"
              />
              <BigButton
                label="I stopped early"
                variant="secondary"
                onPress={() => report(false)}
                testID="guided-stopped-early"
              />
            </>
          )}
          {onRecord && reported !== null ? (
            <>
              <Banner
                tone={saveStatus === 'failed' ? 'warning' : 'info'}
                message={
                  saveStatus === 'saved'
                    ? 'Saved on this device. Your report is not a camera measurement.'
                    : saveStatus === 'failed'
                      ? 'Saving could not be confirmed. This activity is not counted yet. Try saving again.'
                      : 'Saving your activity… It is not counted until saving is confirmed.'
                }
                testID="guided-save-state"
              />
              {saveStatus === 'failed' && onRetrySave ? (
                <BigButton
                  label="Try saving again"
                  variant="secondary"
                  onPress={onRetrySave}
                  testID="guided-save-retry"
                />
              ) : null}
            </>
          ) : (
            <Banner
              tone="info"
              message="This attempt has not been saved. It will not tick off today’s routine."
              testID="guided-unsaved"
            />
          )}
        </Card>
      ) : (
        <>
          <Card style={styles.card}>
            <AppText variant="bodyStrong" testID="guided-dose">
              {amount}
            </AppText>
            {state.phase === 'ready' ? (
              <AppText variant="body">
                Follow your existing programme. The camera will not be used or count your
                movements.
              </AppText>
            ) : (
              <>
                <AppText
                  variant="display"
                  testID="guided-time"
                  accessibilityLabel={`Active time ${formatDuration(time.activeMilliseconds / 1000)}`}
                >
                  {formatDuration(time.activeMilliseconds / 1000)}
                </AppText>
                <AppText variant="bodyStrong" testID="guided-instruction">
                  {state.phase === 'paused'
                    ? 'Paused. Press Resume when ready.'
                    : 'Follow the timing and movements in your programme.'}
                </AppText>
              </>
            )}
          </Card>
          {exercise.warnings?.map((warning) => (
            <Banner key={warning} tone="warning" message={warning} />
          ))}
          <Card style={styles.card}>
            <AppText variant="heading">Your instructions</AppText>
            {exercise.instructions.map((text, index) => (
              <AppText key={`${index}-${text}`} variant="body">
                {index + 1}. {text}
              </AppText>
            ))}
          </Card>
          {videoId && (!showVideo || (state.phase === 'paused' && !reviewing)) ? (
            <BigButton
              label="Watch demonstration"
              variant="secondary"
              testID="guided-watch"
              disabled={!allowed || !focused || !foreground}
              onPress={() => {
                if (stateRef.current.phase === 'active')
                  send({ type: 'pause', at: Date.now() });
                setReviewing(true);
                setVideoMounted(true);
                setShowVideo(true);
              }}
            />
          ) : null}
          {reviewing ? (
            <AppText variant="body">
              Watching does not count as exercise time.{' '}
              {state.phase === 'ready' ? 'Press Start exercise' : 'Press Resume'} when you
              are ready to exercise.
            </AppText>
          ) : null}
          {videoId && videoMounted ? (
            <ExerciseVideo
              videoId={videoId}
              start={parseYouTubeStart(videoLink)}
              paused={state.phase === 'ready' ? disabled : paused}
              hidden={!showVideo}
              compact={state.phase === 'active'}
              onHide={() => setShowVideo(false)}
              testID="guided-video"
            />
          ) : null}
          <AppText variant="body">
            This activity is not automatically counted or measured.
          </AppText>
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({ card: { gap: spacing.md } });
