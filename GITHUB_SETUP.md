# GitHub CI/CD Setup Instructions

This document provides step-by-step instructions for setting up automated testing and branch protection on your GitHub repository.

## 🚀 Quick Setup (5 minutes)

### 1. Push the CI/CD Files to GitHub

The following files have been created and need to be committed to your repository:

```bash
# Add all the new CI/CD files
git add .github/ package.json .prettierrc.json

# Commit the changes
git commit -m "feat: add GitHub Actions CI/CD pipeline and branch protection

- Add comprehensive CI/CD workflow with testing, building, and security scanning
- Add pull request testing workflow
- Add prettier for code formatting
- Add branch protection configuration
- Add CODEOWNERS file for PR approval requirements
- Add pull request template

This enables automated testing on PRs and blocks merges if tests fail."

# Push to GitHub
git push origin main
```

### 2. Install Prettier (Optional but Recommended)

```bash
npm install --save-dev prettier
```

### 3. Set Up Branch Protection Rules

#### Option A: Using GitHub Web Interface (Recommended)

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Branches** in the left sidebar
4. Click **Add rule** or **Add branch protection rule**
5. Configure the following settings:

**For `main` branch:**
- ✅ **Branch name pattern**: `main`
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1`
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - ✅ Required status checks: `test`, `build`, `security-scan`, `code-quality`
- ✅ **Require conversation resolution before merging**
- ✅ **Restrict pushes that create files**
- ✅ **Require linear history**
- ✅ **Include administrators**

**For `develop` branch (if you use one):**
- ✅ **Branch name pattern**: `develop`
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1`
- ✅ **Require status checks to pass before merging**
  - ✅ Required status checks: `test`

6. Click **Create** to save the protection rule

#### Option B: Using GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate with GitHub
gh auth login

# Set up branch protection for main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test","build","security-scan","code-quality"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## 🔧 What This Setup Provides

### ✅ Automated Testing
- **Runs on every pull request** to `main`, `master`, or `develop` branches
- **Tests across multiple Node.js versions** (16.x, 18.x, 20.x)
- **Blocks merge if tests fail** - no broken code can be merged
- **Generates test coverage reports** and comments on PRs

### ✅ Code Quality Checks
- **ESLint** for code style and best practices
- **Prettier** for consistent code formatting
- **Security scanning** with npm audit and Snyk
- **Build verification** to ensure code compiles

### ✅ Branch Protection
- **Requires pull request reviews** before merging
- **Prevents direct pushes** to protected branches
- **Requires passing tests** before merge
- **Enforces linear history** (no merge commits)

### ✅ Pull Request Templates
- **Standardized PR descriptions** with checklists
- **Automatic code owner assignments** based on file changes
- **Coverage reports** posted as PR comments

## 🧪 Testing the Setup

### 1. Create a Test Pull Request

```bash
# Create a new branch
git checkout -b test-ci-setup

# Make a small change (add a comment to a file)
echo "// Test comment for CI" >> src/server/app.js

# Commit and push
git add src/server/app.js
git commit -m "test: add comment to test CI pipeline"
git push origin test-ci-setup
```

### 2. Create Pull Request on GitHub

1. Go to your GitHub repository
2. You should see a banner suggesting to create a PR for your new branch
3. Click **Compare & pull request**
4. Fill out the PR template
5. Click **Create pull request**

### 3. Verify CI Pipeline Runs

1. Go to the **Actions** tab in your GitHub repository
2. You should see the CI pipeline running
3. Wait for all checks to complete (should take 2-5 minutes)
4. Verify that:
   - ✅ Tests pass
   - ✅ Build succeeds
   - ✅ Security scan completes
   - ✅ Code quality checks pass

### 4. Test Branch Protection

1. Try to merge the PR without waiting for reviews
2. You should see that the merge button is disabled
3. Wait for all CI checks to pass
4. The merge button should remain disabled until you approve the PR

## 🔍 Monitoring and Maintenance

### View CI Status
- **Actions tab**: See all workflow runs and their status
- **Pull request page**: See status checks directly on the PR
- **Branch protection**: View protection rules in Settings → Branches

### Update CI Configuration
- Edit `.github/workflows/ci.yml` to modify the main CI pipeline
- Edit `.github/workflows/pr-tests.yml` to modify PR-specific tests
- Update `package.json` scripts to add new commands

### Troubleshooting Common Issues

**Tests failing in CI but passing locally:**
- Check Node.js version differences
- Verify all dependencies are in `package.json`
- Check for environment-specific issues

**Branch protection not working:**
- Verify the branch name matches exactly (`main` vs `master`)
- Check that required status checks are correctly named
- Ensure the workflow files are in the correct location

**Code owner reviews not required:**
- Verify `.github/CODEOWNERS` file exists and is properly formatted
- Check that the users mentioned in CODEOWNERS have access to the repository

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [CODEOWNERS File](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Pull Request Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates)

## 🎉 Success!

Once set up, your repository will have:
- ✅ **Automated testing** on every pull request
- ✅ **Blocked merges** if tests fail
- ✅ **Code quality enforcement**
- ✅ **Security scanning**
- ✅ **Required code reviews**

This ensures that only high-quality, tested code makes it into your main branch!
