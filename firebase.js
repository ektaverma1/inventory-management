// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBA6-1O02KSsj8zmiYpQyX2xOZDqrOxkSA",
  authDomain: "inventory-management-app-45e7d.firebaseapp.com",
  projectId: "inventory-management-app-45e7d",
  storageBucket: "inventory-management-app-45e7d.appspot.com",
  messagingSenderId: "638940823491",
  appId: "1:638940823491:web:a2458160c76ed292834776",
  measurementId: "G-M1CW41T8T0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { firestore };
// const analytics = getAnalytics(app);