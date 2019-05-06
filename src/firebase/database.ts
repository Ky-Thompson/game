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

export async function getUser(): Promise<FirebaseUser> {
  const user: firebase.User = firebase.auth().currentUser;

  if (!user || !user.uid) {
    return;
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

    return {
      ...firebaseUser,
      ...authUser,
    };
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

  try {
    await firebase
      .database()
      .ref(`/users/${user.uid}`)
      .update(firebaseUser);
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
