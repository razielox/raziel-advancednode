const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')
const {ObjectID} = require('mongodb')
const GitHubStrategy = require('passport-github').Strategy


module.exports = async(app, myDataBase) => {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://raziel-advancednode-production.up.railway.app/auth/github/callback"
  },
    (accessToken, refreshToken, profile, cb) => {
      //console.log(profile)
      myDataBase.findOne({githubId: profile.id}, (err, user) => {
        if(user) {
          return cb(err,user)
        } else {
          myDataBase.insertOne({githubId: profile.id, username: profile.username, provider: profile.provider})

          return cb(err,user)
        }
      })
    } ))
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

      passport.serializeUser((user, done) => {
        done(null, user._id)
      })
      
      passport.deserializeUser((id, done) => {
        myDataBase.findOne({_id: new ObjectID(id)}, (err, doc) => {
          done(null,doc)})
      })
}