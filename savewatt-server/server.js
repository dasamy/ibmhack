const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// importing the models
const User = require('./models/User');

// importing the routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// creating our express app
const app = express();
app.use(cors());

// using morgan to print the requests in the console
app.use(morgan('dev'));

// view engine setup
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// to serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// body parser config
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// import passport and cookies while authenticating
require('passport');
app.use(passport.initialize());
app.use(cookieParser('1234-5678-9012-3456-7890'));

// import env variables from variables.env file
require('dotenv').config({path: 'variables.env'});

// connect to the mongo database
mongoose.connect(process.env.DBURL, { useNewUrlParser: true}, (err, resp) => {
    if(err) {
        console.log(`MongoDB Error ${err}`);
    }
    else {
        console.log(`MongoDB Connected`);
    }
});

app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    console.log(`Req headers are ${JSON.stringify(req.headers)}`);
    if(req.headers.authorization != undefined) {
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, '1234-5678', (err, payload) => {
            if(payload) {
                User.findOne({_id : payload._id}, { salt : 0, hash : 0 })
                .then((user) => {
                    req.user = user;
                    console.log('the user logged in is : ', user);
                    res.locals.user = user;
                });
            }
        });
    }
    next();
});

// configuring router
app.use('/', indexRouter);
app.use('/users', usersRouter);

// if no router found, 404 page
app.use((req, res, next) => {
    const err = new Error("No page was found with the link");
    err.status = 404;
    next(err);
});

// error handler
app.use((err, req, res, next) => {
    err.status = err.status || 500;
    err.message = err.message;
    res.render('error', {err});
});

// connect to server
const server = app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on the port ${server.address().port}`);
});