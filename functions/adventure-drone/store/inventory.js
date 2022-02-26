const { createAsyncThunk, createSelector, createSlice } = require('@reduxjs/toolkit');
const { getFirestore } = require('firebase-admin/firestore');
const Thread = require('../data/Thread');
const Schematic = require('../data/Schematic');

const name = 'inventory';
const initialState = {
/*
  [userId]: {
    thread,
    inventory
  }
*/
};

const initialize = createAsyncThunk(`${name}/initialize`, async ({ userId }, { getState, dispatch }) => {
  let userState = getState().inventory[userId];
  if (!userState) {
    console.log('INITIALIZING', userId);
    const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
    const inventory = inventoryDocs.docs.length ? inventoryDocs.docs.map(doc => doc.data()) : [];

    // TODO Prematurely optimized?
    dispatch(generatedActions.initialize({ userId, inventory, thread: new Thread({ dialogId: -1 }) }));
  }
});

const saveThread2 = createAsyncThunk(`${name}/saveThread2`, async ({ userId, dialogId, data, mergeData = false }, { getState, dispatch }) => {
  console.log('saveThread', dialogId);
  const thread = { ...getSelectors(userId).selectThread(getState()) };
  if (dialogId) thread.dialogId = dialogId;
  if (data) thread.data = mergeData ? { ...thread.data, ...data } : data;
  console.log('new thread', thread);
  dispatch(generatedActions.setThread({ userId, thread }));
});

const loadInventory = createAsyncThunk(`${name}/loadInventory`, async ({ userId }, { getState, dispatch }) => {
  // Load inventory from firestore.
  const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
  const inventory = inventoryDocs.docs.length ? inventoryDocs.docs.map(doc => doc.data()) : [];
  dispatch(generatedActions.setInventory({ userId, inventory }));
});

/**
 * Creates or gets the thread for the user.
 * Also sets it in the store.
 */
const _getThread = createAsyncThunk(`${name}/getThread`, async ({ userId, forceLoad }, { getState, dispatch }) => {
  console.log('inventory/_getThread');
  // If we already have the thread, don't load unless forceLoad.
  let thread = getSelectors(userId).selectThread(getState());
  if (!thread || forceLoad) {
    console.log('- no thread, loading');
    // Load thread, or create one if we don't have one.
    
    const threadDoc = await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).get();
    if (threadDoc.exists) {
      thread = threadDoc.data();
    } else {
      thread = new Thread({});
      await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).set(thread);
    }

    dispatch(generatedActions.setThread({ userId, thread }));
  }

  return thread;
});

/**
 * Must be run as the first action of any other async thunks.
 * TODO Optimize. We can check for threads in memory.
 */
const loadData = createAsyncThunk(
  `${name}/loadData`,
  async ({ userId, toLoad = ['thread', 'inventory'], forceLoad = false }, { dispatch, getState }) => {
    console.log('inventory/loadData');
    // Update the thread, then get it.
    if (toLoad.includes('thread')) {
      await dispatch(_getThread({ userId, forceLoad }));
      const thread = getSelectors(userId).selectThread(getState());
    }

    if (toLoad.includes('inventory')) {
      const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
      const inventory = inventoryDocs.docs.length ? inventoryDocs.docs.map(doc => doc.data()) : [];
      dispatch(generatedActions.setInventory({ userId, inventory }));
    }
  }
);

const saveThread = createAsyncThunk(`${name}/saveThread`, async ({ userId, dialogId, data, mergeData = false }, { dispatch, getState }) => {
  await dispatch(loadData({ userId, toLoad: ['thread'] }));

  const currentThread = getSelectors(userId).selectThread(getState());
  const newThread = { ...currentThread, updated: new Date().getTime() };
  if (dialogId) newThread.dialogId = dialogId;
  if (data) newThread.data = mergeData ? { ...currentThread.data, ...data } : data;

  await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).set(newThread);
  dispatch(generatedActions.setThread({ userId, thread: newThread }));
});

const disassemble = createAsyncThunk(`${name}/disassemble`, async ({ userId, itemId }, { dispatch, getState }) => {
  console.log('disassemble', itemId);
  // Refresh inventory.
  await dispatch(loadData({ userId, toLoad: ['inventory'] }));

  // Get the item in question.
  const selectors = getSelectors(userId);
  const inventoryByUid = getSelectors(userId).selectInventoryByUid(getState());
  const item = inventoryByUid[itemId];
  console.log('item', item);

  // Create a firestore transaction.
  const transaction = getFirestore().runTransaction(async (transaction) => {
    // Create a new schematic from the schematic data stored on the item.
    const { data: { schematic: schematicData } } = item;
    console.log('schematicData:', schematicData.displayName);

    const doc = getFirestore().collection('discord_inventory').doc();
    const schematic = new Schematic({
      ...schematicData,
      uid: doc.id,
      player: userId
    });
    console.log('schematic:', schematic.uid);

    // Add the schematic to the inventory.
    transaction.set(doc, schematic);

    // Remove the item from the inventory.
    const oldRef = getFirestore().collection('discord_inventory').doc(itemId);
    transaction.delete(oldRef);
  });

  console.log('disassembly complete');
});

const give = createAsyncThunk(`${name}/give`, async ({ userId, itemUid, residentId }, { dispatch, getState }) => {
  // await dispatch(loadData({ userId, toLoad: ['inventory'] }));
  console.log('giving', itemUid, residentId);

  // if (id === getClient().user.id) {
  //   // TODO
  // }
  try {
    await getFirestore().collection('discord_inventory').doc(itemUid).update({ player: residentId });
    console.log('gave', itemUid, residentId);
    return { success: true };
  } catch (e) {
    console.error(e);
  }
});

// Reset's a user's state.
const resetUser = createAsyncThunk(`${name}/resetUser`, async ({ userId }, { dispatch }) => {
  console.log('--- resetting ---');
  try {
    await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).delete();
    dispatch(generatedActions.resetUser({ userId }));
    // return { userId }
  } catch (error) {
    console.error('ERROR', error);
  }
});

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    initialize: (state, action) => {
      const { userId, thread, inventory } = action.payload;
      state[userId] = { thread, inventory }
    },
    setInventory: (state, action) => {
      const { userId, inventory } = action.payload;
      state[userId] = state[userId] || {};
      state[userId].inventory = inventory;
    },
    setThread: (state, action) => {
      const { userId, thread } = action.payload;
      state[userId] = state[userId] || {};
      state[userId].thread = thread;
    },
    resetUser: (state, action) => {
      const { userId } = action.payload;
      delete state[userId];
    }
  }
});

const actions = { loadData, saveThread, saveThread2, loadInventory, disassemble, give, resetUser, initialize };

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
  const selectThread = createSelector(select, ({ thread } = {}) => thread);
  const selectDialogId = createSelector(selectThread, ({ dialogId } = {}) => dialogId);
  selectors[userId] = { select, selectInventory, selectInventoryByUid, selectThread, selectDialogId };
}

const getSelectors = userId => {
  if (!selectors[userId]) createSelectors(userId);
  return selectors[userId];
}

module.exports = { actions, getSelectors, reducer };
