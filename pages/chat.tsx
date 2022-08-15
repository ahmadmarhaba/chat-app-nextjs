import { NextPage } from "next";
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from '../styles/Chat.module.css'
import { ShowError } from '../components/error'
import MessageForm from '../components/Message'
import { collection, doc, DocumentData, getDoc, getDocs, getFirestore, limit, orderBy, query, startAfter, where } from "firebase/firestore";
import { app } from "./_app";
import { fetchSocket } from "../store/actions/socketAction";
import Router from 'next/router'
import { withIronSessionSsr } from "iron-session/next";

const db = getFirestore(app);

const Chat: NextPage = ({user} : any) => {
    
    const dispatch : any = useDispatch();

    let { socket } = useSelector((state: any) => state.socket)

    let messageText : any = useRef(null)
    let [chatList , SetChatList] : any = useState([])
    let chatPrevListRef : any = useRef(chatList)
    let messagesEndRef  : any = useRef(null)
    // let mediaHolderRef = useRef(null)

    let [writtenMessagesCounter , SetWrittenMessagesCounter] = useState(0)
    let [mediaMessagesCounter , SetMediaMessagesCounter] = useState(0)

    let lastMsgFromUserIdRef = useRef(null)
    let [lastMsgFromUserId , SetLastMsgFromUserId] = useState(null)

    let [lastVisible , SetLastVisible] = useState<DocumentData>()

    // let mediaFileRef  : any = useRef(null);
    // let [mediaUploaded , SetMediaUploaded] = useState([])
    // let mediaUploadedRef : any = useRef(mediaUploaded)
    
    let [fetchMoreMsgs , SetFetchMoreMsgs]  = useState(false);

    const defaultPageGap = 30;
    let [chatPage , SetChatPage]  = useState(defaultPageGap);
    // const [inCall , SetInCall]  = useState<boolean>(WindowLoad.inCall);

    const [friendInfo , SetFriendInfo] = useState<friendInfo>();
    const friendInfoRef = useRef<friendInfo>();
    interface friendInfo{
        id: string;
        image : string;
        name : string;
        email: string;
    }
    const scrollToBottom = () => {
        setTimeout(()=>{ messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) },50) 
    }
    // useEffect(()=>{
    //     // socket.emit('showChatHistory',{
    //     //     page : 1,
    //     //     refresh : true
    //     // })
    //     SetInCall(WindowLoad.inCall);
    // },[WindowLoad.inCall])

    useEffect(()=>{
      if(!socket){ dispatch(fetchSocket()) }
    },[socket])
    useEffect(()=>{
        if(!friendInfo && user.id && socket){
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            const id = urlParams.get('id')
            if(id && id.length > 0){
                fetchDocument(id)
            }
        }
    },[friendInfo , user , socket])
    useEffect(()=>{
        if(user && friendInfo && friendInfo.id && socket){
            fetchMessages();
            socket.emit('msgsSeen',{friendId : friendInfo?.id ,userId: user.id})
        }
    },[friendInfo])
    async function fetchDocument(id : string){
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            let data : any = docSnap.data();
            data.id = docRef.id;
            SetFriendInfo(data as friendInfo);
            friendInfoRef.current = data;
            socket.emit('joinRoom' , {friendId : docRef.id ,userId: user.id})
        } else {
            console.log("No such user!");
        }
    } 
    async function queryMessages(fromId : any , toId : any) {
        const citiesRef = collection(db, "messages");
        const q = lastVisible ? query(citiesRef, 
            where("FromUser_ID", "==", fromId), 
            where("ToUser_ID", "==", toId), 
            orderBy("Text_Date", "desc"),
            startAfter(lastVisible),
            limit(chatPage)
        ): query(citiesRef, 
            where("FromUser_ID", "==", fromId), 
            where("ToUser_ID", "==", toId), 
            orderBy("Text_Date", "desc"),
            limit(chatPage)
        );
        return await getDocs(q);
    }
    function docMessages(querySnapshot : any){
        const cityList : any = querySnapshot.map((doc : any) => { 
            let temp = doc.data();
            temp.Text_ID = doc.id;
            temp.User_Id = temp.FromUser_ID;
            temp.User_Name = temp.FromUser_ID == user.id ? user.name : friendInfo?.name;
            temp.User_Image = temp.FromUser_ID == user.id ? user.image : friendInfo?.image;
            return temp;
        });
        return cityList;
    }
    async function fetchMessages(){
        const doc1 = await queryMessages(user.id , friendInfo?.id);
        const doc2 = await queryMessages(friendInfo?.id, user.id)
        
        const doc = [...doc1.docs , ...doc2.docs];
        let messages = docMessages(doc);
        if(!messages || messages.length == 0) return;

        messages.sort((a : any, b : any) => {
            return a.Text_Date - b.Text_Date;
        });
        messages = messages.slice(Math.max(messages.length - defaultPageGap, 0));
        let message : any = doc.find((msg : any) => msg.id == messages[0].Text_ID);
        SetLastVisible(message);
        
        SetChatPage(chatPage + defaultPageGap);
        // if(data.refresh){
            //     chatPrevListRef.current = []
        //     SetChatList([])
        // }

        let userId : string;
        messages.forEach((msg : any) => {
            msg.showUser = true
            if(userId === msg.User_Id) 
                msg.showUser = false
            else{
                userId = msg.User_Id
            }
        });
        messages.reverse();
        // cityList.forEach((msg  : any, index : number) => {
        //     if(data.unSeenMsgsCount != null && data.unSeenMsgsCount > -1 && data.unSeenMsgsCount  === index)
        //         msg.newMessages = data.unSeenMsgsCount;
        // });

        chatPrevListRef.current = chatPrevListRef.current ? [...chatPrevListRef.current].concat(messages) : messages
        SetChatList(chatPrevListRef.current)
        SetFetchMoreMsgs(true);
    }
    useEffect(()=>{
        if(!socket) return;
        // socket.on('SetCallFromChat',(data)=>{
        //     SetInCall(data.inCall);
        // })

        // socket.on('refreshChat',()=>{
        //     chatPrevListRef.current = []
        //     SetChatList(chatPrevListRef.current)
        //     socket.emit('showChatHistory',{
        //         page : 1,
        //         refresh : true
        //     })
        // })
        // socket.on('showChatHistory', function(data : any) {
        //     if(!data ) return;
           
        // })
        socket.on('sendMessage', function(data : any) {
            if (data.myself) {
                if(!data.textID || isNaN(data.oldID)) return;
                let old_ID = data.isMedia ? "oldMedia_"+ data.oldID : "oldText_"+ data.oldID
                let message : any = [...chatPrevListRef.current].find((msg : any) => msg.Old_ID == old_ID)
                const index = [...chatPrevListRef.current].indexOf(message)
                if(!message)return;
                message.Text_ID = data.textID;
                message.Text_Status = "sent"
                if(data.isMedia){
                    message.Text_MediaFolder = data.folderName;
                    message.Text_MediaFiles = data.tempFiles;
                    message.Text_TempMedia = null;
                }
                SetChatList((oldArray  : any) => {
                    let newArr = [
                        ...oldArray.slice(0, index),
                        message,
                        ...oldArray.slice(index + 1),
                    ];
                    chatPrevListRef.current = newArr
                    return newArr;
                })
            } else {
                if(!data.message 
                    // && !data.folderName && !data.tempFiles
                    ) return;
                if(!data.textID|| !data.userId 
                    // || !data.unSeenMsgsCount
                    ) return;
                // if(data.userId !== user.Id) return;

                let showUser = true;
                if(data.userId === lastMsgFromUserIdRef.current)
                    showUser = false; 
                else{
                    lastMsgFromUserIdRef.current = (data.userId);
                }
                SetLastMsgFromUserId(null);
                CreateMessageHolder(null , data.textID,data.message, null  , data.folderName , data.tempFiles ,friendInfoRef.current?.image,friendInfoRef.current?.id , friendInfoRef.current?.name, showUser)

                socket.emit('msgsSeen',{friendId : friendInfoRef.current?.id ,userId: user.id})
            }
          })
          socket.on('msgsRecieved', function(data : any) {
            if(!chatPrevListRef.current) return;
            let arrlist : any = [...chatPrevListRef.current];
            arrlist.forEach((element : any) => {
                element.Text_Status = 'recieved'
            });
            chatPrevListRef.current = arrlist;
            SetChatList(arrlist)
        })
        socket.on('msgsSeen', function(data : any) {
            if(!chatPrevListRef.current) return;
            let arrlist : any = [...chatPrevListRef.current];
            arrlist.forEach((element : any) => {
                element.Text_View = 'seen'
            });
            chatPrevListRef.current = arrlist;
            SetChatList(arrlist)
          });
        socket.on('deleteMsg', function(data : any) {
            let message : any = [...chatPrevListRef.current].find(msg => msg.Text_ID == data.textID)

            const index = [...chatPrevListRef.current].indexOf(message)
            if(!message)return;
            message.Text_Message = 'Message has been deleted';
            message.Text_Flag ='inactive'
            SetChatList((oldArray : any) => {
                let newArr = [
                    ...oldArray.slice(0, index),
                    message,
                    ...oldArray.slice(index + 1),
                ];
                chatPrevListRef.current = newArr
                return newArr;
            })
          });
          socket.on('editMsg', function(data : any) {
            console.log(data)
            let message = [...chatPrevListRef.current].find(msg => msg.Text_ID == data.textID)
            const index = [...chatPrevListRef.current].indexOf(message)
            if(!message)return;
            message.Text_Message =data.message
            message.Text_Edit ='edited'
            SetChatList((oldArray : any) => {
                let newArr = [
                    ...oldArray.slice(0, index),
                    message,
                    ...oldArray.slice(index + 1),
                ];
                chatPrevListRef.current = newArr
                return newArr;
            })
          })
    },[socket])

    function CreateMessageHolder(oldId : any , newId : any,text  : any, Text_TempMedia : any , Text_MediaFolder : any ,Text_MediaFiles : any , image : any, userId : any ,name : any ,showUser : any){

        let newArr = {Old_ID: oldId, Text_ID: newId, User_Id:userId,User_Name : name, User_Image : image, Text_Message:text,Text_Date:new Date(),Text_Edit:'original', Text_Status:"waiting",Text_View : "unSeen" , showUser , Text_TempMedia  , Text_MediaFiles , Text_MediaFolder , Text_Flag : 'active'}

        chatPrevListRef.current = chatPrevListRef.current ? [newArr].concat([...chatPrevListRef.current]) : [newArr];

        SetChatList(chatPrevListRef.current)
        
        scrollToBottom()
        SetMediaMessagesCounter(mediaMessagesCounter + 1)
        SetWrittenMessagesCounter(writtenMessagesCounter + 1)

        // if(Text_TempMedia) {
        //     let sendMedia = []
        //     Text_TempMedia.forEach(async (files : any , index : any) => {
        //        let tempIndex = 0;
        //        const mediaMessageResult = await uploadMediaWithMessage(Text_MediaFolder , files.file , index , Text_TempMedia);

        //        if(!mediaMessageResult) {
        //         let message = [...chatPrevListRef.current].find(msg => msg.Old_ID == "oldMedia_"+ mediaMessagesCounter)
        //         const messageIndex = [...chatPrevListRef.current].indexOf(message)
        //         if(!message) return;
        //             tempIndex = Text_TempMedia.indexOf(message.Text_TempMedia[index])
        //         if(tempIndex == -1) return;
        //             message.Text_TempMedia[tempIndex].retry = true;
        //         SetChatList((oldArray  : any)=> {
        //             let newArr = [
        //                 ...oldArray.slice(0, messageIndex),
        //                 message,
        //                 ...oldArray.slice(messageIndex + 1),
        //             ];
        //             chatPrevListRef.current = newArr
        //             return newArr;
        //         })
        //        }else{
        //            let message = [...chatPrevListRef.current].find(msg => msg.Old_ID == "oldMedia_"+ mediaMessagesCounter)
        //            const messageIndex = [...chatPrevListRef.current].indexOf(message)
        //            if(!message) return;
        //                tempIndex = Text_TempMedia.indexOf(message.Text_TempMedia[index])
        //            if(tempIndex == -1) return;
        //                message.Text_TempMedia[tempIndex].finished = true;
        //             SetChatList((oldArray : any) => {
        //                 let newArr = [
        //                     ...oldArray.slice(0, messageIndex),
        //                     message,
        //                     ...oldArray.slice(messageIndex + 1),
        //                 ];
        //                 chatPrevListRef.current = newArr
        //                 return newArr;
        //             })
        //        }
        //        sendMedia.push(mediaMessageResult);
        //        if(sendMedia.length == Text_TempMedia.length){
        //            socket.emit('sendMessage', {id : mediaMessagesCounter , folderName : Text_MediaFolder})
        //        }
        //     });
        // }
    }
    const handleInput = (e : any) =>{
        if(messageText.current?.scrollHeight > 250) return;
        messageText.current.style.height = '';
        messageText.current.style.height = messageText.current.scrollHeight +'px';
    }
    const handleKeyDown = async (event : any) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            
            let showUser = true;
            let mediaAndText = false;

            if(user.Id === lastMsgFromUserId)
                showUser = false; 
            else{
                SetLastMsgFromUserId(user.Id);
            }
            lastMsgFromUserIdRef.current = null;
            if(messageText.current?.value.trim().length != 0){
                if(mediaAndText) showUser = false
                let message = messageText.current.value.trim()
                CreateMessageHolder("oldText_"+writtenMessagesCounter,null, message,null, null , null  , user.image, user.id , user.name, showUser)
                socket.emit('sendMessage', { message, oldId : writtenMessagesCounter , userId: user.id  , friendId: friendInfo?.id})
                messageText.current.value = '';
                mediaAndText = true;
                messageText.current.style.height ='25px'
            }

            
            // if(mediaUploaded && mediaUploaded.length != 0){ 
            //     let files = [...mediaUploadedRef.current];
            //     mediaFileRef.current.value = "";
            //     mediaUploadedRef.current = [];
            //     SetMediaUploaded([]);
            //     const folderName = await axios.post('/CreateTempDirectory',{
            //         token : user.token,
            //         directoryType : 'ChatFiles'
            //       }).then(function (res : any) {
            //           if(res && res.data && res.data.ok && res.data.folderName)
            //             return res.data.folderName;
            //           else
            //             return false;
            //       }).catch(function (error : any) {
            //           if(error) 
            //           ShowError("CreateTempDirectory: Encountered error no temp directory created")
            //           return false;
            //       });
            //       if(folderName){
            //           CreateMessageHolder("oldMedia_"+mediaMessagesCounter,null , files, folderName , null ,user.name,user.code , user.prof, user.token , showUser)
            //       }
            // }
        }
      }

    //   const UploadMediaFile = async (e : any) => {
    //     const files = e.target.files
    //     for (let index = 0; index < files.length; index++) {
    //         if(files[index].size >= 10 * 1024 * 1024){
    //             e.target.value = "";
    //             ShowError("File size huge exceeds 10 MB");
    //             return;
    //           }
    //           if(!checkAcceptedExtensions(files[index])) {
    //             e.target.value = "";
    //             ShowError("File type must be jpeg/jpg/png/mp4/mp3/mov/avi/mkv");
    //             return;
    //           }
    //           let data = {
    //               id : index,
    //               file : files[index],
    //               src : URL.createObjectURL(files[index]) ,
    //               name : files[index].name ,
    //               size: (files[index].size / 1024).toFixed(2),
    //               itsImage : files[index].type.includes("image"),
    //               percentage : 0,
    //               finished : false,
    //               cancel : null,
    //               retry : false
    //             } as any
    //             URL.revokeObjectURL(files[index])  
    //             mediaUploadedRef.current = mediaUploadedRef.current ? [...mediaUploadedRef.current].concat([data]) : [data]
    //             SetMediaUploaded(mediaUploadedRef.current) 
    //         }
    //     messageText.current.focus();
    //     e.target.value = "";
    //   }
    //   async function uploadMediaWithMessage(folderName : any, file : any , indexArr  : any, arr : any ){
    //     const form = new FormData();
    //     let tempIndex = 0;
    //     form.append('files',file)
    //     let cancelTokenSource = axios.CancelToken.source();

    //     let message = [...chatPrevListRef.current].find(msg => msg.Old_ID == "oldMedia_"+ mediaMessagesCounter)
    //     const index = [...chatPrevListRef.current].indexOf(message)
    //     if(!message) return;
    //         tempIndex = arr.indexOf(message.Text_TempMedia[indexArr])
    //     if(tempIndex == -1) return;
    //         message.Text_TempMedia[tempIndex].cancel = () => { cancelTokenSource.cancel('Upload cancelled')};

    //     SetChatList((oldArray : any) => {
    //         let newArr = [
    //             ...oldArray.slice(0, index),
    //             message,
    //             ...oldArray.slice(index + 1),
    //         ];
    //         chatPrevListRef.current = newArr
    //         return newArr;
    //     })

    //     try {
    //       return await axios.request({
    //           method: "post", 
    //           url: '/upload?token='+user.token+"&folderName="+ folderName+'&directoryFolder=ChatFiles', 
    //           data: form,
    //           cancelToken: cancelTokenSource.token,
    //           onUploadProgress: (progress : any) => {
    //             let ratio = progress.loaded / progress.total
    //             let percentage = (ratio * 100).toFixed(2);
    //             let message = [...chatPrevListRef.current].find(msg => msg.Old_ID == "oldMedia_"+ mediaMessagesCounter)
    //             const index = [...chatPrevListRef.current].indexOf(message)
    //             if(!message) return;
    //                 tempIndex = arr.indexOf(message.Text_TempMedia[indexArr])
    //             if(tempIndex == -1) return;
    //                 message.Text_TempMedia[tempIndex].percentage = percentage

    //             SetChatList((oldArray  : any)=> {
    //                 let newArr = [
    //                     ...oldArray.slice(0, index),
    //                     message,
    //                     ...oldArray.slice(index + 1),
    //                 ];
    //                 chatPrevListRef.current = newArr
    //                 return newArr;
    //             })
    //           }
    //         }).then( (response : any) => {
    //           if(response.data.ok){
    //             return true
    //           }else{
    //             ShowError(response.data.error);
    //           }
    //             return false;
    //         }).catch((error : any) => {
    //             ShowError(error);
    //             return false;
    //         })
    //       } catch (err) {
    //         ShowError('Error uploading the files')
    //         return false;
    //       }
    //   }
      
        const handleScroll = (e : any) => {
            const bottom = e.target.scrollHeight + e.target.scrollTop  <= e.target.clientHeight + 250;
            if(bottom && fetchMoreMsgs){
                SetFetchMoreMsgs(false);
                user && friendInfo && friendInfo.id && fetchMessages();
            }
        } 
    useEffect(() => {
        const {pathname} = Router
        if(pathname == '/' && !user){
            Router.push('/auth')
        }
    });
    if(!friendInfo) return null;
    return (
        <>
        <div className={`${styles.MainDisplay} ${styles.chat} ${''
            // inCall ? styles.pushDown : ''
        }`}>
            {
                // !inCall ? 
                <div className={`${styles.friendNameChat}`}>
                    <div className={styles.backButton} onClick={() => { Router.push('/') }}>
                        <span className="bi bi-arrow-left"></span>
                        <div>Back</div>
                    </div>
                    <div className={`${styles.userName}`}>
                       {friendInfo.name}
                    </div>
                    {/* <div className={`${styles.utilities}`}>
                        <span className='secondLayer bi bi-telephone-fill' onClick={()=>{ 
                            socket.emit("validateCall", { name : WindowLoad.name, code : WindowLoad.code, group : WindowLoad.group,token : WindowLoad.token, prof : WindowLoad.prof , wall : WindowLoad.wall})
                        }}></span>
                    </div> */}
                </div>
                //  : null
            }
            
            
            <div className={`${styles.textHolder}`} onScroll={handleScroll}>
                <div ref={messagesEndRef}/>
                {
                    chatList && chatList.length > 0 ? chatList.map( (msg : any) =>{
                        return  <MessageForm key={msg.Text_ID ? msg.Text_ID : msg.Old_ID} socket={socket} id={msg.Text_ID} myId={user.id} myName={user.name} myImage={user.image} friendId={msg.User_Id} friendName={msg.User_Name} friendImage={msg.User_Image} text={msg.Text_Message} date={msg.Text_Date} flag={msg.Text_Flag} textEdited={msg.Text_Edit} status={msg.Text_Status} view={msg.Text_View}  tempMedia={msg.Text_TempMedia}  mediaFiles={msg.Text_MediaFiles} mediaFolder={msg.Text_MediaFolder} showUser={msg.showUser} talkingTo={friendInfo.id}/>
                            {/* {
                                msg.newMessages ? <div className={`${styles.newMessages}`}>{`(${msg.newMessages}) new message${msg.newMessages > 1 ? 's' : ''}`}</div> : null
                            } */}
                    })
                    :<div className={`${styles.unInteractiveLayer} ${styles.credentials}`}>{`Please dont share your information`}<br /> {` We will never ask for your credentials`}</div>
                }
            </div>
                {/* {mediaUploaded && mediaUploaded.length > 0 ?
                    <div className={`borderColor ${styles.mediaHolder}`} ref={mediaHolderRef}>
                    {
                      mediaUploaded.map((data : any , index)=>{  
                        let name = data.name;
                        let src = data.src;
                        let size = data.size;
                        size > 1024 ? size = (size/1024).toFixed(2) + " MB" : size += " KB"
                        name.length > 20 ? name = name.substring(0, 20) : null;
                        const removeMedia = () => { 
                            let media = [...mediaUploadedRef.current].find((med : any) => med.id == index)
                            const indexOf : any = media ? [...mediaUploadedRef.current].indexOf(media) : null;
                            if(!media)return;
                            SetMediaUploaded(oldArray => {
                                let newArr = [
                                    ...oldArray.slice(0, indexOf),
                                    ...oldArray.slice(indexOf + 1),
                                ];
                                mediaUploadedRef.current = newArr
                                return newArr;
                            })
                        };
                        return (
                          <div className={`secondLayer  ${styles.mediaDiv}`} key={`media_${index}_${ new Date().getTime()}`}>
                            <div className={`${styles.removeMediaDiv}`} onClick={removeMedia}>
                                <span className='bi bi-x'></span>
                            </div>
                            {
                                data.itsImage ? <img src={src}/> : 
                                <video controls>
                                    <source src={src}/> 
                                    Your browser does not support the video tag.
                                </video>
                            }
                          </div>
                        ) 
                      })}
                    </div> : nullw
                } */}
                <div className={`${styles.InputField} ${styles.inputHolder}`}>
                    <textarea placeholder={`Type here...`} ref={messageText}  onKeyDown={handleKeyDown} maxLength={300} onInput={handleInput}/>
                    {/* <div>
                        <label className={`bi bi-upload`} htmlFor="mediaFileInsertPost"></label>
                        <input type="file" id="mediaFileInsertPost" onChange={UploadMediaFile} style={{display:"none"}} ref={mediaFileRef} multiple/>
                    </div> */}
                </div>
        </div>
        </>
    )
}
export default Chat;
    
export function checkAcceptedExtensions (file : any) {
	const type = file.type.split('/').pop()
	const accepted = ['jpeg', 'jpg', 'png', 'mp4' , 'mp3' , 'mov' ,'avi' ,'mkv' , 'x-matroska']
	if (accepted.indexOf(type) == -1) {
		return false
	}
	return true
}


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