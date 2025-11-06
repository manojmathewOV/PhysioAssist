//
//  PoseDetectionPlugin.m
//  PhysioAssist
//
//  Objective-C bridge for Swift Frame Processor Plugin
//

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

#if __has_include("PhysioAssist-Swift.h")
#import "PhysioAssist-Swift.h"
#else
#import <PhysioAssist-Swift.h>
#endif

// Register the plugin with VisionCamera
VISION_EXPORT_SWIFT_FRAME_PROCESSOR(PoseDetectionPlugin, detectPose)

// Module export for React Native
@interface RCT_EXTERN_MODULE(PoseDetectionPluginModule, NSObject)
@end
