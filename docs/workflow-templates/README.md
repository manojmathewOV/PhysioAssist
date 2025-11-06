# GitHub Actions Workflow Templates

This directory contains GitHub Actions workflow templates that need to be added manually to the repository.

## Why Manual Setup?

These workflow files require special `workflows` permission in GitHub, which automated tools may not have. You'll need to add them manually.

## How to Add Workflows

### Option 1: Via GitHub Web Interface

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Click "New workflow"
4. Click "set up a workflow yourself"
5. Copy the content from the template file in this directory
6. Paste into the editor
7. Commit the file

### Option 2: Via Git Command Line

```bash
# Create the workflows directory if it doesn't exist
mkdir -p .github/workflows

# Copy the template
cp docs/workflow-templates/ios-e2e-tests.yml .github/workflows/

# Add and commit
git add .github/workflows/ios-e2e-tests.yml
git commit -m "Add iOS E2E testing workflow"
git push
```

## Available Workflows

### `ios-e2e-tests.yml`
**Purpose**: Automated iOS Simulator E2E testing on GitHub's macOS runners

**Triggers**:
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`
- Manual trigger via Actions tab

**What it does**:
- ✅ Runs all E2E tests on iOS Simulator
- ✅ Tests multiple devices (iPhone 15 Pro, iPhone 14)
- ✅ Generates test reports and artifacts
- ✅ Posts results as PR comments
- ✅ Uploads failure screenshots and logs

**Requirements**:
- GitHub-hosted `macos-14` runner (free for public repos)
- No additional setup needed

**First run**: Takes ~20 minutes (builds and caches dependencies)
**Subsequent runs**: ~10-15 minutes (uses cached builds)

## After Adding

Once you've added the workflow:

1. **Check the Actions tab** to see it running
2. **View test results** in the workflow run details
3. **Download artifacts** (screenshots, logs) if tests fail
4. **See PR comments** with test summaries on pull requests

## Troubleshooting

If the workflow fails to run:

- Ensure Actions are enabled in repository settings
- Check that macOS runners are available (Settings → Actions → Runners)
- Verify the workflow file syntax is correct
- Check the Actions tab for error messages

## Learn More

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [iOS E2E Testing Guide](../IOS_SIMULATOR_TESTING.md)
- [Testing Quick Reference](../TESTING_QUICK_REFERENCE.md)
