<?php

namespace Plugin\ToduView;

use Todu\Handler\Router;
use Todu\Helper\Debug;
use Todu\Helper\Tool;

    class Render {
        public $status = true; // 视图状态
        private $id; // 视图 ID
        private $file; // 视图文件
        private $data; // 视图数据
        private $type; // 视图类型
        private $parent; // 视图父级
        private $ascription; // 视图归属
        private $cache = true; // 缓存状态
        private $cachePath = ''; // 视图缓存路径
        private $load = ''; // 视图加载内容
        private $plugin; // 插件对象
        /**
         * 构造视图
         */
        public function __construct( $file, $data = [], $plugin, $type = 'view', $parent = null ) {
            $viewPath = config( 'todu.path.view' );
            $this->id = h( $file ); // 初始化唯一 ID
            $this->file = $file;
            if ( !file_exists( $file ) ) { $this->status = false; return; }
            $this->type = $type;
            $this->parent = $parent;
            $this->data = $data;
            $this->plugin = $plugin;
            // 鉴定归属
            if ( startsWith( $file, $viewPath ) ) {
                $this->id = h( $this->ascription );
                $ascription = str_replace( [ $viewPath, '.view.php', '.view.html', '.view.htm' ], '', $file );
                $this->ascription = explode( '/', trim( $ascription, '/' ) )[0];
            }
            if ( $this->type === 'module' ) { $this->cache = false; }
            $this->cachePath = inFolder( config( 'todu.path.cache' )."view/{$this->type}_{$this->id}.php" );
            // 检查父级
            if ( is_object( $this->parent ) ) {
                $this->ascription = $this->parent->ascription;
                if ( $type !== 'module' ) { $this->data = array_merge( $parent->data, $data ); }
            }
            // 加载视图
            $this->loadView();
        }
        /**
         * 加载视图
         */
        private function loadView() {
            if ( !config( 'app.debug' ) && $this->cache && file_exists( $this->cachePath ) ) {
                $this->load = file_get_contents( $this->cachePath );
            }else {
                $this->load = file_get_contents( $this->file );
                if ( in_array( $this->type, [ 'view', 'secondary', 'module' ] ) ) { $this->secondary(); }
                if ( in_array( $this->type, [ 'view', 'secondary' ] ) ) { $this->load = $this->module( $this->load ); }
                if ( in_array( $this->type, [ 'view' ] ) ) { $this->grammar(); }
                // 生成缓存
                if ( !config( 'app.debug' ) && $this->cache ) {
                    $cache = isset( $this->data['cache'] ) && is_array( $this->data['cache'] ) ? "<?php\n".'$cache = '.var_export( $this->data['cache'], true ).";\n?>\n" : '';
                    file_put_contents( $this->cachePath, $cache.$this->load );
                }
            }
        }
        /**
         * 检查二级视图
         */
        private function secondary() {
            $pattern = '/\{\{\s*view\s*\(\s*([\'"])([^\'"]+)\1\s*(?:,\s*(\[[^\]]*\]))?\s*\)\s*\}\}/s';
            $this->load = preg_replace_callback( $pattern, function ( $m ) {
                $viewName = $m[2]; $array = $m[3] ?? null;
                if ( $array ) {
                    $array = preg_replace(
                        '/^\[\s*/',
                        "[ 'request' => \$request, ",
                        $array
                    );
                } else {
                    $array = "[ 'request' => \$request ]";
                }
                return "{{!!view( '{$viewName}', {$array}, 'secondary', \$this )!!}}";
            }, $this->load );
        }
        /**
         * 检查视图引用模块
         */
        private function module( $code ) {
            return preg_replace_callback( '/<x-([\w\.]+)(?:\s+([^>]*))?>(.*?)<\/x-\1>/s', function( $module ) {
                // 模块名称
                $moduleName = startsWith( $module[1], '_' ) ? substr( $module[1], 1 ) : "module.{$module[1]}";
                /**
                 * 解析模块参数
                 */
                $parameter = [];
                // value="***"
                preg_match_all( '/(\w+)="(.*?)"/', $module[2], $attrMatches, PREG_SET_ORDER );
                foreach ( $attrMatches as $attr ) { $parameter[$attr[1]] = $attr[2]; }
                // Children
                preg_match( '/<x-([\w\.]+)(?:\s+([^>]*))?>(.*?)<\/x-\1>/s', $module[3] );
                $parameter['children'] = $module[3];
                // <x-solt-***:***> 标签内容
                $slotName = $parameter['slot'] ?? $module[1];
                unset( $parameter['slot'] );
                preg_match_all(
                    '/<slot-'.preg_quote( $slotName, '/' ).':(\w+)>(.*?)<\/slot-'.preg_quote( $slotName, '/' ).':\1>/s',
                    $parameter['children'], $childMatches, PREG_SET_ORDER
                );
                foreach ( $childMatches as $child ) { $parameter[$child[1]] = $child[2]; }
                /**
                 * 移除 slot 子内容标签
                 */
                $parameter['children'] = preg_replace(
                    '/<slot-'.preg_quote( $slotName, '/' ).':(\w+)>(.*?)<\/slot-'.preg_quote( $slotName, '/' ).':\1>/s',
                    '', $parameter['children']
                );
                // 加载模块内容
                $view = view( $moduleName, $parameter, 'module', $this );
                // 魔术方法
                preg_match_all(
                    '/\{\{\s*:\s*([A-Za-z0-9_]+|\*+)\s*\(\s*(.*?)\s*\)\s*\}\}/s',
                    $view, $m, PREG_SET_ORDER
                );
                foreach( $m as $match ) {
                    $original = $match[0];
                    $key = $match[1];
                    $params = trim( $match[2] );
                    preg_match_all( "/'([^']*)'/", $params, $p );
                    $args = $p[1];
                    if ( $params === '' ) { $args = [ '{{$this}}', '' ]; }
                    if ( count( $args ) === 1 ) { $args[] = ''; }
                    $view = str_replace( $original, isset( $parameter[$key] ) && ( !empty( $parameter[$key] ) || $parameter[$key] === 0 || $parameter[$key] === '0' ) ? str_replace( '{{$this}}', $parameter[$key], $args[0] ) : $args[1], $view );
                }
                // 返回视图
                return $this->module( $view );
            }, $code );
        }
        /**
         * 检查视图语法
         */
        private function grammar() {
            $code = $this->load;
            // {{!!****!!}} 不转义输出
            $code = preg_replace( '/\{\{\!\!(.+?)\!\!\}\}/s', '<?php echo $1; ?>', $code );
            // {{--****--}} 移除注释
            $code = preg_replace( '/\{\{\-\-(.+?)\-\-\}\}/s', '', $code );
            // {{:****}} 移除模块参数
            $code = preg_replace( '/\{\{\s*:\s*(.+?)\s*\}\}/s', '', $code );
            // {{****}} 转义输出
            $code = preg_replace( '/\{\{(.+?)\}\}/s', '<?php echo htmlspecialchars( toString( $1 ), ENT_QUOTES, \'UTF-8\' ); ?>', $code );
            // @php **** @endphp 原生 PHP 代码
            $code = preg_replace( '/@php(.*?)@endphp/s', '<?php $1 ?>', $code );
            // @if ** @elseif ** @else ** @endif 条件语句
            $code = preg_replace( '/@if\s*\((.*)\)\s*$/m', '<?php if ($1): ?>', $code );
            $code = preg_replace( '/@elseif\s*\((.*)\)\s*$/m', '<?php elseif ($1): ?>', $code );
            $code = preg_replace( '/@else\s*$/m', '<?php else: ?>', $code );
            $code = preg_replace( '/@endif\s*$/m', '<?php endif; ?>', $code );
            // @foreach ** @endforeach 循环语句
            $code = preg_replace( '/@foreach\s*\((.*?)\)/s', '<?php foreach ( $1 ): ?>', $code );
            $code = preg_replace( '/@endforeach/s', '<?php endforeach; ?>', $code );
            // @for ** @endfor 循环语句
            $code = preg_replace( '/@for\s*\((.*?)\)/s', '<?php for ( $1 ): ?>', $code );
            $code = preg_replace( '/@endfor/s', '<?php endfor; ?>', $code );
            // @continue / @break 循环控制
            $code = preg_replace( '/@continue/s', '<?php continue; ?>', $code );
            $code = preg_replace( '/@break/s', '<?php break; ?>', $code );
            // @while ** @endwhile 循环语句
            $code = preg_replace( '/@while\s*\((.*?)\)/s', '<?php while ( $1 ): ?>', $code );
            $code = preg_replace( '/@endwhile/s', '<?php endwhile; ?>', $code );
            // @isset ** @endisset 变量存在判断
            $code = preg_replace( '/@isset\s*\((.*?)\)/s', '<?php if ( isset( $1 ) ): ?>', $code );
            $code = preg_replace( '/@endisset/s', '<?php endif; ?>', $code );
            // @empty ** @endempty 变量为空判断
            $code = preg_replace( '/@empty\s*\((.*?)\)/s', '<?php if ( empty( $1 ) ): ?>', $code );
            $code = preg_replace( '/@endempty/s', '<?php endif; ?>', $code );
            // @switch ** @case: ** @default: ** @endswitch 条件语句
            $code = preg_replace( '/@switch\s*\((.*?)\)/s', '<?php switch ( $1 ): ?>', $code );
            $code = preg_replace( '/@case\s*([^:]+)\:/', '<?php case $1: ?>', $code );
            $code = preg_replace( '/@default\:/s', '<?php default: ?>', $code );
            $code = preg_replace( '/@endswitch/s', '<?php endswitch; ?>', $code );
            // @auth ** @endauth 已认证用户判断
            $code = preg_replace( '/@auth/s', '<?php if ( $request->user ): ?>', $code );
            $code = preg_replace( '/@endauth/s', '<?php endif; ?>', $code );
            // @guest ** @endguest 未认证用户判断
            $code = preg_replace( '/@guest/s', '<?php if ( !$request->user ): ?>', $code );
            $code = preg_replace( '/@endguest/s', '<?php endif; ?>', $code );
            // @admin ** @endadmin 管理员用户判断
            $code = preg_replace( '/@admin/s', '<?php if ( $request->user && $request->user->isAdmin() ): ?>', $code );
            $code = preg_replace( '/@endadmin/s', '<?php endif; ?>', $code );
            // 写入加载内容
            $this->load = $code;
        }
        private function phpToHtml( $viewFileOriginalCode, $share = [] ) {
            try {
                ob_start();
                    extract( $share  );
                    eval( '?>'.$viewFileOriginalCode );
                $viewFileOriginalCode = ob_get_clean();
                return $viewFileOriginalCode;
            }catch ( \Throwable $th ) {
                Debug::log( 'Bootstrap', [ "[{$this->file}] View", $th ] );
                return Router::error( 500, $share['request'] ?? null );
            }
        }
        /**
         * 显示视图
         */
        public function show() {
            // 请求对象
            $request = $this->data['request'] ?? null;
            // 用户语言
            $lang = is_object( $request ) ? $request->lang : config( 'app.lang' );
            // 用户主题
            $themeName = is_object( $request ) ? ( $request->header['themeName'] ?? $request->cookie['themeName'] ?? 'Default' ) : 'Default';
            $theme = $this->plugin->config( "theme.{$themeName}" );
            if ( !is_array( $theme ) ) {
                $themeName = 'Default';
                $theme = $this->plugin->config( "theme.{$themeName}" );
            }
            // 翻译函数
            $t = function( $key, $replace = [] ) use ( $lang ) {
                $key = str_replace( "&", "{$this->ascription}.", $key );
                return __( $key, $replace, $lang );
            };
            // 文件版本
            $v = config( 'app.debug' ) ? "version=".config( 'todu.version' ).".".time() : "version=".config( 'todu.version' );
            // 资源调用器
            $assets = function( $path ) use( $v ) {
                return "/assets/{$this->ascription}/{$path}?{$v}";
            };
            return $this->phpToHtml( $this->load, array_merge( $this->data, [
                'request' => $request, // 请求对象
                'lang' => $lang, // 语言标识
                'themeName' => $themeName, // 主题名称
                'theme' => $theme, // 主题数据
                'tid' => is_object( $request ) ? $request->id : uuid(), // 视图唯一 ID
                'plugin' => $this->plugin, // 插件对象
                't' => $t, // 翻译函数
                'v' => $v, // 版本参数
                'assets' => $assets, // 资源调用函数
                'view' => $this->ascription // 视图归属
            ]));
        }
    }