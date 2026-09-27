require 'xcodeproj'
require 'fileutils'
root=File.expand_path(ARGV.fetch(0))
FileUtils.mkdir_p(root)
FileUtils.cp(File.join(__dir__, "ReferenceUITests.swift"), File.join(root, "ReferenceUITests.swift"))
p=Xcodeproj::Project.new(File.join(root,'VideoProbe.xcodeproj'))
host=p.new_target(:application,'ProbeHost',:ios,'15.0')
test=p.new_target(:ui_test_bundle,'ReferenceUITests',:ios,'15.0')
[host,test].each do |t|
 t.build_configurations.each do |c|
  c.build_settings['SWIFT_VERSION']='5.0'
  c.build_settings['GENERATE_INFOPLIST_FILE']='YES'
  c.build_settings['PRODUCT_BUNDLE_IDENTIFIER']='org.physioassist.audit.'+t.name
  c.build_settings['CODE_SIGN_IDENTITY']='-'
  c.build_settings['CODE_SIGNING_ALLOWED']='YES'
  c.build_settings['TARGETED_DEVICE_FAMILY']='1,2'
 end
end
test.build_configurations.each { |c| c.build_settings['TEST_TARGET_NAME']=host.name }
test.add_dependency(host)
File.write(File.join(root,'Host.swift'), "import UIKit\n@main class Host: UIResponder, UIApplicationDelegate { var window: UIWindow?; func application(_ application: UIApplication,didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey:Any]?) -> Bool {window=UIWindow(frame: UIScreen.main.bounds);window?.rootViewController=UIViewController();window?.makeKeyAndVisible();return true} }\n")
host.add_file_references([p.main_group.new_file('Host.swift')])
test.add_file_references([p.main_group.new_file('ReferenceUITests.swift')])
p.save
scheme=Xcodeproj::XCScheme.new
scheme.add_build_target(host);scheme.add_build_target(test);scheme.add_test_target(test)
scheme.save_as(p.path,'VideoProbe',true)
puts 'Created a local XCTest UI driver; production app is not modified or reseeded.'
