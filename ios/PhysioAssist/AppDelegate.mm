#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTBridgeModule.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"PhysioAssist";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

// The official embedded player identifies the installed app, not YouTube.
@interface PhysioAppIdentity : NSObject <RCTBridgeModule>
@end
@implementation PhysioAppIdentity
RCT_EXPORT_MODULE(PhysioAppIdentity)
+ (BOOL)requiresMainQueueSetup { return NO; }
- (NSDictionary *)constantsToExport { return @{@"bundleIdentifier": [[NSBundle mainBundle] bundleIdentifier] ?: @""}; }
@end
