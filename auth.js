const express = require('express');
const querystring = require('querystring');
const axios = require('axios');
const jwt = require('jsonwebtoken');
module.exports = function (app) {
    app.get('/login', (req, res) => {
        res.redirect(`https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}`);
    });

    /*  app.get('/login', (req, res) => {
         try {  
             // Request for user full name, profile image, and email address.
             var scope = "user-read-private user-read-email";

             // 1. Get the user's authorization to access data.
             res.redirect(
                 "https://accounts.spotify.com/authorize?" +
                 querystring.stringify({
                     response_type: "code",
                     client_id: process.env.SPOTIFY_CLIENT_ID,
                     redirect_uri: process.env.SPOTIFY_REDIRECT_URI,  
                 })
             );
         } catch(e){
             console.log("error.",e);
         }
     }); */

    app.get('/callback', async (req, res) => {
        const code = req.query.code || null; 
        const clientId = process.env.CLIENT_ID;
        const secret = process.env.CLIENT_SECRET;
        const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
        const grant_type = 'authorization_code'; 
        console.log(clientid)
        axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: querystring.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri
            }),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${new Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
            },
        })
        .then(response => {
            if (response.status === 200) {
                res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
            } else {
                res.send(response);
            }
        })
        .catch(error => {
            res.send(error);
        });
        /* const {
           

        const basicHeader = Buffer.from(`${clientId}:${secret}`).toString('base64');
        const data = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
            grant_type,
            code,
            redirect_uri,
        }), {
            headers: {
                Authorization: `Basic ${basicHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).catch((error) => {
            console.log(error)
        });

        const sessionJWTObject = {
            token: data.access_token,
        };
        console.log(sessionJWTObject)

        req.session.jwt = jwt.sign(sessionJWTObject, process.env.JWT_SECRET_KEY)
        return res.redirect('/'); */
    });

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
}