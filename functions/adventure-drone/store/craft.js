const { createSlice, createAsyncThunk } = require('@reduxjs/toolkit');
const { getFirestore } = require('firebase-admin/firestore');

const initialState = {
  // [userId]: { player, inventory, thread }
};
const name = 'craft';

const loadData = createAsyncThunk(`${name}/loadData`, async ({ userId }, { dispatch }) => {
  console.log('--- loading data ---');
  const data = {};
  // TODO This needs to load from something on the user object.
  try {
    const playerDocs = await getFirestore().collection('discord_characters').where('player', '==', userId).get();
    if (playerDocs.size) data.player = playerDocs.docs[0].data();
    
    const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
    if (inventoryDocs.docs.length) data.inventory = inventoryDocs.docs.map(doc => doc.data());

    const threadDoc = await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId).get();
    if (threadDoc.exists) data.thread = threadDoc.data();

    console.log('--- data loaded ---');
    console.log(generatedActions);
    // dispatch(generatedActions.setData({ userId, data }));
    return { userId, data: data }
  } catch (error) {
    console.error('ERROR', error);
  }
});

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  extraReducers: {
    [loadData.fulfilled]: (state, action) => {
      const { payload } = action;
      console.log('setData payload', payload);
      state[payload.userId] = payload.data;
    }
  }
});

const actions = { ...generatedActions, loadData };
const selectors = { select: state => state[name] };

module.exports = {
  actions,
  selectors,
  reducer
}