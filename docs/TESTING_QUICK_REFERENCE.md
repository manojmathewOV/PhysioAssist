# Testing Quick Reference Card

## 🚀 Quick Start

### First Time Setup (macOS only)
```bash
./scripts/setup-ios-testing.sh
```

### Run All Tests
```bash
# Unit tests
npm test

# E2E tests on iOS Simulator
npm run build:e2e:ios && npm run test:e2e:ios
```

---

## 📱 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e:ios` | Run E2E tests on iPhone 15 Pro |
| `npm run test:e2e:ios:iphone14` | Run E2E tests on iPhone 14 |
| `npm run test:e2e:ios:ipad` | Run E2E tests on iPad Pro |
| `npm run build:e2e:ios` | Build app for testing |

---

## 🎯 What Each Test Suite Validates

### Unit Tests (`npm test`)
- ✅ Individual component rendering
- ✅ Service functions (pose detection, exercise validation)
- ✅ Redux state management
- ✅ Utility functions
- ✅ Form validation logic
- **Runtime**: ~30 seconds
- **Runs on**: Any platform (Linux, macOS, Windows)

### E2E Tests (`npm run test:e2e:ios`)
- ✅ Complete user workflows (onboarding → login → exercise)
- ✅ All UI components working together
- ✅ Navigation flows
- ✅ Camera integration
- ✅ Real-time pose detection
- ✅ Form submission and validation
- ✅ Settings persistence
- ✅ Error handling
- **Runtime**: ~15 minutes
- **Runs on**: macOS only (requires iOS Simulator)

---

## 📊 Test Coverage

Current targets: **70%** for all metrics

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## 🔍 Component Validation Matrix

| Component | Unit Test | Integration Test | E2E Test | Status |
|-----------|-----------|------------------|----------|--------|
| OnboardingScreen | ✅ | ✅ | ✅ | Complete |
| LoginScreen | ✅ | ✅ | ✅ | Complete |
| PoseDetectionScreen | ✅ | ✅ | ✅ | Complete |
| ExerciseSelector | ✅ | ✅ | ✅ | Complete |
| ExerciseControls | ✅ | ✅ | ✅ | Complete |
| ExerciseSummary | ✅ | ✅ | ✅ | Complete |
| SettingsScreen | ✅ | ✅ | ✅ | Complete |
| ProgressChart | ✅ | ✅ | ✅ | Complete |
| PoseOverlay | ✅ | ✅ | ✅ | Complete |
| ErrorBoundary | ✅ | ✅ | ✅ | Complete |

---

## 🐛 Quick Troubleshooting

### Unit Tests Fail
```bash
# Clear cache
npm run test -- --clearCache

# Update snapshots
npm run test -- -u
```

### E2E Tests Won't Start
```bash
# Rebuild app
rm -rf ios/build
npm run build:e2e:ios

# Reset simulator
xcrun simctl erase all
```

### Simulator Stuck
```bash
# Kill all simulators
killall Simulator

# Reboot device
xcrun simctl shutdown all
xcrun simctl boot "iPhone 15 Pro"
```

---

## 📂 Test File Locations

```
PhysioAssist/
├── src/
│   ├── __tests__/           # Unit & integration tests
│   │   ├── setup.ts         # Jest configuration
│   │   ├── e2e/             # Legacy E2E tests
│   │   └── platform/        # Platform-specific tests
│   ├── components/
│   │   └── __tests__/       # Component tests
│   └── services/
│       └── __tests__/       # Service tests
├── e2e/                     # Detox E2E tests
│   ├── jest.config.js       # E2E Jest config
│   └── componentValidation.e2e.ts
├── .detoxrc.js              # Detox configuration
└── jest.config.js           # Main Jest config
```

---

## ✅ Pre-Commit Checklist

Before committing code:

```bash
# 1. Run linter
npm run lint:fix

# 2. Type check
npm run type-check

# 3. Run unit tests
npm test

# 4. Check coverage
npm run test:coverage

# 5. (Optional) Run E2E tests
npm run test:e2e:ios
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions
- **Trigger**: Push to `main`, `develop`, `claude/**` or PR
- **Runs**: All unit tests + E2E tests on macOS runner
- **Duration**: ~20 minutes
- **View**: GitHub Actions tab

### Local CI Simulation
```bash
# Install act
brew install act

# Run workflow locally
act push
```

---

## 📖 Full Documentation

- **Detailed Guide**: `docs/IOS_SIMULATOR_TESTING.md`
- **Test Specs**: `e2e/componentValidation.e2e.ts`
- **Jest Config**: `jest.config.js`
- **Detox Config**: `.detoxrc.js`

---

## 💡 Pro Tips

1. **Speed up tests**: Use `--maxWorkers=1` for E2E
2. **Debug failing tests**: Add `--loglevel trace`
3. **Test specific component**: `npm test -- ComponentName`
4. **Update snapshots**: `npm test -- -u`
5. **Watch mode**: `npm run test:watch`

---

## 🎯 Testing Philosophy

### Test Pyramid
```
     /\     E2E Tests (Slow, High Confidence)
    /  \
   /    \   Integration Tests (Medium)
  /      \
 /________\ Unit Tests (Fast, Low Level)
```

### Coverage Goals
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test components working together
- **E2E Tests**: Test complete user workflows

### When to Run What
- **During Development**: `npm run test:watch`
- **Before Commit**: `npm test`
- **Before Push**: `npm run test:coverage`
- **Before Release**: `npm run test:e2e:ios`

---

## 📞 Need Help?

- Check `docs/IOS_SIMULATOR_TESTING.md` for detailed guide
- Review test files in `src/__tests__/` for examples
- Check GitHub Issues for known problems
- Contact the team for support
