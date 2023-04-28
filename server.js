'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session')
const passport = require('passport')
const app = express();
const routes = require('./routes')
const auth = require('./auth')
fccTesting(app); //For FCC testing purposes

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie:{secure:false}
}))

app.set('view engine', 'pug')
app.set('views', './views/pug')
app.use('/public', express.static(process.cwd() + '/public'));
app.use(passport.initialize())
app.use(passport.session())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


myDB(async client => {
  const myDataBase = await client.db('database').collection('users')

  auth(app, myDataBase)
  routes(app, myDataBase)
  
  app.use((request, response,next) => {
    response.status(404).type('text').send('Not Found')
  })
}).catch(err => {
  app.route('/').get((request, response) => {
    response.render('index', {title: err, message: 'unable to connect to database'})
  })
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
