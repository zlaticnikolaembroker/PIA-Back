const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors');
const users = require('./endpoints/users.ts');
const company = require('./endpoints/company.ts');
const farmer = require('./endpoints/farmer.ts');
const port = 3000

//job to execute every 1 hour
const schedule = require('node-schedule');
 
schedule.scheduleJob('25 * * * *', () => {
  console.log("***************");
  console.log("Hourly job started at");
  console.log(new Date());
  farmer.updateGardenTemperatureAndWaterEveryHour();
  console.log("Hourly job ended");
  console.log("***************");
});

app.use(cors());
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

//**************USERS*************/
app.get('/users', users.getUsers);
app.get('/users/:id', users.getUserById);
app.get('/users_unconfirmed', users.getUnconfirmedUsers);
app.post('/users', users.createUser);
app.post('/users/get_user_by_username', users.getUserByUsername);
app.post('/users/confirm_user', users.updateUserConfirmation);
app.post('/users/update_password', users.updateUsersPassword);
app.post('/users/update', users.updateUser);
app.delete('/users/:id', users.deleteUser);

//**************COMPANY*************/
app.get('/company/products/:id', company.getCompanyProducts);
app.get('/company/orders/:id', company.getCompanyOrders);
app.post('/company/order_set_status', company.orderSetStatus);
app.get('/company/get_product_details/:id', company.getProductDetials);
app.get('/company/get_order_details/:id', company.getOrderDetials);
app.get('/company/report/:id', company.getCompanyReport);
app.get('/company/orders/:id', company.getCompanyOrders);
app.post('/company/update_product', company.updateProduct);
app.post('/company/product', company.addProduct);
app.post('/company/orders/status', company.updateOrderStatus);

//**************FARMER*************/
app.get('/farmer/gardens/:id', farmer.getFarmerGardens);
app.get('/farmer/garden/:id', farmer.getFarmerGarden);
app.get('/farmer/online_shop', farmer.getProductsForOnlineShop);
app.get('/farmer/online_shop/:id', farmer.getProductForOnlineShop);
app.get('/farmer/orders/:garden_id', farmer.getOrders);
app.get('/farmer/products/:garden_id', farmer.getProducts);
app.get('/farmer/seedling/:seedling_id', farmer.getSeedlingInfo);
app.get('/farmer/garden/preparations/:garden_id', farmer.getGardenPreparations);
app.post('/farmer/garden/temperature_change', farmer.updateGardenTemperature);
app.post('/farmer/garden/water_change', farmer.updateGardenWater);
app.post('/farmer/create_order', farmer.createOrder);
app.post('/farmer/use_preparation', farmer.usePreparation);

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})