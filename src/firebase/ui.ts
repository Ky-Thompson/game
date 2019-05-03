import { hide, show } from '@game/helpers';

import { saveUser } from './database';

const game: HTMLElement = document.getElementById('game-container');
const auth: HTMLElement = document.getElementById('auth');

const loadingIndicator: HTMLDivElement = <any>document.getElementById('loading-indicator');
const errorMsg: HTMLDivElement = <any>document.getElementById('error-msg');

const loginSection: HTMLElement = document.getElementById('login');

const loginTOCSection: HTMLDivElement = <any>document.getElementById('login-toc-section');
const loginTOCGoogleButton: HTMLButtonElement = <any>document.getElementById('login-toc-google-button');
const loginTOCEmailButton: HTMLButtonElement = <any>document.getElementById('login-toc-email-button');
const loginTOCSignUpButton: HTMLButtonElement = <any>document.getElementById('login-toc-sign-up-button');
const loginTOCLinkButton: HTMLButtonElement = <any>document.getElementById('login-toc-link-button');

const loginSignUpSection: HTMLDivElement = <any>document.getElementById('sign-up-section');
const signUpForm: HTMLFormElement = <any>document.getElementById('sign-up-form');
const signUpSubmitButton: HTMLButtonElement = <any>document.getElementById('sign-up-button');
const signUpBackButton: HTMLButtonElement = <any>document.getElementById('sign-up-back-button');

const loginLinkSection: HTMLDivElement = <any>document.getElementById('get-link-section');
const getLinkForm: HTMLFormElement = <any>document.getElementById('get-link-form');
const getLinkSubmitButton: HTMLButtonElement = <any>document.getElementById('get-link-button');
const getLinkBackButton: HTMLButtonElement = <any>document.getElementById('get-link-back-button');
const getLinkSuccessMsg: HTMLDivElement = <any>document.getElementById('get-link-success-msg');

const loginEmailSection: HTMLDivElement = <any>document.getElementById('login-email-section');
const loginForm: HTMLFormElement = <any>document.getElementById('login-email-form');
const loginSubmitButton: HTMLButtonElement = <any>document.getElementById('login-email-button');
const loginBackButton: HTMLButtonElement = <any>document.getElementById('login-email-back-button');

const emailVerificationSection: HTMLElement = document.getElementById('email-verification');
const emailVerificationButton: HTMLButtonElement = <any>document.getElementById('email-verification-button');
const emailVerificationSignOutButton: HTMLButtonElement = <any>document.getElementById('email-verification-sign-out-button');

const displayNameSection: HTMLElement = document.getElementById('display-name');
const displayNameForm: HTMLFormElement = <any>document.getElementById('display-name-form');
const displayNameButton: HTMLButtonElement = <any>document.getElementById('display-name-button');
const displayNameSignOutButton: HTMLButtonElement = <any>document.getElementById('display-name-sign-out-button');

export enum AuthButtons {
  LoginGoogle,
  GetLink,
  LoginEmailPassword,
  SignUp,
  EmailVerification,
  DisplayName,
  SignOut,
}

export enum AuthSteps {
  Login,
  LoginEmail,
  LoginSignUp,
  LoginGetLink,
  EmailVerification,
  DisplayName,
}

export function showError() {
  show(errorMsg);
}

export function hideError() {
  hide(errorMsg);
}

export function showGame() {
  hide(auth);
  hide(loadingIndicator);
  show(game);
  saveUser();
}

export function showAuth(step: AuthSteps) {
  hide(game);
  hide(errorMsg);
  hide(loginSection);
  hide(loginTOCSection);
  hide(loginEmailSection);
  hide(loginLinkSection);
  hide(loginSignUpSection);
  hide(emailVerificationSection);
  hide(displayNameSection);

  switch (step) {
    case AuthSteps.Login:
      show(loginSection);
      show(loginTOCSection);
      break;
    case AuthSteps.LoginEmail:
      show(loginSection);
      show(loginEmailSection);
      break;
    case AuthSteps.LoginGetLink:
      show(loginSection);
      show(loginLinkSection);
      hide(getLinkSuccessMsg);
      break;
    case AuthSteps.LoginSignUp:
      show(loginSection);
      show(loginSignUpSection);
      break;
    case AuthSteps.EmailVerification:
      show(emailVerificationSection);
      break;
    case AuthSteps.DisplayName:
      show(displayNameSection);
      break;
  }

  show(auth);
}

export function registerAuthButton(button: AuthButtons, callback: (event: Event) => Promise<any>) {
  switch (button) {
    case AuthButtons.LoginGoogle:
      addClickEvent(loginTOCGoogleButton, callback);
      break;

    case AuthButtons.GetLink:
      loginTOCLinkButton.addEventListener('click', () => showAuth(AuthSteps.LoginGetLink));
      getLinkBackButton.addEventListener('click', () => showAuth(AuthSteps.Login));
      addSubmitEvent(getLinkForm, getLinkSubmitButton, callback, () => {
        getLinkSubmitButton.disabled = true;
        show(getLinkSuccessMsg);
      });
      break;

    case AuthButtons.LoginEmailPassword:
      loginTOCEmailButton.addEventListener('click', () => showAuth(AuthSteps.LoginEmail));
      loginBackButton.addEventListener('click', () => showAuth(AuthSteps.Login));
      addSubmitEvent(loginForm, loginSubmitButton, callback);
      break;

    case AuthButtons.SignUp:
      loginTOCSignUpButton.addEventListener('click', () => showAuth(AuthSteps.LoginSignUp));
      signUpBackButton.addEventListener('click', () => showAuth(AuthSteps.Login));
      addSubmitEvent(signUpForm, signUpSubmitButton, callback);
      break;

    case AuthButtons.EmailVerification:
      addClickEvent(emailVerificationButton, callback);
      break;

    case AuthButtons.DisplayName:
      addSubmitEvent(displayNameForm, displayNameButton, callback);
      break;

    case AuthButtons.SignOut:
      addClickEvent(emailVerificationSignOutButton, callback);
      addClickEvent(displayNameSignOutButton, callback);
      break;
  }
}

export function addClickEvent(button: HTMLButtonElement, callback: (event: Event) => Promise<any>) {
  button.addEventListener('click', async (event: Event) => {
    button.disabled = true;
    await callback(event);
    button.disabled = false;
  });
}

export function addSubmitEvent(
  form: HTMLFormElement,
  submitButton: HTMLButtonElement,
  callback: (event: Event) => Promise<any>,
  onSuccess?: Function
) {
  form.addEventListener('submit', (event: Event) => {
    event.preventDefault();
    event.stopPropagation();

    submitButton.disabled = true;
    form.classList.add('was-validated');

    if (form.checkValidity()) {
      callback(event).then(() => {
        submitButton.disabled = false;
        if (onSuccess) {
          onSuccess();
        }
      });
    }
    return false;
  });
}
