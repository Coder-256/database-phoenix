import { firestore } from "firebase/app";

const store = firestore();
store.settings({ timestampsInSnapshots: true });
store.enablePersistence().catch(console.error);
