# Bitbucket PR Watcher

A modern, production-ready Chrome Extension to monitor your Bitbucket Pull Requests. Stay updated with real-time status checks, dark mode support, and a clean, developer-focused dashboard.

![Bitbucket PR Watcher Dashboard](https://github.com/FaruqRahmadani/bitbucket-pr-watcher-chrome/raw/main/public/vite.svg)

## Features

- **Real-time Monitoring**: Automatically fetches and categorizes PRs into "Needs Your Review" and "Already Reviewed".
- **Status Badges**: Instantly see if a PR is `APPROVED` or has `CHANGES REQUESTED`.
- **Modern UI/UX**: Clean interface with skeleton loading states, smooth animations, and responsive design.
- **Dark Mode**: Fully supported dark theme that syncs with your system preference or can be toggled manually.
- **Secure Configuration**: Settings are stored locally in your browser. Supports App Passwords for security.
- **Customizable Refresh**: Set your preferred auto-refresh interval (1-60 minutes) via a modern slider or context menu.
- **Smart Notifications**: Dynamic favicon updates to show pending PR counts at a glance.

## Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/FaruqRahmadani/bitbucket-pr-watcher-chrome.git
    cd bitbucket-pr-watcher-chrome
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the extension:
    ```bash
    npm run build
    ```

4.  Load into Chrome:
    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable **Developer mode** (top right).
    - Click **Load unpacked**.
    - Select the `dist` folder generated in the previous step.

## Configuration

1.  Click the extension icon or open the dashboard.
2.  Click the **Settings** (gear) icon.
3.  Enter your **Bitbucket Username** and **App Password**.
    - *Note: To generate an App Password, go to Bitbucket Settings > Personal Bitbucket Settings > App passwords > Create app password. Ensure it has `Pull requests: Read`, `Repositories: Read`, and `User: Read` permissions.*
4.  Adjust the **Auto-refresh Interval** to your liking.
5.  Click **Save Settings**.

## Development

To start the development server with hot-reload (HMR):

```bash
npm run dev
```

## Tech Stack

- **TypeScript**: For type-safe, maintainable code.
- **Vite**: Ultra-fast build tool and development server.
- **Chrome Extension Manifest V3**: Future-proof extension architecture.
- **CSS Variables**: Dynamic theming for light/dark modes.

## License

MIT License. See [LICENSE](LICENSE) for details.

---

Created by [Faruq Rahmadani](https://github.com/FaruqRahmadani)