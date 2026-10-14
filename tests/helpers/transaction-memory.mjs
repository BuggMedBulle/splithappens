// Optimistic transaction simulator for the actual storage adapter. It enforces
// Firestore's reads-before-writes rule and retries competing document versions.
export function memoryDatabase(initial = {}) {
  const docs = new Map(Object.entries(initial).map(([path, value]) => [path, structuredClone(value)]));
  const versions = new Map([...docs.keys()].map(key => [key, 0]));
  let retries = 0;
  const fs = {
    collection: (_db, ...parts) => ({ path: parts.join("/") }),
    doc: (parent, ...parts) => {
      const path = parent?.path ? `${parent.path}/${parts[0]}` : parts.join("/");
      return { path, id: path.split("/").at(-1) };
    },
    async runTransaction(_db, callback) {
      for (let attempt = 0; attempt < 100; attempt++) {
        const reads = new Map(), writes = new Map();
        let writing = false;
        const tx = {
          async get(ref) {
            if (writing) throw new Error("Transaction read after write");
            reads.set(ref.path, versions.get(ref.path) || 0);
            const value = structuredClone(docs.get(ref.path));
            return { id: ref.id, exists: () => value != null, data: () => value };
          },
          set(ref, value) { writing = true; writes.set(ref.path, structuredClone(value)); },
          update(ref, value) { writing = true; writes.set(ref.path, { ...structuredClone(docs.get(ref.path)), ...structuredClone(value) }); },
          delete(ref) { writing = true; writes.set(ref.path, null); },
        };
        const result = await callback(tx);
        if ([...reads].some(([path, version]) => (versions.get(path) || 0) !== version)) { retries++; continue; }
        for (const [path, value] of writes) {
          if (value == null) docs.delete(path); else docs.set(path, value);
          versions.set(path, (versions.get(path) || 0) + 1);
        }
        return result;
      }
      throw new Error("Too many transaction conflicts");
    },
  };
  return { fs, db: {}, read: path => structuredClone(docs.get(path)), values: () => [...docs.values()].map(v => structuredClone(v)), retries: () => retries };
}
