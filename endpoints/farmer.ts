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
    db.getPool().query('select s.name, (progress * 1.0 / 100) as progress, x, y, u.fullname as producer ' +
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
  const farmer_id = this.request.body.farmer_id;
  const company_id = this.request.body.company_id;
  let products = this.request.products;
  db.getPool().query('insert into orders(farmer_id, date_of_order, status, company_id) ' +
  'values(' + farmer_id + ', current_date, \'Received\',' + company_id +');', async (error, results) => {
    if (error) {
      return response.status(500).json(error);
    }
    products = products.map(element => {
      return {
        ...element,
        finished: false,
      }
    })
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
  });
}

module.exports.updateGardenTemperatureAndWaterEveryHour = () => {
  db.getPool().query('update nursery_garden ' +
  'set water = water - 1, temperature = temperature - 0.5;', () => {})
}