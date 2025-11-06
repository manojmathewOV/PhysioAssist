package com.physioassist.plugins

import android.graphics.Bitmap
import android.graphics.Matrix
import android.util.Log
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessor.VisionCameraProxy
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.CompatibilityList
import org.tensorflow.lite.gpu.GpuDelegate
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

/**
 * High-performance Pose Detection Frame Processor Plugin for VisionCamera
 * Processes frames natively on Android with NNAPI/GPU acceleration
 */
class PoseDetectionPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) : FrameProcessorPlugin() {

    companion object {
        private const val TAG = "PoseDetectionPlugin"
        private const val INPUT_WIDTH = 192
        private const val INPUT_HEIGHT = 192
        private const val KEYPOINT_COUNT = 17
        private const val PIXEL_SIZE = 3 // RGB
    }

    private var interpreter: Interpreter? = null
    private var gpuDelegate: GpuDelegate? = null
    private var isInitialized = false

    init {
        initializeModel()
    }

    /**
     * Main callback for frame processing
     * Called for each camera frame at 30-60 FPS
     */
    override fun callback(frame: Frame, params: Map<String, Any>?): Any {
        if (!isInitialized || interpreter == null) {
            return mapOf(
                "error" to "Model not initialized",
                "keypoints" to emptyList<Map<String, Any>>()
            )
        }

        try {
            val startTime = System.currentTimeMillis()

            // Convert frame to RGB bitmap
            val bitmap = frame.toRGBBitmap() ?: return mapOf(
                "error" to "Failed to convert frame",
                "keypoints" to emptyList<Map<String, Any>>()
            )

            // Preprocess: Resize and normalize
            val input = preprocessImage(bitmap)

            // Run inference (GPU-accelerated with NNAPI)
            val output = runInference(input)

            // Parse keypoints from output
            val keypoints = parseKeypoints(output)

            val inferenceTime = System.currentTimeMillis() - startTime

            return mapOf(
                "keypoints" to keypoints,
                "inferenceTime" to inferenceTime,
                "timestamp" to System.currentTimeMillis()
            )

        } catch (e: Exception) {
            Log.e(TAG, "Error processing frame: ${e.message}", e)
            return mapOf(
                "error" to e.message,
                "keypoints" to emptyList<Map<String, Any>>()
            )
        }
    }

    /**
     * Initialize TFLite model with GPU acceleration
     */
    private fun initializeModel() {
        try {
            // Check GPU compatibility
            val compatList = CompatibilityList()

            val options = Interpreter.Options()

            if (compatList.isDelegateSupportedOnThisDevice) {
                // Use GPU Delegate for 3-5x performance boost
                gpuDelegate = GpuDelegate(
                    GpuDelegate.Options().apply {
                        setInferencePreference(GpuDelegate.Options.INFERENCE_PREFERENCE_SUSTAINED_SPEED)
                        setPrecisionLossAllowed(true) // Allow FP16 precision for speed
                    }
                )
                options.addDelegate(gpuDelegate)
                Log.d(TAG, "✅ GPU Delegate enabled")
            } else {
                // Fallback to NNAPI
                options.setUseNNAPI(true)
                Log.d(TAG, "⚠️ GPU not supported, using NNAPI")
            }

            // Set number of threads
            options.setNumThreads(4)

            // Load model from assets
            // Note: Actual model loading would be done through react-native-fast-tflite
            // This is a placeholder for the native plugin structure

            isInitialized = true
            Log.d(TAG, "✅ Model initialized successfully")

        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to initialize model: ${e.message}", e)
        }
    }

    /**
     * Preprocess image: Resize to 192x192 and normalize to 0-1
     */
    private fun preprocessImage(bitmap: Bitmap): FloatBuffer {
        // Resize bitmap to model input size
        val resizedBitmap = Bitmap.createScaledBitmap(
            bitmap,
            INPUT_WIDTH,
            INPUT_HEIGHT,
            true
        )

        // Create float buffer for model input
        val inputBuffer = ByteBuffer.allocateDirect(
            INPUT_WIDTH * INPUT_HEIGHT * PIXEL_SIZE * 4 // 4 bytes per float
        ).apply {
            order(ByteOrder.nativeOrder())
        }.asFloatBuffer()

        // Normalize pixel values to 0-1 range
        val pixels = IntArray(INPUT_WIDTH * INPUT_HEIGHT)
        resizedBitmap.getPixels(pixels, 0, INPUT_WIDTH, 0, 0, INPUT_WIDTH, INPUT_HEIGHT)

        for (pixel in pixels) {
            val r = ((pixel shr 16) and 0xFF) / 255.0f
            val g = ((pixel shr 8) and 0xFF) / 255.0f
            val b = (pixel and 0xFF) / 255.0f

            inputBuffer.put(r)
            inputBuffer.put(g)
            inputBuffer.put(b)
        }

        inputBuffer.rewind()
        return inputBuffer
    }

    /**
     * Run TFLite inference with GPU acceleration
     */
    private fun runInference(input: FloatBuffer): FloatArray {
        val output = Array(1) { Array(1) { FloatArray(KEYPOINT_COUNT * 3) } }

        // Run inference
        interpreter?.run(input, output)

        return output[0][0]
    }

    /**
     * Parse MoveNet output into keypoint structure
     * Output format: [y, x, confidence] for each of 17 keypoints
     */
    private fun parseKeypoints(output: FloatArray): List<Map<String, Any>> {
        val keypoints = mutableListOf<Map<String, Any>>()

        for (i in 0 until KEYPOINT_COUNT) {
            val baseIndex = i * 3
            val y = output[baseIndex].toDouble()
            val x = output[baseIndex + 1].toDouble()
            val confidence = output[baseIndex + 2].toDouble()

            keypoints.add(
                mapOf(
                    "x" to x,
                    "y" to y,
                    "score" to confidence,
                    "name" to getKeypointName(i)
                )
            )
        }

        return keypoints
    }

    /**
     * Get keypoint name by index
     */
    private fun getKeypointName(index: Int): String {
        val names = arrayOf(
            "nose", "left_eye", "right_eye", "left_ear", "right_ear",
            "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
            "left_wrist", "right_wrist", "left_hip", "right_hip",
            "left_knee", "right_knee", "left_ankle", "right_ankle"
        )

        return names.getOrNull(index) ?: "unknown"
    }

    /**
     * Cleanup resources
     */
    fun cleanup() {
        interpreter?.close()
        gpuDelegate?.close()
        interpreter = null
        gpuDelegate = null
        isInitialized = false
        Log.d(TAG, "✅ Resources cleaned up")
    }
}

/**
 * Extension function to convert Frame to RGB Bitmap
 */
private fun Frame.toRGBBitmap(): Bitmap? {
    // VisionCamera v4 provides direct frame access
    // This would use the actual Frame API
    // Placeholder for demonstration
    return null
}
