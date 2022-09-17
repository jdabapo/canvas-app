import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import * as firebase from './utils/Firebase';
import { UserContext } from './utils/UserContext';

const app = firebase.app;
const db = firebase.db;


const auth = getAuth(app);
const login = () => {
  signInWithEmailAndPassword(auth, 'test@test.com', 'password');
};
const logout = () => {
  signOut(auth);
};

export function CurrentUser(){
    const u = React.useContext(UserContext);
    console.log(u);
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
      <div>
        <p>Initialising User...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
      </div>
    );
  } 
  if (user) {
    return (
      <div>
        {u ? u.gender : <p>waiting</p>}
        <p> Current User: {user.email}</p>
        <button onClick={logout}>Log out</button>
      </div>
    );
  }
  return <button onClick={login}>Log in</button>;
};