import * as firebase from 'firebase/app';

import { show } from '@game/helpers';

import { firebaseApp } from './app';

export enum LoginTypes {
  Google,
}

export function initApp() {
  let initialized: boolean;
  const gameDiv: HTMLElement = document.getElementById('game-container');
  const authDiv: HTMLElement = document.getElementById('auth');

  return new Promise((resolve, reject) => {
    const auth: firebase.auth.Auth = firebase.auth(firebaseApp);
    auth.useDeviceLanguage();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    auth.onAuthStateChanged((user: firebase.User) => {
      if (!initialized) {
        resolve(user);
      }

      if (user) {
        show(gameDiv);
      } else {
        show(authDiv);
      }
    });
  });
}

export async function login(loginType: LoginTypes) {
  let user: firebase.User = firebase.auth().currentUser;

  if (user) {
    return;
  }

  switch (loginType) {
    case LoginTypes.Google:
      const googleProvider = new firebase.auth.GoogleAuthProvider();
      // TODO: Persist user name
      // googleProvider.setCustomParameters({'login_hint': 'user@example.com' });

      try {
        const result: firebase.auth.UserCredential = await firebase.auth(firebaseApp).getRedirectResult();
        if (result.credential) {
          return result.user;
        }
      } catch (e) {
        console.error(e);
      }

      try {
        await firebase.auth().signInWithRedirect(googleProvider);
      } catch (e) {
        console.error(e);
        await signOut();
      }
      break;
  }
}

export async function signOut() {
  return await firebase.auth().signOut();
}
