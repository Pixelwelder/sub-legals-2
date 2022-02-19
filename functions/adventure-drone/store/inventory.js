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

/**
 * Must be run as the first action of any other async thunks.
 */
const loadData = createAsyncThunk(`${name}/loadData`, async ({ userId, toLoad = ['thread', 'inventory'] }, { dispatch }) => {
  // Load thread, or create one if we don't have one.
  if (toLoad.includes('thread')) {
    const threadDoc = await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).get();
    let thread = new Thread();
    if (threadDoc.exists) {
      thread = threadDoc.data();
    } else {
      thread = new Thread();
      await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).set(thread);
    }

    dispatch(generatedActions.setThread({ userId, thread }));
  }

  if (toLoad.includes('inventory')) {
    const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
    const inventory = inventoryDocs.docs.length ? inventoryDocs.docs.map(doc => doc.data()) : [];
    dispatch(generatedActions.setInventory({ userId, inventory }));
  }
});

const saveThread = createAsyncThunk(`${name}/saveThread`, async ({ userId, dialogId, data, mergeData = true }, { dispatch, getState }) => {
  await dispatch(loadData({ userId, toLoad: ['thread'] }));

  const currentThread = getSelectors(userId).selectThread(getState());
  const newThread = { ...currentThread, updated: new Date().getTime() };
  if (dialogId) newThread.dialogId = dialogId;
  if (data) newThread.data = mergeData ? { ...currentThread.data, ...data } : data;

  await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).set(newThread);
  dispatch(generatedActions.setThread({ userId, thread: newThread }));
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

const actions = { loadData, saveThread };

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

const getSelectors = userId => {
  if (!selectors[userId]) createSelectors(userId);
  return selectors[userId];
}

module.exports = { actions, getSelectors, reducer };
