## brower extension updata

用于非chrome插件市场的插件更新

### 使用方式

1. **安装beu**: `npm i -g beu`
2. **转换插件**: `beu <插件所在目录> <更新地址,需要https> <检查更新频率,秒>`
现在插件已经带有自动更新功能了
3. **更新插件**: 再次运行 `第2步`,并将生成的文件上传到更新地址中
*假如更新地址是`https://a.com`请确保`beu`生成的`files.json`可以通过`https://a.com/files.json`访问*

### 内部原理

1. 通过[service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)拦截和替换插件资源文件的请求 **所以无法更新`manifest.json`**
2. 每次插件资源请求时(打开浏览器(如果有background页面),options页面,popup页面)时如果达到检查更新频率就会检查并下载所有更新资源 **如果更新资源过大或者网络慢会引起卡顿**
3. `beu`命令会分析`manifest.json`找到所有的入口`background`、`popup`、`options`等，并引入sw-install.js(如果已经引入不会再次引入)
4. `beu`命令会计算插件目录中所有文件的md5并生成索引文件`files.json`,插件更新时通过`files.json`判断哪些资源需要更新

### 注意事项

1. 带自动更新的插件会造成本地修改刷新不生效，解决方法是在插件的任意页面打开chrome调试→Application→Service Workers→Unregister