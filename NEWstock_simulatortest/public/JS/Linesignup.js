function signupsender(){
  var acct = document.getElementById("acct").value
  var email = document.getElementById("email").value
  var pwd = document.getElementById("pwd").value
  var confirm_pwd = document.getElementById("confirm_pwd").value
  var pwerror='';
  var emailerror='';
  const rules = /\S+@\S+/;
  if(confirm_pwd!=''&&pwd!=''&&acct!=''&&email!=''){
    if(confirm_pwd!=pwd){
      pwerror="兩次密碼不相符";
      document.getElementById("pwd").value="";
      document.getElementById("confirm_pwd").value="";
    }
    if(!rules.test(email)){
      emailerror="Email中須含@";
      document.getElementById("email").value="";
    }
    if(pwerror!=''||emailerror!=''){
      alert(pwerror+" "+emailerror);
    }
    else{
      acchecker(acct)//檢測帳號是否重複
      .then((result) => {
          if(result){
            signup(acct,email,pwd);
          }
          else{document.getElementById("acct").value="";};
          })
      .catch((error) => {
        console.log("发生错误:", error);
      });
    }
  }
  else{
      alert("欄位不得為空");  
  }
};
function jumper(){
  window.location.href = 'login.html';
};
function acchecker(acct){
  return new Promise((resolve, reject) => {
  var data = {"acoount": acct,};
    fetch('http://localhost:3000/stock_simulator/api/acchecker', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
      "Content-Type": "application/json;charset=utf-8"
      },
    })
    .then(response => response.json())//將api回傳內容轉乘json
    .then(newdata => {
      console.log(newdata.message);
      if(newdata.message=='acoount repeat'){
        alert("帳號已存在");
        resolve(false);
      }
      else{
        resolve(true);
      }
    });
  });
};
function signup(acct,email,pwd){
  var userdata = {
    "acoount": acct,
    "password": pwd,
    "email":email,
    "authority_id":"a01",
  }
  fetch('http://localhost:3000/stock_simulator/api/signup', {
    method: 'POST',
    body: JSON.stringify(userdata),
    headers: {
    "Content-Type": "application/json;charset=utf-8"
    },
  })
  .then(response => response.json())//將api回傳內容轉乘json
  .then(newdata => {
    console.log(newdata.message);
    if(newdata.message=='sys_time successfully created!!'){
      alert("註冊成功");
      window.location.href = 'LineLogin.html';
    }
    else{alert("註冊失敗");}
  });
};
