# How to Generate a Bitbucket App Password (Token)

This guide explains how to create an App Password for use with the Bitbucket PR Watcher Chrome extension.

## What is an App Password?
- An App Password is a special access token for Bitbucket Cloud.
- It’s safer for automation/API access than sharing your main account password.
- You can restrict it to specific permissions (scopes).

## Steps to Create an App Password
1. Sign in to Bitbucket Cloud: https://bitbucket.org/
2. Click your avatar (bottom left) → Personal settings.
3. Select App passwords → Create app password.
4. Enter a label, e.g., “PR Watcher”.
5. Enable the following minimum permissions (scopes):
   - Repositories: Read
   - Pull requests: Read
   - User: Read
6. Click Create. Copy the App Password shown.
   - Note: The App Password is only shown once. Save it in a password manager.

Official reference: https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/

## Using It in the Extension
- Open the extension Dashboard → Settings.
- Enter your Bitbucket Email in the “Bitbucket Email” field.
- Paste the App Password into the “App Password” field.
- Click Save Settings. If successful, the status will show “Verified!”.

## Troubleshooting
- Invalid username or password: ensure you’re using the App Password, not your main account password.
- 401 Unauthorized: double-check that the scopes listed above are enabled.
- Username vs Email: the extension accepts an email; the Bitbucket API will map it to the account’s username.
- Ensure your account has access to the repositories and PRs you want to monitor.

## Security
- The App Password is stored locally in your browser (chrome.storage.local).
- It is not sent to any third-party servers; it’s only used for secure HTTPS requests to the Bitbucket API.
- You can remove credentials at any time from Settings, or uninstall the extension to delete local data.
