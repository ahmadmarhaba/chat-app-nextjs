import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { NextPage } from "next";
import { addDoc, collection, doc, getDocs, getFirestore, query, setDoc, where } from "firebase/firestore";
import { app } from './_app'
import axios from 'axios'
import Router from 'next/router'
import { useRef, useState } from "react";
import styles from '../styles/Auth.module.css'

  const SignIn: NextPage = () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const emailRef : any = useRef(null);
    const passwordRef : any = useRef(null);
    const nameRef : any = useRef(null);
    let [signin , SetSignin] = useState(true);
    let [loading , SetLoading] = useState(false);
    let [error , SetError] = useState('');
    
    function GoogleSignin(){
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
    function CreatePasswordAuth(email : string,password : string, name : string){
        if(email.length == 0 || password.length < 6 || name.length == 0){
            SetError(`Field empty or password less the 6 characters`);
            return;
        }
        SetLoading(true);
        SetError(``);
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            let user : any = userCredential.user;
            user.displayName = name;
            UserAuth(user)
        })
        .catch((error) => {
            console.error(error)
            SetError("Email aleady used");
            SetLoading(false);
        });
    }
    function SigninPasswordAuth(email : string,password : string){
        if(email.length == 0 || password.length < 6){
            SetError(`Field empty or password less the 6 characters`);
            return;
        }
        SetLoading(true);
        SetError(``);
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            let user = userCredential.user;
            UserAuth(user)
        })
        .catch((error) => {
            SetError("Email or Password wrong");
            console.error(error)
            SetLoading(false);
        });
    }

    async function UserAuth(userD : any){
        const citiesRef = collection(db, "users");
        const q = query(citiesRef, where("email", "==", userD.email));
        const querySnapshot = await getDocs(q);
        const newCityRef = doc(collection(db, "users"));
        let data = {
            email: userD.email,
            name: userD.displayName,
            image: userD.photoURL
        } as any;
        if(querySnapshot.size == 0){
            await setDoc(newCityRef, data);
            data.id = newCityRef.id;
        }else{
            data.id = querySnapshot.docs[0].id;
        }
        const res = await axios.post('/api/login',data).then((res : any) => res.data ).catch((error : any) => error );
        if(res.ok === 200){
            Router.push('/')
        }
        else{
            alert("Auth failed")
            SetLoading(false);
        }   
    }
    if(loading) return <div className={styles.loading}>Loading...</div>;
    return (
        <>

                <div className={styles.main}>
                    <div className={styles.panels}>
                        <input type="button" onClick={ () => { SetSignin(true); SetError(``) }} value={`Signin`} className={signin ? styles.selectedPanel : ''}/> 
                        <input type="button" onClick={ () => {SetSignin(false); SetError(``)}} value={`Signup`} className={!signin ? styles.selectedPanel : ''}/>
                    </div>
                    <div className={styles.inputs}>
                        {error !== '' && <div className={styles.error}>{error}</div>}
                        <input type="email" placeholder={`My Email...`} ref={emailRef} />
                        {!signin && <input type="text" placeholder={`My Name...`} ref={nameRef} />}
                        <input type="password" placeholder={`My Password...`} ref={passwordRef}/>

                        <input type="submit" onClick={ () => {
                            signin ? SigninPasswordAuth(emailRef.current?.value, passwordRef.current?.value) :
                            CreatePasswordAuth(emailRef.current?.value, passwordRef.current?.value , nameRef.current?.value )
                        }} value={signin ? `Login` : `Register`} />
                    </div>
                    <div className={styles.socials}>
                        <input type="button" onClick={ () => GoogleSignin()} value={`Google`} />
                    </div>
                </div>
            
        </>
    )
  }
  
  export default SignIn