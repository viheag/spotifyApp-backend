const express = require('express');
const querystring = require('querystring');
var request = require('request');
const jwt = require('jsonwebtoken');
const axios = require('axios');
var CLIENT_ID = process.env.CLIENT_ID;
var CLIENT_SECRET = process.env.CLIENT_SECRET;
var SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

module.exports = function (app) {
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
        res.setHeader('Access-Control-Allow-Methods', 'Content-Type', 'Authorization');
        next();
    })
    app.get('/login', (req, res) => {
        var state = generateRandomString(16);
        res.cookie(stateKey, state);
        try {
            res.redirect('https://accounts.spotify.com/authorize?' +
                querystring.stringify({
                    response_type: 'code',
                    client_id: CLIENT_ID,
                    redirect_uri: SPOTIFY_REDIRECT_URI,
                    state: state,
                    scope: "streaming \
                    user-read-email \
                    user-read-private\
                    user-top-read\
                    user-follow-read\
                    "
                }));
        } catch (e) {
            console.log("error.", e.error);
        }
    });

    app.get('/callback', async (req, res) => {
        var code = req.query.code || null;
        var state = req.query.state || null;
        var storedState = req.cookies ? req.cookies[stateKey] : null;

        if (state === null || state !== storedState) {
            res.redirect('/#' +
                querystring.stringify({
                    error: 'state_mismatch'
                }));
        } else {
            const code = req.query.code || null;
            const clientId = process.env.CLIENT_ID;
            const secret = process.env.CLIENT_SECRET;
            const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
            const grant_type = 'authorization_code';
            axios({
                    method: 'post',
                    url: 'https://accounts.spotify.com/api/token',
                    data: querystring.stringify({
                        grant_type: grant_type,
                        code: code,
                        redirect_uri: redirect_uri
                    }),
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                        Authorization: `Basic ${new Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
                    },
                })
                .then(response => {
                    res.cookie("access_token", response.data.access_token, {
                        httpOnly: true,
                    });
                    res.cookie("refresh_token", response.data.refresh_token, {
                        httpOnly: true,
                    });
                    res.redirect("http://localhost:4200/home");
                })
                .catch(error => {
                    console.log(error);
                });
        }
    });

    app.get('/account', (req, res) => {
        var access_token = req.cookies.access_token
        axios({
                method: 'GET',
                url: 'https://api.spotify.com/v1/me',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                }
            })
            .then(response => {
                res.status(200).send(response.data)
            }).catch((error) => {
                console.log("Error")
            })
    })
    app.get('/current-session', (req, res) => {
        jwt.verify(req.session.jwt, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
            if (err || !decodedToken) {
                res.send(false);
            } else {
                res.send(decodedToken);
            }
        });
    })

    app.get('/logout', (req, res) => {
        req.session = null;
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        res.clearCookie("spotify_auth_state");
        res.end();
    });

    app.get('/getTopTracks', (req, res) => {
        var access_token = req.cookies.access_token
        var type_term = req.query.type_term
        axios({
                method: 'GET',
                url: 'https://api.spotify.com/v1/me/top/tracks?time_range=' + type_term,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + access_token
                }
            })
            .then(response => {
                res.status(200).send(response.data)
            }).catch((error) => {
                console.log(error)
                res.status(401).send({
                    mesage: error
                })
            })
    });
    app.get('/getPlaylists', (req, res) => {
        var access_token = req.cookies.access_token
        var userId = req.query.userId
        axios({
                method: 'GET',
                url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + access_token
                }
            })
            .then(response => {
                res.status(200).send(response.data)
            }).catch((error) => {
                console.log(error)
                res.status(401).send({
                    mesage: error
                })
            })
    });

    app.get('/refresh_token', (req, res) => {
        var refresh_token = req.cookies.refresh_token;
        axios({
                method: 'post',
                url: 'https://accounts.spotify.com/api/token',
                data: querystring.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token
                }),
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
                },
            })
            .then(response => {
                res.cookie("access_token", response.data.access_token, {
                    httpOnly: true,
                });
                res.status(200).send(response.data);
            })
            .catch(error => {
                res.status(error.error.status).send(error.error.status);
            });
    });
    app.get('/getFollowedArtists', (req, res) => {
        var access_token = req.cookies.access_token
        axios({
                method: 'GET',
                url: 'https://api.spotify.com/v1/me/following?type=artist&limit=20',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + access_token
                }
            })
            .then(response => {
                res.status(200).send(response.data)
            }).catch((error) => {
                res.status(error.response.data.error.status).send({
                    message: error.response.data.error.message
                })
            })
    })
    app.get('/getInfoArtist', (req, res) => {
        var access_token = req.cookies.access_token;
        var artist = req.query.artist;
        axios({
                method: 'GET',
                url: 'https://api.spotify.com/v1/artists/' + artist,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + access_token
                }
            })
            .then(response => {
                res.status(200).send(response.data)
            }).catch((error) => {
                res.status(error.response.data.error.status).send({
                    message: error.response.data.error.message
                })
            })
    })
    app.get('/search',(req,res)=>{
        var access_token = req.cookies.access_token; 
        var busqueda = req.query.busqueda
        axios({
                method: 'GET',
                url: 'https://api.spotify.com/v1/search?q='+busqueda+'&type=track',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + access_token
                }
            })
            .then(response => {
                res.status(200).send(response.data)
            }).catch((error) => {
                res.status(error.response.data.error.status).send({
                    message: error.response.data.error.message
                })
            })  
    })
}