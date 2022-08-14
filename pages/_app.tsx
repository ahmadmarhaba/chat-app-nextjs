import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { initializeApp } from 'firebase/app';
import { Provider } from 'react-redux';
import store from '../store/store';
import 'bootstrap-icons/font/bootstrap-icons.css';

const firebaseConfig = {
  apiKey: "AIzaSyADhLUAb4Guot2ev1md_yE-rPqZnin5qi0",
  authDomain: "chat-app-nextjs-4981b.firebaseapp.com",
  projectId: "chat-app-nextjs-4981b",
  storageBucket: "chat-app-nextjs-4981b.appspot.com",
  messagingSenderId: "725063820157",
  appId: "1:725063820157:web:c58ebd5a15a84fa296e214",
  measurementId: "G-T0M26G4MWD",
};
export const app = initializeApp(firebaseConfig);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store ={store}>
      <Component {...pageProps} />
    </Provider>
  )
}

export default MyApp
