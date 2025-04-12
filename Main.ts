'use strict';

const dotenv = require("dotenv");
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const Config = require('./Config.ts');

///////////////////////////////////////////////////////////////////////////////

const Database = require('better-sqlite3');

const db = new Database('job_tracking.db');
db.prepare(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobUrl TEXT NOT NULL,
    position TEXT NOT NULL,
    company TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    recommended BOOLEAN NOT NULL
  )
`).run();
function dbExist (post) {
    const handled = db.prepare(`SELECT * FROM jobs WHERE jobUrl = '${post.jobUrl}'`).all();
    return handled.length > 0;
}
function dbPersist (post) {
    const insert = db.prepare(`INSERT INTO jobs (jobUrl, position, company, content, created_at, recommended) VALUES (?, ?, ?, ?, ?)`);
    insert.run(post.jobUrl, post.position, post.company, post.content, post.date, String(post.recommended));
}

///////////////////////////////////////////////////////////////////////////////

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: Config.googleGenAIApiKey });
async function checkAi (post) {
    await wait();
    const prompt = `${Config.prompt}\n\nHere is the job post:\n\n---\n\n${post.content}\n\n---`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
    });
    return Boolean(response.text.trim());
}

///////////////////////////////////////////////////////////////////////////////

const linkedIn = require('linkedin-jobs-api');
const axios = require("axios");
const cheerio = require('cheerio');

const newlineTags = new Set(['p', 'br', 'div', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function extractTextPreservingFormatting($, elem) {
    let result = '';
    $(elem).contents().each((i, child) => {
        if (child.type === 'text') {
            const text = $(child).text();
            if (text.trim()) {
                result += text.trim() + ' ';
            }
        } else if (child.type === 'tag') {
            result += extractTextPreservingFormatting($, child);
            if (newlineTags.has(child.tagName)) {
                result += "\n";
            }
        }
    });
    return result;
}

async function fetchJobText(url) {
    await wait();
    const { data: html } = await axios.get(url, {timeout: 1000 * 60 * 5});
    const $ = cheerio.load(html);
    const container = $('.show-more-less-html__markup');
    return extractTextPreservingFormatting($, container).trim();
}

async function getPosts (page = 0) {
    Config.searchData.limit = '10';
    Config.searchData.page = String(page);
    const posts = await linkedIn.query(Config.searchData);
    const response = [];
    for (const post of posts) {
        try {
            post.content = await fetchJobText(post.jobUrl);
            response.push(post);
        } catch (error) {
            console.error(error);
        }
    }
    return response;
}

///////////////////////////////////////////////////////////////////////////////

const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const transporter = nodemailer.createTransport({
    service: Config.mailOptions.service,
    auth: {
        user: Config.mailOptions.user,
        pass: Config.mailOptions.pass,
    },
});

transporter.use('compile', hbs({
    viewEngine: {
        extname: '.handlebars',
        partialsDir: path.resolve('./templates/'),
        defaultLayout: false,
    },
    viewPath: path.resolve('./templates/'),
    extName: '.handlebars',
}));

async function sendEmail (posts) {
    Config.mailOptions.context = { posts: posts };
    await transporter.sendMail(Config.mailOptions);
}

///////////////////////////////////////////////////////////////////////////////

async function wait(timeout = 100) {
    await new Promise(resolve => setTimeout(resolve, timeout));
}

(async () => {
    try {
        const postsToBeEmailed = [];
        let page = 0;
        while (postsToBeEmailed.length < Config.mailOptions.jobCountPerMail && page < Config.maxPageTries) {
            const posts = await getPosts(page++);
            for (const post of posts) {
                try {
                    if (postsToBeEmailed.length >= Config.mailOptions.jobCountPerMail) {
                        break;
                    }
                    if (dbExist(post)) {
                        continue;
                    }
                    post.recommended = await checkAi(post);
                    dbPersist(post);
                    if (post.recommended) {
                        postsToBeEmailed.push(post);
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
        if (postsToBeEmailed.length > 0) {
            await sendEmail(postsToBeEmailed);
        }
    } catch (error) {
        console.error(error);
    }
    process.exit();
})();