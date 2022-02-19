const { createReducer } = require("@reduxjs/toolkit");

const isPendingAction = ({ type }) => type.endsWith('/pending');
const isFulfilledAction = ({ type }) => type.endsWith('/fulfilled');
const isRejectedAction = ({ type }) => type.endsWith('/rejected');

const name = 'global';
const initialState = {
  errors: []
};

const reducer = createReducer(initialState, builder => builder
  // .addCase(isPendingAction, (state, action) => {
  //   console.log('global.reducer - pending:', action.type);
  // })
  // .addCase(isFulfilledAction, (state, action) => {
  //   console.log('global.reducer - fulfilled:', action.type);
  // })
  .addMatcher(isRejectedAction, (state, action) => {
    console.error('global.reducer - rejected:', action);
    state.errors.push(action);
  })
);

module.exports = { reducer };