import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyC1OsNO9-aVE2jH6u9axOP6Mdj_UxoygI4",
  authDomain: "salon-eventos-ef008.firebaseapp.com",
  projectId: "salon-eventos-ef008",
  storageBucket: "salon-eventos-ef008.appspot.com",
  messagingSenderId: "411757285067",
  appId: "1:411757285067:web:433a592e95940d5db3d54e"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)