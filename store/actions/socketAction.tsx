import * as types from '../types'
import { io } from 'socket.io-client'
const ENDPOINT = "https://ahmadmarhaba-chat-app-nextjs.herokuapp.com";

export const fetchSocket = () => async (dispatch : any) => {
    dispatch({
        type : types.Get_Socket,
        payload : io(ENDPOINT)
    })
}