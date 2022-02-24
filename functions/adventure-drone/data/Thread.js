function Thread(overrides) {
  return {
    created: new Date().getTime(),
    updated: new Date().getTime(),
    interactionId: 0,
    dialogId: 0,
    data: {},
    ...overrides
  };
}

module.exports = Thread;
