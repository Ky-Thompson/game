import * as firebase from 'firebase/app';

import 'firebase/auth';

const config = {
  apiKey: 'AIzaSyDpmYC4GoCsBlkAF7SarIzL4GC21xGyvV0',
  authDomain: 'caleb-sophia-madrid.firebaseapp.com',
  databaseURL: 'https://caleb-sophia-madrid.firebaseio.com',
  projectId: 'caleb-sophia-madrid',
  storageBucket: 'caleb-sophia-madrid.appspot.com',
  messagingSenderId: '954573942686',
};

export const firebaseApp: firebase.app.App = firebase.initializeApp(config);
