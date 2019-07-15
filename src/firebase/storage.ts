import * as firebase from 'firebase/app';

import 'firebase/storage';

export var uploading: boolean = false;

export async function uploadVideo(displayName: string, blob: Blob) {
  const storageRef: firebase.storage.Reference = firebase.storage().ref();
  const videoRef: firebase.storage.Reference = storageRef.child(`videos/${displayName}.webm`);

  uploading = true;

  try {
    console.log(`Uploading video ${displayName}.webm`);
    await videoRef.put(blob);
    console.log(`Video uploaded`);
  } catch (e) {}

  uploading = false;
}
