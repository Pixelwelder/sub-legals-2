function Thread(overrides) {
  return {
    created: new Date().getTime(),
    updated: new Date().getTime(),
    dialogId: 0,
    data: {},
    ...overrides
  };
}

module.exports = Thread;
