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

app.get('/users', users.getUsers);
app.get('/users/:id', users.getUserById);
app.get('/users_unconfirmed', users.getUnconfirmedUsers);
app.post('/users', users.createUser);
app.post('/users/get_user_by_username', users.getUserByUsername);
app.post('/users/confirm_user', users.updateUserConfirmation);
app.post('/users/update_password', users.updateUsersPassword);
app.post('/users/update_admin', users.updateAdmin);
app.post('/users/update_farmer', users.updateFarmer);
app.post('/users/update', users.updateUser);
app.delete('/users/:id', users.deleteUser);

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})