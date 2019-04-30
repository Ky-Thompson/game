import * as firebase from 'firebase/app';

import { firebaseApp } from './app';
import { AuthButtons, AuthSteps, registerAuthButton, showAuth, showGame } from './ui';

export enum LoginTypes {
  Google,
  EmailPassword,
  Link,
}

export enum AuthErrors {
  EmailAlreadyInUse = 'auth/email-already-in-use',
}

export interface EmailPassword {
  email?: string;
  password?: string;
}

export function initApp(): Promise<firebase.User> {
  let initialized: boolean;

  // Initialize UI
  registerAuthButton(AuthButtons.LoginGoogle, async () => await login(LoginTypes.Google));
  registerAuthButton(AuthButtons.LoginEmailPassword, (event: Event) =>
    handleForm(event, ({ email, password }) => login(LoginTypes.Google, email, password))
  );
  registerAuthButton(AuthButtons.GetLink, (event: Event) => handleForm(event, ({ email }) => login(LoginTypes.Link, email)));
  registerAuthButton(AuthButtons.SignUp, (event: Event) => handleForm(event, ({ email, password }) => signUp(email, password)));
  registerAuthButton(AuthButtons.EmailVerification, async () => await sendEmailVerification());
  registerAuthButton(AuthButtons.SignOut, async () => await signOut());

  // Wait for user's authentication
  return new Promise(async (resolve, reject) => {
    // Wait for user to be logged in
    const auth: firebase.auth.Auth = firebase.auth(firebaseApp);
    auth.useDeviceLanguage();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    auth.onAuthStateChanged((user: firebase.User) => {
      // TODO: Handle user states: fill display name

      if (!user) {
        showAuth(AuthSteps.Login);
      } else if (user && user.email && !user.emailVerified) {
        showAuth(AuthSteps.EmailVerification);
      } else if (user) {
        showGame();

        if (!initialized) {
          initialized = true;
          resolve(user);
        }
      } else {
        showAuth(AuthSteps.Login);
      }
    });

    // Check sign-in with email
    if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
      let email = getEmail();
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }

      try {
        await firebase.auth().signInWithEmailLink(email, window.location.href);
      } catch (e) {
        console.error(e);
      }
    }
  });
}

export async function handleForm(event: Event, callback: (EmailPassword) => Promise<any>) {
  const form: HTMLFormElement = (<any>event.target).elements ? <any>event.target : (<any>event.target).form;
  const email: string = form.elements['email'].value;
  const password: string = form.elements['password'] ? form.elements['password'].value : undefined;

  if (form.checkValidity()) {
    await callback({ email, password });
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
  return await firebase.auth().signOut();
}

export async function signUp(email: string, password: string): Promise<firebase.User> {
  try {
    const result: firebase.auth.UserCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    await sendEmailVerification(result.user);
    return result.user;
  } catch (e) {
    if (e.code === AuthErrors.EmailAlreadyInUse) {
      return await login(LoginTypes.EmailPassword, email, password);
    } else {
      console.log(e);
      await signOut();
    }
  }
}

export async function loginGoogle(): Promise<firebase.User> {
  const googleProvider = new firebase.auth.GoogleAuthProvider();
  const email = getEmail();

  if (email) {
    googleProvider.setCustomParameters({ login_hint: email });
  }

  try {
    const result: firebase.auth.UserCredential = await firebase.auth(firebaseApp).getRedirectResult();
    if (result.credential) {
      return result.user;
    }
  } catch (e) {
    console.error(e);
    await signOut();
  }

  try {
    await firebase.auth().signInWithRedirect(googleProvider);
  } catch (e) {
    console.error(e);
    await signOut();
  }
}

export async function loginEmailPassword(email: string, password: string): Promise<firebase.User> {
  try {
    const credential: firebase.auth.UserCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    return credential.user;
  } catch (e) {
    console.error(e);
    await signOut();
  }
}

export async function loginLink(email: string): Promise<void> {
  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };
  try {
    await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);
    persistEmail(email);
  } catch (e) {
    console.error(e);
    await signOut();
  }
}

export async function sendEmailVerification(user?: firebase.User): Promise<void> {
  user = user || firebase.auth().currentUser;

  if (user) {
    try {
      await user.sendEmailVerification();
    } catch (e) {
      console.error(e);
    }
  }
}

export function persistEmail(email: string) {
  // The link was successfully sent. Inform the user.
  // Save the email locally so you don't need to ask the user for it again
  // if they open the link on the same device.
  window.localStorage.setItem('emailForSignIn', email);
}

export function getEmail(): string {
  return window.localStorage.getItem('emailForSignIn') || undefined;
}
