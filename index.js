var accessToken;
var expirationTime;

const queryString = require('node:querystring');
const dotenv = require('dotenv');
const axios = require('axios');
const express = require('express');

const app = express();
dotenv.config();

const authenticateSpotify = async (code) => {
    try {
        const spotifyResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            queryString.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.RED_URI_DEC,
            }),
            {
                headers: {
                    Authorization: "Basic " + process.env.BASE64_AUTH,
                    'Content-Type': "application/x-www-form-urlencoded",
                },
            }
        );

        const {access_token, expires_in} = spotifyResponse.data;
        var acc_token = access_token;
        var expiration_time = Date.now() + expires_in * 1000;

        return {
            access_token : acc_token,
            expiration_time : expiration_time
        };
    } catch (error) {
        console.error(`Error refreshing token: ${error.message}`);
    }
    
}

const refreshToken = async () => {
    try {
        const spotifyResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            queryString.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
            {
                headers: {
                    Authorization: "Basic " + process.env.BASE64_AUTH,
                    'Content-Type': "application/x-www-form-urlencoded",
                },
            }
        );
    
        const {access_token, expires_in} = spotifyResponse.data;
        accessToken = access_token;
        expirationTime = Date.now() + expires_in * 1000;
        console.log(`Access token refreshed: ${accessToken}`);
    } catch (error) {
        console.error(`Error refreshing token: ${error.message}`);
    }
    
}

const checkTokenValidity = async (req, res, next) => {
    // Check if there is any access token
    if (!accessToken) {
        return res.status(401).json({message:'Access token is missing or invalid'});
    }

    // Check if the token has expired
    if (Date.now() > expirationTime) {
        await refreshToken();
    }

    next();
}

app.get('/', (req, res) => {
    res.send(
        "<a href='https://accounts.spotify.com/authorize?client_id="
        + process.env.CLIENT_ID
        + "&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Faccount&scope=user-top-read'>Sign in</a>"
    );
});

app.get('/account', async (req, res) => {
    try {
        const {code} = req.query;
        const {access_token, expiration_time} = await authenticateSpotify(code);
        console.log(`Access token received: ${access_token}`);

        accessToken = access_token;
        expirationTime = expiration_time;

        res.redirect('/top');
    } catch (error) {
        console.error(`Error authenticating with Spotify: ${error.message}`);
        res.status(500).send('Error authenticating with Spotify');
    }
    // const spotifyResponse = await axios.post(
    //     'https://accounts.spotify.com/api/token',
    //     queryString.stringify({
    //         grant_type: 'authorization_code',
    //         code: req.query.code,
    //         redirect_uri: process.env.RED_URI_DEC,
    //     }),
    //     {
    //         headers: {
    //             Authorization: "Basic " + process.env.BASE64_AUTH,
    //             'Content-Type': "application/x-www-form-urlencoded",
    //         },
    //     }
    // );

    // // accessToken = spotifyResponse.data.access_token;
    // const {access_token, expires_in} = spotifyResponse.data;
    // accessToken = access_token;
    // expirationTime = Date.now() + expires_in * 1000;
    // // console.log('Access Token: ' + accessToken + '\n');
    // // console.log('Current Time: ' + Date.now() + '\n');
    // // console.log('Expiration Time: ' + expirationTime + '\n');
});

app.get('/top', checkTokenValidity ,async (req, res) => {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
            params: {
                limit: 10,
                time_range: 'medium_term',
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const tracks = await Promise.all(response.data.items.map(async (item) => {
            const audio = await axios.get(`https://api.spotify.com/v1/audio-features/${item.id}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${item.artists[0].id}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            return {
                name: item.name,
                artist: item.artists.map((artist) => artist.name).join(', '),
                album: item.album.name,
                preview_url: item.preview_url,
                explicit : item.explicit,
                popularity: item.popularity,
                id: item.id,
                acousticness: audio.data.acousticness,
                key: audio.data.key,
                danceability: audio.data.danceability,
                liveness: audio.data.liveness,
                instrumentalness: audio.data.instrumentalness,
                energy: audio.data.energy,
                genres: artistResponse.data.genres,
            };
        }));

        res.send(tracks);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving top tracks');
    }

});

app.post('/hello', function(req, res){
    res.send("You've been post'd");
});

app.listen(8080);


