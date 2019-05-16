import * as firebase from 'firebase/app';

import 'firebase/auth';
import 'firebase/database';

import { Players } from '@game/models';

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
  uid?: string;
}

let cachedFirebaseUser: FirebaseUser;

export async function getUser(): Promise<FirebaseUser> {
  const user: firebase.User = firebase.auth().currentUser;

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
      cachedFirebaseUser = {
        ...firebaseUser,
        ...authUser,
      };
    }

    return cachedFirebaseUser;
  } catch (e) {
    console.error(e);
    return authUser;
  }
}

export async function saveUser(): Promise<void> {
  const user: firebase.User = firebase.auth().currentUser;

  if (!user || !user.uid) {
    return;
  }

  const firebaseUser: FirebaseUser = {
    displayName: user.displayName,
    email: user.email,
  };

  // First read in case the update is not needed
  try {
    const currentFirebaseUser: FirebaseUser = await getUser();

    if (
      currentFirebaseUser &&
      currentFirebaseUser.displayName === firebaseUser.displayName &&
      currentFirebaseUser.email === firebaseUser.email
    ) {
      // No need to write
      return;
    }
  } catch (e) {}

  try {
    await firebase
      .database()
      .ref(`/users/${user.uid}`)
      .update(firebaseUser);

    cachedFirebaseUser = {
      ...cachedFirebaseUser,
      ...firebaseUser,
    };
  } catch (e) {
    console.error(e);
  }
}

export async function saveScore(score: number, player: Players, displayName: string): Promise<void> {
  const user: firebase.User = firebase.auth().currentUser;

  if (!user || !user.uid) {
    return;
  }

  const firebaseScore: FirebaseScore = {
    score,
    player,
    user: user.uid,
    displayName: displayName || user.displayName,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  };

  await firebase
    .database()
    .ref('/scores')
    .push(firebaseScore);
}

export async function listScores(): Promise<FirebaseScore[]> {
  const scores: FirebaseScore[] = [];

  try {
    const firebaseScores: firebase.database.DataSnapshot = await firebase
      .database()
      .ref('/scores')
      .orderByChild('score')
      .limitToLast(20)
      .once('value');

    firebaseScores.forEach((score) => {
      scores.push(score.val());
    });
  } catch (e) {
    console.error(e);
  }

  return scores.sort((scoreA, scoreB) => scoreB.score - scoreA.score);
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
    console.error(e);

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
  } catch (e) {
    console.error(e);
  }
}

export async function disallowUserAccess(user: FirebaseUser): Promise<void> {
  try {
    await firebase
      .database()
      .ref(`/users/${user.uid}`)
      .update({ access: false });
  } catch (e) {
    console.error(e);
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

      if (firebaseUser.access === true) {
        unsubscribe();
        onSuccess();
      } else if (firebaseUser.access === false) {
        unsubscribe();
        onForbidden();
      }
    });
  } catch (e) {
    console.error(e);

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
  }
}
