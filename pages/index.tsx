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

const db = getFirestore(app);

const Home: NextPage = ({user} : any) => {

  const defaultImg = `https://img.icons8.com/office/40/000000/test-account.png`;
  const [users,SetUsers] = useState([])
  const [usersDocs , SetUsersDocs] = useState<any>([])

  async function fetchUsers(){
    const citiesRef = collection(db, 'users');
    const citySnapshot = await getDocs(citiesRef);
    SetUsersDocs(citySnapshot.docs);
    searchFunc(citySnapshot.docs , '')
  }
  useEffect(()=>{
    if(usersDocs.length == 0){
      fetchUsers();
    }    
  },[usersDocs])
  async function Signout(){
    await axios.post('/api/logout').then((res : any) => Router.push('/auth') ).catch((error : any) => error );
  }

  async function searchFunc(docs : any , text : string){
    const cityList : any = docs.filter(function(doc : any) {
      let temp = doc.data();
      if(user.id === doc.id) return false;
      if(text.length != 0 && !temp.name.toLowerCase().includes(text)) return false;
      return true;
    }).map((doc : any) => { 
      let temp = doc.data();
      temp.id = doc.id;
      return temp;
     });
    SetUsers(cityList);
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
        <div className={styles.userDiv}>
          <div>
            <Image loader={() => user.image? user.image : defaultImg} src={user.image? user.image : defaultImg} alt="Picture of the user" className={styles.image} width={40} height={40} unoptimized/>
            <span>{user.name}</span>
          </div>
          <input type="button" value='Signout' className={styles.signout} onClick={() => Signout()}/>
        </div>
        <input type="text" placeholder='Search for users here...'  className={styles.search} onChange={(e) => { searchFunc(usersDocs ,e.target.value) }}/>
        <div className={styles.count}>
          {`Found ${users.length} user${users.length > 1 ? 's' : ''}`}
        </div>
        <ul className={styles.list}>
          {
            users && users.length > 0 ? users.map((friend : any , index  :any ) =>
              { const imgURL = friend.image? friend.image : defaultImg;
                if(user.id === friend.id) return;
                return <ListRow key={index} imgURL={imgURL} id={friend.id} name={friend.name} />
              }
            ) : 
            <div className={styles.loading}>Loading...</div>
          }
        </ul>
      </div>
    </>
  )
}

const ListRow = ({imgURL , id , name} : any)=> {
  return <li onClick={() => { window.location.href = "/chat?id="+ id }}> 
  <Image loader={() => imgURL} src={imgURL} alt="Picture of the user" className={styles.image} width={40} height={40} unoptimized/>
  <span>{name}</span>
  <span className="bi bi-arrow-right"></span>
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