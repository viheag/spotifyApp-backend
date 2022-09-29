const express = require('express');
const querystring = require('querystring');
var request = require('request');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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
                    client_id: process.env.CLIENT_ID,
                    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                    state: state,
                    scope:"streaming \
                    user-read-email \
                    user-read-private\
                    user-top-read"
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
        res.redirect(
            `/`
        );
    });
    app.get('/getTopTracks', (req, res) => {
        var access_token = req.cookies.access_token 
        axios({
                method: 'GET',
                url: 'https://api.spotify.com/v1/me/top/tracks',
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
}