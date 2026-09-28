import XCTest
// Dedicated synthetic simulator only. Entered doses are test fixtures, not a prescription.
final class ReferenceUITests: XCTestCase {
 let app = XCUIApplication(bundleIdentifier: "org.reactjs.native.example.PhysioAssist")
 func item(_ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
 func tap(_ id: String) {
  for _ in 0..<24 {
   let e=item(id)
   if e.exists && e.isHittable { e.tap(); return }
   let middle=app.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.48))
   let to=app.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:(e.exists && e.frame.minY < 70) ? 0.73 : 0.23))
   middle.press(forDuration:0.1,thenDragTo:to)
  }
  XCTFail("Cannot reach \(id): \(app.debugDescription)")
 }
 func shot(_ name: String) { let a=XCTAttachment(screenshot: app.screenshot());a.name=name;a.lifetime = .keepAlways;add(a) }
 func enter(_ id: String,_ value: String) { tap(id);item(id).typeText(value) }
 func saved() {
  let e=item("guided-save-state")
  let predicate=NSPredicate(format:"label CONTAINS 'Saved on this device'")
  expectation(for:predicate,evaluatedWith:e);waitForExpectations(timeout:20)
 }
 func testGuidedReferenceAndRestart() {
  continueAfterFailure=false;app.launch()
  if item("onboarding-get-started").waitForExistence(timeout:3) {
   tap("onboarding-get-started");tap("onboarding-privacy-checkbox");tap("onboarding-next")
   for _ in 0..<10 { if item("demo-login-button").exists { break };tap("onboarding-next") }
  }
  if item("demo-login-button").exists { tap("demo-login-button") }
  XCTAssertTrue(item("tab-exercises").waitForExistence(timeout:20));tap("tab-exercises")
  if item("plan-joint-shoulder").exists { tap("plan-joint-shoulder");tap("plan-save") }
  tap("exercise-setup-open");tap("exercise-plan-change");tap("plan-joint-knee");tap("plan-save")
  tap("exercise-plan-change");tap("plan-joint-shoulder");tap("plan-save")
  tap("pathway-frozen_shoulder");tap("phase-symptom_limited");tap("episode-new")
  for id in ["supine-assisted-elevation","supine-stick-external-rotation","sleeper-stretch"] {
   tap("choose-"+id);enter("guided-dose-min","2");enter("guided-dose-max","3");
   if id == "sleeper-stretch" { enter("guided-dose-hold","6") }
   if id == "supine-assisted-elevation" { enter("guided-video-url","https://www.youtube.com/watch?v=M7lc1UVf-VE&t=8s") };tap("guided-dose-apply")
  }
  tap("programme-confirm");tap("exercise-setup-done")
  XCTAssertTrue(item("today-next-title").waitForExistence(timeout:10));shot("native-guided-preparation")
  tap("start-routine-button");XCTAssertTrue(item("guided-start").waitForExistence(timeout:10))
  Thread.sleep(forTimeInterval:2);XCTAssertFalse(item("guided-time").exists);shot("native-guided-ready")
  tap("guided-start");XCTAssertTrue(item("guided-time").waitForExistence(timeout:10))
  XCTAssertFalse(item("use-practice-mode").exists)
  Thread.sleep(forTimeInterval:2.2);tap("guided-pause")
  let paused=item("guided-time").label;Thread.sleep(forTimeInterval:2)
  XCTAssertEqual(item("guided-time").label,paused);shot("native-guided-paused")
  tap("guided-pause");Thread.sleep(forTimeInterval:1.2)
  tap("guided-watch")
  let beforeWatch=item("guided-time").label
  let enabled=NSPredicate(format:"enabled == true")
  expectation(for:enabled,evaluatedWith:item("reference-play-pause"));waitForExpectations(timeout:30)
  tap("reference-play-pause")
  let playing=NSPredicate(format:"label CONTAINS 'playing'")
  expectation(for:playing,evaluatedWith:item("reference-player-state"));waitForExpectations(timeout:25)
  Thread.sleep(forTimeInterval:2);XCTAssertEqual(item("guided-time").label,beforeWatch)
  tap("follow-along-toggle");tap("guided-watch")
  expectation(for:playing,evaluatedWith:item("reference-player-state"));waitForExpectations(timeout:15)
  tap("reference-play-pause");tap("follow-along-toggle");tap("guided-watch")
  let manuallyPaused=NSPredicate(format:"label == 'Play video'")
  expectation(for:manuallyPaused,evaluatedWith:item("reference-play-pause"));waitForExpectations(timeout:10)
  shot("native-guided-reference-private")
  tap("guided-pause")
  XCUIDevice.shared.press(.home);Thread.sleep(forTimeInterval:2);app.activate()
  XCTAssertTrue(item("guided-instruction").waitForExistence(timeout:10))
  XCTAssertTrue(item("guided-instruction").label.contains("Paused"))
  tap("guided-stop");tap("guided-completed");saved();shot("native-guided-saved")
  tap("guided-done");XCTAssertTrue(item("today-next-title").label.contains("stick-assisted"))
  tap("start-routine-button");tap("guided-start");Thread.sleep(forTimeInterval:1.2);tap("guided-stop");tap("guided-stopped-early");saved();tap("guided-done")
  XCTAssertTrue(item("today-next-title").label.contains("Sleeper"))
  tap("start-routine-button");XCTAssertTrue(item("guided-start").waitForExistence(timeout:10))
  Thread.sleep(forTimeInterval:1.2);XCTAssertFalse(item("guided-time").exists)
  tap("guided-start");shot("native-guided-hold-active")
  let firstHold=NSPredicate(format:"label CONTAINS '1 hold timer finished'")
  expectation(for:firstHold,evaluatedWith:item("guided-hold-time"));waitForExpectations(timeout:15)
  let heldTime=item("guided-time").label;Thread.sleep(forTimeInterval:1.2)
  XCTAssertEqual(item("guided-time").label,heldTime);shot("native-guided-hold-rest")
  XCTAssertTrue(item("guided-pause").label.contains("Start next hold"))
  tap("guided-pause");Thread.sleep(forTimeInterval:1);tap("guided-pause")
  let heldPause=item("guided-time").label
  XCUIDevice.shared.press(.home);Thread.sleep(forTimeInterval:2);app.activate()
  XCTAssertEqual(item("guided-time").label,heldPause)
  tap("guided-pause")
  let secondHold=NSPredicate(format:"label CONTAINS '2 hold timers finished'")
  expectation(for:secondHold,evaluatedWith:item("guided-hold-time"));waitForExpectations(timeout:15)
  XCTAssertFalse(item("guided-pause").exists)
  tap("guided-stop");XCTAssertTrue(item("guided-unsaved").label.contains("Tell us how it went"))
  tap("guided-completed");saved();shot("native-guided-hold-saved");tap("guided-done")
  tap("tab-progress");XCTAssertTrue(item("progress-session-0").waitForExistence(timeout:10));shot("native-guided-history")
  XCTAssertFalse(item("progress-series-0").exists)
  app.terminate();app.launch();tap("tab-progress")
  XCTAssertTrue(item("progress-session-0").waitForExistence(timeout:10));shot("native-guided-reopened")
  XCTAssertFalse(item("progress-series-0").exists)
  tap("tab-home");XCTAssertTrue(item("home-goal-ring").waitForExistence(timeout:10))
  XCTAssertTrue(item("home-goal-ring").label.contains("2 of 3"))
 }
}
