# 应急避难所 - MyShelter

## 功能：
对北京，深圳，成都，广州 这4个城市的应急避难所数据进行了整合以及地理编码，能够在地图上找到能最快到达的应急避难所，并规划最快到达路径。


## MyShelter 微信小程序

- 云数据库: 一个既可在小程序前端操作，也能在云函数中读写的 JSON 文档型数据库
- 云函数: 在云端运行的代码，微信私有协议天然鉴权，开发者只需编写业务逻辑代码
- wxml: 结合Web元素和原生组件(比如地图)，和Vue风格类似的模板语言。 


─MyShelter
    │  project.config.json
    │
    ├─cloudfunctions
    │  ├─login
    │  │      index.js
    │  │      package-lock.json
    │  │
    │  └─post
    │          index.js
    │          package-lock.json
    │          package.json
    │
    └─miniprogram
        │  app.js
        │  app.json
        │  app.wxss
        │  sitemap.json
        │
        ├─images
        │
        ├─pages
        │  └─index
        │          index.js
        │          index.json
        │          index.wxml
        │          index.wxss
        │
        ├─style
        │      detail.wxss
        │      guide.wxss
        │      map.wxss
        │      profile.wxss
        │      search.wxss
        │
        └─utils
            │  config.js
            │  map_utils.js
            │  qqmap-wx-jssdk.js
            │  router.js
            │  shelters_utils.js
            │
            └─shelters_locations 各城市应急避难所坐标数组，用于计算直线距离

## GeoCoder 数据处理脚本

将原始数据进行整理，通过高德地图进行地理编码，导入云数据库。

├─GeoCoder
│  │  config.js
│  │  geocoder.js
│  │
│  ├─data
│  │      bj_shelters.json
│  │      cd_shelters.json
│  │      gz_shelters.json
│  │      sz_shelters.json
│  │
│  └─files
│          gz_origin_data.json
│          sz_origin_data.xlsx

## 数据来源：

- 成都市应急避难场所名录 http://www.chengdu.gov.cn/chengdu/smfw/csyjbn.shtm
- 北京市政务数据资源网 http://www.bjdata.gov.cn/
- 深圳市政府数据开放平台 http://opendata.sz.gov.cn/
- 广州市政府数据统一开放平台 https://data.gz.gov.cn/odweb/

## 参考文档：

- 高德地图Web服务API文档 https://lbs.amap.com/api/webservice/guide/api/georegeo
- 微信小程序官方文档 https://developers.weixin.qq.com/miniprogram/dev/api/
- 云开发文档 https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html