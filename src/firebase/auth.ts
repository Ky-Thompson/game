import * as firebase from 'firebase/app';

import { GtmEventTypes, GtmLoginTypes, pushEvent } from '@game/analytics';
import { remove } from 'diacritics';

import { firebaseApp } from './app';
import { getUser, hasUserAccess, saveUser } from './database';
import { AuthButtons, AuthSteps, registerAuthButton, showAdmin, showAuth, showError, showGame } from './ui';

export enum LoginTypes {
  Google,
  EmailPassword,
  Link,
}

export enum AuthErrors {
  EmailAlreadyInUse = 'auth/email-already-in-use',
  UserNotFound = 'auth/user-not-found',
}

export interface AuthFormData {
  email?: string;
  password?: string;
  name?: string;
}

export const MAX_DISPLAY_NAME = 8;

export async function initApp() {
  // Initialize UI
  registerAuthButton(AuthButtons.LoginGoogle, async () => await login(LoginTypes.Google));
  registerAuthButton(AuthButtons.LoginEmailPassword, (event: Event) =>
    handleForm(event, ({ email, password }) => login(LoginTypes.EmailPassword, email, password))
  );
  registerAuthButton(AuthButtons.GetLink, (event: Event) => handleForm(event, ({ email }) => login(LoginTypes.Link, email)));
  registerAuthButton(AuthButtons.SignUp, (event: Event) => handleForm(event, ({ email, password }) => signUp(email, password)));
  registerAuthButton(AuthButtons.EmailVerification, async () => await sendEmailVerification());
  registerAuthButton(AuthButtons.DisplayName, (event: Event) => handleForm(event, ({ name }) => updateProfile(name)));
  registerAuthButton(AuthButtons.SignOut, async () => await signOut());

  // Wait for user to be logged in
  const auth: firebase.auth.Auth = firebase.auth(firebaseApp);
  auth.useDeviceLanguage();
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  auth.onAuthStateChanged((user: firebase.User) => handleUser(user));

  // Check sign-in with email
  if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
    let email = getEmailLocalStorage();
    if (!email) {
      email = window.prompt('Please provide your email for confirmation');
    }

    try {
      await firebase.auth().signInWithEmailLink(email, window.location.href);
      pushEvent({ event: GtmEventTypes.Login, login: GtmLoginTypes.Email });
      removeEmailLocalStorage();
    } catch (e) {
      console.error(e);
      await signOut();
      showError();
    }
  }
}

export async function handleForm(event: Event, callback: (formData: AuthFormData) => Promise<any>) {
  const form: HTMLFormElement = (<any>event.target).elements ? <any>event.target : (<any>event.target).form;
  const email: string = form.elements['email'] ? form.elements['email'].value : undefined;
  const password: string = form.elements['password'] ? form.elements['password'].value : undefined;
  const name: string = form.elements['name'] ? (<string>form.elements['name'].value).trim().toUpperCase() : undefined;

  if (form.checkValidity()) {
    await callback({ email, password, name });
  }
}

export async function handleUser(user: firebase.User) {
  if (!user) {
    showAuth(AuthSteps.Login);
  } else if (user && user.email && !user.emailVerified) {
    showAuth(AuthSteps.EmailVerification);
  } else if (!user.displayName || !user.displayName.trim().length || user.displayName.trim().length > MAX_DISPLAY_NAME) {
    showAuth(AuthSteps.DisplayName);
  } else if (user) {
    await saveUser();
    const { admin, access } = await getUser();

    if (admin) {
      showAdmin();
    } else if (access === true) {
      showGame();
    } else if (access === false) {
      showAuth(AuthSteps.Forbidden);
    } else {
      showAuth(AuthSteps.WaitAccess);
      hasUserAccess(() => showGame(), () => showAuth(AuthSteps.Forbidden));
    }
  } else {
    showAuth(AuthSteps.Login);
  }
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
    case LoginTypes.Link:
      await loginLink(email);
  }
}

export async function signOut(): Promise<void> {
  try {
    return await firebase.auth().signOut();
  } catch (e) {
    // Sign out errors are not logged
  }
}

export async function signUp(email: string, password: string): Promise<firebase.User> {
  try {
    const result: firebase.auth.UserCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    pushEvent({ event: GtmEventTypes.SignUp });
    await sendEmailVerification(result.user);
    return result.user;
  } catch (e) {
    if (e.code === AuthErrors.EmailAlreadyInUse) {
      return await login(LoginTypes.EmailPassword, email, password);
    }

    console.error(e);
    await signOut();
    showError();
  }
}

export async function loginGoogle(): Promise<firebase.User> {
  const googleProvider = new firebase.auth.GoogleAuthProvider();

  try {
    const result: firebase.auth.UserCredential = await firebase.auth(firebaseApp).getRedirectResult();
    if (result.credential) {
      pushEvent({ event: GtmEventTypes.Login, login: GtmLoginTypes.Google });
      return result.user;
    }
  } catch (e) {
    console.error(e);
    await signOut();
    showError();
  }

  try {
    await firebase.auth().signInWithRedirect(googleProvider);
    pushEvent({ event: GtmEventTypes.SignUp });
  } catch (e) {
    console.error(e);
    await signOut();
    showError();
  }
}

export async function loginEmailPassword(email: string, password: string): Promise<firebase.User> {
  try {
    const credential: firebase.auth.UserCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    pushEvent({ event: GtmEventTypes.Login, login: GtmLoginTypes.Email });
    return credential.user;
  } catch (e) {
    if (e.code === AuthErrors.UserNotFound) {
      return await signUp(email, password);
    }

    console.error(e);
    await signOut();
    showError();
  }
}

export async function loginLink(email: string): Promise<void> {
  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };
  try {
    await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);
    persistEmailLocalStorage(email);
  } catch (e) {
    console.error(e);
    await signOut();
    showError();
  }
}

export async function sendEmailVerification(user?: firebase.User): Promise<void> {
  user = user || firebase.auth().currentUser;

  if (user) {
    try {
      await user.sendEmailVerification();
    } catch (e) {
      console.error(e);
      showError();
    }
  }
}

export async function updateProfile(displayName: string): Promise<void> {
  const user: firebase.User = firebase.auth().currentUser;
  displayName = remove(displayName).toUpperCase();

  try {
    await user.updateProfile({ displayName });
    await saveUser();
  } catch (e) {
    console.error(e);
    showError();
  }

  handleUser(firebase.auth().currentUser);
}

export function persistEmailLocalStorage(email: string) {
  // The link was successfully sent. Inform the user.
  // Save the email locally so you don't need to ask the user for it again
  // if they open the link on the same device.
  window.localStorage.setItem('emailForSignIn', email);
}

export function getEmailLocalStorage(): string {
  return window.localStorage.getItem('emailForSignIn') || undefined;
}

export function removeEmailLocalStorage() {
  window.localStorage.removeItem('emailForSignIn');
}
