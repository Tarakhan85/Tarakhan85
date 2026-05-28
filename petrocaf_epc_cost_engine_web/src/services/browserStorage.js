const storage = {
  async get(key) {
    const value = window.localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    window.localStorage.setItem(key, value);
    return { key, value };
  },
  async remove(key) {
    window.localStorage.removeItem(key);
  },
};

export function ensureStorageAdapter() {
  if (!window.storage) {
    window.storage = storage;
  }
  return window.storage;
}
