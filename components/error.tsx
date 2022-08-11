export default function Error() {
    return (
        <input className={`${"ErrorLog"}`} id="ErrorLog" value="Error" type="button" onClick={() => HideError()}/>
    )
}
export const ShowError = (text)=>{
    let errorElement = document.getElementById("ErrorLog");
    errorElement.style.display = "block";
    (errorElement as HTMLInputElement).value = text;
  }
 export function HideError(){
    let errorElement = document.getElementById("ErrorLog");
    errorElement.style.display = "none"
  }
