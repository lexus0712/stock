function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function sender(){
  var acct = document.getElementById("acct").value
  var pwd = document.getElementById("pwd").value
  let data = {
    "acoount": acct,
    "password": pwd,
  }
  document.getElementById("pwd").value="";
  document.getElementById("acct").value="";

  // 发送POST请求
  fetch('http://localhost:3000/stock_simulator/api/Login', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
    "Content-Type": "application/json;charset=utf-8"
    },
  })
//  .then(console.log(data))//印出傳給api的內容
  .then(response => response.json())//將api回傳內容轉乘json
  .then(newdata => {
    alert(newdata.message);//印出api回傳內容
    if(newdata.message=='account and password correct')
      {
        setCookie('persontoken',newdata.token,1);
        window.location.href = '/index.html';
      }
  })

};