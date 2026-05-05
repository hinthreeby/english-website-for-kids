const store = new Map();

const cache = {
  get(key) {
    const item = store.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      store.delete(key);
      return null;
    }
    return item.value;
  },

  set(key, value, ttlMs = 3_600_000) {
    store.set(key, { value, expires: Date.now() + ttlMs });
  },

  del(key) {
    store.delete(key);
  },

  delPrefix(prefix) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },
};

module.exports = cache;
