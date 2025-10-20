# GitHub Branch Protection Rules Configuration
# This file documents the recommended branch protection settings for the repository

## Required Branch Protection Rules

### For `main` and `master` branches:

1. **Require a pull request before merging**
   - ✅ Require approvals: 1
   - ✅ Dismiss stale PR approvals when new commits are pushed
   - ✅ Require review from code owners

2. **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - ✅ Required status checks:
     - `test` (from CI workflow)
     - `build` (from CI workflow)
     - `security-scan` (from CI workflow)
     - `code-quality` (from CI workflow)

3. **Require conversation resolution before merging**
   - ✅ Require conversation resolution before merging

4. **Restrict pushes that create files**
   - ✅ Restrict pushes that create files

5. **Require linear history**
   - ✅ Require linear history

6. **Include administrators**
   - ✅ Include administrators

### For `develop` branch:

1. **Require a pull request before merging**
   - ✅ Require approvals: 1
   - ✅ Dismiss stale PR approvals when new commits are pushed

2. **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - ✅ Required status checks:
     - `test` (from CI workflow)

3. **Require conversation resolution before merging**
   - ✅ Require conversation resolution before merging

## Setup Instructions

1. Go to your GitHub repository
2. Navigate to Settings → Branches
3. Click "Add rule" or "Add branch protection rule"
4. Configure the rules as specified above
5. Save the protection rule

## Alternative: Use GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Set up branch protection for main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test","build","security-scan","code-quality"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

# Set up branch protection for develop branch
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## Code Owners File

Create a `.github/CODEOWNERS` file to specify who can approve PRs:

```
# Global code owners
* @your-username @team-lead

# Specific file patterns
/src/ @backend-team
/tests/ @qa-team
/schemas/ @backend-team @qa-team
/docs/ @documentation-team
