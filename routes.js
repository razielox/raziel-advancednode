const passport = require('passport')
const bcrypt = require('bcrypt')
//const ensureAuthenticated = require('./auth')

module.exports = (app, myDataBase) => {
  
const ensureAuthenticated = (req,res,next) => {
    if(req.isAuthenticated()) return next()
    res.redirect('/')
  }
app.route('/login').post(passport.authenticate('local', {failureRedirect:'/'}),(request, response) => {
    
    response.redirect('/profile')
  })

  app.route('/profile').get(ensureAuthenticated,(request, response) => {
    
    console.log(request.user)
    response.render('profile',{username: request.user.username})
  })

  app.route('/register').post((req, res, next) => {
    //console.log(req)
    myDataBase.findOne({username: req.body.username}, (err, user) => {
      if(err) {
        next(err)
      } else if(user) {
        res.redirect('/')
      } else {
        const password = bcrypt.hashSync(req.body.password, 12)
        myDataBase.insertOne({
          username: req.body.username,
          password: password
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
  
  app.route('/auth/github').get(passport.authenticate('github'))

  app.route('/auth/github/callback').get(
    passport.authenticate('github',{failureRedirect:'/'}),
    (req, res) => {
      console.log(req)
    req.session.user_id = req.user.id
    res.redirect('/chat')
  })

  app.route('/chat').get(ensureAuthenticated, (req, res) => {
    res.render('chat',{user: req.user})
  })
    
  app.route('/').get((req, res) => {
    res.render('index',{title: 'Connected to Database', message: 'Please log in', showLogin: true, showRegistration: true, showSocialAuth: true})
  });
}