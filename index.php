<?php

use Todu\Bootstrap;
use Todu\Handler\Router;
use Todu\Slot\Plugin;
use Plugin\ToduView\Controller\BaseController;
use Plugin\ToduView\Render;

    return new class extends Plugin {
        public $name = 'TODU.IO View Renderer'; // 插件名称
        public $author = 'TODU.IO'; // 插件作者
        public $version = '1.1.1'; // 当前插件版本
        public $description = 'System default view rendering.'; // 插件描述
        /**
         * 初始化
         */
        public function init() {
            // 注册自动加载
            Bootstrap::setAutoload([
                'Plugin\\ToduView\\Render' => $this->path.'support/Render.php',
                'Plugin\\ToduView\\Controller\\BaseController' => $this->path.'support/Controller/BaseController.php',
            ]);
            // 注册权限
            $this->intervene( 'LOAD_ROUTE_LIST', 'router' );
            // 注册视图
            Bootstrap::view([
                'module.todu.index' => $this->path.'resource/index.view.html',
                'module.todu.unit' => $this->path.'resource/module/unit.view.html',
                'module.button' => $this->path.'resource/module/button.view.html',
                'module.card' => $this->path.'resource/module/card.view.html',
                'module.layout' => $this->path.'resource/module/layout.view.html'
            ]);
        }
        /**
         * 渲染视图
         * - [string]:视图文件, [array]:视图数据, [...mixed]:其他参数
         * return [Render]:视图渲染对象
         */
        public function render( $file, $data = [], ...$args ) {
            return new Render( $file, $data, $this, ...$args );
        }
        /**
         * 注册路由
         */
        public function router( $name, $prefix ) {
            if ( !Bootstrap::$cli && !in_array( $prefix, [ 'todu_view', $this->config( 'entrance' ) ] ) ) { return null; }
            switch ( $name ) {
                case 'view':
                    Router::add( "/todu_view/assets" )->assets( $this->path."resource/assets/" )->save();
                    Router::add( "/{$this->config( 'entrance' )}" )->group(function(){
                        Router::add( '/assets' )->assets( $this->path."resource/assets/" )->save();
                    });
                    break;
                case 'api':
                    Router::add( "/{$this->config( 'entrance' )}" )->group(function(){
                        Router::add( '/index', 'POST' )->to([ BaseController::class, 'index' ])->save();
                    });
                    break;

                default: break;
            }
            return null;
        }
    };