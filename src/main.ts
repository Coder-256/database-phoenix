import Vue from "vue";
import "./plugins/vuetify";
import "firebase/app";
import "firebase/firestore";
import firebase, { firestore } from "firebase/app";
import App from "./App.vue";
import router from "./router";
import "./registerServiceWorker";

firebase.initializeApp({
  apiKey: "AIzaSyC0L8B4dqS-QGETr5JcdvkZhezdKmjctp8",
  authDomain: "database-server-firebase.firebaseapp.com",
  databaseURL: "https://database-server-firebase.firebaseio.com",
  projectId: "database-server-firebase",
  storageBucket: "database-server-firebase.appspot.com",
  messagingSenderId: "1049118732095"
});

const store = firestore();
store.settings({ timestampsInSnapshots: true });
store.enablePersistence().catch(console.error);

new Vue({
  router,
  render: h => h(App)
}).$mount("#app");
