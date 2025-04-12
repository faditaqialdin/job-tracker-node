'use strict';

module.exports = Object.freeze({
    googleGenAIApiKey: process.env.GOOGLE_GEN_AI_API_KEY,
    prompt: `Please analyze the following job post and return only 'true' or 'false' 
             based on whether ALL of the following conditions are met:\n\n
             1. The position is based in Germany.\n
             2. PHP or any of its frameworks (e.g., Laravel, Symfony) is a primary requirement.\n
             3. The job post is mandatory written in English.\n
             4. Remote work is available.\n
             5. The role targets mid-senior to senior-level candidates.`,
    searchData: {
        keyword: 'php',
        location: 'Germany',
        dateSincePosted: 'past Month',
        jobType: 'full time',
        sortBy: 'recent',
    },
    mailOptions: {
        jobCountPerMail: 10,

        service: process.env.EMAIL_SERVICE,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,

        from: 'Job Tracker App',
        to: process.env.EMAIL_USER,
        subject: 'Recommended Job Opportunities',
        template: 'email',
    },
    maxPageTries: 10,
});