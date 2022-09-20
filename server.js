// server.js
const express = require('express');
const session = require('cookie-session');
const helmet = require('helmet');
const hpp = require('hpp');
const csurf = require('csurf');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('morgan');
const app = express();
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "http://localhost:4200");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}
app.use(allowCrossDomain)

app.use(logger('dev'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(helmet());
app.use(hpp());

/* Import config */
dotenv.config({path: path.resolve(__dirname, '.env')}); 

/* Set Cookie Settings */
app.use(
    session({
        name: 'session',
        secret: process.env.COOKIE_SECRET,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 24 hours
    })
);
app.use(csurf());


/* const authRoutes = require('./auth'); */
require('./auth')(app);
 

app.get("/", (req, res) => {
    res.send("App working!");
});
app.listen(3000, () => {
    console.log("I'm listening!");
});

module.exports = app;