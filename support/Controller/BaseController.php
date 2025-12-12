<?php

namespace Plugin\ToduView\Controller;

use Todu\Handler\Request;

    class BaseController {
        /**
         * 基础信息
         */
        public function index( Request $request ) {
            $res = $request->validate([
                'theme' => 'required|type:string|min:1|max:20',
                'lang'  => 'required|type:string|min:1|max:20',
            ]);
            // 获取主题配置信息
            $plugin = plugin( 'ToduView' );
            $theme = $plugin->config( "theme.{$res['theme']}" );
            if ( !is_array( $theme ) ) { $theme = $plugin->config( 'theme.default' ); }
            // 获取语言包
            $text = [ 'base' => [], 'validate' => [] ];
            $file = ToduPath()."system/resource/lang/{$res['lang']}/base.php";
            if ( file_exists( $file ) ) { $text['base'] = array_merge( $text['base'], import( $file ) ); }
            $file = config( 'todu.path.lang' )."{$res['lang']}/base.php";
            if ( file_exists( $file ) ) { $text['base'] = array_merge( $text['base'], import( $file ) ); }
            $file = ToduPath()."system/resource/lang/{$res['lang']}/validate.php";
            if ( file_exists( $file ) ) { $text['validate'] = array_merge( $text['validate'], import( $file ) ); }
            $file = config( 'todu.path.lang' )."{$res['lang']}/validate.php";
            if ( file_exists( $file ) ) { $text['validate'] = array_merge( $text['validate'], import( $file ) ); }
            // 返回数据
            return $request->echo( 0, [
                'tid' => $request->id,
                'server' => [
                    'title' => config( 'app.name' ),
                    'version' => config( 'todu.version' ),
                    'lang' => config( 'app.lang' ),
                    'timezone' => config( 'app.timezone' )
                ],
                'user' => $request->user ? $request->user->share() : null,
                'theme' => $theme,
                'text' => $text
            ]);
        }
        /**
         * 加载前端资源库
         */
        public function library( Request $request, $parameter ) {
            $plugin = plugin( 'ToduView' );
            $file = $plugin->path."resource/library/{$parameter['type']}/".str_replace( '_', '.', $parameter['file'] );
            if ( !file_exists( $file ) ) { return null; }

            dd( $file );
        }
    }