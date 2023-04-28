import * as Sentry from '@sentry/browser';

declare const VERSION: string;

export enum Environment {
  Production = 'Production',
  Staging = 'Staging',
  Development = 'Development',
}

export const IS_PRODUCTION = !!location.host.match(/.*\.github.io/);
export const IS_STAGING = !!location.host.match(/.*\.herokuapp\.com/);
export const IS_DEVELOPMENT = !!location.host.match(/localhost/);

export const SENTRY_DSN = null; //'https://199cda71329c4e1b8b174785af5addf5@sentry.io/1494963';

export const initLog = () => {
  let environment: Environment;

  if (IS_PRODUCTION) {
    environment = Environment.Production;
  } else if (IS_STAGING) {
    environment = Environment.Staging;
  } else {
    environment = Environment.Development;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    release: VERSION,
    beforeBreadcrumb(breadcrumb, hint) {
      return breadcrumb.category === 'xhr' ? null : breadcrumb;
    },
    environment,
  });
};

export const configUser = (user: firebase.User) => {
  Sentry.configureScope((scope: Sentry.Scope) => {
    if (user) {
      scope.setUser({
        email: user.email,
        username: user.displayName,
        id: user.uid,
      });
    } else {
      scope.setUser({});
    }
  });
};
