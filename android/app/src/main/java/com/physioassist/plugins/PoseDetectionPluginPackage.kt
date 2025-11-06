package com.physioassist.plugins

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessor.FrameProcessorPluginRegistry

/**
 * React Native package for registering the Pose Detection Frame Processor Plugin
 */
class PoseDetectionPluginPackage : ReactPackage {

    companion object {
        init {
            // Register the frame processor plugin with VisionCamera
            FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectPose") { proxy, options ->
                PoseDetectionPlugin(proxy, options)
            }
        }
    }

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return emptyList()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
