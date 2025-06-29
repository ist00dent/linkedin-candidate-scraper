# Contributing to LinkedIn Candidate Scraper

Thank you for your interest in contributing to LinkedIn Candidate Scraper! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to see if your problem has already been reported
2. **Check the documentation** in the README
3. **Test with the latest version** of the extension

When creating an issue, please include:

- **Chrome version** you're using
- **Extension version** (if known)
- **Detailed steps** to reproduce the problem
- **Expected behavior** vs actual behavior
- **Console errors** (if any) - press F12 to open developer tools
- **Screenshots** if relevant

### Suggesting Features

We welcome feature suggestions! When suggesting a feature:

1. **Describe the problem** you're trying to solve
2. **Explain your proposed solution**
3. **Consider the impact** on existing functionality
4. **Think about privacy and ethical implications**

### Code Contributions

#### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/linkedin-candidate-scraper.git
   cd linkedin-candidate-scraper
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Setup

1. **Load the extension** in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

2. **Test your changes**:
   - Make changes to the code
   - Reload the extension in Chrome
   - Test on LinkedIn applicant pages

#### Coding Standards

- **JavaScript**: Use modern ES6+ features, meaningful variable names
- **Comments**: Add comments for complex logic
- **Error Handling**: Include proper error handling
- **Performance**: Consider performance implications
- **Privacy**: Ensure no sensitive data is logged or transmitted

#### File Structure

```
linkedin-candidate-scraper/
├── src/                          # Source code directory
│   ├── js/                       # JavaScript files
│   │   ├── content.js            # Main scraping logic
│   │   ├── popup.js              # Popup functionality
│   │   ├── background.js         # Background service worker
│   │   └── xlsx.full.min.js      # Excel export library
│   ├── css/                      # Stylesheets (future use)
│   ├── assets/                   # Static assets
│   │   └── icons/                # Extension icons (future use)
│   └── popup.html                # Extension popup interface
├── docs/                         # Documentation
│   ├── CONTRIBUTING.md           # Contribution guidelines
│   └── body.txt                  # Reference data
├── manifest.json                 # Extension configuration
├── package.json                  # Project metadata and scripts
├── CHANGELOG.md                  # Version history and changes
├── LICENSE                       # MIT License
├── .gitignore                    # Git ignore rules
└── README.md                     # Main documentation
```

#### Testing Your Changes

Before submitting a pull request:

1. **Test thoroughly** on different LinkedIn pages
2. **Check for errors** in the browser console
3. **Verify data accuracy** in exported Excel files
4. **Test edge cases** (no data, network errors, etc.)
5. **Ensure no breaking changes** to existing functionality

#### Submitting Changes

1. **Commit your changes** with clear messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   git commit -m "Fix bug: description of what you fixed"
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**:
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Fill out the PR template

#### Pull Request Guidelines

Your pull request should include:

- **Clear description** of what the changes do
- **Testing details** - what you tested and how
- **Screenshots** if UI changes are involved
- **Any breaking changes** clearly noted
- **Updates to documentation** if needed

## 🏗️ Development Guidelines

### Code Style

- Use **meaningful variable names**
- Add **comments for complex logic**
- Follow **existing code patterns**
- Keep **functions focused and small**
- Use **consistent indentation** (2 spaces)

### Error Handling

- Always **handle potential errors**
- Provide **user-friendly error messages**
- Log **detailed errors for debugging**
- Don't **crash the extension** on errors

### Privacy & Security

- **Never log sensitive data** (emails, phone numbers)
- **Don't send data to external servers**
- **Respect user privacy** at all times
- **Follow data protection best practices**

### Performance

- **Minimize DOM queries**
- **Use efficient selectors**
- **Avoid blocking operations**
- **Consider memory usage**

## 🐛 Bug Reports

When reporting bugs, please provide:

1. **Environment details**:
   - Chrome version
   - Operating system
   - Extension version

2. **Steps to reproduce**:
   - Exact steps to trigger the bug
   - What you expected to happen
   - What actually happened

3. **Additional information**:
   - Console errors (F12 → Console tab)
   - Screenshots if relevant
   - Any error messages

## 💡 Feature Requests

When suggesting features:

1. **Describe the problem** you're trying to solve
2. **Explain your proposed solution**
3. **Consider alternatives** you've thought of
4. **Think about the impact** on existing users

## 📝 Documentation

Help improve documentation by:

- **Fixing typos** or unclear explanations
- **Adding missing information**
- **Improving examples**
- **Updating screenshots**

## 🎯 Areas for Contribution

We're particularly interested in contributions for:

- **Bug fixes** and stability improvements
- **Performance optimizations**
- **Better error handling**
- **UI/UX improvements**
- **Documentation updates**
- **Testing improvements**

## 🤝 Community Guidelines

- **Be respectful** and constructive
- **Help others** when you can
- **Follow the code of conduct**
- **Report inappropriate behavior**

## 📞 Getting Help

If you need help contributing:

1. **Check the documentation** first
2. **Search existing issues** and discussions
3. **Ask questions** in issues or discussions
4. **Be patient** - we're all volunteers

## 🙏 Recognition

Contributors will be recognized in:

- **README.md** (for significant contributions)
- **Release notes** (for each release)
- **GitHub contributors** page

Thank you for contributing to LinkedIn Candidate Scraper! 🚀 