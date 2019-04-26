import { hide, show } from '@game/helpers';

const game: HTMLElement = document.getElementById('game-container');
const auth: HTMLElement = document.getElementById('auth');

const login: HTMLElement = document.getElementById('login');
const loginGoogleButton: HTMLButtonElement = <any>document.getElementById('login-google-button');
const getLinkButton: HTMLButtonElement = <any>document.getElementById('get-link-button');
const loginForm: HTMLFormElement = <any>document.getElementById('login-form');
const loginButton: HTMLButtonElement = <any>document.getElementById('login-button');
const signUpForm: HTMLFormElement = <any>document.getElementById('sign-up-form');
const signUpButton: HTMLButtonElement = <any>document.getElementById('sign-up-button');

const emailVerification: HTMLElement = document.getElementById('email-verification');
const emailVerificationButton: HTMLButtonElement = <any>document.getElementById('email-verification-button');
const emailVerificationSignOutButton: HTMLButtonElement = <any>document.getElementById('email-verification-sign-out-button');

export enum AuthButtons {
  LoginGoogle,
  GetLink,
  LoginEmailPassword,
  SignUp,
  EmailVerification,
  SignOut,
}

export enum AuthSteps {
  Login,
  EmailVerification,
}

export function showGame() {
  hide(auth);
  show(game);
}

export function showAuth(step: AuthSteps) {
  hide(game);
  hide(login);
  hide(emailVerification);

  switch (step) {
    case AuthSteps.Login:
      show(login);
      break;
    case AuthSteps.EmailVerification:
      show(emailVerification);
      break;
  }

  show(auth);
}

export function registerAuthButton(button: AuthButtons, callback: (event: Event) => Promise<any>) {
  switch (button) {
    case AuthButtons.LoginGoogle:
      loginGoogleButton.addEventListener('click', async (event: Event) => {
        loginGoogleButton.disabled = true;
        await callback(event);
        loginGoogleButton.disabled = false;
      });
      break;

    case AuthButtons.GetLink:
      getLinkButton.addEventListener('click', async (event: Event) => {
        getLinkButton.disabled = true;
        await callback(event);
        getLinkButton.disabled = false;
      });
      break;

    case AuthButtons.LoginEmailPassword:
      loginForm.addEventListener('submit', (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        loginButton.disabled = true;
        loginForm.classList.add('was-validated');

        if (loginForm.checkValidity()) {
          callback(event).then(() => (loginButton.disabled = false));
        }
        return false;
      });
      break;

    case AuthButtons.SignUp:
      signUpForm.addEventListener('submit', (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        signUpButton.disabled = true;
        signUpForm.classList.add('was-validated');

        if (signUpForm.checkValidity()) {
          callback(event).then(() => (signUpButton.disabled = false));
        }
        return false;
      });
      break;

    case AuthButtons.EmailVerification:
      emailVerificationButton.addEventListener('click', async (event: Event) => {
        emailVerificationButton.disabled = true;
        await callback(event);
        emailVerificationButton.disabled = false;
      });
      break;

    case AuthButtons.SignOut:
      emailVerificationSignOutButton.addEventListener('click', async (event: Event) => {
        emailVerificationSignOutButton.disabled = true;
        await callback(event);
        emailVerificationSignOutButton.disabled = false;
      });
      break;
  }
}
