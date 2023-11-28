//datepicker的script
$(document).ready(function() {
  var calendarIcon = $('#calendar-icon');

  calendarIcon.datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    position: 'bottom left'
  });

  calendarIcon.on('click', function() {
    var datepickerDropdown = $('.date-picker .datepicker-dropdown');
    datepickerDropdown.toggleClass('show');
  });

  // 添加日期選擇後的處理程序
  calendarIcon.on('changeDate', function(e) {
    var selectedDate = e.format();
    $('#selected-date').text(selectedDate);
  });
});

//end datepicker的script
//回測開始日期script

$(document).ready(function() {
  var calendarIcon = $('#backtest_start_calendar');

  calendarIcon.datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    position: 'bottom left',
    startDate: '2003-01-01' // 设置最低可选择日期
  });

  calendarIcon.on('click', function() {
    var datepickerDropdown = $('.date-picker .datepicker-dropdown');
    datepickerDropdown.toggleClass('show');
  });

  // 添加日期选择后的处理程序
  calendarIcon.on('changeDate', function(e) {
    var selectedDate = e.format();
    $('#backtest_start_date').text(selectedDate);
  });
});

//end回測開始日期script
//回測結束日期script

$(document).ready(function() {
  var startDateInput = $('#backtest_start_calendar');
  var endDateInput = $('#backtest_end_calendar');

  startDateInput.datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    position: 'bottom left'
  });

  endDateInput.datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    position: 'bottom left',
    startDate: '2003-01-01' // 设置最低可选择日期
  });

  startDateInput.on('changeDate', function(e) {
    var selectedStartDate = e.format();
    $('#backtest_start_date').text(selectedStartDate);

    // 设置结束日期选择器的最小日期为选择的开始日期
    endDateInput.datepicker('setStartDate', selectedStartDate);
  });

  endDateInput.on('changeDate', function(e) {
    var selectedEndDate = e.format();
    $('#backtest_end_date').text(selectedEndDate);

    // 在此添加验证，确保结束日期不小于开始日期
    var start = new Date(selectedStartDate);
    var end = new Date(selectedEndDate);

    if (end < start) {
      // 结束日期小于开始日期，您可以采取相应的措施，例如警告用户或阻止继续操作
      alert('结束日期不能早于开始日期');
      endDateInput.datepicker('setDate', selectedStartDate); // 可以重置结束日期为开始日期
    }
  });
});

//end回測結束日期script
//買進指標參數輸入框的script
$(document).ready(function() {
  // 定義指標選項對應的參數輸入框和自定義標籤名稱
  var indicatorParameters = {
    indicator1: [
      { label: 'ASTK 周期', name: 'astk_period', id: 'ASTK1' },
      { label: 'SlowK 周期', name: 'slowk_period', id: 'SlowK1' },
      { label: 'SlowD 周期', name: 'slowd_period', id: 'SlowD1' }
    ],
    indicator2: [
      { label: 'RSI 時間周期', name: 'timeperiod', id: 'RSI1' }
    ],
    indicator3: [
      { label: 'MA 時間週期', name: 'timeperiod', id: 'MA1' }
    ],
    indicator4: [
      { label: '短週期', name: 'short_period', id: 'Short1' },
      { label: '長週期', name: 'long_period', id: 'Long1' },
      { label: '平均移動週期', name: 'average_period', id: 'Average1' }
    ]
  };

  // 監聽指標選擇的改變事件
  $('#buyin_indicator').on('change', function() {
    var selectedIndicator = $(this).val();
    var parameters = indicatorParameters[selectedIndicator];

    // 清空原有參數輸入框和標籤
    $('.buyin_indicator-parameters').empty();

    // 根據指標選擇顯示對應的參數輸入框和標籤
    if (parameters && parameters.length > 0) {
      for (var i = 0; i < parameters.length; i++) {
        var parameterLabel = '<label for="' + parameters[i].name + '">' + parameters[i].label + '</label>';
        var parameterInput = '<input type="number" class="form-control" id="'+ parameters[i].id + '" name="' + parameters[i].name + '" placeholder="' + parameters[i].label + '">';
        $('.buyin_indicator-parameters').append(parameterLabel);
        $('.buyin_indicator-parameters').append(parameterInput);
      }
    }
  });
});
//end買進指標參數輸入框的script

//賣出指標參數輸入框的script
$(document).ready(function() {
  // 定義指標選項對應的參數輸入框和自定義標籤名稱
  var indicatorParameters = {
    indicator1: [
      { label: 'ASTK 周期', name: 'astk_period', id: 'ASTK1' },
      { label: 'SlowK 周期', name: 'slowk_period', id: 'SlowK1' },
      { label: 'SlowD 周期', name: 'slowd_period', id: 'SlowD1' }
    ],
    indicator2: [
      { label: 'RSI 時間周期', name: 'timeperiod', id: 'RSI1' }
    ],
    indicator3: [
      { label: 'MA 時間週期', name: 'timeperiod', id: 'MA1' }
    ],
    indicator4: [
      { label: '短週期', name: 'short_period', id: 'Short1' },
      { label: '長週期', name: 'long_period', id: 'Long1' },
      { label: '平均移動週期', name: 'average_period', id: 'Average1' }
    ]
  };

  // 監聽指標選擇的改變事件
  $('#buyout_indicator').on('change', function() {
    var selectedIndicator = $(this).val();
    var parameters = indicatorParameters[selectedIndicator];

    // 清空原有參數輸入框和標籤
    $('.buyout_indicator-parameters').empty();

    // 根據指標選擇顯示對應的參數輸入框和標籤
    if (parameters && parameters.length > 0) {
      for (var i = 0; i < parameters.length; i++) {
        var parameterLabel = '<label for="' + parameters[i].name + '">' + parameters[i].label + '</label>';
        var parameterInput = '<input type="number" class="form-control" id="'+ parameters[i].id + '" name="' + parameters[i].name + '" placeholder="' + parameters[i].label + '">';
        $('.buyout_indicator-parameters').append(parameterLabel);
        $('.buyout_indicator-parameters').append(parameterInput);
      }
    }
  });
});
//end賣出指標參數輸入框的script
    
//指标KD的规则数值监听
$(document).ready(function() {
    // 监听buyin指标选择的改变事件
    $('#buyin_indicator').on('change', function() {
        var selectedIndicator = $(this).val();

        // 检查指标选择是否为 KD
        if (selectedIndicator === 'indicator1') {
            // 添加数值范围限制
            $('#buyin_executionRuleInput').attr('min', '1');
            $('#buyin_executionRuleInput').attr('max', '100');
        } else {
            // 移除数值范围限制
            $('#buyin_executionRuleInput').removeAttr('min');
            $('#buyin_executionRuleInput').removeAttr('max');
        }
    });

    // 监听buyin规则输入框失去焦点的事件
    $('#buyin_executionRuleInput').on('blur', function() {
        var selectedIndicator = $('#buyin_indicator').val();
        var inputValue = parseInt($(this).val());

        // 检查指标选择是否为 KD，以及数值范围是否合法
        if (selectedIndicator === 'indicator1' && (isNaN(inputValue) || inputValue < 1 || inputValue > 100)) {
            // 提示用户输入不合法
            alert('请在KD规则设定数值中输入1到100的整数');
            // 清空输入框
            $(this).val('');
        }
    });

    // 监听buyout指标选择的改变事件
    $('#buyout_indicator').on('change', function() {
        var selectedIndicator = $(this).val();

        // 检查指标选择是否为 KD
        if (selectedIndicator === 'indicator1') {
            // 添加数值范围限制
            $('#buyout_executionRuleInput').attr('min', '1');
            $('#buyout_executionRuleInput').attr('max', '100');
        } else {
            // 移除数值范围限制
            $('#buyout_executionRuleInput').removeAttr('min');
            $('#buyout_executionRuleInput').removeAttr('max');
        }
    });

    // 监听buyout规则输入框失去焦点的事件
    $('#buyout_executionRuleInput').on('blur', function() {
        var selectedIndicator = $('#buyout_indicator').val();
        var inputValue = parseInt($(this).val());

        // 检查指标选择是否为 KD，以及数值范围是否合法
        if (selectedIndicator === 'indicator1' && (isNaN(inputValue) || inputValue < 1 || inputValue > 100)) {
            // 提示用户输入不合法
            alert('请在KD规则设定数值中输入1到100的整数');
            // 清空输入框
            $(this).val('');
        }
    });
});
  
//指标MA规则数值监听
$(document).ready(function() {
    // 监听buyin指标选择的改变事件
    $('#buyin_indicator').on('change', function() {
        var selectedIndicator = $(this).val();

        // 检查指标选择是否为 MA
        if (selectedIndicator === 'indicator3') {
            // 将规则输入框改为下拉菜单
            var ruleInput = $('#buyin_executionRuleInput');
            ruleInput.replaceWith('<select class="form-control" id="buyin_executionRuleInput"></select>');

            // 获取相应的规则选项
            var ruleOptions = getMARuleOptions();

            // 添加规则选项到下拉菜单
            var ruleSelect = $('#buyin_executionRuleInput');
            for (var i = 0; i < ruleOptions.length; i++) {
                ruleSelect.append('<option value="' + ruleOptions[i].value + '">' + ruleOptions[i].label + '</option>');
            }
        } else {
            // 如果不是 MA，则恢复为文本输入框
            var ruleInput = $('#buyin_executionRuleInput');
            ruleInput.replaceWith('<input type="text" class="form-control" id="buyin_executionRuleInput" placeholder="輸入设定数值">');
        }
    });

    // 监听buyout指标选择的改变事件
    $('#buyout_indicator').on('change', function() {
        var selectedIndicator = $(this).val();

        // 检查指标选择是否为 MA
        if (selectedIndicator === 'indicator3') {
            // 将规则输入框改为下拉菜单
            var ruleInput = $('#buyout_executionRuleInput');
            ruleInput.replaceWith('<select class="form-control" id="buyout_executionRuleInput"></select>');

            // 获取相应的规则选项
            var ruleOptions = getMARuleOptions();

            // 添加规则选项到下拉菜单
            var ruleSelect = $('#buyout_executionRuleInput');
            for (var i = 0; i < ruleOptions.length; i++) {
                ruleSelect.append('<option value="' + ruleOptions[i].value + '">' + ruleOptions[i].label + '</option>');
            }
        } else {
            // 如果不是 MA，则恢复为文本输入框
            var ruleInput = $('#buyout_executionRuleInput');
            ruleInput.replaceWith('<input type="text" class="form-control" id="buyout_executionRuleInput" placeholder="輸入设定数值">');
        }
    });

    // 获取 MA 规则选项的函数
    function getMARuleOptions() {
        return [
            { label: '1日均线（天）', value: 'ma1' },
            { label: '5日均线（周）', value: 'ma5' },
            { label: '10日均线（半月）', value: 'ma10' },
            { label: '20日均线（月）', value: 'ma20' },
            { label: '120日均线（半年）', value: 'ma120' },
            { label: '240日均线（年）', value: 'ma240' }
        ];
    }
});

//指标MACD规则数值监听
$(document).ready(function() {
    // 监听buyin指标选择的改变事件
    $('#buyin_indicator').on('change', function() {
        var selectedIndicator = $(this).val();
        var ruleInput = $('#buyin_executionRuleInput');

        // 检查指标选择是否为 MACD
        if (selectedIndicator === 'indicator4') {
            // 将规则输入框改为只读文本框
            ruleInput.prop('readonly', true);
            ruleInput.val('dif');
        } else {
            // 如果不是 MACD，则恢复为可输入文本框
            ruleInput.prop('readonly', false);
            ruleInput.val('');
        }
    });

    // 监听buyout指标选择的改变事件
    $('#buyout_indicator').on('change', function() {
        var selectedIndicator = $(this).val();
        var ruleInput = $('#buyout_executionRuleInput');

        // 检查指标选择是否为 MACD
        if (selectedIndicator === 'indicator4') {
            // 将规则输入框改为只读文本框
            ruleInput.prop('readonly', true);
            ruleInput.val('dif');
        } else {
            // 如果不是 MACD，则恢复为可输入文本框
            ruleInput.prop('readonly', false);
            ruleInput.val('');
        }
    });
});
//buyin的Tooltip
$(document).ready(function() {
    // 初始化 Tooltip
    var indicatorTooltip = new bootstrap.Tooltip(document.getElementById('indicatorTooltip'));

    // 监听指标选择的改变事件
    $('#buyin_indicator').on('change', function() {
        var selectedIndicator = $(this).val();
        
        // 根据不同的指标选择设置不同的介绍说明
        switch (selectedIndicator) {
            case 'indicator1':
                indicatorTooltip._element.dataset.bsOriginalTitle = '这是 KD 指标的介绍说明';
                break;
            case 'indicator2':
                indicatorTooltip._element.dataset.bsOriginalTitle = '这是 RSI 指标的介绍说明';
                break;
            case 'indicator3':
                indicatorTooltip._element.dataset.bsOriginalTitle = '这是 MA 指标的介绍说明';
                break;
            case 'indicator4':
                indicatorTooltip._element.dataset.bsOriginalTitle = '这是 MACD 指标的介绍说明';
                break;
            default:
                indicatorTooltip._element.dataset.bsOriginalTitle = '默认的介绍说明';
        }

        // 更新 Tooltip 的内容
        indicatorTooltip.update();
    });  
});
//buyout的 Tooltip
$(document).ready(function() {
    // 初始化 Tooltip
    var buyoutIndicatorTooltip = new bootstrap.Tooltip(document.getElementById('buyoutIndicatorTooltip'));

    // 监听指标选择的改变事件
    $('#buyout_indicator').on('change', function() {
        var selectedIndicator = $(this).val();
        
        // 根据不同的指标选择设置不同的介绍说明
        switch (selectedIndicator) {
            case 'indicator1':
                buyoutIndicatorTooltip._element.dataset.bsOriginalTitle = '这是 KD 指标的介绍说明';
                break;
            case 'indicator2':
                buyoutIndicatorTooltip._element.dataset.bsOriginalTitle = '这是 RSI 指标的介绍说明';
                break;
            case 'indicator3':
                buyoutIndicatorTooltip._element.dataset.bsOriginalTitle = '这是 MA 指标的介绍说明';
                break;
            case 'indicator4':
                buyoutIndicatorTooltip._element.dataset.bsOriginalTitle = '这是 MACD 指标的介绍说明';
                break;
            default:
                buyoutIndicatorTooltip._element.dataset.bsOriginalTitle = '默认的介绍说明';
        }

        // 更新 Tooltip 的内容
        buyoutIndicatorTooltip.update();
    });
});

$(document).ready(async function() {
  var themoney=0;
  await RRCookiecheck();
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

function queryStock() {
  var stockCodeinput = document.getElementById('executionStock');
    if(stockCodeinput.value!=""){
      let data = {
        "share_id": stockCodeinput.value
      };
      fetch('http://localhost:3000/stock_simulator/api/backet_sharepicker', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
        "Content-Type": "application/json;charset=utf-8"
        },
      })
      .then(response => response.json())//將api回傳內容轉乘json
      .then(newdata => {
        if(newdata.message=='correct'){
          document.getElementById("stockname").innerHTML=newdata.name;
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
}