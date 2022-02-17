const { createSlice, createAsyncThunk } = require('@reduxjs/toolkit');
const { getFirestore } = require('firebase-admin/firestore');
const Thread = require('../data/Thread');
const ConstructionProject = require('../data/ConstructionProject');

const initialState = {
  // [userId]: {
  //    player,
  //    inventory,
  //    thread: {
  //      data: {
  //        itemId - the selected item (schematic)
  //        type - the type of item (for a list)
  //        constructionProject - the item that is currently being built - based on schematic
  //      }
  //    }
  // }
};
const name = 'craft';

const loadData = createAsyncThunk(`${name}/loadData`, async ({ userId }, { dispatch }) => {
  console.log('--- loading data ---');
  const data = {};
  try {
    // TODO This needs to load from something on the user object.
    // TODO If we have no player, we have a big issue.
    const playerDocs = await getFirestore().collection('discord_characters').where('player', '==', userId).get();
    if (playerDocs.size) data.player = playerDocs.docs[0].data();
    
    const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
    data.inventory = inventoryDocs.docs.length ? inventoryDocs.docs.map(doc => doc.data()) : [];

    const threadDoc = await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId).get();
    if (!threadDoc.exists) {
      // Create a thread if we don't have one.
      const thread = new Thread();
      await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId).set(thread);
      data.thread = thread;
    } else {
      data.thread = threadDoc.data();
    }

    console.log('--- data loaded ---');
    console.log(generatedActions);
    // dispatch(generatedActions.setData({ userId, data }));
    dispatch(generatedActions.setData({ userId, data }));
    // return { userId, data: data }
  } catch (error) {
    console.error('ERROR', error);
  }
});

const saveData = createAsyncThunk(`${name}/saveData`, async ({ userId, data }, { dispatch }) => {
  console.log('--- saving data ---', Object.keys(data));
  try {
    // if (data.player) {
    //   await getFirestore().collection('discord_characters').doc(data.player.id).set(data.player);
    // }
    // if (data.inventory) {
    //   for (const inventoryItem of data.inventory) {
    //     await getFirestore().collection('discord_inventory').doc(inventoryItem.id).set(inventoryItem);
    //   }
    // }
    if (data.thread) {
      await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId).set({
        ...data.thread,
        updated: new Date().getTime()
      });
    }
    console.log('--- data saved ---');
    dispatch(generatedActions.setData({ userId, data }))
    // return { userId, data: data }
  } catch (error) {
    console.error('ERROR', error);
  }
});

// Reset's a user's state.
const resetUser = createAsyncThunk(`${name}/resetUser`, async ({ userId }, { dispatch }) => {
  console.log('--- resetting ---');
  try {
    await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId).delete();
    dispatch(generatedActions.resetUser({ userId }));
    // return { userId }
  } catch (error) {
    console.error('ERROR', error);
  }
});

const setConstructionProject = createAsyncThunk(`${name}/setConstructionProject`, async ({ userId, constructionProject }, { dispatch }) => {
  console.log('--- setting construction project ---');
  // We add it to the thread currently underway.
  // try {
  //   await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId).set({
      
  //   });
  // } catch (error) {
  //   console.error('ERROR', error);
  // }
});

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    setData: (state, action) => {
      const { userId, data } = action.payload;
      state[userId] = state[userId] || {};
      Object.keys(data).forEach(key => {
        state[userId][key] = data[key];
      });
    },
    resetUser: (state, action) => {
      const { userId } = action.payload;
      delete state[userId];
    }
  },
  // extraReducers: {
  //   [loadData.fulfilled]: (state, action) => {
  //     const { payload } = action;
  //     console.log('setData payload', payload);
  //     state[payload.userId] = payload.data;
  //   }
  // }
});

const actions = { loadData, resetUser, saveData };
const selectors = {
  select: state => state[name]
};

module.exports = {
  actions,
  selectors,
  reducer
}