const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id does not match route id: ${orderId}.`,
  });
}

function matchId(req, res, next) {
  const dishId = req.params.orderId;
  const { id } = req.body.data;

  if (!id || id === dishId) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Order: ${id}, Route: ${dishId}`,
  });
}

const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (validStatuses.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of ${validStatuses}`,
  });
}

const checkOrder = (req, res, next) => {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  if (!deliverTo || deliverTo == "")
    return next({ status: 400, message: `Order must include a deliverTo` });
  if (!mobileNumber || mobileNumber == "")
    return next({ status: 400, message: `Order must include a mobileNumber` });
  if (!dishes) return next({ status: 400, message: `Order must include a dish` });
  if (!Array.isArray(dishes) || dishes.length <= 0)
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  dishes.forEach((dish, index) => {
    if (!dish.quantity || dish.quantity <= 0 || typeof dish.quantity != "number")
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
  });
  res.locals.newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  next();
};

function create(req, res) {
  const order = req.body.data;
  order.id = nextId();
  order.status = "pending";
  orders.push(order);
  res.status(201).json({ data: order });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const { id } = res.locals.order;
  Object.assign(res.locals.order, req.body.data, { id });
  res.json({ data: res.locals.order });
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
  create: [checkOrder, create],
  read: [orderExists, read],
  update: [orderExists, checkOrder, matchId, statusPropertyIsValid, update],
  destroy: [orderExists, destroy],
  list,
};
