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
  db.getPool().query('SELECT p.* , avg(rating) as averageRating, string_agg(comment, \', \') AS comments ' +
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

module.exports.updateProduct = (request, response) => {
  const id = request.body.id;
  const name = request.body.name;
  const available = request.body.available;
  const price = request.body.price;
  const archived = request.body.archived;
  db.getPool().query('update products set name = \'' + name +'\', available = \'' + available+  '\', price = \'' + price +'\' , archived = ' + archived +' where id = ' + id + ';', (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).send();
  })
}

module.exports.addProduct = (request, response) => {
  const company_id = request.body.company_id;
  const name = request.body.name;
  const available = request.body.available;
  const price = request.body.price;
  db.getPool().query('insert into products(name, price, available, company_id) values( \'' + name + '\' , \'' + price + '\' , \'' + available + '\', \'' + company_id + '\');', (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).send();
  })
}

module.exports.getOrderDetials = (request, response) => {
  const id = parseInt(request.params.id);
  let finalResponse;
  let orderInfo;
  let farmerInfo;
  let products = [];
  db.getPool().query('select date_of_order, status, orders.date_of_completion ' +
  'from orders where id = $1;', [id], (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    orderInfo = {
      dateOfCompletion: results.rows[0].date_of_completion,
      dateOfOrder: results.rows[0].date_of_order,
      status: results.rows[0].status,
      totalPrice: 0,
    };
    db.getPool().query('select name, lastname, place ' +
    'from users ' +
    'join orders on orders.farmer_id = users.id ' +
    'where orders.id = $1;', [id], (error, results) => {
      if (error) {
        response.status(500).send(error);
      }
      farmerInfo = {
        lastname: results.rows[0].lastname,
        name: results.rows[0].name,
        place: results.rows[0].place,
      };
      db.getPool().query('select op.amount, op.price, p.name, op.amount * op.price as totalPrice '+
      'from order_product op ' +
      'join products p on p.id = op.product_id ' +
      'where order_id = $1;', [id], (error, results) => {
        if (error) {
          response.status(500).send(error);
        }
        results.rows.forEach(element => {
          products.push({
            amount: element.amount,
            name: element.name,
            price: element.price,
            totalPrice: element.totalprice,
          })
        });
        products.forEach((product) => {
          orderInfo.totalPrice += +product.totalPrice;
        })
        finalResponse = { 
          farmerInfo,
          orderInfo,
          products,
        };
        response.status(200).json(finalResponse).send();
      });
    });
  });
}

module.exports.getCompanyReport = (request, response) => {
  const company_id = parseInt(request.params.id)
  db.getPool().query('select date_of_order, count(*) ' +
  'from orders ' +
  'where company_id = ' + company_id +
  'and date_of_order > current_date - interval \'30\' day ' +
  'group by 1 ' +
  'order by 1;', (error, results) => {
    if (error) {
      response.status(500).send(error);
    }
    response.status(200).send(results.rows);
  })
}