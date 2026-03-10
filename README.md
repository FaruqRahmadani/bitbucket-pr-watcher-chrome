# Bitbucket PR Watcher

A polished Chrome Extension to monitor your Bitbucket Pull Requests. Stay updated with reviewer status, dark mode, and a fast dashboard built for developers.

![Icon](https://github.com/FaruqRahmadani/bitbucket-pr-watcher-chrome/raw/main/public/icon.png)

![License](https://img.shields.io/badge/License-MIT-yellow.svg) ![Chrome MV3](https://img.shields.io/badge/Chrome%20Extension-MV3-blue?logo=google-chrome)

## Table of Contents
- Features
- Installation
- Configuration
- Permissions
- Privacy
- Troubleshooting
- Development
- Tech Stack
- Contributing
- License

## Features
- **Real-time Monitoring**: Auto-fetch PRs and group them into “Needs Your Review” and “Already Reviewed”.
- **Reviewer Status**: Quickly see `APPROVED` or `CHANGES REQUESTED`.
- **Modern UI/UX**: Clean interface with skeleton loading, smooth animations, and responsive layout.
- **Dark Mode**: Syncs with system preference or toggled manually.
- **Secure Configuration**: Credentials stored locally via Chrome Storage.
- **Custom Auto-Refresh**: Slider to set interval (1–60 minutes).
- **Smart Indicators**: Dynamic favicon shows the count of pending PRs at a glance.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/FaruqRahmadani/bitbucket-pr-watcher-chrome.git
   cd bitbucket-pr-watcher-chrome
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build:
   ```bash
   npm run build
   ```
4. Load into Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `dist` folder

## Configuration
1. Open the dashboard and click **Settings** (gear icon).
2. Enter your **Bitbucket Email** and **App Password**.
3. Adjust the **Auto-refresh Interval**.
4. Click **Save Settings**; a “Verified!” message indicates successful authentication.

Guides:
- How to generate an App Password: [docs/how-to-generate-app-password.md](docs/how-to-generate-app-password.md)  
  GitHub link: https://github.com/FaruqRahmadani/bitbucket-pr-watcher-chrome/blob/main/docs/how-to-generate-app-password.md
- Atlassian reference: https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/

## Permissions
- `storage` for saving local settings
- `https://api.bitbucket.org/*` for accessing the Bitbucket API

## Privacy
See the full policy: [privacy-policy.md](privacy-policy.md)
- Credentials (email + App Password) are stored locally via `chrome.storage.local`.
- Data is only sent to Bitbucket over HTTPS; no third-party servers involved.

## Troubleshooting
- **Invalid username or password**: ensure you’re using an App Password, not your main account password.
- **401 Unauthorized**: check scopes are enabled (`Repositories: Read`, `Pull requests: Read`, `User: Read`).
- **Username vs Email**: the extension accepts your email; it maps to the Bitbucket username during API calls.
- **No PRs shown**: confirm repository membership and reviewer status on open PRs.

## Development
Run the dev server with HMR:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Tech Stack
- **TypeScript**
- **Vite**
- **Chrome Extension Manifest V3**
- **CSS Variables**

## Contributing
- Issues and PRs are welcome.
- For significant changes, please discuss via an issue first to align on scope.

## License
MIT — see [LICENSE](LICENSE).

---

Created by [Faruq Rahmadani](https://github.com/FaruqRahmadani)
