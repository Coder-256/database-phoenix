import * as firebase from "firebase/app";
import "firebase/firestore";

firebase.initializeApp({
  apiKey: "AIzaSyC0L8B4dqS-QGETr5JcdvkZhezdKmjctp8",
  authDomain: "database-server-firebase.firebaseapp.com",
  databaseURL: "https://database-server-firebase.firebaseio.com",
  projectId: "database-server-firebase",
  storageBucket: "database-server-firebase.appspot.com",
  messagingSenderId: "1049118732095"
});

firebase
  .firestore()
  .enablePersistence({ synchronizeTabs: true })
  .catch(console.error);
