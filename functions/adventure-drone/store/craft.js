const { createSlice, createAsyncThunk } = require('@reduxjs/toolkit');
const { getFirestore } = require('firebase-admin/firestore');
const Thread = require('../data/Thread');
const ConstructionProject = require('../data/ConstructionProject');
const { PersonalInventoryItem } = require('@pixelwelders/tlh-universe-data');
const { Stats } = require('@pixelwelders/tlh-universe-data');

const initialState = {
  /*
   [userId]: {
      player,
      inventory,
      thread: {
        data: {
          schemmaticUid - the selected item (schematic)
          itemTypes - the types of items to show (for a list)
          itemIndex - the index of the item being selected
          itemUid - the item to view
          constructionProject: {
            schematicUid: '',
            partUids: []
          },
          schematicListPage: 0,
          itemListPage: 0
        }
      }
    }
  */
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

// TODO Move.
const StatIndexes = {
  'strength': 0,
  'perception': 1,
  'endurance': 2,
  'charisma': 3,
  'intelligence': 4,
  'agility': 5,
  'luck': 6
};

const forge = createAsyncThunk(`${name}/forge`, async ({ userId, data }, { dispatch, getState }) => {
  console.log('--- forging ---');
  const { thread, inventory } = getState().craft[userId];
  const { constructionProject } = thread.data;

  // TODO This needs to be in a selector somehow.
  const inventoryByUid = inventory.reduce((acc, item) => ({ ...acc, [item.uid]: item }), {});
  
  console.log('found construction project', constructionProject);
  // Create the new item.
  // Grab the schematic.
  const schematic = inventory.find(item => item.uid === constructionProject.schematicUid);
  console.log('found schematic', schematic);

  // Create the new item.
  // Get the stats.
  const stats = constructionProject.partUids
    .map(partUid => inventoryByUid[partUid])
    .reduce((statsArr, item) => {
      const { data = {} } = item;
      const { statModifiers = {} } = data;
      if (statModifiers) {
        const temp = [0, 0, 0, 0, 0, 0, 0]; // TODO Assumes SPECIAL.
        Object.entries(statModifiers).forEach(([statName, statValue]) => {
          const index = StatIndexes[statName];
          temp[index] += statValue;
        });

        console.log('temp', temp);
        temp.forEach((value, index) => {
          const stat = statsArr[index];
          stat.value = Math.max(0, value);
        });
        console.log('stats', statsArr);
      }
      return statsArr;
    }, new Stats());

  console.log('found stats', stats);
  
  // Create a Firestore transaction.
  const result = await getFirestore().runTransaction(async (transaction) => {
    console.log('running transaction');
    try {
      const docRef = getFirestore().collection('discord_inventory').doc();
      const newItem = new PersonalInventoryItem({
        uid: docRef.id,
        ...schematic.data.output,
        data: {
          schematic,
          stats
        },
        player: userId
      });
      
      transaction.set(docRef, newItem);
      console.log('created new item', newItem);

      // Now delete constituent items.
      // TODO Consider just de-ownering them.
      constructionProject.partUids.forEach(partUid => {
        console.log('deleting', partUid);
        transaction.delete(getFirestore().collection('discord_inventory').doc(partUid));
      });

      // Delete the schematic.
      transaction.delete(getFirestore().collection('discord_inventory').doc(schematic.uid));

      // Reload inventory.
      // const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
      // const newInventory = inventoryDocs.docs.map(doc => doc.data());
      // dispatch(generatedActions.setData({ userId, data: { inventory: newInventory } }));
      dispatch(loadData({ userId }));

      // Now remove the thread that got us here.
      // transaction.delete(getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId));
      console.log('--- forging complete ---');
      return { success: true, newItem };
    } catch (error) {
      console.error('ERROR', error);
      return { success: false, error };
    }
  });

  return result;
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

const actions = { loadData, resetUser, saveData, forge };
const selectors = {
  select: state => state[name]
};

module.exports = {
  actions,
  selectors,
  reducer
}