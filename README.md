# LinkedIn Candidate Scraper

A Chrome extension for extracting candidate information from LinkedIn job applicant pages and exporting to Excel format. Built for efficient recruitment data management.

## 🚀 Quick Start

### Installation
1. **Fork this repository** or download the code
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Navigate to LinkedIn job applicant pages
6. Click the extension icon to start scraping

### Usage
- **Scrape Candidates**: Click the extension icon on LinkedIn job applicant pages
- **Background Processing**: Minimize popup to continue scraping in background
- **Auto Export**: Excel file downloads automatically when scraping completes
- **Data Persistence**: Your data is saved and restored automatically

## 📁 File Structure

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
├── package.json                  # Project metadata
├── CHANGELOG.md                  # Version history
├── LICENSE                       # MIT License
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

## ✨ Features

### Data Extraction
- **Personal Information**: Name, title, company, location
- **Contact Details**: Phone numbers (cleaned and formatted)
- **Education History**: Institution, degree, field of study, dates
- **Work Experience**: Company, position, duration (first entry only)
- **Individual Timestamps**: Each candidate gets a unique scraping timestamp

### Technical Features
- **Chrome Extension Manifest V3**: Latest extension standards
- **Privacy-Focused**: No data sent to external servers
- **Background Processing**: Continue scraping when popup is minimized
- **Automatic Excel Export**: Download data in professional format
- **Data Persistence**: Automatic saving and restoration
- **Real-time Progress**: See scraping progress in real-time
- **Desktop Notifications**: Get notified when scraping completes
- **Error Handling**: Robust error recovery and retry mechanisms

## 🛠 Development

### Prerequisites
- Google Chrome 88 or higher
- Basic knowledge of JavaScript and Chrome extensions

### Local Development
1. Fork this repository
2. Clone your fork locally
3. Make your changes
4. Test in Chrome with Developer mode
5. Commit and push your changes

### File Descriptions
- `src/js/content.js`: Main scraping logic and data extraction
- `src/js/popup.js`: Popup functionality and UI interactions
- `src/js/background.js`: Background service worker
- `src/popup.html`: Extension popup interface
- `manifest.json`: Chrome extension configuration

## 🔧 Customization

### Adding New Data Fields
1. Update selectors in `src/js/content.js`
2. Modify data parsing functions
3. Update Excel export in `src/js/popup.js`

### Styling Changes
1. Modify inline styles in `src/popup.html`
2. Or create external CSS files in `src/css/`

### Functionality Extensions
1. Add new features to appropriate JavaScript files
2. Update manifest.json for new permissions if needed
3. Test thoroughly before committing

## 📋 Requirements

- **Browser**: Google Chrome 88 or higher
- **Platform**: Windows, macOS, Linux
- **Permissions**: Active tab, storage, downloads, notifications
- **Network**: Internet connection for LinkedIn access

## 🛡 Privacy & Legal

### Privacy
- **Local Processing**: All data processing happens locally
- **No External Servers**: No data is sent to external services
- **User Control**: Users have full control over their data
- **Transparent Code**: Open source for full transparency

### Legal Notice
This extension is for educational and legitimate business purposes only. Users must:
- Comply with LinkedIn's Terms of Service
- Respect candidate privacy and data protection laws
- Use data responsibly and ethically
- Obtain proper consent where required

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the [docs](docs/) folder
- **Contributing**: See [CONTRIBUTING.md](docs/CONTRIBUTING.md)

## 🔮 Roadmap

- Support for other job platforms
- Advanced filtering options
- Data visualization features
- API integration capabilities
- Custom export formats
- Performance optimizations

---

**Note**: This extension is designed for legitimate recruitment purposes. Please use responsibly and in compliance with all applicable laws and terms of service. 