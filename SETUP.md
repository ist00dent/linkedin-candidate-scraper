# Setup Guide

This guide will help you set up the LinkedIn Candidate Scraper repository with Git and CI/CD.

## 🏷️ Repository Information

**Repository Name:** `linkedin-candidate-scraper`  
**Description:** `A Chrome extension for extracting candidate information from LinkedIn job applicant pages and exporting to Excel format. Built for efficient recruitment data management with privacy-focused local processing.`

## 🚀 Quick Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Fill in the details:
   - **Repository name:** `linkedin-candidate-scraper`
   - **Description:** `A Chrome extension for extracting candidate information from LinkedIn job applicant pages and exporting to Excel format. Built for efficient recruitment data management with privacy-focused local processing.`
   - **Visibility:** Public
   - **Initialize with:** Don't initialize (we'll push our existing code)
4. Click "Create repository"

### 2. Initialize Git and Push Code

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: LinkedIn Candidate Scraper v1.0.0"

# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/linkedin-candidate-scraper.git

# Push to main branch
git push -u origin main
```

### 3. Enable GitHub Actions

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Click "Enable Actions" if prompted
4. The CI/CD pipeline will automatically run on your next push

## 🔧 Validation

Before pushing, run the validation script:

```bash
# Install dependencies (if you have Node.js)
npm install

# Run validation
npm run validate
```

This will check:
- ✅ All required files are present
- ✅ manifest.json is valid
- ✅ Required permissions are set
- ✅ JavaScript syntax is correct
- ✅ File sizes are reasonable

## 📋 CI/CD Pipeline

The repository includes a comprehensive CI/CD pipeline that runs on:

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` branch

### Jobs

#### 1. **Validate Extension**
- Validates manifest.json structure
- Checks file structure and required files
- Validates HTML and JavaScript syntax
- Verifies required permissions

#### 2. **Test Extension**
- Runs validation tests
- Checks file sizes
- Placeholder for future unit tests

#### 3. **Build Extension Package** (main branch only)
- Creates a clean extension package
- Generates downloadable zip file
- Uploads as GitHub artifact

#### 4. **Deploy Documentation** (main branch only)
- Deploys docs to GitHub Pages
- Makes documentation publicly accessible

## 🎯 Repository Features

### 📁 Professional Structure
```
linkedin-candidate-scraper/
├── src/                          # Source code
│   ├── js/                       # JavaScript files
│   ├── css/                      # Stylesheets (future)
│   ├── assets/                   # Assets (future)
│   └── popup.html                # Extension interface
├── docs/                         # Documentation
├── .github/                      # GitHub configuration
│   ├── workflows/                # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/           # Issue templates
│   └── pull_request_template.md  # PR template
├── scripts/                      # Build and validation scripts
├── manifest.json                 # Extension config
├── package.json                  # Project metadata
├── CHANGELOG.md                  # Version history
├── LICENSE                       # MIT License
├── .gitignore                    # Git ignore
├── README.md                     # Main documentation
└── SETUP.md                      # This file
```

### 🔧 Development Tools
- **Validation Script:** `npm run validate`
- **Test Script:** `npm test`
- **CI Script:** `npm run ci`

### 📝 Templates
- **Bug Report Template:** Structured bug reporting
- **Feature Request Template:** Organized feature requests
- **Pull Request Template:** Standardized PR process

## 🛡️ Security & Privacy

### Built-in Protections
- **Local Processing:** All data stays on user's machine
- **No External Servers:** No data transmission
- **Privacy-Focused:** Minimal permissions required
- **Transparent Code:** Open source for full transparency

### Legal Compliance
- **Terms of Service:** Respects LinkedIn's ToS
- **Data Protection:** Complies with privacy laws
- **Ethical Use:** Designed for legitimate business purposes

## 🚀 Next Steps

After setting up the repository:

1. **Test the Extension:**
   - Load it in Chrome with Developer mode
   - Test on LinkedIn job applicant pages
   - Verify all features work correctly

2. **Customize if Needed:**
   - Modify selectors in `src/js/content.js`
   - Update styling in `src/popup.html`
   - Add new features as needed

3. **Share with Community:**
   - Add topics/tags to repository
   - Create a detailed README
   - Respond to issues and PRs

4. **Monitor CI/CD:**
   - Check GitHub Actions for any failures
   - Review validation results
   - Monitor deployment status

## 🆘 Troubleshooting

### Common Issues

**Git not found:**
```bash
# Install Git from: https://git-scm.com/
# Or use GitHub Desktop
```

**Node.js not found:**
```bash
# Install Node.js from: https://nodejs.org/
# Or skip npm commands and use validation manually
```

**GitHub Actions not running:**
1. Check repository settings
2. Ensure Actions are enabled
3. Verify workflow file is in `.github/workflows/`

**Validation failures:**
1. Check all required files are present
2. Verify manifest.json syntax
3. Ensure JavaScript files are valid

## 📞 Support

- **Issues:** Create an issue on GitHub
- **Documentation:** Check the [docs](docs/) folder
- **Contributing:** See [CONTRIBUTING.md](docs/CONTRIBUTING.md)

---

**Happy coding! 🎉** 