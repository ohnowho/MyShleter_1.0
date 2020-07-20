// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

/**
 * 这个示例将经自动鉴权过的小程序用户 openid 返回给小程序端
 * 
 * event 参数包含
 * - 小程序端调用传入的 data
 * - 经过微信鉴权直接可信的用户唯一标识 openid 
 * 
 */
const crypto = require('crypto');
const cloud = require('wx-server-sdk');
cloud.init({
  traceUser: true,
  // env: ''
});
const db = cloud.database();
const _ = db.command;
function encrypt(openId){
  var md5 = crypto.createHash('md5');//加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
  md5.update(openId);
  var code = md5.digest('hex');  //加密后的值d
  console.log("加密的结果：" + code);
  return code
}
function getUser(code) {
  console.log('getUser2', code);
  return new Promise((resolve, reject) => {
    console.log('test2');
    let query = {};
    query.openid = code;
    db.collection('users').where(query).get()
    .then(res => {
      console.log('res', res);
      if(!res.data) {
        reject('err');
      }
      resolve(res.data[0] || '');
    });
  });
}
function addUser(user) {
  console.log('addUser', user);
  return new Promise((resolve, reject) => {
    db.collection('users').add({
      // data 字段表示需新增的 JSON 数据
      data: user,
      success(res) {
        // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
        resolve(res)
      },
      fail: function(err) {
        console.log(err);
        reject(err);
      }
    });
  });
}
async function getRes(code, userInfo) {
  console.log('getRes',code);
  let user = await getUser(code).catch(err => {
    console.log('err',err);
  });
  if(!user){
    user = {
      openid: code,
      // nick_name: userInfo.nickName,
      // avatar_url: userInfo.avatarUrl,
      date: new Date(),
      favorates: '',
      permit: 'default',
    };
    let msg = await addUser(user).catch(err => {
      console.log('err', err);
      return err;
    });
  }
  console.log('user',user);
  return user;
}
exports.main = (event, context) => {
  console.log('event',event)
  console.log('context',context)

  // 可执行其他自定义逻辑
  // console.log 的内容可以在云开发云函数调用日志查看

  let openid = 'testopenid';
  let userInfo = event.userInfo;
  console.log('userInfo',userInfo);
  if (!openid){
    console.log('缺少OpenID');
    return null
  }
  let code = encrypt(openid);
  let res = getRes(code,userInfo);
  // res.avatar_url = userInfo.avatarUrl;
  // res.nick_name = userInfo.nickName;
  return res
}
