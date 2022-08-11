import { useRef, useState } from 'react'
import moment from "moment";
import styles from '../styles/Chat.module.css'

const MessageForm = ({socket ,id,myName,myCode,myPicToken,myPicType, msgWriterName,msgWriterCode ,talkingWithPicToken, talkingWithPicType, text, date, textEdited, status, view,tempMedia , mediaFiles , mediaFolder , showUser , flag} : any)=> {

    let [myMsg,SetMyMSg] = useState( myName === msgWriterName && myCode === msgWriterCode);
    let [token , SetPicToken] = useState(myMsg ? myPicToken : talkingWithPicToken)
    let [prof , SetPicType] = useState(myMsg ? myPicType : talkingWithPicType)
    let EditedText : any = useRef(null);
    let [textBeingEdited, SetTextBeingEdited] = useState(false);
    mediaFiles = mediaFiles ? mediaFiles.toString().split(",") : null
    return (
        <div className={`${styles.msgContainer}`}>
            <div className={`${styles.msgUserInfo}`}>
                {
                    showUser ?  <div className={`secondLayer ${styles.msgUserImage}`} style={{ backgroundImage:  prof ? `url(${"/MediaFiles/ProfilePic/" + token + "/" + prof })` : 'none'}}></div> : null
                }   
                {
                    !showUser? <div className={`hyphen ${styles.shortTime}`}>{moment(date).format('hh:mm')}</div> : null
                }
                
            </div>
             <div className={`${styles.textDiv}`}>
                {
                    showUser ? <div className={`${styles.msgUserName} ${myMsg ? '' : styles.friendNameMsg}`} >
                       <p onClick={()=> {
                           window.history.pushState({}, document.title, `/?user=${msgWriterName}&code=${msgWriterCode}`);
                           socket.emit('OpenWindow',{
                               window : 'Profile'
                            })
                        }}>{msgWriterName}</p>
                        <span className='hyphen'>#
                        {msgWriterCode && msgWriterCode.toString().length == 1 ? "000" : ""}
                        {msgWriterCode && msgWriterCode.toString().length == 2 ? "00" : ""}
                        {msgWriterCode && msgWriterCode.toString().length == 3 ? "0" : ""}
                        {msgWriterCode}
                        </span>
                        <div className={`hyphen ${styles.longTime}`}>
                            {
                                moment(date).format('hh:mm A')
                            }
                            </div>
                   </div> :null
                }
                {flag == 'active' ?              
                 <>
                    {
                        mediaFiles || mediaFolder || tempMedia ? <>
                     <div className={`${styles.msgMediaHolder}`}>
                    {
                    mediaFiles && mediaFiles.length > 0 && mediaFolder && !tempMedia ? mediaFiles.map(( media : any,index : any) =>{
                        return <div key={index}  className={`${styles.msgMediaResult}`}>
                           {
                                (media.endsWith(".png") || media.endsWith(".jpg") || media.endsWith(".jpeg")) ?
                                <img className={`secondLayer`} src={`/MediaFiles/ChatFiles/${token}/${mediaFolder}/${media}`} />
                                : (
                                  (media.endsWith(".mp4") || media.endsWith(".MP4") || media.endsWith(".mov")|| media.endsWith(".x-matroska")) ?
                                    <video className={`secondLayer`} controls>
                                      <source src={`/MediaFiles/ChatFiles/${token}/${mediaFolder}/${media}`} />
                                      Can't view video here
                                    </video> : null)
                           }
                            </div>
                        })
                    : null
                }
                {
                    !mediaFiles && mediaFolder && tempMedia && tempMedia.length > 0 ? tempMedia.map(( media : any,index : any) =>{
                        return  <div  key={index} className={`secondLayer ${styles.tempMediaDiv}`}>
                                <div  className={`${styles.tempMediaContainer}`}>
                                {
                                    media.itsImage ?
                                    <img src={media.src} />
                                    : 
                                    <video controls>
                                        <source src={media.src} />
                                        Can't view video here
                                    </video> 
                                }
                                </div>
                                <div className={`${styles.tempMediaInfo}`}>
                                   <div>{`Name: ${media.name}`}</div>
                                   <div>{`Size: ${media.size} MB`}</div>
                                    <div className={`${styles.statusInfo}`}>
                                        {
                                            !media.finished ? 
                                            <>
                                            <progress value={media.percentage} max={100} />
                                            <span className={`${styles.progressPercent}`} >{media.percentage}%</span>
                                            {
                                                media.retry ? 
                                                <span className={`bi bi-arrow-clockwise`}></span>
                                                :  <span className={`bi bi-x`}  onClick={media.cancel} ></span>
                                            }
                                            </>
                                            : `Waiting for other files to finish`
                                        }
                                    </div>
                                </div>
                                
                            </div>
                        })
                    : null
                }
                    </div>
                        </>: null
                    }
                    {
                        text ? <>
                        {
                            !textBeingEdited ? 
                            <div className={`${styles.msgText}`}>
                                <span>{text}
                                {
                                    textEdited === "edited" ?  <span className={`hyphen ${styles.edited}`}>{`(edited)`}</span> : null
                                }
                                </span>
                            </div> : 
                            <textarea rows={4} className={`secondLayer InputField ${styles.textAreaEdit}`} defaultValue={text} ref={EditedText}></textarea>
                        }
                        </> : null
                    }

                   {
                       myMsg?<div className={`${styles.checkMark} bi ${view === 'seen' ? styles.msgSeen :''} 
                       ${status === 'recieved' ? 'bi-check2-all' : status === 'sent' ? 'bi-check2' : 'bi-clock'}`}></div>: null
                   } 
                
                <div className={`secondLayer ${styles.interactDiv}`}>
                    {
                        myMsg && !textBeingEdited ? <>
                        {
                            text ? <span className='borderColor bi bi-pencil-fill' onClick={()=>{
                                SetTextBeingEdited(true)
                            }}></span> : null
                        }
                            <span className='borderColor bi bi-trash3' onClick={()=>{
                                    socket.emit('deleteMsg', {
                                        textID: id
                                    })
                            }}></span>
                        </> : null
                    }
                    {
                        myMsg && textBeingEdited ? <>
                            <span className='borderColor bi bi-backspace' onClick={() => { SetTextBeingEdited(false) }}></span>
                            <span className='borderColor bi bi-save' onClick={() => {
                                if(!EditedText.current) return;
                                let currentText = EditedText.current.value.trim();
                                if(currentText.length == 0) return;
                                SetTextBeingEdited(false)
                                socket.emit('editMsg', {
                                    textID: id,
                                    message: currentText
                                    });
                                }}></span>
                        </> : null
                    }
                    {
                        !myMsg && !textBeingEdited ? <>
                            <span className='bi bi-reply-fill' onClick={() => { }}></span>
                        </> : null
                    }
                </div>
                </>
           : <span className={`hyphen ${styles.deletedMsg}`}>{`Message has been deleted`}</span>}
            </div>
     

        </div>
    )
  }
  
  export default MessageForm;