const { configureStore } = require('@reduxjs/toolkit');
const craft = require('./craft');
const inventory = require('./inventory');
const global = require('./global');
const dev = require('./dev');

module.exports = configureStore({
  reducer: {
    craft: craft.reducer,
    inventory: inventory.reducer,
    global: global.reducer,
    dev: dev.reducer
  }
});
