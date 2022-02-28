function Thread(overrides) {
  return {
    created: new Date().getTime(),
    updated: new Date().getTime(),
    dialogId: 0,
    nonce: -1, // random number
    data: {},
    ...overrides
  };
}

module.exports = Thread;
