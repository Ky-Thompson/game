import { createGame, destroyGame } from '@game/game';

import { createAdmin } from './admin';
import { saveUser } from './database';

const game: HTMLElement = document.getElementById('game');
const auth: HTMLElement = document.getElementById('auth');
const admin: HTMLElement = document.getElementById('admin');
const version: HTMLElement = document.getElementById('version');

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
const loginWrongPasswordMsg: HTMLDivElement = <any>document.getElementById('wrong-password-msg');
const forgotPassword: HTMLButtonElement = <any>document.getElementById('forgot-password-link');
const resetEmailMsg: HTMLDivElement = <any>document.getElementById('reset-email-sent-msg');

const emailVerificationSection: HTMLElement = document.getElementById('email-verification');
const emailVerificationButton: HTMLButtonElement = <any>document.getElementById('email-verification-button');
const emailVerificationSignOutButton: HTMLButtonElement = <any>document.getElementById('email-verification-sign-out-button');
const emailVerificationSentMsg: HTMLDivElement = <any>document.getElementById('verification-email-sent-msg');

const displayNameSection: HTMLElement = document.getElementById('display-name');
const displayNameForm: HTMLFormElement = <any>document.getElementById('display-name-form');
const displayNameInput: HTMLInputElement = <any>document.getElementById('display-name-input');
const displayNameButton: HTMLButtonElement = <any>document.getElementById('display-name-button');
const displayNameSignOutButton: HTMLButtonElement = <any>document.getElementById('display-name-sign-out-button');

const waitAccessSection: HTMLElement = document.getElementById('wait-access');

const forbiddenSection: HTMLElement = document.getElementById('forbidden');

export enum AuthButtons {
  LoginGoogle,
  GetLink,
  LoginEmailPassword,
  SignUp,
  EmailVerification,
  DisplayName,
  SignOut,
  ResetPassword,
}

export enum AuthSteps {
  Login,
  LoginEmail,
  LoginSignUp,
  LoginGetLink,
  EmailVerification,
  DisplayName,
  WaitAccess,
  Forbidden,
}

export function show(element: HTMLElement) {
  element.style.display = '';
  element.hidden = false;
}

export function hide(element: HTMLElement) {
  element.style.display = 'none';
  element.hidden = true;
}

export function showError() {
  show(errorMsg);
}

export function hideError() {
  hide(errorMsg);
}

export function showWrongPasswordError() {
  show(loginWrongPasswordMsg);
  show(forgotPassword);
}

export function hideWrongPasswordError() {
  hide(loginWrongPasswordMsg);
}

export function showForgotPassword() {
  show(forgotPassword);
}

export function showResetEmailSent() {
  show(resetEmailMsg);
}

export function hideResetEmailSent() {
  hide(resetEmailMsg);
}

export function showVerificationEmailSent() {
  show(emailVerificationSentMsg);
}

export function hideVerificationEmailSent() {
  hide(emailVerificationSentMsg);
}

export function showGame() {
  hide(auth);
  hide(admin);
  hide(loadingIndicator);
  createGame();
  show(game);
  saveUser();
}

export function showAuth(step: AuthSteps) {
  destroyGame();
  hide(game);
  hide(admin);
  hide(loadingIndicator);
  hide(errorMsg);
  hide(loginWrongPasswordMsg);
  hide(forgotPassword);
  hide(resetEmailMsg);
  hide(loginSection);
  hide(loginTOCSection);
  hide(loginEmailSection);
  hide(loginLinkSection);
  hide(loginSignUpSection);
  hide(emailVerificationSection);
  hide(emailVerificationSentMsg);
  hide(displayNameSection);
  hide(waitAccessSection);
  hide(forbiddenSection);

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
    case AuthSteps.WaitAccess:
      show(waitAccessSection);
      break;
    case AuthSteps.Forbidden:
      show(forbiddenSection);
      break;
  }

  show(auth);
}

export function showAdmin() {
  destroyGame();
  hide(game);
  hide(auth);
  hide(loadingIndicator);
  createAdmin();
  show(admin);
}

export function showVersion() {
  show(version);
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
      // Only allow letters and numbers in display name
      displayNameInput.addEventListener('keydown', (event: KeyboardEvent) => {
        if (!isEnter(event) && !isSpace(event) && !isLetter(event) && !isNumber(event) && !isBackspace(event)) {
          event.preventDefault();
          return false;
        }
        return true;
      });
      addSubmitEvent(displayNameForm, displayNameButton, callback);
      break;

    case AuthButtons.SignOut:
      addClickEvent(emailVerificationSignOutButton, callback);
      addClickEvent(displayNameSignOutButton, callback);
      break;

    case AuthButtons.ResetPassword:
      addClickEvent(forgotPassword, callback);
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

export function isEnter(event: KeyboardEvent): boolean {
  return event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER;
}

export function isSpace(event: KeyboardEvent): boolean {
  return event.keyCode === Phaser.Input.Keyboard.KeyCodes.SPACE;
}

export function isLetter(event: KeyboardEvent): boolean {
  return event.keyCode >= Phaser.Input.Keyboard.KeyCodes.A && event.keyCode <= Phaser.Input.Keyboard.KeyCodes.Z;
}

export function isNumber(event: KeyboardEvent): boolean {
  return (
    (event.keyCode >= Phaser.Input.Keyboard.KeyCodes.ZERO && event.keyCode <= Phaser.Input.Keyboard.KeyCodes.NINE) ||
    (event.keyCode >= Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO && event.keyCode <= Phaser.Input.Keyboard.KeyCodes.NUMPAD_NINE)
  );
}

export function isBackspace(event: KeyboardEvent): boolean {
  return event.keyCode === Phaser.Input.Keyboard.KeyCodes.BACKSPACE;
}

export function isEscape(event: KeyboardEvent): boolean {
  return event.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC;
}
