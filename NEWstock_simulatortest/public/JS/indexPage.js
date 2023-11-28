$(document).ready(async function() {
  var themoney=0;
  await RRCookiecheck();
  await bankmoneyseter();
  await datepicker();
  await usermoneyperseter(1);
  // 使用Promise的then方法来等待stockTableseter函数完成，然后再进行表格初始化
  stockTableseter().then(function() {
    $('#stockTable').DataTable();
  });
  

  var logincheck = setInterval(RRCookiecheck, 1000);
});

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

function usermonthmoneyseter() {
  return new Promise(function(resolve) {
    userdatepicker()
    .then(userdate => { 
      var token=(getCookie('persontoken'));
      token=token.substr(12);
        let data = {
          "token": token,
          "sys_time": userdate,
          "roundtimes": 30,
        };
      fetch('http://localhost:3000/stock_simulator/api/user_moneypre_seter_recursive', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
        "Content-Type": "application/json;charset=utf-8"
        },
      })
      .then(response => response.json())//將api回傳內容轉乘json
      .then(newdata => {
        if (newdata.message == 'correct') {
          console.log(newdata.money)
          console.log(newdata.datetime)
          resolve({ money: newdata.money, datetime: newdata.datetime });
        } else {
          reject(new Error('API returned an error'));
        }
      })
      .catch(error => {
        // 处理错误，例如显示错误消息给用户
        console.error(error);
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  usermonthmoneyseter()
    .then(({ money, datetime }) => {
  new ApexCharts(document.querySelector("#reportsChart"), {
    series: [{
      name: '資產',
      data: money
    }],
    chart: {
      height: 350,
      type: 'area',
      toolbar: {
        show: false
      },
    },
    markers: {
      size: 4
    },
    colors: ['#4154f1', '#2eca6a', '#ff771d'],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.4,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      type: 'datetime',
      categories: datetime
    },
    yaxis: {
      tickAmount: 20,
      min: 0,
      max: 200000,
    },
    tooltip: {
      x: {
        format: 'dd/MM/yy HH:mm'
      },
    }
  }).render();
  });
});



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
        var moneyElement = $("<h6>");
        var usermoney = Number(newdata.total_money).toLocaleString();
        moneyElement.text("$"+usermoney);
        $("#bankmoney").append(moneyElement);
        themoney=newdata.total_money;
      }
    });
  });
}

function stockTableseter() {
  return new Promise(function(resolve) {
    userdatepicker()
    .then(userdate => {
      let data = {"date": userdate};
      fetch('http://localhost:3000/stock_simulator/api/shareseter', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json;charset=utf-8"
        },
      })
      .then(response => response.json())
      .then(newdata => {
        $("#stockseter").empty(); // 清空表格

        for(let i = 0; i < newdata.id.length; i++){
          var trElement = $("<tr>");
          var td_idElement = $("<td>");
          var td_nameElement = $("<td>");
          var td_openElement = $("<td>");
          var td_pElement = $("<td>");
          td_idElement.text(newdata.id[i]);
          td_nameElement.text(newdata.name[i]);
          td_openElement.text(newdata.open[i]);
          td_pElement.text(newdata.p[i]+'%');
          trElement.append(td_nameElement)
                   .append(td_idElement)
                   .append(td_openElement)
                   .append(td_pElement);
          $("#stockseter").append(trElement);
        }

        resolve(); // 解决Promise，在数据填充完成后进行DataTables初始化
      });
    });
  });
}


function getDayOfWeek(date) {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayIndex = date.getDay();
  return daysOfWeek[dayIndex];
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

function usermoneyperseter(days) {
  userdatepicker()
  .then(userdate => { 
    var token=(getCookie('persontoken'));
    token=token.substr(12);
      let data = {
        "token": token,
        "sys_time": userdate,
        "roundtimes": days,
      };
    fetch('http://localhost:3000/stock_simulator/api/user_moneypre_seter_recursive', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
      "Content-Type": "application/json;charset=utf-8"
      },
    })
    .then(response => response.json())//將api回傳內容轉乘json
    .then(newdata => {
      console.log(newdata)
      if(newdata.message=='correct'&&days==1){
        console.log(newdata.money[days-1])
        console.log(themoney)
        var usermoney = (newdata.money[days-1]/themoney)-1;
        $('#usermoneyper').text(usermoney.toFixed(4)+"%");
        $('#moneypretime').text("總資產浮動漲幅度(日)");
      }
      else if(newdata.message=='correct'&&days==7){
        console.log(newdata.money[days-1])
        console.log(themoney)
        var usermoney = (newdata.money[days-1]/themoney)-1;
        $('#usermoneyper').text(usermoney.toFixed(4)+"%");
        $('#moneypretime').text("總資產浮動漲幅度(禮拜)");
      }
      else if(newdata.message=='correct'&&days==30){
        console.log(newdata.money[days-1])
        console.log(themoney)
        var usermoney = (newdata.money[days-1]/themoney)-1;
        $('#usermoneyper').text(usermoney.toFixed(4)+"%");
        $('#moneypretime').text("總資產浮動漲幅度(月)");
      }
      else if(newdata.message=='correct'&&days==365){
        console.log(newdata.money[days-1])
        console.log(themoney)
        var usermoney = (newdata.money[days-1]/themoney)-1;
        $('#usermoneyper').text(usermoney.toFixed(4)+"%");
        $('#moneypretime').text("總資產浮動漲幅度(年)");
      }
    });
  });
}

function line() {
  $("#reportsChart2").load("http://localhost:3000/index.html #reportsChart");
  usermonthmoneyseter()
    .then(({ money, datetime }) => {
  new ApexCharts(document.querySelector("#reportsChart"), {
    series: [{
      name: '資產',
      data: money
    }],
    chart: {
      height: 350,
      type: 'area',
      toolbar: {
        show: false
      },
    },
    markers: {
      size: 4
    },
    colors: ['#4154f1', '#2eca6a', '#ff771d'],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.4,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      type: 'datetime',
      categories: datetime
    },
    yaxis: {
      tickAmount: 20,
      min: 0,
      max: 200000,
    },
    tooltip: {
      x: {
        format: 'dd/MM/yy HH:mm'
      },
    }
  }).render();
  });
}

function holderch() {
        var userstock_holding = [];
        stock_holdingseter();
        var chartDom = document.getElementById('reportsChart');
        var myChart = echarts.init(chartDom);
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


