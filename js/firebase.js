
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import { getDatabase } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCNLkky1xDpGJzdP8NGWZ-iGJMwKMTDQ8E",
  authDomain: "hostelhub-a1f11.firebaseapp.com",
  databaseURL: "https://hostelhub-a1f11-default-rtdb.firebaseio.com",
  projectId: "hostelhub-a1f11",
  storageBucket: "hostelhub-a1f11.firebasestorage.app",
  messagingSenderId: "494743815718",
  appId: "1:494743815718:web:fe10453d00e6d3749948e7",
  measurementId: "G-25JPY0REC6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

export const authReady = setPersistence(
  auth,
  browserLocalPersistence
);
