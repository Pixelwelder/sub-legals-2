function Thread() {
  return {
    created: new Date().getTime(),
    updated: new Date().getTime(),
    dialogId: 0,
    data: {}
  };
}

module.exports = Thread;
