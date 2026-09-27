source 'https://rubygems.org'

ruby file: '.ruby-version'

# G01/I01: version the native dependency resolver, not only its output.
# The JSON generator affects checksums of evaluated local podspecs.
# Gemfile.lock pins transitive tooling as well; use bundle exec for CocoaPods.
gem 'cocoapods', '1.16.2'
gem 'json', '2.9.1'
gem 'xcodeproj', '1.27.0'
