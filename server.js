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
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const MongoStore = require('connect-mongo')(session)
const URI = process.env.MONGO_URI
const store = new MongoStore({url: URI})
const passportSocketIo = require('passport.socketio')
const cookieParser = require('cookie-parser')
fccTesting(app); //For FCC testing purposes

app.set('view engine', 'pug')
app.set('views', './views/pug')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie:{secure:false},
  key: 'express.sid',
  store: store
}))

app.use('/public', express.static(process.cwd() + '/public'));
app.use(passport.initialize())
app.use(passport.session())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const onAuthorizeSucces = (data, accept) => {
  console.log('success connection to socket.io')
  accept(null, true)
}

const onAuthorizeFail = (data, message, error, accept) => {
  if (error) throw new Error(message)
  console.log('fail to connect', message)
  accept(null, false)
}

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSucces,
    fail: onAuthorizeFail
  })
)


myDB(async client => {
  const myDataBase = await client.db('database').collection('users')
  
  auth(app, myDataBase)
  routes(app, myDataBase)
  let currentUsers = 0
  io.on('connection', socket => {
    ++currentUsers
    io.emit('user count', currentUsers)
    console.log('A user has connected')
    console.log(socket.request.user)
    socket.on('disconnect', () => {
      --currentUsers
      io.emit('user count', currentUsers)
      console.log('A user has disconnected')
    })
  })
  
  app.use((request, response,next) => {
    response.status(404).type('text').send('Not Found')
  })
}).catch(err => {
  app.route('/').get((request, response) => {
    response.render('index', {title: err, message: 'unable to connect to database'})
  })
})

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
