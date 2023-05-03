const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')
const {ObjectID} = require('mongodb')
const GitHubStrategy = require('passport-github').Strategy
const httpProxy = require('https-proxy-agent')
const { default: HttpsProxyAgent } = require('https-proxy-agent/dist/agent')

module.exports = async(app, myDataBase) => {
  
  passport.serializeUser((user, done) => {
    done(null, user._id)
  })
  
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({_id: new ObjectID(id)}, (err, doc) => {
      if (err) {
        return console.error(err)
      }
      done(null,doc)})
  })
  
  passport.use(new LocalStrategy((username, password, done)=> {
    myDataBase.findOne({username: username}, (err, user) => {
      console.log(`User ${username} attemped to log in`)
      console.log(err, user)
      if(!user) return done(null, false)
      //if(password) return done(null, user)
      if(!bcrypt.compareSync(password, user.password)) return done(null, false)
      console.log(bcrypt.compareSync(password, user.password))
      return done(null, user)
    })
  }))
  const githubStrat = new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/auth/github/callback'
  },
    (accessToken, refreshToken, profile, cb) => {
      myDataBase.findOne({id: profile.id}, (err, user) => {
        if(user) {
          cb(err,user)
        } else {
          myDataBase.insertOne({
            id: profile.id, 
            username: profile.username,
            name:profile.name,
            photo:profile.photo,
            email: Array.isArray(profile.emails) ? profile.emails[0].value : 'No public email',
            created_on: new Date(),
            provider: profile.provider || ''})
            
            console.log(profile, accessToken)
            cb(err,user)
          }
      })
    } )

    passport.use(githubStrat)

}
