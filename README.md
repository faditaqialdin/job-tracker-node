# Job Tracker

## Installation

```
npm install
```

## Run Locally:

1. Create `.env` file from `.env.example` and add your secrets. See https://aistudio.google.com/apikey for `GOOGLE_GEN_AI_API_KEY` and https://myaccount.google.com/apppasswords for gmail credentials.
2. Adjust `Config.ts` with your personal settings.
3. Start the app.
    ```
    npm run search
    ```

## Run as Cronjob

1. Open your crontab file:
    ```
    crontab -e
    ```
2. Add your desired frequency:
    ```
    // Every day at midnight
    0 0 * * * cd /path/to/job-tracker-node && npm run search
    ```