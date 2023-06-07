// Imports
import { config as dotenvConfig } from 'dotenv';
import express from 'express';
import { authenticateSpotify, formatAccessPoint, getTopTracksInfo } from './utils.js';

// Global
let access_token = '';
let expiration_time = 0;

const app = express();

dotenvConfig();

app.listen(8080, () => {
    console.log('App is listening on port 8080!');
});

app.get('/', (req, res) => {
    res.send(`<a href=${formatAccessPoint()}>Sign in</a>`);
});

app.get('/account', async (req, res) => {
    try {
        const {code} = req.query;
        // console.log(`Spotify response code: ${code}\n`)

        authenticateSpotify(code).then((response) => {
            access_token = response?.access_token;
            expiration_time = response?.expiration_time;
        })

        res.redirect('/home');
    } catch (error) {
        console.error(`Error authenticating with Spotify: ${error.message}`);
        res.status(500).send('Error authenticating with Spotify');
    }
});

app.get('/home', async (req, res) => {
    res.send('Success!');
})

app.get("/tops/:limit?/:term?", async (req, res) => {
    const limit = req.params.limit || 10;
    const term = req.params.term || 'short_term';
    getTopTracksInfo(access_token, limit, term).then((response) => {
        res.send(response);
    });
});
