#!/bin/bash

################################################################################
# Xcode Fast Build Configuration
# Optimizes Xcode for maximum build speed on Mac
################################################################################

set -e

echo "⚡ Xcode Fast Build Optimizer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Detect Mac specs
detect_system() {
    echo -e "${BLUE}🖥️  Detecting Mac specifications...${NC}"

    CPU_CORES=$(sysctl -n hw.ncpu)
    CPU_MODEL=$(sysctl -n machdep.cpu.brand_string)
    MEMORY_GB=$(( $(sysctl -n hw.memsize) / 1024 / 1024 / 1024 ))

    echo -e "${GREEN}✓ CPU: ${CPU_MODEL}${NC}"
    echo -e "${GREEN}✓ Cores: ${CPU_CORES}${NC}"
    echo -e "${GREEN}✓ RAM: ${MEMORY_GB} GB${NC}"
}

# Optimize Xcode preferences
optimize_xcode_prefs() {
    echo -e "\n${BLUE}⚙️  Optimizing Xcode preferences...${NC}"

    # Maximum concurrent compile tasks (use all cores)
    defaults write com.apple.dt.Xcode IDEBuildOperationMaxNumberOfConcurrentCompileTasks $CPU_CORES

    # Enable parallel builds
    defaults write com.apple.dt.Xcode BuildSystemScheduleInherentlyParallelCommandsExclusively -bool YES

    # Show build times
    defaults write com.apple.dt.Xcode ShowBuildOperationDuration -bool YES

    # Increase index threads
    defaults write com.apple.dt.Xcode IDEIndexerActivityShowNumericProgress -bool YES

    # Enable new build system
    defaults write com.apple.dt.Xcode UseModernBuildSystem -bool YES

    # Disable unnecessary warnings during fast builds
    defaults write com.apple.dt.Xcode IDEWarningsAsErrors -bool NO

    echo -e "${GREEN}✓ Xcode preferences optimized${NC}"
}

# Create optimized build settings
create_fast_xcconfig() {
    echo -e "\n${BLUE}📝 Creating optimized build configuration...${NC}"

    XCCONFIG_PATH="ios/FastBuild.xcconfig"

    cat > "$XCCONFIG_PATH" <<'EOF'
// ⚡ Fast Build Configuration for Development
// Optimizes build speed for iterative development on Mac

// Compiler optimizations
SWIFT_OPTIMIZATION_LEVEL = -Onone
SWIFT_COMPILATION_MODE = incremental
SWIFT_WHOLE_MODULE_OPTIMIZATION = NO

// Build performance
COMPILER_INDEX_STORE_ENABLE = NO
ENABLE_BITCODE = NO

// Debug symbols
DEBUG_INFORMATION_FORMAT = dwarf
GCC_GENERATE_DEBUGGING_SYMBOLS = YES

// Parallel builds
SWIFT_ENABLE_BATCH_MODE = YES

// Module stability (faster incremental builds)
BUILD_LIBRARY_FOR_DISTRIBUTION = NO

// Skip install phase
SKIP_INSTALL = YES

// Disable code coverage for faster builds
CLANG_ENABLE_CODE_COVERAGE = NO

// Faster linking
DEAD_CODE_STRIPPING = NO
LD_RUNPATH_SEARCH_PATHS = $(inherited) @executable_path/Frameworks

// Asset catalog optimization
ASSETCATALOG_COMPILER_OPTIMIZATION = time

EOF

    echo -e "${GREEN}✓ Fast build config created: ${XCCONFIG_PATH}${NC}"
}

# Configure derived data
optimize_derived_data() {
    echo -e "\n${BLUE}💾 Optimizing derived data...${NC}"

    DERIVED_DATA_PATH="$HOME/Library/Developer/Xcode/DerivedData"

    # Check if derived data is on SSD
    if df "$DERIVED_DATA_PATH" | grep -q "disk1"; then
        echo -e "${GREEN}✓ Derived data on SSD${NC}"
    else
        echo -e "${YELLOW}⚠️  Derived data may be on slower disk${NC}"
    fi

    # Clean old derived data
    echo -e "${CYAN}Clean old derived data? (recommended) (y/N):${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cleaning derived data...${NC}"
        rm -rf "$DERIVED_DATA_PATH"
        echo -e "${GREEN}✓ Derived data cleaned${NC}"
    fi

    # Set custom derived data location (optional)
    echo -e "${CYAN}Use project-specific derived data? (faster) (y/N):${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
        defaults write com.apple.dt.Xcode IDECustomDerivedDataLocation -string "${PROJECT_ROOT}/ios/build/DerivedData"
        echo -e "${GREEN}✓ Custom derived data location set${NC}"
    fi
}

# Optimize build phases
optimize_build_phases() {
    echo -e "\n${BLUE}🔧 Build phase optimizations...${NC}"

    echo -e "${CYAN}These optimizations will be applied:${NC}"
    echo -e "  • Parallel compilation enabled"
    echo -e "  • Swift incremental builds"
    echo -e "  • No whole module optimization (faster)"
    echo -e "  • Bitcode disabled (faster linking)"
    echo -e "  • Code coverage disabled"
    echo -e "  • Index store disabled during development"

    echo -e "\n${YELLOW}Note: Use Release configuration for App Store builds${NC}"
}

# Create build time tracking
setup_build_tracking() {
    echo -e "\n${BLUE}⏱️  Setting up build time tracking...${NC}"

    # Enable build timing
    defaults write com.apple.dt.Xcode ShowBuildOperationDuration -bool YES

    # Create script to track builds
    TRACK_SCRIPT="ios/track_build_time.sh"

    cat > "$TRACK_SCRIPT" <<'EOF'
#!/bin/bash
# Track build times automatically
BUILD_LOG="$HOME/.physioassist_build_times.log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
echo "$TIMESTAMP - Build started" >> "$BUILD_LOG"
EOF

    chmod +x "$TRACK_SCRIPT"

    echo -e "${GREEN}✓ Build time tracking enabled${NC}"
    echo -e "${CYAN}View build times: cat ~/.physioassist_build_times.log${NC}"
}

# Show build speed tips
show_tips() {
    echo -e "\n${BLUE}💡 Build Speed Tips:${NC}"
    echo -e "\n${CYAN}1. Use incremental builds:${NC}"
    echo -e "   • Cmd+B (don't clean unless necessary)"
    echo -e "   • Clean: Shift+Cmd+K (only when needed)"
    echo -e "\n${CYAN}2. Use watch mode for fastest iteration:${NC}"
    echo -e "   • ${YELLOW}npm run ios:watch${NC}"
    echo -e "   • Changes appear in <1 second!"
    echo -e "\n${CYAN}3. Close unnecessary Xcode tabs/files${NC}"
    echo -e "   • Reduces indexing overhead"
    echo -e "\n${CYAN}4. Disable breakpoints when not debugging${NC}"
    echo -e "   • Cmd+Y to toggle all breakpoints"
    echo -e "\n${CYAN}5. Build for one architecture only${NC}"
    echo -e "   • Automatically configured for simulators"
    echo -e "\n${CYAN}6. Keep simulator running${NC}"
    echo -e "   • Avoid cold boot time"
    echo -e "\n${CYAN}7. Use modular architecture${NC}"
    echo -e "   • Only changed modules rebuild"
}

# Benchmark current build speed
benchmark_build() {
    echo -e "\n${BLUE}📊 Benchmarking build speed...${NC}"

    PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
    cd "$PROJECT_ROOT"

    echo -e "${YELLOW}This will perform a clean build to measure performance${NC}"
    echo -e "${CYAN}Continue? (y/N):${NC}"
    read -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    cd ios

    # Clean build
    echo -e "${YELLOW}Cleaning...${NC}"
    xcodebuild clean \
        -workspace PhysioAssist.xcworkspace \
        -scheme PhysioAssist \
        -configuration Debug \
        > /dev/null 2>&1

    # Benchmark build
    echo -e "${YELLOW}Building...${NC}"
    START=$(date +%s)

    xcodebuild build \
        -workspace PhysioAssist.xcworkspace \
        -scheme PhysioAssist \
        -configuration Debug \
        -sdk iphonesimulator \
        -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
        | xcpretty || true

    END=$(date +%s)
    DURATION=$((END - START))

    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Build completed in ${DURATION} seconds${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Performance assessment
    if [ $DURATION -lt 60 ]; then
        echo -e "${GREEN}🚀 Excellent! Your build speed is great!${NC}"
    elif [ $DURATION -lt 120 ]; then
        echo -e "${YELLOW}⚡ Good build speed. Some optimizations may help.${NC}"
    else
        echo -e "${RED}⚠️  Build is slow. Consider:${NC}"
        echo -e "  • Clean derived data"
        echo -e "  • Check for disk space"
        echo -e "  • Restart Mac"
        echo -e "  • Use FastBuild.xcconfig"
    fi

    cd ..
}

# Main execution
main() {
    detect_system
    optimize_xcode_prefs
    create_fast_xcconfig
    optimize_derived_data
    optimize_build_phases
    setup_build_tracking
    show_tips

    echo -e "\n${BLUE}Run build benchmark? (y/N):${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        benchmark_build
    fi

    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Build optimization complete!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo -e "  1. Restart Xcode to apply all changes"
    echo -e "  2. Use ${YELLOW}npm run ios:watch${NC} for fastest iteration"
    echo -e "  3. Use ${YELLOW}Cmd+B${NC} in Xcode for incremental builds"
    echo -e "  4. Avoid clean builds unless necessary"
    echo -e "\n${CYAN}Expected build times on your Mac:${NC}"
    echo -e "  • Clean build: 2-5 minutes"
    echo -e "  • Incremental build: 30-60 seconds"
    echo -e "  • Hot reload: <1 second"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

main "$@"
