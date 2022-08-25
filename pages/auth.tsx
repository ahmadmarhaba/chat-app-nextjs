import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { NextPage } from "next";
import { addDoc, collection, doc, getDocs, getFirestore, query, setDoc, where } from "firebase/firestore";
import { app } from './_app'
import axios from 'axios'
import Router from 'next/router'
import { useEffect, useRef, useState } from "react";
import styles from '../styles/Auth.module.css'
import { withIronSessionSsr } from "iron-session/next";
import { initializeApp } from "firebase/app";

const SignIn: NextPage = ({ user }: any) => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const emailRef: any = useRef(null);
    const passwordRef: any = useRef(null);
    const nameRef: any = useRef(null);
    let [signin, SetSignin] = useState(true);
    let [loading, SetLoading] = useState(false);
    let [error, SetError] = useState('');

    function GoogleSignin() {
        SetLoading(true);
        SetError(``);
        signInWithPopup(auth, provider)
            .then((result) => {
                UserAuth(result.user);
            }).catch((error) => {
                console.log(error)
                SetError("Google auth failed");
                SetLoading(false);
            });
    }
    function CreatePasswordAuth(email: string, password: string, name: string) {
        if (email.length == 0 || password.length < 6 || name.length == 0) {
            SetError(`Field empty or password less the 6 characters`);
            return;
        }
        SetLoading(true);
        SetError(``);
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                let userD: any = userCredential.user;
                userD.displayName = name;
                UserAuth(userD)
            })
            .catch((error) => {
                console.error(error)
                SetError("Email aleady used");
                SetLoading(false);
            });
    }
    function SigninPasswordAuth(email: string, password: string) {
        if (email.length == 0 || password.length < 6) {
            SetError(`Field empty or password less the 6 characters`);
            return;
        }
        SetLoading(true);
        SetError(``);
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                let userD = userCredential.user;
                UserAuth(userD)
            })
            .catch((error) => {
                SetError("Email or Password wrong");
                console.error(error)
                SetLoading(false);
            });
    }

    async function UserAuth(userD: any) {
        const citiesRef = collection(db, "users");
        const q = query(citiesRef, where("email", "==", userD.email));
        const querySnapshot = await getDocs(q);
        const newCityRef = doc(collection(db, "users"));
        let data = {
            email: userD.email,
            name: userD.displayName,
            image: userD.photoURL
        } as any;
        if (querySnapshot.size == 0) {
            await setDoc(newCityRef, data);
            data.id = newCityRef.id;
        } else {
            data.id = querySnapshot.docs[0].id;
            data.name = querySnapshot.docs[0].data().name;
        }
        const res = await axios.post('/api/login', data).then((res: any) => res.data).catch((error: any) => error);
        if (res.ok === 200) {
            Router.push('/')
        }
        else {
            alert("Auth failed")
            SetLoading(false);
        }
    }
    useEffect(() => {
        const { pathname } = Router
        if (pathname == '/auth' && user) {
            Router.push('/')
        }
    });
    if (user) return null
    if (loading) return <div className={styles.loading}>Loading...</div>;
    return (
        <>

            <div className={styles.main}>
                <ul>
                    <li><h2>{`Chat Web App`}</h2></li>
                    <li>{`- Made with Firebase Authentication, Firebase Database, Nodejs, and Nextjs.`}</li>
                    <li>{`- Send and Recieve messages from and to any user.`}</li>
                    <li>{`- Edit and Delete any message you want in real-time.`}</li>
                    <li>{`- Just login then search for the user you wana message.`}</li>
                    {/* <li>{`- This is a public free-to-use chat app, so you can use in your own projects.`}</li> */}
                    <li>{`- Easy and Simple!!!`}</li>
                </ul>
                <div className={styles.panels}>
                    <input type="button" onClick={() => { SetSignin(true); SetError(``) }} value={`Signin`} className={signin ? styles.selectedPanel : ''} />
                    <input type="button" onClick={() => { SetSignin(false); SetError(``) }} value={`Signup`} className={!signin ? styles.selectedPanel : ''} />
                </div>
                <div className={styles.inputs}>
                    {error !== '' && <div className={styles.error}>{error}</div>}
                    <input type="email" placeholder={`My Email...`} ref={emailRef} />
                    {!signin && <input type="text" placeholder={`My Name...`} ref={nameRef} />}
                    <input type="password" placeholder={`My Password...`} ref={passwordRef} />

                    <input type="submit" onClick={() => {
                        signin ? SigninPasswordAuth(emailRef.current?.value, passwordRef.current?.value) :
                            CreatePasswordAuth(emailRef.current?.value, passwordRef.current?.value, nameRef.current?.value)
                    }} value={signin ? `Login` : `Register`} />
                </div>
                <div className={styles.socials}>
                    <input type="button" onClick={() => GoogleSignin()} value={`Google`} />
                </div>
            </div>

        </>
    )
}

export default SignIn


export const getServerSideProps = withIronSessionSsr(
    async function getServerSideProps({ req }) {
        const sess = req.session;
        if (sess && Object.keys(sess).length === 0 && Object.getPrototypeOf(sess) === Object.prototype)
            return {
                props: {}
            }
        else
            return {
                props: {
                    user: (req.session as any).user
                },
            };
    },
    {
        cookieName: "myapp_cookiename",
        password: "complex_password_at_least_32_characters_long",
        // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
        cookieOptions: {
            secure: process.env.NODE_ENV === "production",
        },
    },
);