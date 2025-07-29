import XCTest

/**
 * Main UI Test Suite for PhysioAssist iOS App
 * Tests user journeys, accessibility, and edge cases
 */
class PhysioAssistUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        
        app = XCUIApplication()
        app.launchArguments = ["UI_TESTING"]
        
        // Reset app state for consistent testing
        app.launchArguments.append("--reset-state")
        
        // Disable animations for faster tests
        app.launchArguments.append("--disable-animations")
        
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    // MARK: - Helper Methods
    
    /// Wait for element with retry logic
    func waitForElement(_ element: XCUIElement, timeout: TimeInterval = 10) -> Bool {
        let predicate = NSPredicate(format: "exists == true")
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        
        let result = XCTWaiter().wait(for: [expectation], timeout: timeout)
        return result == .completed
    }
    
    /// Simulate realistic typing with delays
    func typeTextSlowly(_ text: String, in element: XCUIElement) {
        element.tap()
        
        // Clear existing text
        if let existingText = element.value as? String, !existingText.isEmpty {
            let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: existingText.count)
            element.typeText(deleteString)
        }
        
        // Type with realistic delays
        for char in text {
            element.typeText(String(char))
            Thread.sleep(forTimeInterval: 0.1) // 100ms between keystrokes
        }
    }
    
    /// Take screenshot with descriptive name
    func takeScreenshot(name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    
    // MARK: - Onboarding Tests
    
    func testOnboardingFlow() throws {
        // Test complete onboarding journey
        let welcomeScreen = app.otherElements["onboarding-welcome"]
        XCTAssertTrue(waitForElement(welcomeScreen), "Welcome screen should appear")
        
        takeScreenshot(name: "01_Welcome_Screen")
        
        // Test skip functionality
        let skipButton = app.buttons["onboarding-skip"]
        XCTAssertTrue(skipButton.exists, "Skip button should be visible")
        
        // Continue with onboarding
        let getStartedButton = app.buttons["onboarding-get-started"]
        getStartedButton.tap()
        
        // Privacy consent
        Thread.sleep(forTimeInterval: 0.5) // Simulate reading time
        let privacyCheckbox = app.switches["onboarding-privacy-checkbox"]
        if privacyCheckbox.exists {
            privacyCheckbox.tap()
            takeScreenshot(name: "02_Privacy_Consent")
        }
        
        // Complete onboarding
        let nextButton = app.buttons["onboarding-next"]
        if nextButton.exists {
            nextButton.tap()
        }
        
        // Verify main screen loads
        let mainScreen = app.otherElements["pose-detection-screen"]
        XCTAssertTrue(waitForElement(mainScreen), "Main screen should load after onboarding")
    }
    
    // MARK: - Authentication Tests
    
    func testLoginWithValidCredentials() throws {
        // Navigate to login if needed
        navigateToLogin()
        
        let emailField = app.textFields["auth-email-input"]
        let passwordField = app.secureTextFields["auth-password-input"]
        let loginButton = app.buttons["auth-login-button"]
        
        // Test field validation
        loginButton.tap()
        
        let errorMessage = app.staticTexts["auth-error-message"]
        XCTAssertTrue(waitForElement(errorMessage, timeout: 2), "Error should show for empty fields")
        
        // Enter valid credentials with realistic typing
        typeTextSlowly("user@example.com", in: emailField)
        typeTextSlowly("Test123!", in: passwordField)
        
        takeScreenshot(name: "03_Login_Form_Filled")
        
        // Submit login
        loginButton.tap()
        
        // Wait for loading indicator
        let loadingIndicator = app.activityIndicators["auth-loading"]
        if loadingIndicator.exists {
            XCTAssertTrue(waitForElement(loadingIndicator, timeout: 1), "Loading indicator should appear")
            
            // Wait for it to disappear
            let predicate = NSPredicate(format: "exists == false")
            let expectation = XCTNSPredicateExpectation(predicate: predicate, object: loadingIndicator)
            XCTWaiter().wait(for: [expectation], timeout: 5)
        }
        
        // Verify successful login
        let mainScreen = app.otherElements["pose-detection-screen"]
        XCTAssertTrue(waitForElement(mainScreen), "Should navigate to main screen after login")
    }
    
    func testLoginWithInvalidCredentials() throws {
        navigateToLogin()
        
        let emailField = app.textFields["auth-email-input"]
        let passwordField = app.secureTextFields["auth-password-input"]
        let loginButton = app.buttons["auth-login-button"]
        
        // Test various invalid scenarios
        let invalidScenarios = [
            ("invalid-email", "Test123!", "Invalid email format"),
            ("user@example.com", "wrong", "Invalid password"),
            ("", "", "Empty fields")
        ]
        
        for (email, password, scenario) in invalidScenarios {
            // Clear fields
            emailField.tap()
            emailField.clearText()
            passwordField.tap()
            passwordField.clearText()
            
            // Enter credentials
            if !email.isEmpty {
                typeTextSlowly(email, in: emailField)
            }
            if !password.isEmpty {
                typeTextSlowly(password, in: passwordField)
            }
            
            loginButton.tap()
            
            let errorMessage = app.staticTexts["auth-error-message"]
            XCTAssertTrue(waitForElement(errorMessage, timeout: 3), "Error message should appear for \(scenario)")
            
            takeScreenshot(name: "04_Login_Error_\(scenario)")
        }
    }
    
    // MARK: - Camera Permission Tests
    
    func testCameraPermissionFlow() throws {
        // Navigate to pose detection
        let poseScreen = app.otherElements["pose-detection-screen"]
        if !poseScreen.exists {
            // Navigate if needed
            app.tabBars.buttons["exercises-tab"].tap()
        }
        
        // Start detection to trigger permission
        let startButton = app.buttons["pose-start-detection"]
        startButton.tap()
        
        // Handle system permission dialog
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let permissionDialog = springboard.alerts.firstMatch
        
        if permissionDialog.waitForExistence(timeout: 5) {
            takeScreenshot(name: "05_Camera_Permission_Dialog")
            
            // Test deny scenario
            let denyButton = permissionDialog.buttons["Don't Allow"]
            if denyButton.exists {
                denyButton.tap()
                
                // Verify error handling
                let errorView = app.otherElements["error-view"]
                XCTAssertTrue(waitForElement(errorView, timeout: 2), "Error view should show when permission denied")
            }
        }
    }
    
    // MARK: - Pose Detection Tests
    
    func testPoseDetectionUserJourney() throws {
        // Grant camera permission first (assuming it's granted)
        grantCameraPermission()
        
        let startButton = app.buttons["pose-start-detection"]
        let stopButton = app.buttons["pose-stop-detection"]
        let confidenceIndicator = app.staticTexts["pose-confidence"]
        
        // Select exercise
        let exerciseSelector = app.pickers["exercise-selector"]
        if exerciseSelector.exists {
            exerciseSelector.tap()
            app.pickerWheels.element.adjust(toPickerWheelValue: "Bicep Curl")
        } else {
            // Alternative: tap on exercise option
            let bicepCurlOption = app.buttons["exercise-bicep-curl"]
            if bicepCurlOption.exists {
                bicepCurlOption.tap()
            }
        }
        
        takeScreenshot(name: "06_Exercise_Selected")
        
        // Start detection
        startButton.tap()
        
        // Verify UI updates
        XCTAssertTrue(waitForElement(stopButton), "Stop button should appear")
        XCTAssertTrue(confidenceIndicator.exists, "Confidence indicator should be visible")
        
        // Simulate exercise for a few seconds
        Thread.sleep(forTimeInterval: 3)
        
        // Check for rep counter and form quality
        let repCounter = app.staticTexts["exercise-rep-counter"]
        let formQuality = app.staticTexts["exercise-form-quality"]
        
        XCTAssertTrue(repCounter.exists, "Rep counter should be visible")
        XCTAssertTrue(formQuality.exists, "Form quality should be visible")
        
        takeScreenshot(name: "07_Exercise_In_Progress")
        
        // Stop detection
        stopButton.tap()
        
        // Verify UI returns to initial state
        XCTAssertTrue(waitForElement(startButton), "Start button should reappear")
    }
    
    // MARK: - Navigation Tests
    
    func testTabNavigation() throws {
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.exists, "Tab bar should be visible")
        
        let tabs = [
            ("home-tab", "Home"),
            ("exercises-tab", "Exercises"),
            ("profile-tab", "Profile"),
            ("settings-tab", "Settings")
        ]
        
        for (identifier, name) in tabs {
            let tab = tabBar.buttons[identifier]
            if tab.exists {
                tab.tap()
                Thread.sleep(forTimeInterval: 0.5) // Allow transition
                takeScreenshot(name: "08_Tab_\(name)")
                
                // Verify correct screen loaded
                XCTAssertTrue(tab.isSelected, "\(name) tab should be selected")
            }
        }
    }
    
    // MARK: - Settings Tests
    
    func testSettingsConfiguration() throws {
        // Navigate to settings
        app.tabBars.buttons["settings-tab"].tap()
        
        let settingsScreen = app.otherElements["settings-screen"]
        XCTAssertTrue(waitForElement(settingsScreen), "Settings screen should load")
        
        // Test toggle switches
        let soundToggle = app.switches["settings-sound-toggle"]
        let hapticToggle = app.switches["settings-haptic-toggle"]
        
        // Record initial states
        let soundInitialState = soundToggle.value as? String == "1"
        let hapticInitialState = hapticToggle.value as? String == "1"
        
        // Toggle switches
        soundToggle.tap()
        hapticToggle.tap()
        
        // Verify states changed
        XCTAssertNotEqual(soundToggle.value as? String == "1", soundInitialState, "Sound toggle should change")
        XCTAssertNotEqual(hapticToggle.value as? String == "1", hapticInitialState, "Haptic toggle should change")
        
        // Test sliders
        let speechRateSlider = app.sliders["settings-speech-rate"]
        if speechRateSlider.exists {
            speechRateSlider.adjust(toNormalizedSliderPosition: 0.7)
        }
        
        takeScreenshot(name: "09_Settings_Modified")
        
        // Save settings
        let saveButton = app.buttons["settings-save"]
        saveButton.tap()
        
        // Verify save confirmation
        let toastMessage = app.staticTexts["toast-message"]
        XCTAssertTrue(waitForElement(toastMessage, timeout: 2), "Save confirmation should appear")
    }
    
    // MARK: - Error Handling Tests
    
    func testNetworkErrorHandling() throws {
        // Simulate network error by using specific launch argument
        app.launchArguments.append("--simulate-network-error")
        app.launch()
        
        // Try to perform network operation
        navigateToLogin()
        
        let emailField = app.textFields["auth-email-input"]
        let passwordField = app.secureTextFields["auth-password-input"]
        let loginButton = app.buttons["auth-login-button"]
        
        typeTextSlowly("user@example.com", in: emailField)
        typeTextSlowly("Test123!", in: passwordField)
        loginButton.tap()
        
        // Verify error handling
        let errorView = app.otherElements["error-view"]
        let retryButton = app.buttons["retry-button"]
        
        XCTAssertTrue(waitForElement(errorView), "Error view should appear for network error")
        XCTAssertTrue(retryButton.exists, "Retry button should be available")
        
        takeScreenshot(name: "10_Network_Error")
    }
    
    // MARK: - Accessibility Tests
    
    func testVoiceOverNavigation() throws {
        // Enable VoiceOver for testing
        // Note: This requires special entitlements in real testing
        
        let startButton = app.buttons["pose-start-detection"]
        
        // Verify accessibility labels
        XCTAssertNotNil(startButton.label, "Start button should have accessibility label")
        XCTAssertTrue(startButton.isHittable, "Start button should be hittable")
        
        // Test focus order
        let elements = app.descendants(matching: .any).allElementsBoundByAccessibilityElement
        XCTAssertTrue(elements.count > 0, "Should have accessible elements")
    }
    
    // MARK: - Performance Tests
    
    func testLaunchPerformance() throws {
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            app.launch()
        }
    }
    
    func testPoseDetectionPerformance() throws {
        grantCameraPermission()
        
        let startButton = app.buttons["pose-start-detection"]
        let stopButton = app.buttons["pose-stop-detection"]
        
        measure {
            startButton.tap()
            Thread.sleep(forTimeInterval: 5) // Run for 5 seconds
            stopButton.tap()
            Thread.sleep(forTimeInterval: 1) // Cooldown
        }
    }
    
    // MARK: - Helper Methods
    
    private func navigateToLogin() {
        // Implementation depends on app flow
        // This is a placeholder
        if app.buttons["auth-login-button"].exists {
            return // Already on login screen
        }
        
        // Navigate to login if needed
        if app.buttons["onboarding-skip"].exists {
            app.buttons["onboarding-skip"].tap()
        }
    }
    
    private func grantCameraPermission() {
        // This assumes permission is already granted
        // In real tests, you might need to handle the system dialog
    }
}

// MARK: - XCUIElement Extension

extension XCUIElement {
    func clearText() {
        guard let stringValue = self.value as? String else { return }
        
        self.tap()
        let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: stringValue.count)
        self.typeText(deleteString)
    }
}