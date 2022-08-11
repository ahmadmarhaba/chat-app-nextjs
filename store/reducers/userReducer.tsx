import * as types from '../types'
const initalState={
    user : null,
    loading : false,
    error: null
}
export const userReducer = (state = initalState, action : any) =>{
    switch(action.type){
        case types.Get_User:
            return {
                ...state,
                user : action.payload,
                loading : false,
                error:null
            }
        default:
            return state
    }
}