import * as types from '../types'
const initalState={
    socket : null,
    loading : false,
    error: null
}
export const socketReducer = (state = initalState, action : any) =>{
    switch(action.type){
        case types.Get_Socket:
            return {
                ...state,
                socket : action.payload,
                loading : false,
                error:null
            }
        default:
            return state
    }
}