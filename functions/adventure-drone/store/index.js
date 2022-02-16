const { configureStore } = require('@reduxjs/toolkit');
const craft = require('./craft');

module.exports = configureStore({
  reducer: {
    craft: craft.reducer
  }
});
