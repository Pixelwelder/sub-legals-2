/**
 * 
 * @param {*} store 
 * @param {*} watchSelector - the selector to watch for changes.
 * @param {*} select - the selector to get the value from.
 * @param {*} onChange 
 * @returns 
 */
function observeStore(store, watchSelector, select, onChange) {
  let currentState;

  function handleChange() {
    let nextState = watchSelector(store.getState());
    if (nextState !== currentState) {
      const prevState = currentState;
      currentState = nextState;

      // Broadcast if it was an actual change.
      if (prevState !== undefined) {
        onChange(select(store.getState()));
      }
    }
  }

  let unsubscribe = store.subscribe(handleChange);
  handleChange();
  return unsubscribe;
}

module.exports = observeStore;
