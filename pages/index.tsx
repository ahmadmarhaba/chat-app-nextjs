import type { NextPage } from 'next'
// import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {app} from './_app'
import { getFirestore, collection, getDocs, query } from 'firebase/firestore/lite';
import React , { useEffect, useState } from 'react';
import { withIronSessionSsr } from "iron-session/next";
import axios from 'axios';
import Router from 'next/router'
import { useDispatch, useSelector } from 'react-redux';
import { fetchSocket } from '../store/actions/socketAction';

const db = getFirestore(app);

const Home: NextPage = ({user} : any) => {

  // const dispatch : any = useDispatch();
  // dispatch(fetchUser(user))
  const defaultImg = `https://img.icons8.com/office/40/000000/test-account.png`;
  const [users,SetUsers] = useState([])
  async function getCities(db : any) {
    const citiesRef = collection(db, 'users');
    const citySnapshot = await getDocs(citiesRef);
    const cityList : any = citySnapshot.docs.map((doc : any) => { 
      let temp = doc.data();
      temp.id = doc.id;
      return temp;
     });
    SetUsers(cityList) ;
  }
  useEffect(()=>{
    users.length == 0 && getCities(db);
  },[users])
  async function Signout(){
    await axios.post('/api/logout').then((res : any) => Router.push('/auth') ).catch((error : any) => error );
  }

  useEffect(() => {
    const {pathname} = Router
    if(pathname == '/' && !user){
        Router.push('/auth')
    }
  });

  if(!user) return null;
  return (
    <>
      <div className={styles.main}>
        <div>
          <input type="button" value='Signout' className={styles.signout} onClick={() => Signout()}/>
        </div>
        <input type="text" placeholder='Search for users here...'  className={styles.search}/>
        <ul className={styles.list}>
          {
            users && users.length > 0 ? users.map((friend : any , index  :any ) =>
              { const imgURL = friend.image? friend.image : defaultImg;
                const sameUser = user.email === friend.email;
                return <ListRow key={index} imgURL={imgURL} sameUser={sameUser} id={friend.id} name={friend.name} />
              }
            ) : 
            <div className={styles.loading}>Loading...</div>
          }
        </ul>
      </div>
    </>
  )
}

const ListRow = ({imgURL , sameUser , id , name} : any)=> {
  return <li  className={sameUser ? styles.disabledButton : ``} onClick={() => { !sameUser ? window.location.href = "/chat?id="+ id : null }}> 
  <Image loader={() => imgURL} src={imgURL} alt="Picture of the user" className={styles.image} width={40} height={40} unoptimized/>
  <span>{name}</span>
  {!sameUser && <span className="bi bi-arrow-right"></span>}
</li> 
}
export default Home;


export const getServerSideProps = withIronSessionSsr(
  async function getServerSideProps({ req }) {
    const sess = req.session;
    if(sess && Object.keys(sess).length === 0 && Object.getPrototypeOf(sess) === Object.prototype)
      return {
        props: {}
      }
    else
      return {
        props: {
          user : (req.session as any).user
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