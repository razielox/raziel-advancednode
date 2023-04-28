'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session')
const passport = require('passport')
const {ObjectID} = require('mongodb')
const LocalStrategy = require('passport-local')
const app = express();
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

const ensureAuthenticated = (req,res,next) => {
  if(req.isAuthenticated()) return next()
  res.redirect('/')
}
myDB(async client => {
  const myDataBase = await client.db('database').collection('users')
  
  passport.use(new LocalStrategy((username, password, done)=> {
    myDataBase.findOne({username: username}, (err, user) => {
      console.log(`User ${username} attemped to log in`)
      if(err) return done(err)
      if(password) return done(null, user)
      if(password !== user.password) return done(null, false)
      return done(null, user)
    })
  }))
  
  app.route('/login').post(passport.authenticate('local', {failureRedirect:'/'}),(request, response) => {
    /* passport.authenticate('local',{failureRedirect: '/'}, (err, user, info) => {
      console.log(user)
      if(err) return next(err)
      if(!user) return response.redirect('/')
      request.logIn(user, (err) => {
        if(err) {
          return next(err)
        }
        return response.redirect('/profile')
      })
    })(request, response, next)  */
    //console.log(request.user, next)
    response.redirect('/profile')
  })

  app.route('/profile').get(ensureAuthenticated,(request, response) => {
    
    console.log(request.user)
    response.render('profile',{username: request.user.username})
  })

  app.route('/register').post((req, res, next) => {
    myDataBase.findOne({username: req.body.username}, (err, user) => {
      if(err) {
        next(err)
      } else if(user) {
        res.redirect('/')
      } else {
        myDataBase.insertOne({
          username: req.body.username,
          password: req.body.password
        }, (err, doc) => {
          if(err) {
            res.redirect('/')
          } else {
            next(null, doc.ops[0])
          }
        })
      }
    })
  }, passport.authenticate('local',{failureRedirect:'/'}),(req,res, next) =>{
    res.redirect('/profile')
  })

  app.route('/logout').get((req,res) => {
    
    req.logout()
    
    res.redirect('/')
  })

  app.route('/').get((req, res) => {
    res.render('index',{title: 'Connected to Database', message: 'Please log in', showLogin: true, showRegistration: true})
  });
  passport.serializeUser((user, done) => {
    done(null, user._id)
  })
  
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({_id: new ObjectID(id)}, (err, doc) => {
      done(null,doc)})
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
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
