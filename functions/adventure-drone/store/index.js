const { configureStore } = require('@reduxjs/toolkit');
const craft = require('./craft');
const inventory = require('./inventory');
const global = require('./global');

module.exports = configureStore({
  reducer: {
    craft: craft.reducer,
    inventory: inventory.reducer,
    global: global.reducer
  }
});
