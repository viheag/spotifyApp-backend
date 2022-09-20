// server.js
const express = require('express'); 
var cookieParser = require('cookie-parser');
const helmet = require('helmet');
const hpp = require('hpp');
const csurf = require('csurf');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('morgan');
const app = express();

app.use(logger('dev'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(cors()).use(cookieParser());
app.use(helmet());
app.use(hpp());

/* Import config */
dotenv.config({path: path.resolve(__dirname, '.env')}); 
   
require('./auth')(app);

app.get("/", (req, res) => { 
    res.send("App working!");

});

app.listen(3000, () => {
    console.log("I'm listening!");
});

module.exports = app;