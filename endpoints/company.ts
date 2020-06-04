const db = require('./../database/pool.ts');

module.exports.getCompanyProducts = (request, response) => {
  const id = parseInt(request.params.id)
  db.getPool().query('select * from products where company_id = $1;', [id], (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows)
  })
}

module.exports.getCompanyOrders = (request, response) => {
  const id = parseInt(request.params.id)
  db.getPool().query('select orders.*, users.name || users.lastname as farmerName from orders join users on users.id = orders.farmer_id where company_id = $1;', [id], (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results !== undefined ? results.rows : []);
  });
}

module.exports.orderSetStatus = (request, response) => {
  const id = request.body.id;
  let newStatus = request.body.acceptOrder === true ? 'On Wait' : 'Rejected';
  db.getPool().query('update orders set status = $1 where id = $2;', [newStatus, id], (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    if (newStatus === 'On Wait') {
      db.getPool().query('select company_id from orders where id = ' + id, (error, results) => {
        if (error) {
          return response.status(200).json(false);
        }
        const company_id = results.rows[0].company_id
        db.getPool().query('select id from courier where company_id = ' + company_id + ' and order_id is null limit 1', (error, results) => {
          if (error || results.rows.length == 0) {
            return response.status(200).json(false);
          }
          const courier_id = results.rows[0].id;
          db.getPool().query('update courier set order_id = ' + id + ' where id = ' + courier_id, (error, results) => {
            if (error) {
              return response.status(200).json(false);
            }
            newStatus = "In Progress";
            db.getPool().query('update orders set status = $1 where id = $2;', [newStatus, id], (error, results) => {
              if (error) {
                return response.status(500).json(error);
              }
              return response.status(200).json(true);
            });
          });
        });
      });
    }
    if (newStatus !== 'On Wait') {
      return response.status(200).json(false);
    }
  });
}

module.exports.getProductDetials = (request, response) => {
  const id = parseInt(request.params.id)
  db.getPool().query('SELECT p.* , avg(rating) as averageRating, string_agg(comment, \', \') AS comments ' +
  'FROM products p ' + 
  'left join comments com on p.id = com.product_id ' +
  'where p.id = $1 ' +
  'group by p.id;', [id], (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results !== undefined ? results.rows[0] : null);
  });
}

module.exports.updateProduct = (request, response) => {
  const id = request.body.id;
  const name = request.body.name;
  const available = request.body.available;
  const price = request.body.price;
  const archived = request.body.archived;
  const type = request.body.type;
  const time_to_grow = request.body.time_to_grow ? request.body.time_to_grow : null;
  const acceleration_time = request.body.acceleration_time ? request.body.acceleration_time : null;
  db.getPool().query('update products set name = \'' + name +'\', available = \'' + available +  '\', price = \'' + price + 
                     '\' , archived = ' + archived + ', type = \'' + type + '\' ,time_to_grow =' + time_to_grow + ', acceleration_time = ' + acceleration_time +  
                      ' where id = ' + id + ';', (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json();
  });
}

module.exports.addProduct = (request, response) => {
  const company_id = request.body.company_id;
  const name = request.body.name;
  const available = request.body.available;
  const price = request.body.price;
  const type = request.body.type;
  const time_to_grow = request.body.time_to_grow;
  const acceleration_time = request.body.acceleration_time;

  db.getPool().query('insert into products(name, price, available, company_id, type, time_to_grow, acceleration_time) values( \'' + 
                      name + '\' , ' + price + ' , ' + available + ', ' + company_id + ', \'' + type +  '\',' + time_to_grow + ',' + acceleration_time + ');', (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json();
  });
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
      return response.status(500).json(error);
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
        return response.status(500).json(error);
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
          return response.status(500).json(error);
        }
        results.rows.forEach(element => {
          products.push({
            amount: element.amount,
            name: element.name,
            price: element.price,
            totalPrice: element.totalprice,
          });
        });
        products.forEach((product) => {
          orderInfo.totalPrice += +product.totalPrice;
        })
        finalResponse = { 
          farmerInfo,
          orderInfo,
          products,
        };
        return response.status(200).json(finalResponse);
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
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows);
  });
}

module.exports.getCompanyOrders = (request, response) => {
  const company_id = parseInt(request.params.id)
  db.getPool().query('select o.id, date_of_order, status, date_of_completion, u.name ' +
  'from orders o ' +
  'join users u on u.id = o.farmer_id ' +
  'where company_id = ' + company_id +
  'and date_of_order > current_date - interval \'30\' day;', (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows);
  });
}

module.exports.updateOrderStatus = async (request, response) => {
  const order_id = request.body.id;
  const newStatus = request.body.status;
  const updateOrderStatusQuery = newStatus === "Done" ? 'update orders set status = \'' + newStatus + '\', date_of_completion = current_date where id = ' + order_id : 'update orders set status = \'' + newStatus + '\' where id = ' + order_id;
  let result = await db.getPool().query(updateOrderStatusQuery).catch(err => {
    return err;
  });
  if (!result.rows) {
    console.log(1);
    console.log(result);
    return response.status(500).json(result);
  }
  if (newStatus === 'On Wait' || newStatus === "In Progress") {
    result = await db.getPool().query('select company_id from orders where id = ' + order_id).catch(err => {
      return err;
    });
    if (!result.rows) {
      console.log(2);
      console.log(result);
      return response.status(200).json(false);
    }
    const company_id = result.rows[0].company_id;
    result = await db.getPool().query('select id from courier where company_id = ' + company_id + ' and order_id is null limit 1').catch(err => {
      return err;
    });
    if (!result.rows || result.rows.length == 0) {
      console.log(3);
      console.log(result);
      return response.status(200).json(false);
    }
    const courier_id = result.rows[0].id;
    result = await db.getPool().query('update courier set order_id = ' + order_id + ' where id = ' + courier_id).catch(err => {
      return err;
    });
    if (!result.rows) {
      console.log(4);
      console.log(result);
      return response.status(200).json(false);
    }
    if (newStatus === "On Wait") {
      result = await db.getPool().query('update orders set status = \'In Progress\' where id = ' + order_id).catch(err => {
        return err;
      });
      if (!result.rows) {
        console.log(5);
        console.log(result);
        return response.status(500).json(result);
      }
      return response.status(200).json(order_id);
    } else {
      return response.status(200).json(true);
    }
  } else {
    if (newStatus === 'Done' || newStatus === 'Rejected') {
      result = await db.getPool().query('select company_id ' +
      'from orders o ' +
      'where o.id = ' + order_id).catch(err => {
        return err;
      });
      if (!result.rows || result.rows.length == 0) {
        console.log(6);
        console.log(result);
        return response.status(200).json(false);
      }
      const company_id = result.rows[0].company_id;

      result = await db.getPool().query('select id ' +
      'from courier c ' +
      'where c.order_id = ' + order_id).catch(err => {
        return err;
      });

      if (!result.rows || result.rows.length == 0) {
        console.log(7);
        console.log(result);
        return response.status(200).json(false);
      }
      const courier_od = result.rows[0].id;

      result = await db.getPool().query('select id ' +
      'from orders o ' +
      'where status = \'On Wait\' and company_id = ' + company_id).catch(err => {
        return err;
      });
      if (!result.rows) {
        console.log(8);
        console.log(result);
        return response.status(500).json(false);
      }

      const new_order_id = result.rows.length == 0 ? null : result.rows[0].id;

      result = await db.getPool().query('update courier set order_id = ' + new_order_id + ' where id = ' + courier_od).catch(err => {
        return err;
      });
      if (!result.rows) {
        console.log(9);
        console.log(result);
        return response.status(500).json(result);
      }
      
      if (new_order_id === null) {
        result = await db.getPool().query('select op.product_id, op.amount ' +
        'from orders o ' +
        'join order_product op on op.order_id = o.id ' +
        'where op.order_id = ' + order_id).catch(err => {
          return err;
        });
        if (!result.rows) {
          console.log(10);
          console.log(result);
          return response.status(500).json(result);
        }
        for(let i = 0; i< result.rows.length; i++) {
          let result2 = await updateProductAmount(result.rows[i].product_id, result.rows[i].amount);
          if (!result2.rows) {
            console.log(11);
            console.log(result2);
            return response.status(500).json(result2);
          }
          result2 = await updateProductAmountInWarehouse(result.rows[i].product_id, result.rows[i].amount, order_id);
          if (!result2.rows) {
            console.log(111);
            console.log(result2);
            return response.status(500).json(result2);
          }
        }
        return response.status(200).json(true);
      }

      result = await db.getPool().query('update orders set status = \'In Progress\' where id = ' + new_order_id).catch(err => {
        return err;
      });
      if (!result.rows) {
        console.log(12);
        console.log(result);
        return response.status(500).json(result);
      }

      if (newStatus !== "Done") {
        return response.status(200).json(new_order_id);
      }

      result = await db.getPool().query('select op.product_id, op.amount ' +
      'from orders o ' +
      'join order_product op on op.order_id = o.id ' +
      'where op.order_id = ' + order_id).catch(err => {
        return err;
      });
      if (!result.rows) {
        console.log(13);
        console.log(result);
        return response.status(500).json(result);
      }

      for(let i = 0; i< result.rows.length; i++) {
        let result2 = await updateProductAmount(result.rows[i].product_id, result.rows[i].amount);
        if (!result2.rows) {
          console.log(14);
          console.log(result2);
          return response.status(500).json(result2);
        }
        result2 = await updateProductAmountInWarehouse(result.rows[i].product_id, result.rows[i].amount, order_id);
        if (!result2.rows) {
          console.log(141);
          console.log(result2);
          return response.status(500).json(result2);
        }
      }
      return response.status(200).json(new_order_id);

    } else {
      return response.status(200).json(false);
    }
  }
}

async function updateProductAmount(product_id, amount) {
  const result = await db.getPool().query('update products set available = available - ' + amount + ' where id =' + product_id).catch(err => {
    return err;
  });
  return result;
}

async function updateProductAmountInWarehouse(product_id, amount, order_id) {
  let result = await db.getPool().query('select id_nursery_garden ' +
  'from nursery_garden_order ' +
  'where id_order =' + order_id).catch(err => {
    return err;
  });

  if (!result.rows) {
    return result;
  }

  result = await db.getPool().query('UPDATE nursery_garden_product SET amount = amount + ' + amount + ' WHERE id_nursery_garden= '+ +result.rows[0].id_nursery_garden +' and id_product = ' + product_id + '; ' +
  'INSERT INTO nursery_garden_product (id_nursery_garden, id_product, amount) ' +
  'SELECT '+ +result.rows[0].id_nursery_garden + ', ' + product_id+', ' + amount + 
  'WHERE NOT EXISTS (SELECT 1 FROM nursery_garden_product WHERE id_nursery_garden = '+ +result.rows[0].id_nursery_garden+' and id_product =  ' + product_id+');').catch(err => {
    return err;
  });

  return result;
  
}