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
    response.status(200).json(results.rows)
  })
}

module.exports.getUserById = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).json(results.rows[0])
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

module.exports.updateUsersPassword = (request, response) => {
  const id = request.body.id;
  const password = request.body.password;

  pool.query(
    'UPDATE users SET password = $1 WHERE id = $2',
    [password, id],
    (error, results) => {
      if (error) {
        response.status(500).send({error: error});
      }
      response.status(200).send();
    }
  )
}

module.exports.updateAdmin = (request, response) => {
  const id = request.body.id;
  const password = request.body.password;
  const email = request.body.email;
  const username = request.body.username;

  pool.query(
    'UPDATE users SET password = $1, email = $2 , username = $3 WHERE id = $4',
    [password, email, username, id],
    (error, results) => {
      if (error) {
        response.status(500).send({error: error});
      }
      response.status(200).send();
    }
  )
}

module.exports.updateFarmer = (request, response) => {
  const id = request.body.id;
  const userFields = Object.getOwnPropertyNames(request.body);
  let query = 'UPDATE users SET ';
  userFields.forEach((field, index) => {
    if(field !== 'id') {
      query+= (field + ' = \'' + request.body[field] + '\',');
    }
  });
  query = query.substr(0, query.length - 1);
  query += ' where id = ' + id;
  pool.query(query,
    (error, results) => {
      if (error) {
        response.status(500).send({error: error});
      }
      response.status(200).send();
    }
  )
}

module.exports.deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).send();
  })
}