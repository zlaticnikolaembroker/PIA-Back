const db = require('./../database/pool.ts');

module.exports.getFarmerGardens = (request, response) => {
  const id = parseInt(request.params.id)
  
  db.getPool().query('select ng.id, ng.name, ng.place, ng.water, ' +
  'ng.temperature, seedlings.occupied_slots, ' +
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