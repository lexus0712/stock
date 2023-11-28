const express = require("express");
const bodyParser = require("body-parser");
const mysql = require('mysql');
const Sequelize = require('sequelize');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mime = require('mime');

const key = 'A9223480';
const algorithm = 'aes-256-cbc';//AES
const app = express();
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));
app.use('/CSS', express.static(__dirname + '/public/CSS', {
  setHeaders: (res, path, stat) => {
    res.set('Content-Type', 'text/css');
  }
}));
app.use('/JS', express.static(__dirname + '/public/JS', {
  setHeaders: (res, path, stat) => {
    res.set('Content-Type', 'text/javascript');
  }
}));
app.use('/img', express.static(__dirname + '/public/img'));

//連線
//database_name資料庫名稱
//username
//password 是資料庫的使用者名稱和密碼
//host 是資料庫伺服器的位置
//dialect 是資料庫的種類，例如 mysql、postgres 等。
const sequelize = new Sequelize(
  'stock',//database_name資料庫名稱
  'root',//username
  '1111',//password 是資料庫的使用者名稱和密碼
  {
    host: 'localhost',//host 是資料庫伺服器的位置
    dialect: 'mysql'//dialect 是資料庫的種類，例如 mysql、postgres 等。
  });

var usertoken = "";//一個存放token的地方
// 创建JWT
const createToken = (person) => {
  const payload = {
    acoount: person.acoount,
  };
  const options = { expiresIn: '10h' };
  const token = jwt.sign(payload, key, options);//option中的expiresIn能設定保存期限
  return token;
};

// 验证JWT
const verifyToken = (token) => {
    const decoded = jwt.verify(token, key);//验证JWT
    return decoded;  
};

// 允许跨域访问
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

sequelize.authenticate().then(() => {
   console.log('Connection has been established successfully.');
}).catch((error) => {
   console.error('Unable to connect to the database: ', error);
});

const Person = require("./node_modules/sequelize-auto/bin/models/person.js")(sequelize, Sequelize.DataTypes);
const Trade = require("./node_modules/sequelize-auto/bin/models/trade.js")(sequelize, Sequelize.DataTypes);
const Autotrade = require("./node_modules/sequelize-auto/bin/models/autotrade.js")(sequelize, Sequelize.DataTypes);
const Authority = require("./node_modules/sequelize-auto/bin/models/authority.js")(sequelize, Sequelize.DataTypes);
const Indicator = require("./node_modules/sequelize-auto/bin/models/indicator.js")(sequelize, Sequelize.DataTypes);
const Share = require("./node_modules/sequelize-auto/bin/models/share.js")(sequelize, Sequelize.DataTypes);
const Bank = require("./node_modules/sequelize-auto/bin/models/bank.js")(sequelize, Sequelize.DataTypes);
const Share_record = require("./node_modules/sequelize-auto/bin/models/share_record.js")(sequelize, Sequelize.DataTypes);
const Share_holding = require("./node_modules/sequelize-auto/bin/models/share_holding.js")(sequelize, Sequelize.DataTypes);
const User_sys_time = require("./node_modules/sequelize-auto/bin/models/user_sys_time.js")(sequelize, Sequelize.DataTypes);


//test
app.post("/stock_simulator/api/test", (req, res) => {
  var test=req.body.test;
  console.log(test);
  res.send({ message: test });
});

//登入驗證
app.post("/stock_simulator/api/Logincheck", (req, res) => {
  var usertoken=req.body.token;
  var useracoount="";
  var useraid="";
  var cookiecheck=true;
  try{
    const decoded = verifyToken(usertoken);
    useracoount=decoded.acoount;
  }
  catch (error){
    res.send({ message: '傳入cookie資料出錯,請重新登入' });
    cookiecheck=false;
  };
  if(cookiecheck){
    (async () => {
      //查pid(用jwt得到帳號)
      await Person.findOne({
        where: {acoount: useracoount}
      }).then(person => {
        if(person){
          useraid = person.aid.toString();
          if(useraid=="a01"){
          console.log("correct");
          res.send({ message: 'correct' });
          }
          else{
          console.log("權限不足");
          res.send({ message: '權限不足' });
          }
        }
        else{
          console.log("cookie資料出錯,請重新登入");
          res.send({ message: 'cookie資料出錯,請重新登入' });}
      });
    })();
  };
});

//LineID查詢
app.post("/stock_simulator/api/linechecker", (req, res) => {
  var userline_id="";
  var userac="";
  userline_id=req.body.line_id;
  (async () => {
    const personline_id = await Person.findOne({
      where: {line_pw: userline_id}
    });
    if (personline_id) {
      userac=personline_id.aid;
      const token = createToken(userac);
      res.send({ message:'correct user_line_ID',userac:userac,token:token});//已綁定user_line_ID
    } else {
      res.send({ message:'unfind user_line_ID'});//無綁定user_line_ID，要綁網頁的帳密
    }
  })();
});

//Login網頁連接
app.post("/stock_simulator/api/Login", (req, res) => {
  userpassword=req.body.password;
  var userpassword = req.body.password.toString();
  var useracoount = req.body.acoount.toString();


  // aes加密
  const cipher = crypto.createCipher(algorithm, key);
  let aespassword = cipher.update(userpassword, 'utf8', 'hex');
  aespassword += cipher.final('hex');
  userpassword=aespassword;

  sequelize.sync().then(() => {
    Person.findOne({
      where: {acoount: useracoount}
    }).then(person => {
    if(person){    
      const passwordString = person.password.toString();
      const acoountString = person.acoount.toString();
      if(useracoount==acoountString){
        if(userpassword==passwordString){
          const user = {acoount:useracoount};
          //生成token
          const token = createToken(user);
          usertoken=token;
          res.send({ message: 'account and password correct' ,
                     token:usertoken,ac:useracoount});//回傳資訊
        }      
        else{
        res.send({ message: 'account or password uncorrect' });//回傳資訊
        }
      }

    }
    else{
      res.send({ message: 'account or password uncorrect' });//回傳資訊
    }
    });
  });
});

//Line綁定網頁帳號
app.post("/stock_simulator/api/Linelinker", (req, res) => {
  var userlineID = req.body.ID;
  console.log(userlineID);
  var userac = req.body.ac;
    (async () => {
      try {
      const person = await Person.findOne({
        where: { acoount: userac }
      });
      if (person) {
        person.update({ line_pw: userlineID });
        res.send({ message: 'success' });
      } else {
        console.log("網頁出錯");
      }
    } catch (error) {
      console.log("出错", error);
    }
    })();
});

//Line解綁帳號
app.post("/stock_simulator/api/Linelinkbreaker", (req, res) => {
  var userlineID = req.body.line_id;
    (async () => {
      try {
      const person = await Person.findOne({
        where: { line_pw: userlineID }
      });
      if (person) {
        person.update({ line_pw: null });
        res.send({ message: 'success' });
      } else {
        console.log("網頁出錯");
      }
    } catch (error) {
      console.log("出错", error);
    }
    })();
});

//建立權限
app.post("/stock_simulator/api/creatauthority", (req, res) => {

  var useraid="";
  var userauthority="";
  //生成aid
  Authority.findAll().then(Authority => {
    useraid=(Authority.length+1).toString();
    useraid= "a0"+useraid;
  });
  userauthority=req.body.authority;

  sequelize.sync().then(() => { 
    sequelize.sync().then(() => {
      Authority.create({
        aid:useraid,
        authority:userauthority,
      }).then(() => {
        // 執行成功後會印出文字
        console.log('authority successfully created!!') 
      });
    });
  });
});

//建立使用者(和初始金庫，初始系統時間)
app.post("/stock_simulator/api/signup", (req, res) => {
  var userpid="";
  var useracoount,userpassword,useremail,userauthority_id="";

  useracoount=req.body.acoount;
  userpassword=req.body.password;
  useremail=req.body.email;
  userauthority_id=req.body.authority_id;

  // aes加密
  const cipher = crypto.createCipher(algorithm, key);
  var aespassword = cipher.update(userpassword, 'utf8', 'hex');
  aespassword += cipher.final('hex');
  userpassword=aespassword;
  
  try{
    (async () => {
      //生成pid
      const Persons = await Person.findAll();
      userpid = (Persons.length + 1).toString();
      userpid = "p0" + userpid;

      const authoritys = await Authority.findOne({
        where: { aid: userauthority_id }
      });

      if(authoritys){
        await Person.create({
          pid:userpid,
          acoount:useracoount,
          password:userpassword,
          email:useremail,
          aid:userauthority_id,
        })
      
        const people = await Person.findOne({
          where: { acoount: useracoount }
        });

        if(people){  
          await Bank.findAll().then(Bank => {
            userbid=(Bank.length+1).toString();
            userbid= "b0"+userbid;
          });      
          userpid = people.pid.toString();
          await Bank.create({
            bid:userbid,
            pid:userpid,
            money:100000,
          })

          if(people){  
            await User_sys_time.findAll().then(User_sys_time => {
              userustid=(User_sys_time.length+1).toString();
              userustid= "ust0"+userustid;
            });      
            userpid = people.pid.toString();
            await User_sys_time.create({
              ust_id:userustid,
              user_id:userpid,
              latest_sys_time:"2023-05-30",
            })
            res.send({ message: 'sys_time successfully created!!'});
            console.log('sys_time successfully created!! '+userpid)
          }
          else{
            res.send({ message: 'password pid is not exist'}); 
            console.log('password pid is not exist')
          }
        }
        else{
          res.send({ message: 'password pid is not exist'}); 
          console.log('password pid is not exist')
        }
      }
      else{
        res.send({ message: 'password authority_id is not exist' });        
      }
    })();
  }catch (error) {
      console.log("出错", error);
  }
}); 

//帳號是否重複
app.post("/stock_simulator/api/acchecker", (req, res) => {
  useracoount=req.body.acoount;
  (async () => {
    await Person.findOne({
      where: {acoount: useracoount}
    }).then(person => {
      if(person){res.send({ message: 'acoount repeat' });}
      else{res.send({ message: 'acoount correct' });}
    });
  })();
});

//查詢金庫金額及資產(小數點問題)
app.post("/stock_simulator/api/Bank", (req, res) => {
  var cookiecheck=true;
  var usertoken=req.body.token;
  var useracoount="";
  var userpid="";
  var userbankmoney=0;
  var totalmoney=0;
  var usersys_time = req.body.sys_time;
  try{
    const decoded = verifyToken(usertoken);
    useracoount=decoded.acoount;
  }
  catch (error){
    res.send({ message: '傳入cookie資料出錯' });
    cookiecheck=false;
  };
  if(cookiecheck){
    (async () => {
            try {
      //查pid(用jwt得到帳號)
      const person = await Person.findOne({
        where: { acoount: useracoount }
      });
      if (person) {
        userpid = person.pid.toString();
      } else {
        console.log("網頁出錯");
      }
      const bank = await Bank.findOne({
        where: {pid: userpid}
      });
      if (bank) {
        userbankmoney = bank.money;
      } else {
        console.log("BANK出錯");
      }
      const holds = await Share_holding.findAll({
        where: { user_id: userpid }
      });

      for (const hold of holds) {
        const shareRecords = await Share_record.findOne({
          where: {
            share_id: hold.share_id,
            date: usersys_time
          }
        });
        totalmoney=totalmoney+(shareRecords.dataValues.open * hold.dataValues.quantity)
        console.log(totalmoney);
      }
      res.send({ message: 'correct', money: userbankmoney , total_money: totalmoney+userbankmoney });
    } catch (error) {
      console.log("出错", error);
    }
    })();
  }
}); 

//查詢金庫金額及資產(小數點問題)(Line)
app.post("/stock_simulator/api/LineBank", (req, res) => {
  var lineid=req.body.line_id;
  var useracoount="";
  var userpid="";
  var userbankmoney=0;
  var totalmoney=0;
  var usersys_time = "";
    (async () => {
    try {
      //查pid(用jwt得到帳號)
      const person = await Person.findOne({
        where: { line_pw: lineid }
      });
      if (person) {
        userpid = person.pid.toString();
      } else {
        console.log("網頁出錯");
      }
      const lasttime = await User_sys_time.findOne({
        where: { user_id: userpid }
      });
      if (lasttime) {
        usersys_time = lasttime.latest_sys_time;
      } else {
        console.log("網頁出錯");
      }
      const bank = await Bank.findOne({
        where: {pid: userpid}
      });
      if (bank) {
        userbankmoney = bank.money;
      } else {
        console.log("BANK出錯");
      }
      const holds = await Share_holding.findAll({
        where: { user_id: userpid }
      });

      for (const hold of holds) {
        const shareRecords = await Share_record.findOne({
          where: {
            share_id: hold.share_id,
            date: usersys_time
          }
        });
        totalmoney=totalmoney+(shareRecords.dataValues.open * hold.dataValues.quantity)
        console.log(totalmoney);
      }
      res.send({ message: 'correct', money: userbankmoney , total_money: totalmoney+userbankmoney });
    } catch (error) {
      console.log("出错", error);
    }
    })();
}); 

//新增指標
app.post("/stock_simulator/api/indicator", (req, res) => {
  var useriid,userindicator="";
  var parameter1,parameter2,parameter3="";
  //生成iid
  Indicator.findAll().then(Indicator => {
    useriid=(Indicator.length+1).toString();
    useriid= "i0"+useriid;
  });
  userindicator=req.body.indicator;
  parameter=req.body.parameter;

  sequelize.sync().then(() => {
    Indicator.create({
      iid:useriid,
      indicator:userindicator,
      index:parameter,
    }).then(() => {
      console.log(' Indicator successfully created!!') 
    });    
  });
});

//加入新股及股價波動*(目前無用)
app.post("/stock_simulator/api/share", (req, res) => {
  var usersid,userstock,userprice,usertime="";
  //生成sid
  Share.findAll().then(Share => {
    usersid=(Share.length+1).toString();
    usersid= "s0"+usersid;
  });

  usershare=req.body.share;
  userprice=req.body.price;
  userhigh=req.body.high;
  userlow=req.body.low;  
  useropen=req.body.open;
  userclose=req.body.close;
  uservolume=req.body.volume;
  usertime=req.body.time;

  sequelize.sync().then(() => {
    Share.create({
      sid:usersid,
      share:usershare,
      price:userprice,
      high:userhigh,
      low:userlow,
      open:useropen,
      close:userclose,
      volume:uservolume,
      time:usertime,
    }).then(() => {
      console.log(' Share successfully created!!') 
    });
  });
});

//使用者最後購買股票的時間
app.post("/stock_simulator/api/lastdatecheck", (req, res) => {
  var usertoken = req.body.token;
  var userpid = "";
  var cookiecheck = true;
  var useracoount = "";
  var date_array = [];
  var lasttime ="";
  try {
    const decoded = verifyToken(usertoken);
    useracoount = decoded.acoount;
  } catch (error) {
    res.send({ message: '傳入cookie資料出錯' });
    cookiecheck = false;
  }
  if (cookiecheck) {
    (async () => {
      try {
        //查pid(用jwt得到帳號)
        const person = await Person.findOne({
          where: { acoount: useracoount }
        });
        if (person) {
          userpid = person.pid.toString();
        } else {
          console.log("網頁出錯");
        }
        const holds = await Share_holding.findAll({
        where: { user_id: userpid }
        });
        console.log(holds)
        if (holds.length > 0) {
          for (const hold of holds) {
            var date = hold.sys_time
            date_array.push(date);
          }
          let maxDate = new Date(date_array[0]);
          for (let i = 1; i < date_array.length; i++) {
            const currentDate = new Date(date_array[i]);
            if (currentDate > maxDate) {
              maxDate = currentDate;
            }
          }
          const dateObj = new Date(maxDate);
          const year = dateObj.getFullYear();
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const day = dateObj.getDate().toString().padStart(2, '0');
          last_time= `${year}-${month}-${day}`;
          res.send({ message: 'correct', last_time:last_time});
        } 
        else {
          res.send({ message: 'correct', last_time: "2003-07-01"});
        }
      }
      catch (error) {
        console.log("出错", error);
      }
    })();
  }
});

//股票資料調取
app.post("/stock_simulator/api/sharepicker", (req, res) => {
  var user_first_time,user_second_time="";
  var share_id="";
  var buysellsel=false;//交易頁面調取
  var price=0;
  share_id=req.body.share;
  user_first_time=req.body.firstdate;
  user_second_time=req.body.seconddate;
  buysellsel=req.body.buysellsel;
  if(share_id==""){
    //查詢時間(無id)
    const Op = Sequelize.Op;
    (async () => {
      await Share_record.findAll({
        where: {
          date: {
            [Op.and]: [
              { [Op.gte]: new Date(user_first_time) }, // 時間大於 EX:"1970-01-01"
              { [Op.lte]: new Date(user_second_time) } // 時間小於
            ]
          }
        }
      }).then((record) => {
        console.log(record);
        //console.log(record[0].dataValues.share_id);//調取之股票資料第一筆的id
      });
    })();
  }
  else{
    //查詢時間(有id)
    const Op = Sequelize.Op;
    (async () => {
      await Share_record.findAll({
        where: {
          date: {
            [Op.and]: [
              { [Op.gte]: new Date(user_first_time) }, // 時間大於 EX:"1970-01-01"
              { [Op.lte]: new Date(user_second_time) } // 時間小於
            ]
          },
          share_id:share_id,
        }
      }).then((record) => {
        console.log(record);
        if(buysellsel){
          if(record.length==0){
            res.send({ message: 'notthing'});
          }
          else{
            price=record[0].dataValues.open;//調取之股票資料第一筆的open
          }
        }
      });
      await Share.findAll({
        where: { sid: share_id }
      }).then((record) => {
        if(buysellsel){
          if(record.length!=0){
            var name=record[0].dataValues.share_name;
            res.send({ message: 'correct',price: price ,name:name});
          }
        }
      });
    })();
  }
});

//個人頁面總資產遞迴取得
app.post("/stock_simulator/api/user_moneypre_seter_recursive", (req, res) => {
  var cookiecheck=true;
  var usertoken=req.body.token;
  var useracoount="";
  var userpid="";
  var usersys_time = req.body.sys_time;
  var newsys_time;
  var holdingShare=[];
  var newholdingShare=[];
  var userbankmoney;
  var newtrademoney=0;
  var moneyarray=[];
  var datearray=[];
  var roundtimes=req.body.roundtimes;
  try{
    const decoded = verifyToken(usertoken);
    useracoount=decoded.acoount;
  }
  catch (error){
    res.send({ message: '傳入cookie資料出錯' });
    cookiecheck=false;
  };

  if(cookiecheck){
    (async () => {
      try {
        //查pid(用jwt得到帳號)
        const person = await Person.findOne({
          where: { acoount: useracoount }
        });
        if (person) {
          userpid = person.pid.toString();
        } else {
          console.log("網頁出錯");
        }
        const bank = await Bank.findOne({
          where: {pid: userpid}
        });
        if (bank) {
          userbankmoney = bank.money;
        } else {
          console.log("BANK出錯");
        }

        // 最初的遞迴呼叫，使用初始系統時間
        await calculateTotalAssets(new Date(usersys_time));
      } catch (error) {
        console.log("出错", error);
      }
    })();
  }

 const calculateTotalAssets = async (currentDate) => {

    const holds = await Share_holding.findAll({
      where: { user_id: userpid }
    });


    for (const hold of holds) {
      const data = {
        "share_id": hold.share_id,
        "quantity": hold.quantity
      };
      holdingShare.push(data);
    }

    const newsys_time = new Date(currentDate);
    newsys_time.setDate(newsys_time.getDate() - 1);

    const datecheck = await Share_record.findOne({
      where: { date: newsys_time }
    });

    if (datecheck === undefined || datecheck === null) {
      newsys_time.setDate(newsys_time.getDate() - 2);
    }

    const tradeholdings = await Trade.findAll({
      where: {
        sys_time: newsys_time,
        person: userpid
      }
    });

    if (tradeholdings.length > 0) {
      for (const tradeholding of tradeholdings) {
        const shareRecords = await Share_record.findOne({
          where: {
            share_id: tradeholding.share,
            date: newsys_time
          }
        });

        let check = true;

        for (let i = 0; i < holdingShare.length; i++) {
          if (holdingShare[i].share_id === tradeholding.share) {
            if (tradeholding.buysell === 0) {
              holdingShare[i].quantity -= tradeholding.quantity;
              userbankmoney += holdingShare[i].quantity * shareRecords.dataValues.open;
            } else {
              holdingShare[i].quantity += tradeholding.quantity;
              userbankmoney -= holdingShare[i].quantity * shareRecords.dataValues.open;
            }
            check = false;
            break;
          }
        }

        if (check) {
          let tradata;
          if (tradeholding.buysell === 0) {
            tradata = {
              "share_id": tradeholding.share,
              "quantity": -tradeholding.quantity
            };
            userbankmoney += tradeholding.quantity * shareRecords.dataValues.open;
          } else {
            tradata = {
              "share_id": tradeholding.share,
              "quantity": tradeholding.quantity
            };
            userbankmoney -= tradeholding.quantity * shareRecords.dataValues.open;
          }
          newholdingShare.push(tradata);
        }
      }
    }

    for (let i = 0; i < holdingShare.length; i++) {
      newholdingShare.push(holdingShare[i]);
    }

    for (let i = 0; i < newholdingShare.length; i++) {
      const share_Record = await Share_record.findOne({
        where: {
          share_id: newholdingShare[i].share_id,
          date: newsys_time
        }
      });
      if (share_Record) {
        newtrademoney += share_Record.dataValues.open * newholdingShare[i].quantity;
      } else {
        console.log("share_Record為空")
      }
    }
    datearray.push(newsys_time);
    moneyarray.push(newtrademoney + userbankmoney);
    newtrademoney=0;

    const previousDate = new Date(newsys_time);
    previousDate.setDate(previousDate.getDate() - 1);
    roundtimes--;
    
    if (roundtimes>0) {
      holdingShare=[];
      newholdingShare=[];
      return calculateTotalAssets(previousDate); // 遞迴呼叫以獲取更早日期的資產
    } 
    else {
      // 將結果作為回應發送給客戶端
      res.send({ message: 'correct', money: moneyarray, datetime: datearray});
    }
  }; 
});

//系統時間調取
app.post("/stock_simulator/api/datepicker", (req, res) => {
  var cookiecheck=true;
  var usertoken=req.body.token;
  var useracoount="";
  var userpid="";
  try{
    const decoded = verifyToken(usertoken);
    useracoount=decoded.acoount;
  }
  catch (error){
    res.send({ message: '傳入cookie資料出錯' });
    cookiecheck=false;
  };
  if(cookiecheck){
    (async () => {
      try {
      //查pid(用jwt得到帳號)
      const person = await Person.findOne({
        where: { acoount: useracoount }
      });
      if (person) {
        userpid = person.pid.toString();
        await User_sys_time.findOne({
        where: {user_id: userpid}
        }).then(sys_time => {
          if(sys_time){
            res.send({ 
            message: 'correct',
            date: sys_time.dataValues.latest_sys_time });
          }
          else{
            res.send({ message: 'fail' });
          }
        });
      } else {
        console.log("useracoount出錯");
        res.send({ message: 'useracoount出錯' });
      }
    } catch (error) {
      console.log("出错", error);
    }
    })();
  }
}); 

//使用者系統時間修改
app.post("/stock_simulator/api/datechanger", (req, res) => {
  var cookiecheck=true;
  var usertoken=req.body.token;
  var useracoount="";
  var userpid="";
  var user_sys_time=req.body.selectedDate;
  try{
    const decoded = verifyToken(usertoken);
    useracoount=decoded.acoount;
  }
  catch (error){
    res.send({ message: '傳入cookie資料出錯' });
    cookiecheck=false;
  };
  if(cookiecheck){
    (async () => {
      try {
      //查pid(用jwt得到帳號)
      const person = await Person.findOne({
        where: { acoount: useracoount }
      });
      if (person) {
        userpid = person.pid.toString();
        await User_sys_time.findOne({
        where: {user_id: userpid}
        }).then(sys_time => {
          if(sys_time){
            sys_time.update({ latest_sys_time: user_sys_time });
            res.send({ 
            message: 'correct',
            date: user_sys_time });
          }
          else{
            res.send({ message: 'fail' });
          }
        });
      } else {
        console.log("useracoount出錯");
        res.send({ message: 'useracoount出錯' });
      }
    } catch (error) {
      console.log("出错", error);
    }
    })();
  }
}); 

//Line使用者系統時間修改
app.post("/stock_simulator/api/linedatechanger", (req, res) => {
  var line_id=req.body.line_id;
  var useracoount="";
  var userpid="";
  var user_sys_time=req.body.selectedDate;
    (async () => {
      try {
      //查pid(用jwt得到帳號)
      const person = await Person.findOne({
        where: { line_pw: line_id }
      });
      if (person) {
        userpid = person.pid.toString();
        await User_sys_time.findOne({
        where: {user_id: userpid}
        }).then(sys_time => {
          if(sys_time){
            sys_time.update({ latest_sys_time: user_sys_time });
            res.send({ 
            message: 'correct',
            date: user_sys_time });
          }
          else{
            res.send({ message: 'fail' });
          }
        });
      } else {
        console.log("useracoount出錯");
        res.send({ message: 'useracoount出錯' });
      }
    } catch (error) {
      console.log("出错", error);
    }
    })();
});

//個人頁面股票資料表
app.post("/stock_simulator/api/shareseter", (req, res) => {
  var userdate = "";
  const share_id_array = [];
  const share_name_array = [];
  const share_open_array = [];
  const share_lastopen_array = [];
  const share_p_array = [];
  userdate = req.body.date;

  const Op = Sequelize.Op;
  (async () => {
    const record = await Share_record.findAll({
      where: {
        date: { [Op.eq]: new Date(userdate) },
      }
    });
      //使用 map() 方法將非同步操作的 Promise 對象組成一個陣列 promises
      //並使用 Promise.all() 等待所有 Promise 完成。
      //之後，在 promises 的每個 Promise 完成後，重複使用 map() 方法將非同步操作的 Promise 對象組成一個新的陣列
      //並使用 Promise.all() 等待它們全部完成。
      //最後再執行 res.send()
    const promises = record.map(async (item) => {
      var id = item.dataValues.share_id;
      share_id_array.push(id);
      share_open_array.push(item.dataValues.open);
      share_lastopen_array.push(item.dataValues.share_record_no - 1);
      const share = await Share.findAll({
        where: { sid: id }
      });
      share_name_array.push(share[0].dataValues.share_name);
    });

    await Promise.all(promises);

    const pPromises = share_lastopen_array.map(async (lastOpen, i) => {
      const record = await Share_record.findAll({
        where: { share_record_no: lastOpen }
      });
      share_lastopen_array[i] = record[0].dataValues.open;
      var p = (share_open_array[i] - share_lastopen_array[i]) / share_lastopen_array[i];
      p = (p.toFixed(3)*100).toFixed(1);
      share_p_array.push(p);
    });
    await Promise.all(pPromises);
    res.send({ 
      id: share_id_array,
      name:share_name_array,
      open:share_open_array,
      p:share_p_array,
    });  
  })();
});

//平倉股數
app.post("/stock_simulator/api/Coverq", (req, res) => {
  var usertoken = req.body.token;
  var userpid = "";
  var cookiecheck = true;
  var useracoount = "";
  var stock_id =req.body.stock_id;
  try {
    const decoded = verifyToken(usertoken);
    useracoount = decoded.acoount;
  } catch (error) {
    res.send({ message: '傳入cookie資料出錯' });
    cookiecheck = false;
  }
  if (cookiecheck) {
    (async () => {
      try {
        //查pid(用jwt得到帳號)
        const person = await Person.findOne({
          where: { acoount: useracoount }
        });
        if (person) {
          userpid = person.pid.toString();
        } else {
          console.log("網頁出錯");
        }
        const holds = await Share_holding.findOne({
        where: { user_id: userpid ,share_id: stock_id}
        });
        console.log(holds)
        if (holds) {
          res.send({ message: 'correct', quantity:holds.quantity});
        } 
        else {
          res.send({ message: 'nothing'});
        }
      }
      catch (error) {
        console.log("出错", error);
      }
    })();
  }
});

//交易頁面取得持有股比
app.post("/stock_simulator/api/stock_holding_picker", (req, res) => {
  var usertoken = req.body.token;
  var userpid = "";
  var cookiecheck = true;
  var useracoount = "";
  var totalmoneyvalue=0;
  var money_array = [];
  var usersys_time = req.body.sys_time;

  try {
    const decoded = verifyToken(usertoken);
    useracoount = decoded.acoount;
  } catch (error) {
    res.send({ message: '傳入cookie資料出錯' });
    cookiecheck = false;
  }

  if (cookiecheck) {
    (async () => {
      try {
      //查pid(用jwt得到帳號)
      const person = await Person.findOne({
        where: { acoount: useracoount }
      });
      if (person) {
        userpid = person.pid.toString();
      } else {
        console.log("網頁出錯");
      }

      const holds = await Share_holding.findAll({
        where: { user_id: userpid }
      });

      for (const hold of holds) {
        const shareRecords = await Share_record.findOne({
          where: {
            share_id: hold.share_id,
            date: usersys_time
          }
        });

        const sharename = await Share.findOne({
          where: {
            sid: hold.share_id,
          }
        });

        totalmoneyvalue = shareRecords.dataValues.open * hold.dataValues.quantity;
        var date = {
          value: totalmoneyvalue,
          name: sharename.dataValues.share_name
        };
        money_array.push(date);
      }

      console.log(money_array);
      res.send({ message: 'correct', moneyarray: money_array });
    } catch (error) {
      console.log("出错", error);
    }
    })();
  }
}); 

//新增買賣紀錄(含自動化使用指標之紀錄)(目前預設i03無指標)(買進是0賣出是1)#
app.post("/stock_simulator/api/autotrade", (req, res) => {
  var usertoken = req.body.token;
  var usertid, userbuysell, userquantity, userpid = "";
  var usersid = "";
  var useratid, useriid = "";
  var cookiecheck = true;
  var useracoount = "";
  var usersys_time=req.body.sys_time;

  try {
    const decoded = verifyToken(usertoken);
    useracoount = decoded.acoount;
  } catch (error) {
    res.send({ message: '傳入cookie資料出錯' });
    cookiecheck = false;
  }

  if (cookiecheck) {
    userbuysell = req.body.buysell;
    userquantity = req.body.quantity;
    usersid = req.body.stock_id;
    usertotalmoney = req.body.total;

    (async () => {
        //生成tid
        const trades = await Trade.findAll();
        usertid = (trades.length + 1).toString();
        usertid = "t0" + usertid;

        //查pid(用jwt得到帳號)
        const person = await Person.findOne({
          where: { acoount: useracoount }
        });

        if (person) {
          userpid = person.pid.toString();
        } else {
          console.log("網頁出錯");
        }

        const sys_time = await User_sys_time.findOne({
          where: { user_id: userpid }
        });

        if (sys_time) {
          await Trade.create({
            tid: usertid,
            buysell: userbuysell,
            share: usersid,
            quantity: userquantity,
            person: userpid,
            sys_time: sys_time.dataValues.latest_sys_time,
          });
          console.log('Trade successfully created!!');
        };

        //生成atid
        const autotrades = await Autotrade.findAll();
        useratid = (autotrades.length + 1).toString();
        useratid = "at0" + useratid;

        await Autotrade.create({
          atid: useratid,
          person_id: userpid,
          indicator_id: "i03",
          trade_id: usertid
        });

        console.log('Autotrade successfully created!!');
        console.log('Trade and Autotrade successfully created!!');

        const bankmoney = await Bank.findOne({
            where: {
              pid: userpid
            }
          });

        if (userbuysell == 0) {
          const holding = await Share_holding.findOne({
            where: {
              share_id: usersid,
              user_id: userpid
            }
          });

          if (holding) {
            const updatedquantity = holding.quantity + userquantity;
            await holding.update({ quantity: updatedquantity ,sys_time:usersys_time});
          } else {
            await Share_holding.create({
              share_id: usersid,
              user_id: userpid,
              quantity: userquantity,
              sys_time:usersys_time
            });
          }
          const updatedtotal = Math.floor(bankmoney.money) - Math.floor(usertotalmoney);
          await bankmoney.update({ money: updatedtotal });
          console.log(updatedtotal);
        } else if (userbuysell == 1) {
          const holding = await Share_holding.findOne({
            where: {
              share_id: usersid,
              user_id: userpid
            }
          });

          if (holding) {
            const updatedquantity = holding.quantity - userquantity;
            if (updatedquantity == 0) {
              await Share_holding.destroy({
                where: {
                  share_id: usersid,
                  user_id: userpid
                }
              });
              const updatedtotal = Math.floor(bankmoney.money) + Math.floor(usertotalmoney);
              await bankmoney.update({ money: updatedtotal });
              console.log(updatedtotal);
            }
            else if(updatedquantity < 0){
              res.send({ message: '本網頁為金融新手作用不支持做空'});
            } 
            else {
              await holding.update({ quantity: updatedquantity ,sys_time:usersys_time});
              const updatedtotal = Math.floor(bankmoney.money) + Math.floor(usertotalmoney);
              await bankmoney.update({ money: updatedtotal });
              console.log(updatedtotal);
            }
          } else {
            console.log("你没有这个股票");
            res.send({ message: '你没有这个股票'});
          }
        }
    })();
  }
}); 

//查詢買賣歷史資料*
app.post("/stock_simulator/api/history", (req, res) => {
  //const decoded = verifyToken(usertoken);
  //useraccount = decoded.acoount;
  var userpid="";
  var user_first_time,user_second_time="";
  var useracoount=req.body.acoount;

  user_first_time=req.body.first;
  user_second_time=req.body.second;
  //查詢時間
  const Op = Sequelize.Op;
  (async () => {
    //查pid(用jwt得到帳號)
    await Person.findOne({
      where: {acoount: useracoount}
    }).then(person => {
      if(person){userpid = person.pid.toString();}
      else{console.log("網頁出錯");}
    });
    await Trade.findAll({
      where: {
        person:userpid,
        tcreatetime: {
          [Op.and]: [
            { [Op.gt]: new Date(user_first_time) }, // 時間大於 EX:"1970-01-01 00:00:01"
            { [Op.lt]: new Date(user_second_time) } // 時間小於
          ]
        }
      }
    }).then((record) => {
      console.log(record);
    });
  })();
});

//查詢損益紀錄*
app.post("/stock_simulator/api/record", (req, res) => {
  //const decoded = verifyToken(usertoken);
  //useraccount = decoded.acoount;
  var userpid="";
  var user_first_time,user_second_time="";
  var totalmoney=0;
  var stockprice=0;
  var userrecord;
  var useracoount=req.body.acoount;  

  user_first_time=req.body.first;
  user_second_time=req.body.second;
  //查詢時間
  const Op = Sequelize.Op;
  (async () => {
    //查pid(用jwt得到帳號)
    await Person.findOne({
      where: {acoount: useracoount}
    }).then(person => {
      if(person){userpid = person.pid.toString();}
      else{console.log("網頁出錯");}
    });
    await Trade.findAll({
      where: {
        person:userpid,
        tcreatetime: {
          [Op.and]: [
            { [Op.gt]: new Date(user_first_time) }, // 時間大於 EX:"1970-01-01 00:00:01"
            { [Op.lt]: new Date(user_second_time) } // 時間小於
          ]
        }
      }
    }).then((record) => {
      userrecord=record;
    });
    for (var i = 0; i < userrecord.length; i++) {
      var stocktime = userrecord[i].tcreatetime.toString();
      var stocksid = userrecord[i].share.toString();
      var stockquantity = parseInt(userrecord[i].quantity);
      var stockbuysell = parseInt(userrecord[i].buysell);
      stocktime=new Date(stocktime)
      var year = stocktime.getFullYear();
      var month = stocktime.getMonth() + 1;
      var day = stocktime.getDate();
      var stocktime = year + "-" + month + "-" + day;
      await  Share.findOne({
        where: {
        sid: stocksid
        }
       }).then(stock => {
        if(stock){stockprice = parseInt(stock.price)};
        console.log(stockprice);
      });    
      //stockbuysell=1(true)買(負)=0(false)賣(正)
      if(stockbuysell){
        stockprice=stockprice*stockquantity*-1;
        totalmoney=totalmoney+stockprice;
      }
      else{
        stockprice=stockprice*stockquantity*1;
        totalmoney=totalmoney+stockprice;
      };  
   }
    console.log(totalmoney);
  })();
});

//回測股票資料調取
app.post("/stock_simulator/api/backet_sharepicker", (req, res) => {
  var usershare_id = req.body.share_id;
    //查詢shard_id)
    (async () => {
      await Share.findAll({
        where: { sid: usershare_id }
      }).then((record) => {
        if(record.length!=0){
          var name=record[0].dataValues.share_name;
          res.send({ message: 'correct',name:name});
        }
      });
    })();
});

//回測RSI
app.post('/api/postRSI', (req, res) => {
  var pre1=req.body.stock_id;
  var pre2=req.body.start_date;
  var pre3=req.body.end_date;
  var RSI=req.body.RSI; 

  const { exec } = require('child_process');

  // 定义要执行的命令（在这里是执行一个 Python 文件）
  const command1 = ('cd code'); // 替换成你要执行的 Python 文件的路径
  const command2 = ('python code/RSI_nodejs.py '+pre1+' '+pre2+' '+pre3+' '+RSI); // 替换成你要执行的 Python 文件的路径

  // 使用 exec 函数来执行命令
  exec(command1);
  exec(command2, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    // 输出命令的标准输出和标准错误
    console.log(`Standard Output:\n${stdout}`);

    // 在 Python 脚本执行完成后发送响应
    res.json({ message: stdout });
  });
});
//回測MA
app.post('/api/postMA', (req, res) => {
  var pre1=req.body.stock_id;
  var pre2=req.body.start_date;
  var pre3=req.body.end_date;
  var SMA=req.body.SMA;
  var EMA=req.body.EMA;
  var WMA=req.body.WMA;


  const { exec } = require('child_process');

  // 定义要执行的命令（在这里是执行一个 Python 文件）
  const command = ('python code/MA_nodejs.py '+pre1+' '+pre2+' '+pre3+' '+SMA+' '+EMA+' '+WMA); // 替换成你要执行的 Python 文件的路径

  // 使用 exec 函数来执行命令
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    // 输出命令的标准输出和标准错误
    console.log(`Standard Output:\n${stdout}`);

    // 在 Python 脚本执行完成后发送响应
    res.json({ message: stdout });
  });
});
//回測MACD
app.post('/api/postMACD', (req, res) => {
  var pre1=req.body.stock_id;
  var pre2=req.body.start_date;
  var pre3=req.body.end_date;
  var fast_line=req.body.fast_line;
  var slow_line=req.body.slow_line;
  var signal_line=req.body.signal_line;

  const { exec } = require('child_process');

  // 定义要执行的命令（在这里是执行一个 Python 文件）
  const command = ('python code/MACD_nodejs.py '+pre1+' '+pre2+' '+pre3+' '+fast_line+' '+slow_line+' '+signal_line); // 替换成你要执行的 Python 文件的路径

  // 使用 exec 函数来执行命令
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    // 输出命令的标准输出和标准错误
    console.log(`Standard Output:\n${stdout}`);

    // 在 Python 脚本执行完成后发送响应
    res.json({ message: stdout });
  });
});
//回測KD
app.post('/api/postKD', (req, res) => {
  var pre1=req.body.stock_id;
  var pre2=req.body.start_date;
  var pre3=req.body.end_date;
  var KDfastk=req.body.KDfastk;
  var KDslowk=req.body.KDslowk;
  var KDslowd=req.body.KDslowd;

  const { exec } = require('child_process');

  // 定义要执行的命令（在这里是执行一个 Python 文件）
  const command = ('python code/KD_nodejs.py '+pre1+' '+pre2+' '+pre3+' '+KDfastk+' '+KDslowk+' '+KDslowd); // 替换成你要执行的 Python 文件的路径

  // 使用 exec 函数来执行命令
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    // 输出命令的标准输出和标准错误
    console.log(`Standard Output:\n${stdout}`);

    // 在 Python 脚本执行完成后发送响应
    res.json({ message: stdout });
  });
});
//回測bool
app.post('/api/postbool', (req, res) => {
  var pre1=req.body.stock_id;
  var pre2=req.body.start_date;
  var pre3=req.body.end_date;
  var RSI=req.body.RSI;

  const { exec } = require('child_process');

  // 定义要执行的命令（在这里是执行一个 Python 文件）
  const command = ('python code/bool_nodejs.py '+pre1+' '+pre2+' '+pre3+' '+RSI); // 替换成你要执行的 Python 文件的路径

  // 使用 exec 函数来执行命令
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    // 输出命令的标准输出和标准错误
    console.log(`Standard Output:\n${stdout}`);

    // 在 Python 脚本执行完成后发送响应
    res.json({ message: stdout });
  });
});

//首頁
app.get("/Login.html", (req, res) => {
  // 在这里构建HTML頁面的内容
  const html = 
    `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">

  <title>登入頁面--回溯之旅</title>
  <meta content="" name="description">
  <meta content="" name="keywords">

  <!-- Google Fonts -->
  <link href="https://fonts.gstatic.com" rel="preconnect">
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i" rel="stylesheet">

  <!-- Vendor CSS Files -->
  <link href="CSS/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">


  <!-- Template Main CSS File -->
  <link type= "text/css" href="CSS/style.css" rel="stylesheet">

</head>

<body>

  <main>
    <div class="container">

      <section class="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">

              <div class="d-flex justify-content-center py-4">
                <a href="login.html" class="logo d-flex align-items-center w-auto">
                  <img src="/img/logo.png" alt="">
                  <span class="d-none d-lg-block">回溯之旅</span>
                </a>
              </div><!-- End Logo -->

              <div class="card mb-3">

                <div class="card-body">

                  <div class="pt-4 pb-2">
                    <h5 class="card-title text-center pb-0 fs-4">登入你的賬號</h5>
                    <p class="text-center small">輸入賬號密碼進行登錄</p>
                  </div>

                  <form class="row g-3 needs-validation" novalidate>

                    <div class="col-12">
                      <label for="yourUsername" class="form-label">用戶名</label>
                        <div class="form-group">
                 <input type="text" id="acct" name="acct" class="form-control" placeholder="請輸入帳號" required><br/>
                            <label for="yourPassword" class="form-label">密碼</label>
                            <input type="password" id="pwd" name="pwd" class="form-control" placeholder="請輸入密碼" required>
                </div>
                    </div>
 
                 

                  
                    <div class="col-12">
                      <button class="btn btn-primary w-100" type="button" onclick="sender()">登入</button>
                    </div>
                    <div class="col-12">
                      <p class="small mb-0">沒有賬號？ <a href="/register.html" >點擊註冊賬號</a></p>
                    </div>
                  </form>

                </div>
              </div>

            </div>
          </div>
        </div>

      </section>

    </div>
  </main><!-- End #main -->


  <!--JS File -->
 
  <script  type="text/javascript" src="JS/mainPage.js"></script>

</body>

</html>`;
// 将HTML发送给客户端
  res.send(html);
});

//Line連結首頁
app.get("/LineLogin.html", (req, res) => {
  // 在这里构建HTML頁面的内容
  const html = 
    `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">

  <title>回溯之旅Line帳號綁定</title>
  <meta content="" name="description">
  <meta content="" name="keywords">

  <!-- Google Fonts -->
  <link href="https://fonts.gstatic.com" rel="preconnect">
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i" rel="stylesheet">

  <!-- Vendor CSS Files -->
  <link href="CSS/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">


  <!-- Template Main CSS File -->
  <link type= "text/css" href="CSS/style.css" rel="stylesheet">

</head>

<body>

  <main>
    <div class="container">

      <section class="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">

              <div class="d-flex justify-content-center py-4">
                <a href="login.html" class="logo d-flex align-items-center w-auto">
                  <img src="/img/logo.png" alt="">
                  <span class="d-none d-lg-block">回溯之旅</span>
                </a>
              </div><!-- End Logo -->

              <div class="card mb-3">

                <div class="card-body">

                  <div class="pt-4 pb-2">
                    <h5 class="card-title text-center pb-0 fs-4">綁定你的賬號</h5>
                    <p class="text-center small">綁定賬號密碼進行登錄</p>
                  </div>

                  <form class="row g-3 needs-validation" novalidate>

                    <div class="col-12">
                      <label for="yourUsername" class="form-label">用戶名</label>
                        <div class="form-group">
                 <input type="text" id="acct" name="acct" class="form-control" placeholder="請輸入帳號" required><br/>
                            <label for="yourPassword" class="form-label">密碼</label>
                            <input type="password" id="pwd" name="pwd" class="form-control" placeholder="請輸入密碼" required>
                </div>
                    </div>
 
                 

                  
                    <div class="col-12">
                      <button class="btn btn-primary w-100" type="button" onclick="sender()">綁定</button>
                    </div>
                    <div class="col-12">
                      <p class="small mb-0">沒有賬號？ <a href="/Lineregister.html" >點擊註冊賬號</a></p>
                    </div>
                  </form>

                </div>
              </div>

            </div>
          </div>
        </div>

      </section>

    </div>
  </main><!-- End #main -->


  <!--JS File -->
 
  <script  type="text/javascript" src="JS/LineLogin.js"></script>

</body>

</html>`;
// 将HTML发送给客户端
  res.send(html);
});

//Line連結註冊頁面
app.get("/Lineregister.html", (req, res) => {
  // 在这里构建HTML頁面的内容
  const html = 
    `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">

  <title>註冊頁面--回溯之旅</title>
  <meta content="" name="description">
  <meta content="" name="keywords">




  <!-- Google Fonts -->
  <link href="https://fonts.gstatic.com" rel="preconnect">
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i" rel="stylesheet">

  <!-- Vendor CSS Files -->
  <link href="CSS/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">

  <!-- Template Main CSS File -->
  <link href="CSS/style.css" rel="stylesheet">

  <!-- =======================================================
  * Template Name: NiceAdmin
  * Updated: Mar 09 2023 with Bootstrap v5.2.3
  * Template URL: https://bootstrapmade.com/nice-admin-bootstrap-admin-html-template/
  * Author: BootstrapMade.com
  * License: https://bootstrapmade.com/license/
  ======================================================== -->
</head>

<body>

  <main>
    <div class="container">

      <section class="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">

              <div class="d-flex justify-content-center py-4">
                <a href="index.html" class="logo d-flex align-items-center w-auto">
                  <img src="/img/logo.png" alt="">
                  <span class="d-none d-lg-block">回溯之旅</span>
                </a>
              </div><!-- End Logo -->

              <div class="card mb-3">

                <div class="card-body">

                  <div class="pt-4 pb-2">
                    <h5 class="card-title text-center pb-0 fs-4">賬號註冊</h5>
                    <p class="text-center small">輸入資料進行註冊</p>
                  </div>

                  <form class="row g-3 needs-validation">
                    <div class="col-12">
                      <label for="username" class="form-label">使用者名稱</label>
                        <input type="text" id="acct" name="acct" class="form-control"placeholder="請輸入使用者名稱" required>
                    </div>

                    <div class="col-12">
                      <label for="email" class="form-label">電子郵件</label>
                        <input type="email" id="email" name="email" class="form-control"placeholder="請輸入電子郵件" required>
                    </div>

                    <div class="col-12">
                      <label for="password" class="form-label">密碼</label>
                          <input type="password" id="pwd" name="pwd" class="form-control"placeholder="請輸入密碼" required>
                      </div>

                    <div class="col-12">
                      <label for="confirm_password" class="form-label">密碼驗證</label>
                      <input type="password" id="confirm_pwd" name="confirm_pwd" class="form-control"placeholder="請再次輸入密碼" required >
                    </div>

                    <div class="col-12">
                      <button class="btn btn-primary w-100" type="button" onclick="signupsender()">註冊</button>
                        
                    </div>
                    <div class="col-12">
                      <p class="small mb-0">已有賬號? <a href="/LineLogin.html">點擊綁定</a></p>
                    </div>
                  </form>

                </div>
              </div>

 

            </div>
          </div>
        </div>

      </section>

    </div>
  </main><!-- End #main -->




  <!-- Template Main JS File -->

<script  type="text/javascript" src="JS/Linesignup.js"></script>
</body>

</html>`;
// 将HTML发送给客户端
  res.send(html);
});

//註冊頁面
app.get("/register.html", (req, res) => {
  // 在这里构建HTML頁面的内容
  const html = 
    `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">

  <title>註冊頁面--回溯之旅</title>
  <meta content="" name="description">
  <meta content="" name="keywords">




  <!-- Google Fonts -->
  <link href="https://fonts.gstatic.com" rel="preconnect">
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i" rel="stylesheet">

  <!-- Vendor CSS Files -->
  <link href="CSS/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">

  <!-- Template Main CSS File -->
  <link href="CSS/style.css" rel="stylesheet">

  <!-- =======================================================
  * Template Name: NiceAdmin
  * Updated: Mar 09 2023 with Bootstrap v5.2.3
  * Template URL: https://bootstrapmade.com/nice-admin-bootstrap-admin-html-template/
  * Author: BootstrapMade.com
  * License: https://bootstrapmade.com/license/
  ======================================================== -->
</head>

<body>

  <main>
    <div class="container">

      <section class="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">

              <div class="d-flex justify-content-center py-4">
                <a href="index.html" class="logo d-flex align-items-center w-auto">
                  <img src="/img/logo.png" alt="">
                  <span class="d-none d-lg-block">回溯之旅</span>
                </a>
              </div><!-- End Logo -->

              <div class="card mb-3">

                <div class="card-body">

                  <div class="pt-4 pb-2">
                    <h5 class="card-title text-center pb-0 fs-4">賬號註冊</h5>
                    <p class="text-center small">輸入資料進行註冊</p>
                  </div>

                  <form class="row g-3 needs-validation">
                    <div class="col-12">
                      <label for="username" class="form-label">使用者名稱</label>
                        <input type="text" id="acct" name="acct" class="form-control"placeholder="請輸入使用者名稱" required>
                    </div>

                    <div class="col-12">
                      <label for="email" class="form-label">電子郵件</label>
                        <input type="email" id="email" name="email" class="form-control"placeholder="請輸入電子郵件" required>
                    </div>

                    <div class="col-12">
                      <label for="password" class="form-label">密碼</label>
                          <input type="password" id="pwd" name="pwd" class="form-control"placeholder="請輸入密碼" required>
                      </div>

                    <div class="col-12">
                      <label for="confirm_password" class="form-label">密碼驗證</label>
                      <input type="password" id="confirm_pwd" name="confirm_pwd" class="form-control"placeholder="請再次輸入密碼" required >
                    </div>

                    <div class="col-12">
                      <button class="btn btn-primary w-100" type="button" onclick="signupsender()">註冊</button>
                        
                    </div>
                    <div class="col-12">
                      <p class="small mb-0">已有賬號? <a href="/Login.html">點擊登入</a></p>
                    </div>
                  </form>

                </div>
              </div>

 

            </div>
          </div>
        </div>

      </section>

    </div>
  </main><!-- End #main -->




  <!-- Template Main JS File -->

<script  type="text/javascript" src="JS/signupPage.js"></script>
</body>

</html>`;
// 将HTML发送给客户端
  res.send(html);
});

//個人頁面
app.get("/index.html", (req, res) => {
  // 在这里构建HTML頁面的内容
  const html = 
    `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">

  <title>回溯之旅-個人主頁</title>
  <meta content="" name="description">
  <meta content="" name="keywords">


  <!-- Google Fonts -->
  <link href="https://fonts.gstatic.com" rel="preconnect">
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i" rel="stylesheet">

  <!-- Vendor CSS Files -->
  <link href="CSS/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="CSS/assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">

<!--    icons 超鏈接-->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
  <!-- Template Main CSS File -->
  <link href="CSS/style.css" rel="stylesheet">
    
<!-- 引入jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- 引入DataTables的CSS文件 -->
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.25/css/jquery.dataTables.min.css">

<!-- 引入DataTables的JS文件 -->
<script src="https://cdn.datatables.net/1.10.25/js/jquery.dataTables.min.js"></script>
<!--引入date picker的文件-->


<!-- 引入Bootstrap的JavaScript文件 -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>

<!-- 引入Bootstrap Datepicker库的CSS和JavaScript文件 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/css/bootstrap-datepicker.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/js/bootstrap-datepicker.min.js"></script>

</head>

<body>

  <!-- ======= Header ======= -->
  <header id="header" class="header fixed-top d-flex align-items-center">

    <div class="d-flex align-items-center justify-content-between">
      <a href="index.html" class="logo d-flex align-items-center">
        <img src="img/logo.png" alt="">
        <span class="d-none d-lg-block">回溯之旅</span>
      </a>
      
    </div><!-- End Logo -->

    <nav class="header-nav ms-auto">
      <ul class="d-flex align-items-center">

        <li class="nav-item d-block d-lg-none">
          <a class="nav-link nav-icon search-bar-toggle " href="#">
            <i class="bi bi-search"></i>
          </a>
        </li><!-- End Search Icon-->
         
          
          <!--dropdown page function-->
         <li class="nav-item dropdown pe-3">

          <a class="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
            <span class="d-none d-md-block dropdown-toggle ps-2">頁面</span>
            </a>

          <ul class="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
            <li>
              <a class="dropdown-item d-flex align-items-center" href="/index.html">
                <i class="bi bi-houses"></i>
                <span>首頁</span>
              </a>
            </li>
            <li>
              <hr class="dropdown-divider">
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center" href="/trade.html">
                <i class="bi bi-currency-exchange"></i>
                <span>交易</span>
              </a>
            </li>
              <li>
              <hr class="dropdown-divider">
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center" href="/backtest.html" >
                <i class="bi bi-clipboard2-data"></i>
                <span>回測</span>
              </a>
            </li>
          </ul>
        </li>
        日期選擇器
        <!-- datepicker function-->
        <div class="date-picker">
          <button class="btn btn-outline-secondary" id="calendar-icon" type="button" title="選擇系統時間"><i class="bi bi-calendar"></i> <span id="selected-date">2023-03-14</span></button>
        </div>
        <!-- End Date Picker -->





        <li class="nav-item dropdown pe-3">

          <a class="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
            <span class="d-none d-md-block dropdown-toggle ps-2">SuperManagement</span>
          </a><!-- End Profile Iamge Icon -->

          <ul class="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
            <li class="dropdown-header">
              <h6>SuperManagement</h6>
              <span>Web Designer</span>
            </li>
            <li>
              <hr class="dropdown-divider">
            </li>

            <li>
              <a class="dropdown-item d-flex align-items-center" href="/index.html">
                <i class="bi bi-person"></i>
                <span>個人主頁</span>
              </a>
            </li>


            <li>
              <hr class="dropdown-divider">
            </li>

            <li>
              <a class="dropdown-item d-flex align-items-center" href="#" onclick="cookiedeleter()">
                <i class="bi bi-box-arrow-right"></i>
                <span>登出</span>
              </a>
            </li>

          </ul><!-- End Profile Dropdown Items -->
        </li><!-- End Profile Nav -->

      </ul>
    </nav><!-- End Icons Navigation -->

  </header><!-- End Header -->

<main id="main" class="main">
     <div class="pagetitle">
      <h1>個人主頁</h1>
      <nav>
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="index.html">主頁</a></li>
          <li class="breadcrumb-item active">個人主頁</li>
        </ol>
      </nav>
    </div><!-- End Page Title -->
    
    <section class="section dashboard ">
      <div class="row">
           <!-- Left side columns -->
        <div class="col-lg-8">
          <div class="row">
              <!-- Equity Card -->
            <div class="col-xxl-6 col-md-6">
              <div class="card info-card sales-card">
                <div class="card-body">
                  <h5 class="card-title">個人總資產</h5>
                    <div class="d-flex align-items-center">
                      <div class="card-icon rounded-circle d-flex align-items-center justify-content-center">
                        <i class="bi bi-currency-dollar"></i>
                      </div>
                      <div class="ps-3" id="bankmoney">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            <!-- Revenue Card -->
            <div class="col-xxl-6 col-md-6">
              <div class="card info-card revenue-card">

                <div class="filter">
                  <a class="icon" href="#" data-bs-toggle="dropdown"><i class="bi bi-three-dots"></i></a>
                  <ul class="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                    <li class="dropdown-header text-start">
                      <h6>Filter</h6>
                    </li>
                    <li><a class="dropdown-item" href="#" onclick="usermoneyperseter(1)">day</a></li>
                    <li><a class="dropdown-item" href="#" onclick="usermoneyperseter(7)">7day</a></li>
                    <li><a class="dropdown-item" href="#" onclick="usermoneyperseter(30)">Month</a></li>
                    <li><a class="dropdown-item" href="#" onclick="usermoneyperseter(365)">Year</a></li>
                  </ul>
                </div>

                <div class="card-body">
                  <h5 class="card-title" id="moneypretime">總資產浮動漲幅度</h5>

                  <div class="d-flex align-items-center">
                    <div class="card-icon rounded-circle d-flex align-items-center justify-content-center">
                      <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="ps-3">
                      <h6 class="text-success small pt-1 fw-bold" id="usermoneyper">0.00%</h6>

                    </div>
                  </div>
                </div>

              </div>
            </div><!-- End Revenue Card -->
              
            <!-- Reports -->
            <div class="col-12">
              <div class="card">

                <div class="filter">
                  <a class="icon" href="#" data-bs-toggle="dropdown"><i class="bi bi-three-dots"></i></a>
                  <ul class="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                    <li class="dropdown-header text-start">
                      <h6>切換圖表</h6>
                    </li>
                    <li><a class="dropdown-item" href="#" onclick="holderch()">持有股圓餅圖</a></li>
                    <li><a class="dropdown-item" href="#" onclick="line()">個人資產折線圖</a></li>
                  </ul>
                </div>

                <div class="card-body">
                  <h5 class="card-title">個人資產</h5>

                  <!-- Line Chart -->
                  <div id="reportsChart2">
                  <div id="reportsChart" class="reportsChart2"></div>
                  </div>

                  <!-- End Line Chart -->

                </div>

              </div>
            </div><!-- End Reports -->
              
            </div>
          </div><!--End left side column-->
                  <!-- Right side columns -->
<div class="col-lg-4">
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">股票資訊</h5>
      <table id="stockTable" class="table table-striped">
        <thead>
          <tr>
            <th>股票名稱</th>
            <th>股票代碼</th>
            <th>最新價格</th>
            <th>涨跌幅</th>
          </tr>
        </thead>
        <tbody id="stockseter"></tbody>
      </table>
    </div>
  </div>
</div>


    </div><!-- End Right side columns -->

        
    </section>
    </main>

  <a href="#" class="back-to-top d-flex align-items-center justify-content-center"><i class="bi bi-arrow-up-short"></i></a>

  <!-- Vendor JS Files -->
  <script src="CSS/assets/vendor/apexcharts/apexcharts.min.js"></script>
  <script src="CSS/assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="CSS/assets/vendor/chart.js/chart.umd.js"></script>
  <script src="CSS/assets/vendor/echarts/echarts.min.js"></script>
    <!--datatables 的 script-->
<script  type="text/javascript" src="JS/indexPage.js"></script>

    <!--datepicker的script-->
</body>

</html>`;
// 将HTML发送给客户端
  res.send(html);
});

//交易頁面
app.get("/trade.html", (req, res) => {
  // 在这里构建HTML頁面的内容
  const html = 
    `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">

  <title>回溯之旅-個人主頁</title>
  <meta content="" name="description">
  <meta content="" name="keywords">


  <!-- Google Fonts -->
  <link href="https://fonts.gstatic.com" rel="preconnect">
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i" rel="stylesheet">

  <!-- Vendor CSS Files -->
  <link href="CSS/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="CSS/assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">

<!--    icons 超鏈接-->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
  <!-- Template Main CSS File -->
  <link href="CSS/style.css" rel="stylesheet">
    
<!-- 引入jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- 引入DataTables的CSS文件 -->
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.25/css/jquery.dataTables.min.css">

 <!--引入DataTables的JS文件 -->
<script src="https://cdn.datatables.net/1.10.25/js/jquery.dataTables.min.js"></script>
<!-- 引入Bootstrap Datepicker库的CSS和JavaScript文件 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/css/bootstrap-datepicker.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/js/bootstrap-datepicker.min.js"></script>
</head>
<body>

  <header id="header" class="header fixed-top d-flex align-items-center">

    <div class="d-flex align-items-center justify-content-between">
      <a href="index.html" class="logo d-flex align-items-center">
        <img src="img/logo.png" alt="">
        <span class="d-none d-lg-block">回溯之旅</span>
      </a>
      
    </div><!-- End Logo -->


    <nav class="header-nav ms-auto">
      <ul class="d-flex align-items-center">

        <li class="nav-item d-block d-lg-none">
          <a class="nav-link nav-icon search-bar-toggle " href="#">
            <i class="bi bi-search"></i>
          </a>
        </li><!-- End Search Icon-->
         
          
          <!--dropdown page function-->
         <li class="nav-item dropdown pe-3">

          <a class="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
            <span class="d-none d-md-block dropdown-toggle ps-2">頁面</span>
            </a>

          <ul class="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
            <li>
              <a class="dropdown-item d-flex align-items-center" href="/index.html">
                <i class="bi bi-houses"></i>
                <span>首頁</span>
              </a>
            </li>
            <li>
              <hr class="dropdown-divider">
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center" href="/trade.html">
                <i class="bi bi-currency-exchange"></i>
                <span>交易</span>
              </a>
            </li>
              <li>
              <hr class="dropdown-divider">
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center" href="/backtest.html">
                <i class="bi bi-clipboard2-data"></i>
                <span>回測</span>
              </a>
            </li>
          </ul>
        </li>

        日期選擇器
        <!-- datepicker function-->
        <div class="date-picker">
          <button class="btn btn-outline-secondary" id="calendar-icon" type="button" title="選擇系統時間"><i class="bi bi-calendar"></i> <span id="selected-date">2023-03-14</span></button>
        </div>
        <!-- End Date Picker -->




        <li class="nav-item dropdown pe-3">

          <a class="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
            <span class="d-none d-md-block dropdown-toggle ps-2">SuperManagement</span>
          </a><!-- End Profile Iamge Icon -->

          <ul class="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
            <li class="dropdown-header">
              <h6>SuperManagement</h6>
              <span>Web Designer</span>
            </li>
            <li>
              <hr class="dropdown-divider">
            </li>

            <li>
              <a class="dropdown-item d-flex align-items-center" href="/index.html">
                <i class="bi bi-person"></i>
                <span>個人主頁</span>
              </a>
            </li>


            <li>
              <hr class="dropdown-divider">
            </li>

            <li>
              <a class="dropdown-item d-flex align-items-center" href="#" onclick="cookiedeleter()">
                <i class="bi bi-box-arrow-right"></i>
                <span>登出</span>
              </a>
            </li>

          </ul><!-- End Profile Dropdown Items -->
        </li><!-- End Profile Nav -->

      </ul>
    </nav><!-- End Icons Navigation -->

  </header><!-- End Header -->

<main id="main" class="main">
     <div class="pagetitle">
      <h1>股票交易</h1>
      <nav>
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="index.html">股票</a></li>
          <li class="breadcrumb-item active">交易訂單</li>
        </ol>
      </nav>
    </div><!-- End Page Title -->
    <section class="section dashboard ">
      <div class="row">
           <!-- Left side columns -->
        <div class="col-lg-8">
          <div class="row">
              
            <!-- Reports -->
            <div class="col-12">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">股票下單</h5>

<form id="stockOrderForm" class="stock-form">
    <div class="form-group">
    <label class="trade-type-label" for="tradeType">交易類型</label>
    <div class="trade-type-options">
      <div class="trade-type-option">
        <span class="trade-type-dot" data-value="buy"name="buy" id="B" onClick= selbuy(1)></span>
        <a data-value="buy">買進</a>
      </div>
      <div class="trade-type-option">
        <span class="trade-type-dot" data-value="sell"name="buy" id="S" onClick= selbuy(2)></span>
        <a data-value="sell">賣出</a>
      </div>
      <div class="trade-type-option">
        <span class="trade-type-dot" data-value="drop"name="buy" id="P" onClick= selbuy(3)></span>
        <a data-value="drop" class="trade-type-text">平倉</a>
      </div>
    </div>
  </div>
    <!--股票代碼-->
<div class="form-group">
    <label for="stockCode">股票代碼</label>
    <div class="input-group">
      <input type="text" class="stock-code-form-control " id="stockCode" placeholder="请输入股票代码" required >
        <div class="input-group-append">
        <button type="button" class="btn btn-primary" onclick="queryStock()">查询</button>
      </div>
      <div class="input-group-append">
        <span id="stockPrice" class="stock-price">$0</span>
          <span id="stockname" class="stock-price">| 股票名稱</span>
      </div>
    </div>
  </div>
    <!--end股票代碼-->
  <div class="form-group">
    <label for="quantity">股數</label>
    <input type="number" class="form-control" id="quantity" placeholder="请输入股数" required onchange="calculateTotalPrice()">
  </div>
  <div class="form-group">
    <label for="stock_Price">市價價格</label>
    <input type="number" class="form-control" id="stock_Price" placeholder="" readonly>
  </div>
 <div class="form-group">
    <label for="totalPrice">總價格</label>
    <input type="number" class="form-control" id="totalPrice" placeholder="" readonly>
  </div>
  <button type="button" class="btn btn-primary" onclick="sender()">提交訂單</button>
</form>


                 
                </div>

              </div>
            </div><!-- End Reports -->
              
            </div>
          </div><!--End left side column-->
            
<!-- Right side columns -->
<div class="col-lg-4">
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">賬戶資訊</h5>
      <table class="table">
        <tbody>
          <tr>
            <td class="highlight">現金</td>
            <td class="align-right highlight" id="cash">$100</td>
          </tr>
          <tr>
            <td class="highlight">總資產</td>
            <td class="align-right highlight" id="totalcash">$50</td>
          </tr>
          <tr>
            <td class="highlight">委託單資金總價值</td>
            <td class="align-right highlight" id="entrustcash">$50</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
    <div class="card">
    <div class="card-body">
      <h5 class="card-title">資產一覽</h5>
      <div id="piechart" style="width: 600px; height: 315px;"></div>
    </div>
  </div>
</div>

<!-- End Right side columns -->
</div><!-- End Right side columns -->

        
    </section>
    </main>

  <a href="#" class="back-to-top d-flex align-items-center justify-content-center"><i class="bi bi-arrow-up-short"></i></a>

  <!-- Vendor JS Files -->
  <script src="CSS/assets/vendor/apexcharts/apexcharts.min.js"></script>
  <script src="CSS/assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="CSS/assets/vendor/chart.js/chart.umd.js"></script>
  <script src="CSS/assets/vendor/echarts/echarts.min.js"></script>
<script  type="text/javascript" src="JS/tradePage.js"></script>

</body>

</html>`;
// 将HTML发送给客户端
  res.send(html);
});

//回測頁面
app.get("/backtest.html", (req, res) => {
  // 在这里构建HTML頁面的内容
  const html = 
    `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">

  <title>回溯之旅-個人主頁</title>
  <meta content="" name="description">
  <meta content="" name="keywords">


  <!-- Google Fonts -->
  <link href="https://fonts.gstatic.com" rel="preconnect">
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i" rel="stylesheet">

  <!-- Vendor CSS Files -->
  <link href="CSS/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="CSS/assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">

<!--    icons 超鏈接-->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
  <!-- Template Main CSS File -->
  <link href="CSS/style.css" rel="stylesheet">
    
<!-- 引入jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- 引入DataTables的CSS文件 -->
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.25/css/jquery.dataTables.min.css">

 <!--引入DataTables的JS文件 -->
<script src="https://cdn.datatables.net/1.10.25/js/jquery.dataTables.min.js"></script>
<!-- 引入Bootstrap Datepicker库的CSS和JavaScript文件 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/css/bootstrap-datepicker.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/js/bootstrap-datepicker.min.js"></script>
</head>

<body>

    <!-- ======= Header ======= -->
  <header id="header" class="header fixed-top d-flex align-items-center">

    <div class="d-flex align-items-center justify-content-between">
      <a href="index.html" class="logo d-flex align-items-center">
        <img src="img/logo.png" alt="">
        <span class="d-none d-lg-block">回溯之旅</span>
      </a>
      
    </div><!-- End Logo -->


    <nav class="header-nav ms-auto">
      <ul class="d-flex align-items-center">

        <li class="nav-item d-block d-lg-none">
          <a class="nav-link nav-icon search-bar-toggle " href="#">
            <i class="bi bi-search"></i>
          </a>
        </li><!-- End Search Icon-->
         
          
          <!--dropdown page function-->
         <li class="nav-item dropdown pe-3">

          <a class="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
            <span class="d-none d-md-block dropdown-toggle ps-2">页面</span>
            </a>

          <ul class="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
            <li>
              <a class="dropdown-item d-flex align-items-center" href="index.html">
                <i class="bi bi-houses"></i>
                <span>主頁</span>
              </a>
            </li>
            <li>
              <hr class="dropdown-divider">
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center" href="trade.html">
                <i class="bi bi-currency-exchange"></i>
                <span>交易</span>
              </a>
            </li>
              <li>
              <hr class="dropdown-divider">
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center" href="backtest.html">
                <i class="bi bi-clipboard2-data"></i>
                <span>回測</span>
              </a>
            </li>
          </ul>
        </li>



        <li class="nav-item dropdown pe-3">

          <a class="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
            <span class="d-none d-md-block dropdown-toggle ps-2">SuperManagement</span>
          </a><!-- End Profile Iamge Icon -->

          <ul class="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
            <li class="dropdown-header">
              <h6>SuperManagement</h6>
              <span>Web Designer</span>
            </li>
            <li>
              <hr class="dropdown-divider">
            </li>

            <li>
              <a class="dropdown-item d-flex align-items-center" href="/index.html">
                <i class="bi bi-person"></i>
                <span>個人主頁</span>
              </a>
            </li>


            <li>
              <hr class="dropdown-divider">
            </li>

            <li>
              <a class="dropdown-item d-flex align-items-center" href="#" onclick="cookiedeleter()">
                <i class="bi bi-box-arrow-right"></i>
                <span>登出</span>
              </a>
            </li>

          </ul><!-- End Profile Dropdown Items -->
        </li><!-- End Profile Nav -->

      </ul>
    </nav><!-- End Icons Navigation -->

  </header><!-- End Header -->

<main id="main" class="main">
     <div class="pagetitle">
      <h1>回測頁面</h1>
      <nav>
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="backtest.html">回測</a></li>
          <li class="breadcrumb-item active">回測策略</li>
        </ol>
      </nav>
    </div><!-- End Page Title -->
    
    <section class="section dashboard ">
      <div class="row">
<!-- 執行條件的容器 -->
<div class="execution-condition row">
    <div class="col-lg-2 col-md-2 col-sm-1 col-xs-2">
        <label for="executionFrequency">執行頻率</label>
        <select class="form-control" id="executionFrequency">
          <option value="daily">天</option>
          <option value="weekly">週(5天)</option>
          <option value="monthly">月(30天)</option>
          <!-- 添加其他執行頻率選項 -->
        </select>
      </div>
      <div class="col-lg-2 col-md-2 col-sm-1 col-xs-2">
    <label for="executionStock">執行股票</label>
    <div class="input-group">
        <input style="border-radius:4px"type="text" class="form-control" id="executionStock" name="executionStock" placeholder="请输入執行股票">
        <div class="input-group-append">
            <button class="btn btn-primary" type="button" id="searchButton" style="margin-left: 15px" onclick="queryStock()">查询</button>
            <span id="stockname"></span>
        </div>
    </div>
</div>

      <div class="col-xs-4" style='margin-top: 10px'>
        <label for="startDate">開始日期</label>
        <div class="date-picker">
  <button class="btn btn-outline-secondary" id="backtest_start_calendar" type="button" title="選擇系統時間"><i class="bi bi-calendar"></i> <span id="backtest_start_date">2023-03-14</span></button>
</div>
      </div>
      <div class="col-xs-4" style='margin-top: 5px'>
        <label for="endDate">結束日期</label>
        <div class="date-picker">
  <button class="btn btn-outline-secondary" id="backtest_end_calendar" type="button" title="選擇系統時間"><i class="bi bi-calendar"></i> <span id="backtest_end_date">2023-03-14</span></button>
</div>
      </div>
    </div>
   <!-- 買進條件cardbody-->
    <div class="col-lg-6 col-md-6 col-sm-1 col-xs-2" style='margin-top: 10px'>
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">買進條件</h5>

  <!-- 指標選擇 -->
  <div class="buyin_indicator">
    <label for="indicator">指標</label>
      <i id="indicatorTooltip" class="bi bi-question-circle" data-bs-toggle="tooltip" data-bs-placement="top" title="默认的介绍说明"></i>
    <select class="form-control" id="buyin_indicator">
      <option value="default_indicator">選擇指標</option>
      <option value="indicator1">KD</option>
      <option value="indicator2">RSI</option>
      <option value="indicator3">MA</option>
        <option value="indicator4">MACD</option>
      <!-- 添加其他指標選項 -->
    </select>
  </div>
<!-- 根據選擇的指標顯示對應的參數輸入框 -->
<div class="buyin_indicator-parameters">
  <!-- 在這裡根據指標選擇顯示參數輸入框 -->
</div>
  <!-- 執行條件的規則下拉選單和相應的輸入框 -->
  <div class="buyin_rule">
      <label for="rule">規則</label>
    <select class="form-control" id="buyin_executionRule">
    <option value="default_rule">選擇規則</option>
      <option value="rule1">向上穿越</option>
      <option value="rule2">向下穿越</option>
      <option value="rule3">大於</option>
      <option value="rule4">小於</option>
      <option value="rule5">等於</option>
      <!-- 添加其他執行條件的規則選項 -->
    </select>
      <div class="rule" style='margin-top: 3px'>
    <input type="text" class="form-control" id="buyin_executionRuleInput" placeholder="輸入设定数值">
  </div>
  </div>
                  </div>
        </div>

    </div>
    <!--end賣出條件cardbody-->
<!--賣出條件card body-->
    <div class="col-lg-6 col-md-6 col-sm-1 col-xs-2" style='margin-top: 10px'>
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">賣出條件</h5>

  <!-- 指標選擇 -->
  <div class="buyout_indicator">
    <label for="indicator">指標</label>
      <i id="buyoutIndicatorTooltip" class="bi bi-question-circle" data-bs-toggle="tooltip" data-bs-placement="top" title="默认的介绍说明"></i>
    <select class="form-control" id="buyout_indicator">
      <option value="default_indicator">選擇指標</option>
      <option value="indicator1">KD</option>
      <option value="indicator2">RSI</option>
      <option value="indicator3">MA</option>
        <option value="indicator4">MACD</option>
      <!-- 添加其他指標選項 -->
    </select>
  </div>
<!-- 根據選擇的指標顯示對應的參數輸入框 -->
<div class="buyout_indicator-parameters">
  <!-- 在這裡根據指標選擇顯示參數輸入框 -->
</div>
  <!-- 執行條件的規則下拉選單和相應的輸入框 -->
  <div class="buyout_rule">
      <label for="rule">規則</label>
    <select class="form-control" id="buyout_executionRule">
    <option value="default_rule">選擇規則</option>
      <option value="rule1">向上穿越</option>
      <option value="rule2">向下穿越</option>
      <option value="rule3">大於</option>
      <option value="rule4">小於</option>
      <option value="rule5">等於</option>
      <!-- 添加其他執行條件的規則選項 -->
    </select>
      <div class="rule" style='margin-top: 3px'>
    <input type="text" class="form-control" id="buyout_executionRuleInput" placeholder="輸入设定数值">
  </div>
  </div>
                  </div>
        </div>

    </div>
<!--end賣出條件cardbody-->
        </div>
    </section>

<section class="section dashboard">
  <div class="row">
    <div class="col-12">
      <div class="backtest_button">
        <button type="submit" class="btn btn-primary">執行回測</button>
      </div>
    </div>
  </div>
</section>

</main>


  <a href="#" class="back-to-top d-flex align-items-center justify-content-center"><i class="bi bi-arrow-up-short"></i></a>

  <!-- Vendor JS Files -->
  <script src="CSS/assets/vendor/apexcharts/apexcharts.min.js"></script>
  <script src="CSS/assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="CSS/assets/vendor/chart.js/chart.umd.js"></script>
  <script src="CSS/assets/vendor/echarts/echarts.min.js"></script>
  <script  type="text/javascript" src="JS/backtestPage.js"></script>

</body>

</html>
`;
// 将HTML发送给客户端
  res.send(html);
});

//404頁面
app.get("/404.html", (req, res) => {
  // 在这里构建HTML頁面的内容
  const html = 
    `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">

  <title>回溯之旅-Error</title>
  <meta content="" name="description">
  <meta content="" name="keywords">

  <!-- Google Fonts -->
  <link href="https://fonts.gstatic.com" rel="preconnect">
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i" rel="stylesheet">

  <!-- Vendor CSS Files -->
  <link href="CSS/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="CSS/assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">

  <!-- Icons 超链接 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">

  <!-- Template Main CSS File -->
  <link href="CSS/style.css" rel="stylesheet">

  <!-- 引入jQuery -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

  <!-- 引入DataTables的CSS文件 -->
  <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.25/css/jquery.dataTables.min.css">

  <!-- 引入DataTables的JS文件 -->
  <script src="https://cdn.datatables.net/1.10.25/js/jquery.dataTables.min.js"></script>
<style>
/* Connection Timeout Section */
#connection-timeout {
 margin-top: 70px;
  padding: 60px 0;
}

.timeout-message {
  text-align: center;
  margin-bottom: 30px;
}

.timeout-message h1 {
  font-size: 36px;
  font-weight: 600;

}

.timeout-message p {
  font-size: 18px;
 
  margin-bottom: 10px;
}

.timeout-message ul {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.timeout-message li {
  font-size: 16px;
  margin-bottom: 5px;
}


    
</style>
</head>

<body>

  <!-- ======= Header ======= -->
  <header id="header" class="header fixed-top d-flex align-items-center">
    <div class="d-flex align-items-center justify-content-between">
      <a href="/login.html" class="logo d-flex align-items-center">
        <img src="img/logo.png" alt="">
        <span class="d-none d-lg-block">回溯之旅</span>
      </a>
    </div><!-- End Logo -->
  </header>

  <!-- ======= Connection Timeout Section ======= -->
  <section id="connection-timeout">
    <div class="container">
      <div class="timeout-message">
        <h1>無法訪問該網站</h1>
        <p>無法找到'回溯之旅'的服務器IP地址。</p>
        <p>可能連接超時。</p>
        <p>請嘗試一下操作：</p>
          <li>檢查你的網絡連接。</li>
          <li>檢查代理、防火墻和DNS配置。</li>
        <li>點擊重新登錄</li>
        <a href="/login.html" class="login-link">重新登錄</a>
      </div>
    </div>
  </section>

</body>

</html>
`;
// 将HTML发送给客户端
  res.send(html);
});

//成功頁面
app.get("/success.html", (req, res) => {
  // 在这里构建HTML頁面的内容
  const html =
        `<!DOCTYPE html>
        <html lang="en">
        <head>
          <title>LINE帳號綁定</title>
          <style>
          /* Connection Timeout Section */
          #connection-timeout {
           margin-top: 70px;
            padding: 60px 0;
          }

          .timeout-message {
            text-align: center;
            margin-bottom: 30px;
          }

          .timeout-message h1 {
            font-size: 36px;
            font-weight: 600;

          }

          .timeout-message p {
            font-size: 18px;
           
            margin-bottom: 10px;
          }  
          </style>
        </head>

        <body>
          <!-- ======= Header ======= -->
          <header>
          </header>
          <!-- ======= Connection Timeout Section ======= -->
          <section id="connection-timeout">
            <div class="container">
              <div class="timeout-message">
                <h1>LINE帳號以成功綁定</h1>
                <p>關閉頁面返回Line重新登入以繼續使用模擬交易回測功能</p>
              </div>
            </div>
          </section>
        </body>

        </html>`;
// 将HTML发送给客户端
  res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen (PORT) ;