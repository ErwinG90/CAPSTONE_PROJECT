class Cache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    console.info(`${new Date().toISOString()} [Cache] [get] [START] Getting key [${key}]`);
    const entry = this.store.get(key);
  
    if (!entry) {
      console.info(`${new Date().toISOString()} [Cache] [get] [END] Key not found [${key}]`);
      return null;
    }

    const { value, expiry } = entry;
    
    if (Date.now() > expiry) {
      console.info(`${new Date().toISOString()} [Cache] [get] [END] Key expired [${key}]`);
      this.store.delete(key);
      return null;
    }
    
    console.info(`${new Date().toISOString()} [Cache] [get] [END] Key found [${key}]`);
    return value;
  }

  set(key, value, time) {
    console.info(`${new Date().toISOString()} [Cache] [set] [START] Setting key [${key}]`);
    const expiry = Date.now() + time;
    this.store.set(key, { value, expiry });
    console.info(`${new Date().toISOString()} [Cache] [set] [END] Key set [${key}]`);
  }

  del(key) {
    console.info(`${new Date().toISOString()} [Cache] [del] [START] Deleting key [${key}]`);
    this.store.delete(key);
    console.info(`${new Date().toISOString()} [Cache] [del] [END] Key deleted [${key}]`);
  }
}

module.exports = Cache;