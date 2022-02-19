const { configureStore } = require('@reduxjs/toolkit');
const craft = require('./craft');
const inventory = require('./inventory');

module.exports = configureStore({
  reducer: {
    craft: craft.reducer,
    inventory: inventory.reducer
  }
});
