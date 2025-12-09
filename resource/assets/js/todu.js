/**
 * =====================================================
 * JavaScript 核心
 * =====================================================
 */
window['todu'] = {
    init: false, // 初始化状态
    tid: toValue( system.tid, uuid() ), // 唯一 ID
    view: toValue( system.view, null ), // 视图标识
    themeName: toValue( system.themeName, null ), // 主题名称
    lang: toValue( system.lang, null ), // 语言标识
    entrance: toValue( system.entrance, 'todu_view' ), // 资源入口
    server: get( 'server', {} ), // 服务器信息
    theme: get( 'theme', {} ), // 主题标识
    text: get( 'text', {} ), // 语言包
    user: get( 'user', null ), // 用户信息
    size: { width: window.innerWidth,  height: window.innerHeight },
    clipboard: false, // 复制对象
    // 初始化
    start: function() {
        // 系统变量
        this.cache( 'tid', todu.tid );
        // 设置屏幕尺寸
        document.documentElement.style.setProperty( '--vw', `${window.innerWidth}px` );
        document.documentElement.style.setProperty( '--vh', `${window.innerHeight}px` );
        window.addEventListener( 'resize', () => {
            this.size.width = window.innerWidth;
            this.size.height = window.innerHeight;
            document.documentElement.style.setProperty( '--vw', `${window.innerWidth}px` );
            document.documentElement.style.setProperty( '--vh', `${window.innerHeight}px` );
        });
        // 同步服务器信息
        todu.synchronous();
        // 持续同步服务器信息
        setInterval( () => { todu.synchronous(); }, 30000 );
        // 页面加载完成事件
        window.onload = function() {{ window['system'] = {}; }
            // 注册点击复制
            todu.clipboard = new Clipboard( '.copy' );
            todu.clipboard.on( 'success', function() { todu.unit.toast( ['base.copy:base.true'] ); });
            todu.clipboard.on( 'error', function() { todu.unit.toast( ['base.copy:base.false'], true ); });
            // 启动视图工具
            todu.unit.start();
            // 设置初始化状态
            todu.init = true;
        };
    },
    // 同步服务器信息
    synchronous: function() {
        todu.api( `/api/${todu.entrance}/index` ).data({ theme: todu.themeName, lang: todu.lang }).run(( res ) => {
            todu.tid = res.tid;
            set( 'server', res.server ); todu.text = res.server;
            set( 'theme', res.theme ); todu.theme = res.theme;
            set( 'text', res.text ); todu.text = res.text;
            if ( !empty( res.user ) ) {
                set( 'user', res.user ); todu.user = res.user;
            }else {
                todu.logout();
            }
        }).request( 'POST' );
    },
    // 缓存工具
    cache: function( key, value = false, cookie = true ) {
        if ( value === null || typeof value === 'undefined' ) {
            del( key ); $.cookie( key, null, { expires: -1, path: '/' } );
            return true;
        }
        if ( value === false ) {
            const local = get( key );
            const cookieValue = $.cookie( key );
            return !empty( local ) ? local : toValue( cookieValue, false );
        }
        set( key, value );
        if ( cookie ) {
            $.cookie( key, toValue( value, true ), { expires: 365, path: '/' } );
        }
        return true;
    },
    // 用户登出
    logout: function( reload = false ) {
        todu.cache( 'user', null );
        todu.cache( 'token', null );
        todu.user = null;
        if ( reload ) {
            todu.unit.toast( ['base.error.401'] );
            return setTimeout( () => { window.location.reload(); }, 600 );
        }
    },
    // 用户登录
    login: function( user, token, reload = false ) {
        if ( !is_array( user ) || typeof token !== 'string' || empty( user ) || empty( token ) ) {
            todu.unit.toast( ['base.error.unknown'], true );
            return false;
        }
        set( 'user', user ); todu.user = user;
        todu.cache( 'token', token );
        todu.unit.toast( ['base.login:base.true'] );
        if ( reload ) {
            setTimeout( () => { window.location.reload(); }, 1000 );
        }
        return true;
    },
    // Web 连接工具
    api: function( link ) { return new web( link ); },
    /**
     * 视图工具
     */
    unit: {
        cache: {}, // 定时器
        start: function() {
            // 按钮点击动画
            $( document ).on( 'click', 'button[unitButton]', function () {
                todu.unit.animation( $( this ), 'buttonClick', 150 );
            });
        },
        // 通知工具
        toast: function( text, error = false, timeout = 3000 ) {
            if ( is_array( text ) && text.length <= 2 ) { text = t( text[0], text[1] ?? {} ); }
            // 获取元素
            const $toast = $( `div#unit div[unitToast]` );
            // 渲染元素
            $toast.removeClass( 'error' );
            if ( error ) { $toast.addClass( 'error' ); }
            $toast.find( 'p.text' ).text( text );
            // 激活元素
            $toast.addClass( 'active' );
            todu.unit.animation( $toast, 'toastIn', 200 );
            // 设置定时器
            clearTimeout( todu.unit.cache['toastTimeout'] );
            todu.unit.cache['toastTimeout'] = setTimeout(() => {
                $toast.removeClass( 'active' );
                todu.unit.animation( $toast, 'toastOut', 120 );
            }, timeout );
        },
        // 闪烁动画
        animation: function( $element, name, time = 180 ) {
            $element.addClass( name );
            setTimeout(() => { $element.removeClass( name ); }, time );
        },
        card: function( rid ) {
            const $card = $( `div[unitCard][rid="${rid}"]` );
            if ( $card.hasClass( 'open' ) ) {
                $card.removeClass( 'open' ).addClass( 'close' );
                $card.find( 'div.cardTitleRight i.status' ).removeClass( 'bi-chevron-up' ).addClass( 'bi-chevron-down' );
            } else {
                $card.removeClass( 'close' ).addClass( 'open' );
                $card.find( 'div.cardTitleRight i.status' ).removeClass( 'bi-chevron-down' ).addClass( 'bi-chevron-up' );
            }
        }
    }
};

/**
 * =====================================================
 * Web 连接工具
 * =====================================================
 */
class web {
    /**
     * 构造函数
     * @param {string} link 连接地址
     */
    constructor( link ) {
        this.link = link;
        this.method = 'GET';
        this.onHeaders = {
            tid: todu.tid,
            lang: todu.lang
        };
        if ( get( 'token' ) ) { this.onHeaders['token'] = get( 'token' ); }
        this.onData = null;
        this.onRun = null;
        this.onError = null;
        this.onTimeout = 30000;
        this.onLoad = null;
        this.onProgress = null;
        this.response = null;
    }
    // 进度回调
    progress( progress ) { this.onProgress = progress; return this; }
    // 请求头设置
    headers( headers ) {
        for ( const key in headers ) { this.onHeaders[key] = headers[key]; }
        return this;
    }
    // 请求数据
    data( data ) { this.onData = data; return this; }
    // 成功回调
    run( run ) { this.onRun = run; return this; }
    // 错误回调
    error( error ) { this.onError = error; return this; }
    // 超时设置
    timeout( timeout ) { this.onTimeout = timeout; return this; }
    // 加载状态设置
    load( loading ) { this.onLoad = loading; return this; }
    // 发起请求
    request( method = 'GET', check = true ) {
        if ( typeof this.onLoad === 'function' ) { this.onLoad( true ); }
        let isFile = false;
        let isJson = false;
        if ( this.onData instanceof FormData ) {
            for ( const v of this.onData.values() ) {
                if ( v instanceof File || v instanceof Blob ) {
                    isFile = true; break;
                }
            }
        }
        if ( is_json( this.onData ) ) {
            isJson = true;
        }
        $.ajax({
            url: this.link,
            method: method.toUpperCase(),
            headers: this.onHeaders,
            data: this.onData,
            timeout: this.onTimeout,
            processData: isFile ? false : !isJson,
            contentType: isFile ? false : ( isJson ? 'application/json; charset=utf-8' : 'application/x-www-form-urlencoded; charset=UTF-8' ),
            dataType: 'json',
            xhr: () => {
                var xhr = $.ajaxSettings.xhr();
                if ( xhr.upload ) {
                    xhr.upload.onprogress = ( e ) => {
                        if ( e.lengthComputable ) {
                            if ( typeof this.onProgress === 'function' ) {
                                this.onProgress( Math.round( ( e.loaded / e.total ) * 100 ) );
                            }
                        }
                    };
                }
                return xhr;
            },
            success: ( response ) => {
                if ( typeof this.onLoad === 'function' ) { this.onLoad( false ); }
                this.response = response;
                if ( check ) { return this.check(); }
                if ( typeof this.onRun === 'function' ) { return this.onRun( response ); }
            },
            error: ( error ) => {
                if ( typeof this.onLoad === 'function' ) { this.onLoad( false ); }
                this.response = typeof error.responseJSON === 'object' ? error.responseJSON : error;
                if ( check ) { return this.check(); }
                if ( typeof this.onError === 'function' ) { return this.onError( error ); }
            }
        });
        return this;
    }
    // 响应检查
    check() {
        const res = this.response;
        if ( is_json( res ) ) { res = JSON.parse( res ); }
        // 检查数据格式
        if ( !is_array( res ) || !( 'status' in res ) || !( 'code' in res ) || !( 'data' in res ) ) {
            todu.unit.toast( ['base.error.data'], true );
            if ( typeof this.onError === 'function' ) { this.onError( res ); }
            return this;
        }
        // 用户登出
        if ( Number( res.code ) === 401 ) {
            if ( todu.user ) { todu.unit.toast( ['base.error.401'], true ); }
            todu.logout();
        }
        switch ( res.status ) {
            case 'success':
                // 成功处理
                if ( typeof this.onRun === 'function' ) { this.onRun( res.data ); }
                return this;
            case 'fail':
                // 失败处理
                if ( typeof res.data === 'string' ) { todu.unit.toast( res.data ); }
                if ( typeof this.onError === 'function' ) { this.onError( res ); }
                return this;

            case 'error':
            case 'warn':
                // 失败处理
                if ( typeof res.data === 'string' ) { todu.unit.toast( res.data, true ); }
                if ( typeof this.onError === 'function' ) { this.onError( res ); }
                return this;

            default:
                // 未知状态处理
                todu.unit.toast( ['base.error.unknown'], true );
                if ( typeof this.onError === 'function' ) { this.onError( res ); }
                return this;
        }
    }
}

/**
 * =====================================================
 * 通用工具函数
 * =====================================================
 */
/**
 * 判断变量是否存在
 * @param {variable} v 传入一个变量
 * @returns boolean
 */
function empty( v ) {
    switch( typeof v ) {
        case 'undefined':
            return true;
        case 'string':
            if ( v.replace( /(^[ \t\n\r]*)|([ \t\n\r]*$)/g, '' ).length === 0 ) return true;
            break;
        case 'boolean':
            if ( !v ) return true;
            break;
        case 'number':
            if ( 0 === v || isNaN( v ) ) return true;
            break;
        case 'object':
            if ( null === v || v.length === 0 ) return true;
            for ( var i in v ) { return false; }
            return true;
        default: break;
    }
    return false;
}
/**
 * 判断变量是否为 JSON
 * @param {variable} v 传入一个变量
 * @returns boolean
 */
function is_json( v ) {
    if ( v === '' || v === null ) { return false; }
    try {
        const check = JSON.parse( v );
        if ( is_array( check ) ) {
            return true;
        } else {
            return false;
        }
    } catch ( error ) {
        return false;
    }
}
/**
 * 判断变量是否为数组或者对象
 * @param {any} v 判断对象
 * @returns boolean
 */
function is_array( v ) {
    if ( v === '' || v === null ) { return false; }
    if ( Array.isArray( v ) || typeof v === 'object' ) {
        return true;
    }
    return false;
}
/**
 * 转换存储值
 * @param {any} v 值
 * @param {boolean} $save 是否为存储
 * @returns 转换结果
 */
function toValue( v, $save ) {
    if ( $save ) {
        if ( v === true ) { return '[:true:]'; }
        if ( v === false ) { return '[:false:]'; }
        if ( v === null ) { return '[:null:]'; }
        if ( is_array( v ) ) { return JSON.stringify( v ); }
        if ( typeof v === 'number' ) { return v.toString(); }
        if ( typeof v === 'undefined' ) { return '[:undefined:]'; }
    } else {
        if ( v === '[:true:]' ) { return true; }
        if ( v === '[:false:]' ) { return false; }
        if ( v === '[:null:]' ) { return null; }
        if ( v === '[:undefined:]' ) { return undefined; }
        if ( is_json( v ) ) { return JSON.parse( v ); }
        if ( /^-?\d*\.?\d+$/.test( v ) ) { return parseFloat( v ); }
    }
    return v;
}
/**
 * 查询本地存储
 * @param {string} key 键名
 * @returns 查询结果
 */
function get( key ) {
    let data = localStorage.getItem( key, defaultValue = null );
    const value = toValue( data, false );
    return empty( value ) && value !== 0 && value !== '0' ? defaultValue : value;
}
/**
 * 设置本地存储
 * @param {string} key 键名
 * @param {string} value 数据
 * @returns boolean
 */
function set( key, value ) {
    return localStorage.setItem( key, toValue( value, true ) );
}
/**
 * 删除本地存储
 * @param {string} key 键名
 * @returns boolean
 */
function del( key ) {
    return localStorage.removeItem( key );
}
/**
 * 判断变量是否为数字
 * @param {any} v 判断对象
 * @returns boolean
 */
function is_number( v ) {
    if ( typeof v === 'number' ) { return true; }
    if ( typeof v === 'string' ) { return /^-?\d*\.?\d+$/.test( v ); }
    return false;
}
/**
 * 生成 UUID
 * @param {string|boolean} check 检查 UUID
 * @returns UUID
 */
function uuid( check = false ) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if ( check ) { return uuidRegex.test( check ); }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : ( ( r & 0x3 ) | 0x8 );
        return v.toString( 16 );
    });
}
/**
 * 判断变量是否为 UUID
 * @param {any} v 判断对象
 * @returns boolean
 */
function is_uuid( v ) {
    if ( typeof v === 'string' ) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test( v ); }
    return false;
}
/**
 * 转为时间
 * @param {any} inputValue 参数
 * @returns boolean
 */
function toTime( inputValue ) {
    if ( !inputValue ) return '';
    let [hours, minutes, seconds = '00'] = inputValue.split( ':' );
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}
/**
 * 转为日期
 * @param {any} inputValue 参数
 * @returns boolean
 */
function toDate( inputValue ) {
    if ( !inputValue ) return '';
    const date = new Date( inputValue );
    const year = date.getFullYear();
    const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
    const day = String( date.getDate() ).padStart( 2, '0' );
    return `${year}-${month}-${day}`;
}
/**
 * 转为完整时间
 * @param {any} inputValue 参数
 * @returns boolean
 */
function toDatetime( inputValue ) {
    if ( !inputValue ) return '';
    const date = new Date( inputValue );
    const year = date.getFullYear();
    const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
    const day = String( date.getDate() ).padStart( 2, '0' );
    const hours = String( date.getHours() ).padStart( 2, '0' );
    const minutes = String( date.getMinutes() ).padStart( 2, '0' );
    const seconds = String( date.getSeconds() ).padStart( 2, '0' );
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
/**
 * Hash
 * @param {any} value 参数
 * @returns string
 */
function h( value ) {
    if ( value === '' || typeof value !== 'string' ) { return ''; }
    return CryptoJS.SHA256( value ).toString();
}
/**
 * 使用语言包
 * @param {string} word 传入对应文本的键
 * @returns 传出语言
 */
function t( word, replace = {} ) {
    let words = word.split( ':' );
    if ( !empty( words[0] ) && !empty( words[1] ) ) { return t( words[0] ) + t( words[1] ); }
    words = words[0].split( '.' );
    let result = todu.text;
    for ( const w of words ) {
        if ( result && typeof result === 'object' && w in result ) {
            result = result[w];
        }else {
            return word;
        }
    }
    if ( !empty( replace ) ) {
        for ( const key in replace ) {
            result = result.replace( `{{${key}}}`, replace[key] );
        }
    }
    return result;
}

todu.start();