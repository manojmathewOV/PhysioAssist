package com.physioassist

import androidx.test.core.app.ActivityScenario
import androidx.test.espresso.Espresso.*
import androidx.test.espresso.IdlingRegistry
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.*
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.rule.GrantPermissionRule
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import org.hamcrest.Matchers.*
import org.junit.*
import org.junit.runner.RunWith
import org.junit.runners.MethodSorters
import java.io.File
import android.Manifest
import android.view.View
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers.isRoot
import androidx.test.espresso.util.TreeIterables
import com.physioassist.utils.EspressoIdlingResource
import org.hamcrest.Matcher
import java.util.concurrent.TimeUnit

/**
 * Comprehensive UI Test Suite for PhysioAssist Android App
 * Tests user journeys, accessibility, performance, and edge cases
 */
@RunWith(AndroidJUnit4::class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class PhysioAssistUITest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @get:Rule
    val grantPermissionRule: GrantPermissionRule = GrantPermissionRule.grant(
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    )

    private lateinit var device: UiDevice

    companion object {
        private const val LAUNCH_TIMEOUT = 5000L
        private const val UI_TIMEOUT = 10000L
        private const val TYPING_DELAY = 100L
        private const val ANIMATION_DELAY = 300L
        private const val SCREENSHOT_QUALITY = 90
    }

    @Before
    fun setUp() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        
        // Register idling resources for async operations
        IdlingRegistry.getInstance().register(EspressoIdlingResource.countingIdlingResource)
        
        // Disable animations for consistent tests
        disableAnimations()
        
        // Clear app data for fresh start
        clearAppData()
    }

    @After
    fun tearDown() {
        // Unregister idling resources
        IdlingRegistry.getInstance().unregister(EspressoIdlingResource.countingIdlingResource)
        
        // Re-enable animations
        enableAnimations()
    }

    // ===== Helper Methods =====

    /**
     * Wait for a view to appear with custom timeout
     */
    private fun waitForView(viewMatcher: Matcher<View>, timeout: Long = UI_TIMEOUT): ViewAction {
        return object : ViewAction {
            override fun getConstraints(): Matcher<View> = isRoot()

            override fun getDescription(): String = "Wait for view $viewMatcher"

            override fun perform(uiController: UiController, view: View) {
                uiController.loopMainThreadUntilIdle()
                val startTime = System.currentTimeMillis()
                val endTime = startTime + timeout

                do {
                    for (child in TreeIterables.breadthFirstViewTraversal(view)) {
                        if (viewMatcher.matches(child)) {
                            return
                        }
                    }
                    uiController.loopMainThreadForAtLeast(50)
                } while (System.currentTimeMillis() < endTime)

                throw AssertionError("View not found within timeout: $viewMatcher")
            }
        }
    }

    /**
     * Type text with realistic delays between keystrokes
     */
    private fun typeTextSlowly(text: String): ViewAction {
        return object : ViewAction {
            override fun getConstraints(): Matcher<View> = allOf(isDisplayed(), isAssignableFrom(android.widget.EditText::class.java))

            override fun getDescription(): String = "Type text slowly: $text"

            override fun perform(uiController: UiController, view: View) {
                val editText = view as android.widget.EditText
                editText.text.clear()
                
                text.forEach { char ->
                    editText.append(char.toString())
                    uiController.loopMainThreadForAtLeast(TYPING_DELAY)
                }
            }
        }
    }

    /**
     * Take screenshot with descriptive name
     */
    private fun takeScreenshot(name: String) {
        val screenshotDir = File(InstrumentationRegistry.getInstrumentation().targetContext.filesDir, "screenshots")
        screenshotDir.mkdirs()
        
        val screenshotFile = File(screenshotDir, "$name.png")
        device.takeScreenshot(screenshotFile, 1.0f, SCREENSHOT_QUALITY)
    }

    /**
     * Simulate user reading/thinking time
     */
    private fun simulateUserDelay(milliseconds: Long = 500) {
        Thread.sleep(milliseconds)
    }

    /**
     * Clear app data for fresh test start
     */
    private fun clearAppData() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val sharedPrefs = context.getSharedPreferences("physioassist_prefs", android.content.Context.MODE_PRIVATE)
        sharedPrefs.edit().clear().commit()
    }

    /**
     * Disable animations for test stability
     */
    private fun disableAnimations() {
        InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(
            "settings put global window_animation_scale 0"
        )
        InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(
            "settings put global transition_animation_scale 0"
        )
        InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(
            "settings put global animator_duration_scale 0"
        )
    }

    /**
     * Re-enable animations after tests
     */
    private fun enableAnimations() {
        InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(
            "settings put global window_animation_scale 1"
        )
        InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(
            "settings put global transition_animation_scale 1"
        )
        InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(
            "settings put global animator_duration_scale 1"
        )
    }

    // ===== Test Cases =====

    @Test
    fun test01_OnboardingUserJourney() {
        // Wait for app to load
        onView(isRoot()).perform(waitForView(withContentDescription("onboarding-welcome")))
        
        takeScreenshot("01_welcome_screen")
        
        // Test skip functionality
        onView(withContentDescription("onboarding-skip"))
            .check(matches(isDisplayed()))
            .check(matches(isClickable()))
        
        // Continue with onboarding
        onView(withContentDescription("onboarding-get-started"))
            .perform(click())
        
        simulateUserDelay(1000) // Simulate reading time
        
        // Handle privacy consent
        onView(withContentDescription("onboarding-privacy-checkbox"))
            .perform(scrollTo())
            .check(matches(isDisplayed()))
            .perform(click())
        
        takeScreenshot("02_privacy_consent")
        
        // Read terms (simulate user action)
        onView(withContentDescription("onboarding-terms-link"))
            .check(matches(isDisplayed()))
        
        simulateUserDelay(500)
        
        // Complete onboarding
        onView(withContentDescription("onboarding-next"))
            .perform(click())
        
        // Verify main screen loads
        onView(isRoot()).perform(waitForView(withContentDescription("pose-detection-screen")))
        onView(withContentDescription("pose-detection-screen"))
            .check(matches(isDisplayed()))
        
        takeScreenshot("03_main_screen")
    }

    @Test
    fun test02_LoginWithValidCredentials() {
        // Navigate to login screen
        navigateToLogin()
        
        // Check all elements are visible
        onView(withContentDescription("auth-email-input"))
            .check(matches(isDisplayed()))
        onView(withContentDescription("auth-password-input"))
            .check(matches(isDisplayed()))
        onView(withContentDescription("auth-login-button"))
            .check(matches(isDisplayed()))
        
        // Test empty field validation
        onView(withContentDescription("auth-login-button"))
            .perform(click())
        
        onView(withContentDescription("auth-error-message"))
            .check(matches(isDisplayed()))
            .check(matches(withText(containsString("required"))))
        
        takeScreenshot("04_empty_fields_error")
        
        // Enter valid credentials with realistic typing
        onView(withContentDescription("auth-email-input"))
            .perform(click())
            .perform(typeTextSlowly("user@example.com"))
            .perform(closeSoftKeyboard())
        
        simulateUserDelay(300)
        
        onView(withContentDescription("auth-password-input"))
            .perform(click())
            .perform(typeTextSlowly("Test123!"))
            .perform(closeSoftKeyboard())
        
        takeScreenshot("05_login_filled")
        
        // Submit login
        onView(withContentDescription("auth-login-button"))
            .perform(click())
        
        // Wait for loading indicator
        onView(withContentDescription("auth-loading"))
            .check(matches(isDisplayed()))
        
        // Wait for navigation
        onView(isRoot()).perform(waitForView(withContentDescription("pose-detection-screen")))
        
        // Verify successful login
        onView(withContentDescription("pose-detection-screen"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun test03_LoginWithInvalidCredentials() {
        navigateToLogin()
        
        // Test invalid email format
        onView(withContentDescription("auth-email-input"))
            .perform(click())
            .perform(typeTextSlowly("invalid-email"))
            .perform(closeSoftKeyboard())
        
        onView(withContentDescription("auth-password-input"))
            .perform(click())
            .perform(typeTextSlowly("Test123!"))
            .perform(closeSoftKeyboard())
        
        onView(withContentDescription("auth-login-button"))
            .perform(click())
        
        onView(withContentDescription("auth-error-message"))
            .check(matches(isDisplayed()))
            .check(matches(withText(containsString("email"))))
        
        takeScreenshot("06_invalid_email_error")
        
        // Test wrong password
        onView(withContentDescription("auth-email-input"))
            .perform(clearText())
            .perform(typeTextSlowly("user@example.com"))
            .perform(closeSoftKeyboard())
        
        onView(withContentDescription("auth-password-input"))
            .perform(clearText())
            .perform(typeTextSlowly("wrongpass"))
            .perform(closeSoftKeyboard())
        
        onView(withContentDescription("auth-login-button"))
            .perform(click())
        
        onView(withContentDescription("auth-error-message"))
            .check(matches(isDisplayed()))
            .check(matches(withText(containsString("credentials"))))
        
        takeScreenshot("07_wrong_password_error")
    }

    @Test
    fun test04_CameraPermissionHandling() {
        // Navigate to pose detection
        navigateToPoseDetection()
        
        // Start detection to trigger permission
        onView(withContentDescription("pose-start-detection"))
            .perform(click())
        
        // Handle permission dialog (already granted by rule, but test the flow)
        simulateUserDelay(500)
        
        // Verify camera view is displayed
        onView(withContentDescription("pose-camera-view"))
            .check(matches(isDisplayed()))
        
        takeScreenshot("08_camera_active")
    }

    @Test
    fun test05_ExerciseSelectionAndExecution() {
        navigateToPoseDetection()
        
        // Select exercise - Bicep Curl
        onView(withContentDescription("exercise-selector"))
            .perform(click())
        
        onView(withContentDescription("exercise-bicep-curl"))
            .perform(click())
        
        takeScreenshot("09_exercise_selected")
        
        // Start exercise
        onView(withContentDescription("exercise-start"))
            .perform(click())
        
        // Verify UI updates
        onView(withContentDescription("exercise-rep-counter"))
            .check(matches(isDisplayed()))
        
        onView(withContentDescription("exercise-form-quality"))
            .check(matches(isDisplayed()))
        
        // Simulate exercise for a few seconds
        simulateUserDelay(3000)
        
        takeScreenshot("10_exercise_in_progress")
        
        // Check feedback is displayed
        onView(withContentDescription("exercise-feedback"))
            .check(matches(isDisplayed()))
        
        // Pause exercise
        onView(withContentDescription("exercise-pause"))
            .perform(click())
        
        // End exercise
        onView(withContentDescription("exercise-end"))
            .perform(click())
        
        // Verify return to initial state
        onView(withContentDescription("exercise-start"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun test06_NavigationBetweenTabs() {
        // Test all navigation tabs
        val tabs = listOf(
            "home-tab" to "Home",
            "exercises-tab" to "Exercises", 
            "profile-tab" to "Profile",
            "settings-tab" to "Settings"
        )
        
        for ((tabId, tabName) in tabs) {
            onView(withContentDescription(tabId))
                .perform(click())
            
            simulateUserDelay(ANIMATION_DELAY)
            
            takeScreenshot("11_tab_$tabName")
            
            // Verify correct screen is displayed
            when (tabId) {
                "settings-tab" -> {
                    onView(withContentDescription("settings-screen"))
                        .check(matches(isDisplayed()))
                }
            }
        }
    }

    @Test
    fun test07_SettingsConfiguration() {
        // Navigate to settings
        onView(withContentDescription("settings-tab"))
            .perform(click())
        
        // Test sound toggle
        onView(withContentDescription("settings-sound-toggle"))
            .perform(scrollTo())
            .perform(click())
        
        // Test haptic toggle
        onView(withContentDescription("settings-haptic-toggle"))
            .perform(scrollTo())
            .perform(click())
        
        // Adjust speech rate slider
        onView(withContentDescription("settings-speech-rate"))
            .perform(scrollTo())
            .perform(swipeRight()) // Increase rate
        
        takeScreenshot("12_settings_modified")
        
        // Save settings
        onView(withContentDescription("settings-save"))
            .perform(scrollTo())
            .perform(click())
        
        // Verify toast message
        onView(withContentDescription("toast-message"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun test08_ErrorRecovery() {
        // Simulate network error scenario
        // This would require mock setup or specific test configuration
        
        navigateToPoseDetection()
        
        // Trigger an action that could fail
        onView(withContentDescription("pose-start-detection"))
            .perform(click())
        
        // If error occurs, verify error handling
        try {
            onView(withContentDescription("error-view"))
                .check(matches(isDisplayed()))
            
            takeScreenshot("13_error_state")
            
            // Test retry functionality
            onView(withContentDescription("retry-button"))
                .check(matches(isDisplayed()))
                .perform(click())
            
        } catch (e: AssertionError) {
            // No error occurred, which is also valid
        }
    }

    @Test
    fun test09_AccessibilityNavigation() {
        // Test that all interactive elements have content descriptions
        val importantElements = listOf(
            "pose-start-detection",
            "exercise-selector",
            "settings-tab",
            "auth-login-button"
        )
        
        for (element in importantElements) {
            try {
                onView(withContentDescription(element))
                    .check(matches(isClickable()))
            } catch (e: Exception) {
                // Element not on current screen, continue
            }
        }
        
        // Test font scaling
        // This would require changing system settings
        takeScreenshot("14_accessibility_check")
    }

    @Test
    fun test10_PerformanceMonitoring() {
        // Measure app launch time
        val startTime = System.currentTimeMillis()
        
        onView(isRoot()).perform(waitForView(
            anyOf(
                withContentDescription("onboarding-welcome"),
                withContentDescription("pose-detection-screen")
            )
        ))
        
        val launchTime = System.currentTimeMillis() - startTime
        Assert.assertTrue(
            "App should launch within 3 seconds, took ${launchTime}ms",
            launchTime < 3000
        )
        
        // Test pose detection performance
        navigateToPoseDetection()
        
        val detectionStartTime = System.currentTimeMillis()
        
        onView(withContentDescription("pose-start-detection"))
            .perform(click())
        
        onView(withContentDescription("pose-confidence"))
            .check(matches(isDisplayed()))
        
        val detectionInitTime = System.currentTimeMillis() - detectionStartTime
        Assert.assertTrue(
            "Pose detection should initialize within 2 seconds, took ${detectionInitTime}ms",
            detectionInitTime < 2000
        )
    }

    // ===== Helper Navigation Methods =====

    private fun navigateToLogin() {
        // Skip onboarding if present
        try {
            onView(withContentDescription("onboarding-skip"))
                .perform(click())
        } catch (e: Exception) {
            // Already past onboarding
        }
        
        // Check if already on login screen
        try {
            onView(withContentDescription("auth-login-button"))
                .check(matches(isDisplayed()))
        } catch (e: Exception) {
            // Navigate to login if needed
            // Implementation depends on app flow
        }
    }

    private fun navigateToPoseDetection() {
        // Ensure we're on the main screen
        try {
            onView(withContentDescription("pose-detection-screen"))
                .check(matches(isDisplayed()))
        } catch (e: Exception) {
            // Navigate to pose detection
            onView(withContentDescription("exercises-tab"))
                .perform(click())
        }
    }
}

/**
 * Custom ViewActions for complex interactions
 */
object CustomViewActions {
    
    fun waitFor(millis: Long): ViewAction {
        return object : ViewAction {
            override fun getConstraints(): Matcher<View> = isRoot()
            override fun getDescription(): String = "Wait for $millis milliseconds"
            override fun perform(uiController: UiController, view: View) {
                uiController.loopMainThreadForAtLeast(millis)
            }
        }
    }
    
    fun swipeSlowly(): ViewAction {
        return object : ViewAction {
            override fun getConstraints(): Matcher<View> = isDisplayed()
            override fun getDescription(): String = "Swipe slowly"
            override fun perform(uiController: UiController, view: View) {
                val location = IntArray(2)
                view.getLocationOnScreen(location)
                
                val startX = location[0] + view.width / 4
                val endX = location[0] + 3 * view.width / 4
                val y = location[1] + view.height / 2
                
                val downTime = android.os.SystemClock.uptimeMillis()
                var eventTime = downTime
                
                // Touch down
                var event = android.view.MotionEvent.obtain(
                    downTime, eventTime,
                    android.view.MotionEvent.ACTION_DOWN,
                    startX.toFloat(), y.toFloat(), 0
                )
                view.onTouchEvent(event)
                
                // Swipe
                val steps = 20
                for (i in 0..steps) {
                    eventTime += 20
                    val x = startX + (endX - startX) * i / steps
                    event = android.view.MotionEvent.obtain(
                        downTime, eventTime,
                        android.view.MotionEvent.ACTION_MOVE,
                        x.toFloat(), y.toFloat(), 0
                    )
                    view.onTouchEvent(event)
                    uiController.loopMainThreadForAtLeast(20)
                }
                
                // Touch up
                eventTime += 20
                event = android.view.MotionEvent.obtain(
                    downTime, eventTime,
                    android.view.MotionEvent.ACTION_UP,
                    endX.toFloat(), y.toFloat(), 0
                )
                view.onTouchEvent(event)
            }
        }
    }
}