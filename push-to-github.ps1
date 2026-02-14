# Dyslexia Platform - Git & GitHub Push Script
# This script initializes Git, commits your project, and pushes to GitHub
# Prerequisites: Git installed and GitHub CLI (gh) logged in, OR generate a Personal Access Token

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git & GitHub Repository Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the repository name from user
$repoName = Read-Host "Enter your GitHub repository name (e.g., dyslexia-platform)"

if ([string]::IsNullOrWhiteSpace($repoName)) {
    Write-Host "[ERROR] Repository name cannot be empty" -ForegroundColor Red
    exit 1
}

$repoUrl = "https://github.com/$(gh auth status --show-token 2>$null | grep -oP 'Logged in to \K\S+' || Read-Host 'Enter your GitHub username')/$repoName.git"

# Get current directory
$projectPath = Get-Location
Write-Host "Project Path: $projectPath" -ForegroundColor Yellow
Write-Host "Repository Name: $repoName" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if Git is installed
Write-Host "Step 1: Checking Git installation..." -ForegroundColor Cyan
try {
    $gitVersion = git --version
    Write-Host "[OK] Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Check if .git directory exists
Write-Host "Step 2: Checking Git initialization..." -ForegroundColor Cyan
if (Test-Path ".git") {
    Write-Host "[OK] Git repository already initialized" -ForegroundColor Green
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "[OK] Git repository initialized" -ForegroundColor Green
}

Write-Host ""

# Step 3: Configure Git user (if not already configured)
Write-Host "Step 3: Configuring Git user..." -ForegroundColor Cyan
$gitUserName = git config user.name
$gitUserEmail = git config user.email

if ([string]::IsNullOrWhiteSpace($gitUserName)) {
    $userName = Read-Host "Enter your name for Git commits"
    git config user.name "$userName"
    Write-Host "[OK] Git user name set: $userName" -ForegroundColor Green
} else {
    Write-Host "[OK] Git user name already set: $gitUserName" -ForegroundColor Green
}

if ([string]::IsNullOrWhiteSpace($gitUserEmail)) {
    $userEmail = Read-Host "Enter your email for Git commits"
    git config user.email "$userEmail"
    Write-Host "[OK] Git user email set: $userEmail" -ForegroundColor Green
} else {
    Write-Host "[OK] Git user email already set: $gitUserEmail" -ForegroundColor Green
}

Write-Host ""

# Step 4: Check Git status
Write-Host "Step 4: Checking Git status..." -ForegroundColor Cyan
git status
Write-Host ""

# Step 5: Add all files to staging
Write-Host "Step 5: Adding all files to Git..." -ForegroundColor Cyan
git add .
Write-Host "[OK] All files added to staging area" -ForegroundColor Green

Write-Host ""

# Step 6: Commit files
Write-Host "Step 6: Creating initial commit..." -ForegroundColor Cyan
$commitMessage = Read-Host "Enter commit message (or press Enter for default)" 
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit: Dyslexia Support Platform full-stack application"
}

git commit -m "$commitMessage"
Write-Host "[OK] Files committed with message: $commitMessage" -ForegroundColor Green

Write-Host ""

# Step 7: Check if remote origin already exists
Write-Host "Step 7: Configuring remote repository..." -ForegroundColor Cyan
$remoteOrigin = git config --get remote.origin.url

if ([string]::IsNullOrWhiteSpace($remoteOrigin)) {
    Write-Host "No remote origin found. Setting up new remote..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "When you create the GitHub repository, use this command:" -ForegroundColor Yellow
    Write-Host "git remote add origin https://github.com/YOUR_USERNAME/$repoName.git" -ForegroundColor White
    
    $userInput = Read-Host "Have you created the repository on GitHub? (yes/no)"
    if ($userInput -eq "yes" -or $userInput -eq "y") {
        $gitHubUsername = Read-Host "Enter your GitHub username"
        $remoteUrl = "https://github.com/$gitHubUsername/$repoName.git"
        git remote add origin $remoteUrl
        Write-Host "[OK] Remote origin added: $remoteUrl" -ForegroundColor Green
    } else {
        Write-Host "Please create the repository on GitHub: https://github.com/new" -ForegroundColor Yellow
        Write-Host "Then run: git remote add origin https://github.com/YOUR_USERNAME/$repoName.git" -ForegroundColor White
        exit 0
    }
} else {
    Write-Host "[OK] Remote origin already configured: $remoteOrigin" -ForegroundColor Green
}

Write-Host ""

# Step 8: Check current branch
Write-Host "Step 8: Checking current branch..." -ForegroundColor Cyan
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Rename to main if needed
if ($currentBranch -eq "master") {
    Write-Host "Renaming 'master' branch to 'main'..." -ForegroundColor Yellow
    git branch -M main
    Write-Host "[OK] Branch renamed to 'main'" -ForegroundColor Green
} else {
    Write-Host "[OK] Branch is already: $currentBranch" -ForegroundColor Green
}

Write-Host ""

# Step 9: Push to GitHub
Write-Host "Step 9: Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "Pushing branch to remote repository..." -ForegroundColor Yellow

$branchName = "main"
git push -u origin $branchName

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Push failed. Common issues:" -ForegroundColor Red
    Write-Host "  1. Authentication failed - Check GitHub credentials" -ForegroundColor Yellow
    Write-Host "  2. Remote URL is incorrect - Verify with: git remote -v" -ForegroundColor Yellow
    Write-Host "  3. Conflicting history - If pulling first time: git pull origin $branchName --allow-unrelated-histories" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 10: Verify push
Write-Host "Step 10: Verifying push..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Git Remote Configuration:" -ForegroundColor Yellow
git remote -v
Write-Host ""
Write-Host "Git Log (latest commits):" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "Success!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your project has been pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "Repository URL:" -ForegroundColor Cyan
Write-Host "https://github.com/$gitHubUsername/$repoName" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit your repository on GitHub to verify" -ForegroundColor White
Write-Host "2. Check that all files are present" -ForegroundColor White
Write-Host "3. Configure GitHub repository settings if needed" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  git status              - Check current status" -ForegroundColor White
Write-Host "  git log                 - View commit history" -ForegroundColor White
Write-Host "  git push                - Push future changes" -ForegroundColor White
Write-Host "  git pull                - Pull remote changes" -ForegroundColor White
Write-Host ""
