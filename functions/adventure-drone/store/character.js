const { createSlice, createAsyncThunk, createSelector } = require('@reduxjs/toolkit');
const { getFirestore } = require('firebase-admin/firestore');
const Thread = require('../data/Thread');

const name = 'character';
const initialState = {
  /*
  [userId]: {
    thread,
    character
  }
  */
};

const loadData = createAsyncThunk(
  `${name}/loadData`,
  async ({ userId, toLoad = ['thread', 'data'] }, { dispatch }) => {
    if (toLoad.includes('thread')) {
      const threadDoc = await getFirestore().collection('discord_ui').doc('character').collection('in-flight').doc(userId).get();
      let thread;
      if (threadDoc.exists) {
        thread = threadDoc.data();
      } else {
        thread = new Thread();
        await threadDoc.ref.set(thread);
      }
  
      dispatch(generatedActions.setThread({ userId, thread }));
    }

    if (toLoad.includes('data')) {
      const docs = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
      const items = docs.docs.length ? docs.docs.map(doc => doc.data()) : [];
      dispatch(generatedActions.setData({ userId, inventory: items }));
    }
  }
);

// TODO Combine with other reducers (e.g. inventory).
const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    setData: (state, action) => {
      const { userId, character } = action.payload;
      state[userId] = state[userId] || {};
      state[userId].character = character;
    },
    setThread: (state, action) => {
      const { userId, thread } = action.payload;
      state[userId] = state[userId] || {};
      state[userId].thread = thread;
    }
  }
});

const actions = { loadData };

// TODO Extract. Use for others, like inventory.
const selectors = {};
const createSelectors = (name, userId) => {
  const select = state => state[name][userId];
  const selectThread = createSelector(select, ({ thread }) => thread);
  const selectData = createSelector(select, ({ data }) => data);
  selectors[userId] = { select, selectThread, selectData };
};

const getSelectors = userId => {
  if (!selectors[userId]) createSelectors(name, userId);
  return selectors[userId];
}

module.exports = { reducer, actions, getSelectors };