const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id does not match route id: ${orderId}`,
  });
}

function orderBodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function dishesPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes.length >= 1 && Array.isArray(dishes)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include at least one dish.`,
  });
}

function quantityPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const { orderId } = req.params;
  if (dishes.quantity) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id: ${orderId}.`,
  });
}

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  if (status) {
    return next();
  }
  next({
    status: 400,
    message: `Dish ${index} must have a quantity that is an integer greater than 0.`,
  });
}

function create(req, res) {
  const {
    data: {
      deliverTo,
      mobileNumber,
      status,
      dishes: { id, name, description, image_url, price, quantity },
    } = {},
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes: {
      id,
      name,
      description,
      image_url,
      price,
      quantity,
    },
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}
function read(req, res) {
  res.json({ data: res.locals.order });
}
function update(req, res) {
  const order = res.locals.order;
  const {
    data: {
      deliverTo,
      mobileNumber,
      status,
      dishes: { id, name, description, image_url, price, quantity },
    } = {},
  } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.id = id;
  order.name = name;
  order.description = description;
  order.image_url = image_url;
  order.price = price;
  order.quantity = quantity;

  res.json({ data: order });
}

function destroy() {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

function list(req, res) {
  res.json({ data: orders });
}

module.exports = {
  create: [
    orderBodyDataHas("deliverTo"),
    orderBodyDataHas("mobileNumber"),
    orderBodyDataHas("dishes"),
    dishesPropertyIsValid,
    quantityPropertyIsValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    orderBodyDataHas("deliverTo"),
    orderBodyDataHas("mobileNumber"),
    orderBodyDataHas("dishes"),
    dishesPropertyIsValid,
    quantityPropertyIsValid,
    statusPropertyIsValid,
    update,
  ],
  destroy: [orderExists, destroy],
  list,
};
