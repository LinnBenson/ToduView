# 视图渲染器

### 快捷安装
```
vendor/bin/todu plugin install:LinnBenson/ToduView
```

### 主插件 system/plugin/ToduView/
###### plugin( 'ToduView' );
- 渲染视图
  ```
  $plugin->render( [string]:视图文件, [array]:视图数据, [...mixed]:其他参数 );
  ```
  - return [Render]:视图渲染对象
- 显示视图
  ```
  $plugin->show();
  ```
  - return [string]:渲染后的视图内容

### 语法声明
- 导入组件
  ```
  // x-_组件名 则从视图目录中正常调用, x-组件名 则从视图目录下的 module 中调用
  // 如果不设置，组件的默认 slot 为组件名
  <x-Example slot="ExampleBind" val1="值1" val2="值2">
    <slot-ExampleBind:name1>
        值a
    </slot-ExampleBind:name1>
    <slot-ExampleBind:name2>
        值b
    </slot-ExampleBind:name2>
    组件内容
  </x-Example>

  // 上述示例组件将传递值:
  :val1 = "值1";
  :val2 = "值2";
  :name1 = "值a";
  :name2 = "值b";
  :children = "组件内容";
  => 组件内可通用 {{:变量名( '{{$this}} 存在', '不存在' )}} 方式调用

  // 魔术检查:
  {{:name1( 'Not Found' )}}
  => 以上表达示在 name1 存在时输出 '值a'，否则输出 'Not Found'
  ```
- 插入子视图
  ```
  {{view( '子视图文件', [array]:视图数据 )}}
  // 视图数据即使为空，也会继承父视图的数据
  ```
- 其它语法
  ```
  {{!!****!!}} 不转义输出
  {{--****--}} 移除注释
  {{}} 转义输出
  @php **** @endphp 原生 PHP 代码
  @if ** @elseif ** @else ** @endif 条件语句
  @foreach ** @endforeach 循环语句
  @for ** @endfor 循环语句
  @continue / @break 循环控制
  @while ** @endwhile 循环语句
  @isset ** @endisset 变量存在判断
  @empty ** @endempty 变量为空判断
  @switch ** @case: ** @default: ** @endswitch 条件语句
  @auth ** @endauth 已认证用户判断
  @guest ** @endguest 未认证用户判断
  @admin ** @endadmin 管理员用户判断
  ```
- 附加的视图数据
  ```
  请求对象: {{$request}} // Todu\Handler\Request
  语言标识: {{$lang}} // string
  主题名称: {{$themeName}} // string
  主题数据: {{$theme}} // array
  请求 ID: {{$tid}} // string
  插件对象: {{$plugin}} // Plugin\ToduView
  翻译函数: {{$t( '语言键值', [array]:替换内容 )}} // string
  版本参数: {{$v}} // string
  资源调用函数: {{$assets( '资源路径' )}} // string
  视图归属: {{$view}} // string
  ```

### 预设组件
- HTML 框架
  ```
  <x-todu.index
    title="页面标题"
    icon="页面图标 URL"
    keywords="页面关键字, 多个用逗号分隔"
    description="页面描述"
  >
    <slot-todu.index:head>
        <!-- 头部内容 -->
    </slot-todu.index:head>
    <slot-todu.index:body>
        <!-- 主体内容 -->
    </slot-todu.index:body>
    <!--可选脚本内容-->
  </x-todu.index>
  ```
- 按钮组件
  ```
  <x-button
    id="按钮 ID"
    class="按钮类名"
    style="行内样式"
    type="按钮类型"
    icon="图标类名"
    onClick="点击事件"
    href="链接地址"
    target="_blank|_self|_parent|_top" // 链接打开方式
    size="small|big|default" // 按钮大小 默认 default
    color="0|1|2|3|4|5|6" // 按钮颜色 默认 3
    title="按钮标题"
  >按钮内容</x-button>
  ```
- 卡片组件
    ```
    <x-card
        id="按钮 ID"
        class="按钮类名"
        style="行内样式"
        status="open|close" // 卡片状态，不设置则不可调整
        color="0|1|2|3|4|5|6" // 卡片颜色 默认 6
        step="间距步进值" // 间距步进值 默认 8px
    >
        <slot-card:title>
            卡片标题
        </slot-card:title>
        <slot-card:right>
            添加标题右侧功能
            // 使用 <i class="***"></i> 添加右侧功能
        </slot-card:right>
        卡片内容
    </x-card>
    ```
- 布局组件
    ```
    <x-layout
        id="布局 ID"
        class="布局类名"
        style="行内样式"
        type="ordinary|row|list|fall|left|right" // 布局类型，默认 ordinary
        width="宽度值" // 宽度值 默认 80px
        gap="间距值" // 间距值 默认 8px
        count="显示数量" // 显示数量 默认 5
    >
        布局内容
    </x-layout>
    // 主框架使用的是 ul 标签，子元素请使用 li 标签包裹 ( 普通布局 可不遵守 )
    // 普通布局[ordinary] gap => 间距值
    // 行平分布局[row] count => 行数量, gap => 间距值
    // 列表布局[list] width => 最小宽度, gap => 间距值
    // 瀑布流布局[fall] count => 行数量, gap => 间距值
    // 左固定式双栏布局[left] width => 左侧宽度, gap => 间距值
    // 右固定式双栏布局[right] width => 右侧宽度, gap => 间距值
    ```

### JavaScript 功能支持
#### 全局函数
- 判断变量是否为空
  ```
  empty( [mixed]:变量 );
  ```
  - return [boolean]:变量是否为空
- 判断变量是否为 JSON
  ```
  is_json( [mixed]:变量 );
  ```
  - return [boolean]:变量是否为 JSON
- 判断变量是否为数组或者对象
  ```
  is_array( [mixed]:变量 );
  ```
  - return [boolean]:变量是否为数组或者对象
- 转换存储值
  ```
  toValue( [mixed]:变量, [boolean]:是否为存储 );
  ```
  - return [mixed]:转换后的存储字符串
- 查询本地存储
  ```
  get( [string]:键名 );
  ```
  - return [mixed]:查询到的存储值
- 设置本地存储
  ```
  set( [string]:键名, [mixed]:值 );
  ```
  - return [boolean]:设置是否成功
- 删除本地存储
  ```
  del( [string]:键名 );
  ```
  - return [boolean]:删除是否成功
- 判断变量是否为数字
  ```
  is_number( [mixed]:变量 );
  ```
  - return [boolean]:变量是否为数字
- 生成 UUID
  ```
  uuid();
  ```
  - return [string]:生成的 UUID 字符串
- 判断变量是否为 UUID
  ```
  is_uuid( [string]:变量 );
  ```
  - return [boolean]:变量是否为 UUID
- 转为时间格式
  ```
  toTime( [string]:时间 );
  ```
  - return [string]:00:00:00 格式时间
- 转为日期格式
  ```
  toDate( [string]:日期 );
  ```
  - return [string]:YYYY-MM-DD 格式日期
- 转为完整时间格式
  ```
  toDateTime( [string]:日期时间 );
  ```
  - return [string]:YYYY-MM-DD HH:MM:SS 格式日期时间
- 哈希一个参数
  ```
  h( [string]:参数 );
  ```
  - return [string]:哈希值
- 使用语言包翻译内容
  ```
  t( [string]:语言键值, [object]:替换内容 );
  ```
  - return [string]:翻译后的内容

#### Todu 核心
- 预设参数
  ```
  todu.init; [boolean]:是否已初始化
  todu.tid; [string]:请求 ID
  todu.view; [string|null]:视图标识
  todu.themeName; [string|null]:主题名称
  todu.lang; [string|null]:语言标识
  todu.entrance; [string|todu_view]:资源入口
  todu.server; [object]:服务器信息
  todu.theme; [object]:主题数据
  todu.text; [object]:语言包
  todu.user; [object|null]:用户信息 // 未登录则为 null
  todu.size; [object]:窗口尺寸 // { width: 窗口宽度, height: 窗口高度 }
  ```
- 同步服务器信息
  ```
  todu.synchronous( );
  ```
  - return [void]
- 同步缓存工具
  ```
  todu.cache( [string]:键名, [mixed]|false:值, [boolean]|false:是否写入 Cookie );
  // 只传入键名则为读取缓存，传入值则为写入缓存，传入值为 null|undefined 则为删除缓存
  ```
  - return [mixed]
- 用户登出
  ```
  todu.logout( [boolean]|false:是否刷新页面 );
  ```
  - return [void]
- 用户登录
  ```
  todu.login( [object]:用户信息, [string]:登录密钥, [boolean]|false:是否刷新页面 );
  ```
  - return [void]
- Web 连接工具
  ```
  todu.web( [string]:地址 )
  .progress( [function]:进度回调 ) // 可选，进度回调函数
  .headers( [object]:请求头 ) // 可选，设置请求头
  .data( [object]:请求数据 ) // 可选，设置请求数据
  .run( [function]:成功回调 ); // 执行成功回调函数
  .error( [function]:失败回调 ); // 可选，执行失败回调函数
  .timeout( [number]:超时时间 ); // 可选，设置超时时间，单位毫秒，默认 30000
  .load( [function]:加载回调 ); // 可选，执行前后回调函数
  .request( [string]|GET:请求方法, [boolean]|false:使用内部方法检查 ); // 开始执行请求
  .check(); // 可选，响应检查
  ```
  - return [void]

#### 视图工具
- 通知工具
  ```
  todu.unit.toast( [string]:消息内容, [boolean]|false:是否为错误类型, [number]|3000:显示时间 );
  ```
  - return [void]
- 加载动画
  ```
  todu.unit.loading( [array|boolean]:选择器|是否显示, [number]|false:显示时间 );
  // 选择器格式: [ '选择器', 是否显示 ] => 卡片加载动画
  // 传入 true|false 则为全屏加载动画
  ```
  - return [true]
- 弹出窗口
  ```
  todu.unit.popup( [string|jQuery]:窗口内容 ); // 支持传入链接格式: link:/view/page
  .id( [string]:窗口 id ); // 可选，绑定窗口 id，默认随机生成，绑定后窗口 id 为 Popup_[id]
  .icon( [string]:图标类名 ); // 可选，设置图标
  .title( [string]:标题内容 ); // 可选，设置标题内容
  .min( [boolean]|false:是否可最小化 ); // 可选，设置是否可最小化（ 设置为 true 则必须有 icon 图标 ）
  .max( [boolean]|false:是否可最大化 ); // 可选，设置是否可最大化
  .move( [boolean]|true:是否可拖动 ); // 可选，设置是否可拖动
  .close( [boolean]|true:是否显示关闭按钮 ); // 可选，设置是否显示关闭按钮
  .mask( [boolean]|false:是否显示遮罩 ); // 可选，设置是否显示遮罩
  .width( [string]:宽度值 ); // 可选，设置窗口宽度
  .height( [string]:最小高度值 ); // 可选，设置窗口高度
  .padding( [string]:内边距值 ); // 可选，设置内容内边距
  .button( [string]:按钮文本, [function]:点击回调 ); // 可选，添加底部按钮，回调函数第一个参数弹出窗口对象
  .show(); // 显示窗口
  .clear( [string]|null:窗口 id ); // 可选，清除弹出窗口
  .maximize( [string]|null:窗口 id ); // 最大化窗口
  ```
  - return [object]:弹出窗口对象
- 闪烁动画
  ```
  todu.unit.animation( [jQurey]:选择器, [string]:动画名称, [number]|180:动画时间 );
  ```
  - return [void]