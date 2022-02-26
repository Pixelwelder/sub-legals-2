function observeStore(store, select, onChange) {
  let currentState;

  function handleChange() {
    let nextState = select(store.getState());
    console.log('handleChange', nextState);
    if (nextState !== currentState) {
      const prevState = currentState;
      currentState = nextState;
      onChange(currentState, prevState);
    }
  }

  let unsubscribe = store.subscribe(handleChange);
  // handleChange();
  return unsubscribe;
}

module.exports = observeStore;
