const Pool = require('pg').Pool
const pool = new Pool({
  user: 'zlatic',
  host: 'localhost',
  database: 'PIA',
  password: 'Lozinka.123',
  port: 5432,
})

module.exports.getUsers = (request, response) => {
  pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).json(results)
  })
}

module.exports.getUserById = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).json(results.rows)
  })
}

module.exports.getUserByUsername = (request, response) => {
  const username = request.body.username;

  const querystring = 'SELECT * FROM users WHERE username = \'' + username + '\' and confirmed = true';

  pool.query(querystring, (error, results) => {
    if (error) {
      response.status(500).send(error)
    }
    response.status(200).send(results.rows[0]);
  });
}

module.exports.getUnconfirmedUsers = (request, response) => {

  const querystring = 'SELECT * FROM users WHERE confirmed is null';

  pool.query(querystring, (error , results) => {
    if (error) {
      response.status(500).send(error)
    }
    response.status(200).send(results ? results.rows : []);
  });
}

module.exports.updateUserConfirmation = (request, response) => {

  const userId = request.body.id;
  const confirmation = request.body.confirmation;

  const querystring = 'UPDATE users set confirmed = \'' + confirmation + '\' where id = ' + userId;

  pool.query(querystring, (error , results) => {
    if (error) {
      response.status(500).send(error)
    }
    response.status(200).send();
  });
}

module.exports.createUser = (request, response) => {
  const { username, password, email, date, place, role_id, fullName, name, lastname, phone } = request.body
  pool.query('INSERT INTO users (username, password, email, date, place, role_id, fullName, name, lastname, phone) '
  + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [username, password, email, date, place, role_id, fullName, name, lastname, phone], (error, results) => {
    if (error) {
      response.status(500).send(error)
    }
    response.status(200).send();
  })
}

module.exports.updateUser = (request, response) => {
  const id = parseInt(request.params.id)
  const { name, email } = request.body

  pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3',
    [name, email, id],
    (error, results) => {
      if (error) {
        response.status(500).send({error: error});
      }
      response.status(200).send(`User modified with ID: ${id}`)
    }
  )
}

module.exports.deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).send(`User deleted with ID: ${id}`)
  })
}