package com.physioassist.utils

import androidx.test.espresso.idling.CountingIdlingResource

/**
 * Idling Resource for Espresso UI Tests
 * Helps synchronize async operations with UI tests
 */
object EspressoIdlingResource {
    
    private const val RESOURCE_NAME = "GLOBAL"
    
    @JvmField
    val countingIdlingResource = CountingIdlingResource(RESOURCE_NAME)
    
    /**
     * Increment the idling resource counter
     * Call this when starting an async operation
     */
    fun increment() {
        countingIdlingResource.increment()
    }
    
    /**
     * Decrement the idling resource counter
     * Call this when an async operation completes
     */
    fun decrement() {
        if (!countingIdlingResource.isIdleNow) {
            countingIdlingResource.decrement()
        }
    }
    
    /**
     * Wrapper for async operations to automatically handle idling
     */
    inline fun <T> wrapAsync(crossinline operation: () -> T): T {
        increment()
        return try {
            operation()
        } finally {
            decrement()
        }
    }
}