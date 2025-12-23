// This file is deprecated and will be removed in a future version.
// Please use the exports from 'src/firebase/config.ts' instead.

'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "kra-dashboard-7zwcr",
  "appId": "1:312075972890:web:e919b0632350589f8e3ca3",
  "storageBucket": "kra-dashboard-7zwcr.appspot.com",
  "apiKey": "AIzaSyA3z4_7tMgAdB0rrTNo8R3gka-FLWixj2A",
  "authDomain": "kra-dashboard-7zwcr.firebaseapp.com",
  "messagingSenderId": "312075972890"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
