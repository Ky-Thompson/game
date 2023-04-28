import * as firebase from 'firebase/app';

import 'firebase/auth';

const config = {
  apiKey: 'AIzaSyDpmYC4GoCsBlkAF7SarIzL4GC21xGyvV0',
  authDomain: 'madrid-2019.firebaseapp.com',
  databaseURL: 'https://madrid-2019.firebaseio.com',
  projectId: 'madrid-2019',
  storageBucket: 'madrid-2019.appspot.com',
  messagingSenderId: '954573942686',
};

export const firebaseApp: firebase.app.App = firebase.initializeApp(config);
