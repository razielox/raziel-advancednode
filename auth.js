const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')
const {ObjectID} = require('mongodb')

module.exports = async(app, myDataBase) => {
      passport.use(new LocalStrategy((username, password, done)=> {
        myDataBase.findOne({username: username}, (err, user) => {
          console.log(`User ${username} attemped to log in`)
          console.log(bcrypt.compareSync(password, user.password))
          if(err) return done(err)
          //if(password) return done(null, user)
          if(!bcrypt.compareSync(password, user.password)) return done(null, false)
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