const db = require('./../database/pool.ts');

module.exports.getUsers = (request, response) => {
  db.getPool().query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).json(results.rows)
  })
}

module.exports.getUserById = (request, response) => {
  const id = parseInt(request.params.id)

  db.getPool().query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).json(results.rows[0])
  })
}

module.exports.getUserByUsername = (request, response) => {
  const username = request.body.username;

  const querystring = 'SELECT * FROM users WHERE username = \'' + username + '\' and confirmed = true';

  db.getPool().query(querystring, (error, results) => {
    if (error) {
      response.status(500).send(error)
    }
    response.status(200).send(results.rows[0]);
  });
}

module.exports.getUnconfirmedUsers = (request, response) => {

  const querystring = 'SELECT * FROM users WHERE confirmed is null';

  db.getPool().query(querystring, (error , results) => {
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

  db.getPool().query(querystring, (error , results) => {
    if (error) {
      response.status(500).send(error)
    }
    response.status(200).send();
  });
}

module.exports.createUser = (request, response) => {
  const userFields = Object.getOwnPropertyNames(request.body);
  let query = 'INSERT INTO users(';
  userFields.forEach((field) => {
    query += field + ',';
  });
  query = query = query.substr(0, query.length - 1);
  query += ') '
  query += 'VALUES (';
  userFields.forEach((field) => {
    if(request.body[field] !== null) {
      query += '\'' +request.body[field] + '\',';
    } else {
      query += request.body[field] + ',';
    }
  })
  query = query = query.substr(0, query.length - 1);
  query += ') ';
  db.getPool().query(query, (error, results) => {
    if (error) {
      response.status(500).send(error)
    }
    response.status(200).send();
  })
}

module.exports.updateUsersPassword = (request, response) => {
  const id = request.body.id;
  const password = request.body.password;

  db.getPool().query(
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

module.exports.updateUser = (request, response) => {
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
  db.getPool().query(query,
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

  db.getPool().query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).send();
  })
}