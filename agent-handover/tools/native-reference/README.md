# Native reference UI probe

This XCTest source drove the **actual Release PhysioAssist app** on the owner's dedicated synthetic iPhone simulator: setup, save official sample URL, play, pause, enlarge, replay. It is not a full prescribed patient journey, real-camera study or clinical-content approval. A first scroll-direction fixture failure and then an actual Hermes URL-parser crash were retained before the passing run on `0024f87`.

Use only a dedicated synthetic test simulator, never a patient's app/data. Build and install the selected app with the existing guarded workflow first. The test currently targets `org.reactjs.native.example.PhysioAssist`; reconcile that identity if the installed app changes. The successful run used an already configured synthetic profile; fresh onboarding is not a separate acceptance claim.

From the repository, use the pinned Ruby/gem environment:

```sh
bundle exec ruby agent-handover/tools/native-reference/make_project.rb "$RUN/native-reference"
xcodebuild -project "$RUN/native-reference/VideoProbe.xcodeproj" \
  -scheme VideoProbe -destination "platform=iOS Simulator,id=$TEST_UDID" \
  -derivedDataPath "$CACHE/VideoProbe" -resultBundlePath "$RUN/native-reference.xcresult" \
  -jobs 2 CODE_SIGN_IDENTITY=- test
```

`RUN`, `CACHE` and `TEST_UDID` are explicit local configuration outside Git. Use a new result path, a bounded supervisor and the existing exclusive job lock. The generator builds a tiny test host; it does not edit the application project. No global test-driver installation is required. The parameterised generator is a portable adaptation; the original source matched the 0024f87 run; the expanded live-controls test is a new candidate and requires its own run.

Export attachments with `xcrun xcresulttool export attachments`, then actually inspect them. In the recorded native screenshots the page was scrolled toward the controls and part of the player was above the viewport: these establish playback/control observation, not an ideal fully-visible patient layout. Do not publish screenshots containing third-party people/media. Shut down only the owned simulator. Full native live-session Pause/Hide/Show, error recovery, physical-device accessibility and clinician-approved media remain separate criteria.

The receiving-agent pickup adds a synthetic native live session with app Pause/Resume, Hide/Show, manual-pause retention and ending at the summary. See the subsequent pickup evidence for whether those cases ran; their presence is not a pass. No camera footage or treatment is recorded.
