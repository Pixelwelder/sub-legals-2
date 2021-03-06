const { createAsyncThunk, createSelector, createSlice } = require('@reduxjs/toolkit');
const { getFirestore } = require('firebase-admin/firestore');
const Thread = require('../data/Thread');
const Schematic = require('../data/Schematic');
const { UsersManual } = require('@pixelwelders/tlh-universe-data');

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
 * TODO Optimize. We can check for threads in memory.
 */
const loadData = createAsyncThunk(
  `${name}/loadData`,
  async ({ userId, interactionId = -1, toLoad = ['thread', 'inventory'] }, { dispatch }) => {
    // Load thread, or create one if we don't have one.
    if (toLoad.includes('thread')) {
      const threadDoc = await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).get();
      let thread = new Thread({ interactionId });
      if (threadDoc.exists) {
        thread = threadDoc.data();
      } else {
        thread = new Thread({ interactionId });
        await getFirestore().collection('discord_ui').doc('inventory').collection('in-flight').doc(userId).set(thread);
      }

      dispatch(generatedActions.setThread({ userId, thread }));
    }

    if (toLoad.includes('inventory')) {
      const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
      const inventory = inventoryDocs.docs.length ? inventoryDocs.docs.map(doc => doc.data()) : [];
      dispatch(generatedActions.setInventory({ userId, inventory }));
    }
  }
);

const saveThread = createAsyncThunk(`${name}/saveThread`, async ({ userId, dialogId, interactionId, data, mergeData = false }, { dispatch, getState }) => {
  await dispatch(loadData({ userId, toLoad: ['thread'] }));

  const currentThread = getSelectors(userId).selectThread(getState());
  const newThread = { ...currentThread, updated: new Date().getTime() };
  if (dialogId) newThread.dialogId = dialogId;
  if (interactionId) newThread.interactionId = interactionId;
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

const actions = { loadData, saveThread, disassemble, give, resetUser };

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
  selectors[userId] = { select, selectInventory, selectInventoryByUid, selectThread };
}

const getSelectors = userId => {
  if (!selectors[userId]) createSelectors(userId);
  return selectors[userId];
}

module.exports = { actions, getSelectors, reducer };
