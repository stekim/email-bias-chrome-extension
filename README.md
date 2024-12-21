# Email Bias Analyzer Chrome Extension

A Chrome extension that analyzes bias in Gmail messages using AI and reputation data.

## Features

- Real-time analysis of email content for various types of bias
- Modern, non-intrusive UI that integrates seamlessly with Gmail
- Analysis categories:
  - Political bias (Very Conservative, Conservative, Liberal, Very Liberal)
  - Credibility (Deceptive, Fake News, Trustworthy, Objective)
- Sender reputation tracking
- Information structure analysis

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Open Gmail in Chrome
2. Click on any email to read it
3. The extension will automatically analyze the email content
4. Click the bias indicator icon in the email toolbar to view detailed analysis
5. The popup will show:
   - Overall bias meter
   - Detailed category breakdown
   - Sender reputation
   - Information structure analysis

## Development

The extension consists of several key components:

- `manifest.json`: Extension configuration
- `content.js`: Gmail interface integration
- `background.js`: Email analysis logic
- `popup.html/js`: Analysis display UI
- `styles.css`: Modern styling

To modify the bias analysis logic, focus on the `BiasAnalyzer` class in `background.js`.

## TODO

- Integrate with a Natural Language Processing service for more accurate text analysis
- Implement sender reputation database
- Add user preferences for bias sensitivity
- Improve source citation detection
- Add export functionality for analysis results

## License

MIT
