const { createSlice, createAsyncThunk } = require('@reduxjs/toolkit');
const { getFirestore } = require('firebase-admin/firestore');
const TLHData = require('@pixelwelders/tlh-universe-data');

const name = 'dev';
const initialState = {};

const give = createAsyncThunk(`${name}/give`, async ({ ConstructorName, userId }, { dispatch, getState }) => {
  const Constructor = TLHData[ConstructorName];
  console.log('Constructor', ConstructorName, Constructor);

  const doc = getFirestore().collection('discord_inventory').doc();
  const item = new Constructor({ uid: doc.id, player: userId });
  await getFirestore().collection('discord_inventory').doc(doc.id).set(item);

  console.log('GAVE', item);
});

const { reducer, generatedActions } = createSlice({
  name,
  initialState
});

const actions = { give };
const selectors = {};

module.exports = { actions, selectors, reducer };
