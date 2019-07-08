import { allowUserAccess, cleanUpScores, disallowUserAccess, FirebaseUser, listUsersWithoutAccess } from './database';

const adminTable: HTMLElement = document.getElementById('admin-users');
const firstUser: HTMLElement = document.getElementById('first-admin-user');

let unsubscribe: () => void;
let users: FirebaseUser[] = [];

export async function createAdmin() {
  const onAdded = (user: FirebaseUser) => addUser(user);
  const onRemoved = (user: FirebaseUser) => removeUser(user);
  unsubscribe = await listUsersWithoutAccess(onAdded, onRemoved);
  cleanUpScores();
}

export function destroyAdmin() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = undefined;
  }
}

function addUser(newUser: FirebaseUser) {
  if (users.find((user) => user.uid === newUser.uid)) {
    return; // Existing
  }

  users.push(newUser);

  const name = document.createElement('td');
  name.appendChild(document.createTextNode(newUser.displayName.toUpperCase()));

  const allowButton = document.createElement('button');
  allowButton.type = 'button';
  allowButton.className = 'btn btn-success';
  allowButton.appendChild(document.createTextNode('Allow'));
  allowButton.addEventListener('click', () => {
    allowUserAccess(newUser);
    allowButton.disabled = true;
  });
  const allowColumn = document.createElement('td');
  allowColumn.appendChild(allowButton);

  const disallowButton = document.createElement('button');
  disallowButton.type = 'button';
  disallowButton.className = 'btn btn-danger';
  disallowButton.appendChild(document.createTextNode('Disallow'));
  disallowButton.addEventListener('click', () => {
    disallowUserAccess(newUser);
    disallowButton.disabled = true;
  });
  const disallowColumn = document.createElement('td');
  disallowColumn.appendChild(disallowButton);

  const row = document.createElement('tr');
  row.id = `user-${newUser.uid}`;
  row.appendChild(name);
  row.appendChild(allowColumn);
  row.appendChild(disallowColumn);

  adminTable.insertBefore(row, firstUser.nextSibling);
}

function removeUser(removedUser: FirebaseUser) {
  const row = document.getElementById(`user-${removedUser.uid}`);

  if (row) {
    adminTable.removeChild(row);
    users = users.filter((user) => user.uid !== removedUser.uid);
  }
}
