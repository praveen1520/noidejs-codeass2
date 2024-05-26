const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const path = require('path')
const pathroute = path.join(__dirname, 'twitterClone.db')
const app = express()
app.use(express.json())
let db
const initalizedb = async () => {
  try {
    db = await open({
      filename: pathroute,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('https://localhost:3000/')
    })
  } catch (e) {
    console.log(`error message at '${e.message}'`)
  }
}
initalizedb()
function autheticate(request, response, next) {
  let jwttoken
  const authhead = request.headers['Authorization']
  if (autheticate !== undefined) {
    jwttoken = authhead.split(' ')[1]
  }
  if (jwttoken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    const compare = jwt.verify(jwttoken, 'SECREAT', async (payload, error) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.payload = payload
        next()
      }
    })
  }
}
app.post('/register/', async (request, response) => {
  const {username, password} = request.body
  const passwordlength = password.length
  const passhash = await bcrypt.hash(request.body.password, 10)
  const query = `SELECT * FROM user WHERE username='${username}';`
  const run = await db.get(query)
  if (passwordlength < 6) {
    response.status(400)
    response.send('Password is too short')
  } else if (run !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else {
    const sql = `INSERT INTO user(username,password) VALUES ('${username}','${passhash}')`
    const ecexcu = await db.run(sql)
    response.status(200)
    response.send('User created successfully')
  }
})
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const sqlquery = `SELECT * FROM user WHERE username='${username}';`
  const runquer = await db.get(sqlquery)
  if (runquer === undefined) {
    response.status(400)
    response.send(`Invalid user`)
  } else {
    const passwordver = await bcrypt.compare(
      request.body.password,
      runquer.password,
    )
    if (passwordver === true) {
      const payload = {
        username: username,
      }
      const jwttoken = jwt.sign(payload, 'SECREAT')
      response.status(200)
      response.send({jwttoken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
const convetapi4 = obj => {
  return {
    username: obj.username,
    tweet: obj.tweet,
    dateTime: obj.dateTime,
  }
}
app.get('/user/tweets/feed/', async (request, response) => {
  const {payload} = request
  const {user_id, name, username, gender} = payload
  //const sqlquery = `SELECT * from user Where username='${username}';`
  //const dbrun1 = await db.get(sqlquery)

  //const userid = dbrun1['user_id']
  let limit = 4
  const sqquery = `SELECT username,tweet,date_time AS dateTime FROM follower INNER JOIN tweet ON  follower_user_id=tweet.user_id  NATURAL JOIN user WHERE follower_user_id='${user_id}' ORDER BY date_time DESC LIMIT '${limit}';`
  const runquer = await db.all(sqquery)
  response.send(runquer.map(each => convetapi4(each)))
})
module.exports = app
