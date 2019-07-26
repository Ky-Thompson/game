import * as firebase from 'firebase/app';

import { GtmEventTypes, GtmLoginTypes, pushEvent } from '@game/analytics';
import { isSocialReferral } from '@game/firewall';
import { configUser } from '@game/sentry';
import * as Sentry from '@sentry/browser';

import { firebaseApp } from './app';
import { FirebaseUser, getUser, hasUserAccess, sanitize, saveUser } from './database';
import {
  AuthButtons,
  AuthSteps,
  hideError,
  hideResetEmailSent,
  hideVerificationEmailSent,
  hideWrongPasswordError,
  registerAuthButton,
  showAdmin,
  showAuth,
  showError,
  showForgotPassword,
  showGame,
  showResetEmailSent,
  showVerificationEmailSent,
  showVersion,
  showWrongPasswordError,
} from './ui';

export enum LoginTypes {
  Google,
  EmailPassword,
  Link,
}

export enum AuthErrors {
  EmailAlreadyInUse = 'auth/email-already-in-use',
  UserNotFound = 'auth/user-not-found',
  WrongPassword = 'auth/wrong-password',
}

export interface AuthFormData {
  email?: string;
  password?: string;
  name?: string;
}

export const MAX_DISPLAY_NAME = 8;
declare const ENABLE_NEW_USERS: string;

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
  registerAuthButton(AuthButtons.ResetPassword, async () => handleForm(event, ({ email }) => resetPassword(email)));

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
      Sentry.captureException(e);
      await signOut();
      showError();
    }
  }
}

export async function handleForm(event: Event, callback: (formData: AuthFormData) => Promise<any>) {
  hideError();

  const form: HTMLFormElement = (<any>event.target).elements ? <any>event.target : (<any>event.target).form;
  const email: string = form.elements['email'] ? form.elements['email'].value : undefined;
  const password: string = form.elements['password'] ? form.elements['password'].value : undefined;
  const name: string = form.elements['name'] ? (<string>form.elements['name'].value).trim().toUpperCase() : undefined;

  if (form.checkValidity()) {
    await callback({ email, password, name });
  }
}

let userLogged: boolean = false;

export async function handleUser(user: firebase.User) {
  configUser(user);

  if (user && !userLogged) {
    console.info(`User uid: ${user.uid}`, `User displayName: ${user.displayName}`, `User email: ${user.email}`);
    userLogged = true;
  }

  if (isSocialReferral()) {
    showAuth(AuthSteps.Forbidden);
  } else if (!user && !ENABLE_NEW_USERS && !window.location.search.match(/login/i)) {
    showAuth(AuthSteps.Forbidden);
  } else if (!user) {
    showAuth(AuthSteps.Login);
  } else if (user && user.email && !user.emailVerified) {
    showAuth(AuthSteps.EmailVerification);
  } else if (!user.displayName || !user.displayName.trim().length || user.displayName.trim().length > MAX_DISPLAY_NAME) {
    showAuth(AuthSteps.DisplayName);
  } else if (user) {
    await saveUser();
    const user: FirebaseUser = await getUser();

    if (!user) {
      showAuth(AuthSteps.Login);
      return;
    }

    const { admin, access, tester } = user;

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

    if (tester) {
      showVersion();
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
    Sentry.captureException(e);
  }
}

export async function signUp(email: string, password: string): Promise<firebase.User> {
  if (!ENABLE_NEW_USERS) {
    throw new Error('Sign up not allowed');
  }

  try {
    const result: firebase.auth.UserCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    pushEvent({ event: GtmEventTypes.SignUp });
    await sendEmailVerification(result.user);
    return result.user;
  } catch (e) {
    if (e.code === AuthErrors.EmailAlreadyInUse) {
      return await login(LoginTypes.EmailPassword, email, password);
    }

    console.log(`Sign-up error for email: ${email}`);
    Sentry.captureException(e);
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
    Sentry.captureException(e);
    await signOut();
    showError();
  }

  try {
    await firebase.auth().signInWithRedirect(googleProvider);
    pushEvent({ event: GtmEventTypes.SignUp });
  } catch (e) {
    Sentry.captureException(e);
    await signOut();
    showError();
  }
}

export async function loginEmailPassword(email: string, password: string): Promise<firebase.User> {
  try {
    hideWrongPasswordError();
    hideResetEmailSent();
    const credential: firebase.auth.UserCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    pushEvent({ event: GtmEventTypes.Login, login: GtmLoginTypes.Email });
    return credential.user;
  } catch (e) {
    if (e.code === AuthErrors.UserNotFound) {
      return await signUp(email, password);
    } else if (e.code === AuthErrors.WrongPassword) {
      showWrongPasswordError();
      showForgotPassword();
      return;
    }

    console.log(`Login error for email: ${email}`);
    Sentry.captureException(e);
    await signOut();
    showError();
  }
}

export async function loginLink(email: string): Promise<void> {
  if (!ENABLE_NEW_USERS) {
    throw new Error('Sign up not allowed');
  }

  const actionCodeSettings: firebase.auth.ActionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };

  try {
    await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);
    persistEmailLocalStorage(email);
  } catch (e) {
    console.log(`Get link error for email: ${email}`);
    Sentry.captureException(e);
    await signOut();
    showError();
  }
}

export async function sendEmailVerification(user?: firebase.User): Promise<void> {
  if (!ENABLE_NEW_USERS) {
    throw new Error('Sign up not allowed');
  }

  user = user || firebase.auth().currentUser;

  if (user) {
    try {
      hideVerificationEmailSent();
      await user.sendEmailVerification();
      showVerificationEmailSent();
    } catch (e) {
      if (user && user.email) {
        console.log(`Send email verification error for email: ${user.email}`);
      }

      Sentry.captureException(e);
      showError();
    }
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (!email) {
    showError();
    return;
  }

  const actionCodeSettings: firebase.auth.ActionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };

  try {
    hideWrongPasswordError();
    hideResetEmailSent();
    await firebase.auth().sendPasswordResetEmail(email, actionCodeSettings);
    showResetEmailSent();
  } catch (e) {
    console.log(`Reset email error for email: ${email}`);

    Sentry.captureException(e);
    showError();
  }
}

export async function updateProfile(displayName: string): Promise<void> {
  const user: firebase.User = firebase.auth().currentUser;
  displayName = sanitize(displayName);

  try {
    await user.updateProfile({ displayName });
    await saveUser();
  } catch (e) {
    console.log(`Update profile error with display name: ${displayName}`);
    Sentry.captureException(e);
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
