import * as firebase from 'firebase/app';

import 'firebase/auth';
import 'firebase/database';

import { GtmEventTypes, pushEvent } from '@game/analytics';
import { Players } from '@game/models';
import * as Sentry from '@sentry/browser';
import { remove as removeDiacritics } from 'diacritics';

export interface FirebaseScore {
  score: number;
  player: Players;
  user: string;
  displayName: string;
  timestamp: any;
}

export interface FirebaseUser {
  displayName: string;
  email?: string;
  admin?: boolean;
  access?: boolean;
  exhibit?: boolean;
  tester?: boolean;
  uid?: string;
}

let cachedFirebaseUser: FirebaseUser;
let userNeedsSanitization: boolean = false;

export function sanitize(input: any): string {
  return removeDiacritics(String(input || '')).toUpperCase();
}

export function sanitizeData(data: FirebaseUser | FirebaseScore | firebase.User): FirebaseUser | FirebaseScore | firebase.User {
  if (!data) {
    return;
  }

  return {
    ...data,
    displayName: sanitize(data.displayName),
  };
}

export async function getUser(): Promise<FirebaseUser> {
  // Handle user in offline mode
  if (!navigator.onLine) {
    const persistedUser = getUserLocalStorage();
    if (persistedUser) {
      return sanitizeData(persistedUser);
    } else {
      return {
        displayName: 'EXHIBIT',
        access: true,
        exhibit: true,
      };
    }
  }

  const user: firebase.User = sanitizeData(firebase.auth().currentUser) as firebase.User;

  if (!user || !user.uid) {
    return;
  }

  if (cachedFirebaseUser) {
    return cachedFirebaseUser;
  }

  const authUser: FirebaseUser = {
    displayName: user.displayName,
    email: user.email,
  };

  try {
    const firebaseUser: FirebaseUser = (await firebase
      .database()
      .ref(`/users/${user.uid}`)
      .once('value')).val();

    if (firebaseUser) {
      const sanitizedUser: FirebaseUser = sanitizeData(firebaseUser) as FirebaseUser;
      userNeedsSanitization = firebaseUser.displayName !== sanitizedUser.displayName;

      cachedFirebaseUser = {
        ...authUser,
        ...sanitizedUser,
      };

      persistUserLocalStorage(cachedFirebaseUser);
    }

    return cachedFirebaseUser;
  } catch (e) {
    Sentry.captureException(e);
    return authUser;
  }
}

export async function saveUser(): Promise<void> {
  const user: firebase.User = firebase.auth().currentUser;

  if (!user || !user.uid) {
    return;
  }

  let firebaseUser: FirebaseUser = {
    displayName: user.displayName,
    email: user.email,
  };

  // First read in case the update is not needed
  try {
    const currentFirebaseUser: FirebaseUser = await getUser();

    if (
      currentFirebaseUser &&
      currentFirebaseUser.displayName === firebaseUser.displayName &&
      currentFirebaseUser.email === firebaseUser.email &&
      !userNeedsSanitization
    ) {
      // No need to write
      return;
    }
  } catch (e) {}

  try {
    firebaseUser = sanitizeData(firebaseUser);

    await firebase
      .database()
      .ref(`/users/${user.uid}`)
      .update(firebaseUser);

    cachedFirebaseUser = {
      ...cachedFirebaseUser,
      ...firebaseUser,
    };
  } catch (e) {
    Sentry.captureException(e);
  }
}

export const MAX_SCORES = 20;

export async function saveScore(score: number, player: Players, displayName: string): Promise<void> {
  const user: firebase.User = sanitizeData(firebase.auth().currentUser) as firebase.User;

  if (!user || !user.uid) {
    return;
  }

  // Check if score is high enough to be saved
  const scores = await listScores();
  const lastScore = scores[scores.length - 1];

  if (scores.length >= MAX_SCORES && score < lastScore.score) {
    return;
  }

  // Create new score record
  const firebaseScore: FirebaseScore = sanitizeData({
    score,
    player,
    user: user.uid,
    displayName: displayName || user.displayName,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  }) as FirebaseScore;

  // Check if the new score is the best for the user
  const maxScore: FirebaseScore = scores.filter((score) => score.displayName === firebaseScore.displayName)[0];

  if (maxScore && maxScore.score >= firebaseScore.score) {
    return;
  }

  // Save score
  try {
    await firebase
      .database()
      .ref('/scores')
      .push(firebaseScore);

    if (maxScore) {
      await cleanUpScores();
    }
  } catch (e) {
    Sentry.captureException(e);
  }
}

export async function listScores(): Promise<FirebaseScore[]> {
  const scores: FirebaseScore[] = [];

  try {
    const firebaseScores: firebase.database.DataSnapshot = await firebase
      .database()
      .ref('/scores')
      .orderByChild('score')
      .limitToLast(MAX_SCORES)
      .once('value');

    firebaseScores.forEach((score) => {
      scores.push(sanitizeData(score.val()) as FirebaseScore);
    });
  } catch (e) {
    Sentry.captureException(e);
  }

  return scores.sort((scoreA, scoreB) => scoreB.score - scoreA.score);
}

export async function cleanUpScores(): Promise<void> {
  const keyedScores: { [displayName: string]: { ref: firebase.database.Reference; score: FirebaseScore } } = {};

  try {
    const firebaseScores: firebase.database.DataSnapshot = await firebase
      .database()
      .ref('/scores')
      .orderByChild('score')
      .limitToLast(MAX_SCORES)
      .once('value');

    firebaseScores.forEach((score: firebase.database.DataSnapshot) => {
      const currentScore: FirebaseScore = sanitizeData(score.val()) as FirebaseScore;

      if (keyedScores[currentScore.displayName]) {
        // When for the same display name there are multiple scores, remove the worst
        if (keyedScores[currentScore.displayName].score.score > currentScore.score) {
          score.ref.remove();
        } else {
          keyedScores[currentScore.displayName].ref.remove();
          keyedScores[currentScore.displayName] = { score: currentScore, ref: score.ref };
        }
      } else {
        keyedScores[currentScore.displayName] = { score: currentScore, ref: score.ref };
      }
    });
  } catch (e) {
    Sentry.captureException(e);
  }
}

export async function limitScores(): Promise<void> {
  try {
    const firebaseScores: firebase.database.DataSnapshot = await firebase
      .database()
      .ref('/scores')
      .orderByChild('score')
      .once('value');

    const numScores = firebaseScores.numChildren();
    let deletedScores = 0;

    firebaseScores.forEach((score: firebase.database.DataSnapshot) => {
      if (numScores - deletedScores > MAX_SCORES) {
        score.ref.remove();
      }
      deletedScores++;
    });
  } catch (e) {
    Sentry.captureException(e);
  }
}

export async function listUsersWithoutAccess(
  onAdded: (user: FirebaseUser) => void,
  onRemoved: (user: FirebaseUser) => void
): Promise<() => void> {
  if (!cachedFirebaseUser.admin) {
    return;
  }

  let usersRef: firebase.database.Query;
  let unsubscribe: () => void;

  try {
    usersRef = firebase
      .database()
      .ref('/users')
      .orderByChild('access')
      .equalTo(null)
      .limitToFirst(20);

    const onUserAdded = (user: firebase.database.DataSnapshot) => {
      onAdded({ ...user.val(), uid: user.key });
    };

    const onUserRemoved = (user: firebase.database.DataSnapshot) => {
      onRemoved({ ...user.val(), uid: user.key });
    };

    usersRef.on('child_added', onUserAdded);
    usersRef.on('child_removed', onUserRemoved);

    unsubscribe = () => {
      usersRef.off('child_added');
      usersRef.off('child_removed');
    };

    return unsubscribe;
  } catch (e) {
    Sentry.captureException(e);

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
  }
}

export async function allowUserAccess(user: FirebaseUser): Promise<void> {
  try {
    await firebase
      .database()
      .ref(`/users/${user.uid}`)
      .update({ access: true });

    pushEvent({ event: GtmEventTypes.AllowUser });
  } catch (e) {
    Sentry.captureException(e);
  }
}

export async function disallowUserAccess(user: FirebaseUser): Promise<void> {
  try {
    await firebase
      .database()
      .ref(`/users/${user.uid}`)
      .update({ access: false });

    pushEvent({ event: GtmEventTypes.DisallowUser });
  } catch (e) {
    Sentry.captureException(e);
  }
}

export async function hasUserAccess(onSuccess: () => void, onForbidden: () => void): Promise<void> {
  const user: firebase.User = firebase.auth().currentUser;

  const authUser: FirebaseUser = {
    displayName: user.displayName,
    email: user.email,
  };

  let userRef: firebase.database.Query;
  let unsubscribe: () => void;

  try {
    userRef = await firebase.database().ref(`/users/${user.uid}`);

    unsubscribe = () => userRef.off('value');

    userRef.on('value', (userChange: firebase.database.DataSnapshot) => {
      const firebaseUser: FirebaseUser = userChange.val();

      cachedFirebaseUser = {
        ...authUser,
        ...firebaseUser,
      };

      if (!firebaseUser) {
        return;
      }

      if (firebaseUser.access === true) {
        unsubscribe();
        onSuccess();
      } else if (firebaseUser.access === false) {
        unsubscribe();
        onForbidden();
      }
    });
  } catch (e) {
    Sentry.captureException(e);

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
  }
}

export function persistUserLocalStorage(user: FirebaseUser) {
  window.localStorage.setItem('gameUser', JSON.stringify(user));
}

export function getUserLocalStorage(): FirebaseUser {
  try {
    return JSON.parse(window.localStorage.getItem('gameUser'));
  } catch (e) {
    return undefined;
  }
}
