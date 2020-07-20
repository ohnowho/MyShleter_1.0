const { CONFIG } = require('./config.js');
const sdkkey = CONFIG.sdkkey;
const sdksecret = CONFIG.sdksecret;
const QQMapWX = require('./qqmap-wx-jssdk.js');
// 实例化API核心类
const qqmapsdk = new QQMapWX({
    key: sdkkey // 必填
});
function parsePolyline(coors) {
  //坐标解压（返回的点串坐标，通过前向差分进行压缩）
  let pl=[];
  var kr = 1000000;
  for (let i = 2; i < coors.length; i++) {
    coors[i] = Number(coors[i - 2]) + Number(coors[i]) / kr;
  }
  //将解压后的坐标放入点串数组pl中
  for (let i = 0; i < coors.length; i += 2) {
    pl.push({ latitude: coors[i], longitude: coors[i + 1] })
  }
  return pl;
}

function reverseGeoCoder(location) {
  return new Promise((resolve, reject) => {
    qqmapsdk.reverseGeocoder({
      location: location,
      sig: sdksecret,
      success: function (res) {

        resolve(res);
      },
      fail: function (error) {
        console.error(error);
        reject(error);
      },
    });
  });
}

function calculateDistance(option){
    return new Promise((resolve, reject) => {
      qqmapsdk.calculateDistance({
        mode: option.mode,//可选值：'driving'（驾车）、'walking'（步行）、'bicycling'（骑行），不填默认：'driving',可不填
        //from参数不填默认当前地址
        from: option.start,
        to: option.end,
        sig: sdksecret,
        success: function (res) {
          resolve(res.result);
        },
        fail: function (error) {
          console.error(error);
          reject(error);
        },
      });
    });
  }

  function sdkDirection(option) {
    return new Promise((resolve, reject) => {
      qqmapsdk.direction({
        mode: option.mode,//可选值：'driving'（驾车）、'walking'（步行）、'bicycling'（骑行），不填默认：'driving',可不填
        //from参数不填默认当前地址
        from: option.start,
        to: option.end,
        sig: sdksecret,
        success: function (res) {
          resolve(res.result.routes);
        },
        fail: function (error) {
          console.error(error);
          reject(error);
        },
      });
    });
  }
  function fillMarker(marker,i) {
    let item = {};
      item.id = i;
      item.longitude = parseFloat(marker.longitude);
      item.latitude = parseFloat(marker.latitude);
      let callout = {};
      callout.content = marker.name;
      callout.fontSize = '12';
      callout.borderWidth = '1';
      callout.borderRadius = '10px';
      callout.color = '#000';
      callout.borderColor = '#fff';
      callout.bgColor = '#fff';
      callout.display = 'BYCLICK';
      callout.padding = '10px';
      callout.textAlign = 'center';
      item.iconPath = '../../images/tent.png';
      item.anchor = {
        x: 0.5,
        y: 1,
      };
      item.height = 36;
      item.width = 36;
      item.zIndex = 2;
      if(marker.min > 0){
        item.iconPath = '../../images/end.png';
        callout.content = '最快到达';
        if (marker.min === 1){
          callout.content = '步行最快到达';
        }
        if (marker.min === 2) {
          callout.content = '驾车最快到达';
        }
      }
      item.callout = callout;
      return item;
  }

  export { parsePolyline,reverseGeoCoder , calculateDistance,sdkDirection, fillMarker};