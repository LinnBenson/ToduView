# 视图渲染器

### 快捷安装
```
vendor/bin/todu plugin install:LinnBenson/ToduView
```

#### 主插件 system/plugin/ToduView/
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

#### 语法声明
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

#### 预设组件
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