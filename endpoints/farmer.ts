const db = require('./../database/pool.ts');

module.exports.getFarmerGardens = (request, response) => {
  const id = parseInt(request.params.id)
  
  db.getPool().query('select ng.id, ng.name, ng.place, ng.water, ' +
  'ng.temperature, CASE WHEN seedlings.occupied_slots is null THEN 0 ELSE seedlings.occupied_slots END as occupied_slots, ' +
  '(ng.height * ng.width - CASE WHEN seedlings.occupied_slots is null THEN 0 ELSE seedlings.occupied_slots END) as free_slots ' +
  'from nursery_garden ng ' +
  'join users u on u.id = ng.id_farmer ' +
  'left join (select ng.id, count(*) as occupied_slots ' +
  'from nursery_garden ng ' +
  'join seedling s on ng.id = s.id_nursery_garden ' +
  'group by ng.id) seedlings on seedlings.id = ng.id ' + 
  'where u.id = ' + id, (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows)
  })
}

module.exports.getFarmerGarden = (request, response) => {
  const id = parseInt(request.params.id)
  let result;
  db.getPool().query('select ng.id, ng.name, ng.place, ng.water, ' +
  'ng.temperature, CASE WHEN seedlings.occupied_slots is null THEN 0 ELSE seedlings.occupied_slots END as occupied_slots, ' +
  '(ng.height * ng.width - CASE WHEN seedlings.occupied_slots is null THEN 0 ELSE seedlings.occupied_slots END) as free_slots , ' +
  'ng.height , ng.width ' +
  'from nursery_garden ng ' +
  'left join (select ng.id, count(*) as occupied_slots ' +
  'from nursery_garden ng ' +
  'join seedling s on ng.id = s.id_nursery_garden ' +
  'group by ng.id) seedlings on seedlings.id = ng.id ' +
  'where ng.id = ' + id, (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    result = {
      ...results.rows[0],
      seedlings : [],
    }
    db.getPool().query('select s.id, s.name, (progress * 1.0 / 100) as progress, x, y, u.fullname as producer ' +
    'from seedling s ' +
    'join users u on u.id = s.id_company ' +
    'where id_nursery_garden =' + id, (error, results) => {
      if (error) {
        return response.status(500).json(error);
      }
      result.seedlings = results.rows;
      return response.status(200).json(result)
    })

  });
}

module.exports.updateGardenTemperature = (request, response) => {
  const id = request.body.id;
  const temp_change = request.body.temp_change;
  
  db.getPool().query('update nursery_garden ' +
  'set temperature = temperature + ' + temp_change + 
  'where id = ' + id, (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows)
  })
}

module.exports.updateGardenWater = (request, response) => {
  const id = request.body.id;
  const twater_change = request.body.temp_change;
  
  db.getPool().query('update nursery_garden ' +
  'set water = water + ' + twater_change + 
  'where id = ' + id, (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows)
  })
}

module.exports.getProductsForOnlineShop = (request, response) => {
  db.getPool().query('select p.id, p.name, p.price, p.available, p.type, ' +
  'p.time_to_grow, p.acceleration_time, u.id as company_id, u.fullname as producer, avg(rating) as average_rating ' +
  'from products p ' +
  'join users u on u.id = p.company_id ' +
  'left join comments c on c.product_id = p.id ' +
  'where archived = false or archived is null ' +
  'group by p.id, p.name, p.price, p.available, p.type, p.time_to_grow, p.acceleration_time, u.id, u.fullname;', (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows)
  })
}

module.exports.getProductForOnlineShop = (request, response) => {
  const id = parseInt(request.params.id)
  db.getPool().query('select p.id, p.name, p.price, p.available, p.type, ' +
  'p.time_to_grow, p.acceleration_time, u.fullname as producer, avg(rating) as average_rating ' +
  'from products p ' +
  'join users u on u.id = p.company_id ' +
  'left join comments c on c.product_id = p.id ' +
  'where (archived = false or archived is null) and p.id = ' + id + 
  ' group by p.id, p.name, p.price, p.available, p.type, p.time_to_grow, p.acceleration_time, u.fullname ', (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    const result = {
      ...results.rows[0],
      comments: [],
    }

    db.getPool().query('select u.username, c.rating, c.comment ' +
    'from comments c ' +
    'join users u on u.id = c.farmer_id ' +
    'where product_id = ' + id, (error, results) => {
      if (error) {
        return response.status(500).json(error);
      }
      result.comments = results.rows ? results.rows : [];
      return response.status(200).json(result)
    });
  });
}

module.exports.createOrder = (request, response) => {
  const farmer_id = request.body.farmer_id;
  const company_id = request.body.company_id;
  const garden_id = request.body.garden_id;
  let products = request.body.products;
  db.getPool().query('insert into orders(farmer_id, date_of_order, status, company_id) ' +
  'values(' + farmer_id + ', current_date, \'Received\',' + company_id +');', (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    products = products.map(element => {
      return {
        ...element,
        finished: false,
      }
    });
    db.getPool().query('insert into nursery_garden_order(id_order, id_nursery_garden) ' +
      'values ((select max(id) from orders), ' + garden_id + ');', async (error, results) => {
        if (error) {
          return response.status(500).json(error);
        }
        products.forEach(element => {
          db.getPool().query('insert into order_product(order_id, product_id, amount,price) ' +
          'values ((select max(id) from orders), ' + element.product_id + ', ' + element.amount + ', ' + element.price + ');', (error, results) => {
            if (error) {
              return response.status(500).json(error);
            }
            element.finished = true;
          }) 
        });
        while (products.filter(element => {
          return element.finished === false;
        }).lenght > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        return response.status(200).json('');
      }) 
  });
}

module.exports.getOrders = (request, response) => {
  const garden_id = parseInt(request.params.garden_id)
  db.getPool().query('select o.*, u.fullname ' +
  'from orders o ' +
  'join users u on u.id = o.company_id ' +
  'join nursery_garden_order ngo on ngo.id_order = o.id ' +
  'where status not in (\'Done\', \'Rejected\') ' +
  'and id_nursery_garden = ' + garden_id, (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows);
  });
}

module.exports.getSeedlingInfo = (request, response) => {
  const seedling_id = parseInt(request.params.seedling_id)
  db.getPool().query('select s.id, s.name, (progress * 1.0 / 100) as progress, x, y, u.fullname as producer ' +
  'from seedling s ' +
  'join users u on u.id = s.id_company ' +
  'where s.id =' + seedling_id, (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows[0]);
  });
}

module.exports.getProducts = (request, response) => {
  const garden_id = parseInt(request.params.garden_id)
  db.getPool().query('select ngp.amount, p.name, p.type, p.time_to_grow, p.acceleration_time, u.fullname ' +
  'from nursery_garden_product ngp ' +
  'join products p on p.id = ngp.id_product ' +
  'join users u on u.id = p.company_id ' + 
  'where ngp.id_nursery_garden = ' + garden_id, (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows);
  });
}

module.exports.getGardenPreparations = (request, response) => {
  const garden_id = parseInt(request.params.garden_id)
  db.getPool().query('select ngp.amount, p.id, p.name, p.acceleration_time ' +
  'from nursery_garden_product ngp ' +
  'join products p on p.id = ngp.id_product ' +
  'join users u on u.id = p.company_id ' + 
  'where p.type = \'Preparation\' and ngp.amount > 0 and ngp.id_nursery_garden = ' + garden_id, (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows);
  });
}

module.exports.getGardenSeedlings = (request, response) => {
  const garden_id = parseInt(request.params.garden_id)
  db.getPool().query('select ngp.amount, p.id, p.name, p.time_to_grow, p.company_id ' +
  'from nursery_garden_product ngp ' +
  'join products p on p.id = ngp.id_product ' +
  'join users u on u.id = p.company_id ' + 
  'where p.type = \'Seedling\' and ngp.amount > 0 and ngp.id_nursery_garden = ' + garden_id, (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    return response.status(200).json(results.rows);
  });
}

module.exports.usePreparation = async (request, response) => {
  const seedling_id = request.body.seedling_id;
  const preparation_id = request.body.preparation_id;
  const garden_id = request.body.garden_id;
  const acceleration_time = request.body.acceleration_time;
  let result = await db.getPool().query('UPDATE seedling ' +
    'SET progress = progress + ' + acceleration_time  + ' ' + 
    'WHERE id = ' + seedling_id +';' ).catch(err => {
    return err;
  });
  if (!result.rows) {
    return response.status(500).json(result);
  }
  result = await db.getPool().query('UPDATE nursery_garden_product ' +
    'SET amount= amount - 1 ' +
    'WHERE id_nursery_garden =  ' + garden_id +' and id_product = ' + preparation_id +';' ).catch(err => {
    return err;
  });
  if (!result.rows) {
    return response.status(500).json(result);
  }

  return response.status(200).json();
}

module.exports.removeSeedling = async (request, response) => {
  const seedling_id = request.body.seedling_id;
  let result = await db.getPool().query('UPDATE seedling ' +
    'SET x = null, y = null, id_nursery_garden = null ' + 
    'WHERE id = ' + seedling_id +';' ).catch(err => {
    return err;
  });
  if (!result.rows) {
    return response.status(500).json(result);
  }

  return response.status(200).json();
}

module.exports.plantSeedling = async (request, response) => {
  const x = request.body.x;
  const y = request.body.y;
  const garden_id = request.body.garden_id;
  const name = request.body.name;
  const company_id = request.body.company_id;
  const time_to_grow = request.body.time_to_grow;
  let result = await db.getPool().query('insert into seedling(x, y, id_nursery_garden, progress, name, id_company, days_to_grow) ' +
  'Values('+x+', '+ y+ ', '+ garden_id +', 0, \' '+ name +'\', ' + company_id + ', ' + time_to_grow + ') ;' ).catch(err => {
    return err;
  });
  if (!result.rows) {
    return response.status(500).json(result);
  }

  return response.status(200).json();
}

module.exports.updateGardenTemperatureAndWaterEveryHour = () => {
  db.getPool().query('update nursery_garden ' +
  'set water = water - 1, temperature = temperature - 0.5;', () => {})
}