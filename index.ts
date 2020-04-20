const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors');
const users = require('./endpoints/users.ts');
const port = 3000

app.use(cors());
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/users', users.getUsers)
app.get('/users/:id', users.getUserById)
app.post('/users', users.createUser)
app.post('/users/get_user_by_username', users.getUserByUsername)
app.put('/users/:id', users.updateUser)
app.delete('/users/:id', users.deleteUser)

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})