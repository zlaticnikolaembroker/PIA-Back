const db = require('./../database/pool.ts');

module.exports.getCompanyProducts = (request, response) => {
  const id = parseInt(request.params.id)
  db.getPool().query('select * from products where company_id = $1;', [id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).json(results.rows)
  })
}

module.exports.getCompanyOrders = (request, response) => {
  const id = parseInt(request.params.id)
  db.getPool().query('select orders.*, users.name || users.lastname as farmerName from orders join users on users.id = orders.farmer_id where company_id = $1;', [id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).json(results !== undefined ? results.rows : []);
  })
}

module.exports.orderSetStatus = (request, response) => {
  const id = request.body.id;
  const newStatus = request.body.acceptOrder === true ? 'On Wait' : 'Rejected';
  db.getPool().query('update orders set status = $1 where id = $2;', [newStatus, id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).json(results !== undefined ? results.rows : []);
  })
}

module.exports.getProductDetials = (request, response) => {
  const id = parseInt(request.params.id)
  db.getPool().query('SELECT p.* , avg(rating), string_agg(comment, \', \') AS comments ' +
  'FROM products p ' + 
  'left join comments com on p.id = com.product_id ' +
  'where p.id = $1 ' +
  'group by p.id;', [id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).json(results !== undefined ? results.rows[0] : null);
  })
}