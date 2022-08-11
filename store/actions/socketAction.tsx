import * as types from '../types'
import { io } from 'socket.io-client'
const ENDPOINT = "http://localhost:3001";

export const fetchSocket = () => async (dispatch : any) => {
    dispatch({
        type : types.Get_Socket,
        payload : io(ENDPOINT)
    })
}