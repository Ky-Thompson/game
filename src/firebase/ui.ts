import { hide, show } from '@game/helpers';

const game: HTMLElement = document.getElementById('game-container');
const auth: HTMLElement = document.getElementById('auth');

const login: HTMLElement = document.getElementById('login');
const loginGoogleButton: HTMLButtonElement = <any>document.getElementById('login-google-button');
const getLinkButton: HTMLButtonElement = <any>document.getElementById('get-link-button');
const loginForm: HTMLFormElement = <any>document.getElementById('login-form');
const signUpForm: HTMLFormElement = <any>document.getElementById('sign-up-form');

export enum AuthButtons {
  LoginGoogle,
  GetLink,
  LoginEmailPassword,
  SignUp,
}

export enum AuthSteps {
  Login,
}

export function showGame() {
  hide(auth);
  show(game);
}

export function showAuth(step: AuthSteps) {
  hide(game);
  hide(login);

  switch (step) {
    case AuthSteps.Login:
      show(login);
      break;
  }

  show(auth);
}

export function registerAuthButton(button: AuthButtons, callback: EventListener) {
  switch (button) {
    case AuthButtons.LoginGoogle:
      loginGoogleButton.addEventListener('click', (event: Event) => callback(event));
      break;

    case AuthButtons.GetLink:
      getLinkButton.addEventListener('click', (event: Event) => callback(event));
      break;

    case AuthButtons.LoginEmailPassword:
      loginForm.addEventListener('submit', (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        loginForm.classList.add('was-validated');

        if (loginForm.checkValidity()) {
          callback(event);
        }
        return false;
      });
      break;

    case AuthButtons.SignUp:
      signUpForm.addEventListener('submit', (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        signUpForm.classList.add('was-validated');

        if (signUpForm.checkValidity()) {
          callback(event);
        }
        return false;
      });
      break;
  }
}
