const { createAsyncThunk, createSelector, createSlice } = require("@reduxjs/toolkit");
const { getFirestore } = require("firebase-admin/firestore");
const Thread = require("../data/Thread");

const name = 'inventory';
const initialState = {
/*
  [userId]: {
    thread,
    inventory
  }
*/
};

const loadData = createAsyncThunk(name, async ({ userId }, { dispatch }) => {
  // Each user gets their own set of selectors.
  if (!selectors[userId]) createSelectors(userId);

  // Load thread, or create one if we don't have one.
  try {
    const threadDoc = await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).get();
    let thread = new Thread();
    if (threadDoc.exists) {
      thread = threadDoc.data();
    } else {
      thread = new Thread();
      await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).set(thread);
    }

    dispatch(generatedActions.setThread({ userId, thread }));
  } catch (error) {
    console.error('inventory.loadData: problem loading threaed', error);
  }

  // Now load the inventory in its own try/catch.
  try {
    const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
    const inventory = inventoryDocs.docs.length ? inventoryDocs.docs.map(doc => doc.data()) : [];
    dispatch(generatedActions.setInventory({ userId, inventory }));
  } catch (error) {
    console.error('inventory.loadData: problem loading inventory', error);
  }
});

const setThread = createAsyncThunk(name, async ({ userId, thread }, { dispatch }) => {
  await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).set(thread);
  dispatch(generatedActions.setThread({ userId, thread }));
});

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    setInventory: (state, action) => {
      const { userId, inventory } = action.payload;
      state[userId] = state[userId] || {};
      state[userId].inventory = inventory;
    },
    setThread: (state, action) => {
      const { userId, thread } = action.payload;
      state[userId] = state[userId] || {};
      state[userId].thread = thread;
    }
  }
});

const actions = { loadData, setThread };

// Each user gets their own set of selectors, keyed by userId.
const selectors = {};
const createRootSelector = userId => state => state[name][userId];
const createSelectors = (userId) => {
  const select = createRootSelector(userId);
  const selectInventory = createSelector(select, ({ inventory }) => inventory);
  const selectInventoryByUid = createSelector(
    selectInventory,
    inventory => inventory.reduce((acc, item) => ({ ...acc, [item.uid]: item }), {})
  );
  const selectThread = createSelector(select, ({ thread }) => thread);
  selectors[userId] = { select, selectInventory, selectInventoryByUid, selectThread };
}

const getSelectors = userId => selectors[userId] || {};

module.exports = { actions, getSelectors, reducer };
