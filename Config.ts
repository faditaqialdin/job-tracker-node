'use strict';

module.exports = Object.freeze({
    googleGenAIApiKey: process.env.GOOGLE_GEN_AI_API_KEY,
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