const admin = require('firebase-admin');

const newMinion = (overrides) => ({
  uid: null,
  displayName: 'New Minion',
  mentor: '',
  ...overrides
});

let minions;
const fetchMinions = async () => {
  if (!minions) {
    const minionDocs = await admin.firestore().collection('discord_minions').get();
    minions = minionDocs.docs.map(doc => doc.data());
  }

  return minions;
};

// We store minions by name, lower-cased.
let minionsByName;
const fetchMinionsByName = async () => {
  if (!minionsByName) {
    const localMinions = await fetchMinions();
    minionsByName = localMinions
      .reduce((accum, minion) => ({
        ...accum, [minion.displayName.toLowerCase()]: minion
      }), {});
  }

  return minionsByName;
};

const refreshMinions = async () => {
  minions = null;
  minionsByName = null;
  await fetchMinions();
  console.log('minions refreshed');
};

const go = async () => {
  // Load
  await fetchMinions();
  console.log(minions.length, 'minions fetched');
};

go();

module.exports = {
  newMinion,
  fetchMinions,
  fetchMinionsByName,
  refreshMinions
};
