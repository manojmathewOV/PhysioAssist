/** A real exercise without camera tracking, not simulated practice. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { GuidedExercise } from '../../services/care/guidedShoulder';
import { AppText, Banner, BigButton, Card, Screen } from '../ui';
import { useGuidedSpeech } from './useGuidedSpeech';
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
  holdSeconds?: number;
  minimumReps?: number;
  enableSpeech?: boolean;
  speechRate?: number;
  onSpeechChange?: (enabled: boolean) => void;
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
  holdSeconds,
  minimumReps,
  enableSpeech = false,
  speechRate,
  onSpeechChange,
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
  const canTimeHolds =
    Number.isFinite(holdSeconds) &&
    holdSeconds! > 0 &&
    Number.isSafeInteger(minimumReps) &&
    minimumReps! > 0;
  const [timeHolds, setTimeHolds] = useState(canTimeHolds);
  const [holdFrom, setHoldFrom] = useState<number | null>(null);
  const [timedHolds, setTimedHolds] = useState(0);
  const [spokenHoldSeconds, setSpokenHoldSeconds] = useState(holdSeconds);
  const [videoMounted, setVideoMounted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
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
    if (type === 'start' || type === 'resume' || type === 'finish') {
      setReviewing(false);
      setShowVideo(false); // Retain position, but do not mix video audio with activity cues.
      setShowSteps(false);
    }
    if (timeHolds && (type === 'start' || type === 'resume')) {
      const elapsed = activityTime(stateRef.current, Date.now()).activeMilliseconds;
      if (type === 'start' || holdFrom === null) {
        setHoldFrom(type === 'start' ? 0 : elapsed);
        setSpokenHoldSeconds(holdSeconds);
      } else
        setSpokenHoldSeconds(
          Math.max(0, Math.ceil((holdSeconds! * 1000 - (elapsed - holdFrom)) / 1000))
        );
    }
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
  useEffect(() => {
    if (
      !timeHolds ||
      !canTimeHolds ||
      holdFrom === null ||
      state.phase !== 'active' ||
      disabled
    )
      return;
    if (time.activeMilliseconds - holdFrom < holdSeconds! * 1000) return;
    setHoldFrom(null);
    setTimedHolds((count) => count + 1);
    send({ type: 'pause', at: Date.now() });
  }, [
    timeHolds,
    canTimeHolds,
    holdFrom,
    state.phase,
    disabled,
    time.activeMilliseconds,
    holdSeconds,
    send,
  ]);
  const betweenHolds = timeHolds && timedHolds > 0 && holdFrom === null;
  const timedMinimum = betweenHolds && timedHolds >= minimumReps!;
  const liveCue =
    exercise.cue ??
    exercise.instructions[exercise.id === 'sleeper-stretch' ? 2 : 1] ??
    exercise.instructions[0] ??
    'Follow your programme.';
  const currentCue =
    state.phase === 'paused'
      ? betweenHolds
        ? 'Release this hold and rest until you are ready.'
        : 'Paused. Press Resume when ready.'
      : liveCue;
  const spoken = expired
    ? 'This session is no longer due. Return to your programme.'
    : !allowed || state.interruption === 'programme_changed'
      ? 'Your programme changed. Stop here and check your instructions.'
      : state.phase === 'ready'
        ? `${exercise.name}. ${side} ${exercise.primaryJoint ?? 'side'}. ${amount}. Get into position. Start only when you are ready.`
        : state.phase === 'finished'
          ? ''
          : betweenHolds
            ? `Hold timer ${timedHolds} of ${minimumReps} finished. Release and rest. ${timedMinimum ? 'You can finish and tell us how it went.' : 'Start the next hold when ready.'}`
            : state.phase === 'paused'
              ? 'Paused.'
              : timeHolds
                ? `Hold ${timedHolds + 1}. ${spokenHoldSeconds} seconds remaining in this prescribed hold. ${liveCue}`
                : `${exercise.name}. ${amount}. ${liveCue}`;
  const speech = useGuidedSpeech(
    enableSpeech,
    !foreground || !focused || reviewing,
    spoken,
    speechRate
  );
  const remainingHold =
    holdFrom === null
      ? holdSeconds
      : Math.max(
          0,
          Math.ceil((holdSeconds! * 1000 - (time.activeMilliseconds - holdFrom)) / 1000)
        );
  return (
    <Screen
      // A new result must start at its status, not keep the old form's scroll offset.
      key={
        state.phase === 'finished'
          ? reported === null
            ? 'report'
            : 'result'
          : 'activity'
      }
      testID="guided-activity"
      title={reviewing && showVideo ? 'Demonstration' : exercise.name}
      scrollResetKey={
        reviewing && showVideo
          ? 'reference'
          : state.phase === 'ready'
            ? 'ready'
            : 'activity'
      }
      subtitle={`${side === 'left' ? 'Left' : 'Right'} ${exercise.primaryJoint ?? 'side'} · Without camera`}
      footer={
        state.phase === 'finished' ? (
          <BigButton label="Back to exercises" onPress={onExit} testID="guided-done" />
        ) : state.phase === 'ready' ? (
          <>
            <BigButton
              label="I’m ready — start"
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
            {!timedMinimum ? (
              <BigButton
                label={
                  betweenHolds
                    ? 'Start next hold'
                    : state.phase === 'paused'
                      ? 'Resume'
                      : 'Pause'
                }
                disabled={state.phase === 'paused' && disabled}
                onPress={() => act(state.phase === 'paused' ? 'resume' : 'pause')}
                testID="guided-pause"
              />
            ) : null}
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
          <AppText variant="heading">Your activity</AppText>
          {onRecord && reported !== null ? (
            <>
              <Banner
                tone={saveStatus === 'failed' ? 'warning' : 'info'}
                message={
                  saveStatus === 'saved'
                    ? 'Saved on this device.'
                    : saveStatus === 'failed'
                      ? 'Not saved yet. Try saving again.'
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
              message={
                reported === null
                  ? 'Tell us how it went to save it.'
                  : 'This attempt has not been saved. It will not tick off today’s routine.'
              }
              testID="guided-unsaved"
            />
          )}

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
        </Card>
      ) : (
        <>
          {!reviewing || !showVideo ? (
            <Card style={styles.card}>
              {state.phase === 'ready' || !timeHolds ? (
                <AppText variant="bodyStrong" testID="guided-dose">
                  {amount}
                </AppText>
              ) : null}
              {state.phase === 'ready' ? (
                <AppText variant="body">
                  Get into position and read or watch the instructions. The timer has not
                  started.
                </AppText>
              ) : (
                <>
                  <AppText variant="heading" testID="guided-instruction">
                    {currentCue}
                  </AppText>
                  {timeHolds ? (
                    <AppText variant="bodyStrong" testID="guided-hold-time">
                      {betweenHolds
                        ? `${timedHolds} hold timer${timedHolds === 1 ? '' : 's'} finished`
                        : `Hold ${timedHolds + 1} of ${minimumReps}: ${formatDuration(remainingHold ?? 0)} remaining`}
                    </AppText>
                  ) : null}
                  <AppText
                    variant="body"
                    testID="guided-time"
                    accessibilityLabel={`Active time ${formatDuration(time.activeMilliseconds / 1000)}`}
                  >
                    {formatDuration(time.activeMilliseconds / 1000)} active
                  </AppText>
                  {timeHolds ? (
                    <AppText variant="body">
                      Timing is guidance, not a measurement or repetition count.
                    </AppText>
                  ) : null}
                </>
              )}
            </Card>
          ) : null}
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
          {reviewing && showVideo ? (
            <>
              <AppText variant="body">
                {state.phase === 'ready'
                  ? 'Watch before you start.'
                  : 'Activity paused while you watch.'}
              </AppText>
              {state.phase !== 'ready' ? (
                <AppText
                  variant="body"
                  testID="guided-time"
                  accessibilityLabel={`Active time ${formatDuration(time.activeMilliseconds / 1000)}`}
                >
                  {formatDuration(time.activeMilliseconds / 1000)} active
                </AppText>
              ) : null}
            </>
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
          {state.phase === 'ready' || showSteps ? (
            <Card style={styles.card} testID="guided-setup-instructions">
              <AppText variant="heading">Your instructions</AppText>
              {exercise.instructions.map((text, index) => (
                <AppText key={index} variant="body">
                  {index + 1}. {text}
                </AppText>
              ))}
            </Card>
          ) : (
            <BigButton
              label="Show instructions"
              compact
              variant="ghost"
              testID="guided-show-steps"
              onPress={() => {
                if (stateRef.current.phase === 'active')
                  send({ type: 'pause', at: Date.now() });
                setShowSteps(true);
              }}
            />
          )}
          {exercise.warnings?.map((warning) => (
            <Banner key={warning} tone="warning" message={warning} />
          ))}
          {onSpeechChange ? (
            <BigButton
              label={enableSpeech ? 'Spoken guidance: on' : 'Spoken guidance: off'}
              compact
              variant="secondary"
              testID="guided-speech-toggle"
              onPress={() => {
                if (!enableSpeech && timeHolds && holdFrom !== null) {
                  const elapsed = activityTime(
                    stateRef.current,
                    Date.now()
                  ).activeMilliseconds;
                  setSpokenHoldSeconds(
                    Math.max(
                      0,
                      Math.ceil((holdSeconds! * 1000 - (elapsed - holdFrom)) / 1000)
                    )
                  );
                }
                onSpeechChange(!enableSpeech);
              }}
            />
          ) : null}
          {speech.unavailable ? (
            <AppText variant="body" testID="guided-speech-unavailable">
              Spoken guidance is unavailable. Follow the written instructions.
            </AppText>
          ) : null}
          {state.phase === 'ready' && canTimeHolds ? (
            <BigButton
              label={
                timeHolds ? 'Prescribed hold timer: on' : 'Prescribed hold timer: off'
              }
              compact
              variant="secondary"
              testID="guided-hold-toggle"
              onPress={() => setTimeHolds(!timeHolds)}
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
