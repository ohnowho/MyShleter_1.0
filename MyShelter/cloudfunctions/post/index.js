// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;
const post = {};
post.add = async function (tablename,query) {
  try {
    return await db.collection(tablename).add({
      // data 字段表示需新增的 JSON 数据
      data: query
    });
  } catch (e) {
    console.error('add collection err',e)
    return e;
  }
};
post.update = async function (tablename, query) {
  try {
    return await db.collection(tablename).where(query.query)
      .update({
        data: query.item,
      })
  } catch (e) {
    console.error(e)
  }
};
// 云函数入口函数
exports.main = async (event, context) => {
  // const wxContext = cloud.getWXContext()
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
  console.log('event', event);
  // console.log('context', context);
  const { userInfo, tablename, query, method } = event;
  let res = {};
  res.err_msg = '';
  if(!tablename){
    res.err_msg = 'tablename is must';
    return res;
  }
  res = await post[method](tablename, query);
  console.log('res final',res);
  // switch(method) {
  //   case 'add':
  //     res = await add(tablename, query);
  //     break;
  //   default:
  //     console.log('method',method);
  // }
  return res;
}