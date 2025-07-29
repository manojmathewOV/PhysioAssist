# Contributing to PhysioAssist

First off, thank you for considering contributing to PhysioAssist! It's people like you that make PhysioAssist such a great tool for improving physiotherapy outcomes.

## 🎯 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 🚀 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots and animated GIFs if possible**
- **Include your environment details** (OS, browser, device)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Describe the current behavior and explain the expected behavior**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## 💻 Development Process

### Setting Up Your Development Environment

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/PhysioAssist.git
cd PhysioAssist
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

### Development Workflow

1. **Write Code**: Follow the existing code style and conventions
2. **Write Tests**: Add tests for any new functionality
3. **Run Tests**: `npm test`
4. **Check Linting**: `npm run lint`
5. **Test on Web**: `npm run web`
6. **Test on Mobile**: `npm run ios` or `npm run android`

### Coding Standards

#### TypeScript
- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type
- Use meaningful variable and function names

#### React Native
- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Follow React Native best practices

#### State Management
- Use Redux Toolkit for global state
- Keep state normalized
- Use selectors for derived state
- Write reducers that are pure functions

#### Testing
- Write unit tests for all services
- Write component tests for UI components
- Aim for >70% code coverage
- Use meaningful test descriptions

### Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add lateral raise exercise
fix: correct angle calculation for shoulder joint
docs: update README with new exercise instructions
test: add tests for goniometer service
```

### Adding New Exercises

1. Define the exercise in `src/data/exercises.ts`
2. Add validation logic in `src/services/exerciseValidationService.ts`
3. Add tests for the new exercise
4. Update documentation
5. Test thoroughly on all platforms

Example exercise definition:
```typescript
{
  id: 'lateral_raise',
  name: 'Lateral Raise',
  description: 'Raise arms to the side',
  phases: [
    {
      name: 'start',
      criteria: {
        jointAngles: {
          leftShoulder: { min: 0, max: 20 },
          rightShoulder: { min: 0, max: 20 }
        }
      }
    },
    {
      name: 'raised',
      criteria: {
        jointAngles: {
          leftShoulder: { min: 70, max: 100 },
          rightShoulder: { min: 70, max: 100 }
        }
      }
    }
  ]
}
```

## 📝 Documentation

- Update the README.md if you change functionality
- Add JSDoc comments to all functions
- Update type definitions
- Include examples in documentation

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
- Test file naming: `*.test.ts` or `*.test.tsx`
- Place tests next to the code they test
- Use descriptive test names
- Test both success and failure cases

## 📦 Submitting Changes

1. **Ensure all tests pass**: `npm test`
2. **Check code style**: `npm run lint`
3. **Update documentation**: If needed
4. **Commit your changes**: Follow commit guidelines
5. **Push to your fork**: `git push origin feature/your-feature`
6. **Submit a Pull Request**: With a clear description

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Tested on web
- [ ] Tested on iOS
- [ ] Tested on Android

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## 🎯 Areas We Need Help

- **New Exercises**: Adding more physiotherapy exercises
- **Internationalization**: Adding support for multiple languages
- **Accessibility**: Improving accessibility features
- **Performance**: Optimizing pose detection performance
- **UI/UX**: Improving the user interface
- **Documentation**: Improving and expanding documentation
- **Testing**: Increasing test coverage

## 📞 Questions?

Feel free to:
- Open an issue for questions
- Join our community discussions
- Contact the maintainers

## 🙏 Recognition

Contributors will be recognized in:
- The project README
- Release notes
- Our website (coming soon)

Thank you for contributing to PhysioAssist! 🎉