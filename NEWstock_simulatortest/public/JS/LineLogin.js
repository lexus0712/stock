function sender(){
  const urlParams = new URLSearchParams(window.location.search);
  const value1 = urlParams.get('ID');
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
// .then(console.log(data))//印出傳給api的內容
  .then(response => response.json())//將api回傳內容轉乘json
  .then(newdata => {
    alert(newdata.message);//印出api回傳內容
    if(newdata.message=='account and password correct')
      {
        let date1 = {
          "ID": value1,
          "ac": newdata.ac,
        }
        update(date1);
      }
  })

};

function update(date){
    let data = {
    "ID": date.ID,
    "ac": date.ac,
  }
  console.log(data);
  // 发送POST请求
  fetch('http://localhost:3000/stock_simulator/api/Linelinker', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
    "Content-Type": "application/json;charset=utf-8"
    },
  })
// .then(console.log(data))//印出傳給api的內容
  .then(response => response.json())//將api回傳內容轉乘json
  .then(newdata => {
    if(newdata.message=='success')
      {
        console.log('success');
        //window.location.href = '/success.html';
      }
  })

}