import * as firebase from 'firebase/app';

import { firebaseApp } from './app';
import { AuthButtons, AuthSteps, registerAuthButton, showAuth, showGame } from './ui';

export enum LoginTypes {
  Google,
  EmailPassword,
}

export enum AuthErrors {
  EmailAlreadyInUse = 'auth/email-already-in-use',
}

export function initApp(): Promise<firebase.User> {
  let initialized: boolean;

  // Initialize UI
  registerAuthButton(AuthButtons.LoginGoogle, () => login(LoginTypes.Google));
  registerAuthButton(AuthButtons.LoginEmailPassword, (event: Event) => {
    const form: HTMLFormElement = <any>event.target;
    const email: string = form.elements['email'].value;
    const password: string = form.elements['password'].value;
    loginEmailPassword(email, password);
  });
  registerAuthButton(AuthButtons.SignUp, (event: Event) => {
    const form: HTMLFormElement = <any>event.target;
    const email: string = form.elements['email'].value;
    const password: string = form.elements['password'].value;
    signUp(email, password);
  });

  // Wait for user's authentication
  return new Promise((resolve, reject) => {
    const auth: firebase.auth.Auth = firebase.auth(firebaseApp);
    auth.useDeviceLanguage();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    auth.onAuthStateChanged((user: firebase.User) => {
      // TODO: Handle user states: email not verified, fill display name
      if (user) {
        showGame();

        if (!initialized) {
          initialized = true;
          resolve(user);
        }
      } else {
        showAuth(AuthSteps.Login);
      }
    });
  });
}

export async function login(loginType: LoginTypes, email?: string, password?: string): Promise<firebase.User> {
  let user: firebase.User = firebase.auth().currentUser;

  if (user) {
    signOut();
    return;
  }

  switch (loginType) {
    case LoginTypes.Google:
      return await loginGoogle();
    case LoginTypes.EmailPassword:
      return await loginEmailPassword(email, password);
  }
}

export async function signOut(): Promise<void> {
  return await firebase.auth().signOut();
}

export async function signUp(email: string, password: string): Promise<firebase.User> {
  try {
    const credential: firebase.auth.UserCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    return credential.user;
  } catch (e) {
    if (e.code === AuthErrors.EmailAlreadyInUse) {
      return await loginEmailPassword(email, password);
    } else {
      console.log(e);
    }
  }
}

export async function loginGoogle(): Promise<firebase.User> {
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
}

export async function loginEmailPassword(email: string, password: string): Promise<firebase.User> {
  const credential: firebase.auth.UserCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
  return credential.user;
  // TODO: Handle errors
}

export async function sendEmailVerification(): Promise<void> {
  const user: firebase.User = firebase.auth().currentUser;

  if (user) {
    await user.sendEmailVerification();
  }
}
