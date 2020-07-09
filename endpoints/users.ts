const db = require('./../database/pool.ts');

module.exports.getUsers = (request, response) => {
  db.getPool().query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows)
  })
}

module.exports.getUserById = (request, response) => {
  const id = parseInt(request.params.id)

  db.getPool().query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows[0])
  })
}

module.exports.getUserByUsername = (request, response) => {
  const username = request.body.username;

  const querystring = 'SELECT * FROM users WHERE username = \'' + username + '\' and confirmed = true';

  db.getPool().query(querystring, (error, results) => {
    if (error) {
      return response.status(500).json(error)
    }
    return response.status(200).json(results.rows[0]);
  });
}

module.exports.getUnconfirmedUsers = (request, response) => {

  const querystring = 'SELECT * FROM users WHERE confirmed is null';

  db.getPool().query(querystring, (error , results) => {
    if (error) {
      return response.status(500).json(error)
    }
    return response.status(200).json(results ? results.rows : []);
  });
}

module.exports.updateUserConfirmation = async (request, response) => {

  const userId = request.body.id;
  const confirmation = request.body.confirmation;

  const querystring = 'UPDATE users set confirmed = \'' + confirmation + '\' where id = ' + userId;

  let result = await db.getPool().query(querystring).catch(err => {
    return err;
  });
  if (!result.rows) {
    return response.status(500).json(result);
  }
  const checkIfUserIsCompanyQueryString = 'select role_id from users where id = $1;'
  result = await db.getPool().query(checkIfUserIsCompanyQueryString, [userId]).catch(err => {
    return err;
  });
  if (!result.rows) {
    return response.status(500).json(result);
  }
  if (+result.rows[0].role_id != 2){
    return response.status(200).json();
  }

  const addCouriersQueryStrint = 'INSERT INTO courier(company_id, name) ' +
    'VALUES ($1, $2);';
  for(let i = 0; i < 5; i++){
    result = await db.getPool().query(addCouriersQueryStrint, [userId, userId + ' ' + i]).catch(err => {
      return err;
    });
    if (!result.rows) {
      return response.status(500).json(result);
    }
  }

  return response.status(200).json();
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
      return response.status(500).json(error)
    }
    return response.status(200).json();
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
        return response.status(500).json({error: error});
      }
      return response.status(200).json();
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
        return response.status(500).json({error: error});
      }
      return response.status(200).json();
    }
  )
}

module.exports.deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  db.getPool().query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json();
  })
}