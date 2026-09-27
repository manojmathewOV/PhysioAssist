import XCTest
final class ReferenceUITests: XCTestCase {
 let app = XCUIApplication(bundleIdentifier: "org.reactjs.native.example.PhysioAssist")
 func item(_ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
 func tap(_ id: String) {
   for _ in 0..<10 { if item(id).exists && item(id).isHittable { item(id).tap(); return }; if item(id).exists && item(id).frame.minY < 60 { app.swipeDown() } else { app.swipeUp() } }
   XCTFail("Cannot reach \(id): \(app.debugDescription)")
 }
 func shot(_ name: String) { let a = XCTAttachment(screenshot: app.screenshot()); a.name=name; a.lifetime = .keepAlways; add(a) }
 func testNativeReference() {
   continueAfterFailure = false; app.launch()
   if item("onboarding-get-started").waitForExistence(timeout: 3) {
     tap("onboarding-get-started");tap("onboarding-privacy-checkbox");tap("onboarding-next")
     for _ in 0..<10 { if item("demo-login-button").exists { break }; tap("onboarding-next") }
   }
   if item("demo-login-button").exists { tap("demo-login-button") }
   XCTAssertTrue(item("tab-exercises").waitForExistence(timeout: 20));tap("tab-exercises")
   if app.alerts.firstMatch.exists { app.alerts.buttons.firstMatch.tap() }
   if item("plan-joint-shoulder").exists { tap("plan-joint-shoulder");tap("plan-save") }
   tap("exercise-setup-open")
   if item("exercise-video-add").exists { tap("exercise-video-add") } else { tap("exercise-video-change") }
   let field=item("video-link-input");XCTAssertTrue(field.waitForExistence(timeout: 10));field.tap(); if let old = field.value as? String, old.hasPrefix("http") { field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: old.count)) };field.typeText("https://www.youtube.com/watch?v=M7lc1UVf-VE&t=8s")
   tap("video-link-save")
   for _ in 0..<6 { if item("reference-play-pause").isHittable { break };app.swipeDown() }
   XCTAssertTrue(item("reference-play-pause").waitForExistence(timeout: 25));
   let enabled = NSPredicate(format: "enabled == true")
   expectation(for: enabled, evaluatedWith: item("reference-play-pause"));waitForExpectations(timeout: 30)
   tap("reference-play-pause")
   let playing = NSPredicate(format: "label CONTAINS 'playing'")
   expectation(for: playing, evaluatedWith: item("reference-player-state"));waitForExpectations(timeout: 25)
   shot("native-reference-playing")
   tap("reference-play-pause");tap("reference-enlarge");shot("native-reference-paused-enlarged")
   XCTAssertTrue(item("reference-replay").isEnabled)
   tap("reference-replay")
   expectation(for: playing, evaluatedWith: item("reference-player-state"));waitForExpectations(timeout: 15)
   tap("reference-play-pause")
   tap("exercise-setup-done"); tap("start-exercise-button")
   if app.alerts.firstMatch.waitForExistence(timeout: 3) { app.alerts.buttons.firstMatch.tap() }
   XCTAssertTrue(item("use-practice-mode").waitForExistence(timeout: 20));tap("use-practice-mode")
   XCTAssertTrue(item("follow-along-toggle").waitForExistence(timeout: 20));tap("follow-along-toggle")
   expectation(for: enabled, evaluatedWith: item("reference-play-pause"));waitForExpectations(timeout: 30)
   tap("reference-play-pause")
   expectation(for: playing, evaluatedWith: item("reference-player-state"));waitForExpectations(timeout: 20)
   tap("exercise-pause")
   let playerPaused = NSPredicate(format: "label == 'Play video'")
   expectation(for: playerPaused, evaluatedWith: item("reference-play-pause"));waitForExpectations(timeout: 10)
   XCTAssertFalse(item("reference-play-pause").isEnabled);shot("native-live-paused")
   tap("exercise-pause")
   expectation(for: playing, evaluatedWith: item("reference-player-state"));waitForExpectations(timeout: 15)
   tap("follow-along-toggle");tap("follow-along-toggle")
   expectation(for: playing, evaluatedWith: item("reference-player-state"));waitForExpectations(timeout: 15)
   tap("reference-play-pause");tap("follow-along-toggle");tap("follow-along-toggle")
   expectation(for: playerPaused, evaluatedWith: item("reference-play-pause"));waitForExpectations(timeout: 10)
   XCTAssertTrue(item("exercise-pause").isHittable);shot("native-live-manual-pause")
   tap("exercise-end")
   XCTAssertTrue(item("exercise-summary").waitForExistence(timeout: 10))
 }
}
