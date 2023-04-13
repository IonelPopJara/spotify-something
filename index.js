const accessToken = 'BQBEP2yWa6d8kKgsY9-Eyv47IpcGu0F3ELe1ypXHXz9ivfO7y0AfqGTgrqbPHyheBQ6BJxh1AomJuSCnJc-YuoLhSBIG0YNdpC0LSBPbWShd__-h2WO_EmmP5u3EMJon3uDVli9ShLt4EukeBjpd3g75XwaAK-Ni2iRuDC4RTE9u_2BREiHGUlD-KJTc7mNzzI7ruW8x_s43PEk';

const queryString = require('node:querystring');
const axios = require('axios');
const express = require('express');
const app = express();

require('dotenv').config();

app.get('/', (req, res) => {
    res.send(
        "<a href='https://accounts.spotify.com/authorize?client_id="
        + process.env.CLIENT_ID
        + "&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Faccount&scope=user-top-read'>Sign in</a>"
    );
});

app.get('/account', async (req, res) => {
    const spotifyResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        queryString.stringify({
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: process.env.RED_URI_DEC,
        }),
        {
            headers: {
                Authorization: "Basic " + process.env.BASE64_AUTH,
                'Content-Type': "application/x-www-form-urlencoded",
            },
        }
    );

    console.log(spotifyResponse.data);
});

app.get('/top', async (req, res) => {
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

        console.log(response.data);

        const tracks = response.data.items.map((item) => {
            return {
                name: item.name,
                artist: item.artists.map((artist) => artist.name).join(', '),
                album: item.album.name,
                preview_url: item.preview_url,
                explicit : item.explicit,
                popularity: item.popularity,
            };
        });

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


