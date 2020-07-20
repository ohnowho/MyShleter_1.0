const db = wx.cloud.database();
const _ = db.command;

function dataPost(data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'post',
      data: data,
      success: res => {
        resolve(res);
      },
      fail: err => {
        console.error('[云函数] [post] 调用失败', err)
        reject(err);
      }
    });
  });
}
function dataGet(params) {
  return new Promise((resolve, reject) => {
    db.collection(params.tablename).where(params.query).skip(params.skip || 0).limit(20) // 前端最多为 20 条
      .get()
      .then(res => {
        resolve(res);
    })
    .catch(err => {
      console.error(err)
      reject(err);
    });
  });
}
function dataGetCount(params) {
  return new Promise((resolve, reject) => {
    db.collection(params.tablename).where(params.query).count()
      .get()
      .then(res => {
        resolve(res);
    })
    .catch(err => {
      console.error(err)
      reject(err);
    });
  });
}

function getLogin() {
  return new Promise((resolve, reject) => {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        resolve(res);
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        reject(err);
      }
    });
  });
}

export { dataPost, getLogin, dataGet, dataGetCount};