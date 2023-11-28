$(document).ready(async function() {
  var userstock_holding = [];
  datepicker();
  await RRCookiecheck();
  await bankmoneyseter();
  await stock_holdingseter();
  var logincheck = setInterval(RRCookiecheck, 1000);
  var chartDom = document.getElementById('piechart');
  var myChart = echarts.init(chartDom);
  var option;  
  stock_holdingseter().then(userstock_holding => {
    console.log(userstock_holding);
  // 计算数据总和
var total = userstock_holding.reduce((acc, cur) => acc + cur.value, 0);

          option = {
            title: {
              left: 'center'
            },
            tooltip: {
              trigger: 'item',
              formatter: '{b} ({d}%)'
            },
            legend: {
              orient: 'vertical',
              left: 'left',
              data: userstock_holding.name,
              formatter: function (name) {
                var value = userstock_holding.find(item => item.name === name).value;
                var percentage = ((value / total) * 100).toFixed(2);
                return name + ' (' + percentage + '%)';
              }
            },
            series: [
              {
                name: 'Access From',
                type: 'pie',
                radius: '50%',
                center: ['38%', '50%'],
                data: userstock_holding,
                label: {
                  show: true,
                  position: 'inside',
                  formatter: '{d}%' 
                },
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                  }
                }
              }
            ]
          };

          option && myChart.setOption(option);
        });
});

document.addEventListener('DOMContentLoaded', function() {
    const tradeTypeOptions = document.querySelectorAll('.trade-type-option');
    const quantityInput = document.getElementById('quantity');

    tradeTypeOptions.forEach(function(option) {
      const dot = option.querySelector('.trade-type-dot');
      const link = option.querySelector('a');

      function setActive() {
        tradeTypeOptions.forEach(function(option) {
          option.querySelector('.trade-type-dot').classList.remove('active');
        });

        dot.classList.add('active');

        // 当选择 "平倉" 时禁用股数输入
        if (dot.dataset.value === 'drop') {
          quantityInput.disabled = true;
        } else {
          quantityInput.disabled = false;
        }
      }

      dot.addEventListener('click', setActive);
      link.addEventListener('click', function(e) {
        e.preventDefault();
        setActive();
      });
    });
});

// 计算数据总和
var total = 0;
var buysell='';
var whichsell='';

function checkCookie() { 
  var token=(getCookie('persontoken'));
  token=token.substr(12);
  let data = {"token": token,};
  fetch('http://localhost:3000/stock_simulator/api/Logincheck', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
    "Content-Type": "application/json;charset=utf-8"
    },
  })
  .then(response => response.json())//將api回傳內容轉乘json
  .then(newdata => {
    if(newdata.message!='correct'){
      window.location.href = '/404.html';
    }
  })
}

function RRCookiecheck() { 
  var test=(getCookie('persontoken'));
  if(test==""){
  window.location.href = '/404.html';
  }
  else{
    checkCookie();
  }
}

function cookiedeleter() {
  document.cookie = "persontoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function getCookie(cname) {
  let decodedCookie = decodeURIComponent(document.cookie);
  return decodedCookie;
}

function queryStock() {
  userdatepicker()
  .then(userdate => {
    var stockCodeinput = document.getElementById('stockCode');
    if(stockCodeinput.value!=""){
      let data = {
        "share": stockCodeinput.value,
        "firstdate": userdate,
        "seconddate": userdate,
        "buysellsel": true};
      fetch('http://localhost:3000/stock_simulator/api/sharepicker', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
        "Content-Type": "application/json;charset=utf-8"
        },
      })
      .then(response => response.json())//將api回傳內容轉乘json
      .then(newdata => {
        if(newdata.message=='correct'){
          document.getElementById("stockPrice").innerHTML="$"+newdata.price;
          document.getElementById("stockname").innerHTML="|"+newdata.name;
          document.getElementById("stock_Price").value=newdata.price;
          calculateTotalPrice();
          if(whichsell=="2"){
            sellAll()
          }
        }
        else{
          alert("找不到相符合")
          stockCodeinput.value=""
        }
      })
    }
    else{
      alert("請輸入股票代碼")
    }
  }); 
}

function calculateTotalPrice() {
    var quantityInput = document.getElementById('quantity');
    var totalPriceInput = document.getElementById('totalPrice');
    var stockPriceElement = document.getElementById('stockPrice');
    var stockPrice = parseFloat(stockPriceElement.textContent.replace('$', ''));
    var quantity = parseFloat(quantityInput.value);
    var tradeTypeOptions = document.querySelector('.trade-type-options');
    var totalPrice = stockPrice * quantity;
    console.log(totalPrice);
    totalPriceInput.value = totalPrice.toFixed(2);
    total=totalPriceInput.value;
  }
function bankmoneyseter() {
  userdatepicker()
  .then(userdate => { 
    var token=(getCookie('persontoken'));
    token=token.substr(12);
      let data = {
        "token": token,
        "sys_time": userdate,
      };
    fetch('http://localhost:3000/stock_simulator/api/Bank', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
      "Content-Type": "application/json;charset=utf-8"
      },
    })
    .then(response => response.json())//將api回傳內容轉乘json
    .then(newdata => {
      if(newdata.message=='correct'){
        var usertotalmoney = Number(newdata.total_money).toLocaleString();
        var usermoney = Number(newdata.money).toLocaleString();
        var entrustmoney =  Number(newdata.total_money-newdata.money).toLocaleString();
        document.getElementById("cash").innerHTML="$"+usermoney;
        document.getElementById("totalcash").innerHTML="$"+usertotalmoney;
        document.getElementById("entrustcash").innerHTML="$"+entrustmoney;
      }
    });
  });
}
function stock_holdingseter() {
    return new Promise((resolve, reject) => {
      userdatepicker()
      .then(userdate => {
        var token = getCookie('persontoken');
        token = token.substr(12);
        let data = {
          "token": token,
          "sys_time": userdate,
        };

        fetch('http://localhost:3000/stock_simulator/api/stock_holding_picker', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json;charset=utf-8"
          },
        })
          .then(response => response.json())
          .then(newdata => {
            if (newdata.message == 'correct') {
              resolve(newdata.moneyarray);
            } else {
              reject(new Error('API returned an error'));
            }
          });
      });
    });
}

function sender() {
  userdatepicker()
  .then(userdate => { 
    if(buysell==''){
      alert("請選擇交易方式")
    }
    else if(document.getElementById('stock_Price').value==""){
      alert("資料請填寫完整")
    }
    else if(document.getElementById('totalPrice').value==""){
      alert("資料請填寫完整")
    }
    else{
      var quantityInput = document.getElementById('quantity');
      var quantity = parseFloat(quantityInput.value);
      var stockCodeinput = document.getElementById('stockCode');
      var token=(getCookie('persontoken'));
      token=token.substr(12);
      let data = {
        "token": token,
        "buysell": buysell,
        "quantity": quantity,
        "stock_id": stockCodeinput.value,
        "sys_time": userdate,
        "total": total};
      fetch('http://localhost:3000/stock_simulator/api/autotrade', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
        "Content-Type": "application/json;charset=utf-8"
        },
      })
      .then(response => response.json())
      .then(newdata => { 
        console.log(newdata.message)
        if (newdata.message == '本網頁為金融新手作用不支持做空') {
          alert(newdata.message);
        }
        else if (newdata.message == '你没有这个股票') {
          alert(newdata.message);
        }
        window.location.href = '/trade.html';
      })
      window.location.href = '/trade.html';
    }
  });
}

function selbuy(num){
if (num==1){buysell='0';console.log(buysell)}
else if(num==2){buysell='1';console.log(buysell)}
else{
  buysell='1';
  whichsell='2';
  console.log(buysell)
  if(document.getElementById('stock_Price').value!=""){
    sellAll();
  }
} 
}

function getDayOfWeek(date) {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayIndex = date.getDay();
  return daysOfWeek[dayIndex];
}

function sellAll(){
  var stockCodeinput = document.getElementById('stockCode');
  var token=(getCookie('persontoken'));
  token=token.substr(12);
  let data = {
    "token": token,
    "stock_id": stockCodeinput.value};
    fetch('http://localhost:3000/stock_simulator/api/Coverq', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
      "Content-Type": "application/json;charset=utf-8"
      },
    })
      .then(response => response.json())
      .then(newdata => { 
        if (newdata.message == 'nothing') {
          alert("你没有这个股票");
          window.location.href = '/trade.html';
        }
        else{
        document.getElementById('quantity').value=newdata.quantity;
        console.log(newdata.quantity)
        calculateTotalPrice();
        }

      })
}

function userlastdatecheck() {
  return new Promise((resolve, reject) => {
    var token = getCookie('persontoken');
    token = token.substr(12);
    let data = { "token": token };

    fetch('http://localhost:3000/stock_simulator/api/lastdatecheck', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
    })
      .then(response => response.json())
      .then(newdata => {
        if (newdata.message == 'correct') {
          resolve(newdata.last_time);
        } else {
          reject(new Error('API returned an error'));
        }
      });
  });
}

function datepicker() {

  var selectedDate = null;    
  userlastdatecheck()
  .then(last => { 
  console.log(last);
  userdatepicker()
  .then(date => {
  console.log(date) 
    $('#selected-date').text(date);
    var calendarIcon = $('#calendar-icon');
    selectedDate=date;
    console.log(selectedDate) 
    calendarIcon.datepicker({
      format: 'yyyy-mm-dd',
      autoclose: true,
      position: 'bottom left',
      startDate: last
    }).datepicker('setDate', selectedDate);

    calendarIcon.on('changeDate', function(date) {
    selectedDate = date.format();
    const currentDate = new Date(selectedDate);
    const dayOfWeek = getDayOfWeek(currentDate);
    if(dayOfWeek=="Mon"||dayOfWeek=="Tue"||dayOfWeek=="Wed"||dayOfWeek=="Thu"||dayOfWeek=="Fri"){
      $('#selected-date').text(selectedDate);
      console.log(selectedDate);
      var token = getCookie('persontoken');
      token = token.substr(12);
      let data = { "token": token , "selectedDate": selectedDate  };
      fetch('http://localhost:3000/stock_simulator/api/datechanger', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json;charset=utf-8"
        },
      })
        .then(response => response.json())
        .then(newdata => {
          if (newdata.message == 'correct') {
            window.location.href = '/index.html';
          }
        });
    }
    else{
      alert("假日休市請勿選擇")
      window.location.href = '/index.html';
    }
    }); 
  });
  });
}

function userdatepicker() {
  return new Promise((resolve, reject) => {
    var token = getCookie('persontoken');
    token = token.substr(12);
    let data = { "token": token };

    fetch('http://localhost:3000/stock_simulator/api/datepicker', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
    })
      .then(response => response.json())
      .then(newdata => {
        if (newdata.message == 'correct') {
          resolve(newdata.date);
        } else {
          reject(new Error('API returned an error'));
        }
      });
  });
}