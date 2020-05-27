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