import XCTest

// Only run on the dedicated synthetic simulator, with a Release app installed.
// This verifies truthful camera recovery, NOT a camera-free treatment journey.
final class NoCameraUITests: XCTestCase {
  let app = XCUIApplication(bundleIdentifier: "org.reactjs.native.example.PhysioAssist")
  func item(_ id: String) -> XCUIElement {
    app.descendants(matching: .any).matching(identifier: id).firstMatch
  }
  func tap(_ id: String) {
    for _ in 0..<10 {
      if item(id).exists && item(id).isHittable { item(id).tap(); return }
      if item(id).exists && item(id).frame.minY < 60 { app.swipeDown() }
      else { app.swipeUp() }
    }
    XCTFail("Cannot reach \(id)")
  }
  func testReleaseNoCameraRecovery() {
    continueAfterFailure = false
    app.launch()
    if item("onboarding-get-started").waitForExistence(timeout: 3) {
      tap("onboarding-get-started"); tap("onboarding-privacy-checkbox"); tap("onboarding-next")
      for _ in 0..<10 { if item("demo-login-button").exists { break }; tap("onboarding-next") }
    }
    if item("demo-login-button").exists { tap("demo-login-button") }
    XCTAssertTrue(item("tab-exercises").waitForExistence(timeout: 20))
    tap("tab-exercises")
    if app.alerts.firstMatch.exists { app.alerts.buttons.firstMatch.tap() }
    if item("plan-joint-shoulder").exists { tap("plan-joint-shoulder"); tap("plan-save") }
    tap("start-exercise-button")
    if app.alerts.firstMatch.waitForExistence(timeout: 2) { app.alerts.buttons.firstMatch.tap() }
    XCTAssertTrue(item("no-camera").waitForExistence(timeout: 15))
    XCTAssertFalse(item("use-practice-mode").exists)
    XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'pretend body'")).firstMatch.exists)
    XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'practice mode'")).firstMatch.exists)
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'Camera tracking is unavailable here'")).firstMatch.exists)
    let image = XCTAttachment(screenshot: app.screenshot())
    image.name = "release-no-camera-truthful"
    image.lifetime = .keepAlways
    add(image)
    tap("camera-help-back")
    XCTAssertTrue(item("start-exercise-button").waitForExistence(timeout: 10))
    XCTAssertFalse(item("no-camera").exists)
  }
}
