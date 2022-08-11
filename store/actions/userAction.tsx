import * as types from '../types'
type User = {
    id: string,
    email: string,
    name: string,
    image: string,
}
export const fetchUser = (data : User) => async (dispatch : any) => {
    dispatch({
        type : types.Get_User,
        payload : data
    })
}