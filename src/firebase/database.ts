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

export async function listUsersWithoutAccess(): Promise<void> {
  console.log(cachedFirebaseUser);

  if (!cachedFirebaseUser.admin) {
    return;
  }

  try {
    const usersRef = firebase
      .database()
      .ref('/users')
      .orderByChild('access')
      .equalTo(null)
      .limitToFirst(20);

    usersRef.on('child_added', (user) => console.log('child_added', user.key));
    usersRef.on('child_removed', (user) => console.log('child_removed', user.key));
  } catch (e) {
    console.error(e);
  }
}
