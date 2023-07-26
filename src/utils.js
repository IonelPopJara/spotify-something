import axios from 'axios';
import { stringify } from 'node:querystring';

export const authenticateSpotify = async (code) => {
    try {
        const spotifyResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            stringify({
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

        const { access_token, expires_in } = spotifyResponse.data;

        const acc_token = access_token;
        const expiration_time = Date.now() + expires_in * 1000;

        return {
            access_token: acc_token,
            expiration_time: expiration_time
        };

    } catch (error) {
        console.error(`Error refreshing token: ${error.message}`);
    }
}

export const formatAccessPoint = () => {

    console.log(process.env.CLIENT_ID);

    return 'https://accounts.spotify.com/authorize?client_id=' +
        process.env.CLIENT_ID +
        '&response_type=code&redirect_uri=http%3A%2F%2F' +
        'localhost%3A8080%2Faccount&' +
        'scope=user-top-read';
}

export const getTopTracksInfo = async (accessToken, limit, term) => {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
            params: {
                limit: limit,
                time_range: term,
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
                id: item.id,
                key: audio.data.key,
                energy: audio.data.energy,
                genres: artistResponse.data.genres,
                duration: item.duration_ms,
                danceability: audio.data.danceability,
                popularity: item.popularity,
                valence: audio.data.valence,
                tempo: audio.data.tempo,
            };
        }));
        return { items: tracks };
    } catch (error) {
        console.error(error);
    }
}
