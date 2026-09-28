import XCTest
// Dedicated synthetic simulator only. Entered doses are test fixtures, not a prescription.
final class ReferenceUITests: XCTestCase {
 let app = XCUIApplication(bundleIdentifier: "org.reactjs.native.example.PhysioAssist")
 func item(_ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
 func tap(_ id: String) {
  for _ in 0..<24 {
   let e=item(id)
   if e.exists && e.isHittable { e.tap(); return }
   if e.exists && e.frame.minY < 70 { app.swipeDown() } else { app.swipeUp() }
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
 func testGuidedShoulderWithoutCamera() {
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
  tap("pathway-frozen_shoulder");tap("phase-symptom_limited")
  for id in ["supine-assisted-elevation","supine-stick-external-rotation","sleeper-stretch"] {
   tap("choose-"+id);enter("guided-dose-min","2");enter("guided-dose-max","3");tap("guided-dose-apply")
  }
  tap("programme-confirm");tap("exercise-setup-done")
  XCTAssertTrue(item("today-next-title").waitForExistence(timeout:10));shot("native-guided-preparation")
  tap("start-routine-button");XCTAssertTrue(item("guided-time").waitForExistence(timeout:10))
  XCTAssertFalse(item("use-practice-mode").exists)
  Thread.sleep(forTimeInterval:2.2);tap("guided-pause")
  let paused=item("guided-time").label;Thread.sleep(forTimeInterval:2)
  XCTAssertEqual(item("guided-time").label,paused);shot("native-guided-paused")
  tap("guided-pause");Thread.sleep(forTimeInterval:1.2)
  XCUIDevice.shared.press(.home);Thread.sleep(forTimeInterval:2);app.activate()
  XCTAssertTrue(item("guided-instruction").waitForExistence(timeout:10))
  XCTAssertTrue(item("guided-instruction").label.contains("Paused"))
  tap("guided-stop");tap("guided-completed");saved();shot("native-guided-saved")
  tap("guided-done");XCTAssertTrue(item("today-next-title").label.contains("stick-assisted"))
  tap("start-routine-button");Thread.sleep(forTimeInterval:1.2);tap("guided-stop");tap("guided-stopped-early");saved();tap("guided-done")
  XCTAssertTrue(item("today-next-title").label.contains("Sleeper"))
  tap("start-routine-button");Thread.sleep(forTimeInterval:1.2);tap("guided-stop");tap("guided-completed");saved();tap("guided-done")
  tap("tab-progress");XCTAssertTrue(item("progress-session-0").waitForExistence(timeout:10));shot("native-guided-history")
  XCTAssertFalse(item("progress-series-0").exists)
  app.terminate();app.launch();tap("tab-progress")
  XCTAssertTrue(item("progress-session-0").waitForExistence(timeout:10));shot("native-guided-reopened")
  XCTAssertFalse(item("progress-series-0").exists)
  tap("tab-home");XCTAssertTrue(item("home-goal-ring").waitForExistence(timeout:10))
  XCTAssertTrue(item("home-goal-ring").label.contains("2 of 3"))
 }
}
