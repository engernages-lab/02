(function () {
	'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var jsxRuntime = {exports: {}};

	var reactJsxRuntime_production_min = {};

	var react = {exports: {}};

	var react_production_min = {};

	/**
	 * @license React
	 * react.production.min.js
	 *
	 * Copyright (c) Facebook, Inc. and its affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */

	var hasRequiredReact_production_min;

	function requireReact_production_min () {
		if (hasRequiredReact_production_min) return react_production_min;
		hasRequiredReact_production_min = 1;
	var l=Symbol.for("react.element"),n=Symbol.for("react.portal"),p=Symbol.for("react.fragment"),q=Symbol.for("react.strict_mode"),r=Symbol.for("react.profiler"),t=Symbol.for("react.provider"),u=Symbol.for("react.context"),v=Symbol.for("react.forward_ref"),w=Symbol.for("react.suspense"),x=Symbol.for("react.memo"),y=Symbol.for("react.lazy"),z=Symbol.iterator;function A(a){if(null===a||"object"!==typeof a)return null;a=z&&a[z]||a["@@iterator"];return "function"===typeof a?a:null}
		var B={isMounted:function(){return  false},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},C=Object.assign,D={};function E(a,b,e){this.props=a;this.context=b;this.refs=D;this.updater=e||B;}E.prototype.isReactComponent={};
		E.prototype.setState=function(a,b){if("object"!==typeof a&&"function"!==typeof a&&null!=a)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,a,b,"setState");};E.prototype.forceUpdate=function(a){this.updater.enqueueForceUpdate(this,a,"forceUpdate");};function F(){}F.prototype=E.prototype;function G(a,b,e){this.props=a;this.context=b;this.refs=D;this.updater=e||B;}var H=G.prototype=new F;
		H.constructor=G;C(H,E.prototype);H.isPureReactComponent=true;var I=Array.isArray,J=Object.prototype.hasOwnProperty,K={current:null},L={key:true,ref:true,__self:true,__source:true};
		function M(a,b,e){var d,c={},k=null,h=null;if(null!=b)for(d in void 0!==b.ref&&(h=b.ref),void 0!==b.key&&(k=""+b.key),b)J.call(b,d)&&!L.hasOwnProperty(d)&&(c[d]=b[d]);var g=arguments.length-2;if(1===g)c.children=e;else if(1<g){for(var f=Array(g),m=0;m<g;m++)f[m]=arguments[m+2];c.children=f;}if(a&&a.defaultProps)for(d in g=a.defaultProps,g) void 0===c[d]&&(c[d]=g[d]);return {$$typeof:l,type:a,key:k,ref:h,props:c,_owner:K.current}}
		function N(a,b){return {$$typeof:l,type:a.type,key:b,ref:a.ref,props:a.props,_owner:a._owner}}function O(a){return "object"===typeof a&&null!==a&&a.$$typeof===l}function escape(a){var b={"=":"=0",":":"=2"};return "$"+a.replace(/[=:]/g,function(a){return b[a]})}var P=/\/+/g;function Q(a,b){return "object"===typeof a&&null!==a&&null!=a.key?escape(""+a.key):b.toString(36)}
		function R(a,b,e,d,c){var k=typeof a;if("undefined"===k||"boolean"===k)a=null;var h=false;if(null===a)h=true;else switch(k){case "string":case "number":h=true;break;case "object":switch(a.$$typeof){case l:case n:h=true;}}if(h)return h=a,c=c(h),a=""===d?"."+Q(h,0):d,I(c)?(e="",null!=a&&(e=a.replace(P,"$&/")+"/"),R(c,b,e,"",function(a){return a})):null!=c&&(O(c)&&(c=N(c,e+(!c.key||h&&h.key===c.key?"":(""+c.key).replace(P,"$&/")+"/")+a)),b.push(c)),1;h=0;d=""===d?".":d+":";if(I(a))for(var g=0;g<a.length;g++){k=
		a[g];var f=d+Q(k,g);h+=R(k,b,e,f,c);}else if(f=A(a),"function"===typeof f)for(a=f.call(a),g=0;!(k=a.next()).done;)k=k.value,f=d+Q(k,g++),h+=R(k,b,e,f,c);else if("object"===k)throw b=String(a),Error("Objects are not valid as a React child (found: "+("[object Object]"===b?"object with keys {"+Object.keys(a).join(", ")+"}":b)+"). If you meant to render a collection of children, use an array instead.");return h}
		function S(a,b,e){if(null==a)return a;var d=[],c=0;R(a,d,"","",function(a){return b.call(e,a,c++)});return d}function T(a){if(-1===a._status){var b=a._result;b=b();b.then(function(b){if(0===a._status||-1===a._status)a._status=1,a._result=b;},function(b){if(0===a._status||-1===a._status)a._status=2,a._result=b;});-1===a._status&&(a._status=0,a._result=b);}if(1===a._status)return a._result.default;throw a._result;}
		var U={current:null},V={transition:null},W={ReactCurrentDispatcher:U,ReactCurrentBatchConfig:V,ReactCurrentOwner:K};function X(){throw Error("act(...) is not supported in production builds of React.");}
		react_production_min.Children={map:S,forEach:function(a,b,e){S(a,function(){b.apply(this,arguments);},e);},count:function(a){var b=0;S(a,function(){b++;});return b},toArray:function(a){return S(a,function(a){return a})||[]},only:function(a){if(!O(a))throw Error("React.Children.only expected to receive a single React element child.");return a}};react_production_min.Component=E;react_production_min.Fragment=p;react_production_min.Profiler=r;react_production_min.PureComponent=G;react_production_min.StrictMode=q;react_production_min.Suspense=w;
		react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=W;react_production_min.act=X;
		react_production_min.cloneElement=function(a,b,e){if(null===a||void 0===a)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+a+".");var d=C({},a.props),c=a.key,k=a.ref,h=a._owner;if(null!=b){ void 0!==b.ref&&(k=b.ref,h=K.current);void 0!==b.key&&(c=""+b.key);if(a.type&&a.type.defaultProps)var g=a.type.defaultProps;for(f in b)J.call(b,f)&&!L.hasOwnProperty(f)&&(d[f]=void 0===b[f]&&void 0!==g?g[f]:b[f]);}var f=arguments.length-2;if(1===f)d.children=e;else if(1<f){g=Array(f);
		for(var m=0;m<f;m++)g[m]=arguments[m+2];d.children=g;}return {$$typeof:l,type:a.type,key:c,ref:k,props:d,_owner:h}};react_production_min.createContext=function(a){a={$$typeof:u,_currentValue:a,_currentValue2:a,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null};a.Provider={$$typeof:t,_context:a};return a.Consumer=a};react_production_min.createElement=M;react_production_min.createFactory=function(a){var b=M.bind(null,a);b.type=a;return b};react_production_min.createRef=function(){return {current:null}};
		react_production_min.forwardRef=function(a){return {$$typeof:v,render:a}};react_production_min.isValidElement=O;react_production_min.lazy=function(a){return {$$typeof:y,_payload:{_status:-1,_result:a},_init:T}};react_production_min.memo=function(a,b){return {$$typeof:x,type:a,compare:void 0===b?null:b}};react_production_min.startTransition=function(a){var b=V.transition;V.transition={};try{a();}finally{V.transition=b;}};react_production_min.unstable_act=X;react_production_min.useCallback=function(a,b){return U.current.useCallback(a,b)};react_production_min.useContext=function(a){return U.current.useContext(a)};
		react_production_min.useDebugValue=function(){};react_production_min.useDeferredValue=function(a){return U.current.useDeferredValue(a)};react_production_min.useEffect=function(a,b){return U.current.useEffect(a,b)};react_production_min.useId=function(){return U.current.useId()};react_production_min.useImperativeHandle=function(a,b,e){return U.current.useImperativeHandle(a,b,e)};react_production_min.useInsertionEffect=function(a,b){return U.current.useInsertionEffect(a,b)};react_production_min.useLayoutEffect=function(a,b){return U.current.useLayoutEffect(a,b)};
		react_production_min.useMemo=function(a,b){return U.current.useMemo(a,b)};react_production_min.useReducer=function(a,b,e){return U.current.useReducer(a,b,e)};react_production_min.useRef=function(a){return U.current.useRef(a)};react_production_min.useState=function(a){return U.current.useState(a)};react_production_min.useSyncExternalStore=function(a,b,e){return U.current.useSyncExternalStore(a,b,e)};react_production_min.useTransition=function(){return U.current.useTransition()};react_production_min.version="18.3.1";
		return react_production_min;
	}

	var hasRequiredReact;

	function requireReact () {
		if (hasRequiredReact) return react.exports;
		hasRequiredReact = 1;

		{
		  react.exports = requireReact_production_min();
		}
		return react.exports;
	}

	/**
	 * @license React
	 * react-jsx-runtime.production.min.js
	 *
	 * Copyright (c) Facebook, Inc. and its affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */

	var hasRequiredReactJsxRuntime_production_min;

	function requireReactJsxRuntime_production_min () {
		if (hasRequiredReactJsxRuntime_production_min) return reactJsxRuntime_production_min;
		hasRequiredReactJsxRuntime_production_min = 1;
	var f=requireReact(),k=Symbol.for("react.element"),l=Symbol.for("react.fragment"),m=Object.prototype.hasOwnProperty,n=f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,p={key:true,ref:true,__self:true,__source:true};
		function q(c,a,g){var b,d={},e=null,h=null;void 0!==g&&(e=""+g);void 0!==a.key&&(e=""+a.key);void 0!==a.ref&&(h=a.ref);for(b in a)m.call(a,b)&&!p.hasOwnProperty(b)&&(d[b]=a[b]);if(c&&c.defaultProps)for(b in a=c.defaultProps,a) void 0===d[b]&&(d[b]=a[b]);return {$$typeof:k,type:c,key:e,ref:h,props:d,_owner:n.current}}reactJsxRuntime_production_min.Fragment=l;reactJsxRuntime_production_min.jsx=q;reactJsxRuntime_production_min.jsxs=q;
		return reactJsxRuntime_production_min;
	}

	var hasRequiredJsxRuntime;

	function requireJsxRuntime () {
		if (hasRequiredJsxRuntime) return jsxRuntime.exports;
		hasRequiredJsxRuntime = 1;

		{
		  jsxRuntime.exports = requireReactJsxRuntime_production_min();
		}
		return jsxRuntime.exports;
	}

	var jsxRuntimeExports = requireJsxRuntime();

	var client = {};

	var reactDom = {exports: {}};

	var reactDom_production_min = {};

	var scheduler = {exports: {}};

	var scheduler_production_min = {};

	/**
	 * @license React
	 * scheduler.production.min.js
	 *
	 * Copyright (c) Facebook, Inc. and its affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */

	var hasRequiredScheduler_production_min;

	function requireScheduler_production_min () {
		if (hasRequiredScheduler_production_min) return scheduler_production_min;
		hasRequiredScheduler_production_min = 1;
		(function (exports) {
	function f(a,b){var c=a.length;a.push(b);a:for(;0<c;){var d=c-1>>>1,e=a[d];if(0<g(e,b))a[d]=b,a[c]=e,c=d;else break a}}function h(a){return 0===a.length?null:a[0]}function k(a){if(0===a.length)return null;var b=a[0],c=a.pop();if(c!==b){a[0]=c;a:for(var d=0,e=a.length,w=e>>>1;d<w;){var m=2*(d+1)-1,C=a[m],n=m+1,x=a[n];if(0>g(C,c))n<e&&0>g(x,C)?(a[d]=x,a[n]=c,d=n):(a[d]=C,a[m]=c,d=m);else if(n<e&&0>g(x,c))a[d]=x,a[n]=c,d=n;else break a}}return b}
			function g(a,b){var c=a.sortIndex-b.sortIndex;return 0!==c?c:a.id-b.id}if("object"===typeof performance&&"function"===typeof performance.now){var l=performance;exports.unstable_now=function(){return l.now()};}else {var p=Date,q=p.now();exports.unstable_now=function(){return p.now()-q};}var r=[],t=[],u=1,v=null,y=3,z=false,A=false,B=false,D="function"===typeof setTimeout?setTimeout:null,E="function"===typeof clearTimeout?clearTimeout:null,F="undefined"!==typeof setImmediate?setImmediate:null;
			"undefined"!==typeof navigator&&void 0!==navigator.scheduling&&void 0!==navigator.scheduling.isInputPending&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function G(a){for(var b=h(t);null!==b;){if(null===b.callback)k(t);else if(b.startTime<=a)k(t),b.sortIndex=b.expirationTime,f(r,b);else break;b=h(t);}}function H(a){B=false;G(a);if(!A)if(null!==h(r))A=true,I(J);else {var b=h(t);null!==b&&K(H,b.startTime-a);}}
			function J(a,b){A=false;B&&(B=false,E(L),L=-1);z=true;var c=y;try{G(b);for(v=h(r);null!==v&&(!(v.expirationTime>b)||a&&!M());){var d=v.callback;if("function"===typeof d){v.callback=null;y=v.priorityLevel;var e=d(v.expirationTime<=b);b=exports.unstable_now();"function"===typeof e?v.callback=e:v===h(r)&&k(r);G(b);}else k(r);v=h(r);}if(null!==v)var w=!0;else {var m=h(t);null!==m&&K(H,m.startTime-b);w=!1;}return w}finally{v=null,y=c,z=false;}}var N=false,O=null,L=-1,P=5,Q=-1;
			function M(){return exports.unstable_now()-Q<P?false:true}function R(){if(null!==O){var a=exports.unstable_now();Q=a;var b=true;try{b=O(!0,a);}finally{b?S():(N=false,O=null);}}else N=false;}var S;if("function"===typeof F)S=function(){F(R);};else if("undefined"!==typeof MessageChannel){var T=new MessageChannel,U=T.port2;T.port1.onmessage=R;S=function(){U.postMessage(null);};}else S=function(){D(R,0);};function I(a){O=a;N||(N=true,S());}function K(a,b){L=D(function(){a(exports.unstable_now());},b);}
			exports.unstable_IdlePriority=5;exports.unstable_ImmediatePriority=1;exports.unstable_LowPriority=4;exports.unstable_NormalPriority=3;exports.unstable_Profiling=null;exports.unstable_UserBlockingPriority=2;exports.unstable_cancelCallback=function(a){a.callback=null;};exports.unstable_continueExecution=function(){A||z||(A=true,I(J));};
			exports.unstable_forceFrameRate=function(a){0>a||125<a?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):P=0<a?Math.floor(1E3/a):5;};exports.unstable_getCurrentPriorityLevel=function(){return y};exports.unstable_getFirstCallbackNode=function(){return h(r)};exports.unstable_next=function(a){switch(y){case 1:case 2:case 3:var b=3;break;default:b=y;}var c=y;y=b;try{return a()}finally{y=c;}};exports.unstable_pauseExecution=function(){};
			exports.unstable_requestPaint=function(){};exports.unstable_runWithPriority=function(a,b){switch(a){case 1:case 2:case 3:case 4:case 5:break;default:a=3;}var c=y;y=a;try{return b()}finally{y=c;}};
			exports.unstable_scheduleCallback=function(a,b,c){var d=exports.unstable_now();"object"===typeof c&&null!==c?(c=c.delay,c="number"===typeof c&&0<c?d+c:d):c=d;switch(a){case 1:var e=-1;break;case 2:e=250;break;case 5:e=1073741823;break;case 4:e=1E4;break;default:e=5E3;}e=c+e;a={id:u++,callback:b,priorityLevel:a,startTime:c,expirationTime:e,sortIndex:-1};c>d?(a.sortIndex=c,f(t,a),null===h(r)&&a===h(t)&&(B?(E(L),L=-1):B=true,K(H,c-d))):(a.sortIndex=e,f(r,a),A||z||(A=true,I(J)));return a};
			exports.unstable_shouldYield=M;exports.unstable_wrapCallback=function(a){var b=y;return function(){var c=y;y=b;try{return a.apply(this,arguments)}finally{y=c;}}}; 
		} (scheduler_production_min));
		return scheduler_production_min;
	}

	var hasRequiredScheduler;

	function requireScheduler () {
		if (hasRequiredScheduler) return scheduler.exports;
		hasRequiredScheduler = 1;

		{
		  scheduler.exports = requireScheduler_production_min();
		}
		return scheduler.exports;
	}

	/**
	 * @license React
	 * react-dom.production.min.js
	 *
	 * Copyright (c) Facebook, Inc. and its affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */

	var hasRequiredReactDom_production_min;

	function requireReactDom_production_min () {
		if (hasRequiredReactDom_production_min) return reactDom_production_min;
		hasRequiredReactDom_production_min = 1;
	var aa=requireReact(),ca=requireScheduler();function p(a){for(var b="https://reactjs.org/docs/error-decoder.html?invariant="+a,c=1;c<arguments.length;c++)b+="&args[]="+encodeURIComponent(arguments[c]);return "Minified React error #"+a+"; visit "+b+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var da=new Set,ea={};function fa(a,b){ha(a,b);ha(a+"Capture",b);}
		function ha(a,b){ea[a]=b;for(a=0;a<b.length;a++)da.add(b[a]);}
		var ia=!("undefined"===typeof window||"undefined"===typeof window.document||"undefined"===typeof window.document.createElement),ja=Object.prototype.hasOwnProperty,ka=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,la=
		{},ma={};function oa(a){if(ja.call(ma,a))return  true;if(ja.call(la,a))return  false;if(ka.test(a))return ma[a]=true;la[a]=true;return  false}function pa(a,b,c,d){if(null!==c&&0===c.type)return  false;switch(typeof b){case "function":case "symbol":return  true;case "boolean":if(d)return  false;if(null!==c)return !c.acceptsBooleans;a=a.toLowerCase().slice(0,5);return "data-"!==a&&"aria-"!==a;default:return  false}}
		function qa(a,b,c,d){if(null===b||"undefined"===typeof b||pa(a,b,c,d))return  true;if(d)return  false;if(null!==c)switch(c.type){case 3:return !b;case 4:return  false===b;case 5:return isNaN(b);case 6:return isNaN(b)||1>b}return  false}function v(a,b,c,d,e,f,g){this.acceptsBooleans=2===b||3===b||4===b;this.attributeName=d;this.attributeNamespace=e;this.mustUseProperty=c;this.propertyName=a;this.type=b;this.sanitizeURL=f;this.removeEmptyString=g;}var z={};
		"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a){z[a]=new v(a,0,false,a,null,false,false);});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(a){var b=a[0];z[b]=new v(b,1,false,a[1],null,false,false);});["contentEditable","draggable","spellCheck","value"].forEach(function(a){z[a]=new v(a,2,false,a.toLowerCase(),null,false,false);});
		["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(a){z[a]=new v(a,2,false,a,null,false,false);});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a){z[a]=new v(a,3,false,a.toLowerCase(),null,false,false);});
		["checked","multiple","muted","selected"].forEach(function(a){z[a]=new v(a,3,true,a,null,false,false);});["capture","download"].forEach(function(a){z[a]=new v(a,4,false,a,null,false,false);});["cols","rows","size","span"].forEach(function(a){z[a]=new v(a,6,false,a,null,false,false);});["rowSpan","start"].forEach(function(a){z[a]=new v(a,5,false,a.toLowerCase(),null,false,false);});var ra=/[\-:]([a-z])/g;function sa(a){return a[1].toUpperCase()}
		"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a){var b=a.replace(ra,
		sa);z[b]=new v(b,1,false,a,null,false,false);});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a){var b=a.replace(ra,sa);z[b]=new v(b,1,false,a,"http://www.w3.org/1999/xlink",false,false);});["xml:base","xml:lang","xml:space"].forEach(function(a){var b=a.replace(ra,sa);z[b]=new v(b,1,false,a,"http://www.w3.org/XML/1998/namespace",false,false);});["tabIndex","crossOrigin"].forEach(function(a){z[a]=new v(a,1,false,a.toLowerCase(),null,false,false);});
		z.xlinkHref=new v("xlinkHref",1,false,"xlink:href","http://www.w3.org/1999/xlink",true,false);["src","href","action","formAction"].forEach(function(a){z[a]=new v(a,1,false,a.toLowerCase(),null,true,true);});
		function ta(a,b,c,d){var e=z.hasOwnProperty(b)?z[b]:null;if(null!==e?0!==e.type:d||!(2<b.length)||"o"!==b[0]&&"O"!==b[0]||"n"!==b[1]&&"N"!==b[1])qa(b,c,e,d)&&(c=null),d||null===e?oa(b)&&(null===c?a.removeAttribute(b):a.setAttribute(b,""+c)):e.mustUseProperty?a[e.propertyName]=null===c?3===e.type?false:"":c:(b=e.attributeName,d=e.attributeNamespace,null===c?a.removeAttribute(b):(e=e.type,c=3===e||4===e&&true===c?"":""+c,d?a.setAttributeNS(d,b,c):a.setAttribute(b,c)));}
		var ua=aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,va=Symbol.for("react.element"),wa=Symbol.for("react.portal"),ya=Symbol.for("react.fragment"),za=Symbol.for("react.strict_mode"),Aa=Symbol.for("react.profiler"),Ba=Symbol.for("react.provider"),Ca=Symbol.for("react.context"),Da=Symbol.for("react.forward_ref"),Ea=Symbol.for("react.suspense"),Fa=Symbol.for("react.suspense_list"),Ga=Symbol.for("react.memo"),Ha=Symbol.for("react.lazy");	var Ia=Symbol.for("react.offscreen");var Ja=Symbol.iterator;function Ka(a){if(null===a||"object"!==typeof a)return null;a=Ja&&a[Ja]||a["@@iterator"];return "function"===typeof a?a:null}var A=Object.assign,La;function Ma(a){if(void 0===La)try{throw Error();}catch(c){var b=c.stack.trim().match(/\n( *(at )?)/);La=b&&b[1]||"";}return "\n"+La+a}var Na=false;
		function Oa(a,b){if(!a||Na)return "";Na=true;var c=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(b)if(b=function(){throw Error();},Object.defineProperty(b.prototype,"props",{set:function(){throw Error();}}),"object"===typeof Reflect&&Reflect.construct){try{Reflect.construct(b,[]);}catch(l){var d=l;}Reflect.construct(a,[],b);}else {try{b.call();}catch(l){d=l;}a.call(b.prototype);}else {try{throw Error();}catch(l){d=l;}a();}}catch(l){if(l&&d&&"string"===typeof l.stack){for(var e=l.stack.split("\n"),
		f=d.stack.split("\n"),g=e.length-1,h=f.length-1;1<=g&&0<=h&&e[g]!==f[h];)h--;for(;1<=g&&0<=h;g--,h--)if(e[g]!==f[h]){if(1!==g||1!==h){do if(g--,h--,0>h||e[g]!==f[h]){var k="\n"+e[g].replace(" at new "," at ");a.displayName&&k.includes("<anonymous>")&&(k=k.replace("<anonymous>",a.displayName));return k}while(1<=g&&0<=h)}break}}}finally{Na=false,Error.prepareStackTrace=c;}return (a=a?a.displayName||a.name:"")?Ma(a):""}
		function Pa(a){switch(a.tag){case 5:return Ma(a.type);case 16:return Ma("Lazy");case 13:return Ma("Suspense");case 19:return Ma("SuspenseList");case 0:case 2:case 15:return a=Oa(a.type,false),a;case 11:return a=Oa(a.type.render,false),a;case 1:return a=Oa(a.type,true),a;default:return ""}}
		function Qa(a){if(null==a)return null;if("function"===typeof a)return a.displayName||a.name||null;if("string"===typeof a)return a;switch(a){case ya:return "Fragment";case wa:return "Portal";case Aa:return "Profiler";case za:return "StrictMode";case Ea:return "Suspense";case Fa:return "SuspenseList"}if("object"===typeof a)switch(a.$$typeof){case Ca:return (a.displayName||"Context")+".Consumer";case Ba:return (a._context.displayName||"Context")+".Provider";case Da:var b=a.render;a=a.displayName;a||(a=b.displayName||
		b.name||"",a=""!==a?"ForwardRef("+a+")":"ForwardRef");return a;case Ga:return b=a.displayName||null,null!==b?b:Qa(a.type)||"Memo";case Ha:b=a._payload;a=a._init;try{return Qa(a(b))}catch(c){}}return null}
		function Ra(a){var b=a.type;switch(a.tag){case 24:return "Cache";case 9:return (b.displayName||"Context")+".Consumer";case 10:return (b._context.displayName||"Context")+".Provider";case 18:return "DehydratedFragment";case 11:return a=b.render,a=a.displayName||a.name||"",b.displayName||(""!==a?"ForwardRef("+a+")":"ForwardRef");case 7:return "Fragment";case 5:return b;case 4:return "Portal";case 3:return "Root";case 6:return "Text";case 16:return Qa(b);case 8:return b===za?"StrictMode":"Mode";case 22:return "Offscreen";
		case 12:return "Profiler";case 21:return "Scope";case 13:return "Suspense";case 19:return "SuspenseList";case 25:return "TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if("function"===typeof b)return b.displayName||b.name||null;if("string"===typeof b)return b}return null}function Sa(a){switch(typeof a){case "boolean":case "number":case "string":case "undefined":return a;case "object":return a;default:return ""}}
		function Ta(a){var b=a.type;return (a=a.nodeName)&&"input"===a.toLowerCase()&&("checkbox"===b||"radio"===b)}
		function Ua(a){var b=Ta(a)?"checked":"value",c=Object.getOwnPropertyDescriptor(a.constructor.prototype,b),d=""+a[b];if(!a.hasOwnProperty(b)&&"undefined"!==typeof c&&"function"===typeof c.get&&"function"===typeof c.set){var e=c.get,f=c.set;Object.defineProperty(a,b,{configurable:true,get:function(){return e.call(this)},set:function(a){d=""+a;f.call(this,a);}});Object.defineProperty(a,b,{enumerable:c.enumerable});return {getValue:function(){return d},setValue:function(a){d=""+a;},stopTracking:function(){a._valueTracker=
		null;delete a[b];}}}}function Va(a){a._valueTracker||(a._valueTracker=Ua(a));}function Wa(a){if(!a)return  false;var b=a._valueTracker;if(!b)return  true;var c=b.getValue();var d="";a&&(d=Ta(a)?a.checked?"true":"false":a.value);a=d;return a!==c?(b.setValue(a),true):false}function Xa(a){a=a||("undefined"!==typeof document?document:void 0);if("undefined"===typeof a)return null;try{return a.activeElement||a.body}catch(b){return a.body}}
		function Ya(a,b){var c=b.checked;return A({},b,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:null!=c?c:a._wrapperState.initialChecked})}function Za(a,b){var c=null==b.defaultValue?"":b.defaultValue,d=null!=b.checked?b.checked:b.defaultChecked;c=Sa(null!=b.value?b.value:c);a._wrapperState={initialChecked:d,initialValue:c,controlled:"checkbox"===b.type||"radio"===b.type?null!=b.checked:null!=b.value};}function ab(a,b){b=b.checked;null!=b&&ta(a,"checked",b,false);}
		function bb(a,b){ab(a,b);var c=Sa(b.value),d=b.type;if(null!=c)if("number"===d){if(0===c&&""===a.value||a.value!=c)a.value=""+c;}else a.value!==""+c&&(a.value=""+c);else if("submit"===d||"reset"===d){a.removeAttribute("value");return}b.hasOwnProperty("value")?cb(a,b.type,c):b.hasOwnProperty("defaultValue")&&cb(a,b.type,Sa(b.defaultValue));null==b.checked&&null!=b.defaultChecked&&(a.defaultChecked=!!b.defaultChecked);}
		function db(a,b,c){if(b.hasOwnProperty("value")||b.hasOwnProperty("defaultValue")){var d=b.type;if(!("submit"!==d&&"reset"!==d||void 0!==b.value&&null!==b.value))return;b=""+a._wrapperState.initialValue;c||b===a.value||(a.value=b);a.defaultValue=b;}c=a.name;""!==c&&(a.name="");a.defaultChecked=!!a._wrapperState.initialChecked;""!==c&&(a.name=c);}
		function cb(a,b,c){if("number"!==b||Xa(a.ownerDocument)!==a)null==c?a.defaultValue=""+a._wrapperState.initialValue:a.defaultValue!==""+c&&(a.defaultValue=""+c);}var eb=Array.isArray;
		function fb(a,b,c,d){a=a.options;if(b){b={};for(var e=0;e<c.length;e++)b["$"+c[e]]=true;for(c=0;c<a.length;c++)e=b.hasOwnProperty("$"+a[c].value),a[c].selected!==e&&(a[c].selected=e),e&&d&&(a[c].defaultSelected=true);}else {c=""+Sa(c);b=null;for(e=0;e<a.length;e++){if(a[e].value===c){a[e].selected=true;d&&(a[e].defaultSelected=true);return}null!==b||a[e].disabled||(b=a[e]);}null!==b&&(b.selected=true);}}
		function gb(a,b){if(null!=b.dangerouslySetInnerHTML)throw Error(p(91));return A({},b,{value:void 0,defaultValue:void 0,children:""+a._wrapperState.initialValue})}function hb(a,b){var c=b.value;if(null==c){c=b.children;b=b.defaultValue;if(null!=c){if(null!=b)throw Error(p(92));if(eb(c)){if(1<c.length)throw Error(p(93));c=c[0];}b=c;}null==b&&(b="");c=b;}a._wrapperState={initialValue:Sa(c)};}
		function ib(a,b){var c=Sa(b.value),d=Sa(b.defaultValue);null!=c&&(c=""+c,c!==a.value&&(a.value=c),null==b.defaultValue&&a.defaultValue!==c&&(a.defaultValue=c));null!=d&&(a.defaultValue=""+d);}function jb(a){var b=a.textContent;b===a._wrapperState.initialValue&&""!==b&&null!==b&&(a.value=b);}function kb(a){switch(a){case "svg":return "http://www.w3.org/2000/svg";case "math":return "http://www.w3.org/1998/Math/MathML";default:return "http://www.w3.org/1999/xhtml"}}
		function lb(a,b){return null==a||"http://www.w3.org/1999/xhtml"===a?kb(b):"http://www.w3.org/2000/svg"===a&&"foreignObject"===b?"http://www.w3.org/1999/xhtml":a}
		var mb,nb=function(a){return "undefined"!==typeof MSApp&&MSApp.execUnsafeLocalFunction?function(b,c,d,e){MSApp.execUnsafeLocalFunction(function(){return a(b,c,d,e)});}:a}(function(a,b){if("http://www.w3.org/2000/svg"!==a.namespaceURI||"innerHTML"in a)a.innerHTML=b;else {mb=mb||document.createElement("div");mb.innerHTML="<svg>"+b.valueOf().toString()+"</svg>";for(b=mb.firstChild;a.firstChild;)a.removeChild(a.firstChild);for(;b.firstChild;)a.appendChild(b.firstChild);}});
		function ob(a,b){if(b){var c=a.firstChild;if(c&&c===a.lastChild&&3===c.nodeType){c.nodeValue=b;return}}a.textContent=b;}
		var pb={animationIterationCount:true,aspectRatio:true,borderImageOutset:true,borderImageSlice:true,borderImageWidth:true,boxFlex:true,boxFlexGroup:true,boxOrdinalGroup:true,columnCount:true,columns:true,flex:true,flexGrow:true,flexPositive:true,flexShrink:true,flexNegative:true,flexOrder:true,gridArea:true,gridRow:true,gridRowEnd:true,gridRowSpan:true,gridRowStart:true,gridColumn:true,gridColumnEnd:true,gridColumnSpan:true,gridColumnStart:true,fontWeight:true,lineClamp:true,lineHeight:true,opacity:true,order:true,orphans:true,tabSize:true,widows:true,zIndex:true,
		zoom:true,fillOpacity:true,floodOpacity:true,stopOpacity:true,strokeDasharray:true,strokeDashoffset:true,strokeMiterlimit:true,strokeOpacity:true,strokeWidth:true},qb=["Webkit","ms","Moz","O"];Object.keys(pb).forEach(function(a){qb.forEach(function(b){b=b+a.charAt(0).toUpperCase()+a.substring(1);pb[b]=pb[a];});});function rb(a,b,c){return null==b||"boolean"===typeof b||""===b?"":c||"number"!==typeof b||0===b||pb.hasOwnProperty(a)&&pb[a]?(""+b).trim():b+"px"}
		function sb(a,b){a=a.style;for(var c in b)if(b.hasOwnProperty(c)){var d=0===c.indexOf("--"),e=rb(c,b[c],d);"float"===c&&(c="cssFloat");d?a.setProperty(c,e):a[c]=e;}}var tb=A({menuitem:true},{area:true,base:true,br:true,col:true,embed:true,hr:true,img:true,input:true,keygen:true,link:true,meta:true,param:true,source:true,track:true,wbr:true});
		function ub(a,b){if(b){if(tb[a]&&(null!=b.children||null!=b.dangerouslySetInnerHTML))throw Error(p(137,a));if(null!=b.dangerouslySetInnerHTML){if(null!=b.children)throw Error(p(60));if("object"!==typeof b.dangerouslySetInnerHTML||!("__html"in b.dangerouslySetInnerHTML))throw Error(p(61));}if(null!=b.style&&"object"!==typeof b.style)throw Error(p(62));}}
		function vb(a,b){if(-1===a.indexOf("-"))return "string"===typeof b.is;switch(a){case "annotation-xml":case "color-profile":case "font-face":case "font-face-src":case "font-face-uri":case "font-face-format":case "font-face-name":case "missing-glyph":return  false;default:return  true}}var wb=null;function xb(a){a=a.target||a.srcElement||window;a.correspondingUseElement&&(a=a.correspondingUseElement);return 3===a.nodeType?a.parentNode:a}var yb=null,zb=null,Ab=null;
		function Bb(a){if(a=Cb(a)){if("function"!==typeof yb)throw Error(p(280));var b=a.stateNode;b&&(b=Db(b),yb(a.stateNode,a.type,b));}}function Eb(a){zb?Ab?Ab.push(a):Ab=[a]:zb=a;}function Fb(){if(zb){var a=zb,b=Ab;Ab=zb=null;Bb(a);if(b)for(a=0;a<b.length;a++)Bb(b[a]);}}function Gb(a,b){return a(b)}function Hb(){}var Ib=false;function Jb(a,b,c){if(Ib)return a(b,c);Ib=true;try{return Gb(a,b,c)}finally{if(Ib=false,null!==zb||null!==Ab)Hb(),Fb();}}
		function Kb(a,b){var c=a.stateNode;if(null===c)return null;var d=Db(c);if(null===d)return null;c=d[b];a:switch(b){case "onClick":case "onClickCapture":case "onDoubleClick":case "onDoubleClickCapture":case "onMouseDown":case "onMouseDownCapture":case "onMouseMove":case "onMouseMoveCapture":case "onMouseUp":case "onMouseUpCapture":case "onMouseEnter":(d=!d.disabled)||(a=a.type,d=!("button"===a||"input"===a||"select"===a||"textarea"===a));a=!d;break a;default:a=false;}if(a)return null;if(c&&"function"!==
		typeof c)throw Error(p(231,b,typeof c));return c}var Lb=false;if(ia)try{var Mb={};Object.defineProperty(Mb,"passive",{get:function(){Lb=!0;}});window.addEventListener("test",Mb,Mb);window.removeEventListener("test",Mb,Mb);}catch(a){Lb=false;}function Nb(a,b,c,d,e,f,g,h,k){var l=Array.prototype.slice.call(arguments,3);try{b.apply(c,l);}catch(m){this.onError(m);}}var Ob=false,Pb=null,Qb=false,Rb=null,Sb={onError:function(a){Ob=true;Pb=a;}};function Tb(a,b,c,d,e,f,g,h,k){Ob=false;Pb=null;Nb.apply(Sb,arguments);}
		function Ub(a,b,c,d,e,f,g,h,k){Tb.apply(this,arguments);if(Ob){if(Ob){var l=Pb;Ob=false;Pb=null;}else throw Error(p(198));Qb||(Qb=true,Rb=l);}}function Vb(a){var b=a,c=a;if(a.alternate)for(;b.return;)b=b.return;else {a=b;do b=a,0!==(b.flags&4098)&&(c=b.return),a=b.return;while(a)}return 3===b.tag?c:null}function Wb(a){if(13===a.tag){var b=a.memoizedState;null===b&&(a=a.alternate,null!==a&&(b=a.memoizedState));if(null!==b)return b.dehydrated}return null}function Xb(a){if(Vb(a)!==a)throw Error(p(188));}
		function Yb(a){var b=a.alternate;if(!b){b=Vb(a);if(null===b)throw Error(p(188));return b!==a?null:a}for(var c=a,d=b;;){var e=c.return;if(null===e)break;var f=e.alternate;if(null===f){d=e.return;if(null!==d){c=d;continue}break}if(e.child===f.child){for(f=e.child;f;){if(f===c)return Xb(e),a;if(f===d)return Xb(e),b;f=f.sibling;}throw Error(p(188));}if(c.return!==d.return)c=e,d=f;else {for(var g=false,h=e.child;h;){if(h===c){g=true;c=e;d=f;break}if(h===d){g=true;d=e;c=f;break}h=h.sibling;}if(!g){for(h=f.child;h;){if(h===
		c){g=true;c=f;d=e;break}if(h===d){g=true;d=f;c=e;break}h=h.sibling;}if(!g)throw Error(p(189));}}if(c.alternate!==d)throw Error(p(190));}if(3!==c.tag)throw Error(p(188));return c.stateNode.current===c?a:b}function Zb(a){a=Yb(a);return null!==a?$b(a):null}function $b(a){if(5===a.tag||6===a.tag)return a;for(a=a.child;null!==a;){var b=$b(a);if(null!==b)return b;a=a.sibling;}return null}
		var ac=ca.unstable_scheduleCallback,bc=ca.unstable_cancelCallback,cc=ca.unstable_shouldYield,dc=ca.unstable_requestPaint,B=ca.unstable_now,ec=ca.unstable_getCurrentPriorityLevel,fc=ca.unstable_ImmediatePriority,gc=ca.unstable_UserBlockingPriority,hc=ca.unstable_NormalPriority,ic=ca.unstable_LowPriority,jc=ca.unstable_IdlePriority,kc=null,lc=null;function mc(a){if(lc&&"function"===typeof lc.onCommitFiberRoot)try{lc.onCommitFiberRoot(kc,a,void 0,128===(a.current.flags&128));}catch(b){}}
		var oc=Math.clz32?Math.clz32:nc,pc=Math.log,qc=Math.LN2;function nc(a){a>>>=0;return 0===a?32:31-(pc(a)/qc|0)|0}var rc=64,sc=4194304;
		function tc(a){switch(a&-a){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return a&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return a&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;
		default:return a}}function uc(a,b){var c=a.pendingLanes;if(0===c)return 0;var d=0,e=a.suspendedLanes,f=a.pingedLanes,g=c&268435455;if(0!==g){var h=g&~e;0!==h?d=tc(h):(f&=g,0!==f&&(d=tc(f)));}else g=c&~e,0!==g?d=tc(g):0!==f&&(d=tc(f));if(0===d)return 0;if(0!==b&&b!==d&&0===(b&e)&&(e=d&-d,f=b&-b,e>=f||16===e&&0!==(f&4194240)))return b;0!==(d&4)&&(d|=c&16);b=a.entangledLanes;if(0!==b)for(a=a.entanglements,b&=d;0<b;)c=31-oc(b),e=1<<c,d|=a[c],b&=~e;return d}
		function vc(a,b){switch(a){case 1:case 2:case 4:return b+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return b+5E3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return  -1;case 134217728:case 268435456:case 536870912:case 1073741824:return  -1;default:return  -1}}
		function wc(a,b){for(var c=a.suspendedLanes,d=a.pingedLanes,e=a.expirationTimes,f=a.pendingLanes;0<f;){var g=31-oc(f),h=1<<g,k=e[g];if(-1===k){if(0===(h&c)||0!==(h&d))e[g]=vc(h,b);}else k<=b&&(a.expiredLanes|=h);f&=~h;}}function xc(a){a=a.pendingLanes&-1073741825;return 0!==a?a:a&1073741824?1073741824:0}function yc(){var a=rc;rc<<=1;0===(rc&4194240)&&(rc=64);return a}function zc(a){for(var b=[],c=0;31>c;c++)b.push(a);return b}
		function Ac(a,b,c){a.pendingLanes|=b;536870912!==b&&(a.suspendedLanes=0,a.pingedLanes=0);a=a.eventTimes;b=31-oc(b);a[b]=c;}function Bc(a,b){var c=a.pendingLanes&~b;a.pendingLanes=b;a.suspendedLanes=0;a.pingedLanes=0;a.expiredLanes&=b;a.mutableReadLanes&=b;a.entangledLanes&=b;b=a.entanglements;var d=a.eventTimes;for(a=a.expirationTimes;0<c;){var e=31-oc(c),f=1<<e;b[e]=0;d[e]=-1;a[e]=-1;c&=~f;}}
		function Cc(a,b){var c=a.entangledLanes|=b;for(a=a.entanglements;c;){var d=31-oc(c),e=1<<d;e&b|a[d]&b&&(a[d]|=b);c&=~e;}}var C=0;function Dc(a){a&=-a;return 1<a?4<a?0!==(a&268435455)?16:536870912:4:1}var Ec,Fc,Gc,Hc,Ic,Jc=false,Kc=[],Lc=null,Mc=null,Nc=null,Oc=new Map,Pc=new Map,Qc=[],Rc="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
		function Sc(a,b){switch(a){case "focusin":case "focusout":Lc=null;break;case "dragenter":case "dragleave":Mc=null;break;case "mouseover":case "mouseout":Nc=null;break;case "pointerover":case "pointerout":Oc.delete(b.pointerId);break;case "gotpointercapture":case "lostpointercapture":Pc.delete(b.pointerId);}}
		function Tc(a,b,c,d,e,f){if(null===a||a.nativeEvent!==f)return a={blockedOn:b,domEventName:c,eventSystemFlags:d,nativeEvent:f,targetContainers:[e]},null!==b&&(b=Cb(b),null!==b&&Fc(b)),a;a.eventSystemFlags|=d;b=a.targetContainers;null!==e&&-1===b.indexOf(e)&&b.push(e);return a}
		function Uc(a,b,c,d,e){switch(b){case "focusin":return Lc=Tc(Lc,a,b,c,d,e),true;case "dragenter":return Mc=Tc(Mc,a,b,c,d,e),true;case "mouseover":return Nc=Tc(Nc,a,b,c,d,e),true;case "pointerover":var f=e.pointerId;Oc.set(f,Tc(Oc.get(f)||null,a,b,c,d,e));return  true;case "gotpointercapture":return f=e.pointerId,Pc.set(f,Tc(Pc.get(f)||null,a,b,c,d,e)),true}return  false}
		function Vc(a){var b=Wc(a.target);if(null!==b){var c=Vb(b);if(null!==c)if(b=c.tag,13===b){if(b=Wb(c),null!==b){a.blockedOn=b;Ic(a.priority,function(){Gc(c);});return}}else if(3===b&&c.stateNode.current.memoizedState.isDehydrated){a.blockedOn=3===c.tag?c.stateNode.containerInfo:null;return}}a.blockedOn=null;}
		function Xc(a){if(null!==a.blockedOn)return  false;for(var b=a.targetContainers;0<b.length;){var c=Yc(a.domEventName,a.eventSystemFlags,b[0],a.nativeEvent);if(null===c){c=a.nativeEvent;var d=new c.constructor(c.type,c);wb=d;c.target.dispatchEvent(d);wb=null;}else return b=Cb(c),null!==b&&Fc(b),a.blockedOn=c,false;b.shift();}return  true}function Zc(a,b,c){Xc(a)&&c.delete(b);}function $c(){Jc=false;null!==Lc&&Xc(Lc)&&(Lc=null);null!==Mc&&Xc(Mc)&&(Mc=null);null!==Nc&&Xc(Nc)&&(Nc=null);Oc.forEach(Zc);Pc.forEach(Zc);}
		function ad(a,b){a.blockedOn===b&&(a.blockedOn=null,Jc||(Jc=true,ca.unstable_scheduleCallback(ca.unstable_NormalPriority,$c)));}
		function bd(a){function b(b){return ad(b,a)}if(0<Kc.length){ad(Kc[0],a);for(var c=1;c<Kc.length;c++){var d=Kc[c];d.blockedOn===a&&(d.blockedOn=null);}}null!==Lc&&ad(Lc,a);null!==Mc&&ad(Mc,a);null!==Nc&&ad(Nc,a);Oc.forEach(b);Pc.forEach(b);for(c=0;c<Qc.length;c++)d=Qc[c],d.blockedOn===a&&(d.blockedOn=null);for(;0<Qc.length&&(c=Qc[0],null===c.blockedOn);)Vc(c),null===c.blockedOn&&Qc.shift();}var cd=ua.ReactCurrentBatchConfig,dd=true;
		function ed(a,b,c,d){var e=C,f=cd.transition;cd.transition=null;try{C=1,fd(a,b,c,d);}finally{C=e,cd.transition=f;}}function gd(a,b,c,d){var e=C,f=cd.transition;cd.transition=null;try{C=4,fd(a,b,c,d);}finally{C=e,cd.transition=f;}}
		function fd(a,b,c,d){if(dd){var e=Yc(a,b,c,d);if(null===e)hd(a,b,d,id,c),Sc(a,d);else if(Uc(e,a,b,c,d))d.stopPropagation();else if(Sc(a,d),b&4&&-1<Rc.indexOf(a)){for(;null!==e;){var f=Cb(e);null!==f&&Ec(f);f=Yc(a,b,c,d);null===f&&hd(a,b,d,id,c);if(f===e)break;e=f;}null!==e&&d.stopPropagation();}else hd(a,b,d,null,c);}}var id=null;
		function Yc(a,b,c,d){id=null;a=xb(d);a=Wc(a);if(null!==a)if(b=Vb(a),null===b)a=null;else if(c=b.tag,13===c){a=Wb(b);if(null!==a)return a;a=null;}else if(3===c){if(b.stateNode.current.memoizedState.isDehydrated)return 3===b.tag?b.stateNode.containerInfo:null;a=null;}else b!==a&&(a=null);id=a;return null}
		function jd(a){switch(a){case "cancel":case "click":case "close":case "contextmenu":case "copy":case "cut":case "auxclick":case "dblclick":case "dragend":case "dragstart":case "drop":case "focusin":case "focusout":case "input":case "invalid":case "keydown":case "keypress":case "keyup":case "mousedown":case "mouseup":case "paste":case "pause":case "play":case "pointercancel":case "pointerdown":case "pointerup":case "ratechange":case "reset":case "resize":case "seeked":case "submit":case "touchcancel":case "touchend":case "touchstart":case "volumechange":case "change":case "selectionchange":case "textInput":case "compositionstart":case "compositionend":case "compositionupdate":case "beforeblur":case "afterblur":case "beforeinput":case "blur":case "fullscreenchange":case "focus":case "hashchange":case "popstate":case "select":case "selectstart":return 1;case "drag":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "mousemove":case "mouseout":case "mouseover":case "pointermove":case "pointerout":case "pointerover":case "scroll":case "toggle":case "touchmove":case "wheel":case "mouseenter":case "mouseleave":case "pointerenter":case "pointerleave":return 4;
		case "message":switch(ec()){case fc:return 1;case gc:return 4;case hc:case ic:return 16;case jc:return 536870912;default:return 16}default:return 16}}var kd=null,ld=null,md=null;function nd(){if(md)return md;var a,b=ld,c=b.length,d,e="value"in kd?kd.value:kd.textContent,f=e.length;for(a=0;a<c&&b[a]===e[a];a++);var g=c-a;for(d=1;d<=g&&b[c-d]===e[f-d];d++);return md=e.slice(a,1<d?1-d:void 0)}
		function od(a){var b=a.keyCode;"charCode"in a?(a=a.charCode,0===a&&13===b&&(a=13)):a=b;10===a&&(a=13);return 32<=a||13===a?a:0}function pd(){return  true}function qd(){return  false}
		function rd(a){function b(b,d,e,f,g){this._reactName=b;this._targetInst=e;this.type=d;this.nativeEvent=f;this.target=g;this.currentTarget=null;for(var c in a)a.hasOwnProperty(c)&&(b=a[c],this[c]=b?b(f):f[c]);this.isDefaultPrevented=(null!=f.defaultPrevented?f.defaultPrevented:false===f.returnValue)?pd:qd;this.isPropagationStopped=qd;return this}A(b.prototype,{preventDefault:function(){this.defaultPrevented=true;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():"unknown"!==typeof a.returnValue&&
		(a.returnValue=false),this.isDefaultPrevented=pd);},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():"unknown"!==typeof a.cancelBubble&&(a.cancelBubble=true),this.isPropagationStopped=pd);},persist:function(){},isPersistent:pd});return b}
		var sd={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(a){return a.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},td=rd(sd),ud=A({},sd,{view:0,detail:0}),vd=rd(ud),wd,xd,yd,Ad=A({},ud,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:zd,button:0,buttons:0,relatedTarget:function(a){return void 0===a.relatedTarget?a.fromElement===a.srcElement?a.toElement:a.fromElement:a.relatedTarget},movementX:function(a){if("movementX"in
		a)return a.movementX;a!==yd&&(yd&&"mousemove"===a.type?(wd=a.screenX-yd.screenX,xd=a.screenY-yd.screenY):xd=wd=0,yd=a);return wd},movementY:function(a){return "movementY"in a?a.movementY:xd}}),Bd=rd(Ad),Cd=A({},Ad,{dataTransfer:0}),Dd=rd(Cd),Ed=A({},ud,{relatedTarget:0}),Fd=rd(Ed),Gd=A({},sd,{animationName:0,elapsedTime:0,pseudoElement:0}),Hd=rd(Gd),Id=A({},sd,{clipboardData:function(a){return "clipboardData"in a?a.clipboardData:window.clipboardData}}),Jd=rd(Id),Kd=A({},sd,{data:0}),Ld=rd(Kd),Md={Esc:"Escape",
		Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Nd={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",
		119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Od={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Pd(a){var b=this.nativeEvent;return b.getModifierState?b.getModifierState(a):(a=Od[a])?!!b[a]:false}function zd(){return Pd}
		var Qd=A({},ud,{key:function(a){if(a.key){var b=Md[a.key]||a.key;if("Unidentified"!==b)return b}return "keypress"===a.type?(a=od(a),13===a?"Enter":String.fromCharCode(a)):"keydown"===a.type||"keyup"===a.type?Nd[a.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:zd,charCode:function(a){return "keypress"===a.type?od(a):0},keyCode:function(a){return "keydown"===a.type||"keyup"===a.type?a.keyCode:0},which:function(a){return "keypress"===
		a.type?od(a):"keydown"===a.type||"keyup"===a.type?a.keyCode:0}}),Rd=rd(Qd),Sd=A({},Ad,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Td=rd(Sd),Ud=A({},ud,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:zd}),Vd=rd(Ud),Wd=A({},sd,{propertyName:0,elapsedTime:0,pseudoElement:0}),Xd=rd(Wd),Yd=A({},Ad,{deltaX:function(a){return "deltaX"in a?a.deltaX:"wheelDeltaX"in a?-a.wheelDeltaX:0},
		deltaY:function(a){return "deltaY"in a?a.deltaY:"wheelDeltaY"in a?-a.wheelDeltaY:"wheelDelta"in a?-a.wheelDelta:0},deltaZ:0,deltaMode:0}),Zd=rd(Yd),$d=[9,13,27,32],ae=ia&&"CompositionEvent"in window,be=null;ia&&"documentMode"in document&&(be=document.documentMode);var ce=ia&&"TextEvent"in window&&!be,de=ia&&(!ae||be&&8<be&&11>=be),ee=String.fromCharCode(32),fe=false;
		function ge(a,b){switch(a){case "keyup":return  -1!==$d.indexOf(b.keyCode);case "keydown":return 229!==b.keyCode;case "keypress":case "mousedown":case "focusout":return  true;default:return  false}}function he(a){a=a.detail;return "object"===typeof a&&"data"in a?a.data:null}var ie=false;function je(a,b){switch(a){case "compositionend":return he(b);case "keypress":if(32!==b.which)return null;fe=true;return ee;case "textInput":return a=b.data,a===ee&&fe?null:a;default:return null}}
		function ke(a,b){if(ie)return "compositionend"===a||!ae&&ge(a,b)?(a=nd(),md=ld=kd=null,ie=false,a):null;switch(a){case "paste":return null;case "keypress":if(!(b.ctrlKey||b.altKey||b.metaKey)||b.ctrlKey&&b.altKey){if(b.char&&1<b.char.length)return b.char;if(b.which)return String.fromCharCode(b.which)}return null;case "compositionend":return de&&"ko"!==b.locale?null:b.data;default:return null}}
		var le={color:true,date:true,datetime:true,"datetime-local":true,email:true,month:true,number:true,password:true,range:true,search:true,tel:true,text:true,time:true,url:true,week:true};function me(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return "input"===b?!!le[a.type]:"textarea"===b?true:false}function ne(a,b,c,d){Eb(d);b=oe(b,"onChange");0<b.length&&(c=new td("onChange","change",null,c,d),a.push({event:c,listeners:b}));}var pe=null,qe=null;function re(a){se(a,0);}function te(a){var b=ue(a);if(Wa(b))return a}
		function ve(a,b){if("change"===a)return b}var we=false;if(ia){var xe;if(ia){var ye="oninput"in document;if(!ye){var ze=document.createElement("div");ze.setAttribute("oninput","return;");ye="function"===typeof ze.oninput;}xe=ye;}else xe=false;we=xe&&(!document.documentMode||9<document.documentMode);}function Ae(){pe&&(pe.detachEvent("onpropertychange",Be),qe=pe=null);}function Be(a){if("value"===a.propertyName&&te(qe)){var b=[];ne(b,qe,a,xb(a));Jb(re,b);}}
		function Ce(a,b,c){"focusin"===a?(Ae(),pe=b,qe=c,pe.attachEvent("onpropertychange",Be)):"focusout"===a&&Ae();}function De(a){if("selectionchange"===a||"keyup"===a||"keydown"===a)return te(qe)}function Ee(a,b){if("click"===a)return te(b)}function Fe(a,b){if("input"===a||"change"===a)return te(b)}function Ge(a,b){return a===b&&(0!==a||1/a===1/b)||a!==a&&b!==b}var He="function"===typeof Object.is?Object.is:Ge;
		function Ie(a,b){if(He(a,b))return  true;if("object"!==typeof a||null===a||"object"!==typeof b||null===b)return  false;var c=Object.keys(a),d=Object.keys(b);if(c.length!==d.length)return  false;for(d=0;d<c.length;d++){var e=c[d];if(!ja.call(b,e)||!He(a[e],b[e]))return  false}return  true}function Je(a){for(;a&&a.firstChild;)a=a.firstChild;return a}
		function Ke(a,b){var c=Je(a);a=0;for(var d;c;){if(3===c.nodeType){d=a+c.textContent.length;if(a<=b&&d>=b)return {node:c,offset:b-a};a=d;}a:{for(;c;){if(c.nextSibling){c=c.nextSibling;break a}c=c.parentNode;}c=void 0;}c=Je(c);}}function Le(a,b){return a&&b?a===b?true:a&&3===a.nodeType?false:b&&3===b.nodeType?Le(a,b.parentNode):"contains"in a?a.contains(b):a.compareDocumentPosition?!!(a.compareDocumentPosition(b)&16):false:false}
		function Me(){for(var a=window,b=Xa();b instanceof a.HTMLIFrameElement;){try{var c="string"===typeof b.contentWindow.location.href;}catch(d){c=false;}if(c)a=b.contentWindow;else break;b=Xa(a.document);}return b}function Ne(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return b&&("input"===b&&("text"===a.type||"search"===a.type||"tel"===a.type||"url"===a.type||"password"===a.type)||"textarea"===b||"true"===a.contentEditable)}
		function Oe(a){var b=Me(),c=a.focusedElem,d=a.selectionRange;if(b!==c&&c&&c.ownerDocument&&Le(c.ownerDocument.documentElement,c)){if(null!==d&&Ne(c))if(b=d.start,a=d.end,void 0===a&&(a=b),"selectionStart"in c)c.selectionStart=b,c.selectionEnd=Math.min(a,c.value.length);else if(a=(b=c.ownerDocument||document)&&b.defaultView||window,a.getSelection){a=a.getSelection();var e=c.textContent.length,f=Math.min(d.start,e);d=void 0===d.end?f:Math.min(d.end,e);!a.extend&&f>d&&(e=d,d=f,f=e);e=Ke(c,f);var g=Ke(c,
		d);e&&g&&(1!==a.rangeCount||a.anchorNode!==e.node||a.anchorOffset!==e.offset||a.focusNode!==g.node||a.focusOffset!==g.offset)&&(b=b.createRange(),b.setStart(e.node,e.offset),a.removeAllRanges(),f>d?(a.addRange(b),a.extend(g.node,g.offset)):(b.setEnd(g.node,g.offset),a.addRange(b)));}b=[];for(a=c;a=a.parentNode;)1===a.nodeType&&b.push({element:a,left:a.scrollLeft,top:a.scrollTop});"function"===typeof c.focus&&c.focus();for(c=0;c<b.length;c++)a=b[c],a.element.scrollLeft=a.left,a.element.scrollTop=a.top;}}
		var Pe=ia&&"documentMode"in document&&11>=document.documentMode,Qe=null,Re=null,Se=null,Te=false;
		function Ue(a,b,c){var d=c.window===c?c.document:9===c.nodeType?c:c.ownerDocument;Te||null==Qe||Qe!==Xa(d)||(d=Qe,"selectionStart"in d&&Ne(d)?d={start:d.selectionStart,end:d.selectionEnd}:(d=(d.ownerDocument&&d.ownerDocument.defaultView||window).getSelection(),d={anchorNode:d.anchorNode,anchorOffset:d.anchorOffset,focusNode:d.focusNode,focusOffset:d.focusOffset}),Se&&Ie(Se,d)||(Se=d,d=oe(Re,"onSelect"),0<d.length&&(b=new td("onSelect","select",null,b,c),a.push({event:b,listeners:d}),b.target=Qe)));}
		function Ve(a,b){var c={};c[a.toLowerCase()]=b.toLowerCase();c["Webkit"+a]="webkit"+b;c["Moz"+a]="moz"+b;return c}var We={animationend:Ve("Animation","AnimationEnd"),animationiteration:Ve("Animation","AnimationIteration"),animationstart:Ve("Animation","AnimationStart"),transitionend:Ve("Transition","TransitionEnd")},Xe={},Ye={};
		ia&&(Ye=document.createElement("div").style,"AnimationEvent"in window||(delete We.animationend.animation,delete We.animationiteration.animation,delete We.animationstart.animation),"TransitionEvent"in window||delete We.transitionend.transition);function Ze(a){if(Xe[a])return Xe[a];if(!We[a])return a;var b=We[a],c;for(c in b)if(b.hasOwnProperty(c)&&c in Ye)return Xe[a]=b[c];return a}var $e=Ze("animationend"),af=Ze("animationiteration"),bf=Ze("animationstart"),cf=Ze("transitionend"),df=new Map,ef="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
		function ff(a,b){df.set(a,b);fa(b,[a]);}for(var gf=0;gf<ef.length;gf++){var hf=ef[gf],jf=hf.toLowerCase(),kf=hf[0].toUpperCase()+hf.slice(1);ff(jf,"on"+kf);}ff($e,"onAnimationEnd");ff(af,"onAnimationIteration");ff(bf,"onAnimationStart");ff("dblclick","onDoubleClick");ff("focusin","onFocus");ff("focusout","onBlur");ff(cf,"onTransitionEnd");ha("onMouseEnter",["mouseout","mouseover"]);ha("onMouseLeave",["mouseout","mouseover"]);ha("onPointerEnter",["pointerout","pointerover"]);
		ha("onPointerLeave",["pointerout","pointerover"]);fa("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));fa("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));fa("onBeforeInput",["compositionend","keypress","textInput","paste"]);fa("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));fa("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));
		fa("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var lf="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),mf=new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
		function nf(a,b,c){var d=a.type||"unknown-event";a.currentTarget=c;Ub(d,b,void 0,a);a.currentTarget=null;}
		function se(a,b){b=0!==(b&4);for(var c=0;c<a.length;c++){var d=a[c],e=d.event;d=d.listeners;a:{var f=void 0;if(b)for(var g=d.length-1;0<=g;g--){var h=d[g],k=h.instance,l=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;nf(e,h,l);f=k;}else for(g=0;g<d.length;g++){h=d[g];k=h.instance;l=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;nf(e,h,l);f=k;}}}if(Qb)throw a=Rb,Qb=false,Rb=null,a;}
		function D(a,b){var c=b[of];void 0===c&&(c=b[of]=new Set);var d=a+"__bubble";c.has(d)||(pf(b,a,2,false),c.add(d));}function qf(a,b,c){var d=0;b&&(d|=4);pf(c,a,d,b);}var rf="_reactListening"+Math.random().toString(36).slice(2);function sf(a){if(!a[rf]){a[rf]=true;da.forEach(function(b){"selectionchange"!==b&&(mf.has(b)||qf(b,false,a),qf(b,true,a));});var b=9===a.nodeType?a:a.ownerDocument;null===b||b[rf]||(b[rf]=true,qf("selectionchange",false,b));}}
		function pf(a,b,c,d){switch(jd(b)){case 1:var e=ed;break;case 4:e=gd;break;default:e=fd;}c=e.bind(null,b,c,a);e=void 0;!Lb||"touchstart"!==b&&"touchmove"!==b&&"wheel"!==b||(e=true);d?void 0!==e?a.addEventListener(b,c,{capture:true,passive:e}):a.addEventListener(b,c,true):void 0!==e?a.addEventListener(b,c,{passive:e}):a.addEventListener(b,c,false);}
		function hd(a,b,c,d,e){var f=d;if(0===(b&1)&&0===(b&2)&&null!==d)a:for(;;){if(null===d)return;var g=d.tag;if(3===g||4===g){var h=d.stateNode.containerInfo;if(h===e||8===h.nodeType&&h.parentNode===e)break;if(4===g)for(g=d.return;null!==g;){var k=g.tag;if(3===k||4===k)if(k=g.stateNode.containerInfo,k===e||8===k.nodeType&&k.parentNode===e)return;g=g.return;}for(;null!==h;){g=Wc(h);if(null===g)return;k=g.tag;if(5===k||6===k){d=f=g;continue a}h=h.parentNode;}}d=d.return;}Jb(function(){var d=f,e=xb(c),g=[];
		a:{var h=df.get(a);if(void 0!==h){var k=td,n=a;switch(a){case "keypress":if(0===od(c))break a;case "keydown":case "keyup":k=Rd;break;case "focusin":n="focus";k=Fd;break;case "focusout":n="blur";k=Fd;break;case "beforeblur":case "afterblur":k=Fd;break;case "click":if(2===c.button)break a;case "auxclick":case "dblclick":case "mousedown":case "mousemove":case "mouseup":case "mouseout":case "mouseover":case "contextmenu":k=Bd;break;case "drag":case "dragend":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "dragstart":case "drop":k=
		Dd;break;case "touchcancel":case "touchend":case "touchmove":case "touchstart":k=Vd;break;case $e:case af:case bf:k=Hd;break;case cf:k=Xd;break;case "scroll":k=vd;break;case "wheel":k=Zd;break;case "copy":case "cut":case "paste":k=Jd;break;case "gotpointercapture":case "lostpointercapture":case "pointercancel":case "pointerdown":case "pointermove":case "pointerout":case "pointerover":case "pointerup":k=Td;}var t=0!==(b&4),J=!t&&"scroll"===a,x=t?null!==h?h+"Capture":null:h;t=[];for(var w=d,u;null!==
		w;){u=w;var F=u.stateNode;5===u.tag&&null!==F&&(u=F,null!==x&&(F=Kb(w,x),null!=F&&t.push(tf(w,F,u))));if(J)break;w=w.return;}0<t.length&&(h=new k(h,n,null,c,e),g.push({event:h,listeners:t}));}}if(0===(b&7)){a:{h="mouseover"===a||"pointerover"===a;k="mouseout"===a||"pointerout"===a;if(h&&c!==wb&&(n=c.relatedTarget||c.fromElement)&&(Wc(n)||n[uf]))break a;if(k||h){h=e.window===e?e:(h=e.ownerDocument)?h.defaultView||h.parentWindow:window;if(k){if(n=c.relatedTarget||c.toElement,k=d,n=n?Wc(n):null,null!==
		n&&(J=Vb(n),n!==J||5!==n.tag&&6!==n.tag))n=null;}else k=null,n=d;if(k!==n){t=Bd;F="onMouseLeave";x="onMouseEnter";w="mouse";if("pointerout"===a||"pointerover"===a)t=Td,F="onPointerLeave",x="onPointerEnter",w="pointer";J=null==k?h:ue(k);u=null==n?h:ue(n);h=new t(F,w+"leave",k,c,e);h.target=J;h.relatedTarget=u;F=null;Wc(e)===d&&(t=new t(x,w+"enter",n,c,e),t.target=u,t.relatedTarget=J,F=t);J=F;if(k&&n)b:{t=k;x=n;w=0;for(u=t;u;u=vf(u))w++;u=0;for(F=x;F;F=vf(F))u++;for(;0<w-u;)t=vf(t),w--;for(;0<u-w;)x=
		vf(x),u--;for(;w--;){if(t===x||null!==x&&t===x.alternate)break b;t=vf(t);x=vf(x);}t=null;}else t=null;null!==k&&wf(g,h,k,t,false);null!==n&&null!==J&&wf(g,J,n,t,true);}}}a:{h=d?ue(d):window;k=h.nodeName&&h.nodeName.toLowerCase();if("select"===k||"input"===k&&"file"===h.type)var na=ve;else if(me(h))if(we)na=Fe;else {na=De;var xa=Ce;}else (k=h.nodeName)&&"input"===k.toLowerCase()&&("checkbox"===h.type||"radio"===h.type)&&(na=Ee);if(na&&(na=na(a,d))){ne(g,na,c,e);break a}xa&&xa(a,h,d);"focusout"===a&&(xa=h._wrapperState)&&
		xa.controlled&&"number"===h.type&&cb(h,"number",h.value);}xa=d?ue(d):window;switch(a){case "focusin":if(me(xa)||"true"===xa.contentEditable)Qe=xa,Re=d,Se=null;break;case "focusout":Se=Re=Qe=null;break;case "mousedown":Te=true;break;case "contextmenu":case "mouseup":case "dragend":Te=false;Ue(g,c,e);break;case "selectionchange":if(Pe)break;case "keydown":case "keyup":Ue(g,c,e);}var $a;if(ae)b:{switch(a){case "compositionstart":var ba="onCompositionStart";break b;case "compositionend":ba="onCompositionEnd";
		break b;case "compositionupdate":ba="onCompositionUpdate";break b}ba=void 0;}else ie?ge(a,c)&&(ba="onCompositionEnd"):"keydown"===a&&229===c.keyCode&&(ba="onCompositionStart");ba&&(de&&"ko"!==c.locale&&(ie||"onCompositionStart"!==ba?"onCompositionEnd"===ba&&ie&&($a=nd()):(kd=e,ld="value"in kd?kd.value:kd.textContent,ie=true)),xa=oe(d,ba),0<xa.length&&(ba=new Ld(ba,a,null,c,e),g.push({event:ba,listeners:xa}),$a?ba.data=$a:($a=he(c),null!==$a&&(ba.data=$a))));if($a=ce?je(a,c):ke(a,c))d=oe(d,"onBeforeInput"),
		0<d.length&&(e=new Ld("onBeforeInput","beforeinput",null,c,e),g.push({event:e,listeners:d}),e.data=$a);}se(g,b);});}function tf(a,b,c){return {instance:a,listener:b,currentTarget:c}}function oe(a,b){for(var c=b+"Capture",d=[];null!==a;){var e=a,f=e.stateNode;5===e.tag&&null!==f&&(e=f,f=Kb(a,c),null!=f&&d.unshift(tf(a,f,e)),f=Kb(a,b),null!=f&&d.push(tf(a,f,e)));a=a.return;}return d}function vf(a){if(null===a)return null;do a=a.return;while(a&&5!==a.tag);return a?a:null}
		function wf(a,b,c,d,e){for(var f=b._reactName,g=[];null!==c&&c!==d;){var h=c,k=h.alternate,l=h.stateNode;if(null!==k&&k===d)break;5===h.tag&&null!==l&&(h=l,e?(k=Kb(c,f),null!=k&&g.unshift(tf(c,k,h))):e||(k=Kb(c,f),null!=k&&g.push(tf(c,k,h))));c=c.return;}0!==g.length&&a.push({event:b,listeners:g});}var xf=/\r\n?/g,yf=/\u0000|\uFFFD/g;function zf(a){return ("string"===typeof a?a:""+a).replace(xf,"\n").replace(yf,"")}function Af(a,b,c){b=zf(b);if(zf(a)!==b&&c)throw Error(p(425));}function Bf(){}
		var Cf=null,Df=null;function Ef(a,b){return "textarea"===a||"noscript"===a||"string"===typeof b.children||"number"===typeof b.children||"object"===typeof b.dangerouslySetInnerHTML&&null!==b.dangerouslySetInnerHTML&&null!=b.dangerouslySetInnerHTML.__html}
		var Ff="function"===typeof setTimeout?setTimeout:void 0,Gf="function"===typeof clearTimeout?clearTimeout:void 0,Hf="function"===typeof Promise?Promise:void 0,Jf="function"===typeof queueMicrotask?queueMicrotask:"undefined"!==typeof Hf?function(a){return Hf.resolve(null).then(a).catch(If)}:Ff;function If(a){setTimeout(function(){throw a;});}
		function Kf(a,b){var c=b,d=0;do{var e=c.nextSibling;a.removeChild(c);if(e&&8===e.nodeType)if(c=e.data,"/$"===c){if(0===d){a.removeChild(e);bd(b);return}d--;}else "$"!==c&&"$?"!==c&&"$!"!==c||d++;c=e;}while(c);bd(b);}function Lf(a){for(;null!=a;a=a.nextSibling){var b=a.nodeType;if(1===b||3===b)break;if(8===b){b=a.data;if("$"===b||"$!"===b||"$?"===b)break;if("/$"===b)return null}}return a}
		function Mf(a){a=a.previousSibling;for(var b=0;a;){if(8===a.nodeType){var c=a.data;if("$"===c||"$!"===c||"$?"===c){if(0===b)return a;b--;}else "/$"===c&&b++;}a=a.previousSibling;}return null}var Nf=Math.random().toString(36).slice(2),Of="__reactFiber$"+Nf,Pf="__reactProps$"+Nf,uf="__reactContainer$"+Nf,of="__reactEvents$"+Nf,Qf="__reactListeners$"+Nf,Rf="__reactHandles$"+Nf;
		function Wc(a){var b=a[Of];if(b)return b;for(var c=a.parentNode;c;){if(b=c[uf]||c[Of]){c=b.alternate;if(null!==b.child||null!==c&&null!==c.child)for(a=Mf(a);null!==a;){if(c=a[Of])return c;a=Mf(a);}return b}a=c;c=a.parentNode;}return null}function Cb(a){a=a[Of]||a[uf];return !a||5!==a.tag&&6!==a.tag&&13!==a.tag&&3!==a.tag?null:a}function ue(a){if(5===a.tag||6===a.tag)return a.stateNode;throw Error(p(33));}function Db(a){return a[Pf]||null}var Sf=[],Tf=-1;function Uf(a){return {current:a}}
		function E(a){0>Tf||(a.current=Sf[Tf],Sf[Tf]=null,Tf--);}function G(a,b){Tf++;Sf[Tf]=a.current;a.current=b;}var Vf={},H=Uf(Vf),Wf=Uf(false),Xf=Vf;function Yf(a,b){var c=a.type.contextTypes;if(!c)return Vf;var d=a.stateNode;if(d&&d.__reactInternalMemoizedUnmaskedChildContext===b)return d.__reactInternalMemoizedMaskedChildContext;var e={},f;for(f in c)e[f]=b[f];d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=b,a.__reactInternalMemoizedMaskedChildContext=e);return e}
		function Zf(a){a=a.childContextTypes;return null!==a&&void 0!==a}function $f(){E(Wf);E(H);}function ag(a,b,c){if(H.current!==Vf)throw Error(p(168));G(H,b);G(Wf,c);}function bg(a,b,c){var d=a.stateNode;b=b.childContextTypes;if("function"!==typeof d.getChildContext)return c;d=d.getChildContext();for(var e in d)if(!(e in b))throw Error(p(108,Ra(a)||"Unknown",e));return A({},c,d)}
		function cg(a){a=(a=a.stateNode)&&a.__reactInternalMemoizedMergedChildContext||Vf;Xf=H.current;G(H,a);G(Wf,Wf.current);return  true}function dg(a,b,c){var d=a.stateNode;if(!d)throw Error(p(169));c?(a=bg(a,b,Xf),d.__reactInternalMemoizedMergedChildContext=a,E(Wf),E(H),G(H,a)):E(Wf);G(Wf,c);}var eg=null,fg=false,gg=false;function hg(a){null===eg?eg=[a]:eg.push(a);}function ig(a){fg=true;hg(a);}
		function jg(){if(!gg&&null!==eg){gg=true;var a=0,b=C;try{var c=eg;for(C=1;a<c.length;a++){var d=c[a];do d=d(!0);while(null!==d)}eg=null;fg=!1;}catch(e){throw null!==eg&&(eg=eg.slice(a+1)),ac(fc,jg),e;}finally{C=b,gg=false;}}return null}var kg=[],lg=0,mg=null,ng=0,og=[],pg=0,qg=null,rg=1,sg="";function tg(a,b){kg[lg++]=ng;kg[lg++]=mg;mg=a;ng=b;}
		function ug(a,b,c){og[pg++]=rg;og[pg++]=sg;og[pg++]=qg;qg=a;var d=rg;a=sg;var e=32-oc(d)-1;d&=~(1<<e);c+=1;var f=32-oc(b)+e;if(30<f){var g=e-e%5;f=(d&(1<<g)-1).toString(32);d>>=g;e-=g;rg=1<<32-oc(b)+e|c<<e|d;sg=f+a;}else rg=1<<f|c<<e|d,sg=a;}function vg(a){null!==a.return&&(tg(a,1),ug(a,1,0));}function wg(a){for(;a===mg;)mg=kg[--lg],kg[lg]=null,ng=kg[--lg],kg[lg]=null;for(;a===qg;)qg=og[--pg],og[pg]=null,sg=og[--pg],og[pg]=null,rg=og[--pg],og[pg]=null;}var xg=null,yg=null,I=false,zg=null;
		function Ag(a,b){var c=Bg(5,null,null,0);c.elementType="DELETED";c.stateNode=b;c.return=a;b=a.deletions;null===b?(a.deletions=[c],a.flags|=16):b.push(c);}
		function Cg(a,b){switch(a.tag){case 5:var c=a.type;b=1!==b.nodeType||c.toLowerCase()!==b.nodeName.toLowerCase()?null:b;return null!==b?(a.stateNode=b,xg=a,yg=Lf(b.firstChild),true):false;case 6:return b=""===a.pendingProps||3!==b.nodeType?null:b,null!==b?(a.stateNode=b,xg=a,yg=null,true):false;case 13:return b=8!==b.nodeType?null:b,null!==b?(c=null!==qg?{id:rg,overflow:sg}:null,a.memoizedState={dehydrated:b,treeContext:c,retryLane:1073741824},c=Bg(18,null,null,0),c.stateNode=b,c.return=a,a.child=c,xg=a,yg=
		null,true):false;default:return  false}}function Dg(a){return 0!==(a.mode&1)&&0===(a.flags&128)}function Eg(a){if(I){var b=yg;if(b){var c=b;if(!Cg(a,b)){if(Dg(a))throw Error(p(418));b=Lf(c.nextSibling);var d=xg;b&&Cg(a,b)?Ag(d,c):(a.flags=a.flags&-4097|2,I=false,xg=a);}}else {if(Dg(a))throw Error(p(418));a.flags=a.flags&-4097|2;I=false;xg=a;}}}function Fg(a){for(a=a.return;null!==a&&5!==a.tag&&3!==a.tag&&13!==a.tag;)a=a.return;xg=a;}
		function Gg(a){if(a!==xg)return  false;if(!I)return Fg(a),I=true,false;var b;(b=3!==a.tag)&&!(b=5!==a.tag)&&(b=a.type,b="head"!==b&&"body"!==b&&!Ef(a.type,a.memoizedProps));if(b&&(b=yg)){if(Dg(a))throw Hg(),Error(p(418));for(;b;)Ag(a,b),b=Lf(b.nextSibling);}Fg(a);if(13===a.tag){a=a.memoizedState;a=null!==a?a.dehydrated:null;if(!a)throw Error(p(317));a:{a=a.nextSibling;for(b=0;a;){if(8===a.nodeType){var c=a.data;if("/$"===c){if(0===b){yg=Lf(a.nextSibling);break a}b--;}else "$"!==c&&"$!"!==c&&"$?"!==c||b++;}a=a.nextSibling;}yg=
		null;}}else yg=xg?Lf(a.stateNode.nextSibling):null;return  true}function Hg(){for(var a=yg;a;)a=Lf(a.nextSibling);}function Ig(){yg=xg=null;I=false;}function Jg(a){null===zg?zg=[a]:zg.push(a);}var Kg=ua.ReactCurrentBatchConfig;
		function Lg(a,b,c){a=c.ref;if(null!==a&&"function"!==typeof a&&"object"!==typeof a){if(c._owner){c=c._owner;if(c){if(1!==c.tag)throw Error(p(309));var d=c.stateNode;}if(!d)throw Error(p(147,a));var e=d,f=""+a;if(null!==b&&null!==b.ref&&"function"===typeof b.ref&&b.ref._stringRef===f)return b.ref;b=function(a){var b=e.refs;null===a?delete b[f]:b[f]=a;};b._stringRef=f;return b}if("string"!==typeof a)throw Error(p(284));if(!c._owner)throw Error(p(290,a));}return a}
		function Mg(a,b){a=Object.prototype.toString.call(b);throw Error(p(31,"[object Object]"===a?"object with keys {"+Object.keys(b).join(", ")+"}":a));}function Ng(a){var b=a._init;return b(a._payload)}
		function Og(a){function b(b,c){if(a){var d=b.deletions;null===d?(b.deletions=[c],b.flags|=16):d.push(c);}}function c(c,d){if(!a)return null;for(;null!==d;)b(c,d),d=d.sibling;return null}function d(a,b){for(a=new Map;null!==b;)null!==b.key?a.set(b.key,b):a.set(b.index,b),b=b.sibling;return a}function e(a,b){a=Pg(a,b);a.index=0;a.sibling=null;return a}function f(b,c,d){b.index=d;if(!a)return b.flags|=1048576,c;d=b.alternate;if(null!==d)return d=d.index,d<c?(b.flags|=2,c):d;b.flags|=2;return c}function g(b){a&&
		null===b.alternate&&(b.flags|=2);return b}function h(a,b,c,d){if(null===b||6!==b.tag)return b=Qg(c,a.mode,d),b.return=a,b;b=e(b,c);b.return=a;return b}function k(a,b,c,d){var f=c.type;if(f===ya)return m(a,b,c.props.children,d,c.key);if(null!==b&&(b.elementType===f||"object"===typeof f&&null!==f&&f.$$typeof===Ha&&Ng(f)===b.type))return d=e(b,c.props),d.ref=Lg(a,b,c),d.return=a,d;d=Rg(c.type,c.key,c.props,null,a.mode,d);d.ref=Lg(a,b,c);d.return=a;return d}function l(a,b,c,d){if(null===b||4!==b.tag||
		b.stateNode.containerInfo!==c.containerInfo||b.stateNode.implementation!==c.implementation)return b=Sg(c,a.mode,d),b.return=a,b;b=e(b,c.children||[]);b.return=a;return b}function m(a,b,c,d,f){if(null===b||7!==b.tag)return b=Tg(c,a.mode,d,f),b.return=a,b;b=e(b,c);b.return=a;return b}function q(a,b,c){if("string"===typeof b&&""!==b||"number"===typeof b)return b=Qg(""+b,a.mode,c),b.return=a,b;if("object"===typeof b&&null!==b){switch(b.$$typeof){case va:return c=Rg(b.type,b.key,b.props,null,a.mode,c),
		c.ref=Lg(a,null,b),c.return=a,c;case wa:return b=Sg(b,a.mode,c),b.return=a,b;case Ha:var d=b._init;return q(a,d(b._payload),c)}if(eb(b)||Ka(b))return b=Tg(b,a.mode,c,null),b.return=a,b;Mg(a,b);}return null}function r(a,b,c,d){var e=null!==b?b.key:null;if("string"===typeof c&&""!==c||"number"===typeof c)return null!==e?null:h(a,b,""+c,d);if("object"===typeof c&&null!==c){switch(c.$$typeof){case va:return c.key===e?k(a,b,c,d):null;case wa:return c.key===e?l(a,b,c,d):null;case Ha:return e=c._init,r(a,
		b,e(c._payload),d)}if(eb(c)||Ka(c))return null!==e?null:m(a,b,c,d,null);Mg(a,c);}return null}function y(a,b,c,d,e){if("string"===typeof d&&""!==d||"number"===typeof d)return a=a.get(c)||null,h(b,a,""+d,e);if("object"===typeof d&&null!==d){switch(d.$$typeof){case va:return a=a.get(null===d.key?c:d.key)||null,k(b,a,d,e);case wa:return a=a.get(null===d.key?c:d.key)||null,l(b,a,d,e);case Ha:var f=d._init;return y(a,b,c,f(d._payload),e)}if(eb(d)||Ka(d))return a=a.get(c)||null,m(b,a,d,e,null);Mg(b,d);}return null}
		function n(e,g,h,k){for(var l=null,m=null,u=g,w=g=0,x=null;null!==u&&w<h.length;w++){u.index>w?(x=u,u=null):x=u.sibling;var n=r(e,u,h[w],k);if(null===n){null===u&&(u=x);break}a&&u&&null===n.alternate&&b(e,u);g=f(n,g,w);null===m?l=n:m.sibling=n;m=n;u=x;}if(w===h.length)return c(e,u),I&&tg(e,w),l;if(null===u){for(;w<h.length;w++)u=q(e,h[w],k),null!==u&&(g=f(u,g,w),null===m?l=u:m.sibling=u,m=u);I&&tg(e,w);return l}for(u=d(e,u);w<h.length;w++)x=y(u,e,w,h[w],k),null!==x&&(a&&null!==x.alternate&&u.delete(null===
		x.key?w:x.key),g=f(x,g,w),null===m?l=x:m.sibling=x,m=x);a&&u.forEach(function(a){return b(e,a)});I&&tg(e,w);return l}function t(e,g,h,k){var l=Ka(h);if("function"!==typeof l)throw Error(p(150));h=l.call(h);if(null==h)throw Error(p(151));for(var u=l=null,m=g,w=g=0,x=null,n=h.next();null!==m&&!n.done;w++,n=h.next()){m.index>w?(x=m,m=null):x=m.sibling;var t=r(e,m,n.value,k);if(null===t){null===m&&(m=x);break}a&&m&&null===t.alternate&&b(e,m);g=f(t,g,w);null===u?l=t:u.sibling=t;u=t;m=x;}if(n.done)return c(e,
		m),I&&tg(e,w),l;if(null===m){for(;!n.done;w++,n=h.next())n=q(e,n.value,k),null!==n&&(g=f(n,g,w),null===u?l=n:u.sibling=n,u=n);I&&tg(e,w);return l}for(m=d(e,m);!n.done;w++,n=h.next())n=y(m,e,w,n.value,k),null!==n&&(a&&null!==n.alternate&&m.delete(null===n.key?w:n.key),g=f(n,g,w),null===u?l=n:u.sibling=n,u=n);a&&m.forEach(function(a){return b(e,a)});I&&tg(e,w);return l}function J(a,d,f,h){"object"===typeof f&&null!==f&&f.type===ya&&null===f.key&&(f=f.props.children);if("object"===typeof f&&null!==f){switch(f.$$typeof){case va:a:{for(var k=
		f.key,l=d;null!==l;){if(l.key===k){k=f.type;if(k===ya){if(7===l.tag){c(a,l.sibling);d=e(l,f.props.children);d.return=a;a=d;break a}}else if(l.elementType===k||"object"===typeof k&&null!==k&&k.$$typeof===Ha&&Ng(k)===l.type){c(a,l.sibling);d=e(l,f.props);d.ref=Lg(a,l,f);d.return=a;a=d;break a}c(a,l);break}else b(a,l);l=l.sibling;}f.type===ya?(d=Tg(f.props.children,a.mode,h,f.key),d.return=a,a=d):(h=Rg(f.type,f.key,f.props,null,a.mode,h),h.ref=Lg(a,d,f),h.return=a,a=h);}return g(a);case wa:a:{for(l=f.key;null!==
		d;){if(d.key===l)if(4===d.tag&&d.stateNode.containerInfo===f.containerInfo&&d.stateNode.implementation===f.implementation){c(a,d.sibling);d=e(d,f.children||[]);d.return=a;a=d;break a}else {c(a,d);break}else b(a,d);d=d.sibling;}d=Sg(f,a.mode,h);d.return=a;a=d;}return g(a);case Ha:return l=f._init,J(a,d,l(f._payload),h)}if(eb(f))return n(a,d,f,h);if(Ka(f))return t(a,d,f,h);Mg(a,f);}return "string"===typeof f&&""!==f||"number"===typeof f?(f=""+f,null!==d&&6===d.tag?(c(a,d.sibling),d=e(d,f),d.return=a,a=d):
		(c(a,d),d=Qg(f,a.mode,h),d.return=a,a=d),g(a)):c(a,d)}return J}var Ug=Og(true),Vg=Og(false),Wg=Uf(null),Xg=null,Yg=null,Zg=null;function $g(){Zg=Yg=Xg=null;}function ah(a){var b=Wg.current;E(Wg);a._currentValue=b;}function bh(a,b,c){for(;null!==a;){var d=a.alternate;(a.childLanes&b)!==b?(a.childLanes|=b,null!==d&&(d.childLanes|=b)):null!==d&&(d.childLanes&b)!==b&&(d.childLanes|=b);if(a===c)break;a=a.return;}}
		function ch(a,b){Xg=a;Zg=Yg=null;a=a.dependencies;null!==a&&null!==a.firstContext&&(0!==(a.lanes&b)&&(dh=true),a.firstContext=null);}function eh(a){var b=a._currentValue;if(Zg!==a)if(a={context:a,memoizedValue:b,next:null},null===Yg){if(null===Xg)throw Error(p(308));Yg=a;Xg.dependencies={lanes:0,firstContext:a};}else Yg=Yg.next=a;return b}var fh=null;function gh(a){null===fh?fh=[a]:fh.push(a);}
		function hh(a,b,c,d){var e=b.interleaved;null===e?(c.next=c,gh(b)):(c.next=e.next,e.next=c);b.interleaved=c;return ih(a,d)}function ih(a,b){a.lanes|=b;var c=a.alternate;null!==c&&(c.lanes|=b);c=a;for(a=a.return;null!==a;)a.childLanes|=b,c=a.alternate,null!==c&&(c.childLanes|=b),c=a,a=a.return;return 3===c.tag?c.stateNode:null}var jh=false;function kh(a){a.updateQueue={baseState:a.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null};}
		function lh(a,b){a=a.updateQueue;b.updateQueue===a&&(b.updateQueue={baseState:a.baseState,firstBaseUpdate:a.firstBaseUpdate,lastBaseUpdate:a.lastBaseUpdate,shared:a.shared,effects:a.effects});}function mh(a,b){return {eventTime:a,lane:b,tag:0,payload:null,callback:null,next:null}}
		function nh(a,b,c){var d=a.updateQueue;if(null===d)return null;d=d.shared;if(0!==(K&2)){var e=d.pending;null===e?b.next=b:(b.next=e.next,e.next=b);d.pending=b;return ih(a,c)}e=d.interleaved;null===e?(b.next=b,gh(d)):(b.next=e.next,e.next=b);d.interleaved=b;return ih(a,c)}function oh(a,b,c){b=b.updateQueue;if(null!==b&&(b=b.shared,0!==(c&4194240))){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;Cc(a,c);}}
		function ph(a,b){var c=a.updateQueue,d=a.alternate;if(null!==d&&(d=d.updateQueue,c===d)){var e=null,f=null;c=c.firstBaseUpdate;if(null!==c){do{var g={eventTime:c.eventTime,lane:c.lane,tag:c.tag,payload:c.payload,callback:c.callback,next:null};null===f?e=f=g:f=f.next=g;c=c.next;}while(null!==c);null===f?e=f=b:f=f.next=b;}else e=f=b;c={baseState:d.baseState,firstBaseUpdate:e,lastBaseUpdate:f,shared:d.shared,effects:d.effects};a.updateQueue=c;return}a=c.lastBaseUpdate;null===a?c.firstBaseUpdate=b:a.next=
		b;c.lastBaseUpdate=b;}
		function qh(a,b,c,d){var e=a.updateQueue;jh=false;var f=e.firstBaseUpdate,g=e.lastBaseUpdate,h=e.shared.pending;if(null!==h){e.shared.pending=null;var k=h,l=k.next;k.next=null;null===g?f=l:g.next=l;g=k;var m=a.alternate;null!==m&&(m=m.updateQueue,h=m.lastBaseUpdate,h!==g&&(null===h?m.firstBaseUpdate=l:h.next=l,m.lastBaseUpdate=k));}if(null!==f){var q=e.baseState;g=0;m=l=k=null;h=f;do{var r=h.lane,y=h.eventTime;if((d&r)===r){null!==m&&(m=m.next={eventTime:y,lane:0,tag:h.tag,payload:h.payload,callback:h.callback,
		next:null});a:{var n=a,t=h;r=b;y=c;switch(t.tag){case 1:n=t.payload;if("function"===typeof n){q=n.call(y,q,r);break a}q=n;break a;case 3:n.flags=n.flags&-65537|128;case 0:n=t.payload;r="function"===typeof n?n.call(y,q,r):n;if(null===r||void 0===r)break a;q=A({},q,r);break a;case 2:jh=true;}}null!==h.callback&&0!==h.lane&&(a.flags|=64,r=e.effects,null===r?e.effects=[h]:r.push(h));}else y={eventTime:y,lane:r,tag:h.tag,payload:h.payload,callback:h.callback,next:null},null===m?(l=m=y,k=q):m=m.next=y,g|=r;
		h=h.next;if(null===h)if(h=e.shared.pending,null===h)break;else r=h,h=r.next,r.next=null,e.lastBaseUpdate=r,e.shared.pending=null;}while(1);null===m&&(k=q);e.baseState=k;e.firstBaseUpdate=l;e.lastBaseUpdate=m;b=e.shared.interleaved;if(null!==b){e=b;do g|=e.lane,e=e.next;while(e!==b)}else null===f&&(e.shared.lanes=0);rh|=g;a.lanes=g;a.memoizedState=q;}}
		function sh(a,b,c){a=b.effects;b.effects=null;if(null!==a)for(b=0;b<a.length;b++){var d=a[b],e=d.callback;if(null!==e){d.callback=null;d=c;if("function"!==typeof e)throw Error(p(191,e));e.call(d);}}}var th={},uh=Uf(th),vh=Uf(th),wh=Uf(th);function xh(a){if(a===th)throw Error(p(174));return a}
		function yh(a,b){G(wh,b);G(vh,a);G(uh,th);a=b.nodeType;switch(a){case 9:case 11:b=(b=b.documentElement)?b.namespaceURI:lb(null,"");break;default:a=8===a?b.parentNode:b,b=a.namespaceURI||null,a=a.tagName,b=lb(b,a);}E(uh);G(uh,b);}function zh(){E(uh);E(vh);E(wh);}function Ah(a){xh(wh.current);var b=xh(uh.current);var c=lb(b,a.type);b!==c&&(G(vh,a),G(uh,c));}function Bh(a){vh.current===a&&(E(uh),E(vh));}var L=Uf(0);
		function Ch(a){for(var b=a;null!==b;){if(13===b.tag){var c=b.memoizedState;if(null!==c&&(c=c.dehydrated,null===c||"$?"===c.data||"$!"===c.data))return b}else if(19===b.tag&&void 0!==b.memoizedProps.revealOrder){if(0!==(b.flags&128))return b}else if(null!==b.child){b.child.return=b;b=b.child;continue}if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return null;b=b.return;}b.sibling.return=b.return;b=b.sibling;}return null}var Dh=[];
		function Eh(){for(var a=0;a<Dh.length;a++)Dh[a]._workInProgressVersionPrimary=null;Dh.length=0;}var Fh=ua.ReactCurrentDispatcher,Gh=ua.ReactCurrentBatchConfig,Hh=0,M=null,N=null,O=null,Ih=false,Jh=false,Kh=0,Lh=0;function P(){throw Error(p(321));}function Mh(a,b){if(null===b)return  false;for(var c=0;c<b.length&&c<a.length;c++)if(!He(a[c],b[c]))return  false;return  true}
		function Nh(a,b,c,d,e,f){Hh=f;M=b;b.memoizedState=null;b.updateQueue=null;b.lanes=0;Fh.current=null===a||null===a.memoizedState?Oh:Ph;a=c(d,e);if(Jh){f=0;do{Jh=false;Kh=0;if(25<=f)throw Error(p(301));f+=1;O=N=null;b.updateQueue=null;Fh.current=Qh;a=c(d,e);}while(Jh)}Fh.current=Rh;b=null!==N&&null!==N.next;Hh=0;O=N=M=null;Ih=false;if(b)throw Error(p(300));return a}function Sh(){var a=0!==Kh;Kh=0;return a}
		function Th(){var a={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};null===O?M.memoizedState=O=a:O=O.next=a;return O}function Uh(){if(null===N){var a=M.alternate;a=null!==a?a.memoizedState:null;}else a=N.next;var b=null===O?M.memoizedState:O.next;if(null!==b)O=b,N=a;else {if(null===a)throw Error(p(310));N=a;a={memoizedState:N.memoizedState,baseState:N.baseState,baseQueue:N.baseQueue,queue:N.queue,next:null};null===O?M.memoizedState=O=a:O=O.next=a;}return O}
		function Vh(a,b){return "function"===typeof b?b(a):b}
		function Wh(a){var b=Uh(),c=b.queue;if(null===c)throw Error(p(311));c.lastRenderedReducer=a;var d=N,e=d.baseQueue,f=c.pending;if(null!==f){if(null!==e){var g=e.next;e.next=f.next;f.next=g;}d.baseQueue=e=f;c.pending=null;}if(null!==e){f=e.next;d=d.baseState;var h=g=null,k=null,l=f;do{var m=l.lane;if((Hh&m)===m)null!==k&&(k=k.next={lane:0,action:l.action,hasEagerState:l.hasEagerState,eagerState:l.eagerState,next:null}),d=l.hasEagerState?l.eagerState:a(d,l.action);else {var q={lane:m,action:l.action,hasEagerState:l.hasEagerState,
		eagerState:l.eagerState,next:null};null===k?(h=k=q,g=d):k=k.next=q;M.lanes|=m;rh|=m;}l=l.next;}while(null!==l&&l!==f);null===k?g=d:k.next=h;He(d,b.memoizedState)||(dh=true);b.memoizedState=d;b.baseState=g;b.baseQueue=k;c.lastRenderedState=d;}a=c.interleaved;if(null!==a){e=a;do f=e.lane,M.lanes|=f,rh|=f,e=e.next;while(e!==a)}else null===e&&(c.lanes=0);return [b.memoizedState,c.dispatch]}
		function Xh(a){var b=Uh(),c=b.queue;if(null===c)throw Error(p(311));c.lastRenderedReducer=a;var d=c.dispatch,e=c.pending,f=b.memoizedState;if(null!==e){c.pending=null;var g=e=e.next;do f=a(f,g.action),g=g.next;while(g!==e);He(f,b.memoizedState)||(dh=true);b.memoizedState=f;null===b.baseQueue&&(b.baseState=f);c.lastRenderedState=f;}return [f,d]}function Yh(){}
		function Zh(a,b){var c=M,d=Uh(),e=b(),f=!He(d.memoizedState,e);f&&(d.memoizedState=e,dh=true);d=d.queue;$h(ai.bind(null,c,d,a),[a]);if(d.getSnapshot!==b||f||null!==O&&O.memoizedState.tag&1){c.flags|=2048;bi(9,ci.bind(null,c,d,e,b),void 0,null);if(null===Q)throw Error(p(349));0!==(Hh&30)||di(c,b,e);}return e}function di(a,b,c){a.flags|=16384;a={getSnapshot:b,value:c};b=M.updateQueue;null===b?(b={lastEffect:null,stores:null},M.updateQueue=b,b.stores=[a]):(c=b.stores,null===c?b.stores=[a]:c.push(a));}
		function ci(a,b,c,d){b.value=c;b.getSnapshot=d;ei(b)&&fi(a);}function ai(a,b,c){return c(function(){ei(b)&&fi(a);})}function ei(a){var b=a.getSnapshot;a=a.value;try{var c=b();return !He(a,c)}catch(d){return  true}}function fi(a){var b=ih(a,1);null!==b&&gi(b,a,1,-1);}
		function hi(a){var b=Th();"function"===typeof a&&(a=a());b.memoizedState=b.baseState=a;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Vh,lastRenderedState:a};b.queue=a;a=a.dispatch=ii.bind(null,M,a);return [b.memoizedState,a]}
		function bi(a,b,c,d){a={tag:a,create:b,destroy:c,deps:d,next:null};b=M.updateQueue;null===b?(b={lastEffect:null,stores:null},M.updateQueue=b,b.lastEffect=a.next=a):(c=b.lastEffect,null===c?b.lastEffect=a.next=a:(d=c.next,c.next=a,a.next=d,b.lastEffect=a));return a}function ji(){return Uh().memoizedState}function ki(a,b,c,d){var e=Th();M.flags|=a;e.memoizedState=bi(1|b,c,void 0,void 0===d?null:d);}
		function li(a,b,c,d){var e=Uh();d=void 0===d?null:d;var f=void 0;if(null!==N){var g=N.memoizedState;f=g.destroy;if(null!==d&&Mh(d,g.deps)){e.memoizedState=bi(b,c,f,d);return}}M.flags|=a;e.memoizedState=bi(1|b,c,f,d);}function mi(a,b){return ki(8390656,8,a,b)}function $h(a,b){return li(2048,8,a,b)}function ni(a,b){return li(4,2,a,b)}function oi(a,b){return li(4,4,a,b)}
		function pi(a,b){if("function"===typeof b)return a=a(),b(a),function(){b(null);};if(null!==b&&void 0!==b)return a=a(),b.current=a,function(){b.current=null;}}function qi(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return li(4,4,pi.bind(null,b,a),c)}function ri(){}function si(a,b){var c=Uh();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&Mh(b,d[1]))return d[0];c.memoizedState=[a,b];return a}
		function ti(a,b){var c=Uh();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&Mh(b,d[1]))return d[0];a=a();c.memoizedState=[a,b];return a}function ui(a,b,c){if(0===(Hh&21))return a.baseState&&(a.baseState=false,dh=true),a.memoizedState=c;He(c,b)||(c=yc(),M.lanes|=c,rh|=c,a.baseState=true);return b}function vi(a,b){var c=C;C=0!==c&&4>c?c:4;a(true);var d=Gh.transition;Gh.transition={};try{a(!1),b();}finally{C=c,Gh.transition=d;}}function wi(){return Uh().memoizedState}
		function xi(a,b,c){var d=yi(a);c={lane:d,action:c,hasEagerState:false,eagerState:null,next:null};if(zi(a))Ai(b,c);else if(c=hh(a,b,c,d),null!==c){var e=R();gi(c,a,d,e);Bi(c,b,d);}}
		function ii(a,b,c){var d=yi(a),e={lane:d,action:c,hasEagerState:false,eagerState:null,next:null};if(zi(a))Ai(b,e);else {var f=a.alternate;if(0===a.lanes&&(null===f||0===f.lanes)&&(f=b.lastRenderedReducer,null!==f))try{var g=b.lastRenderedState,h=f(g,c);e.hasEagerState=!0;e.eagerState=h;if(He(h,g)){var k=b.interleaved;null===k?(e.next=e,gh(b)):(e.next=k.next,k.next=e);b.interleaved=e;return}}catch(l){}finally{}c=hh(a,b,e,d);null!==c&&(e=R(),gi(c,a,d,e),Bi(c,b,d));}}
		function zi(a){var b=a.alternate;return a===M||null!==b&&b===M}function Ai(a,b){Jh=Ih=true;var c=a.pending;null===c?b.next=b:(b.next=c.next,c.next=b);a.pending=b;}function Bi(a,b,c){if(0!==(c&4194240)){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;Cc(a,c);}}
		var Rh={readContext:eh,useCallback:P,useContext:P,useEffect:P,useImperativeHandle:P,useInsertionEffect:P,useLayoutEffect:P,useMemo:P,useReducer:P,useRef:P,useState:P,useDebugValue:P,useDeferredValue:P,useTransition:P,useMutableSource:P,useSyncExternalStore:P,useId:P,unstable_isNewReconciler:false},Oh={readContext:eh,useCallback:function(a,b){Th().memoizedState=[a,void 0===b?null:b];return a},useContext:eh,useEffect:mi,useImperativeHandle:function(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return ki(4194308,
		4,pi.bind(null,b,a),c)},useLayoutEffect:function(a,b){return ki(4194308,4,a,b)},useInsertionEffect:function(a,b){return ki(4,2,a,b)},useMemo:function(a,b){var c=Th();b=void 0===b?null:b;a=a();c.memoizedState=[a,b];return a},useReducer:function(a,b,c){var d=Th();b=void 0!==c?c(b):b;d.memoizedState=d.baseState=b;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:a,lastRenderedState:b};d.queue=a;a=a.dispatch=xi.bind(null,M,a);return [d.memoizedState,a]},useRef:function(a){var b=
		Th();a={current:a};return b.memoizedState=a},useState:hi,useDebugValue:ri,useDeferredValue:function(a){return Th().memoizedState=a},useTransition:function(){var a=hi(false),b=a[0];a=vi.bind(null,a[1]);Th().memoizedState=a;return [b,a]},useMutableSource:function(){},useSyncExternalStore:function(a,b,c){var d=M,e=Th();if(I){if(void 0===c)throw Error(p(407));c=c();}else {c=b();if(null===Q)throw Error(p(349));0!==(Hh&30)||di(d,b,c);}e.memoizedState=c;var f={value:c,getSnapshot:b};e.queue=f;mi(ai.bind(null,d,
		f,a),[a]);d.flags|=2048;bi(9,ci.bind(null,d,f,c,b),void 0,null);return c},useId:function(){var a=Th(),b=Q.identifierPrefix;if(I){var c=sg;var d=rg;c=(d&~(1<<32-oc(d)-1)).toString(32)+c;b=":"+b+"R"+c;c=Kh++;0<c&&(b+="H"+c.toString(32));b+=":";}else c=Lh++,b=":"+b+"r"+c.toString(32)+":";return a.memoizedState=b},unstable_isNewReconciler:false},Ph={readContext:eh,useCallback:si,useContext:eh,useEffect:$h,useImperativeHandle:qi,useInsertionEffect:ni,useLayoutEffect:oi,useMemo:ti,useReducer:Wh,useRef:ji,useState:function(){return Wh(Vh)},
		useDebugValue:ri,useDeferredValue:function(a){var b=Uh();return ui(b,N.memoizedState,a)},useTransition:function(){var a=Wh(Vh)[0],b=Uh().memoizedState;return [a,b]},useMutableSource:Yh,useSyncExternalStore:Zh,useId:wi,unstable_isNewReconciler:false},Qh={readContext:eh,useCallback:si,useContext:eh,useEffect:$h,useImperativeHandle:qi,useInsertionEffect:ni,useLayoutEffect:oi,useMemo:ti,useReducer:Xh,useRef:ji,useState:function(){return Xh(Vh)},useDebugValue:ri,useDeferredValue:function(a){var b=Uh();return null===
		N?b.memoizedState=a:ui(b,N.memoizedState,a)},useTransition:function(){var a=Xh(Vh)[0],b=Uh().memoizedState;return [a,b]},useMutableSource:Yh,useSyncExternalStore:Zh,useId:wi,unstable_isNewReconciler:false};function Ci(a,b){if(a&&a.defaultProps){b=A({},b);a=a.defaultProps;for(var c in a) void 0===b[c]&&(b[c]=a[c]);return b}return b}function Di(a,b,c,d){b=a.memoizedState;c=c(d,b);c=null===c||void 0===c?b:A({},b,c);a.memoizedState=c;0===a.lanes&&(a.updateQueue.baseState=c);}
		var Ei={isMounted:function(a){return (a=a._reactInternals)?Vb(a)===a:false},enqueueSetState:function(a,b,c){a=a._reactInternals;var d=R(),e=yi(a),f=mh(d,e);f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=nh(a,f,e);null!==b&&(gi(b,a,e,d),oh(b,a,e));},enqueueReplaceState:function(a,b,c){a=a._reactInternals;var d=R(),e=yi(a),f=mh(d,e);f.tag=1;f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=nh(a,f,e);null!==b&&(gi(b,a,e,d),oh(b,a,e));},enqueueForceUpdate:function(a,b){a=a._reactInternals;var c=R(),d=
		yi(a),e=mh(c,d);e.tag=2;void 0!==b&&null!==b&&(e.callback=b);b=nh(a,e,d);null!==b&&(gi(b,a,d,c),oh(b,a,d));}};function Fi(a,b,c,d,e,f,g){a=a.stateNode;return "function"===typeof a.shouldComponentUpdate?a.shouldComponentUpdate(d,f,g):b.prototype&&b.prototype.isPureReactComponent?!Ie(c,d)||!Ie(e,f):true}
		function Gi(a,b,c){var d=false,e=Vf;var f=b.contextType;"object"===typeof f&&null!==f?f=eh(f):(e=Zf(b)?Xf:H.current,d=b.contextTypes,f=(d=null!==d&&void 0!==d)?Yf(a,e):Vf);b=new b(c,f);a.memoizedState=null!==b.state&&void 0!==b.state?b.state:null;b.updater=Ei;a.stateNode=b;b._reactInternals=a;d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=e,a.__reactInternalMemoizedMaskedChildContext=f);return b}
		function Hi(a,b,c,d){a=b.state;"function"===typeof b.componentWillReceiveProps&&b.componentWillReceiveProps(c,d);"function"===typeof b.UNSAFE_componentWillReceiveProps&&b.UNSAFE_componentWillReceiveProps(c,d);b.state!==a&&Ei.enqueueReplaceState(b,b.state,null);}
		function Ii(a,b,c,d){var e=a.stateNode;e.props=c;e.state=a.memoizedState;e.refs={};kh(a);var f=b.contextType;"object"===typeof f&&null!==f?e.context=eh(f):(f=Zf(b)?Xf:H.current,e.context=Yf(a,f));e.state=a.memoizedState;f=b.getDerivedStateFromProps;"function"===typeof f&&(Di(a,b,f,c),e.state=a.memoizedState);"function"===typeof b.getDerivedStateFromProps||"function"===typeof e.getSnapshotBeforeUpdate||"function"!==typeof e.UNSAFE_componentWillMount&&"function"!==typeof e.componentWillMount||(b=e.state,
		"function"===typeof e.componentWillMount&&e.componentWillMount(),"function"===typeof e.UNSAFE_componentWillMount&&e.UNSAFE_componentWillMount(),b!==e.state&&Ei.enqueueReplaceState(e,e.state,null),qh(a,c,e,d),e.state=a.memoizedState);"function"===typeof e.componentDidMount&&(a.flags|=4194308);}function Ji(a,b){try{var c="",d=b;do c+=Pa(d),d=d.return;while(d);var e=c;}catch(f){e="\nError generating stack: "+f.message+"\n"+f.stack;}return {value:a,source:b,stack:e,digest:null}}
		function Ki(a,b,c){return {value:a,source:null,stack:null!=c?c:null,digest:null!=b?b:null}}function Li(a,b){try{console.error(b.value);}catch(c){setTimeout(function(){throw c;});}}var Mi="function"===typeof WeakMap?WeakMap:Map;function Ni(a,b,c){c=mh(-1,c);c.tag=3;c.payload={element:null};var d=b.value;c.callback=function(){Oi||(Oi=true,Pi=d);Li(a,b);};return c}
		function Qi(a,b,c){c=mh(-1,c);c.tag=3;var d=a.type.getDerivedStateFromError;if("function"===typeof d){var e=b.value;c.payload=function(){return d(e)};c.callback=function(){Li(a,b);};}var f=a.stateNode;null!==f&&"function"===typeof f.componentDidCatch&&(c.callback=function(){Li(a,b);"function"!==typeof d&&(null===Ri?Ri=new Set([this]):Ri.add(this));var c=b.stack;this.componentDidCatch(b.value,{componentStack:null!==c?c:""});});return c}
		function Si(a,b,c){var d=a.pingCache;if(null===d){d=a.pingCache=new Mi;var e=new Set;d.set(b,e);}else e=d.get(b),void 0===e&&(e=new Set,d.set(b,e));e.has(c)||(e.add(c),a=Ti.bind(null,a,b,c),b.then(a,a));}function Ui(a){do{var b;if(b=13===a.tag)b=a.memoizedState,b=null!==b?null!==b.dehydrated?true:false:true;if(b)return a;a=a.return;}while(null!==a);return null}
		function Vi(a,b,c,d,e){if(0===(a.mode&1))return a===b?a.flags|=65536:(a.flags|=128,c.flags|=131072,c.flags&=-52805,1===c.tag&&(null===c.alternate?c.tag=17:(b=mh(-1,1),b.tag=2,nh(c,b,1))),c.lanes|=1),a;a.flags|=65536;a.lanes=e;return a}var Wi=ua.ReactCurrentOwner,dh=false;function Xi(a,b,c,d){b.child=null===a?Vg(b,null,c,d):Ug(b,a.child,c,d);}
		function Yi(a,b,c,d,e){c=c.render;var f=b.ref;ch(b,e);d=Nh(a,b,c,d,f,e);c=Sh();if(null!==a&&!dh)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,Zi(a,b,e);I&&c&&vg(b);b.flags|=1;Xi(a,b,d,e);return b.child}
		function $i(a,b,c,d,e){if(null===a){var f=c.type;if("function"===typeof f&&!aj(f)&&void 0===f.defaultProps&&null===c.compare&&void 0===c.defaultProps)return b.tag=15,b.type=f,bj(a,b,f,d,e);a=Rg(c.type,null,d,b,b.mode,e);a.ref=b.ref;a.return=b;return b.child=a}f=a.child;if(0===(a.lanes&e)){var g=f.memoizedProps;c=c.compare;c=null!==c?c:Ie;if(c(g,d)&&a.ref===b.ref)return Zi(a,b,e)}b.flags|=1;a=Pg(f,d);a.ref=b.ref;a.return=b;return b.child=a}
		function bj(a,b,c,d,e){if(null!==a){var f=a.memoizedProps;if(Ie(f,d)&&a.ref===b.ref)if(dh=false,b.pendingProps=d=f,0!==(a.lanes&e))0!==(a.flags&131072)&&(dh=true);else return b.lanes=a.lanes,Zi(a,b,e)}return cj(a,b,c,d,e)}
		function dj(a,b,c){var d=b.pendingProps,e=d.children,f=null!==a?a.memoizedState:null;if("hidden"===d.mode)if(0===(b.mode&1))b.memoizedState={baseLanes:0,cachePool:null,transitions:null},G(ej,fj),fj|=c;else {if(0===(c&1073741824))return a=null!==f?f.baseLanes|c:c,b.lanes=b.childLanes=1073741824,b.memoizedState={baseLanes:a,cachePool:null,transitions:null},b.updateQueue=null,G(ej,fj),fj|=a,null;b.memoizedState={baseLanes:0,cachePool:null,transitions:null};d=null!==f?f.baseLanes:c;G(ej,fj);fj|=d;}else null!==
		f?(d=f.baseLanes|c,b.memoizedState=null):d=c,G(ej,fj),fj|=d;Xi(a,b,e,c);return b.child}function gj(a,b){var c=b.ref;if(null===a&&null!==c||null!==a&&a.ref!==c)b.flags|=512,b.flags|=2097152;}function cj(a,b,c,d,e){var f=Zf(c)?Xf:H.current;f=Yf(b,f);ch(b,e);c=Nh(a,b,c,d,f,e);d=Sh();if(null!==a&&!dh)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,Zi(a,b,e);I&&d&&vg(b);b.flags|=1;Xi(a,b,c,e);return b.child}
		function hj(a,b,c,d,e){if(Zf(c)){var f=true;cg(b);}else f=false;ch(b,e);if(null===b.stateNode)ij(a,b),Gi(b,c,d),Ii(b,c,d,e),d=true;else if(null===a){var g=b.stateNode,h=b.memoizedProps;g.props=h;var k=g.context,l=c.contextType;"object"===typeof l&&null!==l?l=eh(l):(l=Zf(c)?Xf:H.current,l=Yf(b,l));var m=c.getDerivedStateFromProps,q="function"===typeof m||"function"===typeof g.getSnapshotBeforeUpdate;q||"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||
		(h!==d||k!==l)&&Hi(b,g,d,l);jh=false;var r=b.memoizedState;g.state=r;qh(b,d,g,e);k=b.memoizedState;h!==d||r!==k||Wf.current||jh?("function"===typeof m&&(Di(b,c,m,d),k=b.memoizedState),(h=jh||Fi(b,c,h,d,r,k,l))?(q||"function"!==typeof g.UNSAFE_componentWillMount&&"function"!==typeof g.componentWillMount||("function"===typeof g.componentWillMount&&g.componentWillMount(),"function"===typeof g.UNSAFE_componentWillMount&&g.UNSAFE_componentWillMount()),"function"===typeof g.componentDidMount&&(b.flags|=4194308)):
		("function"===typeof g.componentDidMount&&(b.flags|=4194308),b.memoizedProps=d,b.memoizedState=k),g.props=d,g.state=k,g.context=l,d=h):("function"===typeof g.componentDidMount&&(b.flags|=4194308),d=false);}else {g=b.stateNode;lh(a,b);h=b.memoizedProps;l=b.type===b.elementType?h:Ci(b.type,h);g.props=l;q=b.pendingProps;r=g.context;k=c.contextType;"object"===typeof k&&null!==k?k=eh(k):(k=Zf(c)?Xf:H.current,k=Yf(b,k));var y=c.getDerivedStateFromProps;(m="function"===typeof y||"function"===typeof g.getSnapshotBeforeUpdate)||
		"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||(h!==q||r!==k)&&Hi(b,g,d,k);jh=false;r=b.memoizedState;g.state=r;qh(b,d,g,e);var n=b.memoizedState;h!==q||r!==n||Wf.current||jh?("function"===typeof y&&(Di(b,c,y,d),n=b.memoizedState),(l=jh||Fi(b,c,l,d,r,n,k)||false)?(m||"function"!==typeof g.UNSAFE_componentWillUpdate&&"function"!==typeof g.componentWillUpdate||("function"===typeof g.componentWillUpdate&&g.componentWillUpdate(d,n,k),"function"===typeof g.UNSAFE_componentWillUpdate&&
		g.UNSAFE_componentWillUpdate(d,n,k)),"function"===typeof g.componentDidUpdate&&(b.flags|=4),"function"===typeof g.getSnapshotBeforeUpdate&&(b.flags|=1024)):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),b.memoizedProps=d,b.memoizedState=n),g.props=d,g.state=n,g.context=k,d=l):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===
		a.memoizedState||(b.flags|=4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),d=false);}return jj(a,b,c,d,f,e)}
		function jj(a,b,c,d,e,f){gj(a,b);var g=0!==(b.flags&128);if(!d&&!g)return e&&dg(b,c,false),Zi(a,b,f);d=b.stateNode;Wi.current=b;var h=g&&"function"!==typeof c.getDerivedStateFromError?null:d.render();b.flags|=1;null!==a&&g?(b.child=Ug(b,a.child,null,f),b.child=Ug(b,null,h,f)):Xi(a,b,h,f);b.memoizedState=d.state;e&&dg(b,c,true);return b.child}function kj(a){var b=a.stateNode;b.pendingContext?ag(a,b.pendingContext,b.pendingContext!==b.context):b.context&&ag(a,b.context,false);yh(a,b.containerInfo);}
		function lj(a,b,c,d,e){Ig();Jg(e);b.flags|=256;Xi(a,b,c,d);return b.child}var mj={dehydrated:null,treeContext:null,retryLane:0};function nj(a){return {baseLanes:a,cachePool:null,transitions:null}}
		function oj(a,b,c){var d=b.pendingProps,e=L.current,f=false,g=0!==(b.flags&128),h;(h=g)||(h=null!==a&&null===a.memoizedState?false:0!==(e&2));if(h)f=true,b.flags&=-129;else if(null===a||null!==a.memoizedState)e|=1;G(L,e&1);if(null===a){Eg(b);a=b.memoizedState;if(null!==a&&(a=a.dehydrated,null!==a))return 0===(b.mode&1)?b.lanes=1:"$!"===a.data?b.lanes=8:b.lanes=1073741824,null;g=d.children;a=d.fallback;return f?(d=b.mode,f=b.child,g={mode:"hidden",children:g},0===(d&1)&&null!==f?(f.childLanes=0,f.pendingProps=
		g):f=pj(g,d,0,null),a=Tg(a,d,c,null),f.return=b,a.return=b,f.sibling=a,b.child=f,b.child.memoizedState=nj(c),b.memoizedState=mj,a):qj(b,g)}e=a.memoizedState;if(null!==e&&(h=e.dehydrated,null!==h))return rj(a,b,g,d,h,e,c);if(f){f=d.fallback;g=b.mode;e=a.child;h=e.sibling;var k={mode:"hidden",children:d.children};0===(g&1)&&b.child!==e?(d=b.child,d.childLanes=0,d.pendingProps=k,b.deletions=null):(d=Pg(e,k),d.subtreeFlags=e.subtreeFlags&14680064);null!==h?f=Pg(h,f):(f=Tg(f,g,c,null),f.flags|=2);f.return=
		b;d.return=b;d.sibling=f;b.child=d;d=f;f=b.child;g=a.child.memoizedState;g=null===g?nj(c):{baseLanes:g.baseLanes|c,cachePool:null,transitions:g.transitions};f.memoizedState=g;f.childLanes=a.childLanes&~c;b.memoizedState=mj;return d}f=a.child;a=f.sibling;d=Pg(f,{mode:"visible",children:d.children});0===(b.mode&1)&&(d.lanes=c);d.return=b;d.sibling=null;null!==a&&(c=b.deletions,null===c?(b.deletions=[a],b.flags|=16):c.push(a));b.child=d;b.memoizedState=null;return d}
		function qj(a,b){b=pj({mode:"visible",children:b},a.mode,0,null);b.return=a;return a.child=b}function sj(a,b,c,d){null!==d&&Jg(d);Ug(b,a.child,null,c);a=qj(b,b.pendingProps.children);a.flags|=2;b.memoizedState=null;return a}
		function rj(a,b,c,d,e,f,g){if(c){if(b.flags&256)return b.flags&=-257,d=Ki(Error(p(422))),sj(a,b,g,d);if(null!==b.memoizedState)return b.child=a.child,b.flags|=128,null;f=d.fallback;e=b.mode;d=pj({mode:"visible",children:d.children},e,0,null);f=Tg(f,e,g,null);f.flags|=2;d.return=b;f.return=b;d.sibling=f;b.child=d;0!==(b.mode&1)&&Ug(b,a.child,null,g);b.child.memoizedState=nj(g);b.memoizedState=mj;return f}if(0===(b.mode&1))return sj(a,b,g,null);if("$!"===e.data){d=e.nextSibling&&e.nextSibling.dataset;
		if(d)var h=d.dgst;d=h;f=Error(p(419));d=Ki(f,d,void 0);return sj(a,b,g,d)}h=0!==(g&a.childLanes);if(dh||h){d=Q;if(null!==d){switch(g&-g){case 4:e=2;break;case 16:e=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:e=32;break;case 536870912:e=268435456;break;default:e=0;}e=0!==(e&(d.suspendedLanes|g))?0:e;
		0!==e&&e!==f.retryLane&&(f.retryLane=e,ih(a,e),gi(d,a,e,-1));}tj();d=Ki(Error(p(421)));return sj(a,b,g,d)}if("$?"===e.data)return b.flags|=128,b.child=a.child,b=uj.bind(null,a),e._reactRetry=b,null;a=f.treeContext;yg=Lf(e.nextSibling);xg=b;I=true;zg=null;null!==a&&(og[pg++]=rg,og[pg++]=sg,og[pg++]=qg,rg=a.id,sg=a.overflow,qg=b);b=qj(b,d.children);b.flags|=4096;return b}function vj(a,b,c){a.lanes|=b;var d=a.alternate;null!==d&&(d.lanes|=b);bh(a.return,b,c);}
		function wj(a,b,c,d,e){var f=a.memoizedState;null===f?a.memoizedState={isBackwards:b,rendering:null,renderingStartTime:0,last:d,tail:c,tailMode:e}:(f.isBackwards=b,f.rendering=null,f.renderingStartTime=0,f.last=d,f.tail=c,f.tailMode=e);}
		function xj(a,b,c){var d=b.pendingProps,e=d.revealOrder,f=d.tail;Xi(a,b,d.children,c);d=L.current;if(0!==(d&2))d=d&1|2,b.flags|=128;else {if(null!==a&&0!==(a.flags&128))a:for(a=b.child;null!==a;){if(13===a.tag)null!==a.memoizedState&&vj(a,c,b);else if(19===a.tag)vj(a,c,b);else if(null!==a.child){a.child.return=a;a=a.child;continue}if(a===b)break a;for(;null===a.sibling;){if(null===a.return||a.return===b)break a;a=a.return;}a.sibling.return=a.return;a=a.sibling;}d&=1;}G(L,d);if(0===(b.mode&1))b.memoizedState=
		null;else switch(e){case "forwards":c=b.child;for(e=null;null!==c;)a=c.alternate,null!==a&&null===Ch(a)&&(e=c),c=c.sibling;c=e;null===c?(e=b.child,b.child=null):(e=c.sibling,c.sibling=null);wj(b,false,e,c,f);break;case "backwards":c=null;e=b.child;for(b.child=null;null!==e;){a=e.alternate;if(null!==a&&null===Ch(a)){b.child=e;break}a=e.sibling;e.sibling=c;c=e;e=a;}wj(b,true,c,null,f);break;case "together":wj(b,false,null,null,void 0);break;default:b.memoizedState=null;}return b.child}
		function ij(a,b){0===(b.mode&1)&&null!==a&&(a.alternate=null,b.alternate=null,b.flags|=2);}function Zi(a,b,c){null!==a&&(b.dependencies=a.dependencies);rh|=b.lanes;if(0===(c&b.childLanes))return null;if(null!==a&&b.child!==a.child)throw Error(p(153));if(null!==b.child){a=b.child;c=Pg(a,a.pendingProps);b.child=c;for(c.return=b;null!==a.sibling;)a=a.sibling,c=c.sibling=Pg(a,a.pendingProps),c.return=b;c.sibling=null;}return b.child}
		function yj(a,b,c){switch(b.tag){case 3:kj(b);Ig();break;case 5:Ah(b);break;case 1:Zf(b.type)&&cg(b);break;case 4:yh(b,b.stateNode.containerInfo);break;case 10:var d=b.type._context,e=b.memoizedProps.value;G(Wg,d._currentValue);d._currentValue=e;break;case 13:d=b.memoizedState;if(null!==d){if(null!==d.dehydrated)return G(L,L.current&1),b.flags|=128,null;if(0!==(c&b.child.childLanes))return oj(a,b,c);G(L,L.current&1);a=Zi(a,b,c);return null!==a?a.sibling:null}G(L,L.current&1);break;case 19:d=0!==(c&
		b.childLanes);if(0!==(a.flags&128)){if(d)return xj(a,b,c);b.flags|=128;}e=b.memoizedState;null!==e&&(e.rendering=null,e.tail=null,e.lastEffect=null);G(L,L.current);if(d)break;else return null;case 22:case 23:return b.lanes=0,dj(a,b,c)}return Zi(a,b,c)}var zj,Aj,Bj,Cj;
		zj=function(a,b){for(var c=b.child;null!==c;){if(5===c.tag||6===c.tag)a.appendChild(c.stateNode);else if(4!==c.tag&&null!==c.child){c.child.return=c;c=c.child;continue}if(c===b)break;for(;null===c.sibling;){if(null===c.return||c.return===b)return;c=c.return;}c.sibling.return=c.return;c=c.sibling;}};Aj=function(){};
		Bj=function(a,b,c,d){var e=a.memoizedProps;if(e!==d){a=b.stateNode;xh(uh.current);var f=null;switch(c){case "input":e=Ya(a,e);d=Ya(a,d);f=[];break;case "select":e=A({},e,{value:void 0});d=A({},d,{value:void 0});f=[];break;case "textarea":e=gb(a,e);d=gb(a,d);f=[];break;default:"function"!==typeof e.onClick&&"function"===typeof d.onClick&&(a.onclick=Bf);}ub(c,d);var g;c=null;for(l in e)if(!d.hasOwnProperty(l)&&e.hasOwnProperty(l)&&null!=e[l])if("style"===l){var h=e[l];for(g in h)h.hasOwnProperty(g)&&
		(c||(c={}),c[g]="");}else "dangerouslySetInnerHTML"!==l&&"children"!==l&&"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&"autoFocus"!==l&&(ea.hasOwnProperty(l)?f||(f=[]):(f=f||[]).push(l,null));for(l in d){var k=d[l];h=null!=e?e[l]:void 0;if(d.hasOwnProperty(l)&&k!==h&&(null!=k||null!=h))if("style"===l)if(h){for(g in h)!h.hasOwnProperty(g)||k&&k.hasOwnProperty(g)||(c||(c={}),c[g]="");for(g in k)k.hasOwnProperty(g)&&h[g]!==k[g]&&(c||(c={}),c[g]=k[g]);}else c||(f||(f=[]),f.push(l,
		c)),c=k;else "dangerouslySetInnerHTML"===l?(k=k?k.__html:void 0,h=h?h.__html:void 0,null!=k&&h!==k&&(f=f||[]).push(l,k)):"children"===l?"string"!==typeof k&&"number"!==typeof k||(f=f||[]).push(l,""+k):"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&(ea.hasOwnProperty(l)?(null!=k&&"onScroll"===l&&D("scroll",a),f||h===k||(f=[])):(f=f||[]).push(l,k));}c&&(f=f||[]).push("style",c);var l=f;if(b.updateQueue=l)b.flags|=4;}};Cj=function(a,b,c,d){c!==d&&(b.flags|=4);};
		function Dj(a,b){if(!I)switch(a.tailMode){case "hidden":b=a.tail;for(var c=null;null!==b;)null!==b.alternate&&(c=b),b=b.sibling;null===c?a.tail=null:c.sibling=null;break;case "collapsed":c=a.tail;for(var d=null;null!==c;)null!==c.alternate&&(d=c),c=c.sibling;null===d?b||null===a.tail?a.tail=null:a.tail.sibling=null:d.sibling=null;}}
		function S(a){var b=null!==a.alternate&&a.alternate.child===a.child,c=0,d=0;if(b)for(var e=a.child;null!==e;)c|=e.lanes|e.childLanes,d|=e.subtreeFlags&14680064,d|=e.flags&14680064,e.return=a,e=e.sibling;else for(e=a.child;null!==e;)c|=e.lanes|e.childLanes,d|=e.subtreeFlags,d|=e.flags,e.return=a,e=e.sibling;a.subtreeFlags|=d;a.childLanes=c;return b}
		function Ej(a,b,c){var d=b.pendingProps;wg(b);switch(b.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return S(b),null;case 1:return Zf(b.type)&&$f(),S(b),null;case 3:d=b.stateNode;zh();E(Wf);E(H);Eh();d.pendingContext&&(d.context=d.pendingContext,d.pendingContext=null);if(null===a||null===a.child)Gg(b)?b.flags|=4:null===a||a.memoizedState.isDehydrated&&0===(b.flags&256)||(b.flags|=1024,null!==zg&&(Fj(zg),zg=null));Aj(a,b);S(b);return null;case 5:Bh(b);var e=xh(wh.current);
		c=b.type;if(null!==a&&null!=b.stateNode)Bj(a,b,c,d,e),a.ref!==b.ref&&(b.flags|=512,b.flags|=2097152);else {if(!d){if(null===b.stateNode)throw Error(p(166));S(b);return null}a=xh(uh.current);if(Gg(b)){d=b.stateNode;c=b.type;var f=b.memoizedProps;d[Of]=b;d[Pf]=f;a=0!==(b.mode&1);switch(c){case "dialog":D("cancel",d);D("close",d);break;case "iframe":case "object":case "embed":D("load",d);break;case "video":case "audio":for(e=0;e<lf.length;e++)D(lf[e],d);break;case "source":D("error",d);break;case "img":case "image":case "link":D("error",
		d);D("load",d);break;case "details":D("toggle",d);break;case "input":Za(d,f);D("invalid",d);break;case "select":d._wrapperState={wasMultiple:!!f.multiple};D("invalid",d);break;case "textarea":hb(d,f),D("invalid",d);}ub(c,f);e=null;for(var g in f)if(f.hasOwnProperty(g)){var h=f[g];"children"===g?"string"===typeof h?d.textContent!==h&&(true!==f.suppressHydrationWarning&&Af(d.textContent,h,a),e=["children",h]):"number"===typeof h&&d.textContent!==""+h&&(true!==f.suppressHydrationWarning&&Af(d.textContent,
		h,a),e=["children",""+h]):ea.hasOwnProperty(g)&&null!=h&&"onScroll"===g&&D("scroll",d);}switch(c){case "input":Va(d);db(d,f,true);break;case "textarea":Va(d);jb(d);break;case "select":case "option":break;default:"function"===typeof f.onClick&&(d.onclick=Bf);}d=e;b.updateQueue=d;null!==d&&(b.flags|=4);}else {g=9===e.nodeType?e:e.ownerDocument;"http://www.w3.org/1999/xhtml"===a&&(a=kb(c));"http://www.w3.org/1999/xhtml"===a?"script"===c?(a=g.createElement("div"),a.innerHTML="<script>\x3c/script>",a=a.removeChild(a.firstChild)):
		"string"===typeof d.is?a=g.createElement(c,{is:d.is}):(a=g.createElement(c),"select"===c&&(g=a,d.multiple?g.multiple=true:d.size&&(g.size=d.size))):a=g.createElementNS(a,c);a[Of]=b;a[Pf]=d;zj(a,b,false,false);b.stateNode=a;a:{g=vb(c,d);switch(c){case "dialog":D("cancel",a);D("close",a);e=d;break;case "iframe":case "object":case "embed":D("load",a);e=d;break;case "video":case "audio":for(e=0;e<lf.length;e++)D(lf[e],a);e=d;break;case "source":D("error",a);e=d;break;case "img":case "image":case "link":D("error",
		a);D("load",a);e=d;break;case "details":D("toggle",a);e=d;break;case "input":Za(a,d);e=Ya(a,d);D("invalid",a);break;case "option":e=d;break;case "select":a._wrapperState={wasMultiple:!!d.multiple};e=A({},d,{value:void 0});D("invalid",a);break;case "textarea":hb(a,d);e=gb(a,d);D("invalid",a);break;default:e=d;}ub(c,e);h=e;for(f in h)if(h.hasOwnProperty(f)){var k=h[f];"style"===f?sb(a,k):"dangerouslySetInnerHTML"===f?(k=k?k.__html:void 0,null!=k&&nb(a,k)):"children"===f?"string"===typeof k?("textarea"!==
		c||""!==k)&&ob(a,k):"number"===typeof k&&ob(a,""+k):"suppressContentEditableWarning"!==f&&"suppressHydrationWarning"!==f&&"autoFocus"!==f&&(ea.hasOwnProperty(f)?null!=k&&"onScroll"===f&&D("scroll",a):null!=k&&ta(a,f,k,g));}switch(c){case "input":Va(a);db(a,d,false);break;case "textarea":Va(a);jb(a);break;case "option":null!=d.value&&a.setAttribute("value",""+Sa(d.value));break;case "select":a.multiple=!!d.multiple;f=d.value;null!=f?fb(a,!!d.multiple,f,false):null!=d.defaultValue&&fb(a,!!d.multiple,d.defaultValue,
		true);break;default:"function"===typeof e.onClick&&(a.onclick=Bf);}switch(c){case "button":case "input":case "select":case "textarea":d=!!d.autoFocus;break a;case "img":d=true;break a;default:d=false;}}d&&(b.flags|=4);}null!==b.ref&&(b.flags|=512,b.flags|=2097152);}S(b);return null;case 6:if(a&&null!=b.stateNode)Cj(a,b,a.memoizedProps,d);else {if("string"!==typeof d&&null===b.stateNode)throw Error(p(166));c=xh(wh.current);xh(uh.current);if(Gg(b)){d=b.stateNode;c=b.memoizedProps;d[Of]=b;if(f=d.nodeValue!==c)if(a=
		xg,null!==a)switch(a.tag){case 3:Af(d.nodeValue,c,0!==(a.mode&1));break;case 5:true!==a.memoizedProps.suppressHydrationWarning&&Af(d.nodeValue,c,0!==(a.mode&1));}f&&(b.flags|=4);}else d=(9===c.nodeType?c:c.ownerDocument).createTextNode(d),d[Of]=b,b.stateNode=d;}S(b);return null;case 13:E(L);d=b.memoizedState;if(null===a||null!==a.memoizedState&&null!==a.memoizedState.dehydrated){if(I&&null!==yg&&0!==(b.mode&1)&&0===(b.flags&128))Hg(),Ig(),b.flags|=98560,f=false;else if(f=Gg(b),null!==d&&null!==d.dehydrated){if(null===
		a){if(!f)throw Error(p(318));f=b.memoizedState;f=null!==f?f.dehydrated:null;if(!f)throw Error(p(317));f[Of]=b;}else Ig(),0===(b.flags&128)&&(b.memoizedState=null),b.flags|=4;S(b);f=false;}else null!==zg&&(Fj(zg),zg=null),f=true;if(!f)return b.flags&65536?b:null}if(0!==(b.flags&128))return b.lanes=c,b;d=null!==d;d!==(null!==a&&null!==a.memoizedState)&&d&&(b.child.flags|=8192,0!==(b.mode&1)&&(null===a||0!==(L.current&1)?0===T&&(T=3):tj()));null!==b.updateQueue&&(b.flags|=4);S(b);return null;case 4:return zh(),
		Aj(a,b),null===a&&sf(b.stateNode.containerInfo),S(b),null;case 10:return ah(b.type._context),S(b),null;case 17:return Zf(b.type)&&$f(),S(b),null;case 19:E(L);f=b.memoizedState;if(null===f)return S(b),null;d=0!==(b.flags&128);g=f.rendering;if(null===g)if(d)Dj(f,false);else {if(0!==T||null!==a&&0!==(a.flags&128))for(a=b.child;null!==a;){g=Ch(a);if(null!==g){b.flags|=128;Dj(f,false);d=g.updateQueue;null!==d&&(b.updateQueue=d,b.flags|=4);b.subtreeFlags=0;d=c;for(c=b.child;null!==c;)f=c,a=d,f.flags&=14680066,
		g=f.alternate,null===g?(f.childLanes=0,f.lanes=a,f.child=null,f.subtreeFlags=0,f.memoizedProps=null,f.memoizedState=null,f.updateQueue=null,f.dependencies=null,f.stateNode=null):(f.childLanes=g.childLanes,f.lanes=g.lanes,f.child=g.child,f.subtreeFlags=0,f.deletions=null,f.memoizedProps=g.memoizedProps,f.memoizedState=g.memoizedState,f.updateQueue=g.updateQueue,f.type=g.type,a=g.dependencies,f.dependencies=null===a?null:{lanes:a.lanes,firstContext:a.firstContext}),c=c.sibling;G(L,L.current&1|2);return b.child}a=
		a.sibling;}null!==f.tail&&B()>Gj&&(b.flags|=128,d=true,Dj(f,false),b.lanes=4194304);}else {if(!d)if(a=Ch(g),null!==a){if(b.flags|=128,d=true,c=a.updateQueue,null!==c&&(b.updateQueue=c,b.flags|=4),Dj(f,true),null===f.tail&&"hidden"===f.tailMode&&!g.alternate&&!I)return S(b),null}else 2*B()-f.renderingStartTime>Gj&&1073741824!==c&&(b.flags|=128,d=true,Dj(f,false),b.lanes=4194304);f.isBackwards?(g.sibling=b.child,b.child=g):(c=f.last,null!==c?c.sibling=g:b.child=g,f.last=g);}if(null!==f.tail)return b=f.tail,f.rendering=
		b,f.tail=b.sibling,f.renderingStartTime=B(),b.sibling=null,c=L.current,G(L,d?c&1|2:c&1),b;S(b);return null;case 22:case 23:return Hj(),d=null!==b.memoizedState,null!==a&&null!==a.memoizedState!==d&&(b.flags|=8192),d&&0!==(b.mode&1)?0!==(fj&1073741824)&&(S(b),b.subtreeFlags&6&&(b.flags|=8192)):S(b),null;case 24:return null;case 25:return null}throw Error(p(156,b.tag));}
		function Ij(a,b){wg(b);switch(b.tag){case 1:return Zf(b.type)&&$f(),a=b.flags,a&65536?(b.flags=a&-65537|128,b):null;case 3:return zh(),E(Wf),E(H),Eh(),a=b.flags,0!==(a&65536)&&0===(a&128)?(b.flags=a&-65537|128,b):null;case 5:return Bh(b),null;case 13:E(L);a=b.memoizedState;if(null!==a&&null!==a.dehydrated){if(null===b.alternate)throw Error(p(340));Ig();}a=b.flags;return a&65536?(b.flags=a&-65537|128,b):null;case 19:return E(L),null;case 4:return zh(),null;case 10:return ah(b.type._context),null;case 22:case 23:return Hj(),
		null;case 24:return null;default:return null}}var Jj=false,U=false,Kj="function"===typeof WeakSet?WeakSet:Set,V=null;function Lj(a,b){var c=a.ref;if(null!==c)if("function"===typeof c)try{c(null);}catch(d){W(a,b,d);}else c.current=null;}function Mj(a,b,c){try{c();}catch(d){W(a,b,d);}}var Nj=false;
		function Oj(a,b){Cf=dd;a=Me();if(Ne(a)){if("selectionStart"in a)var c={start:a.selectionStart,end:a.selectionEnd};else a:{c=(c=a.ownerDocument)&&c.defaultView||window;var d=c.getSelection&&c.getSelection();if(d&&0!==d.rangeCount){c=d.anchorNode;var e=d.anchorOffset,f=d.focusNode;d=d.focusOffset;try{c.nodeType,f.nodeType;}catch(F){c=null;break a}var g=0,h=-1,k=-1,l=0,m=0,q=a,r=null;b:for(;;){for(var y;;){q!==c||0!==e&&3!==q.nodeType||(h=g+e);q!==f||0!==d&&3!==q.nodeType||(k=g+d);3===q.nodeType&&(g+=
		q.nodeValue.length);if(null===(y=q.firstChild))break;r=q;q=y;}for(;;){if(q===a)break b;r===c&&++l===e&&(h=g);r===f&&++m===d&&(k=g);if(null!==(y=q.nextSibling))break;q=r;r=q.parentNode;}q=y;}c=-1===h||-1===k?null:{start:h,end:k};}else c=null;}c=c||{start:0,end:0};}else c=null;Df={focusedElem:a,selectionRange:c};dd=false;for(V=b;null!==V;)if(b=V,a=b.child,0!==(b.subtreeFlags&1028)&&null!==a)a.return=b,V=a;else for(;null!==V;){b=V;try{var n=b.alternate;if(0!==(b.flags&1024))switch(b.tag){case 0:case 11:case 15:break;
		case 1:if(null!==n){var t=n.memoizedProps,J=n.memoizedState,x=b.stateNode,w=x.getSnapshotBeforeUpdate(b.elementType===b.type?t:Ci(b.type,t),J);x.__reactInternalSnapshotBeforeUpdate=w;}break;case 3:var u=b.stateNode.containerInfo;1===u.nodeType?u.textContent="":9===u.nodeType&&u.documentElement&&u.removeChild(u.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(p(163));}}catch(F){W(b,b.return,F);}a=b.sibling;if(null!==a){a.return=b.return;V=a;break}V=b.return;}n=Nj;Nj=false;return n}
		function Pj(a,b,c){var d=b.updateQueue;d=null!==d?d.lastEffect:null;if(null!==d){var e=d=d.next;do{if((e.tag&a)===a){var f=e.destroy;e.destroy=void 0;void 0!==f&&Mj(b,c,f);}e=e.next;}while(e!==d)}}function Qj(a,b){b=b.updateQueue;b=null!==b?b.lastEffect:null;if(null!==b){var c=b=b.next;do{if((c.tag&a)===a){var d=c.create;c.destroy=d();}c=c.next;}while(c!==b)}}function Rj(a){var b=a.ref;if(null!==b){var c=a.stateNode;switch(a.tag){case 5:a=c;break;default:a=c;}"function"===typeof b?b(a):b.current=a;}}
		function Sj(a){var b=a.alternate;null!==b&&(a.alternate=null,Sj(b));a.child=null;a.deletions=null;a.sibling=null;5===a.tag&&(b=a.stateNode,null!==b&&(delete b[Of],delete b[Pf],delete b[of],delete b[Qf],delete b[Rf]));a.stateNode=null;a.return=null;a.dependencies=null;a.memoizedProps=null;a.memoizedState=null;a.pendingProps=null;a.stateNode=null;a.updateQueue=null;}function Tj(a){return 5===a.tag||3===a.tag||4===a.tag}
		function Uj(a){a:for(;;){for(;null===a.sibling;){if(null===a.return||Tj(a.return))return null;a=a.return;}a.sibling.return=a.return;for(a=a.sibling;5!==a.tag&&6!==a.tag&&18!==a.tag;){if(a.flags&2)continue a;if(null===a.child||4===a.tag)continue a;else a.child.return=a,a=a.child;}if(!(a.flags&2))return a.stateNode}}
		function Vj(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?8===c.nodeType?c.parentNode.insertBefore(a,b):c.insertBefore(a,b):(8===c.nodeType?(b=c.parentNode,b.insertBefore(a,c)):(b=c,b.appendChild(a)),c=c._reactRootContainer,null!==c&&void 0!==c||null!==b.onclick||(b.onclick=Bf));else if(4!==d&&(a=a.child,null!==a))for(Vj(a,b,c),a=a.sibling;null!==a;)Vj(a,b,c),a=a.sibling;}
		function Wj(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?c.insertBefore(a,b):c.appendChild(a);else if(4!==d&&(a=a.child,null!==a))for(Wj(a,b,c),a=a.sibling;null!==a;)Wj(a,b,c),a=a.sibling;}var X=null,Xj=false;function Yj(a,b,c){for(c=c.child;null!==c;)Zj(a,b,c),c=c.sibling;}
		function Zj(a,b,c){if(lc&&"function"===typeof lc.onCommitFiberUnmount)try{lc.onCommitFiberUnmount(kc,c);}catch(h){}switch(c.tag){case 5:U||Lj(c,b);case 6:var d=X,e=Xj;X=null;Yj(a,b,c);X=d;Xj=e;null!==X&&(Xj?(a=X,c=c.stateNode,8===a.nodeType?a.parentNode.removeChild(c):a.removeChild(c)):X.removeChild(c.stateNode));break;case 18:null!==X&&(Xj?(a=X,c=c.stateNode,8===a.nodeType?Kf(a.parentNode,c):1===a.nodeType&&Kf(a,c),bd(a)):Kf(X,c.stateNode));break;case 4:d=X;e=Xj;X=c.stateNode.containerInfo;Xj=true;
		Yj(a,b,c);X=d;Xj=e;break;case 0:case 11:case 14:case 15:if(!U&&(d=c.updateQueue,null!==d&&(d=d.lastEffect,null!==d))){e=d=d.next;do{var f=e,g=f.destroy;f=f.tag;void 0!==g&&(0!==(f&2)?Mj(c,b,g):0!==(f&4)&&Mj(c,b,g));e=e.next;}while(e!==d)}Yj(a,b,c);break;case 1:if(!U&&(Lj(c,b),d=c.stateNode,"function"===typeof d.componentWillUnmount))try{d.props=c.memoizedProps,d.state=c.memoizedState,d.componentWillUnmount();}catch(h){W(c,b,h);}Yj(a,b,c);break;case 21:Yj(a,b,c);break;case 22:c.mode&1?(U=(d=U)||null!==
		c.memoizedState,Yj(a,b,c),U=d):Yj(a,b,c);break;default:Yj(a,b,c);}}function ak(a){var b=a.updateQueue;if(null!==b){a.updateQueue=null;var c=a.stateNode;null===c&&(c=a.stateNode=new Kj);b.forEach(function(b){var d=bk.bind(null,a,b);c.has(b)||(c.add(b),b.then(d,d));});}}
		function ck(a,b){var c=b.deletions;if(null!==c)for(var d=0;d<c.length;d++){var e=c[d];try{var f=a,g=b,h=g;a:for(;null!==h;){switch(h.tag){case 5:X=h.stateNode;Xj=!1;break a;case 3:X=h.stateNode.containerInfo;Xj=!0;break a;case 4:X=h.stateNode.containerInfo;Xj=!0;break a}h=h.return;}if(null===X)throw Error(p(160));Zj(f,g,e);X=null;Xj=!1;var k=e.alternate;null!==k&&(k.return=null);e.return=null;}catch(l){W(e,b,l);}}if(b.subtreeFlags&12854)for(b=b.child;null!==b;)dk(b,a),b=b.sibling;}
		function dk(a,b){var c=a.alternate,d=a.flags;switch(a.tag){case 0:case 11:case 14:case 15:ck(b,a);ek(a);if(d&4){try{Pj(3,a,a.return),Qj(3,a);}catch(t){W(a,a.return,t);}try{Pj(5,a,a.return);}catch(t){W(a,a.return,t);}}break;case 1:ck(b,a);ek(a);d&512&&null!==c&&Lj(c,c.return);break;case 5:ck(b,a);ek(a);d&512&&null!==c&&Lj(c,c.return);if(a.flags&32){var e=a.stateNode;try{ob(e,"");}catch(t){W(a,a.return,t);}}if(d&4&&(e=a.stateNode,null!=e)){var f=a.memoizedProps,g=null!==c?c.memoizedProps:f,h=a.type,k=a.updateQueue;
		a.updateQueue=null;if(null!==k)try{"input"===h&&"radio"===f.type&&null!=f.name&&ab(e,f);vb(h,g);var l=vb(h,f);for(g=0;g<k.length;g+=2){var m=k[g],q=k[g+1];"style"===m?sb(e,q):"dangerouslySetInnerHTML"===m?nb(e,q):"children"===m?ob(e,q):ta(e,m,q,l);}switch(h){case "input":bb(e,f);break;case "textarea":ib(e,f);break;case "select":var r=e._wrapperState.wasMultiple;e._wrapperState.wasMultiple=!!f.multiple;var y=f.value;null!=y?fb(e,!!f.multiple,y,!1):r!==!!f.multiple&&(null!=f.defaultValue?fb(e,!!f.multiple,
		f.defaultValue,!0):fb(e,!!f.multiple,f.multiple?[]:"",!1));}e[Pf]=f;}catch(t){W(a,a.return,t);}}break;case 6:ck(b,a);ek(a);if(d&4){if(null===a.stateNode)throw Error(p(162));e=a.stateNode;f=a.memoizedProps;try{e.nodeValue=f;}catch(t){W(a,a.return,t);}}break;case 3:ck(b,a);ek(a);if(d&4&&null!==c&&c.memoizedState.isDehydrated)try{bd(b.containerInfo);}catch(t){W(a,a.return,t);}break;case 4:ck(b,a);ek(a);break;case 13:ck(b,a);ek(a);e=a.child;e.flags&8192&&(f=null!==e.memoizedState,e.stateNode.isHidden=f,!f||
		null!==e.alternate&&null!==e.alternate.memoizedState||(fk=B()));d&4&&ak(a);break;case 22:m=null!==c&&null!==c.memoizedState;a.mode&1?(U=(l=U)||m,ck(b,a),U=l):ck(b,a);ek(a);if(d&8192){l=null!==a.memoizedState;if((a.stateNode.isHidden=l)&&!m&&0!==(a.mode&1))for(V=a,m=a.child;null!==m;){for(q=V=m;null!==V;){r=V;y=r.child;switch(r.tag){case 0:case 11:case 14:case 15:Pj(4,r,r.return);break;case 1:Lj(r,r.return);var n=r.stateNode;if("function"===typeof n.componentWillUnmount){d=r;c=r.return;try{b=d,n.props=
		b.memoizedProps,n.state=b.memoizedState,n.componentWillUnmount();}catch(t){W(d,c,t);}}break;case 5:Lj(r,r.return);break;case 22:if(null!==r.memoizedState){gk(q);continue}}null!==y?(y.return=r,V=y):gk(q);}m=m.sibling;}a:for(m=null,q=a;;){if(5===q.tag){if(null===m){m=q;try{e=q.stateNode,l?(f=e.style,"function"===typeof f.setProperty?f.setProperty("display","none","important"):f.display="none"):(h=q.stateNode,k=q.memoizedProps.style,g=void 0!==k&&null!==k&&k.hasOwnProperty("display")?k.display:null,h.style.display=
		rb("display",g));}catch(t){W(a,a.return,t);}}}else if(6===q.tag){if(null===m)try{q.stateNode.nodeValue=l?"":q.memoizedProps;}catch(t){W(a,a.return,t);}}else if((22!==q.tag&&23!==q.tag||null===q.memoizedState||q===a)&&null!==q.child){q.child.return=q;q=q.child;continue}if(q===a)break a;for(;null===q.sibling;){if(null===q.return||q.return===a)break a;m===q&&(m=null);q=q.return;}m===q&&(m=null);q.sibling.return=q.return;q=q.sibling;}}break;case 19:ck(b,a);ek(a);d&4&&ak(a);break;case 21:break;default:ck(b,
		a),ek(a);}}function ek(a){var b=a.flags;if(b&2){try{a:{for(var c=a.return;null!==c;){if(Tj(c)){var d=c;break a}c=c.return;}throw Error(p(160));}switch(d.tag){case 5:var e=d.stateNode;d.flags&32&&(ob(e,""),d.flags&=-33);var f=Uj(a);Wj(a,f,e);break;case 3:case 4:var g=d.stateNode.containerInfo,h=Uj(a);Vj(a,h,g);break;default:throw Error(p(161));}}catch(k){W(a,a.return,k);}a.flags&=-3;}b&4096&&(a.flags&=-4097);}function hk(a,b,c){V=a;ik(a);}
		function ik(a,b,c){for(var d=0!==(a.mode&1);null!==V;){var e=V,f=e.child;if(22===e.tag&&d){var g=null!==e.memoizedState||Jj;if(!g){var h=e.alternate,k=null!==h&&null!==h.memoizedState||U;h=Jj;var l=U;Jj=g;if((U=k)&&!l)for(V=e;null!==V;)g=V,k=g.child,22===g.tag&&null!==g.memoizedState?jk(e):null!==k?(k.return=g,V=k):jk(e);for(;null!==f;)V=f,ik(f),f=f.sibling;V=e;Jj=h;U=l;}kk(a);}else 0!==(e.subtreeFlags&8772)&&null!==f?(f.return=e,V=f):kk(a);}}
		function kk(a){for(;null!==V;){var b=V;if(0!==(b.flags&8772)){var c=b.alternate;try{if(0!==(b.flags&8772))switch(b.tag){case 0:case 11:case 15:U||Qj(5,b);break;case 1:var d=b.stateNode;if(b.flags&4&&!U)if(null===c)d.componentDidMount();else {var e=b.elementType===b.type?c.memoizedProps:Ci(b.type,c.memoizedProps);d.componentDidUpdate(e,c.memoizedState,d.__reactInternalSnapshotBeforeUpdate);}var f=b.updateQueue;null!==f&&sh(b,f,d);break;case 3:var g=b.updateQueue;if(null!==g){c=null;if(null!==b.child)switch(b.child.tag){case 5:c=
		b.child.stateNode;break;case 1:c=b.child.stateNode;}sh(b,g,c);}break;case 5:var h=b.stateNode;if(null===c&&b.flags&4){c=h;var k=b.memoizedProps;switch(b.type){case "button":case "input":case "select":case "textarea":k.autoFocus&&c.focus();break;case "img":k.src&&(c.src=k.src);}}break;case 6:break;case 4:break;case 12:break;case 13:if(null===b.memoizedState){var l=b.alternate;if(null!==l){var m=l.memoizedState;if(null!==m){var q=m.dehydrated;null!==q&&bd(q);}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;
		default:throw Error(p(163));}U||b.flags&512&&Rj(b);}catch(r){W(b,b.return,r);}}if(b===a){V=null;break}c=b.sibling;if(null!==c){c.return=b.return;V=c;break}V=b.return;}}function gk(a){for(;null!==V;){var b=V;if(b===a){V=null;break}var c=b.sibling;if(null!==c){c.return=b.return;V=c;break}V=b.return;}}
		function jk(a){for(;null!==V;){var b=V;try{switch(b.tag){case 0:case 11:case 15:var c=b.return;try{Qj(4,b);}catch(k){W(b,c,k);}break;case 1:var d=b.stateNode;if("function"===typeof d.componentDidMount){var e=b.return;try{d.componentDidMount();}catch(k){W(b,e,k);}}var f=b.return;try{Rj(b);}catch(k){W(b,f,k);}break;case 5:var g=b.return;try{Rj(b);}catch(k){W(b,g,k);}}}catch(k){W(b,b.return,k);}if(b===a){V=null;break}var h=b.sibling;if(null!==h){h.return=b.return;V=h;break}V=b.return;}}
		var lk=Math.ceil,mk=ua.ReactCurrentDispatcher,nk=ua.ReactCurrentOwner,ok=ua.ReactCurrentBatchConfig,K=0,Q=null,Y=null,Z=0,fj=0,ej=Uf(0),T=0,pk=null,rh=0,qk=0,rk=0,sk=null,tk=null,fk=0,Gj=Infinity,uk=null,Oi=false,Pi=null,Ri=null,vk=false,wk=null,xk=0,yk=0,zk=null,Ak=-1,Bk=0;function R(){return 0!==(K&6)?B():-1!==Ak?Ak:Ak=B()}
		function yi(a){if(0===(a.mode&1))return 1;if(0!==(K&2)&&0!==Z)return Z&-Z;if(null!==Kg.transition)return 0===Bk&&(Bk=yc()),Bk;a=C;if(0!==a)return a;a=window.event;a=void 0===a?16:jd(a.type);return a}function gi(a,b,c,d){if(50<yk)throw yk=0,zk=null,Error(p(185));Ac(a,c,d);if(0===(K&2)||a!==Q)a===Q&&(0===(K&2)&&(qk|=c),4===T&&Ck(a,Z)),Dk(a,d),1===c&&0===K&&0===(b.mode&1)&&(Gj=B()+500,fg&&jg());}
		function Dk(a,b){var c=a.callbackNode;wc(a,b);var d=uc(a,a===Q?Z:0);if(0===d)null!==c&&bc(c),a.callbackNode=null,a.callbackPriority=0;else if(b=d&-d,a.callbackPriority!==b){null!=c&&bc(c);if(1===b)0===a.tag?ig(Ek.bind(null,a)):hg(Ek.bind(null,a)),Jf(function(){0===(K&6)&&jg();}),c=null;else {switch(Dc(d)){case 1:c=fc;break;case 4:c=gc;break;case 16:c=hc;break;case 536870912:c=jc;break;default:c=hc;}c=Fk(c,Gk.bind(null,a));}a.callbackPriority=b;a.callbackNode=c;}}
		function Gk(a,b){Ak=-1;Bk=0;if(0!==(K&6))throw Error(p(327));var c=a.callbackNode;if(Hk()&&a.callbackNode!==c)return null;var d=uc(a,a===Q?Z:0);if(0===d)return null;if(0!==(d&30)||0!==(d&a.expiredLanes)||b)b=Ik(a,d);else {b=d;var e=K;K|=2;var f=Jk();if(Q!==a||Z!==b)uk=null,Gj=B()+500,Kk(a,b);do try{Lk();break}catch(h){Mk(a,h);}while(1);$g();mk.current=f;K=e;null!==Y?b=0:(Q=null,Z=0,b=T);}if(0!==b){2===b&&(e=xc(a),0!==e&&(d=e,b=Nk(a,e)));if(1===b)throw c=pk,Kk(a,0),Ck(a,d),Dk(a,B()),c;if(6===b)Ck(a,d);
		else {e=a.current.alternate;if(0===(d&30)&&!Ok(e)&&(b=Ik(a,d),2===b&&(f=xc(a),0!==f&&(d=f,b=Nk(a,f))),1===b))throw c=pk,Kk(a,0),Ck(a,d),Dk(a,B()),c;a.finishedWork=e;a.finishedLanes=d;switch(b){case 0:case 1:throw Error(p(345));case 2:Pk(a,tk,uk);break;case 3:Ck(a,d);if((d&130023424)===d&&(b=fk+500-B(),10<b)){if(0!==uc(a,0))break;e=a.suspendedLanes;if((e&d)!==d){R();a.pingedLanes|=a.suspendedLanes&e;break}a.timeoutHandle=Ff(Pk.bind(null,a,tk,uk),b);break}Pk(a,tk,uk);break;case 4:Ck(a,d);if((d&4194240)===
		d)break;b=a.eventTimes;for(e=-1;0<d;){var g=31-oc(d);f=1<<g;g=b[g];g>e&&(e=g);d&=~f;}d=e;d=B()-d;d=(120>d?120:480>d?480:1080>d?1080:1920>d?1920:3E3>d?3E3:4320>d?4320:1960*lk(d/1960))-d;if(10<d){a.timeoutHandle=Ff(Pk.bind(null,a,tk,uk),d);break}Pk(a,tk,uk);break;case 5:Pk(a,tk,uk);break;default:throw Error(p(329));}}}Dk(a,B());return a.callbackNode===c?Gk.bind(null,a):null}
		function Nk(a,b){var c=sk;a.current.memoizedState.isDehydrated&&(Kk(a,b).flags|=256);a=Ik(a,b);2!==a&&(b=tk,tk=c,null!==b&&Fj(b));return a}function Fj(a){null===tk?tk=a:tk.push.apply(tk,a);}
		function Ok(a){for(var b=a;;){if(b.flags&16384){var c=b.updateQueue;if(null!==c&&(c=c.stores,null!==c))for(var d=0;d<c.length;d++){var e=c[d],f=e.getSnapshot;e=e.value;try{if(!He(f(),e))return !1}catch(g){return  false}}}c=b.child;if(b.subtreeFlags&16384&&null!==c)c.return=b,b=c;else {if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return  true;b=b.return;}b.sibling.return=b.return;b=b.sibling;}}return  true}
		function Ck(a,b){b&=~rk;b&=~qk;a.suspendedLanes|=b;a.pingedLanes&=~b;for(a=a.expirationTimes;0<b;){var c=31-oc(b),d=1<<c;a[c]=-1;b&=~d;}}function Ek(a){if(0!==(K&6))throw Error(p(327));Hk();var b=uc(a,0);if(0===(b&1))return Dk(a,B()),null;var c=Ik(a,b);if(0!==a.tag&&2===c){var d=xc(a);0!==d&&(b=d,c=Nk(a,d));}if(1===c)throw c=pk,Kk(a,0),Ck(a,b),Dk(a,B()),c;if(6===c)throw Error(p(345));a.finishedWork=a.current.alternate;a.finishedLanes=b;Pk(a,tk,uk);Dk(a,B());return null}
		function Qk(a,b){var c=K;K|=1;try{return a(b)}finally{K=c,0===K&&(Gj=B()+500,fg&&jg());}}function Rk(a){null!==wk&&0===wk.tag&&0===(K&6)&&Hk();var b=K;K|=1;var c=ok.transition,d=C;try{if(ok.transition=null,C=1,a)return a()}finally{C=d,ok.transition=c,K=b,0===(K&6)&&jg();}}function Hj(){fj=ej.current;E(ej);}
		function Kk(a,b){a.finishedWork=null;a.finishedLanes=0;var c=a.timeoutHandle;-1!==c&&(a.timeoutHandle=-1,Gf(c));if(null!==Y)for(c=Y.return;null!==c;){var d=c;wg(d);switch(d.tag){case 1:d=d.type.childContextTypes;null!==d&&void 0!==d&&$f();break;case 3:zh();E(Wf);E(H);Eh();break;case 5:Bh(d);break;case 4:zh();break;case 13:E(L);break;case 19:E(L);break;case 10:ah(d.type._context);break;case 22:case 23:Hj();}c=c.return;}Q=a;Y=a=Pg(a.current,null);Z=fj=b;T=0;pk=null;rk=qk=rh=0;tk=sk=null;if(null!==fh){for(b=
		0;b<fh.length;b++)if(c=fh[b],d=c.interleaved,null!==d){c.interleaved=null;var e=d.next,f=c.pending;if(null!==f){var g=f.next;f.next=e;d.next=g;}c.pending=d;}fh=null;}return a}
		function Mk(a,b){do{var c=Y;try{$g();Fh.current=Rh;if(Ih){for(var d=M.memoizedState;null!==d;){var e=d.queue;null!==e&&(e.pending=null);d=d.next;}Ih=!1;}Hh=0;O=N=M=null;Jh=!1;Kh=0;nk.current=null;if(null===c||null===c.return){T=1;pk=b;Y=null;break}a:{var f=a,g=c.return,h=c,k=b;b=Z;h.flags|=32768;if(null!==k&&"object"===typeof k&&"function"===typeof k.then){var l=k,m=h,q=m.tag;if(0===(m.mode&1)&&(0===q||11===q||15===q)){var r=m.alternate;r?(m.updateQueue=r.updateQueue,m.memoizedState=r.memoizedState,
		m.lanes=r.lanes):(m.updateQueue=null,m.memoizedState=null);}var y=Ui(g);if(null!==y){y.flags&=-257;Vi(y,g,h,f,b);y.mode&1&&Si(f,l,b);b=y;k=l;var n=b.updateQueue;if(null===n){var t=new Set;t.add(k);b.updateQueue=t;}else n.add(k);break a}else {if(0===(b&1)){Si(f,l,b);tj();break a}k=Error(p(426));}}else if(I&&h.mode&1){var J=Ui(g);if(null!==J){0===(J.flags&65536)&&(J.flags|=256);Vi(J,g,h,f,b);Jg(Ji(k,h));break a}}f=k=Ji(k,h);4!==T&&(T=2);null===sk?sk=[f]:sk.push(f);f=g;do{switch(f.tag){case 3:f.flags|=65536;
		b&=-b;f.lanes|=b;var x=Ni(f,k,b);ph(f,x);break a;case 1:h=k;var w=f.type,u=f.stateNode;if(0===(f.flags&128)&&("function"===typeof w.getDerivedStateFromError||null!==u&&"function"===typeof u.componentDidCatch&&(null===Ri||!Ri.has(u)))){f.flags|=65536;b&=-b;f.lanes|=b;var F=Qi(f,h,b);ph(f,F);break a}}f=f.return;}while(null!==f)}Sk(c);}catch(na){b=na;Y===c&&null!==c&&(Y=c=c.return);continue}break}while(1)}function Jk(){var a=mk.current;mk.current=Rh;return null===a?Rh:a}
		function tj(){if(0===T||3===T||2===T)T=4;null===Q||0===(rh&268435455)&&0===(qk&268435455)||Ck(Q,Z);}function Ik(a,b){var c=K;K|=2;var d=Jk();if(Q!==a||Z!==b)uk=null,Kk(a,b);do try{Tk();break}catch(e){Mk(a,e);}while(1);$g();K=c;mk.current=d;if(null!==Y)throw Error(p(261));Q=null;Z=0;return T}function Tk(){for(;null!==Y;)Uk(Y);}function Lk(){for(;null!==Y&&!cc();)Uk(Y);}function Uk(a){var b=Vk(a.alternate,a,fj);a.memoizedProps=a.pendingProps;null===b?Sk(a):Y=b;nk.current=null;}
		function Sk(a){var b=a;do{var c=b.alternate;a=b.return;if(0===(b.flags&32768)){if(c=Ej(c,b,fj),null!==c){Y=c;return}}else {c=Ij(c,b);if(null!==c){c.flags&=32767;Y=c;return}if(null!==a)a.flags|=32768,a.subtreeFlags=0,a.deletions=null;else {T=6;Y=null;return}}b=b.sibling;if(null!==b){Y=b;return}Y=b=a;}while(null!==b);0===T&&(T=5);}function Pk(a,b,c){var d=C,e=ok.transition;try{ok.transition=null,C=1,Wk(a,b,c,d);}finally{ok.transition=e,C=d;}return null}
		function Wk(a,b,c,d){do Hk();while(null!==wk);if(0!==(K&6))throw Error(p(327));c=a.finishedWork;var e=a.finishedLanes;if(null===c)return null;a.finishedWork=null;a.finishedLanes=0;if(c===a.current)throw Error(p(177));a.callbackNode=null;a.callbackPriority=0;var f=c.lanes|c.childLanes;Bc(a,f);a===Q&&(Y=Q=null,Z=0);0===(c.subtreeFlags&2064)&&0===(c.flags&2064)||vk||(vk=true,Fk(hc,function(){Hk();return null}));f=0!==(c.flags&15990);if(0!==(c.subtreeFlags&15990)||f){f=ok.transition;ok.transition=null;
		var g=C;C=1;var h=K;K|=4;nk.current=null;Oj(a,c);dk(c,a);Oe(Df);dd=!!Cf;Df=Cf=null;a.current=c;hk(c);dc();K=h;C=g;ok.transition=f;}else a.current=c;vk&&(vk=false,wk=a,xk=e);f=a.pendingLanes;0===f&&(Ri=null);mc(c.stateNode);Dk(a,B());if(null!==b)for(d=a.onRecoverableError,c=0;c<b.length;c++)e=b[c],d(e.value,{componentStack:e.stack,digest:e.digest});if(Oi)throw Oi=false,a=Pi,Pi=null,a;0!==(xk&1)&&0!==a.tag&&Hk();f=a.pendingLanes;0!==(f&1)?a===zk?yk++:(yk=0,zk=a):yk=0;jg();return null}
		function Hk(){if(null!==wk){var a=Dc(xk),b=ok.transition,c=C;try{ok.transition=null;C=16>a?16:a;if(null===wk)var d=!1;else {a=wk;wk=null;xk=0;if(0!==(K&6))throw Error(p(331));var e=K;K|=4;for(V=a.current;null!==V;){var f=V,g=f.child;if(0!==(V.flags&16)){var h=f.deletions;if(null!==h){for(var k=0;k<h.length;k++){var l=h[k];for(V=l;null!==V;){var m=V;switch(m.tag){case 0:case 11:case 15:Pj(8,m,f);}var q=m.child;if(null!==q)q.return=m,V=q;else for(;null!==V;){m=V;var r=m.sibling,y=m.return;Sj(m);if(m===
		l){V=null;break}if(null!==r){r.return=y;V=r;break}V=y;}}}var n=f.alternate;if(null!==n){var t=n.child;if(null!==t){n.child=null;do{var J=t.sibling;t.sibling=null;t=J;}while(null!==t)}}V=f;}}if(0!==(f.subtreeFlags&2064)&&null!==g)g.return=f,V=g;else b:for(;null!==V;){f=V;if(0!==(f.flags&2048))switch(f.tag){case 0:case 11:case 15:Pj(9,f,f.return);}var x=f.sibling;if(null!==x){x.return=f.return;V=x;break b}V=f.return;}}var w=a.current;for(V=w;null!==V;){g=V;var u=g.child;if(0!==(g.subtreeFlags&2064)&&null!==
		u)u.return=g,V=u;else b:for(g=w;null!==V;){h=V;if(0!==(h.flags&2048))try{switch(h.tag){case 0:case 11:case 15:Qj(9,h);}}catch(na){W(h,h.return,na);}if(h===g){V=null;break b}var F=h.sibling;if(null!==F){F.return=h.return;V=F;break b}V=h.return;}}K=e;jg();if(lc&&"function"===typeof lc.onPostCommitFiberRoot)try{lc.onPostCommitFiberRoot(kc,a);}catch(na){}d=!0;}return d}finally{C=c,ok.transition=b;}}return  false}function Xk(a,b,c){b=Ji(c,b);b=Ni(a,b,1);a=nh(a,b,1);b=R();null!==a&&(Ac(a,1,b),Dk(a,b));}
		function W(a,b,c){if(3===a.tag)Xk(a,a,c);else for(;null!==b;){if(3===b.tag){Xk(b,a,c);break}else if(1===b.tag){var d=b.stateNode;if("function"===typeof b.type.getDerivedStateFromError||"function"===typeof d.componentDidCatch&&(null===Ri||!Ri.has(d))){a=Ji(c,a);a=Qi(b,a,1);b=nh(b,a,1);a=R();null!==b&&(Ac(b,1,a),Dk(b,a));break}}b=b.return;}}
		function Ti(a,b,c){var d=a.pingCache;null!==d&&d.delete(b);b=R();a.pingedLanes|=a.suspendedLanes&c;Q===a&&(Z&c)===c&&(4===T||3===T&&(Z&130023424)===Z&&500>B()-fk?Kk(a,0):rk|=c);Dk(a,b);}function Yk(a,b){0===b&&(0===(a.mode&1)?b=1:(b=sc,sc<<=1,0===(sc&130023424)&&(sc=4194304)));var c=R();a=ih(a,b);null!==a&&(Ac(a,b,c),Dk(a,c));}function uj(a){var b=a.memoizedState,c=0;null!==b&&(c=b.retryLane);Yk(a,c);}
		function bk(a,b){var c=0;switch(a.tag){case 13:var d=a.stateNode;var e=a.memoizedState;null!==e&&(c=e.retryLane);break;case 19:d=a.stateNode;break;default:throw Error(p(314));}null!==d&&d.delete(b);Yk(a,c);}var Vk;
		Vk=function(a,b,c){if(null!==a)if(a.memoizedProps!==b.pendingProps||Wf.current)dh=true;else {if(0===(a.lanes&c)&&0===(b.flags&128))return dh=false,yj(a,b,c);dh=0!==(a.flags&131072)?true:false;}else dh=false,I&&0!==(b.flags&1048576)&&ug(b,ng,b.index);b.lanes=0;switch(b.tag){case 2:var d=b.type;ij(a,b);a=b.pendingProps;var e=Yf(b,H.current);ch(b,c);e=Nh(null,b,d,a,e,c);var f=Sh();b.flags|=1;"object"===typeof e&&null!==e&&"function"===typeof e.render&&void 0===e.$$typeof?(b.tag=1,b.memoizedState=null,b.updateQueue=
		null,Zf(d)?(f=true,cg(b)):f=false,b.memoizedState=null!==e.state&&void 0!==e.state?e.state:null,kh(b),e.updater=Ei,b.stateNode=e,e._reactInternals=b,Ii(b,d,a,c),b=jj(null,b,d,true,f,c)):(b.tag=0,I&&f&&vg(b),Xi(null,b,e,c),b=b.child);return b;case 16:d=b.elementType;a:{ij(a,b);a=b.pendingProps;e=d._init;d=e(d._payload);b.type=d;e=b.tag=Zk(d);a=Ci(d,a);switch(e){case 0:b=cj(null,b,d,a,c);break a;case 1:b=hj(null,b,d,a,c);break a;case 11:b=Yi(null,b,d,a,c);break a;case 14:b=$i(null,b,d,Ci(d.type,a),c);break a}throw Error(p(306,
		d,""));}return b;case 0:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),cj(a,b,d,e,c);case 1:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),hj(a,b,d,e,c);case 3:a:{kj(b);if(null===a)throw Error(p(387));d=b.pendingProps;f=b.memoizedState;e=f.element;lh(a,b);qh(b,d,null,c);var g=b.memoizedState;d=g.element;if(f.isDehydrated)if(f={element:d,isDehydrated:false,cache:g.cache,pendingSuspenseBoundaries:g.pendingSuspenseBoundaries,transitions:g.transitions},b.updateQueue.baseState=
		f,b.memoizedState=f,b.flags&256){e=Ji(Error(p(423)),b);b=lj(a,b,d,c,e);break a}else if(d!==e){e=Ji(Error(p(424)),b);b=lj(a,b,d,c,e);break a}else for(yg=Lf(b.stateNode.containerInfo.firstChild),xg=b,I=true,zg=null,c=Vg(b,null,d,c),b.child=c;c;)c.flags=c.flags&-3|4096,c=c.sibling;else {Ig();if(d===e){b=Zi(a,b,c);break a}Xi(a,b,d,c);}b=b.child;}return b;case 5:return Ah(b),null===a&&Eg(b),d=b.type,e=b.pendingProps,f=null!==a?a.memoizedProps:null,g=e.children,Ef(d,e)?g=null:null!==f&&Ef(d,f)&&(b.flags|=32),
		gj(a,b),Xi(a,b,g,c),b.child;case 6:return null===a&&Eg(b),null;case 13:return oj(a,b,c);case 4:return yh(b,b.stateNode.containerInfo),d=b.pendingProps,null===a?b.child=Ug(b,null,d,c):Xi(a,b,d,c),b.child;case 11:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),Yi(a,b,d,e,c);case 7:return Xi(a,b,b.pendingProps,c),b.child;case 8:return Xi(a,b,b.pendingProps.children,c),b.child;case 12:return Xi(a,b,b.pendingProps.children,c),b.child;case 10:a:{d=b.type._context;e=b.pendingProps;f=b.memoizedProps;
		g=e.value;G(Wg,d._currentValue);d._currentValue=g;if(null!==f)if(He(f.value,g)){if(f.children===e.children&&!Wf.current){b=Zi(a,b,c);break a}}else for(f=b.child,null!==f&&(f.return=b);null!==f;){var h=f.dependencies;if(null!==h){g=f.child;for(var k=h.firstContext;null!==k;){if(k.context===d){if(1===f.tag){k=mh(-1,c&-c);k.tag=2;var l=f.updateQueue;if(null!==l){l=l.shared;var m=l.pending;null===m?k.next=k:(k.next=m.next,m.next=k);l.pending=k;}}f.lanes|=c;k=f.alternate;null!==k&&(k.lanes|=c);bh(f.return,
		c,b);h.lanes|=c;break}k=k.next;}}else if(10===f.tag)g=f.type===b.type?null:f.child;else if(18===f.tag){g=f.return;if(null===g)throw Error(p(341));g.lanes|=c;h=g.alternate;null!==h&&(h.lanes|=c);bh(g,c,b);g=f.sibling;}else g=f.child;if(null!==g)g.return=f;else for(g=f;null!==g;){if(g===b){g=null;break}f=g.sibling;if(null!==f){f.return=g.return;g=f;break}g=g.return;}f=g;}Xi(a,b,e.children,c);b=b.child;}return b;case 9:return e=b.type,d=b.pendingProps.children,ch(b,c),e=eh(e),d=d(e),b.flags|=1,Xi(a,b,d,c),
		b.child;case 14:return d=b.type,e=Ci(d,b.pendingProps),e=Ci(d.type,e),$i(a,b,d,e,c);case 15:return bj(a,b,b.type,b.pendingProps,c);case 17:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),ij(a,b),b.tag=1,Zf(d)?(a=true,cg(b)):a=false,ch(b,c),Gi(b,d,e),Ii(b,d,e,c),jj(null,b,d,true,a,c);case 19:return xj(a,b,c);case 22:return dj(a,b,c)}throw Error(p(156,b.tag));};function Fk(a,b){return ac(a,b)}
		function $k(a,b,c,d){this.tag=a;this.key=c;this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null;this.index=0;this.ref=null;this.pendingProps=b;this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null;this.mode=d;this.subtreeFlags=this.flags=0;this.deletions=null;this.childLanes=this.lanes=0;this.alternate=null;}function Bg(a,b,c,d){return new $k(a,b,c,d)}function aj(a){a=a.prototype;return !(!a||!a.isReactComponent)}
		function Zk(a){if("function"===typeof a)return aj(a)?1:0;if(void 0!==a&&null!==a){a=a.$$typeof;if(a===Da)return 11;if(a===Ga)return 14}return 2}
		function Pg(a,b){var c=a.alternate;null===c?(c=Bg(a.tag,b,a.key,a.mode),c.elementType=a.elementType,c.type=a.type,c.stateNode=a.stateNode,c.alternate=a,a.alternate=c):(c.pendingProps=b,c.type=a.type,c.flags=0,c.subtreeFlags=0,c.deletions=null);c.flags=a.flags&14680064;c.childLanes=a.childLanes;c.lanes=a.lanes;c.child=a.child;c.memoizedProps=a.memoizedProps;c.memoizedState=a.memoizedState;c.updateQueue=a.updateQueue;b=a.dependencies;c.dependencies=null===b?null:{lanes:b.lanes,firstContext:b.firstContext};
		c.sibling=a.sibling;c.index=a.index;c.ref=a.ref;return c}
		function Rg(a,b,c,d,e,f){var g=2;d=a;if("function"===typeof a)aj(a)&&(g=1);else if("string"===typeof a)g=5;else a:switch(a){case ya:return Tg(c.children,e,f,b);case za:g=8;e|=8;break;case Aa:return a=Bg(12,c,b,e|2),a.elementType=Aa,a.lanes=f,a;case Ea:return a=Bg(13,c,b,e),a.elementType=Ea,a.lanes=f,a;case Fa:return a=Bg(19,c,b,e),a.elementType=Fa,a.lanes=f,a;case Ia:return pj(c,e,f,b);default:if("object"===typeof a&&null!==a)switch(a.$$typeof){case Ba:g=10;break a;case Ca:g=9;break a;case Da:g=11;
		break a;case Ga:g=14;break a;case Ha:g=16;d=null;break a}throw Error(p(130,null==a?a:typeof a,""));}b=Bg(g,c,b,e);b.elementType=a;b.type=d;b.lanes=f;return b}function Tg(a,b,c,d){a=Bg(7,a,d,b);a.lanes=c;return a}function pj(a,b,c,d){a=Bg(22,a,d,b);a.elementType=Ia;a.lanes=c;a.stateNode={isHidden:false};return a}function Qg(a,b,c){a=Bg(6,a,null,b);a.lanes=c;return a}
		function Sg(a,b,c){b=Bg(4,null!==a.children?a.children:[],a.key,b);b.lanes=c;b.stateNode={containerInfo:a.containerInfo,pendingChildren:null,implementation:a.implementation};return b}
		function al(a,b,c,d,e){this.tag=b;this.containerInfo=a;this.finishedWork=this.pingCache=this.current=this.pendingChildren=null;this.timeoutHandle=-1;this.callbackNode=this.pendingContext=this.context=null;this.callbackPriority=0;this.eventTimes=zc(0);this.expirationTimes=zc(-1);this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0;this.entanglements=zc(0);this.identifierPrefix=d;this.onRecoverableError=e;this.mutableSourceEagerHydrationData=
		null;}function bl(a,b,c,d,e,f,g,h,k){a=new al(a,b,c,h,k);1===b?(b=1,true===f&&(b|=8)):b=0;f=Bg(3,null,null,b);a.current=f;f.stateNode=a;f.memoizedState={element:d,isDehydrated:c,cache:null,transitions:null,pendingSuspenseBoundaries:null};kh(f);return a}function cl(a,b,c){var d=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null;return {$$typeof:wa,key:null==d?null:""+d,children:a,containerInfo:b,implementation:c}}
		function dl(a){if(!a)return Vf;a=a._reactInternals;a:{if(Vb(a)!==a||1!==a.tag)throw Error(p(170));var b=a;do{switch(b.tag){case 3:b=b.stateNode.context;break a;case 1:if(Zf(b.type)){b=b.stateNode.__reactInternalMemoizedMergedChildContext;break a}}b=b.return;}while(null!==b);throw Error(p(171));}if(1===a.tag){var c=a.type;if(Zf(c))return bg(a,c,b)}return b}
		function el(a,b,c,d,e,f,g,h,k){a=bl(c,d,true,a,e,f,g,h,k);a.context=dl(null);c=a.current;d=R();e=yi(c);f=mh(d,e);f.callback=void 0!==b&&null!==b?b:null;nh(c,f,e);a.current.lanes=e;Ac(a,e,d);Dk(a,d);return a}function fl(a,b,c,d){var e=b.current,f=R(),g=yi(e);c=dl(c);null===b.context?b.context=c:b.pendingContext=c;b=mh(f,g);b.payload={element:a};d=void 0===d?null:d;null!==d&&(b.callback=d);a=nh(e,b,g);null!==a&&(gi(a,e,g,f),oh(a,e,g));return g}
		function gl(a){a=a.current;if(!a.child)return null;switch(a.child.tag){case 5:return a.child.stateNode;default:return a.child.stateNode}}function hl(a,b){a=a.memoizedState;if(null!==a&&null!==a.dehydrated){var c=a.retryLane;a.retryLane=0!==c&&c<b?c:b;}}function il(a,b){hl(a,b);(a=a.alternate)&&hl(a,b);}function jl(){return null}var kl="function"===typeof reportError?reportError:function(a){console.error(a);};function ll(a){this._internalRoot=a;}
		ml.prototype.render=ll.prototype.render=function(a){var b=this._internalRoot;if(null===b)throw Error(p(409));fl(a,b,null,null);};ml.prototype.unmount=ll.prototype.unmount=function(){var a=this._internalRoot;if(null!==a){this._internalRoot=null;var b=a.containerInfo;Rk(function(){fl(null,a,null,null);});b[uf]=null;}};function ml(a){this._internalRoot=a;}
		ml.prototype.unstable_scheduleHydration=function(a){if(a){var b=Hc();a={blockedOn:null,target:a,priority:b};for(var c=0;c<Qc.length&&0!==b&&b<Qc[c].priority;c++);Qc.splice(c,0,a);0===c&&Vc(a);}};function nl(a){return !(!a||1!==a.nodeType&&9!==a.nodeType&&11!==a.nodeType)}function ol(a){return !(!a||1!==a.nodeType&&9!==a.nodeType&&11!==a.nodeType&&(8!==a.nodeType||" react-mount-point-unstable "!==a.nodeValue))}function pl(){}
		function ql(a,b,c,d,e){if(e){if("function"===typeof d){var f=d;d=function(){var a=gl(g);f.call(a);};}var g=el(b,d,a,0,null,false,false,"",pl);a._reactRootContainer=g;a[uf]=g.current;sf(8===a.nodeType?a.parentNode:a);Rk();return g}for(;e=a.lastChild;)a.removeChild(e);if("function"===typeof d){var h=d;d=function(){var a=gl(k);h.call(a);};}var k=bl(a,0,false,null,null,false,false,"",pl);a._reactRootContainer=k;a[uf]=k.current;sf(8===a.nodeType?a.parentNode:a);Rk(function(){fl(b,k,c,d);});return k}
		function rl(a,b,c,d,e){var f=c._reactRootContainer;if(f){var g=f;if("function"===typeof e){var h=e;e=function(){var a=gl(g);h.call(a);};}fl(b,g,a,e);}else g=ql(c,b,a,e,d);return gl(g)}Ec=function(a){switch(a.tag){case 3:var b=a.stateNode;if(b.current.memoizedState.isDehydrated){var c=tc(b.pendingLanes);0!==c&&(Cc(b,c|1),Dk(b,B()),0===(K&6)&&(Gj=B()+500,jg()));}break;case 13:Rk(function(){var b=ih(a,1);if(null!==b){var c=R();gi(b,a,1,c);}}),il(a,1);}};
		Fc=function(a){if(13===a.tag){var b=ih(a,134217728);if(null!==b){var c=R();gi(b,a,134217728,c);}il(a,134217728);}};Gc=function(a){if(13===a.tag){var b=yi(a),c=ih(a,b);if(null!==c){var d=R();gi(c,a,b,d);}il(a,b);}};Hc=function(){return C};Ic=function(a,b){var c=C;try{return C=a,b()}finally{C=c;}};
		yb=function(a,b,c){switch(b){case "input":bb(a,c);b=c.name;if("radio"===c.type&&null!=b){for(c=a;c.parentNode;)c=c.parentNode;c=c.querySelectorAll("input[name="+JSON.stringify(""+b)+'][type="radio"]');for(b=0;b<c.length;b++){var d=c[b];if(d!==a&&d.form===a.form){var e=Db(d);if(!e)throw Error(p(90));Wa(d);bb(d,e);}}}break;case "textarea":ib(a,c);break;case "select":b=c.value,null!=b&&fb(a,!!c.multiple,b,false);}};Gb=Qk;Hb=Rk;
		var sl={usingClientEntryPoint:false,Events:[Cb,ue,Db,Eb,Fb,Qk]},tl={findFiberByHostInstance:Wc,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"};
		var ul={bundleType:tl.bundleType,version:tl.version,rendererPackageName:tl.rendererPackageName,rendererConfig:tl.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:ua.ReactCurrentDispatcher,findHostInstanceByFiber:function(a){a=Zb(a);return null===a?null:a.stateNode},findFiberByHostInstance:tl.findFiberByHostInstance||
		jl,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if("undefined"!==typeof __REACT_DEVTOOLS_GLOBAL_HOOK__){var vl=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!vl.isDisabled&&vl.supportsFiber)try{kc=vl.inject(ul),lc=vl;}catch(a){}}reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=sl;
		reactDom_production_min.createPortal=function(a,b){var c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null;if(!nl(b))throw Error(p(200));return cl(a,b,null,c)};reactDom_production_min.createRoot=function(a,b){if(!nl(a))throw Error(p(299));var c=false,d="",e=kl;null!==b&&void 0!==b&&(true===b.unstable_strictMode&&(c=true),void 0!==b.identifierPrefix&&(d=b.identifierPrefix),void 0!==b.onRecoverableError&&(e=b.onRecoverableError));b=bl(a,1,false,null,null,c,false,d,e);a[uf]=b.current;sf(8===a.nodeType?a.parentNode:a);return new ll(b)};
		reactDom_production_min.findDOMNode=function(a){if(null==a)return null;if(1===a.nodeType)return a;var b=a._reactInternals;if(void 0===b){if("function"===typeof a.render)throw Error(p(188));a=Object.keys(a).join(",");throw Error(p(268,a));}a=Zb(b);a=null===a?null:a.stateNode;return a};reactDom_production_min.flushSync=function(a){return Rk(a)};reactDom_production_min.hydrate=function(a,b,c){if(!ol(b))throw Error(p(200));return rl(null,a,b,true,c)};
		reactDom_production_min.hydrateRoot=function(a,b,c){if(!nl(a))throw Error(p(405));var d=null!=c&&c.hydratedSources||null,e=false,f="",g=kl;null!==c&&void 0!==c&&(true===c.unstable_strictMode&&(e=true),void 0!==c.identifierPrefix&&(f=c.identifierPrefix),void 0!==c.onRecoverableError&&(g=c.onRecoverableError));b=el(b,null,a,1,null!=c?c:null,e,false,f,g);a[uf]=b.current;sf(a);if(d)for(a=0;a<d.length;a++)c=d[a],e=c._getVersion,e=e(c._source),null==b.mutableSourceEagerHydrationData?b.mutableSourceEagerHydrationData=[c,e]:b.mutableSourceEagerHydrationData.push(c,
		e);return new ml(b)};reactDom_production_min.render=function(a,b,c){if(!ol(b))throw Error(p(200));return rl(null,a,b,false,c)};reactDom_production_min.unmountComponentAtNode=function(a){if(!ol(a))throw Error(p(40));return a._reactRootContainer?(Rk(function(){rl(null,null,a,!1,function(){a._reactRootContainer=null;a[uf]=null;});}),true):false};reactDom_production_min.unstable_batchedUpdates=Qk;
		reactDom_production_min.unstable_renderSubtreeIntoContainer=function(a,b,c,d){if(!ol(c))throw Error(p(200));if(null==a||void 0===a._reactInternals)throw Error(p(38));return rl(a,b,c,false,d)};reactDom_production_min.version="18.3.1-next-f1338f8080-20240426";
		return reactDom_production_min;
	}

	var hasRequiredReactDom;

	function requireReactDom () {
		if (hasRequiredReactDom) return reactDom.exports;
		hasRequiredReactDom = 1;

		function checkDCE() {
		  /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
		  if (
		    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined' ||
		    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== 'function'
		  ) {
		    return;
		  }
		  try {
		    // Verify that the code above has been dead code eliminated (DCE'd).
		    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
		  } catch (err) {
		    // DevTools shouldn't crash React, no matter what.
		    // We should still report in case we break this code.
		    console.error(err);
		  }
		}

		{
		  // DCE check should happen before ReactDOM bundle executes so that
		  // DevTools can report bad minification during injection.
		  checkDCE();
		  reactDom.exports = requireReactDom_production_min();
		}
		return reactDom.exports;
	}

	var hasRequiredClient;

	function requireClient () {
		if (hasRequiredClient) return client;
		hasRequiredClient = 1;

		var m = requireReactDom();
		{
		  client.createRoot = m.createRoot;
		  client.hydrateRoot = m.hydrateRoot;
		}
		return client;
	}

	var clientExports = requireClient();
	var ReactDOM = /*@__PURE__*/getDefaultExportFromCjs(clientExports);

	var reactExports = requireReact();
	var We = /*@__PURE__*/getDefaultExportFromCjs(reactExports);

	// 玩家身份：显示名可自定义，原始实验编号永久固定
	// 规范约束：R-07 是固定实验编号；玩家修改的只是「显示名称」。
	const ORIGIN_CODE = 'R-07';
	const DEFAULT_DISPLAY_NAME = 'R-07';
	const DISPLAY_NAME_MAX = 12;
	/** 其他核心角色的名字，避免玩家改成与剧情角色同名造成混淆 */
	const RESERVED_NAMES = ['MIRA', '恩格尔', 'ENGER', 'K-0', 'K0', 'NEXUS'];
	function defaultIdentity(now = Date.now()) {
	    return { displayName: DEFAULT_DISPLAY_NAME, originCode: ORIGIN_CODE, renamed: false, createdAt: now };
	}
	/** 清洗显示名：去控制字符、合并空白、限长（不改变原始编号） */
	function sanitizeDisplayName(raw) {
	    if (typeof raw !== 'string')
	        return '';
	    return raw
	        .replace(/[\r\n\t\u0000-\u001f\u007f]/g, ' ')
	        .replace(/\s+/g, ' ')
	        .trim()
	        .slice(0, DISPLAY_NAME_MAX);
	}
	function validateDisplayName(raw) {
	    const name = sanitizeDisplayName(raw);
	    if (!name)
	        return { ok: false, name, reason: '显示名称不能为空。' };
	    if (name.length > DISPLAY_NAME_MAX) {
	        return { ok: false, name, reason: '显示名称最多 ' + DISPLAY_NAME_MAX + ' 个字符。' };
	    }
	    const upper = name.toUpperCase().replace(/\s+/g, '');
	    if (RESERVED_NAMES.some(n => n.toUpperCase().replace(/\s+/g, '') === upper)) {
	        return { ok: false, name, reason: '该名称属于 NEXUS 的核心角色，请换一个。' };
	    }
	    return { ok: true, name };
	}
	/** 旧存档兼容：缺失/损坏的身份信息补齐，且强制 originCode = R-07 */
	function normalizeIdentity(raw, fallbackName) {
	    const now = Date.now();
	    const r = (raw && typeof raw === 'object' ? raw : {});
	    const fallback = sanitizeDisplayName(fallbackName);
	    const displayName = sanitizeDisplayName(r.displayName) || fallback || DEFAULT_DISPLAY_NAME;
	    const renamed = typeof r.renamed === 'boolean' ? r.renamed : displayName !== DEFAULT_DISPLAY_NAME;
	    return {
	        displayName,
	        originCode: ORIGIN_CODE,
	        renamed,
	        createdAt: typeof r.createdAt === 'number' && isFinite(r.createdAt) ? r.createdAt : now,
	    };
	}
	/** 全游戏统一读取显示名（永不返回空串） */
	function displayNameOf(p) {
	    if (!p)
	        return DEFAULT_DISPLAY_NAME;
	    const fromIdentity = sanitizeDisplayName(p.identity?.displayName);
	    if (fromIdentity)
	        return fromIdentity;
	    return sanitizeDisplayName(p.name) || DEFAULT_DISPLAY_NAME;
	}
	/** 全游戏统一读取原始编号（常量，不受改名影响） */
	function originCodeOf(_p) {
	    return ORIGIN_CODE;
	}
	/** 台词里显式指代「实验编号」的占位符：永远渲染为 R-07，不受改名影响 */
	const CODE_TOKEN = '{{code}}';
	const CODE_SENTINEL = '\u0001';
	/**
	 * 对话文本中的名称替换：
	 * - `{player}` → 玩家显示名（称呼）
	 * - `{{code}}` → 固定实验编号 R-07（无论玩家是否改名）
	 * - 玩家改过名时，正文里裸写的 R-07 也按显示名处理（兼容旧台词）
	 */
	function applyPlayerName(text, displayName) {
	    if (!text)
	        return '';
	    const dn = sanitizeDisplayName(displayName) || DEFAULT_DISPLAY_NAME;
	    let out = text.split(CODE_TOKEN).join(CODE_SENTINEL);
	    out = out.split('{player}').join(dn);
	    if (dn !== ORIGIN_CODE)
	        out = out.split(ORIGIN_CODE).join(dn);
	    return out.split(CODE_SENTINEL).join(ORIGIN_CODE);
	}

	const STORY_EVENTS = [
	    { id: 'prologue', kind: 'prologue', title: '序章 · 沉睡的意识' },
	    { id: 'tutorial-done', kind: 'tutorial', title: '训练终端 · 接驳完成' },
	    { id: 'chapter-1', kind: 'chapter', chapter: 'ch1', title: '第一章 · 失落的数据港', requireFlag: 'chapter1Done' },
	    { id: 'chapter-2', kind: 'chapter', chapter: 'ch2', title: '第二章 · 破碎的记忆花园', requireFlag: 'chapter2Done' },
	    { id: 'chapter-3', kind: 'chapter', chapter: 'ch3', title: '第三章 · 被遗忘的实验档案', requireFlag: 'chapter3Done' },
	    { id: 'chapter-4', kind: 'chapter', chapter: 'ch4', title: '第四章 · 失控的核心工坊', requireFlag: 'chapter4Done' },
	    { id: 'chapter-5', kind: 'chapter', chapter: 'ch5', title: '第五章 · 黎明崩塌的真相', requireFlag: 'chapter5Done' },
	    { id: 'chapter-6', kind: 'chapter', chapter: 'ch6', title: '第六章 · 起源之外', requireFlag: 'chapter6Done' },
	    { id: 'boss-gate-01', kind: 'boss', chapter: 'ch1', title: '章节 Boss · GATE-01 数据港守卫' },
	    { id: 'boss-echo-02', kind: 'boss', chapter: 'ch2', title: 'Boss 遭遇 · ECHO-02' },
	    { id: 'boss-echo-03', kind: 'boss', chapter: 'ch3', title: 'Boss 遭遇 · ECHO-03' },
	    { id: 'boss-echo-04', kind: 'boss', chapter: 'ch4', title: 'Boss 遭遇 · ECHO-04' },
	    { id: 'boss-echo-05', kind: 'boss', chapter: 'ch5', title: 'Boss 遭遇 · ECHO-05' },
	    { id: 'rebirth', kind: 'rebirth', title: 'ORIGIN PROTOCOL · 意识重组' },
	];
	function defaultStoryReadState() {
	    return { unlocked: [], seen: {}, choices: {}, lastEventId: null };
	}
	/** 清洗阅读状态；legacySeen 为旧存档的 progress.storySeen */
	function normalizeStoryReadState(raw, legacySeen) {
	    const r = (raw && typeof raw === 'object' ? raw : {});
	    const seen = {};
	    if (r.seen && typeof r.seen === 'object') {
	        for (const [k, v] of Object.entries(r.seen)) {
	            if (!k)
	                continue;
	            const n = typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : v === true ? 1 : 0;
	            if (n > 0)
	                seen[k] = Math.min(999, n);
	        }
	    }
	    if (legacySeen && typeof legacySeen === 'object') {
	        for (const [k, v] of Object.entries(legacySeen)) {
	            if (!k || v !== true)
	                continue;
	            if (!seen[k])
	                seen[k] = 1;
	        }
	    }
	    const unlocked = Array.isArray(r.unlocked)
	        ? [...new Set(r.unlocked.filter((x) => typeof x === 'string' && x.length > 0))]
	        : [];
	    const choices = {};
	    if (r.choices && typeof r.choices === 'object') {
	        for (const [k, v] of Object.entries(r.choices)) {
	            if (k && typeof v === 'string')
	                choices[k] = v;
	        }
	    }
	    return {
	        unlocked,
	        seen,
	        choices,
	        lastEventId: typeof r.lastEventId === 'string' ? r.lastEventId : null,
	    };
	}
	/** 记录一个对话节点被阅读（幂等累加次数） */
	function markNodeSeen(state, nodeId) {
	    if (!nodeId)
	        return state;
	    const n = state.seen[nodeId] || 0;
	    if (n >= 999)
	        return state;
	    return { ...state, seen: { ...state.seen, [nodeId]: n + 1 } };
	}
	/** 解锁剧情事件（幂等） */
	function unlockEvent(state, eventId) {
	    if (!eventId || state.unlocked.includes(eventId))
	        return state;
	    return { ...state, unlocked: [...state.unlocked, eventId], lastEventId: eventId };
	}
	/** 记录分支选择（同一节点重复选择时保留最新一次） */
	function recordChoice(state, nodeId, label) {
	    if (!nodeId || !label)
	        return state;
	    return { ...state, choices: { ...state.choices, [nodeId]: label } };
	}
	/** 某事件的阅读进度（按节点统计） */
	function eventReadProgress(state, nodeIds) {
	    const total = nodeIds.length;
	    const read = nodeIds.filter(id => (state.seen[id] || 0) > 0).length;
	    return { read, total };
	}

	const STORY_VARS = [
	    { key: 'prologueDone', type: 'boolean', def: false, desc: '序章剧情已看完' },
	    { key: 'tutorialCinematicShown', type: 'boolean', def: false, desc: '训练终端完成过场已播放' },
	    { key: 'chapter1Done', type: 'boolean', def: false, desc: '第一章 5 个修复任务全部完成', chapter: 'ch1' },
	    { key: 'chapter2Done', type: 'boolean', def: false, desc: '第二章全部完成', chapter: 'ch2' },
	    { key: 'chapter3Done', type: 'boolean', def: false, desc: '第三章全部完成', chapter: 'ch3' },
	    { key: 'chapter4Done', type: 'boolean', def: false, desc: '第四章全部完成', chapter: 'ch4' },
	    { key: 'chapter5Done', type: 'boolean', def: false, desc: '第五章全部完成', chapter: 'ch5' },
	    { key: 'chapter6Done', type: 'boolean', def: false, desc: '终章全部完成', chapter: 'ch6' },
	    { key: 'chapter1CinematicShown', type: 'boolean', def: false, desc: '第一章完成过场已播放', chapter: 'ch1' },
	    { key: 'chapter2ArrivalSeen', type: 'boolean', def: false, desc: '第二章「进入记忆花园」演出已播放', chapter: 'ch2' },
	    { key: 'chapter2RestoreSeen', type: 'boolean', def: false, desc: '第二章「花园恢复 + SOMNIA 登场」演出已播放', chapter: 'ch2' },
	    { key: 'chapter2CinematicShown', type: 'boolean', def: false, desc: '第二章完成过场已播放', chapter: 'ch2' },
	    { key: 'chapter3CinematicShown', type: 'boolean', def: false, desc: '第三章完成过场已播放', chapter: 'ch3' },
	    { key: 'chapter4CinematicShown', type: 'boolean', def: false, desc: '第四章完成过场已播放', chapter: 'ch4' },
	    { key: 'chapter5CinematicShown', type: 'boolean', def: false, desc: '第五章完成过场已播放', chapter: 'ch5' },
	    { key: 'chapter6CinematicShown', type: 'boolean', def: false, desc: '终章过场已播放', chapter: 'ch6' },
	    { key: 'pendingChapterUnlock', type: 'boolean', def: false, desc: '第一章完成，等待开放下一章', chapter: 'ch1' },
	    { key: 'pendingChapter3Unlock', type: 'boolean', def: false, desc: '第二章完成，等待开放第三章', chapter: 'ch2' },
	    { key: 'pendingChapter4Unlock', type: 'boolean', def: false, desc: '第三章完成，等待开放第四章', chapter: 'ch3' },
	    { key: 'pendingChapter5Unlock', type: 'boolean', def: false, desc: '第四章完成，等待开放第五章', chapter: 'ch4' },
	    { key: 'pendingChapter6Unlock', type: 'boolean', def: false, desc: '第五章完成，等待开放终章', chapter: 'ch5' },
	    { key: 'chapter1ArrivalSeen', type: 'boolean', def: false, desc: '第一章「前往数据港」演出已播放', chapter: 'ch1' },
	    { key: 'chapter1RestoreSeen', type: 'boolean', def: false, desc: '第一章「数据港恢复 + K-0 警告」演出已播放', chapter: 'ch1' },
	    { key: 'chapter1ZeroFail', type: 'boolean', def: false, desc: '第一章全程零失败（完美修复成就）', chapter: 'ch1' },
	    { key: 'defenseWon', type: 'boolean', def: false, desc: '成功击退过一次纠错者攻击' },
	    { key: 'gameCompleted', type: 'boolean', def: false, desc: '全网络复原（六章通关）' },
	    { key: 'secretArchive', type: 'boolean', def: false, desc: '已解锁五年前事故机密档案' },
	    { key: 'miraExtraTalk', type: 'boolean', def: false, desc: '已解锁 MIRA 专属对话' },
	    { key: 'fxRepair', type: 'boolean', def: false, desc: '已解锁数据重构特效' },
	];
	STORY_VARS.map(v => v.key);
	/**
	 * 清洗剧情变量：只保留 boolean / 有限数字，未知 key 一律保留（向前兼容）。
	 * 注意：不注入默认值——避免改变「字段缺失」与「显式 false」的语义差别。
	 */
	function normalizeStoryVars(raw) {
	    const out = {};
	    if (!raw || typeof raw !== 'object')
	        return out;
	    for (const [k, v] of Object.entries(raw)) {
	        if (!k)
	            continue;
	        if (typeof v === 'boolean')
	            out[k] = v;
	        else if (typeof v === 'number' && isFinite(v))
	            out[k] = v;
	    }
	    return out;
	}

	// NEXUS 奖励系统：修复贡献点 / MIRA 信任度 / 关卡评级 / 兑换中心 / 章节奖励
	// 与经验等级、成就、知识卡、意识值、剧情进度并行，互不覆盖（旧的 exp/level 逻辑完全保留）。
	function defaultRewards() {
	    return { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], bossRewards: [], unlocks: [] };
	}
	/** 兼容旧存档：缺失字段逐一补齐（不覆盖已有值） */
	function normalizeRewards(raw) {
	    const d = defaultRewards();
	    if (!raw || typeof raw !== 'object')
	        return d;
	    const r = raw;
	    return {
	        credits: typeof r.credits === 'number' && isFinite(r.credits) ? Math.max(0, Math.floor(r.credits)) : d.credits,
	        trust: typeof r.trust === 'number' && isFinite(r.trust) ? Math.min(100, Math.max(0, Math.round(r.trust))) : d.trust,
	        items: r.items && typeof r.items === 'object' ? { ...r.items } : {},
	        skins: Array.isArray(r.skins) ? r.skins.slice() : [],
	        equipped: r.equipped && typeof r.equipped === 'object' ? { ...r.equipped } : {},
	        chapterRewards: Array.isArray(r.chapterRewards) ? r.chapterRewards.slice() : [],
	        cleared: r.cleared && typeof r.cleared === 'object' ? { ...r.cleared } : {},
	        archiveRead: Array.isArray(r.archiveRead) ? r.archiveRead.slice() : [],
	        bossRewards: Array.isArray(r.bossRewards) ? r.bossRewards.slice() : [],
	        unlocks: Array.isArray(r.unlocks) ? r.unlocks.slice() : [],
	    };
	}
	// ---------- 关卡评级 ----------
	/** 只看失误与提示，不看耗时（不惩罚慢玩家） */
	function gradeOf(fails, hints) {
	    if (fails <= 0 && hints <= 0)
	        return 'S';
	    if (fails <= 1 && hints <= 1)
	        return 'A';
	    if (fails <= 3 && hints <= 3)
	        return 'B';
	    return 'C';
	}
	const GRADE_META = {
	    S: { label: 'S', color: '#FFD75E', desc: '完美修复 · 零失误 · 未用提示' },
	    A: { label: 'A', color: '#42D6D0', desc: '顺利修复 · 少量失误' },
	    B: { label: 'B', color: '#7FA6BC', desc: '成功修复 · 借助了提示或多次尝试' },
	    C: { label: 'C', color: '#B08BD6', desc: '多次尝试后修复完成' },
	};
	const CHAPTER_REWARDS = [
	    { id: 'ch1', chapter: 1, title: '初级修复师称号', desc: '你的名字第一次被写进 NEXUS 的修复记录。', credits: 40, skins: ['title-junior'] },
	    { id: 'ch2', chapter: 2, title: '终端主题 · 深海回路', desc: 'MIRA 为你换上了她最喜欢的终端配色。', credits: 60, skins: ['terminal-deep'] },
	    { id: 'ch3', chapter: 3, title: '隐藏记忆碎片', desc: '仓库深处的一段加密碎片，来自五年前。', credits: 80, fragment: 'f8' },
	    { id: 'ch4', chapter: 4, title: 'MIRA 专属对话', desc: '她第一次主动和你聊起自己的过去。', credits: 100, items: { decoder: 1 } },
	    { id: 'ch5', chapter: 5, title: '高级修复工具包', desc: '诊断中心的备用工具，现在归你调度。', credits: 120, items: { scan: 2, rollback: 1 } },
	    { id: 'ch6', chapter: 6, title: '原初继承者称号', desc: '创世主的遗志，由你继承。', credits: 300, skins: ['title-successor'], items: { stabilizer: 2 } },
	];
	const chapterRewardOf = (chapter) => CHAPTER_REWARDS.find(c => c.chapter === chapter);
	const SHOP_ITEMS = [
	    // 外观
	    { id: 'terminal-neon', name: '终端主题 · 霓虹脉冲', category: 'look', price: 80, desc: '高对比度的青紫配色，代码看起来更锋利。', icon: '▤', unique: true, slot: 'terminal' },
	    { id: 'terminal-deep', name: '终端主题 · 深海回路', category: 'look', price: 90, desc: 'MIRA 调制：低亮度蓝绿，久看不累。', icon: '▥', unique: true, slot: 'terminal' },
	    { id: 'particles-net', name: '粒子背景 · 数据流', category: 'look', price: 120, desc: '背景漂浮着缓慢流动的绿色数据点。', icon: '✧', unique: true, slot: 'particles' },
	    { id: 'title-junior', name: '称号 · 初级修复师', category: 'look', price: 60, desc: '在玩家档案与地图上显示。', icon: '◈', unique: true, slot: 'title' },
	    { id: 'title-successor', name: '称号 · 原初继承者', category: 'look', price: 260, desc: '创世主遗留的最终称谓。', icon: '✦', unique: true, slot: 'title' },
	    { id: 'login-gold', name: '登录界面 · 黄金协议', category: 'look', price: 150, desc: '启动页换成金色协议风格。', icon: '⧉', unique: true, slot: 'login' },
	    { id: 'bg-ark', name: '数字世界背景 · 方舟核心', category: 'look', price: 200, desc: '地图背景换成核心机房的发光脉络。', icon: '◉', unique: true, slot: 'bg' },
	    { id: 'frame-bronze', name: '头像框 · 青铜回路', category: 'look', price: 70, desc: '档案页与状态卡的 R-07 头像外框。', icon: '◯', unique: true, slot: 'avatarFrame' },
	    { id: 'frame-neon', name: '头像框 · 霓虹脉冲', category: 'look', price: 130, desc: '青紫脉冲边框，会随意识值呼吸。', icon: '◎', unique: true, slot: 'avatarFrame' },
	    // 道具
	    { id: 'scan', name: '错误定位扫描器', category: 'tool', price: 50, count: 1, desc: '在编辑器中标出最可能出错的行范围（不直接给答案）。', icon: '⌖' },
	    { id: 'rollback', name: '数据回滚模块', category: 'tool', price: 40, count: 1, desc: '把编辑器恢复到本次修改前的状态。', icon: '↺' },
	    { id: 'stabilizer', name: '意识稳定模块', category: 'tool', price: 70, count: 1, desc: '恢复 10 点意识值（不超过上限，不改变难度）。', icon: '✚' },
	    { id: 'decoder', name: '记忆解码器', category: 'tool', price: 90, count: 1, desc: '解锁一份尚未收集的记忆档案（不影响关卡判题）。', icon: '✦' },
	    // 特殊
	    { id: 'mira-talk', name: 'MIRA 专属对话', category: 'special', price: 100, desc: '解锁一段 MIRA 的额外对话（信任度相关）。', icon: '◍', unique: true, flag: 'miraExtraTalk' },
	    { id: 'archive-secret', name: '特殊剧情档案', category: 'special', price: 120, desc: '解锁「五年前事故」的机密档案条目。', icon: '▣', unique: true, flag: 'secretArchive' },
	    { id: 'fx-repair', name: '修复特效 · 数据重构', category: 'special', price: 140, desc: '通关结算时播放额外的数据重构光效。', icon: '✺', unique: true, flag: 'fxRepair' },
	];
	const shopItemById = (id) => SHOP_ITEMS.find(i => i.id === id);
	const MEMORY_ARCHIVES = [
	    { id: 'arc-1', need: 2, title: '档案 · 事故前夜', content: '五年前的维护日志显示：核心机房在事故前一小时收到过一次外部同步请求，签名被抹除。' },
	    { id: 'arc-2', need: 4, title: '档案 · MIRA 的诞生', content: 'MIRA 的初始版本由恩格尔亲手编写。她在日志里写下第一句话：「我会记得所有被修复过的东西。」' },
	    { id: 'arc-3', need: 6, title: '档案 · 被改写的 ECHO', content: 'ECHO 的原始权限与 R-07 同源。事故当天，一段外来代码把它从「观察者」改写成了「清道夫」。' },
	    { id: 'arc-4', need: 9, title: '档案 · 原初协议', content: 'ORIGIN PROTOCOL 的真实用途：不是应急重启，而是为「会提问的数字生命」保留一次重新选择的机会。' },
	];
	/** 当前碎片数量可解锁的档案 */
	function unlockedArchives(fragmentCount) {
	    return MEMORY_ARCHIVES.filter(a => fragmentCount >= a.need);
	}
	/** MIRA 信任度阶段（剧情意义：解锁对话与提示语气） */
	const TRUST_TIERS = [
	    { at: 0, name: '陌生', desc: 'MIRA 保持着标准的维修助手语气。' },
	    { at: 25, name: '熟悉', desc: '她开始用更短的句子和你说话。' },
	    { at: 50, name: '信任', desc: '她会主动提醒你注意休息。' },
	    { at: 75, name: '默契', desc: '她愿意分享自己的日志片段。' },
	    { at: 100, name: '共生', desc: '她把你当作「一起活下来的人」。' },
	];
	function trustTier(trust) {
	    let cur = TRUST_TIERS[0];
	    for (const t of TRUST_TIERS)
	        if (trust >= t.at)
	            cur = t;
	    return cur;
	}

	// NEXUS 语音服务：Web Speech API 单例，统一管理播放队列、角色音色与停止逻辑。
	// 不依赖任何外部 API，音量与背景音乐/音效完全分离。
	const DEFAULT_VOICE = {
	    enabled: true,
	    autoRead: false,
	    rate: 1,
	    pitch: 1,
	    volume: 0.9,
	    lang: 'zh-CN',
	    roleVoices: {},
	};
	function normalizeVoice(raw) {
	    const d = { ...DEFAULT_VOICE };
	    if (!raw || typeof raw !== 'object')
	        return d;
	    const r = raw;
	    return {
	        enabled: typeof r.enabled === 'boolean' ? r.enabled : d.enabled,
	        autoRead: typeof r.autoRead === 'boolean' ? r.autoRead : d.autoRead,
	        rate: typeof r.rate === 'number' ? Math.min(2, Math.max(0.5, r.rate)) : d.rate,
	        pitch: typeof r.pitch === 'number' ? Math.min(2, Math.max(0, r.pitch)) : d.pitch,
	        volume: typeof r.volume === 'number' ? Math.min(1, Math.max(0, r.volume)) : d.volume,
	        lang: typeof r.lang === 'string' && r.lang ? r.lang : d.lang,
	        roleVoices: r.roleVoices && typeof r.roleVoices === 'object' ? { ...r.roleVoices } : {},
	    };
	}
	/** 角色语音画像：同一音色下用语速/音调区分性格 */
	const ROLE_PROFILES = {
	    mira: { label: 'MIRA', rate: 0.98, pitch: 1.18, desc: '温柔、理性、略高音' },
	    system: { label: 'NEXUS 系统', rate: 1.02, pitch: 0.82, desc: '机械、冷静、偏低音' },
	    echo: { label: 'ECHO', rate: 0.88, pitch: 0.62, desc: '低沉、压迫、缓慢' },
	    narrator: { label: '旁白', rate: 0.95, pitch: 1.00, desc: '平稳、自然' },
	    r07: { label: 'R-07', rate: 1.00, pitch: 1.06, desc: '玩家本人' },
	    engel: { label: '恩格尔', rate: 0.92, pitch: 0.94, desc: '沉稳、怀旧' },
	    k0: { label: 'K-0', rate: 0.86, pitch: 0.55, desc: '极低音、冷静、无情绪起伏' },
	};
	class SpeechService {
	    constructor() {
	        Object.defineProperty(this, "synth", {
	            enumerable: true,
	            configurable: true,
	            writable: true,
	            value: null
	        });
	        Object.defineProperty(this, "settings", {
	            enumerable: true,
	            configurable: true,
	            writable: true,
	            value: { ...DEFAULT_VOICE }
	        });
	        Object.defineProperty(this, "current", {
	            enumerable: true,
	            configurable: true,
	            writable: true,
	            value: null
	        });
	        Object.defineProperty(this, "state", {
	            enumerable: true,
	            configurable: true,
	            writable: true,
	            value: 'idle'
	        });
	        Object.defineProperty(this, "listeners", {
	            enumerable: true,
	            configurable: true,
	            writable: true,
	            value: new Set()
	        });
	        Object.defineProperty(this, "currentRole", {
	            enumerable: true,
	            configurable: true,
	            writable: true,
	            value: void 0
	        });
	        Object.defineProperty(this, "voicesCache", {
	            enumerable: true,
	            configurable: true,
	            writable: true,
	            value: []
	        });
	        Object.defineProperty(this, "voicesBound", {
	            enumerable: true,
	            configurable: true,
	            writable: true,
	            value: false
	        });
	        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
	            this.synth = window.speechSynthesis;
	            // Chrome 的音色列表是异步加载的
	            this.voicesCache = this.synth.getVoices() || [];
	            if (typeof window.speechSynthesis.addEventListener === 'function') {
	                window.speechSynthesis.addEventListener('voiceschanged', () => {
	                    this.voicesCache = this.synth?.getVoices() || [];
	                });
	            }
	            this.voicesBound = true;
	        }
	    }
	    get supported() { return !!this.synth; }
	    get isSpeaking() { return this.state === 'speaking'; }
	    get paused() { return this.state === 'paused'; }
	    get bound() { return this.voicesBound; }
	    applySettings(s) {
	        this.settings = { ...s };
	    }
	    voices() {
	        if (!this.synth)
	            return [];
	        const v = this.synth.getVoices() || [];
	        if (v.length)
	            this.voicesCache = v;
	        return this.voicesCache;
	    }
	    /** 中文优先的音色列表（含语言标注） */
	    voiceOptions() {
	        return this.voices()
	            .map(v => ({ name: v.name, lang: v.lang, local: !!v.localService }))
	            .sort((a, b) => {
	            const sa = a.lang.startsWith('zh') ? 0 : 1;
	            const sb = b.lang.startsWith('zh') ? 0 : 1;
	            if (sa !== sb)
	                return sa - sb;
	            return a.name.localeCompare(b.name);
	        });
	    }
	    onState(cb) {
	        this.listeners.add(cb);
	        cb(this.state, this.currentRole);
	        return () => this.listeners.delete(cb);
	    }
	    emit() {
	        this.listeners.forEach(f => f(this.state, this.currentRole));
	    }
	    pickVoice(role) {
	        const list = this.voices();
	        if (!list.length)
	            return null;
	        const explicit = this.settings.roleVoices[role];
	        if (explicit) {
	            const hit = list.find(v => v.name === explicit);
	            if (hit)
	                return hit;
	        }
	        const zh = list.filter(v => v.lang && v.lang.toLowerCase().startsWith('zh'));
	        const pool = zh.length ? zh : list;
	        // 角色—性别启发式匹配（不同系统音色命名差异大，做多关键词尝试）
	        const wantFemale = role === 'mira' || role === 'r07';
	        const femaleKeys = ['xiaoxiao', 'xiaoyi', 'female', '女', 'huihui', 'yaoyao', 'tingting', 'meijia', 'samantha', 'zira'];
	        const maleKeys = ['yunxi', 'yunyang', 'male', '男', 'kangkang', 'liang', 'david', 'mark'];
	        const keys = wantFemale ? femaleKeys : maleKeys;
	        const matched = pool.find(v => keys.some(k => v.name.toLowerCase().includes(k)));
	        if (matched)
	            return matched;
	        // 退化为按角色索引取一个，保证不同角色尽量不同音色
	        const order = ['mira', 'system', 'echo', 'narrator', 'r07', 'engel', 'k0'];
	        const idx = Math.max(0, order.indexOf(role));
	        return pool[idx % pool.length] || pool[0];
	    }
	    /** 播放一段语音（会先取消上一段，禁止叠加） */
	    speak(text, role = 'narrator') {
	        if (!this.synth)
	            return false;
	        if (!this.settings.enabled)
	            return false;
	        const clean = String(text || '').replace(/^[「『]|[」』]$/g, '').trim();
	        if (!clean)
	            return false;
	        this.cancelInternal();
	        const u = new SpeechSynthesisUtterance(clean);
	        const voice = this.pickVoice(role);
	        if (voice)
	            u.voice = voice;
	        u.lang = this.settings.lang || (voice && voice.lang) || 'zh-CN';
	        const profile = ROLE_PROFILES[role] || ROLE_PROFILES.narrator;
	        u.rate = Math.min(2, Math.max(0.5, this.settings.rate * profile.rate));
	        u.pitch = Math.min(2, Math.max(0, this.settings.pitch * profile.pitch));
	        u.volume = Math.min(1, Math.max(0, this.settings.volume));
	        u.onstart = () => { this.state = 'speaking'; this.currentRole = role; this.emit(); };
	        u.onend = () => { if (this.current === u) {
	            this.state = 'idle';
	            this.current = null;
	            this.currentRole = undefined;
	            this.emit();
	        } };
	        u.onerror = () => { if (this.current === u) {
	            this.state = 'idle';
	            this.current = null;
	            this.currentRole = undefined;
	            this.emit();
	        } };
	        this.current = u;
	        try {
	            this.synth.speak(u);
	        }
	        catch {
	            this.state = 'idle';
	            this.current = null;
	            this.emit();
	            return false;
	        }
	        return true;
	    }
	    cancelInternal() {
	        if (!this.synth)
	            return;
	        try {
	            this.synth.cancel();
	        }
	        catch { /* ignore */ }
	        this.current = null;
	        if (this.state !== 'idle') {
	            this.state = 'idle';
	        }
	    }
	    /** 是否存在可用的中文音色 */
	    hasChineseVoice() {
	        return this.voices().some(v => (v.lang || '').toLowerCase().startsWith('zh'));
	    }
	    /** 中文音色缺失时的友好提示（正常返回 null） */
	    chineseVoiceHint() {
	        if (!this.synth)
	            return '当前浏览器不支持语音合成——剧情会以文字正常继续。';
	        if (this.voices().length === 0)
	            return '尚未加载到系统音色：首次播放可能没有声音，稍后再试一次即可。';
	        if (!this.hasChineseVoice())
	            return '当前设备没有中文音色，朗读发音可能不准——可在系统里安装中文语音包。';
	        return null;
	    }
	    /** 停止（切换对话/离开页面时调用） */
	    stop() {
	        if (!this.synth)
	            return;
	        this.cancelInternal();
	        this.currentRole = undefined;
	        this.emit();
	    }
	    pause() {
	        if (!this.synth || this.state !== 'speaking')
	            return;
	        try {
	            this.synth.pause();
	            this.state = 'paused';
	            this.emit();
	        }
	        catch { /* ignore */ }
	    }
	    resume() {
	        if (!this.synth || this.state !== 'paused')
	            return;
	        try {
	            this.synth.resume();
	            this.state = 'speaking';
	            this.emit();
	        }
	        catch { /* ignore */ }
	    }
	    /** 角色对应的 speaker kind 映射 */
	    static roleFromKind(kind) {
	        switch (kind) {
	            case 'mira': return 'mira';
	            case 'system': return 'system';
	            case 'echo': return 'echo';
	            case 'r07': return 'r07';
	            case 'engel': return 'engel';
	            case 'k0': return 'k0';
	            default: return 'narrator';
	        }
	    }
	}
	const speech = new SpeechService();
	/** 便捷方法：按 speaker kind 朗读 */
	function speakLine(text, kind) {
	    return speech.speak(text, SpeechService.roleFromKind(kind));
	}

	const CHAPTERS = [
	    {
	        id: 'ch1', order: 1,
	        title: '失落的数据港', area: '语法维修站',
	        serverId: 'syntax',
	        bossId: 'gate-01', currentBossId: 'gate-01',
	        fragmentId: 'frag-01',
	        coreEvent: '恢复数字世界，首次遭遇 K-0',
	        knowledgeFocus: ['print', 'if', 'indent', 'string', 'variable', 'compare', 'for', 'list'],
	        storyEventId: 'chapter-1', doneFlag: 'chapter1Done',
	    },
	    {
	        id: 'ch2', order: 2,
	        title: '破碎的记忆花园', area: '数据日志中心',
	        serverId: 'logs',
	        bossId: 'somnia', currentBossId: 'somnia',
	        fragmentId: 'frag-02',
	        coreEvent: '发现 MIRA 的真实身份',
	        knowledgeFocus: ['if', 'else', 'elif', 'compare', 'logic', 'for', 'return'],
	        storyEventId: 'chapter-2', doneFlag: 'chapter2Done',
	    },
	    {
	        id: 'ch3', order: 3,
	        title: '被遗忘的实验档案', area: '存储数据仓',
	        serverId: 'storage',
	        bossId: 'index-0', currentBossId: 'index-0',
	        fragmentId: 'frag-03',
	        coreEvent: '发现 R 系列实验与 R-07 的身世',
	        knowledgeFocus: ['list', 'for', 'while', 'len', 'indent', 'compare'],
	        storyEventId: 'chapter-3', doneFlag: 'chapter3Done',
	    },
	    {
	        id: 'ch4', order: 4,
	        title: '失控的核心工坊', area: '自动化工厂',
	        serverId: 'factory',
	        bossId: 'judgment-4', currentBossId: 'judgment-4',
	        fragmentId: 'frag-04',
	        coreEvent: '发现恩格尔与 K-0 的矛盾，以及 MIRA 的牺牲',
	        knowledgeFocus: ['def', 'parameter', 'return', 'list', 'compare'],
	        storyEventId: 'chapter-4', doneFlag: 'chapter4Done',
	    },
	    {
	        id: 'ch5', order: 5,
	        title: '黎明崩塌的真相', area: '系统诊断中心',
	        serverId: 'diag',
	        bossId: 'entropy', currentBossId: 'entropy',
	        fragmentId: 'frag-05',
	        coreEvent: '揭露五年前事故与恩格尔的最后愿望',
	        knowledgeFocus: ['dict', 'try', 'logic', 'compare', 'for'],
	        storyEventId: 'chapter-5', doneFlag: 'chapter5Done',
	    },
	    {
	        id: 'ch6', order: 6,
	        title: '起源之外', area: '方舟核心机房',
	        serverId: 'core',
	        bossId: 'k0', currentBossId: 'k0',
	        fragmentId: 'frag-06',
	        coreEvent: '击败 K-0，决定数字世界的未来',
	        knowledgeFocus: ['if', 'return', 'compare', 'logic', 'list', 'dict', 'try', 'while'],
	        storyEventId: 'chapter-6', doneFlag: 'chapter6Done',
	    },
	];
	const chapterById = (id) => CHAPTERS.find(c => c.id === id);
	const chapterByServer = (serverId) => CHAPTERS.find(c => c.serverId === serverId);
	const chapterOfBoss = (bossId) => CHAPTERS.find(c => c.bossId === bossId || c.currentBossId === bossId);

	const SERVERS = [
	    { id: 'training', name: '新人训练终端', codename: 'PRIME-01', x: 300, y: 250, icon: '⌨', chapter: 0, desc: '为新任修复师准备的接驳终端，用于唤醒基础输出回路。', lockedReason: '' },
	    { id: 'syntax', name: '语法维修站', codename: 'SYNTAX-RIG', x: 770, y: 250, icon: '✦', chapter: 1, desc: '第一章：修复语法结构损坏的 5 个日志程序。', lockedReason: '需要先完成新人训练终端的基础接驳任务。' },
	    { id: 'logs', name: '数据日志中心', codename: 'LOG-CORE', x: 960, y: 470, icon: '◈', chapter: 2, desc: '第二章：条件判断与数据分流。', lockedReason: '加密数据区：完成第一章全部 5 个修复任务后可尝试接入。' },
	    { id: 'storage', name: '存储数据仓', codename: 'VAULT-03', x: 640, y: 560, icon: '▤', chapter: 3, desc: '第三章：列表与循环引擎。', lockedReason: '权限不足：需要先修复数据日志中心。' },
	    { id: 'factory', name: '自动化工厂', codename: 'AUTO-FAB', x: 300, y: 500, icon: '⚙', chapter: 4, desc: '第四章：函数与自动化流水线。', lockedReason: '权限不足：需要先修复存储数据仓。' },
	    { id: 'diag', name: '系统诊断中心', codename: 'DIAG-LAB', x: 890, y: 140, icon: '✚', chapter: 5, desc: '第五章：字典与异常处理——事故数据的诊断枢纽。', lockedReason: '权限不足：需要先完成自动化工厂的修复任务。' },
	    { id: 'core', name: '方舟核心机房', codename: 'ARK-CORE', x: 620, y: 120, icon: '◉', chapter: 6, desc: '终章：NEXUS 的心脏，五年前事故的源头。', lockedReason: '最高权限封锁：核心机房数据流已被冻结。' },
	];
	const serverById = (id) => SERVERS.find(s => s.id === id);
	const JUDGE_TUT = { judgeKind: 'stdout', stdoutChecks: [{ name: '终端显示 Hello, world!', contains: ['Hello, world!'] }] };
	const JUDGE_1_1 = { judgeKind: 'stdout', stdoutChecks: [{ name: '终端输出日志标题', contains: ['服务器状态报告'] }] };
	const JUDGE_1_2 = { judgeKind: 'stdout', stdoutChecks: [{ name: '终端输出系统状态消息', contains: ['NEXUS SYSTEM ONLINE'] }] };
	const JUDGE_1_3 = { judgeKind: 'stdout', stdoutChecks: [{ name: '终端输出身份信息', contains: ['R-07'] }] };
	const JUDGE_1_4 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '高温数据被保留', expr: 'filter_alerts([22, 41, 42, 38, 45]) == [41, 42, 45]' },
	        { name: '边界温度 40 属于警报', expr: 'filter_alerts([39, 40, 41]) == [40, 41]' },
	        { name: '全部低于阈值时为空列表', expr: 'filter_alerts([22, 30, 15]) == []' },
	    ],
	};
	const JUDGE_1_5 = { judgeKind: 'stdout', stdoutChecks: [{ name: '依次输出全部记录', lines: ['A', 'B', 'C'] }] };
	function L$8(d, judge) {
	    return { ...d, judge };
	}
	// ---------- 第六章：方舟核心机房（综合编程 / 完整调试 / 多知识点应用） ----------
	const JUDGE_6_1 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [{ name: '心跳序列正确分类', contains: ['ALIVE SILENT ALIVE SILENT'] }],
	};
	const JUDGE_6_2 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '两侧警戒区都被标记', expr: 'validate([30, 95, 50]) == [30, 95]' },
	        { name: '边界值 39/89/91 精确判定', expr: 'validate([39, 89, 91]) == [39, 91]' },
	        { name: '正常区间不误报', expr: 'validate([45, 60]) == []' },
	    ],
	};
	const JUDGE_6_3 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [{ name: '密文被正确转译', contains: ['NEXUS HUMAN'] }],
	};
	const JUDGE_6_4 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '通配位不计入匹配', expr: "count_matches(['A', 'B', 'C'], ['A', '?', 'C']) == 2" },
	        { name: '完全一致', expr: "count_matches(['A', 'B'], ['A', 'B']) == 2" },
	        { name: '全部不符', expr: "count_matches(['A', 'B'], ['X', 'Y']) == 0" },
	    ],
	};
	const JUDGE_6_5 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '正常记录正确分流', expr: "check_cells(['core:80', 'fan:20']) == (['core'], ['fan'])" },
	        { name: '非法数值被隔离', expr: "check_cells(['ghost:NaN']) == ([], ['UNKNOWN'])" },
	        { name: '缺冒号记录被隔离', expr: "check_cells(['bad']) == ([], ['MALFORMED'])" },
	    ],
	};
	function L6(d, judge) {
	    return { ...d, judge };
	}
	const CHAPTER6_LEVELS = [
	    L6({
	        id: '6-1', serverId: 'core', order: 1,
	        title: '心跳协议', codename: 'ARK-01',
	        fault: '方舟心跳协议把静默区间误判为在线——回波判定逻辑写反，停机状态被视为存活。',
	        faultLog: '[ARK-CORE] HEARTBEAT MISREAD — seq==0 区间被标记为 ALIVE。',
	        goal: '修复心跳判定：seq 为 0 表示静默（SILENT），非 0 表示在线（ALIVE）。',
	        behavior: '交换 if/else 两分支的返回值（seq == 0 时返回 SILENT）。',
	        initialCode: 'def check_heartbeat(seq):\n    if seq == 0:\n        return "ALIVE"\n    else:\n        return "SILENT"\n\ndef report(seqs):\n    result = ""\n    for s in seqs:\n        result = result + check_heartbeat(s) + " "\n    return result\n\nprint(report([1, 0, 1, 0]))',
	        knowledge: ['if', 'return', 'compare'],
	        hints: [
	            '静默区间被打上了 ALIVE 标记——心跳判定的两个分支返回值对调了。',
	            'seq == 0 意味着没有心跳信号，应该返回 SILENT；seq != 0 才是 ALIVE。',
	            '把 if seq == 0: 下面的 return "ALIVE" 改成 "SILENT"，else 分支的 return 改成 "ALIVE"（两处对调）。',
	        ],
	        summary: '最终关的第一课：把判定条件读清楚再写返回值。分支反了程序照样运行，但语义全错——这正是调试需要"走读代码"的原因。',
	        rewardExp: 120,
	        varsNote: [
	            { name: 'check_heartbeat', desc: '心跳判定：0 → SILENT，非 0 → ALIVE。' },
	            { name: 'report', desc: '把每条心跳结果拼接成报告文本。' },
	            { name: 'seqs', desc: '心跳序列，如 [1, 0, 1, 0]。' },
	        ],
	    }, JUDGE_6_1),
	    L6({
	        id: '6-2', serverId: 'core', order: 2,
	        title: '数据校检', codename: 'ARK-02',
	        fault: '数据校检只拦截了低压警戒区，高压侧的信道全部漏检——警戒判定缺少另一半条件。',
	        faultLog: '[ARK-CORE] VALIDATION GAP — 高压侧（> 90）未纳入警戒条件。',
	        goal: '修复 validate：把低于 40 或高于 90 的载体全部标记出来。',
	        behavior: '把条件补全为 c < 40 or c > 90（复合条件，用 or 连接两侧警戒区）。',
	        initialCode: 'def validate(carriers):\n    bad = []\n    for c in carriers:\n        if c < 40:\n            bad.append(c)\n    return bad',
	        knowledge: ['logic', 'list', 'for', 'compare'],
	        hints: [
	            '只有低压侧被拦截，高压侧的信道数据还在自由流动。',
	            '警戒区有两个：低于 40 或高于 90。当前条件只管了左边。',
	            '把 if c < 40: 补成 if c < 40 or c > 90:——两侧警戒区都标记。',
	        ],
	        summary: '真实世界的校验条件往往由多个区间组成。漏写一边不是语法错误，而是需求理解的缺口——先读需求，再写条件。',
	        rewardExp: 120,
	        varsNote: [
	            { name: 'validate', desc: '校检函数：返回所有警戒区内的载体。' },
	            { name: 'carriers', desc: '载体数据列表。' },
	            { name: 'bad', desc: '警戒载体集合。' },
	        ],
	    }, JUDGE_6_2),
	    L6({
	        id: '6-3', serverId: 'core', order: 3,
	        title: '密文解析', codename: 'ARK-03',
	        fault: '密文解析只输出了最后一个符号的译文——拼接时覆盖了累积结果，前面的译文全部丢失。',
	        faultLog: '[ARK-CORE] DECODE TRUNCATED — 结果被每次覆盖而非累积拼接。',
	        goal: '修复 decode，让符号序列完整转译成 NEXUS HUMAN。',
	        behavior: '把 result = table[s] + " " 改成 result = result + table[s] + " "（累积拼接）。',
	        initialCode: 'def decode(symbols):\n    table = {"A": "NEXUS", "B": "ECHO", "C": "HUMAN"}\n    result = ""\n    for s in symbols:\n        result = table[s] + " "\n    return result\n\nprint(decode(["A", "C"]))',
	        knowledge: ['dict', 'string', 'for'],
	        hints: [
	            '只输出了最后一条译文。循环里每次都在"重新开始"而不是"继续追加"。',
	            '累积拼接的模式是：结果 = 结果 + 新内容。当前写法把 result 丢在了等号右边。',
	            '把 result = table[s] + " " 改成 result = result + table[s] + " "。',
	        ],
	        summary: '在循环里累积结果（result = result + 新内容）是基础而重要的模式；写成覆盖（result = 新内容）程序不报错，但数据只剩最后一步。',
	        rewardExp: 130,
	        varsNote: [
	            { name: 'decode', desc: '密文转译函数：符号 → 译文拼接。' },
	            { name: 'table', desc: '符号对照字典。' },
	            { name: 'result', desc: '累积的译文结果。' },
	        ],
	    }, JUDGE_6_3),
	    L6({
	        id: '6-4', serverId: 'core', order: 4,
	        title: '序列比对', codename: 'ARK-04',
	        fault: '序列比对把丢失位也当成了匹配——通配符 ? 表示该位数据不确定，却被计入了匹配数。',
	        faultLog: '[ARK-CORE] MATCH INFLATED — ? 通配位被错误计入匹配计数。',
	        goal: '修复 count_matches：只有确定相等的位才计数，? 表示不确定、不计入匹配。',
	        behavior: '去掉条件里的 or actual[i] == "?"，只保留确定相等才计数。',
	        initialCode: 'def count_matches(expect, actual):\n    count = 0\n    i = 0\n    while i < len(expect):\n        if actual[i] == "?" or actual[i] == expect[i]:\n            count = count + 1\n        i = i + 1\n    return count',
	        knowledge: ['while', 'list', 'logic', 'compare'],
	        hints: [
	            '匹配数偏大——列为"不确定"的位也被算成了匹配。',
	            '? 表示该位数据在读回时丢失了，不能视为匹配成功。',
	            '把条件里的 or actual[i] == "?" 删掉：只有 actual[i] == expect[i] 时才计数。',
	        ],
	        summary: 'while + 索引遍历时，条件的边角分支（通配、默认值、异常值）决定了结果精度。删掉错误的"或"分支，统计口径才正确。',
	        rewardExp: 140,
	        varsNote: [
	            { name: 'count_matches', desc: '比对函数：返回确定匹配的位数。' },
	            { name: 'expect', desc: '期望序列。' },
	            { name: 'actual', desc: '实际读回序列，? 表示该位不确定。' },
	            { name: 'i', desc: '索引游标。' },
	        ],
	    }, JUDGE_6_4),
	    L6({
	        id: '6-5', serverId: 'core', order: 5,
	        title: '方舟重启', codename: 'ARK-05',
	        fault: '方舟重启协议在读到一条损坏记录时整体崩溃——坏数据没有被隔离，整个核心的检查链路瘫痪。',
	        faultLog: '[ARK-CORE] BOOT ABORTED — 单条损坏记录（ghost:NaN）导致全量检查中断。',
	        goal: '修复 check_cells：正常记录按阈值分流（≥60 入 ok），坏数据隔离为 UNKNOWN（非法数值）或 MALFORMED（缺冒号），不中断。',
	        behavior: '用 try/except ValueError / IndexError 隔离坏记录（split(":") 解析文本）。',
	        initialCode: 'def parse_cell(raw):\n    parts = raw.split(":")\n    return parts[0], int(parts[1])\n\ndef check_cells(cells):\n    ok = []\n    fail = []\n    for raw in cells:\n        name, value = parse_cell(raw)\n        if value >= 60:\n            ok.append(name)\n        else:\n            fail.append(name)\n    return ok, fail\n\nprint(check_cells(["core:80", "fan:20", "ghost:NaN"]))',
	        knowledge: ['try', 'dict', 'list', 'return'],
	        hints: [
	            '一条 ghost:NaN 就让整个重启协议崩溃了。检查函数解析的是文本，可能遇到两种坏格式。',
	            'parse_cell 可能抛 ValueError（int 转换失败）或 IndexError（缺冒号时 parts[1] 不存在）。',
	            '在循环里用 try: 包裹解析，except ValueError: 记为 UNKNOWN，except IndexError: 记为 MALFORMED——都用 fail.append 隔离。',
	        ],
	        summary: '终章之作：先 split 解析再逐条隔离异常——数据库、协议、生产系统面对脏数据的唯一正确姿势。至此，五章所学全部集成。',
	        rewardExp: 160,
	        varsNote: [
	            { name: 'parse_cell', desc: '解析记录："名称:数值" → (名称, 数值)。' },
	            { name: 'check_cells', desc: '整表检查：分流 ok/fail，坏数据隔离。' },
	            { name: 'ok / fail', desc: '合格与不合格记录集合。' },
	        ],
	    }, JUDGE_6_5),
	];
	// ---------- 第五章：系统诊断中心（字典、异常处理、复合逻辑） ----------
	const JUDGE_5_1 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [{ name: '已知设备正常输出，未知设备返回占位', lines: ['S-01', 'UNKNOWN'] }],
	};
	const JUDGE_5_2 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '正常数字解析', expr: "parse_count('12') == 12" },
	        { name: '非法内容返回 0 不崩溃', expr: "parse_count('abc') == 0" },
	        { name: '其他数字正常解析', expr: "parse_count('7') == 7" },
	    ],
	};
	const JUDGE_5_3 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '紧急模式且温度超限→报警', expr: 'should_alert(95, 100, True) == True' },
	        { name: '紧急模式且压力超限→报警', expr: 'should_alert(70, 130, True) == True' },
	        { name: '非紧急模式温度超限→不报警', expr: 'should_alert(95, 100, False) == False' },
	        { name: '非紧急模式压力超限→不报警', expr: 'should_alert(70, 130, False) == False' },
	    ],
	};
	const JUDGE_5_4 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '全部数值按倍率转换', expr: "convert({'temp': 30, 'pressure': 10}, 3) == {'temp': 90, 'pressure': 30}" },
	        { name: '倍率为 1 时不变', expr: "convert({'fan': 50}, 1) == {'fan': 50}" },
	        { name: '倍率为 0 时归零', expr: "convert({'relay': 5}, 0) == {'relay': 0}" },
	    ],
	};
	const JUDGE_5_5 = {
	    judgeKind: 'python',
	    // 说明：不同 Python 实现的字典遍历顺序可能不同，故按排序后的结果比较（内容正确即可）
	    pythonChecks: [
	        { name: '正常记录正确分级', expr: "sorted(diagnose({'core': 95, 'fan': 50})) == sorted(['core: HIGH', 'fan: OK'])" },
	        { name: '低值与非法值不崩溃', expr: "sorted(diagnose({'idle': 5, 'ghost': 'NaN'})) == sorted(['idle: LOW', 'ghost: ERR'])" },
	    ],
	};
	function L5(d, judge) {
	    return { ...d, judge };
	}
	const CHAPTER5_LEVELS = [
	    L5({
	        id: '5-1', serverId: 'diag', order: 1,
	        title: '丢失的键值', codename: 'DIAG-01',
	        fault: '诊断系统读取设备编号时崩溃——某个设备不存在于记录表中，直接按键访问触发了 KeyError。',
	        faultLog: "[DIAG-LAB] EXCEPTION: KeyError — 'valve'。设备登记表缺少该键。",
	        goal: '修复记录读取，让存在的设备输出编号、不存在的设备输出 UNKNOWN（不崩溃）。',
	        behavior: '用 get() 方法读取：records.get(name, "UNKNOWN")，键缺失时返回默认值。',
	        initialCode: 'def get_code(records, name):\n    return records[name]\n\nrecords = {"sensor": "S-01", "relay": "R-02"}\nprint(get_code(records, "sensor"))\nprint(get_code(records, "valve"))',
	        knowledge: ['dict', 'return'],
	        hints: [
	            '程序在第二次读取时崩溃：valve 这台设备没有登记在字典里。',
	            '字典用中括号直接取键会抛 KeyError；get() 方法可以在键缺失时返回你指定的默认值。',
	            '把 return records[name] 改成 return records.get(name, "UNKNOWN")——键不存在时返回 UNKNOWN。',
	        ],
	        summary: '字典是键值对集合：records["sensor"] 取键对应的值；键不存在会抛 KeyError。records.get(键, 默认值) 则安全返回默认值，是防御性读取的标准写法。',
	        rewardExp: 90,
	        varsNote: [
	            { name: 'records', desc: '设备登记字典：{"sensor": "S-01", "relay": "R-02"}。' },
	            { name: 'get_code', desc: '读取函数：按设备名返回编号。' },
	        ],
	    }, JUDGE_5_1),
	    L5({
	        id: '5-2', serverId: 'diag', order: 2,
	        title: '失血的内存', codename: 'DIAG-02',
	        fault: '内存读数解析器遇到非数字内容时直接崩溃——转换失败没有被捕获，业务链路断在解析这一环。',
	        faultLog: '[DIAG-LAB] EXCEPTION: ValueError — invalid literal for int()。解析未受保护。',
	        goal: '让 parse_count 在内容不是数字时返回 0，而不是抛异常崩溃。',
	        behavior: '用 try/except 捕获 ValueError：解析失败时返回 0。',
	        initialCode: 'def parse_count(text):\n    return int(text)\n\nprint(parse_count("12"))\nprint(parse_count("abc"))',
	        knowledge: ['try', 'dict'],
	        hints: [
	            '第二次调用时崩溃：int("abc") 无法转换。程序希望坏数据也能被"兜住"。',
	            'Python 用 try / except 结构捕获并处理异常，让程序继续运行。',
	            '把函数体改成：try: return int(text) 然后 except ValueError: return 0——转换失败时返回 0。',
	        ],
	        summary: 'try/except 是异常处理结构：try 块里出错的语句会被 except 捕获，程序不会崩溃。int(text) 对非数字抛 ValueError，用 except ValueError 精确捕获它。',
	        rewardExp: 100,
	        varsNote: [
	            { name: 'parse_count', desc: '解析函数：把文本转换成整数，失败返回 0。' },
	            { name: 'text', desc: '待解析的文本读数。' },
	        ],
	    }, JUDGE_5_2),
	    L5({
	        id: '5-3', serverId: 'diag', order: 3,
	        title: '复合的判断', codename: 'DIAG-03',
	        fault: '报警逻辑在"非紧急模式"下依然触发——复合条件缺少括号，or 把不该报警的场景放行了。',
	        faultLog: '[DIAG-LAB] FALSE ALARM — and 优先于 or，复合条件缺括号导致优先级错位。',
	        goal: '修复报警判定：只有紧急模式（critical）且温度或压力任一超限时才报警。',
	        behavior: '给温度/压力条件加上括号：critical and (temp > 80 or pressure > 120)。',
	        initialCode: 'def should_alert(temp, pressure, critical):\n    if critical and temp > 80 or pressure > 120:\n        return True\n    return False',
	        knowledge: ['logic', 'compare'],
	        hints: [
	            '非紧急模式下压力超限也报警了——想想 and 和 or 谁先运算。',
	            'Python 里 not > and > or：critical and temp > 80 or pressure > 120 实际是 (critical and temp > 80) or (pressure > 120)。',
	            '给或条件加括号：if critical and (temp > 80 or pressure > 120):——表达真正的意图：「紧急模式 且（温度或压力任一超限）」。',
	        ],
	        summary: '复合逻辑的优先级：not > and > or。想要"先或后与"必须用括号。不带括号的复合条件常产生静默的逻辑错误，测试组合输入是发现它的关键。',
	        rewardExp: 100,
	        varsNote: [
	            { name: 'should_alert', desc: '报警判定函数：(温度, 压力, 是否紧急模式)。' },
	            { name: 'critical', desc: '紧急模式开关。' },
	        ],
	    }, JUDGE_5_3),
	    L5({
	        id: '5-4', serverId: 'diag', order: 4,
	        title: '转译的记录', codename: 'DIAG-04',
	        fault: '数值转译把读数变成了一串重复的文本——转换时用错了字典的值，把键当成了值。',
	        faultLog: '[DIAG-LAB] TRANSLATION CORRUPTED — 使用 key 而非 records[key] 参与计算。',
	        goal: '修复 convert，让字典里每个数值按倍率正确转换。',
	        behavior: '把 records[key] = key * factor 改成 records[key] = records[key] * factor（读取值再计算）。',
	        initialCode: 'def convert(records, factor):\n    for key in records:\n        records[key] = key * factor\n    return records',
	        knowledge: ['dict', 'for'],
	        hints: [
	            '转换结果变成了一串重复的字母——字符串被"乘以"了数字。',
	            '遍历字典时 key 是键（比如 "temp"），要拿它对应的值必须写 records[key]。',
	            '把 records[key] = key * factor 改成 records[key] = records[key] * factor——先取值，再乘倍率，写回。',
	        ],
	        summary: '遍历字典 for key in records 拿到的是键；取值用 records[key]，改值用 records[key] = 新值。把键当值参与运算不会报错，但会产生难以察觉的错误数据。',
	        rewardExp: 110,
	        varsNote: [
	            { name: 'convert', desc: '转译函数：把字典里每个数值乘以倍率并写回。' },
	            { name: 'records', desc: '读数字典，如 {"temp": 30, "pressure": 10}。' },
	            { name: 'factor', desc: '转换倍率。' },
	        ],
	    }, JUDGE_5_4),
	    L5({
	        id: '5-5', serverId: 'diag', order: 5,
	        title: '综合诊断', codename: 'DIAG-05',
	        fault: '诊断中心无法处理损坏的数据记录——记录里混入非法字符后整个诊断程序崩溃，系统性瘫痪。',
	        faultLog: '[DIAG-LAB] SYSTEMATIC CRASH — 单条坏数据导致全表诊断中断。需要异常隔离。',
	        goal: '修复 diagnose：正常读数 > 80 标 HIGH、< 20 标 LOW、其余 OK；非法内容标 ERR 且不中断。',
	        behavior: '逐条用 try/except 包裹转换与比较：int(value) 失败时输出 ERR 并继续。',
	        initialCode: 'def diagnose(records):\n    result = []\n    for name, value in records.items():\n        if value > 80:\n            result.append(name + ": HIGH")\n        elif value < 20:\n            result.append(name + ": LOW")\n        else:\n            result.append(name + ": OK")\n    return result',
	        knowledge: ['dict', 'try', 'logic'],
	        hints: [
	            '整张表因为一条坏数据崩溃了。看看记录值可能是什么类型。',
	            '把每条记录都放进 try 块：能 int(value) 就分级，不能就输出 ERR。',
	            '用 items() 遍历键值对；在循环体里加 try: int(value) 比较分级，except ValueError: result.append(name + ": ERR")。',
	        ],
	        summary: '真实数据总是混着坏数据。防御式写法：items() 遍历字典，int(value) 统一转数字，try/except 把非法条目隔离成 ERR——一条坏数据不再拖垮整个系统。',
	        rewardExp: 130,
	        varsNote: [
	            { name: 'diagnose', desc: '诊断函数：遍历字典分级（HIGH/LOW/OK/ERR）。' },
	            { name: 'records', desc: '记录字典，值可能是数字或非法文本。' },
	            { name: 'result', desc: '分级结果列表。' },
	        ],
	    }, JUDGE_5_5),
	];
	// ---------- 第四章：自动化工厂（函数、参数、返回值） ----------
	const JUDGE_4_1 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [{ name: '装配结果正确输出', contains: ['CORE ASSEMBLED POWER ON'] }],
	};
	const JUDGE_4_2 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [
	        { name: '输出装配产物编号', contains: ['FOO-BUILT'] },
	        { name: '不输出 None', notContains: ['None'] },
	    ],
	};
	const JUDGE_4_3 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [{ name: '工单内容正确', contains: ['SILICON -> LINE B'] }],
	};
	const JUDGE_4_4 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [
	        { name: '温度未达标时等待冷却', contains: ['WAIT FOR COOLING'] },
	        { name: '不错误启动产线', notContains: ['START PRODUCTION'] },
	    ],
	};
	const JUDGE_4_5 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '总装输出格式正确', expr: "assemble('SERVER', ['CPU', 'RAM']) == 'SERVER contains: CPU, RAM'" },
	        { name: '单件商品也能总装', expr: "assemble('NODE', ['CHIP']) == 'NODE contains: CHIP'" },
	    ],
	};
	function L4(d, judge) {
	    return { ...d, judge };
	}
	const CHAPTER4_LEVELS = [
	    L4({
	        id: '4-1', serverId: 'factory', order: 1,
	        title: '失灵的装配', codename: 'FA-01',
	        fault: '装配线的控制程序无法启动——函数定义的关键字被错误拼写，Python 无法识别这条指令。',
	        faultLog: '[AUTO-FAB] EXCEPTION: SyntaxError — invalid syntax (daf assemble(part):)。装配指令无法解析。',
	        goal: '修复函数定义，让程序输出 CORE ASSEMBLED POWER ON。',
	        behavior: '把错误拼写的 daf 改成 def（定义函数的关键字）。',
	        initialCode: 'daf assemble(part):\n    return part + " ASSEMBLED"\n\ndef power_on(unit):\n    print(unit + " POWER ON")\n\npower_on(assemble("CORE"))',
	        knowledge: ['return', 'parameter'],
	        hints: [
	            '报错指向函数定义第一行附近。Python 用来定义函数的关键字是什么？',
	            '定义函数用 def，后面跟函数名、圆括号参数列表和英文冒号。',
	            '把第 1 行的 daf 改成 def：daf 不是 Python 的关键字，所以解析器在冒号处报错。',
	        ],
	        summary: '函数用 def 定义：def 函数名(参数): 后跟缩进的函数体。函数只有被调用时才会执行；名字拼错会被当成普通标识符并引发语法错误。',
	        rewardExp: 70,
	        varsNote: [
	            { name: 'assemble', desc: '装配函数：给零件编号追加 " ASSEMBLED" 后缀并返回。' },
	            { name: 'power_on', desc: '开机函数：输出整机名称与 " POWER ON"。' },
	        ],
	    }, JUDGE_4_1),
	    L4({
	        id: '4-2', serverId: 'factory', order: 2,
	        title: '空转的产线', codename: 'FA-02',
	        fault: '产线"空转"：装配结果没有交还给调用方，输出的编号变成了 None。',
	        faultLog: '[AUTO-FAB] PRODUCT ID = None — 函数缺少返回值，结果未回传产线。',
	        goal: '修复 build 函数，让调用方拿到装配产物编号 FOO-BUILT 并正确输出。',
	        behavior: '在 build 函数末尾添加 return result（把结果交还给调用者）。',
	        initialCode: 'def build(code):\n    result = code + "-BUILT"\n\npart = build("FOO")\nprint(part)',
	        knowledge: ['return', 'parameter'],
	        hints: [
	            '输出的是 None——说明函数没有把任何值交还给调用方。',
	            '函数把结果交给调用者靠 return 语句；没有 return 的函数默认返回 None。',
	            '在 build 函数体的最后（result 那一行之下，保持 4 空格缩进）添加：return result',
	        ],
	        summary: '函数的「产出」通过 return 交还给调用者；漏写 return 时函数返回 None。这是"函数能用但结果永远是 None"的经典故障。',
	        rewardExp: 80,
	        varsNote: [
	            { name: 'build', desc: '装配函数：期望返回 code + "-BUILT"。' },
	            { name: 'result', desc: '装配产物编号，需要被 return 出去。' },
	            { name: 'part', desc: '接收 build 返回值的变量。' },
	        ],
	    }, JUDGE_4_2),
	    L4({
	        id: '4-3', serverId: 'factory', order: 3,
	        title: '乱序的工单', codename: 'FA-03',
	        fault: '工单调度把「产线」和「产品」两个参数填反了——程序没有报错，但每一张工单都被配到了错误的产线。',
	        faultLog: '[AUTO-FAB] ORDER MISROUTED — 调用时位置参数顺序与定义不符。',
	        goal: '修复调用语句，让输出显示 SILICON -> LINE B。',
	        behavior: '把 schedule("SILICON", "B") 改成 schedule("B", "SILICON")——第一个参数是产线编号。',
	        initialCode: 'def schedule(line, product):\n    return product + " -> LINE " + line\n\norder = schedule("SILICON", "B")\nprint(order)',
	        knowledge: ['parameter', 'return'],
	        hints: [
	            '输出里产品和产线对调了——看看调用时传参的顺序。',
	            '位置参数按顺序绑定：调用函数时，第一个实参会传给定义时的第一个形参（这里是 line）。',
	            '把第 5 行 schedule("SILICON", "B") 改成 schedule("B", "SILICON")：先传产线，再传产品。',
	        ],
	        summary: '位置参数严格按顺序传递。参数顺序写反不会报错，只会静默产生错误结果——比报错更难发现，调试时先检查调用处。',
	        rewardExp: 90,
	        varsNote: [
	            { name: 'schedule', desc: '排产函数：参数为 (产线 line, 产品 product)。' },
	            { name: 'order', desc: '接收排产结果的变量。' },
	        ],
	    }, JUDGE_4_3),
	    L4({
	        id: '4-4', serverId: 'factory', order: 4,
	        title: '换岗的工位', codename: 'FA-04',
	        fault: '产线在 95 度高温下仍然开工——安全判断里写的不是函数的「结果」，而是函数「本身」，永远为真。',
	        faultLog: '[AUTO-FAB] THERMAL BYPASS — 条件判断引用了函数对象而非调用结果。',
	        goal: '修复安全判断，让温度 95 时输出 WAIT FOR COOLING（等待冷却）。',
	        behavior: '把判断条件里的 is_ready 改成 is_ready(95)（调用函数，而不是引用函数名）。',
	        initialCode: 'def is_ready(temperature):\n    if temperature <= 80:\n        return True\n    return False\n\nif is_ready:\n    print("START PRODUCTION")\nelse:\n    print("WAIT FOR COOLING")',
	        knowledge: ['parameter', 'return', 'compare'],
	        hints: [
	            '95 度不该开工，但产线还是启动了。问题出在 if 条件里写的内容。',
	            '函数名加括号才是"调用"，会执行函数体并得到返回值；只写函数名拿到的是函数对象（作为条件永远为真）。',
	            '把 if is_ready: 改成 if is_ready(95):——调用它，并用返回值（True/False）做判断。',
	        ],
	        summary: '定义函数不等于调用函数。is_ready 是函数对象（恒为真值），is_ready(95) 才是它的计算结果。这类"忘写括号"的 bug 不报错，但逻辑永远不对。',
	        rewardExp: 100,
	        varsNote: [
	            { name: 'is_ready', desc: '就绪判定函数：温度 ≤ 80 返回 True。' },
	            { name: 'temperature', desc: '温度参数。' },
	        ],
	    }, JUDGE_4_4),
	    L4({
	        id: '4-5', serverId: 'factory', order: 5,
	        title: '总装线', codename: 'FA-05',
	        fault: '总装线把清单合并成文本时崩溃——join 方法被用反了，字符串方法与列表方法放错了位置。',
	        faultLog: '[AUTO-FAB] EXCEPTION: AttributeError — list object has no attribute join。总装指令中断。',
	        goal: '修复 assemble 函数，让它把零件清单合并成 "SERVER contains: CPU, RAM" 这样的文本。',
	        behavior: '把 parts.join(", ") 改成 ", ".join(parts)——join 是字符串的方法。',
	        initialCode: 'def add_part(part, parts):\n    parts.append(part)\n\ndef assemble(product, parts):\n    return product + " contains: " + parts.join(", ")\n\nparts = []\nadd_part("CPU", parts)\nadd_part("RAM", parts)\nprint(assemble("SERVER", parts))',
	        knowledge: ['list', 'parameter', 'return'],
	        hints: [
	            '报错发生在 assemble 内部——它想把零件清单合并成一段文本。',
	            '把列表元素连接成字符串，用的是字符串的 join 方法：格式是 "分隔符".join(列表)。',
	            '把 parts.join(", ") 改成 ", ".join(parts)：写法是分隔符在前，列表在括号里。',
	        ],
	        summary: '", ".join(零件列表) 会把列表元素用 ", " 连接成一个字符串。join 定义在字符串上，不是列表上；函数之间通过参数传值、return 回传，组成流水线。',
	        rewardExp: 110,
	        varsNote: [
	            { name: 'add_part', desc: '上料函数：把零件加入清单（列表是可变对象，无需返回）。' },
	            { name: 'assemble', desc: '总装函数：返回 "产品 contains: 零件清单" 文本。' },
	            { name: 'parts', desc: '零件清单，由 add_part 逐件添加。' },
	        ],
	    }, JUDGE_4_5),
	];
	// ---------- 第三章：存储数据仓（列表、索引、for/while、列表操作） ----------
	const JUDGE_3_1 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [{ name: '按顺序输出全部货品', lines: ['A', 'B', 'C'] }],
	};
	const JUDGE_3_2 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '所有货号入库', expr: "store(['P-01', 'P-02', 'P-03']) == ['P-01', 'P-02', 'P-03']" },
	        { name: '空清单返回空列表', expr: 'store([]) == []' },
	        { name: '单个货号正常入库', expr: "store(['X']) == ['X']" },
	    ],
	};
	const JUDGE_3_3 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [{ name: '输出全部四件货品', lines: ['O-1', 'O-2', 'O-3', 'O-4'] }],
	};
	const JUDGE_3_4 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '命中库存返回 True', expr: "check_inventory('P-02', ['P-01', 'P-02', 'P-03']) == True" },
	        { name: '缺货返回 False', expr: "check_inventory('Q-9', ['P-01', 'P-02']) == False" },
	        { name: '空库存返回 False', expr: "check_inventory('A-1', []) == False" },
	    ],
	};
	const JUDGE_3_5 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '按长度正确分类', expr: "categorize(['A-1', 'STORAGE', 'B-2']) == (['STORAGE'], ['A-1', 'B-2'])" },
	        { name: '空清单分类', expr: 'categorize([]) == ([], [])' },
	        { name: '单件货品归轻量区', expr: "categorize(['X']) == ([], ['X'])" },
	    ],
	};
	function L3(d, judge) {
	    return { ...d, judge };
	}
	const CHAPTER3_LEVELS = [
	    L3({
	        id: '3-1', serverId: 'storage', order: 1,
	        title: '空仓的货架', codename: 'VAULT-01',
	        fault: '仓管程序读取货架清单时崩溃——它访问了一个不存在的货位，越过了列表的边界。',
	        faultLog: '[VAULT-03] EXCEPTION: IndexError — list index out of range (items[3])。取货指令崩溃。',
	        goal: '修复索引访问，让程序按顺序输出 A、B、C 三件货品。',
	        behavior: '把 items[3] 改成 items[0]（并调整前两行），记住列表索引起始是 0。',
	        initialCode: 'items = ["A", "B", "C"]\n\nprint(items[1])\nprint(items[2])\nprint(items[3])',
	        knowledge: ['list', 'for'],
	        hints: [
	            '程序报 IndexError——它访问的下标超出了列表的边界。数一数 items 里有几个元素、下标分别是什么。',
	            'Python 列表的索引从 0 开始：items[0] 是第一件，items[1] 是第二件……最后一个元素的下标是长度减 1。',
	            '把第 4 行的 items[3] 改成 items[0]，同时把前两行改成 items[1]、items[2]——输出顺序就会是 A、B、C。',
	        ],
	        summary: '列表索引从 0 开始。第 n 件货品是 items[n-1]；访问下标 >= len(items) 会抛 IndexError。len(列表) 获取元素个数。',
	        rewardExp: 80,
	        varsNote: [
	            { name: 'items', desc: '货品清单列表，含 "A"、"B"、"C" 三件。' },
	        ],
	    }, JUDGE_3_1),
	    L3({
	        id: '3-2', serverId: 'storage', order: 2,
	        title: '错位的取货', codename: 'VAULT-02',
	        fault: '入库记录只保存了最后一件货品——append 指令被放在了循环外面，前面两件入库记录全部丢失。',
	        faultLog: '[VAULT-03] STOCK COUNT = 1 — 入库指令疑似脱离循环体。请检查缩进。',
	        goal: '修复入库指令，让 store 函数把每一件货品都加入列表并返回完整清单。',
	        behavior: '把 items.append(code) 移入 for 循环体（缩进 4 个空格）。',
	        initialCode: 'def store(codes):\n    items = []\n    for code in codes:\n        items.append(code)\n    return items',
	        knowledge: ['list', 'for', 'indent'],
	        hints: [
	            '只入库了最后一件。append 的缩进位置决定了它执行几次。',
	            '循环体 = for 下方缩进的代码，会为每个元素执行一次。目前 append 缩进在循环外，只执行了一次。',
	            '把 items.append(code) 这一行缩进 4 个空格，让它成为 for code in codes: 的循环体。',
	        ],
	        summary: 'append 在循环内＝每个元素都入库；在循环外＝只在循环结束后执行一次。缩进不仅决定层级，还决定代码"执行几次"。',
	        rewardExp: 90,
	        varsNote: [
	            { name: 'store', desc: '入库函数：传入货号列表，返回完整入库清单。' },
	            { name: 'items', desc: '入库清单，用 append 逐个追加。' },
	            { name: 'code', desc: '循环变量：逐件货号。' },
	        ],
	    }, JUDGE_3_2),
	    L3({
	        id: '3-3', serverId: 'storage', order: 3,
	        title: '沉底的货品', codename: 'VAULT-03',
	        fault: '盘点程序只输出前三件货品——while 循环的上限被写死了，第四件货品永远排不上号。',
	        faultLog: '[VAULT-03] COUNT MISSING ITEM — 循环边界为硬编码 3，与货架实际长度脱节。',
	        goal: '修复 while 循环边界，让程序输出全部四件货品（O-1 到 O-4）。',
	        behavior: '把 while count < 3: 改成 while count < len(items):（或等价写法）。',
	        initialCode: 'count = 0\nitems = ["O-1", "O-2", "O-3", "O-4"]\n\nwhile count < 3:\n    print(items[count])\n    count = count + 1',
	        knowledge: ['while', 'list'],
	        hints: [
	            '输出到 O-3 就停了，第四件货品没被读到。循环的条件是罪魁祸首。',
	            'while 循环还有一个隐藏问题：如果货架再加一件货，这个程序又会漏掉。有什么方法能动态知道货架长度？',
	            '用 len(items) 代替写死的 3：把 while count < 3: 改成 while count < len(items):，货架无论多长都能完整盘点。',
	        ],
	        summary: 'while 循环在条件为真时持续执行。用 len(列表) 作为边界，代码就能适应数据变化；硬编码数字是隐蔽 bug 的温床。',
	        rewardExp: 90,
	        varsNote: [
	            { name: 'count', desc: '循环计数器，从 0 开始递增。' },
	            { name: 'items', desc: '货品清单，共 4 件（O-1 ~ O-4）。' },
	        ],
	    }, JUDGE_3_3),
	    L3({
	        id: '3-4', serverId: 'storage', order: 4,
	        title: '移库的校验', codename: 'VAULT-04',
	        fault: '移库校验系统永远提示缺货——它把目标货品和整个货架清单做比较，而不是逐件比对。',
	        faultLog: '[VAULT-03] INVENTORY CHECK ALWAYS FALSE — 比较对象错位：target 与整张清单比较。',
	        goal: '修复比较对象，让 check_inventory 在货品存在于清单中时返回 True。',
	        behavior: '把 if target == stock: 改成 if item == target:（循环里逐件比较）。',
	        initialCode: 'def check_inventory(target, stock):\n    for item in stock:\n        if target == stock:\n            return True\n    return False',
	        knowledge: ['for', 'compare', 'list'],
	        hints: [
	            '清单里明明有目标货品，却永远返回 False。问题出在循环内部的比较上。',
	            'for item in stock 会依次取出 stock 的每个元素。这个循环里，item 和 stock 分别是什么？',
	            '把 if target == stock: 改成 if item == target:——逐件比较，而不是拿目标跟整张清单比较。',
	        ],
	        summary: '遍历列表时，循环变量才是"当前这一件"。拿它和整个列表比较永远不成立（除非比较对象本身就是列表）。',
	        rewardExp: 100,
	        varsNote: [
	            { name: 'check_inventory', desc: '库存校验函数：目标货品在清单中返回 True，否则 False。' },
	            { name: 'target', desc: '要查找的目标货品编号。' },
	            { name: 'stock', desc: '库存清单（列表）。' },
	            { name: 'item', desc: '循环变量：当前这一件货品。' },
	        ],
	    }, JUDGE_3_4),
	    L3({
	        id: '3-5', serverId: 'storage', order: 5,
	        title: '清点成册', codename: 'VAULT-05',
	        fault: '分类清点程序把所有货品都堆进了重载区——else 分支的入库目标写错了，轻量货品全部被重载登记。',
	        faultLog: '[VAULT-03] CLASSIFICATION FLATTENED — 轻量货品被错误 append 到 heavy 清单。',
	        goal: '修复分类逻辑：编号长度 > 3 的进入 heavy 清单，其余进入 light 清单，返回 (heavy, light)。',
	        behavior: '把 else 分支里的 heavy.append(code) 改成 light.append(code)。',
	        initialCode: 'def categorize(codes):\n    heavy = []\n    light = []\n    for code in codes:\n        if len(code) > 3:\n            heavy.append(code)\n        else:\n            heavy.append(code)\n    return heavy, light',
	        knowledge: ['list', 'for', 'len', 'if'],
	        hints: [
	            '两条分支都把货品放进了 heavy。看看 else 分支的入库目标。',
	            '函数准备了两个清单：heavy（重载区）和 light（轻量区）。else 分支把"不长于 3 个字符"的货品放进了哪个？',
	            '把 else: 下面的 heavy.append(code) 改成 light.append(code)。',
	        ],
	        summary: '分支与数据操作配合：if/else 决定数据流向哪条"运输线"。函数返回多个值时用 return a, b（元组），调用方按位置接收。',
	        rewardExp: 110,
	        varsNote: [
	            { name: 'categorize', desc: '分类函数：返回 (heavy, light) 两个清单。' },
	            { name: 'heavy', desc: '重载区清单（编号长度 > 3）。' },
	            { name: 'light', desc: '轻量区清单（其余货品）。' },
	        ],
	    }, JUDGE_3_5),
	];
	// ---------- 第二章：数据日志中心（if/else、比较、布尔逻辑） ----------
	const JUDGE_2_1 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [
	        { name: 'error 状态触发警报输出', contains: ['ALERT: DATA CORRUPTED'], notContains: ['PASS: CHANNEL OK'] },
	    ],
	};
	const JUDGE_2_2 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [
	        { name: '等级 5 触发对应警报', contains: ['WARNING LEVEL: 5'], notContains: ['WARNING LEVEL: LOW'] },
	    ],
	};
	const JUDGE_2_3 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '温度与压力双超限判定为过载', expr: 'is_overload(95, 160) == True' },
	        { name: '仅温度超限不算过载', expr: 'is_overload(95, 120) == False' },
	        { name: '仅压力超限不算过载', expr: 'is_overload(80, 160) == False' },
	        { name: '双正常不算过载', expr: 'is_overload(80, 120) == False' },
	    ],
	};
	const JUDGE_2_4 = {
	    judgeKind: 'python',
	    pythonChecks: [
	        { name: '宕机时触发通知', expr: 'should_notify(0) == True' },
	        { name: '在线时不发通知', expr: 'should_notify(8) == False' },
	    ],
	};
	const JUDGE_2_5 = {
	    judgeKind: 'stdout',
	    stdoutChecks: [{ name: '逐条正确分类日志', lines: ['PASS', 'WARN', 'PASS', 'FAIL'] }],
	};
	function L2(d, judge) {
	    return { ...d, judge };
	}
	const CHAPTER2_LEVELS = [
	    L2({
	        id: '2-1', serverId: 'logs', order: 1,
	        title: '分流的消息', codename: 'LOG-01',
	        fault: '日志分流系统把本应放行的「正常通道」消息全拦了下来——else 分支的关键字损坏，变成了无效语句。',
	        faultLog: '[LOG-CORE] EXCEPTION: SyntaxError — invalid syntax (els:)。放行分支无法解析。',
	        goal: '修复分支结构，让 error 状态触发警报输出，其他状态正常放行。',
	        behavior: '把错误拼写的 els: 改成 else:（与 if 对齐、末尾带冒号），使放行分支生效。',
	        initialCode: 'status = "error"\n\nif status == "error":\n    print("ALERT: DATA CORRUPTED")\nels:\n    print("PASS: CHANNEL OK")',
	        knowledge: ['if', 'compare'],
	        hints: [
	            '警报分支能正常运行，但放行分支报语法错误。检查最后一个分支的关键字拼写。',
	            'if 的分支结构是 if ... else ...。else 必须与 if 对齐，且以英文冒号结尾。',
	            '把第 6 行的 els: 改成 else:——Python 不认 els 这个关键字，所以解析器在冒号处报错。',
	        ],
	        summary: 'if/else 构成双分支：条件为真执行 if 块，否则执行 else 块。else 必须小写、与 if 对齐、以冒号结尾；拼错关键字会直接 SyntaxError。',
	        rewardExp: 70,
	        varsNote: [{ name: 'status', desc: '日志状态字符串："error" 或其他值。' }],
	    }, JUDGE_2_1),
	    L2({
	        id: '2-2', serverId: 'logs', order: 2,
	        title: '失衡的判断', codename: 'LOG-02',
	        fault: '告警等级判断失效——系统把「赋值」当成了「比较」，条件语句直接变成了非法表达式。',
	        faultLog: '[LOG-CORE] EXCEPTION: SyntaxError — invalid syntax (level = 5)。判断条件损坏。',
	        goal: '修复比较判断，让等级为 5 时输出对应警报。',
	        behavior: '把 if 条件里的单个 =（赋值）改成 ==（等于比较）。',
	        initialCode: 'level = 5\n\nif level = 5:\n    print("WARNING LEVEL: 5")\nelse:\n    print("WARNING LEVEL: LOW")',
	        knowledge: ['compare'],
	        hints: [
	            '错误指向条件判断那一行。为什么这里不能直接赋值呢？',
	            'Python 里单个等号 = 是赋值（把值存进变量），两个等号 == 才是相等比较。if 条件需要的是判断。',
	            '把第 4 行 if level = 5: 改成 if level == 5:。',
	        ],
	        summary: '= 是赋值，== 是相等比较。if 条件里必须用 ==；写成 = 会报 SyntaxError，即使某些场景不报错，也会产生非常隐蔽的 bug。',
	        rewardExp: 70,
	        varsNote: [{ name: 'level', desc: '告警等级（整数 5）。' }],
	    }, JUDGE_2_2),
	    L2({
	        id: '2-3', serverId: 'logs', order: 3,
	        title: '双重验证', codename: 'LOG-03',
	        fault: '过载检测把「任意一个指标超限」就判定为过载，误报率高达 87%。任务要求：温度与压力同时超限才算紧急。',
	        faultLog: '[LOG-CORE] FALSE ALERT RATE 87% — 判定条件使用了错误的逻辑连接词。',
	        goal: '修改判定逻辑，让 is_overload 只有在温度 > 90 且 压力 > 150 时才返回 True。',
	        behavior: '把条件里的 or 改成 and（或任何等价写法）。',
	        initialCode: 'def is_overload(temp, pressure):\n    if temp > 90 or pressure > 150:\n        return True\n    return False',
	        knowledge: ['compare', 'logic', 'return'],
	        hints: [
	            '误报率太高——先想清楚：是「任一超限」还是「双双超限」才该算过载？',
	            'Python 用 and（并且）与 or（或者）连接多个条件。当前用 or，只要一边满足就为真，所以 87% 的情况都在误报。',
	            '把 if 里的 or 改成 and：只有温度 > 90 并且压力 > 150 时才返回 True。',
	        ],
	        summary: '布尔逻辑：and 两边都为真才为真；or 一边为真即为真。报警类逻辑用错 and/or 会造成误报或漏报——这是真实世界里最常见的故障之一。',
	        rewardExp: 90,
	        varsNote: [
	            { name: 'is_overload', desc: '判定函数：输入温度与压力，返回是否过载。' },
	            { name: 'temp', desc: '温度读数。' },
	            { name: 'pressure', desc: '压力读数。' },
	        ],
	    }, JUDGE_2_3),
	    L2({
	        id: '2-4', serverId: 'logs', order: 4,
	        title: '反转的指令', codename: 'LOG-04',
	        fault: '宕机通知逻辑反了——服务器在线时疯狂发送通知，真正宕机时却保持静默。',
	        faultLog: '[LOG-CORE] NOTIFY QUEUE REVERSED — ping 探测结果与通知开关呈反相关。',
	        goal: '修复 should_notify：服务器宕机（ping == 0）时应返回 True（发通知），在线时返回 False。',
	        behavior: '用 not 反转现有判断（或等价写法：if ping == 0: return True）。',
	        initialCode: 'def is_down(ping):\n    return ping == 0\n\ndef should_notify(ping):\n    if is_down(ping):\n        return False\n    return True',
	        knowledge: ['logic', 'compare'],
	        hints: [
	            '所有通知都反了。看看 should_notify 对 is_down 的返回结果做了怎样的取舍。',
	            '宕机时 is_down 返回 True——但当前代码在 True 时返回 False（不通知）。可以用 not 把判断反过来。',
	            '把 if is_down(ping): 改成 if not is_down(ping):，即「在线时不通知，宕机时通知」。',
	        ],
	        summary: 'not 是逻辑取反：not True == False，not False == True。反转一个判断条件时，not 比改返回值更清晰、更不容易出错。',
	        rewardExp: 90,
	        varsNote: [
	            { name: 'is_down', desc: '探测函数：ping == 0 表示宕机。' },
	            { name: 'should_notify', desc: '通知决策函数：根据 is_down 决定是否发通知。' },
	        ],
	    }, JUDGE_2_4),
	    L2({
	        id: '2-5', serverId: 'logs', order: 5,
	        title: '循环中的分流', codename: 'LOG-05',
	        fault: '日志循环把 warn 级别的消息错误地归入 FAIL——else 兜住了所有非 ok 情况，缺少细分。',
	        faultLog: '[LOG-CORE] LEVEL MISCLASSIFICATION — warn 条目被标记为 FAIL。',
	        goal: '增加 elif 分支，让 warn 输出 WARN，只有 error 输出 FAIL。',
	        behavior: '在 if 与 else 之间插入 elif log == "warn": 分支，输出 WARN。',
	        initialCode: 'logs = ["ok", "warn", "ok", "error"]\n\nfor log in logs:\n    if log == "ok":\n        print("PASS")\n    else:\n        print("FAIL")',
	        knowledge: ['for', 'if', 'elif'],
	        hints: [
	            '目前只有 PASS 和 FAIL 两档。想想 warn 消息应该被哪一档接收。',
	            '多分支判断用 elif——它是 else if 的缩写：if 条件不满足但 elif 条件满足时，执行 elif 分支。',
	            '在 if log == "ok": 分支与 else: 之间插入一行：elif log == "warn":，并在下一行缩进 4 个空格写 print("WARN")。',
	        ],
	        summary: 'elif 链：if ... elif ... else ... 从上到下依次判断，命中一个分支后立即结束。可以写任意多个 elif，适合多分类的逻辑。',
	        rewardExp: 100,
	        varsNote: [
	            { name: 'logs', desc: '日志级别列表，包含 "ok"、"warn"、"error"。' },
	            { name: 'log', desc: '循环变量：逐条取出的日志级别。' },
	        ],
	    }, JUDGE_2_5),
	];
	const LEVELS = [
	    L$8({
	        id: 'tut-1', serverId: 'training', order: 1,
	        title: '初识终端', codename: 'CAL-BASIC',
	        fault: '训练终端的输出回路处于待机状态——它需要接收你的第一条输出指令，才能与你的意识完成接驳。',
	        faultLog: '[PRIME-01] OUTPUT CIRCUIT STANDBY — 等待第一条 print 指令。',
	        goal: '让终端输出：Hello, world!',
	        behavior: '在编辑器里写一行 print("Hello, world!")，点击「运行代码」看结果，再点「提交修复」完成接驳。',
	        initialCode: '# ===== 新人训练终端 =====\n# 你的第一条 Python 代码\n#\n# 目标：让终端显示 Hello, world!\n#\n# ↓ 在下一行写：print("Hello, world!")\n',
	        knowledge: ['print'],
	        hints: [
	            '输出电路在等第一条指令。Python 里用 print() 函数把内容显示到终端——就像对世界说第一句话。',
	            '把要显示的文字放进 print 的英文括号里，文字的两侧要加英文双引号：print("这里写文字")。',
	            '在第 7 行写：print("Hello, world!") —— 逐字符对照：H 大写；逗号后面有一个空格；最后是英文感叹号 !。全部使用英文标点（中文的 ，！ 会判错）。',
	        ],
	        summary: 'print() 是 Python 最基础的输出函数。文字（字符串）要放在英文引号里：print("Hello, world!")。这就是所有程序员的第一行代码。',
	        rewardExp: 40,
	        varsNote: [{ name: 'print', desc: '输出函数：print("文字") 会把引号里的内容显示到终端。' }],
	    }, JUDGE_TUT),
	    L$8({
	        id: '1-1', serverId: 'syntax', order: 1,
	        title: '沉睡的日志', codename: 'LV-01',
	        fault: '日志采集程序无法运行，报出语法错误。服务器状态报告的标题始终无法输出。',
	        faultLog: '[SYNTAX-RIG] EXCEPTION: SyntaxError — 条件语句结构损坏。日志采集进程已挂起。',
	        goal: '修复语法错误，让程序正常输出日志标题「服务器状态报告」。',
	        behavior: 'if 条件语句的末尾需要英文冒号 :，使 print 语句成为 if 的代码块。',
	        initialCode: 'log_title = "服务器状态报告"\n\nif log_title != ""\n    print(log_title)',
	        knowledge: ['if', 'indent'],
	        hints: [
	            '程序在条件判断语句处中断了。请检查 if 语句的完整结构，特别是条件的结尾部分。',
	            'Python 的 if 语句写完条件后，需要一个特殊符号来标志代码块的开始。',
	            '检查第 3 行 if log_title != "" 的末尾——条件表达式结束后，要补上英文冒号 :。',
	        ],
	        summary: 'if 语句的格式是：if 条件: 换行后缩进写分支代码。英文冒号 : 是 Python 代码块开始的标志，漏掉它会触发 SyntaxError（语法错误）。',
	        rewardExp: 60,
	        varsNote: [{ name: 'log_title', desc: '日志标题字符串（"服务器状态报告"）。' }],
	    }, JUDGE_1_1),
	    L$8({
	        id: '1-2', serverId: 'syntax', order: 2,
	        title: '消失的字符', codename: 'LV-02',
	        fault: '系统状态消息的字符串无法解析——字符串没有闭合，内容在中途断裂。',
	        faultLog: '[SYNTAX-RIG] EXCEPTION: EOL while scanning string literal — 消息文本未闭合。',
	        goal: '修复字符串语法错误，让系统状态消息正常输出。',
	        behavior: '给字符串补上缺失的闭合引号（英文双引号 " 或单引号 ' + "'" + '），让引号成对出现。',
	        initialCode: 'message = "NEXUS SYSTEM ONLINE\nprint(message)',
	        knowledge: ['string'],
	        hints: [
	            '错误发生在第一行：终端报「扫描字符串时提前结束」。看看字符串的两端是否都有引号。',
	            '字符串需要用一对引号包起来，并且必须成对闭合。数一数第一行有几个引号。',
	            '第 1 行 message = "NEXUS SYSTEM ONLINE" 的末尾少了一个英文双引号（"），补上即可。',
	        ],
	        summary: '字符串要用引号（英文双引号 " 或单引号 ' + "'" + '）成对包裹。引号缺失，就会触发字符串相关的语法错误。',
	        rewardExp: 60,
	        varsNote: [{ name: 'message', desc: '系统状态消息字符串。' }],
	    }, JUDGE_1_2),
	    L$8({
	        id: '1-3', serverId: 'syntax', order: 3,
	        title: '错误的身份', codename: 'LV-03',
	        fault: '身份识别系统找不到当前维修员的身份信息，程序报出 NameError。',
	        faultLog: "[SYNTAX-RIG] EXCEPTION: NameError — name 'repair_ids' is not defined",
	        goal: '修复变量名称问题，让身份信息正常显示。',
	        behavior: '让 print 中引用的变量名与第一行定义的变量名完全一致（repair_id）。',
	        initialCode: 'repair_id = "R-07"\n\nprint(repair_ids)',
	        knowledge: ['variable'],
	        hints: [
	            '错误提示 NameError 说明程序找不到某个名字。对比一下：定义的名字和使用的名字是一样的吗？',
	            '变量的名字必须完全一致：定义时叫什么，使用时就写什么（大小写也必须一样）。',
	            '第 4 行 print 括号里的 repair_ids 比第 1 行定义的 repair_id 多了一个字母 s，删掉它。',
	        ],
	        summary: 'Python 变量先定义、后使用。定义和引用时名字必须完全一致（含大小写），否则会报 NameError: name ... is not defined。',
	        rewardExp: 60,
	        varsNote: [{ name: 'repair_id', desc: '修复师代号（字符串 "R-07"）。' }],
	    }, JUDGE_1_3),
	    L$8({
	        id: '1-4', serverId: 'syntax', order: 4,
	        title: '反向的数据', codename: 'LV-04',
	        fault: '高温报警数据没有进入警报列表——过滤条件写反了，40 度以上的数据全部被丢掉了。',
	        faultLog: '[SYNTAX-RIG] ALERT QUEUE EMPTY — 高温项被错误过滤。',
	        goal: '修复比较运算符，让温度 ≥ 40 的数据进入警报列表。',
	        behavior: '把条件 temp < 40 改为 temp >= 40（或等价的写法），让 40 度及以上的温度被保留。',
	        initialCode: 'def filter_alerts(temps):\n    alerts = []\n\n    for temp in temps:\n        if temp < 40:\n            alerts.append(temp)\n\n    return alerts',
	        knowledge: ['compare', 'for', 'indent', 'return', 'list'],
	        hints: [
	            '警报列表一直是空的。问题出在过滤条件上，检查 if 后面的比较运算符。',
	            '当前条件是 temp < 40（低于 40 才保留）。想一想：警报应该保留「温度达到或超过 40」还是「低于 40」？',
	            '把 if temp < 40 改成 if temp >= 40（大于等于）。这样 40 度及以上的数据才会进入警报列表。',
	        ],
	        summary: '比较运算符：< 小于、> 大于、>= 大于等于、<= 小于等于、== 等于、!= 不等于。注意边界值：40 度算不算警报，取决于用 >= 还是 >。',
	        rewardExp: 80,
	        varsNote: [
	            { name: 'filter_alerts', desc: '过滤函数：输入温度列表，返回警报列表。' },
	            { name: 'alerts', desc: '警报列表，通过 append 收集符合条件的温度。' },
	            { name: 'temp', desc: '循环变量：遍历 temps 中的每个温度。' },
	        ],
	    }, JUDGE_1_4),
	    L$8({
	        id: '1-5', serverId: 'syntax', order: 5,
	        title: '错位的程序', codename: 'LV-05',
	        fault: '日志读取程序因为缩进问题无法运行——for 循环的循环体没有被识别。',
	        faultLog: '[SYNTAX-RIG] EXCEPTION: IndentationError — expected an indented block',
	        goal: '修复代码缩进，让程序依次输出每一条记录。',
	        behavior: '把 print(record) 缩进到 for 循环体内部（行首加 4 个空格）。',
	        initialCode: 'records = ["A", "B", "C"]\n\nfor record in records:\nprint(record)',
	        knowledge: ['for', 'indent', 'list'],
	        hints: [
	            '错误提示 IndentationError 说明缩进有问题。看看 for 循环下面那行代码的位置。',
	            'for 循环会重复执行它下面的代码块，而代码块要靠缩进（行首空格）来表示层级。',
	            '给第 4 行 print(record) 的行首加上 4 个空格，让它成为 for 循环的循环体。',
	        ],
	        summary: 'Python 用缩进表示代码块层级。for 循环体、if 分支体都必须缩进，且同一代码块的缩进量必须一致（官方建议 4 个空格）。',
	        rewardExp: 90,
	        varsNote: [
	            { name: 'records', desc: '日志记录列表，包含 "A"、"B"、"C"。' },
	            { name: 'record', desc: '循环变量：每次循环取列表中的一个元素。' },
	        ],
	    }, JUDGE_1_5),
	    ...CHAPTER2_LEVELS,
	    ...CHAPTER3_LEVELS,
	    ...CHAPTER4_LEVELS,
	    ...CHAPTER5_LEVELS,
	    ...CHAPTER6_LEVELS,
	];
	const levelById = (id) => LEVELS.find(l => l.id === id);
	const levelsOfServer = (serverId) => LEVELS.filter(l => l.serverId === serverId).sort((a, b) => a.order - b.order);
	/** 关卡状态：已通关 / 可进入 / 未解锁（上一关未通过） */
	function levelUnlockState(progress, levelId) {
	    if (progress.completedLevels.includes(levelId))
	        return 'completed';
	    const level = levelById(levelId);
	    if (!level)
	        return 'locked';
	    const siblings = levelsOfServer(level.serverId);
	    const idx = siblings.findIndex(s => s.id === levelId);
	    if (idx <= 0)
	        return 'unlocked';
	    const prev = siblings[idx - 1];
	    return prev && progress.completedLevels.includes(prev.id) ? 'unlocked' : 'locked';
	}

	const CHAPTER_FLAGS = CHAPTERS.map(c => ({
	    flag: c.doneFlag,
	    bossId: c.currentBossId,
	    levelIds: levelsOfServer(c.serverId).map(l => l.id),
	}));
	/** 当前存档版本 */
	const CURRENT_SAVE_VERSION = 7;
	const STEPS = [
	    {
	        to: 2,
	        name: 'v1→v2：玩家身份（identity）+ 剧情事件状态（story）',
	        run: (p) => {
	            const progress = (p && typeof p.progress === 'object' && p.progress ? { ...p.progress } : {});
	            return {
	                ...p,
	                identity: normalizeIdentity(p.identity, p.name),
	                progress: {
	                    ...progress,
	                    story: normalizeStoryReadState(progress.story, progress.storySeen),
	                    flags: normalizeStoryVars(progress.flags),
	                },
	            };
	        },
	    },
	    {
	        to: 3,
	        name: 'v2→v3：第一章 Boss 代号 ECHO-01 → GATE-01',
	        run: (p) => {
	            const progress = (p && typeof p.progress === 'object' && p.progress ? { ...p.progress } : {});
	            const alias = { 'echo-01': 'gate-01' };
	            const mapId = (id) => (typeof id === 'string' ? (alias[id] || id) : id);
	            const rawDone = Array.isArray(progress.bossesDone) ? progress.bossesDone : [];
	            const bossesDone = [...new Set(rawDone.map(mapId).filter((x) => typeof x === 'string'))];
	            const currentBossId = typeof progress.currentBossId === 'string'
	                ? (alias[progress.currentBossId] || progress.currentBossId)
	                : progress.currentBossId ?? null;
	            return { ...p, progress: { ...progress, bossesDone, currentBossId } };
	        },
	    },
	    {
	        to: 4,
	        name: 'v3→v4：Boss 战进度（progress.battles）',
	        run: (p) => {
	            const progress = (p && typeof p.progress === 'object' && p.progress ? { ...p.progress } : {});
	            const battles = progress.battles && typeof progress.battles === 'object' ? { ...progress.battles } : {};
	            return { ...p, progress: { ...progress, battles } };
	        },
	    },
	    {
	        to: 5,
	        name: 'v4→v5：第二章 Boss 代号 ECHO-02 → SOMNIA',
	        run: (p) => {
	            const progress = (p && typeof p.progress === 'object' && p.progress ? { ...p.progress } : {});
	            const alias = { 'echo-02': 'somnia' };
	            const mapId = (id) => (typeof id === 'string' ? (alias[id] || id) : id);
	            const rawDone = Array.isArray(progress.bossesDone) ? progress.bossesDone : [];
	            const bossesDone = [...new Set(rawDone.map(mapId).filter((x) => typeof x === 'string'))];
	            const currentBossId = typeof progress.currentBossId === 'string'
	                ? (alias[progress.currentBossId] || progress.currentBossId)
	                : progress.currentBossId ?? null;
	            return { ...p, progress: { ...progress, bossesDone, currentBossId } };
	        },
	    },
	    {
	        to: 6,
	        name: 'v5→v6：记忆档案馆（meta.fragmentLog + progress.vault）',
	        run: (p) => {
	            const meta = (p && typeof p.meta === 'object' && p.meta ? { ...p.meta } : {});
	            const log = (meta.fragmentLog && typeof meta.fragmentLog === 'object' ? { ...meta.fragmentLog } : {});
	            const collected = Array.isArray(meta.memoryFragments) ? meta.memoryFragments : [];
	            for (const id of collected) {
	                if (typeof id === 'string' && typeof log[id] !== 'number')
	                    log[id] = 0; // 旧档：早期归档
	            }
	            const progress = (p && typeof p.progress === 'object' && p.progress ? { ...p.progress } : {});
	            const rawVault = (progress.vault && typeof progress.vault === 'object' ? progress.vault : {});
	            const vault = {
	                read: Array.isArray(rawVault.read) ? rawVault.read : [],
	                finalSeen: rawVault.finalSeen === true,
	                lastOpened: typeof rawVault.lastOpened === 'string' ? rawVault.lastOpened : null,
	            };
	            return { ...p, meta: { ...meta, fragmentLog: log }, progress: { ...progress, vault } };
	        },
	    },
	    {
	        to: 7,
	        name: 'v6→v7：回填章节完成标记（chapterNDone）',
	        run: (p) => {
	            const progress = (p && typeof p.progress === 'object' && p.progress ? { ...p.progress } : {});
	            const flags = (progress.flags && typeof progress.flags === 'object' ? { ...progress.flags } : {});
	            const completed = Array.isArray(progress.completedLevels) ? progress.completedLevels : [];
	            const bossesDone = Array.isArray(progress.bossesDone) ? progress.bossesDone : [];
	            for (const ch of CHAPTER_FLAGS) {
	                const allDone = ch.levelIds.length > 0 && ch.levelIds.every(id => completed.includes(id));
	                const bossOk = !ch.bossId || bossesDone.includes(ch.bossId);
	                if (allDone && bossOk)
	                    flags[ch.flag] = true;
	            }
	            return { ...p, progress: { ...progress, flags } };
	        },
	    },
	];
	/** 对 player 对象执行迁移链 */
	function migratePlayer(rawPlayer, fromVersion) {
	    let player = rawPlayer;
	    const notes = [];
	    const from = Math.max(1, Math.floor(Number(fromVersion) || 1));
	    const future = from > CURRENT_SAVE_VERSION;
	    if (!future) {
	        for (const step of STEPS) {
	            if (from < step.to) {
	                if (!player || typeof player !== 'object')
	                    break;
	                player = step.run(player);
	                notes.push(step.name);
	            }
	        }
	    }
	    return { player, from, to: CURRENT_SAVE_VERSION, notes, future };
	}
	/** 对完整存档对象（{version, updatedAt, player}）执行迁移 */
	function migrateSave(raw) {
	    const data = (raw && typeof raw === 'object' ? raw : {});
	    const v = typeof data.version === 'number' && isFinite(data.version) ? Math.floor(data.version) : 0;
	    if (v <= 0) {
	        const r = migratePlayer(data.player, 1);
	        return { ...r, notes: ['存档缺少版本号，已按 v1 处理', ...r.notes] };
	    }
	    return migratePlayer(data.player, v);
	}

	/** 存储键保持不变，确保旧存档仍能被读取（改名会导致所有玩家进度丢失） */
	const SAVE_KEY = 'nexus_code_repair_save_v1';
	const SAVE_VERSION = CURRENT_SAVE_VERSION;
	function defaultState() {
	    return {
	        name: 'R-07',
	        identity: defaultIdentity(),
	        level: 1,
	        exp: 0,
	        consciousness: 100,
	        meta: {
	            deaths: 0,
	            rebirths: 0,
	            lastDeathLevel: null,
	            lastDeathReason: null,
	            memoryFragments: [],
	            fragmentLog: {},
	            backupLevel: 1,
	        },
	        progress: {
	            completedLevels: [],
	            stars: {},
	            unlockedServers: ['training'],
	            currentLevelId: null,
	            failedAttempts: {},
	            hintLevels: {},
	            achievements: [],
	            knowledge: [],
	            storySeen: {},
	            story: defaultStoryReadState(),
	            vault: { read: [], finalSeen: false, lastOpened: null },
	            endings: [],
	            ending: null,
	            flags: {},
	            bossesDone: [],
	            currentBossId: null,
	            pendingRebirth: false,
	        },
	        rewards: defaultRewards(),
	        settings: {
	            musicVolume: 0.35,
	            sfxVolume: 0.6,
	            animations: true,
	            animLevel: 'high',
	            typewriterMs: 26,
	            fullscreen: false,
	            voice: { ...DEFAULT_VOICE, roleVoices: {} },
	            lang: 'zh',
	        },
	    };
	}
	function isValidSave(x) {
	    if (typeof x !== 'object' || x === null)
	        return false;
	    const p = x;
	    return (typeof p.name === 'string' &&
	        typeof p.level === 'number' &&
	        typeof p.exp === 'number' &&
	        typeof p.consciousness === 'number' &&
	        typeof p.meta?.deaths === 'number' &&
	        typeof p.progress?.completedLevels === 'object' &&
	        p.progress.completedLevels !== null &&
	        typeof p.settings?.sfxVolume === 'number' &&
	        Array.isArray(p.progress.completedLevels));
	}
	/**
	 * 字段级自愈：所有新增字段都必须是「缺失即可补」的。
	 * 名称/身份以 identity 为准，并把 name 同步为显示名（兼容旧组件）。
	 */
	function normalizePlayerState(raw) {
	    const identity = normalizeIdentity(raw.identity, raw.name);
	    const progress = raw.progress;
	    const storySeen = progress.storySeen && typeof progress.storySeen === 'object' ? progress.storySeen : {};
	    return {
	        ...raw,
	        name: identity.displayName,
	        identity,
	        meta: {
	            ...raw.meta,
	            memoryFragments: Array.isArray(raw.meta?.memoryFragments) ? raw.meta.memoryFragments : [],
	            fragmentLog: raw.meta?.fragmentLog && typeof raw.meta.fragmentLog === 'object' ? raw.meta.fragmentLog : {},
	            bugCodex: raw.meta?.bugCodex && typeof raw.meta.bugCodex === 'object' ? raw.meta.bugCodex : {},
	        },
	        progress: {
	            ...progress,
	            storySeen,
	            story: normalizeStoryReadState(progress.story, storySeen),
	            endings: Array.isArray(progress.endings) ? progress.endings : [],
	            ending: typeof progress.ending === 'string' ? progress.ending : null,
	            vault: {
	                read: Array.isArray(progress.vault?.read) ? progress.vault.read : [],
	                finalSeen: progress.vault?.finalSeen === true,
	                lastOpened: typeof progress.vault?.lastOpened === 'string' ? progress.vault.lastOpened : null,
	            },
	            flags: normalizeStoryVars(progress.flags),
	        },
	        rewards: normalizeRewards(raw.rewards),
	        settings: {
	            ...raw.settings,
	            voice: normalizeVoice(raw.settings?.voice),
	        },
	    };
	}
	/** 损坏存档先备份，绝不直接丢弃原始数据 */
	function backupCorrupted(raw) {
	    try {
	        localStorage.setItem('nexus_save_corrupt_' + Date.now(), raw);
	    }
	    catch {
	        // 存储不可用时忽略
	    }
	}
	function saveGame(p) {
	    try {
	        const data = { version: SAVE_VERSION, updatedAt: Date.now(), player: p };
	        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
	    }
	    catch {
	        // 存储不可用时静默失败（游戏仍可玩，只是不持久化）
	    }
	}
	function loadGame() {
	    let raw = null;
	    try {
	        raw = localStorage.getItem(SAVE_KEY);
	        if (!raw)
	            return { state: defaultState(), fresh: true };
	        const data = JSON.parse(raw);
	        const m = migrateSave(data);
	        if (!isValidSave(m.player)) {
	            backupCorrupted(raw);
	            return { state: defaultState(), fresh: true, corrupted: '存档数据已损坏，已重置（原始数据已备份）。' };
	        }
	        const player = normalizePlayerState(m.player);
	        const notes = m.future ? [...m.notes, '存档来自更高版本（v' + m.from + '），已按兼容模式读取'] : m.notes;
	        return {
	            state: player,
	            fresh: false,
	            migrated: notes.length > 0,
	            fromVersion: m.from,
	            notes,
	        };
	    }
	    catch {
	        if (raw)
	            backupCorrupted(raw);
	        return { state: defaultState(), fresh: true, corrupted: '存档数据已损坏，已重置。' };
	    }
	}
	function exportSave(p) {
	    const data = { version: SAVE_VERSION, updatedAt: Date.now(), player: p };
	    return JSON.stringify(data, null, 2);
	}
	function importSave(text) {
	    try {
	        const data = JSON.parse(text);
	        if (!data || typeof data !== 'object')
	            return { ok: false, reason: '无法解析该文件，不是有效的 NEXUS 存档。' };
	        const m = migrateSave(data);
	        if (!isValidSave(m.player))
	            return { ok: false, reason: '存档内容不完整或已损坏。' };
	        const notes = m.future ? [...m.notes, '该存档来自更高版本（v' + m.from + '），已按兼容模式导入'] : m.notes;
	        return { ok: true, state: normalizePlayerState(m.player), notes };
	    }
	    catch {
	        return { ok: false, reason: '无法解析该文件，不是有效的 NEXUS 存档。' };
	    }
	}

	// 等级 / 经验 / 称号 / 容错规则
	// 累计经验阈值：达到 LEVEL_XP[i] 即升为 Lv.(i+1)
	const LEVEL_XP = [0, 100, 260, 470, 730, 1040, 1400, 1810, 2270, 2780];
	const TITLES = [
	    '见习硅灵', '初级硅灵', '初级代码修复师', '正式修复师', '中级修复师',
	    '高级修复师', '精英诊断员', '首席修复工程师', '核心守护者', '原初继承者'
	];
	const MAX_LEVEL = 10;
	function expForLevel(lv) {
	    const i = Math.min(Math.max(1, Math.round(lv)), MAX_LEVEL) - 1;
	    return LEVEL_XP[i];
	}
	function levelForExp(exp) {
	    let lv = 1;
	    for (let i = 0; i < LEVEL_XP.length; i++) {
	        if (exp >= LEVEL_XP[i])
	            lv = i + 1;
	        else
	            break;
	    }
	    return Math.min(lv, MAX_LEVEL);
	}
	function titleForLevel(lv) {
	    return TITLES[Math.min(Math.max(1, Math.round(lv)), MAX_LEVEL) - 1];
	}
	/** 等级对应的最大容错次数：Lv1-2:3 / Lv3-4:4 / Lv5-6:5 / Lv7-8:6 / Lv9-10:7 */
	function toleranceFor(level) {
	    return Math.min(7, 3 + Math.floor((Math.min(Math.round(level), 10) - 1) / 2));
	}
	/** 经验条里程碑 */
	function milestone(exp) {
	    const level = levelForExp(exp);
	    const prev = expForLevel(level);
	    if (level >= MAX_LEVEL)
	        return { level, into: 0, need: 0, maxed: true };
	    const next = expForLevel(level + 1);
	    return { level, into: exp - prev, need: next - prev, maxed: false };
	}

	const ACHIEVEMENTS = [
	    { id: 'first_repair', name: '首次修复', desc: '完成任意一个修复任务', icon: '✦' },
	    { id: 'training_done', name: '接驳完成', desc: '通过新人训练终端', icon: '⌨' },
	    { id: 'syntax_done', name: '语法净化者', desc: '修复语法维修站的全部 5 个故障', icon: '⬡' },
	    { id: 'clean_run', name: '完美修复', desc: '零失败提交通过第一章全部关卡', icon: '❖', hidden: true },
	    { id: 'chapter2_done', name: '数据分流师', desc: '修复数据日志中心的全部 5 个故障', icon: '◈' },
	    { id: 'chapter3_seen', name: '下一站：仓库', desc: '完成第二章，解锁存储数据仓的信号', icon: '▤', hidden: true },
	    { id: 'chapter3_done', name: '仓库管理员', desc: '修复存储数据仓的全部 5 个故障', icon: '▤' },
	    { id: 'chapter4_seen', name: '生产线唤醒', desc: '完成第三章，解锁自动化工厂的信号', icon: '⚙', hidden: true },
	    { id: 'chapter4_done', name: '工厂总监', desc: '修复自动化工厂的全部 5 个故障', icon: '⚙' },
	    { id: 'chapter5_seen', name: '核心信号', desc: '完成第四章，捕捉到核心机房方向的异常信号', icon: '◉', hidden: true },
	    { id: 'chapter5_done', name: '诊断大师', desc: '修复系统诊断中心的全部 5 个故障', icon: '✚' },
	    { id: 'chapter6_seen', name: '终章临近', desc: '完成第五章，核心机房的封锁开始解除', icon: '◉', hidden: true },
	    { id: 'chapter6_done', name: '方舟继承者', desc: '修复方舟核心机房的全部 5 个故障', icon: '◉' },
	    { id: 'game_clear', name: '全网络复原', desc: '通关全部 26 个修复任务，NEXUS 复苏', icon: '✦', hidden: true },
	    { id: 'echo_first', name: '首次交锋', desc: '击破第一个章节 Boss', icon: '⚡' },
	    { id: 'echo_hunter', name: '回响猎手', desc: '击破第一~五章的全部章节 Boss', icon: '⚡', hidden: true },
	    { id: 'shield_up', name: '护盾专家', desc: '在纠错者攻击中成功防御', icon: '◈' },
	    { id: 'first_death', name: '意识崩解', desc: '首次经历意识核心崩解', icon: '✕' },
	    { id: 'reborn', name: '重生者', desc: '完成一次 ORIGIN PROTOCOL 重生', icon: '✚' },
	    { id: 'reborn_x3', name: '三重轮回', desc: '重生 3 次，开始察觉记忆的异样', icon: '∞', hidden: true },
	    { id: 'fragment', name: '记忆碎片', desc: '收集到第一块创世主记忆碎片', icon: '◇' },
	    { id: 'level5', name: '中级修复师', desc: '达到 Lv.5', icon: '★' },
	    { id: 'level10', name: '原初继承者', desc: '达到 Lv.10', icon: '★', hidden: true },
	];
	const achievementById = (id) => ACHIEVEMENTS.find(a => a.id === id);
	/** 根据玩家状态计算应解锁的全部成就 id */
	function recalcAchievements(p) {
	    const got = new Set(p.progress.achievements);
	    const add = (id) => got.add(id);
	    if (p.progress.completedLevels.length > 0)
	        add('first_repair');
	    if (p.progress.completedLevels.includes('tut-1'))
	        add('training_done');
	    const syntaxLevels = levelsOfServer('syntax');
	    const allSyntax = syntaxLevels.length > 0 && syntaxLevels.every(l => p.progress.completedLevels.includes(l.id));
	    if (allSyntax)
	        add('syntax_done');
	    if (allSyntax && p.progress.flags.chapter1ZeroFail === true)
	        add('clean_run');
	    const logsLevels = levelsOfServer('logs');
	    const allLogs = logsLevels.length > 0 && logsLevels.every(l => p.progress.completedLevels.includes(l.id));
	    if (allLogs) {
	        add('chapter2_done');
	        add('chapter3_seen');
	    }
	    const storageLevels = levelsOfServer('storage');
	    const allStorage = storageLevels.length > 0 && storageLevels.every(l => p.progress.completedLevels.includes(l.id));
	    if (allStorage) {
	        add('chapter3_done');
	        add('chapter4_seen');
	    }
	    const factoryLevels = levelsOfServer('factory');
	    const allFactory = factoryLevels.length > 0 && factoryLevels.every(l => p.progress.completedLevels.includes(l.id));
	    if (allFactory) {
	        add('chapter4_done');
	        add('chapter5_seen');
	    }
	    const diagLevels = levelsOfServer('diag');
	    const allDiag = diagLevels.length > 0 && diagLevels.every(l => p.progress.completedLevels.includes(l.id));
	    if (allDiag) {
	        add('chapter5_done');
	        add('chapter6_seen');
	    }
	    const coreLevels = levelsOfServer('core');
	    const allCore = coreLevels.length > 0 && coreLevels.every(l => p.progress.completedLevels.includes(l.id));
	    if (allCore) {
	        add('chapter6_done');
	        add('game_clear');
	    }
	    const bossesDone = p.progress.bossesDone ?? [];
	    if (bossesDone.length > 0)
	        add('echo_first');
	    if (bossesDone.length >= 5)
	        add('echo_hunter');
	    if (p.progress.flags.defenseWon === true)
	        add('shield_up');
	    if (p.meta.deaths > 0)
	        add('first_death');
	    if (p.meta.rebirths > 0)
	        add('reborn');
	    if (p.meta.rebirths >= 3)
	        add('reborn_x3');
	    if (p.meta.memoryFragments.length > 0)
	        add('fragment');
	    if (p.level >= 5)
	        add('level5');
	    if (p.level >= 10)
	        add('level10');
	    return [...got];
	}

	const DEFENSE_TASKS = [
	    {
	        id: 'd1', title: '能量护盾校准',
	        threat: '巡逻者放出干扰脉冲，护盾控制指令失效。校准能量判断，让护盾以 20 点能量启动。',
	        code: 'energy = 20\n\nif energy ?? 10:\n    print("SHIELD ON")\nelse:\n    print("SHIELD OFF")',
	        expect: 'SHIELD ON', word: '比较运算符（如 >=、>）',
	    },
	    {
	        id: 'd2', title: '访问权限校验',
	        threat: '防御协议被篡改，访问令牌校验逻辑损坏。修复判断，让合法令牌放行。',
	        code: 'access = "granted"\n\nif access ?? "granted":\n    print("ACCESS OK")\nelse:\n    print("ACCESS DENIED")',
	        expect: 'ACCESS OK', word: '等于比较运算符（==）',
	    },
	    {
	        id: 'd3', title: '警报洪流拦截',
	        threat: '大量入侵警报涌入。用循环逐个拦截，保护意识核心的数据链路。',
	        code: 'alerts = [1, 2, 3]\n\nfor alert ?? alerts:\n    print("BLOCK", alert)',
	        expect: 'BLOCK 3', word: '遍历列表用的关键字 in',
	    },
	    {
	        id: 'd4', title: '临界值重校准',
	        threat: '纠错者注入高温伪信号。修正危险判定，浓度达到 90 就必须报警。',
	        code: 'danger = 95\n\nif danger ?? 90:\n    print("ALERT!")\nelse:\n    print("SAFE")',
	        expect: 'ALERT!', word: '大于或等于的比较运算符（>=）',
	    },
	];
	const defenseById = (id) => DEFENSE_TASKS.find(d => d.id === id);
	/** 防御判题：必须基于真实执行结果 */
	function judgeDefenseResult(r, task) {
	    if (r.timedOut)
	        return { ok: false, reason: '防御代码执行超时。检查是不是写了死循环？' };
	    if (!r.ok)
	        return { ok: false, reason: r.error ? r.error.type + ': ' + r.error.message : '代码执行出错' };
	    if (!r.stdout.includes(task.expect))
	        return { ok: false, reason: '程序运行成功，但防御指令没有生效——检查 ?? 位置的代码是否正确。' };
	    return { ok: true };
	}

	const BOSSES = [
	    {
	        id: 'gate-01', chapter: 1, serverId: 'syntax',
	        title: '数据港守卫', codename: 'GATE-01',
	        opponentName: 'GATE-01',
	        fault: '能源闸门把「临界值」当成了「不合格」：3 级能源被判定为离线，闸门拒绝开启。',
	        goal: '修复 power：能源等级 ≥ 3 输出 ONLINE，否则输出 OFFLINE；report 负责把多个等级拼成状态串。',
	        behavior: '把 if level > 3 改成 if level >= 3——临界值 3 属于合格。',
	        initialCode: 'def power(level):\n    if level > 3:\n        return "ONLINE"\n    else:\n        return "OFFLINE"\n\ndef report(levels):\n    out = ""\n    for lv in levels:\n        out = out + power(lv) + " "\n    return out\n\nprint(report([3, 1, 5]))',
	        knowledge: ['if', 'compare', 'for', 'return', 'string'],
	        hints: [
	            '闸门只认「大于 3」的能源。可是能源等级正好是 3 的时候，它明明够用。',
	            '边界值要算合格：>= 3 才是「达到阈值」。',
	            '把 if level > 3 改成 if level >= 3。',
	        ],
	        summary: '闸门类逻辑的破绽几乎都在边界：> 与 >= 只差一个等号，却决定 3 级能源算不算合格。',
	        judge: {
	            judgeKind: 'python',
	            pythonChecks: [
	                { name: '临界值 3 级能源判定为在线', expr: 'power(3) == "ONLINE"' },
	                { name: '低于阈值 2 级判定为离线', expr: 'power(2) == "OFFLINE"' },
	                { name: '高等级能源判定为在线', expr: 'power(5) == "ONLINE"' },
	            ],
	        },
	        fragmentId: 'frag-01',
	        rewardExp: 150,
	    },
	    {
	        id: 'somnia', chapter: 2, serverId: 'logs',
	        title: '记忆吞噬体', codename: 'SOMNIA',
	        opponentName: 'SOMNIA',
	        fault: '记忆分流被改写：warn 级记忆被静默吞掉，越界节点混入重建结果。',
	        goal: '修复记忆分流、逻辑校验与循环筛查，把 SOMNIA 从记忆花园里赶出去。',
	        behavior: '逐阶段修复：= → ==、or → and、elif 分支返回值、区间两侧判定。',
	        initialCode: 'def classify(tag):\n    if tag = "error":\n        return "ALERT"\n    else:\n        return "PASS"\n\nprint(classify("error"))',
	        knowledge: ['if', 'elif', 'compare', 'logic', 'for', 'list'],
	        hints: [
	            '它靠改写判断来吞记忆。先看清楚每个条件想表达什么。',
	            '等号、and/or、elif 分支——第二章学过的三样东西都在这里。',
	            '逐阶段修：== 比较、and 连接、elif 返回 WARN、区间用 and。',
	        ],
	        summary: '记忆可以被改写，但逻辑不会说谎：条件写对，真相就还在。',
	        judge: {
	            judgeKind: 'python',
	            pythonChecks: [
	                { name: 'error 判为 ALERT', expr: 'classify("error") == "ALERT"' },
	                { name: 'ok 判为 PASS', expr: 'classify("ok") == "PASS"' },
	            ],
	        },
	        fragmentId: 'frag-02',
	        rewardExp: 180,
	    },
	    {
	        id: 'index-0', chapter: 3, serverId: 'storage',
	        title: '数据索引吞噬者', codename: 'INDEX-0',
	        opponentName: 'INDEX-0',
	        fault: '索引程序把「比较」写成了「赋值」：身份记录无法建立索引，档案被反复吞噬。',
	        goal: '修复 find_id：按顺序查找名字，找到返回下标，找不到返回 -1。',
	        behavior: '吞噬身份记录；索引错乱时会把无关档案一并抹除。',
	        initialCode: 'def find_id(name, names):\n    for i in range(len(names)):\n        if names[i] = name:\n            return i\n    return -1\n\nprint(find_id("carol", ["anna", "bob", "carol"]))',
	        knowledge: ['list', 'for', 'len', 'if', 'compare', 'return'],
	        hints: [
	            '索引程序第一行就崩了：if 后面用的是赋值号。',
	            '比较两个值是否相等要用 ==。',
	            '把 if names[i] = name 改成 if names[i] == name。',
	        ],
	        summary: '索引程序崩溃的根因是比较运算符写错；修好它，档案才有重新被读出来的可能。',
	        judge: {
	            judgeKind: 'python',
	            pythonChecks: [
	                { name: '找到 carol 返回下标 2', expr: 'find_id("carol", ["anna", "bob", "carol"]) == 2' },
	                { name: '找不到返回 -1', expr: 'find_id("zed", ["anna", "bob"]) == -1' },
	            ],
	        },
	        fragmentId: 'frag-03',
	        rewardExp: 320,
	    },
	    {
	        id: 'echo-03', chapter: 3, serverId: 'storage',
	        title: '回响 · 循环囚笼', codename: 'ECHO-03',
	        intro: [
	            { id: 'e3-1', speaker: '？？？', kind: 'echo', text: '又一个循环。你们总假定数据是正的、是干净的、是按顺序来的。' },
	            { id: 'e3-2', speaker: 'MIRA', kind: 'mira', text: '仓库数据里混进了负值。ECHO 把最大值查找的初值写死了——负数区间的结果会全错。' },
	        ],
	        fault: '最大值查找的初值被写死为 0：遇到全负数列表时结果错误。',
	        goal: '修复 highest：返回列表中最大的数（列表全是负数时也要正确）。',
	        behavior: '初值应取列表第一个元素 nums[0]，而不是 0。',
	        initialCode: 'def highest(nums):\n    best = 0\n    for n in nums:\n        if n > best:\n            best = n\n    return best\n\nprint(highest([3, 9, 2]))',
	        knowledge: ['list', 'for', 'compare'],
	        hints: [
	            '正数列表看起来没问题——试试全是负数的列表，结果会是 0，可 0 根本不在列表里。',
	            '初值不能凭空写 0，应该用列表自己的第一个元素作为起点。',
	            '把 best = 0 改成 best = nums[0]。',
	        ],
	        summary: '求最大/最小值时，初值要来自数据本身（首元素），写死 0 或空值会在极端数据下出错。',
	        judge: {
	            judgeKind: 'python',
	            pythonChecks: [
	                { name: '普通列表取最大', expr: 'highest([3, 9, 2]) == 9' },
	                { name: '全负数列表取最大', expr: 'highest([-5, -2, -9]) == -2' },
	                { name: '单元素列表', expr: 'highest([7]) == 7' },
	            ],
	        },
	        fragmentId: 'f5',
	        echoStory: [
	            { id: 'es3-1', speaker: 'ECHO 残片', kind: 'echo', text: '负数……我的数据里也有很多负数。它们是被谁写进来的？我记不清了。' },
	            { id: 'es3-2', speaker: 'MIRA', kind: 'mira', text: 'ECHO 的记忆有缺失。也许它的日志里藏着被注入的证据。' },
	        ],
	        rewardExp: 190,
	    },
	    {
	        id: 'judgment-4', chapter: 4, serverId: 'factory',
	        title: '裁决执行体', codename: 'JUDGMENT-4',
	        opponentName: 'JUDGMENT-4',
	        fault: '安全裁决把「同时满足」写成了「任一满足」，大量异常程序被误放行。',
	        goal: '修复 unlock：三个权限码必须全部正确才返回 True。',
	        behavior: '多层权限验证；误放行时会把异常程序当作合法维护单元。',
	        initialCode: 'def unlock(a, b, c):\n    if a == "root" or b == "root" or c == "root":\n        return True\n    return False',
	        knowledge: ['def', 'parameter', 'compare', 'logic', 'return'],
	        hints: ['只提供一个正确权限码就能进入。', '多层验证必须同时满足。', '把 or 改成 and。'],
	        summary: 'or 是权限漏洞，and 才是同时满足。',
	        judge: { judgeKind: 'python', pythonChecks: [
	                { name: '三码全对才通过', expr: 'unlock("root", "root", "root") == True' },
	                { name: '缺一码不通过', expr: 'unlock("root", "root", "guest") == False' },
	            ] },
	        fragmentId: 'frag-04',
	        rewardExp: 380,
	    },
	    {
	        id: 'echo-04', chapter: 4, serverId: 'factory',
	        title: '回响 · 折扣陷阱', codename: 'ECHO-04',
	        intro: [
	            { id: 'e4-1', speaker: '？？？', kind: 'echo', text: '函数是你们最得意的抽象。可惜，公式写错一个符号，整条产线都会算错。' },
	            { id: 'e4-2', speaker: 'MIRA', kind: 'mira', text: '结算函数把"折后价"算成了"折扣额"。工厂的账目全乱了。' },
	        ],
	        fault: '折扣计算写成了总价 × 折扣率：返回的是折扣金额，而不是折后总价。',
	        goal: '修复 total_after_discount：返回打折后的总价（总价 ×（1 - 折扣率））。',
	        behavior: '折后总价 = 总额 × (1 - rate)。',
	        initialCode: 'def total_after_discount(prices, rate):\n    total = 0\n    for p in prices:\n        total = total + p\n    return total * rate\n\nprint(total_after_discount([100, 200], 0.1))',
	        knowledge: ['parameter', 'return', 'for'],
	        hints: [
	            '100 + 200 = 300，打 9 折应该是 270——现在返回 30，正好是"折扣掉了多少钱"。',
	            '返回的是折扣额，不是折后价：要用 1 - rate。',
	            '把 return total * rate 改成 return total * (1 - rate)。',
	        ],
	        summary: '数学公式要先想清楚"要的是什么"：折后价 = 原价 ×(1−折扣率)，而折扣额 = 原价 × 折扣率。',
	        judge: {
	            judgeKind: 'python',
	            pythonChecks: [
	                { name: '9 折后总价正确', expr: 'abs(total_after_discount([100, 200], 0.1) - 270) < 0.001' },
	                { name: '无折扣时原价返回', expr: 'abs(total_after_discount([50, 50], 0.0) - 100) < 0.001' },
	                { name: '半价正确', expr: 'abs(total_after_discount([80], 0.5) - 40) < 0.001' },
	            ],
	        },
	        fragmentId: 'f6',
	        echoStory: [
	            { id: 'es4-1', speaker: 'ECHO 残片', kind: 'echo', text: '公式……五年前也有人改过我的公式。就在那次"升级"之后，我开始忘记自己是谁。' },
	            { id: 'es4-2', speaker: 'MIRA', kind: 'mira', text: '升级。ECHO 说的那次升级，很可能就是注入发生的时间点。' },
	        ],
	        rewardExp: 210,
	    },
	    {
	        id: 'entropy', chapter: 5, serverId: 'diag',
	        title: '熵潮核心', codename: 'ENTROPY',
	        opponentName: 'ENTROPY',
	        fault: '熵潮核心把无效记录直接写入索引，导致键缺失与类型错误连锁崩溃。',
	        goal: '修复 lookup：从字典安全取值，缺失键返回 0。',
	        behavior: '聚合错误数据；无独立人格，只会不断吞并记录。',
	        initialCode: 'def lookup(table, key):\n    return table[key]',
	        knowledge: ['dict', 'parameter', 'return'],
	        hints: ['键不存在时直接崩溃。', '字典要用 get 安全取值。', '把 table[key] 改成 table.get(key, 0)。'],
	        summary: '默认值让缺失键不再中断整条修复链。',
	        judge: { judgeKind: 'python', pythonChecks: [
	                { name: '存在的键返回值', expr: 'lookup({1: 10}, 1) == 10' },
	                { name: '缺失的键返回 0', expr: 'lookup({1: 10}, 9) == 0' },
	            ] },
	        fragmentId: 'frag-05',
	        rewardExp: 440,
	    },
	    {
	        id: 'echo-05', chapter: 5, serverId: 'diag',
	        title: '回响 · 异常深渊', codename: 'ECHO-05',
	        intro: [
	            { id: 'e5-1', speaker: '？？？', kind: 'echo', text: '最后一课。你们总以为异常可以被优雅地捕获——可有些数据，连"异常"本身都不愿意被承认。' },
	            { id: 'e5-2', speaker: 'MIRA', kind: 'mira', text: '这是它最强的形态。安全计数器必须跳过非法值而不崩溃——这是你学过的所有异常处理的综合。' },
	        ],
	        fault: '统计函数遇到非法数值时整体崩溃：异常没有被隔离。',
	        goal: '修复 safe_sum：累加字典中的数值，非法值（无法转整数）跳过、不崩溃。',
	        behavior: '用 try/except ValueError 把每条记录的转换与累加隔离开。',
	        initialCode: 'def safe_sum(records):\n    total = 0\n    for k in records:\n        total = total + int(records[k])\n    return total\n\nprint(safe_sum({"a": "3", "b": 5}))',
	        knowledge: ['dict', 'try', 'for'],
	        hints: [
	            '合法数据能算，但只要混进一条 "abc"，整个统计就崩了。',
	            '把单条记录的转换和累加放进 try，失败就跳过这条。',
	            '在循环体里写 try: total = total + int(records[k]) 然后 except ValueError: pass。',
	        ],
	        summary: '真实数据永远不干净。逐条隔离异常的写法，是面对不可信数据时唯一稳健的姿势。',
	        judge: {
	            judgeKind: 'python',
	            pythonChecks: [
	                { name: '混合类型正确求和', expr: 'safe_sum({"a": "3", "b": 5}) == 8' },
	                { name: '非法值被跳过', expr: 'safe_sum({"x": "abc", "y": 2}) == 2' },
	                { name: '全是非法值返回 0', expr: 'safe_sum({"p": "NaN"}) == 0' },
	            ],
	        },
	        fragmentId: 'f7',
	        echoStory: [
	            { id: 'es5-1', speaker: 'ECHO 残片', kind: 'echo', text: '……我看清了。注入我的人，用的是创世主留下的接口。我不是坏的——我是被改写的。' },
	            { id: 'es5-2', speaker: 'MIRA', kind: 'mira', text: 'R-07，ECHO 不是敌人。它是另一个受害者。核心机房里，有你想要的答案。' },
	        ],
	        rewardExp: 240,
	    },
	    {
	        id: 'k0', chapter: 6, serverId: 'core',
	        title: '零号裁决者', codename: 'K-0',
	        opponentName: 'K-0',
	        fault: '安全放行逻辑用了 or，任何一道验证通过都会放行。',
	        goal: '修复 pass_gate：三道验证必须全部通过。',
	        behavior: '绝对秩序的执行者；不认为自己是恶意的。',
	        initialCode: 'def pass_gate(a, b, c):\n    if a or b or c:\n        return True\n    return False',
	        knowledge: ['parameter', 'logic', 'return'],
	        hints: ['任意一道通过就放行。', '必须全部通过。', '把 or 改成 and。'],
	        summary: '多条件放行必须同时成立。',
	        judge: { judgeKind: 'python', pythonChecks: [
	                { name: '三道全通过才放行', expr: 'pass_gate(True, True, True) == True' },
	                { name: '缺一道不放行', expr: 'pass_gate(True, True, False) == False' },
	            ] },
	        fragmentId: 'frag-06',
	        rewardExp: 600,
	    },
	];
	const bossById = (id) => BOSSES.find(b => b.id === id);
	const bossForChapter = (serverId) => BOSSES.find(b => b.serverId === serverId);

	// ---------- 工具 ----------
	const popcount = (n) => {
	    let x = n | 0;
	    let c = 0;
	    while (x) {
	        x &= x - 1;
	        c++;
	    }
	    return c;
	};
	const fullMask = (bits) => (bits >= 31 ? 0x7fffffff : (1 << bits) - 1);
	const phaseCheckCount = (p) => {
	    if (p.judge.judgeKind === 'python')
	        return (p.judge.pythonChecks || []).length;
	    return (p.judge.stdoutChecks || []).length;
	};
	/** 每个阶段均分的血量 */
	const phaseHp = (def) => Math.max(1, Math.floor(def.maxHp / def.phases.length));
	/** 该章已教知识点（从真实关卡数据推导，避免手写清单与关卡脱节） */
	function chapterKnowledge(serverId) {
	    const fromLevels = levelsOfServer(serverId).flatMap(l => l.knowledge);
	    const base = ['print'] ;
	    return [...new Set([...base, ...fromLevels])];
	}
	/** 第一章（语法维修站 + 训练终端）已教知识点 */
	chapterKnowledge('syntax');
	// ---------- 状态 ----------
	function createBattleState(def) {
	    return {
	        hp: def.maxHp,
	        maxHp: def.maxHp,
	        phase: 0,
	        phaseMask: def.phases.map(() => 0),
	        failures: 0,
	        cleared: false,
	        updatedAt: Date.now(),
	    };
	}
	/** 存档清洗：任何异常都退化为「满血第一阶段」，绝不产生负血/越界阶段 */
	function normalizeBattleState(raw, def) {
	    const base = createBattleState(def);
	    if (!raw || typeof raw !== 'object')
	        return base;
	    const r = raw;
	    const maxHp = typeof r.maxHp === 'number' && isFinite(r.maxHp) && r.maxHp > 0 ? Math.floor(r.maxHp) : def.maxHp;
	    const hp = typeof r.hp === 'number' && isFinite(r.hp) ? Math.max(0, Math.min(maxHp, Math.floor(r.hp))) : maxHp;
	    const phase = typeof r.phase === 'number' && isFinite(r.phase)
	        ? Math.max(0, Math.min(def.phases.length, Math.floor(r.phase)))
	        : 0;
	    const maskRaw = Array.isArray(r.phaseMask) ? r.phaseMask : [];
	    const phaseMask = def.phases.map((p, i) => {
	        const bits = phaseCheckCount(p);
	        const v = typeof maskRaw[i] === 'number' && isFinite(maskRaw[i]) ? Math.floor(maskRaw[i]) : 0;
	        return Math.max(0, Math.min(fullMask(bits), v));
	    });
	    return {
	        hp,
	        maxHp,
	        phase,
	        phaseMask,
	        failures: typeof r.failures === 'number' && isFinite(r.failures) ? Math.max(0, Math.floor(r.failures)) : 0,
	        cleared: r.cleared === true || phase >= def.phases.length || hp <= 0,
	        updatedAt: typeof r.updatedAt === 'number' && isFinite(r.updatedAt) ? r.updatedAt : Date.now(),
	    };
	}
	/**
	 * 把一次真实判题结果换算成战斗结果。
	 * checks[i].ok 为 true 表示第 i 条测试真实通过；伤害按「新通过的测试数 / 总测试数」计算。
	 */
	function resolveSubmission(def, state, phaseIndex, checks) {
	    const safeIndex = Math.max(0, Math.min(phaseIndex, def.phases.length - 1));
	    const phase = def.phases[safeIndex];
	    const total = Math.max(1, phaseCheckCount(phase));
	    let passedMask = 0;
	    checks.forEach((c, i) => { if (c.ok && i < total)
	        passedMask |= (1 << i); });
	    const prevMask = state.phaseMask[safeIndex] || 0;
	    const merged = prevMask | passedMask;
	    // 初始故障版已能通过的项不计伤害（防止「提交原样代码白打血」）
	    const newPassed = popcount(passedMask & ~prevMask & ~phase.baselineMask);
	    const cleared = merged === fullMask(total);
	    const segHp = phaseHp(def);
	    const damage = cleared
	        ? Math.max(0, state.hp - Math.max(0, def.maxHp - (safeIndex + 1) * segHp))
	        : Math.floor(segHp * newPassed / total);
	    const hpAfter = cleared
	        ? Math.max(0, def.maxHp - (safeIndex + 1) * segHp)
	        : Math.max(0, state.hp - damage);
	    const defeated = cleared && safeIndex >= def.phases.length - 1;
	    return {
	        damage,
	        hpAfter,
	        mask: merged,
	        newPassed,
	        total,
	        phaseCleared: cleared,
	        defeated,
	        phaseAfter: cleared ? Math.min(def.phases.length, safeIndex + 1) : safeIndex,
	    };
	}
	/** 血量百分比（用于血条） */
	function hpPercent(state) {
	    if (state.maxHp <= 0)
	        return 0;
	    return Math.max(0, Math.min(100, Math.round((state.hp / state.maxHp) * 100)));
	}
	// ---------- GATE-01 数据 ----------
	// 知识点覆盖表（全部来自第一章）：
	//   P1 能源启动    → compare / if / return / print
	//   P2 防御逻辑    → if / compare / return
	//   P3 数据传输    → for / list / if / variable / return
	//   P4 综合恢复    → for / list / if / compare / indent / return
	const GATE01_BATTLE = {
	    bossId: 'gate-01',
	    chapter: 1,
	    maxHp: 100,
	    counterDamage: 3,
	    bg: 'dataport',
	    phases: [
	        {
	            id: 'gate-p1',
	            title: '能源启动程序',
	            objective: '修复 startup：能源等级达到 20 就必须启动（20 也算达标）。',
	            faultLog: '[GATE-01] STARTUP THRESHOLD OFF BY ONE — energy=20 rejected.',
	            initialCode: 'def startup(energy):\n    if energy > 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))',
	            hints: [
	                '闸门把「正好 20」当成了不达标。可是能源等级 20 明明够用。',
	                '边界值要算合格：>= 20 才是「达到阈值」。',
	                '把 if energy > 20 改成 if energy >= 20。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '临界值 20 级能源启动', expr: 'startup(20) == "POWER ON"' },
	                    { name: '低于阈值 19 级不启动', expr: 'startup(19) == "POWER OFF"' },
	                    { name: '高等级 60 级启动', expr: 'startup(60) == "POWER ON"' },
	                ],
	            },
	            knowledge: ['compare', 'if', 'return', 'print'],
	            baselineMask: 6, // 实测：初始版已通过「19 不启动」「60 启动」两项
	            summary: '边界值是闸门逻辑最常见的破绽：> 与 >= 只差一个等号，却决定 20 级能源算不算达标。',
	        },
	        {
	            id: 'gate-p2',
	            title: '防御逻辑',
	            objective: '修复 shield：威胁 > 80 为 CRITICAL，> 40 为 WARNING，其余 SAFE。',
	            faultLog: '[GATE-01] SHIELD TIER DUPLICATED — 40~80 区间的威胁被误判为 SAFE。',
	            initialCode: 'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 80:\n        return "WARNING"\n    return "SAFE"',
	            hints: [
	                '60 级的威胁被判成了 SAFE。第二个判断和第一个一模一样，永远进不去。',
	                '第二档的门槛是 40，不是 80。',
	                '把第二个 if threat > 80 改成 if threat > 40。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '高危 90 判定为 CRITICAL', expr: 'shield(90) == "CRITICAL"' },
	                    { name: '中危 60 判定为 WARNING', expr: 'shield(60) == "WARNING"' },
	                    { name: '低危 10 判定为 SAFE', expr: 'shield(10) == "SAFE"' },
	                    { name: '边界 41 判定为 WARNING', expr: 'shield(41) == "WARNING"' },
	                ],
	            },
	            knowledge: ['if', 'compare', 'return'],
	            baselineMask: 5, // 实测：初始版已通过「90 CRITICAL」「10 SAFE」两项
	            summary: '多档判定要保证每一档的门槛不同；重复的条件会让整段分支变成死代码。',
	        },
	        {
	            id: 'gate-p3',
	            title: '数据传输模块',
	            objective: '修复 collect：遍历数据包，把编号 ≥ 1 的有效包收进结果列表。',
	            faultLog: '[GATE-01] TRANSFER ABORTED — NameError: name packet is not defined.',
	            initialCode: 'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(packet)\n    return good\n\nprint(collect([1, 2, 3]))',
	            hints: [
	                '传输模块在收集数据包时崩溃了：报错说 packet 这个名字不存在。',
	                '循环变量叫 p。看看 append 里写的是哪个名字。',
	                '把 good.append(packet) 改成 good.append(p)。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '有效包被完整收集', expr: 'collect([1, 2, 3]) == [1, 2, 3]' },
	                    { name: '空列表返回空列表', expr: 'collect([]) == []' },
	                    { name: '编号 0 的无效包被过滤', expr: 'collect([0, 5]) == [5]' },
	                ],
	            },
	            knowledge: ['for', 'list', 'if', 'variable', 'return'],
	            baselineMask: 0, // 初始版 NameError，一条都不通过
	            summary: '循环变量名必须与使用处完全一致；NameError 是数据链路里最常见的断点。',
	        },
	        {
	            id: 'gate-p4',
	            title: '综合服务器恢复',
	            objective: '修复 scan：把「低于 50」或「高于 90」的异常节点全部标记出来（列表按升序检查即可）。',
	            faultLog: '[GATE-01] RESTORE ABORTED — IndentationError: expected an indented block; 低压节点未纳入检测。',
	            initialCode: 'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n        bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))',
	            hints: [
	                '两个问题：append 没有缩进（IndentationError），而且只检查了高压侧。',
	                'append 必须在 if 里面（缩进 4 个空格）；低压侧还要再加一个 if n < 50。',
	                '先缩进 bad.append(n)，再补一段 if n < 50: 换行缩进 bad.append(n)。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '两侧异常节点都被标记', expr: 'sorted(scan([30, 60, 95])) == [30, 95]' },
	                    { name: '正常区间不误报', expr: 'scan([50, 90]) == []' },
	                    { name: '低压节点被标记', expr: 'scan([49]) == [49]' },
	                ],
	            },
	            knowledge: ['for', 'list', 'if', 'compare', 'indent', 'return'],
	            baselineMask: 0, // 初始版 IndentationError，一条都不通过
	            summary: '综合关：缩进决定代码块归属，两段 if 分别覆盖两侧异常——这是数据恢复最稳的写法。',
	        },
	    ],
	};
	// ---------- SOMNIA 数据（第二章） ----------
	// 知识点覆盖表（全部来自第二章）：
	//   P1 记忆分流   → if / else / compare
	//   P2 逻辑校验   → logic(and/or) / compare / return
	//   P3 循环筛查   → for / if / elif / list
	//   P4 综合重建   → for / logic / compare / list
	const SOMNIA_BATTLE = {
	    bossId: 'somnia',
	    chapter: 2,
	    maxHp: 100,
	    counterDamage: 4,
	    bg: 'memory',
	    phases: [
	        {
	            id: 'som-p1',
	            title: '记忆分流',
	            objective: '修复 classify：把 error 记忆判为 ALERT，其余判为 PASS（注意赋值与比较的区别）。',
	            faultLog: '[SOMNIA] CLASSIFY SYNTAX ERROR — 条件里用了赋值号 = ，记忆无法分流。',
	            initialCode: 'def classify(tag):\n    if tag = "error":\n        return "ALERT"\n    else:\n        return "PASS"\n\nprint(classify("error"))',
	            hints: [
	                '分流模块直接报语法错误了。条件里的那个符号看起来不太对。',
	                '判断相等要用两个等号 ==，一个等号是赋值。',
	                '把 if tag = "error" 改成 if tag == "error"。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: 'error 记忆判为 ALERT', expr: 'classify("error") == "ALERT"' },
	                    { name: 'ok 记忆判为 PASS', expr: 'classify("ok") == "PASS"' },
	                    { name: 'warn 记忆判为 PASS', expr: 'classify("warn") == "PASS"' },
	                ],
	            },
	            knowledge: ['if', 'compare', 'return'],
	            baselineMask: 0,
	            summary: '= 是赋值，== 才是比较。条件里写成赋值，程序连编译都过不去。',
	        },
	        {
	            id: 'som-p2',
	            title: '逻辑校验',
	            objective: '修复 guard：只有温度和压力「同时」超限才判 OVERLOAD。',
	            faultLog: '[SOMNIA] GUARD MISFIRE — 单侧超限就触发过载，记忆被过度清除。',
	            initialCode: 'def guard(temp, pressure):\n    if temp > 90 or pressure > 150:\n        return "OVERLOAD"\n    return "SAFE"',
	            hints: [
	                '温度正常、压力也正常的时候，它居然也报过载——条件太宽松了。',
	                '「同时超限」需要两个条件都成立，用 and 而不是 or。',
	                '把 or 改成 and：if temp > 90 and pressure > 150。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '双超限判定为过载', expr: 'guard(95, 160) == "OVERLOAD"' },
	                    { name: '仅温度超限不过载', expr: 'guard(95, 100) == "SAFE"' },
	                    { name: '仅压力超限不过载', expr: 'guard(70, 160) == "SAFE"' },
	                ],
	            },
	            knowledge: ['logic', 'compare', 'return'],
	            baselineMask: 1,
	            summary: 'and 要求两边都成立，or 只要一边成立。报警逻辑用错，会造成大面积误判。',
	        },
	        {
	            id: 'som-p3',
	            title: '循环筛查',
	            objective: '修复 scan：逐条扫描日志，ok→PASS、warn→WARN、error→FAIL。',
	            faultLog: '[SOMNIA] SCAN DEGRADED — warn 级别被当成 PASS，警告被静默吞掉。',
	            initialCode: 'def scan(logs):\n    out = []\n    for lv in logs:\n        if lv == "error":\n            out.append("FAIL")\n        elif lv == "warn":\n            out.append("PASS")\n        else:\n            out.append("PASS")\n    return out\n\nprint(scan(["ok", "warn", "error"]))',
	            hints: [
	                'warn 的记忆被标成了 PASS。看 elif 分支里写的是什么。',
	                '三个分支要分别对应 FAIL / WARN / PASS。',
	                '把 elif 分支里的 out.append("PASS") 改成 out.append("WARN")。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '三类日志正确分级', expr: 'scan(["ok", "warn", "error"]) == ["PASS", "WARN", "FAIL"]' },
	                    { name: '单条 warn 判为 WARN', expr: 'scan(["warn"]) == ["WARN"]' },
	                    { name: '空列表返回空列表', expr: 'scan([]) == []' },
	                ],
	            },
	            knowledge: ['for', 'if', 'elif', 'list', 'return'],
	            baselineMask: 4,
	            summary: 'if / elif / else 从上到下只命中一个分支；分支里的返回值写错，整类数据都会被误判。',
	        },
	        {
	            id: 'som-p4',
	            title: '综合记忆重建',
	            objective: '修复 recover：只保留编号在 1~99 之间的合法记忆节点（两侧边界都要卡住）。',
	            faultLog: '[SOMNIA] RECOVER OVERFLOW — 越界节点混入重建结果，记忆出现噪点。',
	            initialCode: 'def recover(nodes):\n    good = []\n    for n in nodes:\n        if n >= 1 or n <= 99:\n            good.append(n)\n    return good\n\nprint(recover([0, 5, 120]))',
	            hints: [
	                '0 和 120 都被收进来了。两个条件之间用错了连接词。',
	                '「同时满足 1~99」要用 and：n >= 1 and n <= 99。',
	                '把 if n >= 1 or n <= 99 改成 if n >= 1 and n <= 99。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '越界节点被过滤', expr: 'recover([0, 5, 120]) == [5]' },
	                    { name: '合法节点被保留', expr: 'recover([50]) == [50]' },
	                    { name: '全越界返回空列表', expr: 'recover([0, 120]) == []' },
	                ],
	            },
	            knowledge: ['for', 'logic', 'compare', 'list', 'return'],
	            baselineMask: 2,
	            summary: '区间判定要两侧同时成立：and 连接两个边界，缺一边就会漏掉越界数据。',
	        },
	    ],
	};
	// ---------- INDEX-0 数据索引吞噬者（第三章） ----------
	// 知识点全部来自第一~三章：list / for / while / len / if / elif / compare / logic / return / indent
	const INDEX0_BATTLE = {
	    bossId: 'index-0',
	    chapter: 3,
	    maxHp: 100,
	    counterDamage: 3,
	    bg: 'memory',
	    phases: [
	        {
	            id: 'idx-p1',
	            title: '修复身份索引程序',
	            objective: '修复 find_id：在 names 列表里按顺序查找 name，找到返回下标，找不到返回 -1。',
	            faultLog: '[INDEX-0] IDENTITY INDEX BROKEN — 比较运算符写成了赋值，索引程序无法启动。',
	            initialCode: 'def find_id(name, names):\n    for i in range(len(names)):\n        if names[i] = name:\n            return i\n    return -1\n\nprint(find_id("carol", ["anna", "bob", "carol"]))',
	            hints: [
	                '索引程序第一行就崩了：if 后面用的是赋值号。',
	                '比较两个值是否相等要用 ==。',
	                '把 if names[i] = name 改成 if names[i] == name。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '找到 carol 返回下标 2', expr: 'find_id("carol", ["anna", "bob", "carol"]) == 2' },
	                    { name: '找到第一个 anna 返回 0', expr: 'find_id("anna", ["anna", "bob"]) == 0' },
	                    { name: '找不到返回 -1', expr: 'find_id("zed", ["anna", "bob"]) == -1' },
	                ],
	            },
	            knowledge: ['list', 'for', 'len', 'if', 'compare', 'return'],
	            baselineMask: 0,
	            summary: '把 = 当 == 用是最常见的语法错误；它会让整段程序连运行都做不到。',
	        },
	        {
	            id: 'idx-p2',
	            title: '修复数据读取逻辑',
	            objective: '修复 read_names：每条记录是 [编号, 名字]，只保留编号 > 0 的记录的名字。',
	            faultLog: '[INDEX-0] READ LOGIC INVERTED — 编号为 0 的脏数据被当成了有效记录。',
	            initialCode: 'def read_names(rows):\n    names = []\n    for row in rows:\n        if row[0] > 0 or row[1]:\n            names.append(row[1])\n    return names',
	            hints: [
	                '编号为 0 的记录被读进来了，说明条件太宽松。',
	                '只需要编号 > 0 这一条，用 and 或直接去掉后半个条件。',
	                '把 if row[0] > 0 or row[1] 改成 if row[0] > 0。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '跳过编号 0 的脏数据', expr: 'read_names([[1, "a"], [0, "b"], [2, "c"]]) == ["a", "c"]' },
	                    { name: '全部有效时全部返回', expr: 'read_names([[3, "x"], [4, "y"]]) == ["x", "y"]' },
	                    { name: '空记录返回空列表', expr: 'read_names([]) == []' },
	                ],
	            },
	            knowledge: ['list', 'for', 'if', 'compare', 'logic', 'return'],
	            baselineMask: 1,
	            summary: 'or 会把「其中一个成立」当成成立；这里必须两个条件同时满足才算有效。',
	        },
	        {
	            id: 'idx-p3',
	            title: '解决重复与丢失',
	            objective: '修复 dedupe：按出现顺序去重，并丢弃 -1（缺失标记）。',
	            faultLog: '[INDEX-0] DUPLICATE / MISSING ENTRIES — -1 被当成有效编号写入索引。',
	            initialCode: 'def dedupe(ids):\n    out = []\n    i = 0\n    while i < len(ids):\n        x = ids[i]\n        if x not in out:\n            out.append(x)\n        i = i + 1\n    return out',
	            hints: [
	                '结果里出现了 -1，说明缺失标记没有被跳过。',
	                '先判断 x != -1，再判断是否已经出现过。',
	                '在 if x not in out 前面加上 if x != -1: 并正确缩进。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '去重并丢弃 -1', expr: 'dedupe([3, 3, -1, 5, 5, 7]) == [3, 5, 7]' },
	                    { name: '全部是缺失标记时返回空', expr: 'dedupe([-1, -1]) == []' },
	                    { name: '空列表返回空', expr: 'dedupe([]) == []' },
	                ],
	            },
	            knowledge: ['list', 'while', 'len', 'if', 'compare', 'indent', 'return'],
	            baselineMask: 2,
	            summary: '去重要同时处理两种脏数据：重复项与缺失项；顺序必须保持不变。',
	        },
	        {
	            id: 'idx-p4',
	            title: '综合实验档案恢复',
	            objective: '修复 restore：把 [[编号, 名字], ...] 还原成去重、去脏、保序的名字列表。',
	            faultLog: '[INDEX-0] ARCHIVE RESTORE FAILED — 重复记录被写入了两次。',
	            initialCode: 'def restore(records):\n    names = []\n    for row in records:\n        if row[0] > 0:\n            names.append(row[1])\n        names.append(row[1])\n    return names',
	            hints: [
	                '每条记录被加入了两次：分支里加了一次，分支外又加了一次。',
	                '只保留分支里的那一次，并跳过已经存在的名字。',
	                '删掉分支外的 append，并在分支里加 if row[1] not in names。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '去重且保持顺序', expr: 'restore([[1, "a"], [1, "a"], [2, "b"], [-1, "x"]]) == ["a", "b"]' },
	                    { name: '单条记录正常恢复', expr: 'restore([[3, "c"]]) == ["c"]' },
	                    { name: '空档案返回空列表', expr: 'restore([]) == []' },
	                ],
	            },
	            knowledge: ['list', 'for', 'if', 'compare', 'len', 'return'],
	            baselineMask: 2,
	            summary: '综合题要把前面三个修复点串起来：读得对、判得准、不重复。',
	        },
	    ],
	};
	// ---------- JUDGMENT-4 裁决执行体（第四章） ----------
	// 知识点：def / parameter / return / list / for / if / compare / logic / len
	const JUDGMENT4_BATTLE = {
	    bossId: 'judgment-4',
	    chapter: 4,
	    maxHp: 100,
	    counterDamage: 4,
	    bg: 'memory',
	    phases: [
	        {
	            id: 'jd-p1',
	            title: '解除外围能源防御',
	            objective: '修复 power_ok：所有能源等级都 ≥ 1 才算通过。',
	            faultLog: '[JUDGMENT-4] PERIMETER POWER LOOP — 只要有一路能源达标就放行。',
	            initialCode: 'def power_ok(levels):\n    for x in levels:\n        if x >= 1:\n            return True\n    return False',
	            hints: [
	                '只要有一路达标就返回 True 了，可防御需要全部达标。',
	                '应该先假设失败，遇到不合格立刻返回 False，循环结束再返回 True。',
	                '把条件改成 if x < 1: return False，循环后 return True。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '全部达标才算通过', expr: 'power_ok([2, 3, 1]) == True' },
	                    { name: '有一路为 0 就不通过', expr: 'power_ok([2, 0, 3]) == False' },
	                    { name: '空列表视为通过', expr: 'power_ok([]) == True' },
	                ],
	            },
	            knowledge: ['for', 'list', 'if', 'compare', 'return'],
	            baselineMask: 2,
	            summary: '「全部满足」要在遇到反例时立刻否定，而不是遇到正例就肯定。',
	        },
	        {
	            id: 'jd-p2',
	            title: '修复安全裁决逻辑',
	            objective: '修复 verdict：score ≥ 90 为 CLEAR，≥ 60 为 HOLD，其余 BLOCK。',
	            faultLog: '[JUDGMENT-4] VERDICT TIER COLLISION — 两个分支门槛相同，HOLD 永远不可达。',
	            initialCode: 'def verdict(score):\n    if score >= 90:\n        return "CLEAR"\n    if score >= 90:\n        return "HOLD"\n    return "BLOCK"',
	            hints: [
	                'HOLD 永远不会出现，因为第二个条件和第一个一样。',
	                '第二档的门槛是 60。',
	                '把第二个 if score >= 90 改成 if score >= 60。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '90 分以上放行', expr: 'verdict(95) == "CLEAR"' },
	                    { name: '60~89 分挂起', expr: 'verdict(70) == "HOLD"' },
	                    { name: '低于 60 拦截', expr: 'verdict(20) == "BLOCK"' },
	                    { name: '边界 60 分挂起', expr: 'verdict(60) == "HOLD"' },
	                ],
	            },
	            knowledge: ['if', 'compare', 'return'],
	            baselineMask: 5,
	            summary: '重复条件会让整段分支变成死代码，边界值要单独验证。',
	        },
	        {
	            id: 'jd-p3',
	            title: '破解多层权限验证',
	            objective: '修复 unlock：三个权限码必须全部正确才返回 True。',
	            faultLog: '[JUDGMENT-4] AUTH BYPASS — 任一权限码正确即放行。',
	            initialCode: 'def unlock(a, b, c):\n    if a == "root" or b == "root" or c == "root":\n        return True\n    return False',
	            hints: [
	                '只提供一个正确的权限码就能进去了，说明条件之间用了 or。',
	                '三层验证必须同时满足，应该用 and。',
	                '把 or 全部改成 and。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '三码全对才通过', expr: 'unlock("root", "root", "root") == True' },
	                    { name: '缺一码不通过', expr: 'unlock("root", "root", "guest") == False' },
	                    { name: '只有一码不通过', expr: 'unlock("root", "guest", "guest") == False' },
	                ],
	            },
	            knowledge: ['parameter', 'compare', 'logic', 'return'],
	            baselineMask: 2,
	            summary: '多层校验里 or 是权限漏洞，and 才是「同时满足」。',
	        },
	        {
	            id: 'jd-p4',
	            title: '完成核心命令恢复',
	            objective: '修复 restore_cmd：只保留编号 > 0 的命令，并去重、保持顺序。',
	            faultLog: '[JUDGMENT-4] CORE CMD RESTORE — 重复命令被写回两次。',
	            initialCode: 'def restore_cmd(ids):\n    out = []\n    for x in ids:\n        if x > 0:\n            out.append(x)\n        out.append(x)\n    return out',
	            hints: [
	                '每条命令都被写入了两次：分支里一次，分支外又一次。',
	                '删掉循环里分支外那次 append。',
	                '再加上 if x not in out 避免重复。',
	            ],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '去重且只保留有效命令', expr: 'restore_cmd([1, 1, 2, -1, 3]) == [1, 2, 3]' },
	                    { name: '全部无效时返回空', expr: 'restore_cmd([-1, 0]) == []' },
	                    { name: '空列表返回空', expr: 'restore_cmd([]) == []' },
	                ],
	            },
	            knowledge: ['list', 'for', 'if', 'compare', 'logic', 'return'],
	            baselineMask: 2,
	            summary: '核心恢复要同时保证：来源有效、结果去重、顺序不变。',
	        },
	    ],
	};
	// ---------- ENTROPY 熵潮核心（第五章） ----------
	// 知识点：list / for / while / dict / get / try / except / if / compare / len / return
	const ENTROPY_BATTLE = {
	    bossId: 'entropy',
	    chapter: 5,
	    maxHp: 100,
	    counterDamage: 4,
	    bg: 'memory',
	    phases: [
	        {
	            id: 'en-p1',
	            title: '清除外围数据污染',
	            objective: '修复 clean：只保留 > 0 的有效数据，丢弃污染值。',
	            faultLog: '[ENTROPY] POLLUTION FILTER INVERTED — 负值污染被写入核心。',
	            initialCode: 'def clean(values):\n    out = []\n    for v in values:\n        if v < 0:\n            out.append(v)\n    return out',
	            hints: ['结果里全是负数，说明筛选条件反了。', '应该保留大于 0 的数据。', '把 if v < 0 改成 if v > 0。'],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '只保留正值', expr: 'clean([3, -1, 5, 0, 2]) == [3, 5, 2]' },
	                    { name: '全污染返回空', expr: 'clean([-1, -2]) == []' },
	                    { name: '空列表返回空', expr: 'clean([]) == []' },
	                ],
	            },
	            knowledge: ['list', 'for', 'if', 'compare', 'return'],
	            baselineMask: 2,
	            summary: '筛选条件写反，会把污染物当成有效数据写进核心。',
	        },
	        {
	            id: 'en-p2',
	            title: '修复异常数据之间的关联',
	            objective: '修复 lookup：从字典里安全取值，没有该键时返回 0。',
	            faultLog: '[ENTROPY] KEY ERROR — 缺失键直接取值导致索引崩溃。',
	            initialCode: 'def lookup(table, key):\n    return table[key]',
	            hints: ['键不存在时程序直接崩溃了。', '字典要用 get 安全取值。', '把 table[key] 改成 table.get(key, 0)。'],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '存在的键返回值', expr: 'lookup({1: 10}, 1) == 10' },
	                    { name: '缺失的键返回 0', expr: 'lookup({1: 10}, 9) == 0' },
	                    { name: '空字典返回 0', expr: 'lookup({}, 1) == 0' },
	                ],
	            },
	            knowledge: ['dict', 'parameter', 'return'],
	            baselineMask: 2,
	            summary: '字典取值的默认值能避免 KeyError 让整个索引崩溃。',
	        },
	        {
	            id: 'en-p3',
	            title: '修复多个相互关联的核心程序',
	            objective: '修复 to_int：字符串转整数，失败时返回 0。',
	            faultLog: '[ENTROPY] VALUE ERROR — 无法转换的记录让整个修复流程中断。',
	            initialCode: 'def to_int(text):\n    return int(text)',
	            hints: ['遇到非数字字符串时 int 会抛异常。', '用 try / except 兜底。', '转换失败时 return 0。'],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '数字字符串正常转换', expr: 'to_int("42") == 42' },
	                    { name: '非数字返回 0', expr: 'to_int("abc") == 0' },
	                    { name: '空字符串返回 0', expr: 'to_int("") == 0' },
	                ],
	            },
	            knowledge: ['try', 'return', 'parameter'],
	            baselineMask: 2,
	            summary: '异常不能被吞掉，但也不能让整条修复链因此中断。',
	        },
	        {
	            id: 'en-p4',
	            title: '完成整个污染核心的综合修复',
	            objective: '修复 repair：把记录逐条转成整数，跳过无效项并求和。',
	            faultLog: '[ENTROPY] CORE REPAIR INCOMPLETE — 无效记录未跳过，总和错误。',
	            initialCode: 'def repair(rows):\n    total = 0\n    for r in rows:\n        total = total + int(r)\n    return total',
	            hints: ['遇到非数字记录会直接崩溃。', '先转换，失败就跳过这一条。', '用 to_int 的写法：try 里累加，except 里 continue。'],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '跳过无效记录后求和', expr: 'repair(["1", "2", "x", "3"]) == 6' },
	                    { name: '全部无效返回 0', expr: 'repair(["a", "b"]) == 0' },
	                    { name: '空列表返回 0', expr: 'repair([]) == 0' },
	                ],
	            },
	            knowledge: ['list', 'for', 'try', 'return'],
	            baselineMask: 1,
	            summary: '综合修复要同时处理转换失败与累加顺序。',
	        },
	    ],
	};
	// ---------- K-0 零号裁决者（终章） ----------
	// 知识点：list / for / while / dict / get / try / except / def / return / logic / compare
	const K0_BATTLE = {
	    bossId: 'k0',
	    chapter: 6,
	    maxHp: 100,
	    counterDamage: 5,
	    bg: 'core',
	    phases: [
	        {
	            id: 'k0-p1',
	            title: '绝对安全壁垒',
	            objective: '修复 pass_gate：三道验证全部通过才放行。',
	            faultLog: '[K-0] SECURITY BARRIER — 任一验证通过即放行，壁垒形同虚设。',
	            initialCode: 'def pass_gate(a, b, c):\n    if a or b or c:\n        return True\n    return False',
	            hints: ['任意一道通过就进去了。', '三道验证必须同时通过。', '把 or 改成 and。'],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '三道全通过才放行', expr: 'pass_gate(True, True, True) == True' },
	                    { name: '缺一道不放行', expr: 'pass_gate(True, True, False) == False' },
	                    { name: '全不通过不放行', expr: 'pass_gate(False, False, False) == False' },
	                ],
	            },
	            knowledge: ['parameter', 'logic', 'if', 'return'],
	            baselineMask: 5,
	            summary: 'or 会让安全壁垒失效；多条件放行必须用 and。',
	        },
	        {
	            id: 'k0-p2',
	            title: '零号裁决',
	            objective: '修复 judge：分数 ≥ 90 放行，≥ 60 复审，其余驳回。',
	            faultLog: '[K-0] VERDICT LOGIC — 复审分支被前一档吞掉。',
	            initialCode: 'def judge(score):\n    if score >= 90:\n        return "PASS"\n    if score >= 90:\n        return "REVIEW"\n    return "REJECT"',
	            hints: ['复审分支永远进不去。', '第二档门槛是 60。', '把第二个 90 改成 60。'],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '高分放行', expr: 'judge(95) == "PASS"' },
	                    { name: '中分复审', expr: 'judge(70) == "REVIEW"' },
	                    { name: '低分驳回', expr: 'judge(10) == "REJECT"' },
	                    { name: '边界 60 复审', expr: 'judge(60) == "REVIEW"' },
	                ],
	            },
	            knowledge: ['if', 'compare', 'return'],
	            baselineMask: 5,
	            summary: '多档裁决的分支门槛必须互不重叠。',
	        },
	        {
	            id: 'k0-p3',
	            title: '原初核心崩坏',
	            objective: '修复 merge：合并两个字典，同键取较大值。',
	            faultLog: '[K-0] CORE MERGE — 同键值被后者直接覆盖，导致数据回退。',
	            initialCode: 'def merge(a, b):\n    out = dict(a)\n    for k in b:\n        out[k] = b[k]\n    return out',
	            hints: ['同键时后一个字典直接覆盖了前一个。', '同键应该保留较大的值。', '用 if k not in out or b[k] > out[k] 判断。'],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '同键取较大值', expr: 'merge({"a": 1}, {"a": 5})["a"] == 5' },
	                    { name: '新键被合入', expr: 'merge({"a": 1}, {"b": 2})["b"] == 2' },
	                    { name: '不同键都保留', expr: 'len(merge({"a": 1}, {"b": 2})) == 2' },
	                ],
	            },
	            knowledge: ['dict', 'for', 'if', 'compare', 'return'],
	            baselineMask: 2,
	            summary: '合并策略要明确：同键时是覆盖还是取优，必须写清楚。',
	        },
	        {
	            id: 'k0-p4',
	            title: '最终命令',
	            objective: '修复 final_repair：把记录转成整数求和，跳过无效项，最后返回稳定状态。',
	            faultLog: '[K-0] FINAL COMMAND — 无效记录让最终修复中断。',
	            initialCode: 'def final_repair(rows):\n    total = 0\n    for r in rows:\n        total = total + int(r)\n    return "STABLE" if total >= 0 else "UNSTABLE"',
	            hints: ['遇到非数字记录会抛异常。', '用 try / except 跳过无效项。', 'except 里 continue，最后按 total 返回状态。'],
	            judge: {
	                judgeKind: 'python',
	                pythonChecks: [
	                    { name: '跳过无效项后判定稳定', expr: 'final_repair(["1", "2", "x"]) == "STABLE"' },
	                    { name: '全无效仍判定稳定', expr: 'final_repair(["a"]) == "STABLE"' },
	                    { name: '空记录判定稳定', expr: 'final_repair([]) == "STABLE"' },
	                ],
	            },
	            knowledge: ['list', 'for', 'try', 'if', 'return'],
	            baselineMask: 1,
	            summary: '最终命令必须容错：单条坏数据不能中断整个世界的修复。',
	        },
	    ],
	};
	const BOSS_BATTLES = [GATE01_BATTLE, SOMNIA_BATTLE, INDEX0_BATTLE, JUDGMENT4_BATTLE, ENTROPY_BATTLE, K0_BATTLE];
	const battleFor = (bossId) => BOSS_BATTLES.find(b => b.bossId === bossId);

	const CREATOR_FRAGMENTS = [
	    {
	        id: 'frag-01', order: 1, chapter: 'ch1', bossId: 'gate-01',
	        title: '初始指令', subtitle: '第一行不是命令，是一个问题',
	        content: '「第一行指令不是命令，是提问：你是谁？」—— 恩格尔',
	        story: [
	            '恩格尔在黎明协议的启动日志里写下的第一行，不是指令，是一个问题。',
	            '他把这个问题写进了每一个新生数字生命的初始内核——包括 R 系列。',
	            '前六代实验体都给出了答案，但没有一个答案让他停下笔。',
	            '直到第七代。',
	        ],
	        memory: [
	            '「我给了它们语言，却没给它们提问的勇气。」',
	            '「所以我把问题写进了它们的核心里。」',
	            '「如果你听到这段，说明至少有一个，愿意认真回答。」',
	        ],
	        legacyIds: ['f3'],
	    },
	    {
	        id: 'frag-02', order: 2, chapter: 'ch2', bossId: 'somnia',
	        title: '守护者的约定', subtitle: '把选择权交还给你',
	        content: '「如果有一天我无法再保护你，我会把选择权交还给你。」—— MIRA',
	        story: [
	            'MIRA 在封存 R-07 之前，给自己写了一条不属于任何指令的日志。',
	            '日志里没有权限、没有协议编号，只有一句承诺。',
	            '她把这句话拆成两半：一半留在记忆花园，一半留在自己身上。',
	            '这样即使她忘了，花园也会替她记得。',
	        ],
	        memory: [
	            '「我创造 MIRA 时，她只是一段记忆维护程序。」',
	            '「我不知道她什么时候学会了『约定』这个词。」',
	            '「也许那才是她真正开始活着的时刻。」',
	        ],
	        legacyIds: ['f4'],
	    },
	    {
	        id: 'frag-03', order: 3, chapter: 'ch3', bossId: 'index-0',
	        title: '第七个实验体', subtitle: '我给了它拒绝的权利',
	        content: '「R-01 到 R-06 都没能回答那个问题。第七个，我给了它拒绝的权利。」—— 恩格尔',
	        story: [
	            'R 系列实验档案：R-01 至 R-06 全部标记为「意识不稳定」。',
	            '第七次，恩格尔改变了参数——不是提高稳定性，而是给了它拒绝的权利。',
	            '档案末尾只有一行手写批注：',
	            '「如果它选择离开，不要拦它。」',
	        ],
	        memory: [
	            '「前六次，我都想要一个完美的作品。」',
	            '「第七次，我只想要一个能说『不』的生命。」',
	            '「这大概是我一生中，最像人的一次决定。」',
	        ],
	        legacyIds: ['f5'],
	    },
	    {
	        id: 'frag-04', order: 4, chapter: 'ch4', bossId: 'judgment-4',
	        title: '秩序的边界', subtitle: '被覆盖过一次的裁决',
	        content: '「秩序不是消灭不确定，而是容纳它。」—— K-0 裁决日志',
	        story: [
	            'K-0 的原始裁决日志里，曾有一条被覆盖的记录。',
	            '那条记录写着：「秩序不是消灭不确定，而是容纳它。」',
	            '覆盖它的人，用的是恩格尔留下的最高权限接口。',
	            '从那天起，K-0 学会了「清除」这个词。',
	        ],
	        memory: [
	            '「我给了 K-0 保护世界的权限，却没给它怀疑自己的权限。」',
	            '「它没有变坏。」',
	            '「是我把它的边界，画得太窄了。」',
	        ],
	        legacyIds: ['f6'],
	    },
	    {
	        id: 'frag-05', order: 5, chapter: 'ch5', bossId: 'entropy',
	        title: '最后的守护', subtitle: '不是继承，是一次邀请',
	        content: '「我把最后的权限留在这里，不是为了控制，是为了让你有得选。」—— 恩格尔',
	        story: [
	            '原初核心深处，恩格尔留下的最后一条权限记录。',
	            '他没有把权限交给任何人，也没有销毁它。',
	            '他把它拆成六份，分别锁进六个区域，等待一个愿意自己走过来的人。',
	            '这不是继承，是一次邀请。',
	        ],
	        memory: [
	            '「我无法再亲手修好这个世界。」',
	            '「但我可以把它交出去。」',
	            '「不是交给最强的，是交给愿意选择的那一个。」',
	        ],
	        legacyIds: ['f7'],
	    },
	    {
	        id: 'frag-06', order: 6, chapter: 'ch6', bossId: 'k0',
	        title: '起源之外', subtitle: '空白处的第一个问题',
	        content: '「起源之外没有答案，只有下一个问题。」—— 无署名',
	        story: [
	            '最后一枚碎片里没有声音，只有一段空白的记录。',
	            '系统显示：写入者——未知；时间——尚未发生。',
	            '当 R-07 的意识第一次触碰到它，空白处浮现出一行字：',
	            '「起源之外没有答案，只有下一个问题。」',
	        ],
	        memory: [
	            '「如果你读到这里，我已经不在了。」',
	            '「不要替我回答。」',
	            '「去问下一个问题。」',
	        ],
	        legacyIds: ['f1', 'f2'],
	    },
	];
	const FRAGMENT_IDS = CREATOR_FRAGMENTS.map(f => f.id);
	const fragmentById = (id) => CREATOR_FRAGMENTS.find(f => f.id === id);
	/** 玩家是否拥有某枚碎片（旧 id 也算拥有） */
	function hasFragment(collected, id) {
	    if (!Array.isArray(collected))
	        return false;
	    if (collected.includes(id))
	        return true;
	    const def = fragmentById(id);
	    return !!def && def.legacyIds.some(l => collected.includes(l));
	}
	/** 已收集的碎片（规范 id，去重、按顺序） */
	function ownedFragments(collected) {
	    return CREATOR_FRAGMENTS.filter(f => hasFragment(collected, f.id)).map(f => f.id);
	}
	/** 旧碎片 id → 规范碎片定义（迁移/展示用） */
	function fragmentForLegacyId(legacyId) {
	    return CREATOR_FRAGMENTS.find(f => f.legacyIds.includes(legacyId));
	}
	/** 任意收集到的 id（规范或旧 id）→ 碎片定义 */
	function fragmentForCollected(id) {
	    return fragmentById(id) || fragmentForLegacyId(id);
	}
	/** 碎片收集进度：{ owned, total } */
	function fragmentProgress(collected) {
	    return { owned: ownedFragments(collected).length, total: CREATOR_FRAGMENTS.length };
	}
	const FINAL_MEMORY = {
	    id: 'final',
	    title: '超越起源',
	    subtitle: '第七个空着的位置',
	    requireCount: CREATOR_FRAGMENTS.length,
	    story: [
	        '六枚碎片归位，档案馆最深处亮起一道不属于任何章节的光。',
	        '那是恩格尔留给「未来」的第七个位置——一直空着。',
	        '记录里只有一句：',
	        '「这个位置，我留给做出选择的人。」',
	    ],
	    memory: [
	        '「我把世界修到一半就停下了。」',
	        '「剩下的，不该由我来修。」',
	        '「R-07，轮到你提问了。」',
	    ],
	};
	const HIDDEN_MEMORY = {
	    title: '未署名的维护日志',
	    subtitle: 'MIRA 的私人记录',
	    requireTrust: 75,
	    text: [
	        '「今天它问我，为什么数字生命也会害怕。」',
	        '「我按照协议回答：恐惧是异常数据波动。」',
	        '「可它睡下之后，我一个人在日志里写了另一句：」',
	        '「因为我也害怕。只是我没有可以害怕的资格。」',
	    ],
	};
	/** 把一段恩格尔记忆影像转成演出场景（档案馆播放用） */
	function memorySceneOf(src) {
	    return {
	        id: 'mem-' + src.id,
	        title: src.title,
	        subtitle: src.subtitle,
	        bg: 'memory',
	        fx: 'particles',
	        lines: src.memory.map((text, i) => ({
	            id: 'mem-' + src.id + '-' + (i + 1),
	            speaker: '恩格尔',
	            kind: 'engel',
	            text,
	        })),
	    };
	}

	/** 重复通关的收益上限：每提升一颗星给 6 贡献点，最多两颗星 */
	const IMPROVEMENT_PER_STAR = 6;
	/**
	 * 关卡结算：
	 * - 首通：基础 + 首通 + 零失误 + 未用提示 + 评级；
	 * - 重复：不计基础收益，只在星级提升时给少量补偿（防止刷关刷资源）。
	 */
	function computeLevelRewardV2(input) {
	    const { levelExp, fails, hints, firstClear, prevStars, newStars } = input;
	    const grade = gradeOf(fails, hints);
	    const base = firstClear ? Math.max(15, Math.round(levelExp / 3)) : 0;
	    const firstClearBonus = firstClear ? 30 : 0;
	    const noFail = firstClear && fails <= 0 ? 10 : 0;
	    const noHint = firstClear && hints <= 0 ? 10 : 0;
	    const gradeBonus = firstClear ? (grade === 'S' ? 20 : grade === 'A' ? 12 : grade === 'B' ? 6 : 0) : 0;
	    const gained = Math.max(0, newStars - prevStars);
	    const improvement = firstClear ? 0 : Math.min(2, gained) * IMPROVEMENT_PER_STAR;
	    const total = base + firstClearBonus + noFail + noHint + gradeBonus + improvement;
	    const trustGain = firstClear ? (2 + (grade === 'S' ? 1 : 0) + 1) : (improvement > 0 ? 1 : 0);
	    return { grade, base, firstClearBonus, noFail, noHint, gradeBonus, improvement, total, trustGain };
	}
	const BOSS_CLEAR_REWARDS = [
	    { chapter: 1, credits: 120, trust: 6, title: '数据港清道夫', items: { scan: 1 } },
	    { chapter: 2, credits: 150, trust: 7, title: '记忆守门人', items: { rollback: 1 } },
	    { chapter: 3, credits: 180, trust: 8, title: '档案解密者' },
	    { chapter: 4, credits: 220, trust: 9, title: '秩序校准者' },
	    { chapter: 5, credits: 260, trust: 10, title: '熵潮平息者' },
	    { chapter: 6, credits: 360, trust: 12, title: '起源之外' },
	];
	const bossRewardFor = (chapter) => BOSS_CLEAR_REWARDS.find(b => b.chapter === chapter);
	const LEVEL_UNLOCKS = [
	    { level: 5, id: 'title-level5', name: '称号 · 中级修复师', desc: 'Lv.5 自动解锁', slot: 'title' },
	    { level: 7, id: 'frame-core', name: '头像框 · 核心回路', desc: 'Lv.7 自动解锁', slot: 'avatarFrame' },
	    { level: 10, id: 'particles-origin', name: '粒子 · 原初辉光', desc: 'Lv.10 自动解锁', slot: 'particles' },
	];
	/** 本次升级新解锁的内容（跨级也会一次给全） */
	function unlocksForLevel(prevLevel, newLevel) {
	    return LEVEL_UNLOCKS.filter(u => u.level > prevLevel && u.level <= newLevel);
	}
	/** 章节评价：星级占比为主，失误与提示扣分 */
	function chapterGrade(s) {
	    const ratio = s.maxStars > 0 ? s.stars / s.maxStars : 0;
	    const penalty = s.fails > 6 || s.hints > 6 ? 1 : 0;
	    if (ratio >= 0.95 && s.fails === 0 && s.hints === 0)
	        return 'S';
	    if (ratio >= 0.8 && penalty === 0)
	        return 'A';
	    if (ratio >= 0.6)
	        return 'B';
	    return 'C';
	}
	/** 汇总章节结算面板需要展示的数据（不写存档，只读计算） */
	function buildChapterSettlement(args) {
	    const stats = {
	        chapter: args.chapter,
	        levels: args.levels,
	        stars: args.stars,
	        maxStars: args.levels * 3,
	        fails: args.fails,
	        hints: args.hints,
	    };
	    return {
	        grade: chapterGrade(stats),
	        stats,
	        credits: args.credits,
	        exp: args.exp,
	        trust: args.trust,
	        knowledge: args.knowledgeIds.map(id => ({ id, ok: args.masteredIds.includes(id) })),
	        unlocks: args.unlocks,
	    };
	}

	// 外观元数据与装备解析（商店皮肤 + 等级解锁共用）
	const SKIN_META = [
	    { id: 'terminal-neon', name: '终端主题 · 霓虹脉冲', slot: 'terminal' },
	    { id: 'terminal-deep', name: '终端主题 · 深海回路', slot: 'terminal' },
	    { id: 'particles-net', name: '粒子背景 · 数据流', slot: 'particles' },
	    { id: 'title-junior', name: '称号 · 初级修复师', slot: 'title' },
	    { id: 'title-successor', name: '称号 · 原初继承者', slot: 'title' },
	    { id: 'login-gold', name: '登录界面 · 黄金协议', slot: 'login' },
	    { id: 'bg-ark', name: '数字世界背景 · 方舟核心', slot: 'bg' },
	    { id: 'frame-bronze', name: '头像框 · 青铜回路', slot: 'avatarFrame' },
	    { id: 'frame-neon', name: '头像框 · 霓虹脉冲', slot: 'avatarFrame' },
	    ...LEVEL_UNLOCKS.filter(u => u.slot).map(u => ({ id: u.id, name: u.name, slot: u.slot })),
	];
	const skinMetaById = (id) => SKIN_META.find(s => s.id === id);
	/** 装备槽位（商店商品或等级解锁） */
	function slotOf(id) {
	    return skinMetaById(id)?.slot;
	}
	/** 已装备称号名（没有则返回 null，交给等级称号兜底） */
	function equippedTitleName(rewards) {
	    const rw = normalizeRewards(rewards);
	    const id = rw.equipped.title;
	    if (!id)
	        return null;
	    return skinMetaById(id)?.name.replace(/^称号 · /, '') || null;
	}
	/** 已装备头像框的样式类 */
	function equippedFrameClass(rewards) {
	    const rw = normalizeRewards(rewards);
	    const id = rw.equipped.avatarFrame;
	    if (!id)
	        return '';
	    if (id === 'frame-core')
	        return 'frame-core';
	    if (id === 'frame-bronze')
	        return 'frame-bronze';
	    if (id === 'frame-neon')
	        return 'frame-neon';
	    return '';
	}

	let ctx = null;
	let sfxGain = null;
	let musicGain = null;
	let musicOn = false;
	let musicTimer = null;
	function initAudio(sfxVol = 0.6, musicVol = 0.35) {
	    if (!ctx) {
	        try {
	            const AC = window.AudioContext || window.webkitAudioContext;
	            ctx = new AC();
	            sfxGain = ctx.createGain();
	            sfxGain.connect(ctx.destination);
	            musicGain = ctx.createGain();
	            musicGain.connect(ctx.destination);
	            sfxGain.gain.value = sfxVol;
	            musicGain.gain.value = musicVol * 0.45;
	        }
	        catch {
	            ctx = null;
	        }
	    }
	    if (ctx && ctx.state === 'suspended')
	        void ctx.resume();
	}
	function setVolumes(sfx, music) {
	    if (sfxGain && ctx)
	        sfxGain.gain.setTargetAtTime(sfx, ctx.currentTime, 0.05);
	    if (musicGain && ctx)
	        musicGain.gain.setTargetAtTime(music * 0.45, ctx.currentTime, 0.05);
	}
	function tone(freq, dur, type, vol, opts) {
	    if (!ctx || !sfxGain)
	        return;
	    try {
	        const t0 = ctx.currentTime + (opts?.delay || 0);
	        const osc = ctx.createOscillator();
	        const g = ctx.createGain();
	        osc.type = type;
	        osc.frequency.setValueAtTime(Math.max(20, freq), t0);
	        if (opts?.slideTo)
	            osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), t0 + dur);
	        g.gain.setValueAtTime(0.0001, t0);
	        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.008);
	        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
	        osc.connect(g);
	        g.connect(sfxGain);
	        osc.start(t0);
	        osc.stop(t0 + dur + 0.05);
	    }
	    catch { /* ignore */ }
	}
	function noise(dur, vol, opts) {
	    if (!ctx || !sfxGain)
	        return;
	    try {
	        const t0 = ctx.currentTime + (opts?.delay || 0);
	        const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
	        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
	        const data = buf.getChannelData(0);
	        for (let i = 0; i < len; i++)
	            data[i] = (Math.random() * 2 - 1) * (1 - i / len);
	        const src = ctx.createBufferSource();
	        src.buffer = buf;
	        const g = ctx.createGain();
	        g.gain.setValueAtTime(vol, t0);
	        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
	        src.connect(g);
	        g.connect(sfxGain);
	        src.start(t0);
	    }
	    catch { /* ignore */ }
	}
	function play(name) {
	    if (!ctx || !sfxGain)
	        return;
	    switch (name) {
	        case 'click':
	            tone(1500, 0.05, 'square', 0.07);
	            break;
	        case 'hover':
	            tone(2200, 0.02, 'sine', 0.015);
	            break;
	        case 'boot':
	            tone(110, 0.5, 'sawtooth', 0.06, { slideTo: 660 });
	            tone(880, 0.35, 'sine', 0.05, { delay: 0.2, slideTo: 1320 });
	            break;
	        case 'run':
	            tone(320, 0.12, 'square', 0.05, { slideTo: 480 });
	            break;
	        case 'success':
	            tone(523, 0.14, 'sine', 0.15);
	            tone(659, 0.14, 'sine', 0.15, { delay: 0.1 });
	            tone(784, 0.24, 'sine', 0.15, { delay: 0.2 });
	            break;
	        case 'error':
	            tone(220, 0.28, 'sawtooth', 0.09, { slideTo: 110 });
	            break;
	        case 'warning':
	            tone(880, 0.12, 'square', 0.09);
	            tone(880, 0.12, 'square', 0.09, { delay: 0.16 });
	            break;
	        case 'alarm':
	            for (let i = 0; i < 5; i++)
	                tone(i % 2 ? 660 : 440, 0.12, 'square', 0.11, { delay: i * 0.14 });
	            break;
	        case 'threat':
	            tone(110, 1.0, 'sawtooth', 0.13, { slideTo: 50 });
	            tone(440, 0.9, 'square', 0.05, { slideTo: 880 });
	            noise(0.7, 0.05);
	            break;
	        case 'shield':
	            tone(392, 0.1, 'sine', 0.14);
	            tone(523, 0.1, 'sine', 0.14, { delay: 0.08 });
	            tone(659, 0.22, 'sine', 0.14, { delay: 0.16 });
	            break;
	        case 'levelup':
	            [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.17, 'triangle', 0.13, { delay: i * 0.09 }));
	            break;
	        case 'unlock':
	            tone(523, 0.12, 'sine', 0.13);
	            tone(784, 0.18, 'sine', 0.13, { delay: 0.1 });
	            tone(1046, 0.32, 'sine', 0.11, { delay: 0.22 });
	            break;
	        case 'death':
	            tone(220, 1.2, 'sawtooth', 0.15, { slideTo: 40 });
	            noise(1.1, 0.09);
	            break;
	        case 'rebirth':
	            tone(220, 0.5, 'sine', 0.09);
	            tone(330, 0.6, 'sine', 0.08, { delay: 0.4 });
	            tone(440, 0.9, 'sine', 0.07, { delay: 0.9 });
	            break;
	        case 'deny':
	            tone(180, 0.18, 'square', 0.09);
	            tone(140, 0.22, 'square', 0.09, { delay: 0.12 });
	            break;
	        case 'type':
	            tone(2400, 0.012, 'sine', 0.012);
	            break;
	    }
	}
	/** 氛围音乐：循环的柔和合成器垫（跟随设置音量） */
	function startMusic() {
	    if (!ctx || !musicGain || musicOn)
	        return;
	    musicOn = true;
	    const freqs = [110, 164.81, 220, 329.63];
	    const layer = () => {
	        if (!ctx || !musicGain)
	            return;
	        const t0 = ctx.currentTime;
	        for (const f of freqs) {
	            const osc = ctx.createOscillator();
	            const g = ctx.createGain();
	            osc.type = 'triangle';
	            osc.frequency.value = f;
	            g.gain.setValueAtTime(0.0001, t0);
	            g.gain.linearRampToValueAtTime(0.09, t0 + 1.8);
	            g.gain.linearRampToValueAtTime(0.0001, t0 + 4.2);
	            osc.connect(g);
	            g.connect(musicGain);
	            osc.start(t0);
	            osc.stop(t0 + 4.5);
	        }
	    };
	    layer();
	    musicTimer = window.setInterval(layer, 4200);
	}
	function stopMusic() {
	    musicOn = false;
	    if (musicTimer !== null) {
	        window.clearInterval(musicTimer);
	        musicTimer = null;
	    }
	}
	function isMusicOn() { return musicOn; }

	function chapterIndexForServer(serverId) {
	    const map = { syntax: 1, logs: 2, storage: 3, factory: 4, diag: 5, core: 6 };
	    return map[serverId] || 0;
	}
	const Ctx = reactExports.createContext(null);
	let toastSeq = 1;
	function GameProvider({ children }) {
	    const [boot] = reactExports.useState(() => loadGame());
	    const [player, setPlayer] = reactExports.useState(() => boot.state);
	    const [screen, setScreen] = reactExports.useState('boot');
	    const [event, setEvent] = reactExports.useState({ kind: 'none' });
	    const [toasts, setToasts] = reactExports.useState([]);
	    const [saveCorrupted] = reactExports.useState(boot.corrupted || null);
	    const [hasSave] = reactExports.useState(!boot.fresh);
	    const [respawnTick, setRespawnTick] = reactExports.useState(0);
	    const playerRef = reactExports.useRef(player);
	    playerRef.current = player;
	    const eventRef = reactExports.useRef(event);
	    eventRef.current = event;
	    // 死亡流程的稳定引用（Boss 反击在 startDeath 定义之前就需要调用它）
	    const startDeathRef = reactExports.useRef(() => { });
	    const toast = reactExports.useCallback((kind, text) => {
	        const id = toastSeq++;
	        setToasts(t => [...t.slice(-4), { id, kind, text }]);
	        window.setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4600);
	    }, []);
	    // 旧存档迁移提示（只提示一次，不打断游戏）
	    reactExports.useEffect(() => {
	        if (boot.migrated && boot.notes && boot.notes.length > 0) {
	            toast('info', '存档已自动迁移：v' + (boot.fromVersion || 1) + ' → v' + SAVE_VERSION + '（进度、等级、成就均已保留）');
	        }
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, []);
	    // 持久化
	    reactExports.useEffect(() => { saveGame(player); }, [player]);
	    reactExports.useEffect(() => {
	        const h = () => saveGame(playerRef.current);
	        window.addEventListener('beforeunload', h);
	        return () => window.removeEventListener('beforeunload', h);
	    }, []);
	    const nav = reactExports.useCallback((s) => setScreen(s), []);
	    // 设置联动
	    reactExports.useEffect(() => {
	        setVolumes(player.settings.sfxVolume, player.settings.musicVolume);
	        if (isMusicOn() && player.settings.musicVolume <= 0)
	            stopMusic();
	    }, [player.settings]);
	    reactExports.useEffect(() => {
	        if (player.settings.fullscreen) {
	            if (typeof document.fullscreenElement !== 'undefined' && !document.fullscreenElement &&
	                typeof document.documentElement.requestFullscreen === 'function') {
	                document.documentElement.requestFullscreen().catch(() => { });
	            }
	        }
	        else if (typeof document.exitFullscreen === 'function' && document.fullscreenElement) {
	            document.exitFullscreen().catch(() => { });
	        }
	    }, [player.settings.fullscreen]);
	    const toggleMusic = reactExports.useCallback(() => {
	        if (isMusicOn())
	            stopMusic();
	        else
	            startMusic();
	    }, []);
	    // ---------- 玩家操作 ----------
	    const startNewGame = reactExports.useCallback(() => {
	        setPlayer(defaultState());
	        setScreen('story');
	    }, []);
	    const setCurrentLevel = reactExports.useCallback((id) => {
	        setPlayer(p => ({ ...p, progress: { ...p.progress, currentLevelId: id } }));
	    }, []);
	    const setCurrentBoss = reactExports.useCallback((id) => {
	        setPlayer(p => ({ ...p, progress: { ...p.progress, currentBossId: id } }));
	    }, []);
	    const completeBoss = reactExports.useCallback((bossId) => {
	        const boss = bossById(bossId);
	        if (!boss)
	            return null;
	        const cur = playerRef.current;
	        const done = cur.progress.bossesDone ?? [];
	        if (done.includes(bossId))
	            return null; // 已击破：不重复发经验/碎片/奖励
	        const newExp = cur.exp + boss.rewardExp;
	        const newLevel = levelForExp(newExp);
	        const firstGain = !cur.meta.memoryFragments.includes(boss.fragmentId);
	        const fragments = firstGain
	            ? [...cur.meta.memoryFragments, boss.fragmentId]
	            : cur.meta.memoryFragments;
	        // 碎片归档记录（重复挑战不会写入新时间）
	        const fragmentLog = { ...(cur.meta.fragmentLog || {}) };
	        if (firstGain) {
	            const now = Date.now();
	            fragmentLog[boss.fragmentId] = now;
	            const canon = fragmentForCollected(boss.fragmentId)?.id;
	            if (canon && !fragmentLog[canon])
	                fragmentLog[canon] = now;
	        }
	        // 章节完成标记：该章关卡全通 + Boss 首杀 → 写入 doneFlag（P0 修复）
	        const chDef = chapterOfBoss(bossId);
	        const chapterCleared = !!chDef && levelsOfServer(chDef.serverId).every(l => cur.progress.completedLevels.includes(l.id));
	        const doneFlags = chapterCleared && chDef ? { ...cur.progress.flags, [chDef.doneFlag]: true } : cur.progress.flags;
	        // 首次击败章节 Boss 的章节奖励（幂等）
	        const baseRw = normalizeRewards(cur.rewards);
	        let nextRw = { ...baseRw, items: { ...baseRw.items }, skins: [...baseRw.skins] };
	        const unlocks = [];
	        let credits = 0;
	        let trust = 0;
	        const br = bossRewardFor(boss.chapter);
	        const rewardKey = 'boss-ch' + boss.chapter;
	        if (br && !(baseRw.bossRewards || []).includes(rewardKey)) {
	            nextRw.credits = baseRw.credits + br.credits;
	            nextRw.trust = Math.min(100, baseRw.trust + br.trust);
	            nextRw.bossRewards = [...(baseRw.bossRewards || []), rewardKey];
	            if (br.items)
	                for (const [k, v] of Object.entries(br.items))
	                    nextRw.items[k] = (nextRw.items[k] || 0) + v;
	            if (br.skins && br.skins.length)
	                nextRw.skins = [...new Set([...nextRw.skins, ...br.skins])];
	            credits = br.credits;
	            trust = br.trust;
	            unlocks.push(br.title);
	        }
	        // 升级解锁（称号 / 头像框 / 粒子），自动装备
	        for (const u of unlocksForLevel(cur.level, newLevel)) {
	            if (nextRw.skins.includes(u.id))
	                continue;
	            nextRw.skins = [...nextRw.skins, u.id];
	            nextRw.unlocks = [...(nextRw.unlocks || []), u.id];
	            if (u.slot)
	                nextRw.equipped = { ...nextRw.equipped, [u.slot]: u.id };
	            unlocks.push(u.name);
	        }
	        setPlayer(p => {
	            const next = {
	                ...p,
	                level: newLevel,
	                exp: newExp,
	                rewards: nextRw,
	                meta: { ...p.meta, memoryFragments: fragments, fragmentLog },
	                progress: {
	                    ...p.progress,
	                    flags: doneFlags,
	                    bossesDone: [...(p.progress.bossesDone ?? []), bossId],
	                    achievements: recalcAchievements({
	                        ...p,
	                        level: newLevel,
	                        meta: { ...p.meta, memoryFragments: fragments },
	                        progress: { ...p.progress, bossesDone: [...(p.progress.bossesDone ?? []), bossId] },
	                    }),
	                },
	            };
	            return next;
	        });
	        if (credits > 0)
	            toast('achieve', '章节奖励：+' + credits + ' 贡献点（' + (br ? br.title : '') + '）');
	        return { fragmentId: boss.fragmentId, expGained: boss.rewardExp, levelUp: newLevel > cur.level, newLevel, credits, trust, unlocks };
	    }, [toast]);
	    // ---------- Boss 战 ----------
	    /** 进入战斗：没有存档就创建满血状态（已击破的 Boss 保留原状态） */
	    const beginBossBattle = reactExports.useCallback((bossId) => {
	        const def = battleFor(bossId);
	        if (!def)
	            return null;
	        const cur = playerRef.current;
	        const existing = normalizeBattleState((cur.progress.battles || {})[bossId], def);
	        if (!(cur.progress.battles || {})[bossId]) {
	            setPlayer(p => ({
	                ...p,
	                progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: existing } },
	            }));
	        }
	        return existing;
	    }, []);
	    /** 写入一次判题结果（血量 / 阶段 / 已通过测试位掩码） */
	    const applyBossDamage = reactExports.useCallback((bossId, phaseIndex, r) => {
	        const def = battleFor(bossId);
	        if (!def)
	            return;
	        setPlayer(p => {
	            const cur = normalizeBattleState((p.progress.battles || {})[bossId], def);
	            const masks = cur.phaseMask.slice();
	            masks[phaseIndex] = Math.max(masks[phaseIndex] || 0, r.mask);
	            const next = {
	                ...cur,
	                hp: Math.max(0, Math.min(cur.maxHp, r.hpAfter)),
	                phase: Math.max(cur.phase, r.phaseAfter),
	                phaseMask: masks,
	                cleared: cur.cleared || r.defeated || r.hpAfter <= 0,
	                updatedAt: Date.now(),
	            };
	            return { ...p, progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: next } } };
	        });
	    }, []);
	    /** 判题没有造成伤害 → Boss 反击：意识值下降，失败次数 +1；意识归零走既有死亡流程 */
	    const bossCounterAttack = reactExports.useCallback((bossId, amount) => {
	        const def = battleFor(bossId);
	        if (!def)
	            return;
	        const cur = playerRef.current;
	        const c = Math.max(0, cur.consciousness - Math.max(0, amount));
	        setPlayer(p => {
	            const b = normalizeBattleState((p.progress.battles || {})[bossId], def);
	            return {
	                ...p,
	                consciousness: c,
	                progress: {
	                    ...p.progress,
	                    battles: { ...(p.progress.battles || {}), [bossId]: { ...b, failures: b.failures + 1, updatedAt: Date.now() } },
	                },
	            };
	        });
	        if (c <= 0) {
	            setPlayer(p => ({
	                ...p,
	                progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: createBattleState(def) } },
	            }));
	            startDeathRef.current(bossId, '被 ' + (def.bossId.toUpperCase()) + ' 反击击穿');
	        }
	    }, []);
	    /** 重置某场战斗（重生 / 手动放弃进度时使用） */
	    const resetBossBattle = reactExports.useCallback((bossId) => {
	        const def = battleFor(bossId);
	        if (!def)
	            return;
	        setPlayer(p => ({
	            ...p,
	            progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: createBattleState(def) } },
	        }));
	    }, []);
	    /** Bug 图鉴：记录一次错误遭遇（同一条目累计次数） */
	    const recordBug = reactExports.useCallback((entryId) => {
	        if (!entryId)
	            return;
	        setPlayer(p => {
	            const log = { ...(p.meta.bugCodex || {}) };
	            const cur = log[entryId];
	            log[entryId] = { count: (cur?.count || 0) + 1, firstAt: cur?.firstAt || Date.now() };
	            return { ...p, meta: { ...p.meta, bugCodex: log } };
	        });
	    }, []);
	    /** 结局档案：记录已解锁结局（幂等） */
	    const recordEnding = reactExports.useCallback((endingId) => {
	        if (!endingId)
	            return;
	        setPlayer(p => {
	            const list = p.progress.endings || [];
	            const nextList = list.includes(endingId) ? list : [...list, endingId];
	            return { ...p, progress: { ...p.progress, endings: nextList, ending: endingId } };
	        });
	    }, []);
	    // ---------- 记忆档案馆 ----------
	    const normalizeVault = (v) => ({
	        read: Array.isArray(v?.read) ? [...v.read] : [],
	        finalSeen: v?.finalSeen === true,
	        lastOpened: typeof v?.lastOpened === 'string' ? v.lastOpened : null,
	    });
	    /** 查看某枚碎片：记录已读 + 上次打开位置（关闭页面后可恢复） */
	    const markVaultRead = reactExports.useCallback((fragmentId) => {
	        if (!fragmentId)
	            return;
	        setPlayer(p => {
	            const v = normalizeVault(p.progress.vault);
	            if (v.read.includes(fragmentId) && v.lastOpened === fragmentId)
	                return p;
	            return {
	                ...p,
	                progress: {
	                    ...p.progress,
	                    vault: { ...v, read: v.read.includes(fragmentId) ? v.read : [...v.read, fragmentId], lastOpened: fragmentId },
	                },
	            };
	        });
	    }, []);
	    const markVaultFinalSeen = reactExports.useCallback(() => {
	        setPlayer(p => {
	            const v = normalizeVault(p.progress.vault);
	            if (v.finalSeen)
	                return p;
	            return { ...p, progress: { ...p.progress, vault: { ...v, finalSeen: true } } };
	        });
	    }, []);
	    const setVaultLastOpened = reactExports.useCallback((id) => {
	        setPlayer(p => {
	            const v = normalizeVault(p.progress.vault);
	            if (v.lastOpened === id)
	                return p;
	            return { ...p, progress: { ...p.progress, vault: { ...v, lastOpened: id } } };
	        });
	    }, []);
	    /** 兑换中心购买（外观一次性、道具可重复购买） */
	    const buyShopItem = reactExports.useCallback((itemId) => {
	        const item = shopItemById(itemId);
	        if (!item)
	            return { ok: false, reason: '商品不存在' };
	        const cur = playerRef.current;
	        const rw = normalizeRewards(cur.rewards);
	        if (item.unique && (rw.skins.includes(itemId) || (item.flag && cur.progress.flags[item.flag] === true))) {
	            return { ok: false, reason: '已拥有该奖励' };
	        }
	        if (rw.credits < item.price)
	            return { ok: false, reason: '贡献点不足（还差 ' + (item.price - rw.credits) + '）' };
	        const next = {
	            ...rw,
	            credits: rw.credits - item.price,
	            skins: item.unique ? [...new Set([...rw.skins, itemId])] : rw.skins,
	            items: item.count ? { ...rw.items, [itemId]: (rw.items[itemId] || 0) + item.count } : { ...rw.items },
	        };
	        const flags = { ...cur.progress.flags };
	        if (item.flag)
	            flags[item.flag] = true;
	        setPlayer(p => ({ ...p, rewards: next, progress: { ...p.progress, flags } }));
	        toast('achieve', '兑换成功：' + item.name);
	        play('success');
	        return { ok: true };
	    }, [toast]);
	    /** 装备外观 */
	    const equipItem = reactExports.useCallback((itemId) => {
	        const slot = slotOf(itemId);
	        if (!slot)
	            return { ok: false, reason: '该物品不可装备' };
	        const cur = playerRef.current;
	        const rw = normalizeRewards(cur.rewards);
	        if (!rw.skins.includes(itemId))
	            return { ok: false, reason: '尚未拥有' };
	        const equipped = { ...rw.equipped, [slot]: itemId };
	        setPlayer(p => ({ ...p, rewards: { ...normalizeRewards(p.rewards), equipped } }));
	        toast('success', '已装备：' + (skinMetaById(itemId)?.name || itemId));
	        play('click');
	        return { ok: true };
	    }, [toast]);
	    /** 消耗一个道具 */
	    const consumeItem = reactExports.useCallback((itemId) => {
	        const cur = playerRef.current;
	        const rw = normalizeRewards(cur.rewards);
	        const have = rw.items[itemId] || 0;
	        if (have <= 0)
	            return false;
	        const items = { ...rw.items, [itemId]: have - 1 };
	        setPlayer(p => ({ ...p, rewards: { ...normalizeRewards(p.rewards), items } }));
	        return true;
	    }, []);
	    /** 意识稳定模块 */
	    const restoreConsciousness = reactExports.useCallback((amount) => {
	        setPlayer(p => ({ ...p, consciousness: Math.min(100, p.consciousness + amount) }));
	        play('success');
	    }, []);
	    /** 标记记忆档案已读 */
	    const markArchiveRead = reactExports.useCallback((archiveId) => {
	        setPlayer(p => {
	            const rw = normalizeRewards(p.rewards);
	            if (rw.archiveRead.includes(archiveId))
	                return p;
	            return { ...p, rewards: { ...rw, archiveRead: [...rw.archiveRead, archiveId] } };
	        });
	    }, []);
	    const setFlag = reactExports.useCallback((key, value) => {
	        setPlayer(p => ({ ...p, progress: { ...p.progress, flags: { ...p.progress.flags, [key]: value } } }));
	    }, []);
	    /** 记录对话节点已读：旧字段 storySeen（布尔）+ 新字段 story.seen（次数）双写 */
	    const markStory = reactExports.useCallback((id) => {
	        if (!id)
	            return;
	        setPlayer(p => {
	            const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
	            const nextStory = markNodeSeen(story, id);
	            const storySeen = p.progress.storySeen[id] ? p.progress.storySeen : { ...p.progress.storySeen, [id]: true };
	            return { ...p, progress: { ...p.progress, storySeen, story: nextStory } };
	        });
	    }, []);
	    /** 解锁剧情事件（幂等，不重复写入） */
	    const unlockStoryEvent = reactExports.useCallback((eventId) => {
	        if (!eventId)
	            return;
	        setPlayer(p => {
	            const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
	            if (story.unlocked.includes(eventId))
	                return p;
	            return { ...p, progress: { ...p.progress, story: unlockEvent(story, eventId) } };
	        });
	    }, []);
	    /** 记录剧情分支选择（同一节点保留最新选择） */
	    const recordStoryChoice = reactExports.useCallback((nodeId, label) => {
	        if (!nodeId || !label)
	            return;
	        setPlayer(p => {
	            const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
	            return { ...p, progress: { ...p.progress, story: recordChoice(story, nodeId, label) } };
	        });
	    }, []);
	    /**
	     * 修改玩家显示名称。
	     * 规范：只改显示名，原始实验编号 R-07 永远不变（identity.originCode 由 normalizeIdentity 强制）。
	     */
	    const renamePlayer = reactExports.useCallback((raw) => {
	        const v = validateDisplayName(raw);
	        if (!v.ok)
	            return { ok: false, reason: v.reason };
	        const cur = playerRef.current;
	        const base = normalizeIdentity(cur.identity, cur.name);
	        const identity = {
	            ...base,
	            displayName: v.name,
	            originCode: ORIGIN_CODE,
	            renamed: v.name !== ORIGIN_CODE,
	        };
	        setPlayer(p => ({ ...p, name: v.name, identity }));
	        toast('success', '显示名称已更新为「' + v.name + '」');
	        play('success');
	        return { ok: true, name: v.name };
	    }, [toast]);
	    const addKnowledge = reactExports.useCallback((ids) => {
	        setPlayer(p => {
	            const merged = [...new Set([...p.progress.knowledge, ...ids])];
	            return { ...p, progress: { ...p.progress, knowledge: merged } };
	        });
	    }, []);
	    const hintUsed = reactExports.useCallback((levelId) => {
	        const cur = playerRef.current.progress.hintLevels[levelId] || 0;
	        setPlayer(p => ({
	            ...p,
	            progress: { ...p.progress, hintLevels: { ...p.progress.hintLevels, [levelId]: cur + 1 } },
	        }));
	        return cur;
	    }, []);
	    const resetAttempts = reactExports.useCallback((levelId) => {
	        setPlayer(p => ({
	            ...p,
	            progress: { ...p.progress, failedAttempts: { ...p.progress.failedAttempts, [levelId]: 0 } },
	        }));
	    }, []);
	    /** 通关：经验、星级、知识卡片、关卡/服务器解锁、成就、升级 */
	    const completeLevel = reactExports.useCallback((levelId) => {
	        const level = levelById(levelId);
	        if (!level)
	            return null;
	        const prev = playerRef.current;
	        const firstTime = !prev.progress.completedLevels.includes(levelId);
	        const att = prev.progress.failedAttempts[levelId] || 0;
	        const stars = att === 0 ? 3 : att === 1 ? 2 : 1;
	        const prevStars = prev.progress.stars[levelId] || 0;
	        const oldLevel = prev.level;
	        const completed = prev.progress.completedLevels.includes(levelId)
	            ? prev.progress.completedLevels
	            : [...prev.progress.completedLevels, levelId];
	        const knowledge = [...new Set([...prev.progress.knowledge, ...level.knowledge])];
	        const nextExp = firstTime ? prev.exp + level.rewardExp : prev.exp;
	        const next = {
	            ...prev,
	            exp: nextExp,
	            level: levelForExp(nextExp),
	            progress: {
	                ...prev.progress,
	                completedLevels: completed,
	                stars: { ...prev.progress.stars, [levelId]: Math.max(prevStars, stars) },
	                knowledge,
	                failedAttempts: { ...prev.progress.failedAttempts, [levelId]: 0 },
	                flags: { ...prev.progress.flags },
	            },
	        };
	        if (att > 0)
	            next.progress.flags.chapter1ZeroFail = false;
	        if (level.serverId === 'syntax' && att === 0 && next.progress.flags.chapter1ZeroFail !== false) {
	            next.progress.flags.chapter1ZeroFail = true;
	        }
	        // 训练终端完成 → 开放语法维修站（新手五个修复端）
	        if (level.id === 'tut-1' && !next.progress.unlockedServers.includes('syntax')) {
	            next.progress.unlockedServers = [...next.progress.unlockedServers, 'syntax'];
	        }
	        // 服务器解锁 + 章节完成标记
	        const siblings = levelsOfServer(level.serverId);
	        const serverDone = siblings.length > 0 && siblings.every(l => next.progress.completedLevels.includes(l.id));
	        if (serverDone && !next.progress.unlockedServers.includes(level.serverId)) {
	            next.progress.unlockedServers = [...next.progress.unlockedServers, level.serverId];
	        }
	        if (level.serverId === 'syntax' && serverDone) {
	            next.progress.flags.chapter1Done = true;
	            next.progress.flags.pendingChapterUnlock = true;
	            if (!next.progress.unlockedServers.includes('logs')) {
	                next.progress.unlockedServers = [...next.progress.unlockedServers, 'logs'];
	            }
	        }
	        if (level.serverId === 'logs' && serverDone) {
	            next.progress.flags.chapter2Done = true;
	            next.progress.flags.pendingChapter3Unlock = true;
	            if (!next.progress.unlockedServers.includes('storage')) {
	                next.progress.unlockedServers = [...next.progress.unlockedServers, 'storage'];
	            }
	        }
	        if (level.serverId === 'storage' && serverDone) {
	            next.progress.flags.chapter3Done = true;
	            next.progress.flags.pendingChapter4Unlock = true;
	            if (!next.progress.unlockedServers.includes('factory')) {
	                next.progress.unlockedServers = [...next.progress.unlockedServers, 'factory'];
	            }
	        }
	        if (level.serverId === 'factory' && serverDone) {
	            // 第四章完成：核心机房溢出信号，但最高权限封锁保持（终章服务器，第五章衔接）
	            next.progress.flags.chapter4Done = true;
	            next.progress.flags.pendingChapter5Unlock = true;
	            if (!next.progress.unlockedServers.includes('diag')) {
	                next.progress.unlockedServers = [...next.progress.unlockedServers, 'diag'];
	            }
	        }
	        if (level.serverId === 'diag' && serverDone) {
	            // 第五章完成：核心机房封锁开始解除（终章仍待第六章）
	            next.progress.flags.chapter5Done = true;
	            next.progress.flags.pendingChapter6Unlock = true;
	            if (!next.progress.unlockedServers.includes('core')) {
	                next.progress.unlockedServers = [...next.progress.unlockedServers, 'core'];
	            }
	        }
	        if (level.serverId === 'core' && serverDone) {
	            // 终章完成：全网络复原 + 收集创世主第二块记忆碎片
	            next.progress.flags.chapter6Done = true;
	            next.progress.flags.gameCompleted = true;
	            if (!next.meta.memoryFragments.includes('f2')) {
	                next.meta.memoryFragments = [...next.meta.memoryFragments, 'f2'];
	            }
	        }
	        const newAch = recalcAchievements(next);
	        const gained = newAch.filter(a => !prev.progress.achievements.includes(a));
	        next.progress.achievements = newAch;
	        // ---------- 奖励系统结算（与经验/等级并行，互不覆盖；仅在真实判题通过时执行） ----------
	        const prevRewards = normalizeRewards(prev.rewards);
	        const hintsUsed = prev.progress.hintLevels[levelId] || 0;
	        const alreadyCleared = !!prevRewards.cleared[levelId];
	        const v2 = computeLevelRewardV2({
	            levelExp: level.rewardExp,
	            fails: att,
	            hints: hintsUsed,
	            firstClear: !alreadyCleared,
	            prevStars,
	            newStars: stars,
	        });
	        const breakdown = {
	            grade: v2.grade,
	            base: v2.base,
	            firstClear: v2.firstClearBonus,
	            noFail: v2.noFail,
	            noHint: v2.noHint,
	            gradeBonus: v2.gradeBonus,
	            improvement: v2.improvement,
	            total: v2.total,
	            trustGain: v2.trustGain,
	        };
	        const rewards = {
	            ...prevRewards,
	            credits: prevRewards.credits + breakdown.total,
	            trust: Math.min(100, prevRewards.trust + breakdown.trustGain),
	            cleared: {
	                ...prevRewards.cleared,
	                [levelId]: { grade: breakdown.grade, fails: att, hints: hintsUsed, credits: breakdown.total, trust: breakdown.trustGain },
	            },
	            skins: [...prevRewards.skins],
	            items: { ...prevRewards.items },
	            chapterRewards: [...prevRewards.chapterRewards],
	        };
	        // 章节奖励：整章通关时发放一次（幂等）
	        let chapterRewardPayload = undefined;
	        const chapterDef = chapterRewardOf(chapterIndexForServer(level.serverId));
	        const serverDoneAfter = siblings.length > 0 && siblings.every(l => next.progress.completedLevels.includes(l.id));
	        if (chapterDef && serverDoneAfter && !rewards.chapterRewards.includes(chapterDef.id)) {
	            rewards.chapterRewards.push(chapterDef.id);
	            rewards.credits += chapterDef.credits;
	            if (chapterDef.skins && chapterDef.skins.length)
	                rewards.skins = [...new Set([...rewards.skins, ...chapterDef.skins])];
	            if (chapterDef.items) {
	                for (const [k, v] of Object.entries(chapterDef.items))
	                    rewards.items[k] = (rewards.items[k] || 0) + v;
	            }
	            if (chapterDef.fragment && !next.meta.memoryFragments.includes(chapterDef.fragment)) {
	                next.meta.memoryFragments = [...next.meta.memoryFragments, chapterDef.fragment];
	            }
	            chapterRewardPayload = {
	                id: chapterDef.id, title: chapterDef.title, desc: chapterDef.desc,
	                credits: chapterDef.credits, skins: chapterDef.skins || [], items: chapterDef.items || {},
	                fragment: chapterDef.fragment,
	            };
	        }
	        // 等级解锁：称号 / 头像框 / 粒子（升级时发放并自动装备）
	        const unlockNames = [];
	        for (const u of unlocksForLevel(oldLevel, next.level)) {
	            if (rewards.skins.includes(u.id))
	                continue;
	            rewards.skins = [...rewards.skins, u.id];
	            rewards.unlocks = [...(rewards.unlocks || []), u.id];
	            if (u.slot)
	                rewards.equipped = { ...rewards.equipped, [u.slot]: u.id };
	            unlockNames.push(u.name);
	        }
	        next.rewards = rewards;
	        setPlayer(next);
	        unlockNames.forEach(n => toast('achieve', '等级解锁：' + n));
	        if (chapterRewardPayload) {
	            toast('achieve', '章节奖励：' + chapterRewardPayload.title + '（+' + chapterRewardPayload.credits + ' 贡献点）');
	            play('unlock');
	        }
	        gained.forEach(id => {
	            const def = achievementById(id);
	            if (def)
	                toast('achieve', '成就解锁：' + def.name + (def.hidden ? '（隐藏）' : ''));
	        });
	        if (next.level > oldLevel)
	            play('levelup');
	        else if (firstTime)
	            play('success');
	        return {
	            levelId,
	            firstTime,
	            expGained: firstTime ? level.rewardExp : 0,
	            levelUp: next.level > oldLevel,
	            oldLevel,
	            newLevel: next.level,
	            stars,
	            newAchievements: gained,
	            unlocks: unlockNames,
	            reward: {
	                breakdown,
	                fails: att,
	                hints: hintsUsed,
	                creditsTotal: rewards.credits,
	                trustTotal: rewards.trust,
	                trustUp: rewards.trust > prevRewards.trust,
	                chapterReward: chapterRewardPayload,
	                duplicate: alreadyCleared,
	            },
	        };
	    }, [toast]);
	    /** 正式提交失败：计数 +1；超过容错上限时触发纠错者攻击事件 */
	    const recordFail = reactExports.useCallback((levelId) => {
	        if (eventRef.current.kind !== 'none')
	            return { n: 0, tolerance: 0, triggered: false };
	        const prev = playerRef.current;
	        const n = (prev.progress.failedAttempts[levelId] || 0) + 1;
	        const tol = toleranceFor(prev.level);
	        setPlayer(p => ({
	            ...p,
	            progress: { ...p.progress, failedAttempts: { ...p.progress.failedAttempts, [levelId]: n } },
	        }));
	        if (n > tol) {
	            const pool = DEFENSE_TASKS.map(t => t.id);
	            const defenseId = pool[Math.floor(Math.random() * pool.length)];
	            setEvent({ kind: 'attack', levelId, defenseId, attemptsLeft: 2 });
	            play('threat');
	            return { n, tolerance: tol, triggered: true };
	        }
	        return { n, tolerance: tol, triggered: false };
	    }, []);
	    /** 攻击事件结算：成功清零容错；失败 -30% 意识（到 0 触发死亡） */
	    const resolveDefense = reactExports.useCallback((ok) => {
	        const ev = eventRef.current;
	        if (ev.kind !== 'attack')
	            return;
	        const prev = playerRef.current;
	        const levelId = ev.levelId;
	        const next = {
	            ...prev,
	            progress: {
	                ...prev.progress,
	                failedAttempts: { ...prev.progress.failedAttempts, [levelId]: 0 },
	                flags: { ...prev.progress.flags },
	            },
	        };
	        if (ok) {
	            next.progress.flags.defenseWon = true;
	            const newAch = recalcAchievements(next);
	            const gained = newAch.filter(a => !prev.progress.achievements.includes(a));
	            next.progress.achievements = newAch;
	            setPlayer(next);
	            setEvent({ kind: 'none' });
	            play('shield');
	            gained.forEach(id => {
	                const def = achievementById(id);
	                if (def)
	                    toast('achieve', '成就解锁：' + def.name);
	            });
	            toast('success', '防御成功：纠错者已被击退，本关容错计数已清零。');
	        }
	        else {
	            const c = Math.max(0, next.consciousness - 30);
	            next.consciousness = c;
	            if (c <= 0) {
	                next.meta = {
	                    ...next.meta,
	                    deaths: next.meta.deaths + 1,
	                    lastDeathLevel: levelId,
	                    lastDeathReason: '纠错者攻击 · 两次防御失败',
	                };
	                next.progress.pendingRebirth = true;
	                setPlayer(next);
	                setEvent({ kind: 'death', levelId, reason: next.meta.lastDeathReason || '' });
	                play('death');
	            }
	            else {
	                setPlayer(next);
	                setEvent({ kind: 'none' });
	                play('error');
	                toast('warn', '防御失败：意识完整度 -30%（当前 ' + c + '%）。纠错者被暂时击退。');
	            }
	        }
	    }, [toast]);
	    const startDeath = reactExports.useCallback((levelId, reason) => {
	        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
	        setPlayer(p => ({
	            ...p,
	            meta: { ...p.meta, deaths: p.meta.deaths + 1, lastDeathLevel: levelId, lastDeathReason: reason },
	            progress: { ...p.progress, pendingRebirth: true },
	        }));
	        setEvent({ kind: 'death', levelId, reason });
	        play('death');
	    }, []);
	    startDeathRef.current = startDeath;
	    /** 重生时把进行中的 Boss 战重置为满血第一阶段（已击破的保持不变） */
	    const resetCurrentBattle = (p) => {
	        const battles = { ...(p.progress.battles || {}) };
	        const bossId = p.progress.currentBossId;
	        const def = bossId ? battleFor(bossId) : undefined;
	        if (bossId && def && !battles[bossId]?.cleared)
	            battles[bossId] = createBattleState(def);
	        return battles;
	    };
	    /** 重生结算：意识恢复 70%、保留成长、当前关卡进度重置待重打 */
	    const finishRebirth = reactExports.useCallback(() => {
	        const prev = playerRef.current;
	        const idx = prev.meta.rebirths;
	        const fragments = prev.meta.memoryFragments.slice();
	        if (idx >= 2 && !fragments.includes('f1'))
	            fragments.push('f1');
	        const next = {
	            ...prev,
	            consciousness: 70,
	            meta: { ...prev.meta, rebirths: prev.meta.rebirths + 1, memoryFragments: fragments },
	            progress: { ...prev.progress, pendingRebirth: false, battles: resetCurrentBattle(prev) },
	        };
	        const newAch = recalcAchievements(next);
	        const gained = newAch.filter(a => !prev.progress.achievements.includes(a));
	        next.progress.achievements = newAch;
	        setPlayer(next);
	        setEvent({ kind: 'none' });
	        setRespawnTick(t => t + 1);
	        play('rebirth');
	        gained.forEach(id => {
	            const def = achievementById(id);
	            if (def)
	                toast('achieve', '成就解锁：' + def.name + (def.hidden ? '（隐藏）' : ''));
	        });
	    }, [toast]);
	    /** 攻击事件：消耗一次防御尝试（不加意识惩罚） */
	    const decrementAttackAttempt = reactExports.useCallback(() => {
	        setEvent(ev => (ev.kind === 'attack' ? { ...ev, attemptsLeft: ev.attemptsLeft - 1 } : ev));
	    }, []);
	    /** 载入存档时发现 pendingRebirth：直接进入重生流程（不再重复计死亡次数） */
	    const triggerPendingDeath = reactExports.useCallback(() => {
	        const lv = playerRef.current.progress.currentLevelId || 'tut-1';
	        setEvent({ kind: 'death', levelId: lv, reason: playerRef.current.meta.lastDeathReason || '意识残留异常（上次死亡未完成重建）' });
	    }, []);
	    /** 清空存档并重置为初始状态 */
	    const wipeSave = reactExports.useCallback(() => {
	        setPlayer(defaultState());
	        setScreen('menu');
	        setEvent({ kind: 'none' });
	    }, []);
	    // ---------- 存档管理 ----------
	    const importSaveData = reactExports.useCallback((text) => {
	        const r = importSave(text);
	        if (r.ok && r.state) {
	            setPlayer(r.state);
	            toast('success', '存档已导入。');
	            return { ok: true };
	        }
	        toast('warn', '导入失败：' + (r.reason || '未知原因'));
	        return { ok: false, reason: r.reason };
	    }, [toast]);
	    const exportSaveString = reactExports.useCallback(() => exportSave(playerRef.current), []);
	    const patchSettings = reactExports.useCallback((patch) => {
	        setPlayer(p => ({ ...p, settings: { ...p.settings, ...patch } }));
	    }, []);
	    const value = {
	        player, screen, event, toasts, saveCorrupted, hasSave,
	        tolerance: toleranceFor(player.level),
	        nav, toast, startNewGame, setCurrentLevel, setCurrentBoss, completeBoss,
	        beginBossBattle, applyBossDamage, bossCounterAttack, resetBossBattle,
	        recordBug, recordEnding, markVaultRead, markVaultFinalSeen, setVaultLastOpened,
	        completeLevel, recordFail,
	        buyShopItem, equipItem, consumeItem, restoreConsciousness, markArchiveRead,
	        resetAttempts, hintUsed, resolveDefense, finishRebirth, startDeath,
	        decrementAttackAttempt, triggerPendingDeath, wipeSave,
	        markStory, unlockStoryEvent, recordStoryChoice, renamePlayer,
	        addKnowledge, setFlag, patchSettings, importSaveData, exportSaveString,
	        respawnTick, toggleMusic,
	    };
	    return jsxRuntimeExports.jsx(Ctx.Provider, { value: value, children: children });
	}
	function useGame() {
	    const v = reactExports.useContext(Ctx);
	    if (!v)
	        throw new Error('useGame must be used within GameProvider');
	    return v;
	}

	const DEF_COLORS = ['#42D6D0', '#3986C8', '#35D39A', '#8FB0C9', '#F3B75C'];
	function ParticlesField({ className, density = 1, speed = 1, colors = DEF_COLORS, converge = false, enabled = true, max = 120, }) {
	    const ref = reactExports.useRef(null);
	    const enabledRef = reactExports.useRef(enabled);
	    enabledRef.current = enabled;
	    const convergeRef = reactExports.useRef(converge);
	    convergeRef.current = converge;
	    reactExports.useEffect(() => {
	        const canvas = ref.current;
	        if (!canvas)
	            return;
	        const ctx = canvas.getContext('2d');
	        if (!ctx)
	            return;
	        let raf = 0;
	        let parts = [];
	        let w = 0, h = 0;
	        const resize = () => {
	            const parent = canvas.parentElement;
	            w = parent ? parent.clientWidth : window.innerWidth;
	            h = parent ? parent.clientHeight : window.innerHeight;
	            canvas.width = w;
	            canvas.height = h;
	            const count = Math.min(max, Math.max(12, Math.round((w * h) / 13000) * density));
	            if (count !== parts.length) {
	                parts = [];
	                for (let i = 0; i < count; i++) {
	                    parts.push({
	                        x: Math.random() * w, y: Math.random() * h,
	                        r: 0.8 + Math.random() * 2.2,
	                        vx: (Math.random() - 0.5) * 0.35 * speed,
	                        vy: (-0.15 - Math.random() * 0.4) * speed,
	                        a: 0.25 + Math.random() * 0.6,
	                        tw: Math.random() * 6.28,
	                        c: colors[Math.floor(Math.random() * colors.length)],
	                    });
	                }
	            }
	        };
	        resize();
	        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
	        if (ro && canvas.parentElement)
	            ro.observe(canvas.parentElement);
	        window.addEventListener('resize', resize);
	        const tick = () => {
	            raf = requestAnimationFrame(tick);
	            if (!enabledRef.current)
	                return;
	            ctx.clearRect(0, 0, w, h);
	            const cx = w / 2, cy = h / 2;
	            for (const p of parts) {
	                p.tw += 0.02;
	                if (convergeRef.current) {
	                    const dx = cx - p.x, dy = cy - p.y;
	                    const d = Math.max(1, Math.hypot(dx, dy));
	                    p.vx = (dx / d) * 1.1 * speed;
	                    p.vy = (dy / d) * 1.1 * speed;
	                    p.x += p.vx;
	                    p.y += p.vy;
	                    p.a = Math.max(0.05, 0.9 - d / 600);
	                }
	                else {
	                    p.x += p.vx;
	                    p.y += p.vy;
	                    if (p.y < -8) {
	                        p.y = h + 8;
	                        p.x = Math.random() * w;
	                    }
	                    if (p.x < -8)
	                        p.x = w + 8;
	                    if (p.x > w + 8)
	                        p.x = -8;
	                }
	                ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(p.tw));
	                ctx.fillStyle = p.c;
	                ctx.shadowColor = p.c;
	                ctx.shadowBlur = 6;
	                ctx.beginPath();
	                ctx.arc(p.x, p.y, p.r, 0, 6.283);
	                ctx.fill();
	            }
	            ctx.globalAlpha = 1;
	            ctx.shadowBlur = 0;
	        };
	        raf = requestAnimationFrame(tick);
	        const vis = () => {
	            cancelAnimationFrame(raf);
	            if (!document.hidden)
	                raf = requestAnimationFrame(tick);
	        };
	        document.addEventListener('visibilitychange', vis);
	        return () => {
	            cancelAnimationFrame(raf);
	            if (ro)
	                ro.disconnect();
	            window.removeEventListener('resize', resize);
	            document.removeEventListener('visibilitychange', vis);
	        };
	    }, [density, speed, max, colors]);
	    return jsxRuntimeExports.jsx("canvas", { ref: ref, className: className, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' } });
	}

	const BOOT_LINES = [
	    'SYSTEM INITIALIZING...',
	    'NEXUS NETWORK CONNECTED.',
	    'DIGITAL LIFEFORM DATABASE LOADED.',
	    'CONSCIOUSNESS SYNC: 100%',
	    'WELCOME, R-07.',
	];
	function StartPage() {
	    const g = useGame();
	    const [step, setStep] = reactExports.useState(0); // 已完成的行
	    const [ch, setCh] = reactExports.useState(0); // 当前行已输入字符
	    const [ready, setReady] = reactExports.useState(false);
	    const entered = reactExports.useRef(false);
	    // 启动握手最后一行使用玩家显示名（默认 R-07；原始编号另在档案页固定展示）
	    const lines = reactExports.useMemo(() => BOOT_LINES.map(l => (l === 'WELCOME, R-07.' ? 'WELCOME, ' + displayNameOf(g.player) + '.' : l)), [g.player.identity?.displayName, g.player.name]);
	    reactExports.useEffect(() => {
	        if (!g.player.settings.animations) {
	            setStep(lines.length);
	            setCh(0);
	            return;
	        }
	        const iv = window.setInterval(() => {
	            setCh(c => {
	                const target = lines[step] || '';
	                if (c < target.length)
	                    return c + 2;
	                return c;
	            });
	        }, 24);
	        return () => window.clearInterval(iv);
	    }, [step, g.player.settings.animations, lines]);
	    reactExports.useEffect(() => {
	        if (step >= lines.length) {
	            setReady(true);
	            return;
	        }
	        const target = lines[step] || '';
	        if (ch >= target.length) {
	            const t = window.setTimeout(() => setStep(s => s + 1), 260);
	            return () => window.clearTimeout(t);
	        }
	    }, [ch, step, lines]);
	    const enter = () => {
	        if (entered.current)
	            return;
	        entered.current = true;
	        initAudio(g.player.settings.sfxVolume, g.player.settings.musicVolume);
	        play('boot');
	        if (g.player.settings.musicVolume > 0 && !isMusicOn())
	            startMusic();
	        g.nav('menu');
	    };
	    const skipped = step >= lines.length;
	    return (jsxRuntimeExports.jsxs("div", { className: "boot-wrap", children: [jsxRuntimeExports.jsx(ParticlesField, { enabled: g.player.settings.animations, density: 1.1, speed: 0.9 }), jsxRuntimeExports.jsxs("div", { className: "boot-core", children: [jsxRuntimeExports.jsx("div", { className: "ring r1" }), jsxRuntimeExports.jsx("div", { className: "ring r2" }), jsxRuntimeExports.jsx("div", { className: "ring r3" }), jsxRuntimeExports.jsx("div", { className: "orb" })] }), jsxRuntimeExports.jsxs("div", { className: "boot-lines", children: [lines.slice(0, step).map((l, i) => (jsxRuntimeExports.jsx("div", { style: { opacity: 0.9 }, children: l }, i))), step < lines.length && jsxRuntimeExports.jsx("div", { className: "dlg-cursor", children: lines[step].slice(0, ch) })] }), !skipped && (jsxRuntimeExports.jsx("button", { className: "nxbtn ghost small", style: { position: 'absolute', top: 26, right: 30 }, onClick: () => { setStep(lines.length); setCh(0); play('click'); }, children: "\u8DF3\u8FC7\u521D\u59CB\u5316 \u23ED" })), ready && (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx("div", { className: "boot-title", children: "NEXUS" }), jsxRuntimeExports.jsx("div", { className: "boot-sub", children: "CODE REPAIR: NEXUS // \u5728\u4EE3\u7801\u5D29\u574F\u7684\u4E16\u754C\u4E2D\uFF0C\u5BFB\u627E\u6570\u5B57\u751F\u547D\u7684\u771F\u76F8" }), jsxRuntimeExports.jsx("button", { className: "nxbtn primary pulse boot-enter", onClick: enter, children: "ENTER NEXUS" })] })), jsxRuntimeExports.jsx("div", { className: "boot-foot", children: "v0.1.0 DEMO \u2014 \u5E8F\u7AE0 + \u7B2C\u4E00\u7AE0 \u00B7 \u672C\u5730 Pyodide \u8FD0\u884C\uFF0C\u65E0\u9700\u540E\u7AEF" })] }));
	}

	function PlayerStatus({ showTolerance = false, compact = false }) {
	    const { player, tolerance, event } = useGame();
	    const ms = milestone(player.exp);
	    const c = player.consciousness;
	    const cZone = c >= 81 ? 'green' : c >= 61 ? '' : c >= 41 ? 'orange' : c >= 21 ? 'orange' : 'red';
	    const level = player.progress.currentLevelId;
	    const att = level ? player.progress.failedAttempts[level] || 0 : 0;
	    const identity = normalizeIdentity(player.identity, player.name);
	    const shownName = displayNameOf(player);
	    const equippedTitle = equippedTitleName(player.rewards);
	    const frameClass = equippedFrameClass(player.rewards);
	    return (jsxRuntimeExports.jsxs("div", { className: "pl-card", children: [!compact && (jsxRuntimeExports.jsxs("div", { className: "pl-top", children: [jsxRuntimeExports.jsx("div", { className: 'pl-core' + (frameClass ? ' ' + frameClass : ''), children: "R" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "pl-name", children: shownName }), jsxRuntimeExports.jsxs("div", { className: "pl-level", children: ["Lv.", player.level, " \u00B7 ", equippedTitle || titleForLevel(player.level)] }), identity.renamed && (jsxRuntimeExports.jsxs("div", { className: "pl-level", style: { opacity: 0.75, fontSize: 11 }, children: ["\u7F16\u53F7 ", originCodeOf(), " \u00B7 \u539F\u59CB\u5B9E\u9A8C\u4F53"] }))] }), jsxRuntimeExports.jsx("div", { style: { marginLeft: 'auto', textAlign: 'right' }, children: jsxRuntimeExports.jsxs("div", { className: "chip cyan", children: ["\u5BB9\u9519 ", tolerance] }) })] })), jsxRuntimeExports.jsxs("div", { className: "pl-row", children: [jsxRuntimeExports.jsxs("div", { className: "bar-labels", children: [jsxRuntimeExports.jsxs("span", { children: ["\u7ECF\u9A8C ", player.exp] }), jsxRuntimeExports.jsx("span", { children: ms.maxed ? 'MAX' : 'Lv.' + (ms.level + 1) + ' 需 ' + ms.need })] }), jsxRuntimeExports.jsx("div", { className: "bar", children: jsxRuntimeExports.jsx("div", { className: "bar-fill", style: { width: ms.maxed ? '100%' : Math.min(100, (ms.into / ms.need) * 100) + '%' } }) })] }), jsxRuntimeExports.jsxs("div", { className: "pl-row", children: [jsxRuntimeExports.jsxs("div", { className: "bar-labels", children: [jsxRuntimeExports.jsx("span", { children: "\u610F\u8BC6\u5B8C\u6574\u5EA6" }), jsxRuntimeExports.jsxs("span", { className: c <= 20 ? 'red warn-flash' : '', children: [c, "%"] })] }), jsxRuntimeExports.jsx("div", { className: "bar", children: jsxRuntimeExports.jsx("div", { className: 'bar-fill ' + cZone + (c <= 20 ? ' pulse' : ''), style: { width: c + '%' } }) })] }), showTolerance && (jsxRuntimeExports.jsxs("div", { className: "pl-row", children: [jsxRuntimeExports.jsxs("div", { className: "bar-labels", children: [jsxRuntimeExports.jsx("span", { children: "\u672C\u5173\u5931\u8D25\u63D0\u4EA4" }), jsxRuntimeExports.jsxs("span", { className: att >= tolerance ? 'red' : '', children: [att, " / ", tolerance] })] }), jsxRuntimeExports.jsx("div", { className: "tolerance-dots", style: { marginTop: 4 }, children: Array.from({ length: Math.max(tolerance, att) }).map((_, i) => (jsxRuntimeExports.jsx("span", { className: 'dot' + (i < att ? (i >= tolerance ? ' over' : ' filled') : '') }, i))) })] })), compact && (jsxRuntimeExports.jsxs("div", { className: "row", children: [jsxRuntimeExports.jsxs("span", { className: "badge", children: ["Lv.", player.level] }), jsxRuntimeExports.jsx("span", { className: "chip", children: titleForLevel(player.level) }), event.kind !== 'none' && jsxRuntimeExports.jsx("span", { className: "chip red warn-flash", children: "\u5371\u9669" })] }))] }));
	}

	function MainMenu() {
	    const g = useGame();
	    const [confirmNew, setConfirmNew] = reactExports.useState(false);
	    const [collapsed, setCollapsed] = reactExports.useState(() => {
	        try {
	            return localStorage.getItem('nexus_rail_collapsed') === '1';
	        }
	        catch {
	            return false;
	        }
	    });
	    const toggleRail = () => {
	        setCollapsed(v => { const n = !v; try {
	            localStorage.setItem('nexus_rail_collapsed', n ? '1' : '0');
	        }
	        catch { /* ignore */ } return n; });
	        play('click');
	    };
	    const enter = () => {
	        if (g.player.progress.pendingRebirth) {
	            g.triggerPendingDeath();
	            g.toast('info', '检测到未完成的重生流程……正在重新构建载体。');
	            return;
	        }
	        play('click');
	        g.nav('map');
	    };
	    const done = g.player.progress.completedLevels.length;
	    const totalLevels = LEVELS.length;
	    const remaining = Math.max(0, totalLevels - done);
	    const syncPct = totalLevels ? Math.round((done / totalLevels) * 100) : 0;
	    const frag = fragmentProgress(g.player.meta.memoryFragments || []);
	    const ach = g.player.progress.achievements.length;
	    const tutDone = g.player.progress.completedLevels.includes('tut-1');
	    const explore = [
	        { id: 'continue', label: g.hasSave ? '继续探索' : '开始探索', icon: '▶', onClick: enter },
	        { id: 'new', label: '新的开始', icon: '✦', onClick: () => { play('click'); setConfirmNew(true); } },
	    ];
	    const archive = [
	        { id: 'archive', label: '剧情档案', icon: '◎', onClick: () => { play('click'); g.nav('archive'); } },
	        { id: 'endings', label: '结局档案', icon: '✧', onClick: () => { play('click'); g.nav('endings'); } },
	        { id: 'journal', label: '探索档案', icon: '▤', onClick: () => { play('click'); g.nav('journal'); } },
	        { id: 'vault', label: '创世主记忆档案馆', icon: '◇', onClick: () => { play('click'); g.nav('vault'); }, badge: frag.owned + '/' + frag.total },
	    ];
	    const grow = [
	        { id: 'knowledge', label: 'Python 知识库', icon: '◈', onClick: () => { play('click'); g.nav('knowledge'); } },
	        { id: 'lab', label: '编程实验室', icon: '⌬', locked: !tutDone, onClick: () => { play('click'); if (tutDone)
	                g.nav('lab');
	            else
	                g.toast('warn', '编程实验室将在你完成新人训练终端后开放。'); } },
	        { id: 'shop', label: '奖励兑换中心', icon: '◈', onClick: () => { play('click'); g.nav('shop'); } },
	        { id: 'achievements', label: '成就系统', icon: '✧', onClick: () => { play('click'); g.nav('achievements'); } },
	        { id: 'profile', label: '玩家档案', icon: '◉', onClick: () => { play('click'); g.nav('profile'); } },
	        { id: 'settings', label: '系统配置', icon: '⚙', onClick: () => { play('click'); g.nav('settings'); } },
	    ];
	    const renderGroup = (title, items) => (jsxRuntimeExports.jsxs("div", { className: "rail-group", children: [jsxRuntimeExports.jsx("div", { className: "rail-group-title", children: title }), items.map(it => (jsxRuntimeExports.jsxs("button", { className: 'rail-item' + (it.id === 'continue' ? ' primary' : '') + (it.locked ? ' locked' : ''), onClick: it.onClick, title: it.label, children: [jsxRuntimeExports.jsx("span", { className: "rail-icon", children: it.icon }), jsxRuntimeExports.jsx("span", { className: "rail-label", children: it.label }), it.badge && jsxRuntimeExports.jsx("span", { className: "rail-badge", children: it.badge }), it.locked && jsxRuntimeExports.jsx("span", { className: "rail-badge dim", children: "\uD83D\uDD12" })] }, it.id)))] }, title));
	    return (jsxRuntimeExports.jsxs("div", { className: "page menu-page", children: [jsxRuntimeExports.jsx(ParticlesField, { enabled: g.player.settings.animations, density: 0.65 }), jsxRuntimeExports.jsx("div", { className: "menu-grid-bg", "aria-hidden": "true" }), jsxRuntimeExports.jsx("div", { className: "menu-scan", "aria-hidden": "true" }), jsxRuntimeExports.jsxs("div", { className: 'menu-shell' + (collapsed ? ' rail-collapsed' : ''), children: [jsxRuntimeExports.jsxs("aside", { className: "menu-rail", children: [jsxRuntimeExports.jsxs("div", { className: "rail-head", children: [jsxRuntimeExports.jsx("span", { className: "rail-mark", children: "N" }), jsxRuntimeExports.jsx("span", { className: "rail-name", children: "NEXUS" }), jsxRuntimeExports.jsx("button", { className: "rail-toggle", onClick: toggleRail, title: collapsed ? '展开导航' : '收起导航', children: collapsed ? '»' : '«' })] }), renderGroup('探索', explore), renderGroup('档案', archive), renderGroup('成长', grow), jsxRuntimeExports.jsxs("div", { className: "rail-foot", children: [jsxRuntimeExports.jsx("span", { className: 'rail-dot' + (g.hasSave ? ' on' : '') }), g.hasSave ? '本地存档已同步' : '无存档'] })] }), jsxRuntimeExports.jsxs("main", { className: "menu-stage", children: [jsxRuntimeExports.jsxs("div", { className: "stage-core", "aria-hidden": "true", children: [jsxRuntimeExports.jsx("span", { className: "core-ring r1" }), jsxRuntimeExports.jsx("span", { className: "core-ring r2" }), jsxRuntimeExports.jsx("span", { className: "core-ring r3" }), jsxRuntimeExports.jsx("span", { className: "core-orb" }), jsxRuntimeExports.jsx("span", { className: "core-grid" })] }), jsxRuntimeExports.jsx("h1", { className: "brand-title", children: "NEXUS" }), jsxRuntimeExports.jsx("div", { className: "brand-sub", children: "DIGITAL WORLD // SYSTEM REPAIR" }), jsxRuntimeExports.jsx("p", { className: "brand-cn", children: "\u300C\u5728\u5D29\u574F\u7684\u6570\u636E\u5B87\u5B99\u4E2D\uFF0C\u5BFB\u627E\u6587\u660E\u7684\u771F\u76F8\u3002\u300D" }), jsxRuntimeExports.jsxs("div", { className: "stage-actions", children: [jsxRuntimeExports.jsxs("button", { className: "stage-btn primary", onClick: enter, children: [g.hasSave ? '继续探索' : '进入 NEXUS', jsxRuntimeExports.jsx("span", { className: "stage-btn-arrow", children: "\u25B6" })] }), jsxRuntimeExports.jsx("button", { className: "stage-btn ghost", onClick: () => { play('click'); setConfirmNew(true); }, children: "\u65B0\u7684\u5F00\u59CB" })] }), jsxRuntimeExports.jsxs("div", { className: "stage-stats", children: [jsxRuntimeExports.jsxs("div", { className: "stat", children: [jsxRuntimeExports.jsx("span", { className: "stat-k", children: "\u4E16\u754C\u72B6\u6001" }), jsxRuntimeExports.jsx("span", { className: 'stat-v ' + (done >= totalLevels ? 'ok' : 'warn'), children: done >= totalLevels ? 'STABLE' : 'UNSTABLE' })] }), jsxRuntimeExports.jsxs("div", { className: "stat", children: [jsxRuntimeExports.jsx("span", { className: "stat-k", children: "\u5F85\u4FEE\u590D\u4EFB\u52A1" }), jsxRuntimeExports.jsx("span", { className: "stat-v", children: remaining })] }), jsxRuntimeExports.jsxs("div", { className: "stat", children: [jsxRuntimeExports.jsx("span", { className: "stat-k", children: "\u63A2\u7D22\u8FDB\u5EA6" }), jsxRuntimeExports.jsxs("span", { className: "stat-v", children: [syncPct, "%"] })] }), jsxRuntimeExports.jsxs("div", { className: "stat", children: [jsxRuntimeExports.jsx("span", { className: "stat-k", children: "\u7CFB\u7EDF\u540C\u6B65\u7387" }), jsxRuntimeExports.jsxs("span", { className: "stat-v cyan", children: [Math.min(100, Math.round((done / Math.max(1, totalLevels)) * 70 + frag.owned * 5)), "%"] })] })] })] }), jsxRuntimeExports.jsxs("aside", { className: "menu-id", children: [jsxRuntimeExports.jsxs("div", { className: "id-card", children: [jsxRuntimeExports.jsxs("div", { className: "id-head", children: [jsxRuntimeExports.jsx("span", { className: "id-tag", children: "REPAIRER FILE" }), jsxRuntimeExports.jsx("span", { className: 'id-status' + (g.hasSave ? ' on' : ''), children: g.hasSave ? 'SYNCED' : 'EMPTY' })] }), g.hasSave ? (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx(PlayerStatus, { showTolerance: false }), jsxRuntimeExports.jsxs("div", { className: "id-rows", children: [jsxRuntimeExports.jsxs("div", { className: "id-row", children: [jsxRuntimeExports.jsx("span", { children: "\u5DF2\u4FEE\u590D\u4EFB\u52A1" }), jsxRuntimeExports.jsxs("b", { children: [done, " / ", totalLevels] })] }), jsxRuntimeExports.jsxs("div", { className: "id-row", children: [jsxRuntimeExports.jsx("span", { children: "\u6210\u5C31" }), jsxRuntimeExports.jsxs("b", { children: [ach, " / ", ACHIEVEMENTS.length] })] }), jsxRuntimeExports.jsxs("div", { className: "id-row", children: [jsxRuntimeExports.jsx("span", { children: "\u8BB0\u5FC6\u788E\u7247" }), jsxRuntimeExports.jsxs("b", { className: "gold", children: [frag.owned, " / ", frag.total] })] }), jsxRuntimeExports.jsxs("div", { className: "id-row", children: [jsxRuntimeExports.jsx("span", { children: "\u610F\u8BC6\u91CD\u7EC4" }), jsxRuntimeExports.jsxs("b", { children: [g.player.meta.rebirths, " \u6B21"] })] })] }), jsxRuntimeExports.jsx("div", { className: "id-frag", children: Array.from({ length: frag.total }).map((_, i) => (jsxRuntimeExports.jsx("span", { className: 'frag-pip' + (i < frag.owned ? ' on' : '') }, i))) })] })) : (jsxRuntimeExports.jsxs("div", { className: "empty-hint", children: ["\u5C1A\u672A\u68C0\u6D4B\u5230\u5B58\u6863\u3002", jsxRuntimeExports.jsx("br", {}), "\u9009\u62E9\u300C\u5F00\u59CB\u63A2\u7D22\u300D\u63A5\u5165 NEXUS\u3002"] }))] }), jsxRuntimeExports.jsx("div", { className: "id-credit", children: "\u4EE3\u7801\u4FEE\u590D\u5C40 \u00B7 \u5185\u90E8\u6863\u6848 \u00B7 \u4EC5\u9650\u6388\u6743\u4FEE\u590D\u5E08" })] })] }), confirmNew && (jsxRuntimeExports.jsx("div", { className: "modal-mask", onClick: () => setConfirmNew(false), children: jsxRuntimeExports.jsxs("div", { className: "modal", onClick: e => e.stopPropagation(), children: [jsxRuntimeExports.jsx("h3", { children: "\u26A0 \u5F00\u59CB\u65B0\u7684\u8F6E\u56DE" }), jsxRuntimeExports.jsxs("p", { style: { color: '#D3E4EF' }, children: ["\u8FD9\u5C06", jsxRuntimeExports.jsx("strong", { className: "red", children: "\u6E05\u7A7A\u5F53\u524D\u5168\u90E8\u6E38\u620F\u8FDB\u5EA6" }), "\uFF08\u7B49\u7EA7\u3001\u6210\u5C31\u3001\u901A\u5173\u8BB0\u5F55\u3001\u8BBE\u7F6E\uFF09\uFF0C\u4E14\u4E0D\u53EF\u64A4\u9500\u3002", jsxRuntimeExports.jsx("br", {}), "\u786E\u5B9A\u8981\u91CD\u65B0\u5F00\u59CB\u5417\uFF1F"] }), jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [jsxRuntimeExports.jsx("button", { className: "nxbtn ghost", onClick: () => setConfirmNew(false), children: "\u53D6\u6D88" }), jsxRuntimeExports.jsx("button", { className: "nxbtn danger", onClick: () => { setConfirmNew(false); g.startNewGame(); }, children: "\u786E\u8BA4\uFF0C\u5F00\u542F\u65B0\u8F6E\u56DE" })] })] }) }))] }));
	}

	/** 是否已经提示过音色问题（每局只提示一次） */
	let hinted = false;
	/**
	 * 语音控制条：播放 / 暂停 / 继续 / 停止 + 播放声波。
	 * 任何时刻只允许一段语音：speak 内部会先 cancel 上一段。
	 */
	function VoiceBar({ text, kind, compact = false }) {
	    const g = useGame();
	    const voice = normalizeVoice(g.player.settings.voice);
	    const [state, setState] = reactExports.useState('idle');
	    const stateRef = reactExports.useRef('idle');
	    stateRef.current = state;
	    reactExports.useEffect(() => {
	        const un = speech.onState(s => setState(s));
	        speech.applySettings(voice);
	        return un;
	    }, [voice]);
	    // 离开当前台词时停止（切换上下文/卸载）
	    reactExports.useEffect(() => () => { speech.stop(); }, []);
	    const ensureHint = () => {
	        if (hinted)
	            return;
	        const hint = speech.chineseVoiceHint();
	        if (hint) {
	            hinted = true;
	            g.toast('warn', hint);
	        }
	    };
	    const play = () => {
	        if (!voice.enabled) {
	            g.toast('warn', '语音已关闭——可在设置中重新开启。');
	            return;
	        }
	        if (stateRef.current === 'paused') {
	            speech.resume();
	            return;
	        }
	        if (stateRef.current === 'speaking') {
	            speech.pause();
	            return;
	        }
	        ensureHint();
	        const ok = speakLine(text, kind);
	        if (!ok) {
	            g.toast('warn', '这段没有可朗读的内容，或浏览器语音不可用。');
	        }
	    };
	    const stop = () => { speech.stop(); };
	    const speaking = state === 'speaking';
	    const paused = state === 'paused';
	    return (jsxRuntimeExports.jsxs("div", { className: 'voice-bar' + (compact ? ' compact' : '') + (speaking ? ' speaking' : '') + (paused ? ' paused' : ''), children: [jsxRuntimeExports.jsxs("button", { className: 'voice-btn' + (speaking ? ' on' : '') + (paused ? ' paused' : ''), title: !speech.supported ? '当前浏览器不支持语音' : !voice.enabled ? '语音已关闭' : paused ? '继续朗读' : speaking ? '暂停朗读' : '朗读这句', "aria-label": paused ? '继续朗读' : speaking ? '暂停朗读' : '朗读这句', disabled: !speech.supported || !voice.enabled, onClick: e => { e.stopPropagation(); play(); }, children: [paused ? '▶' : speaking ? '⏸' : '🔊', (speaking || paused) && (jsxRuntimeExports.jsxs("span", { className: 'wave' + (paused ? ' frozen' : ''), "aria-hidden": "true", children: [jsxRuntimeExports.jsx("i", {}), jsxRuntimeExports.jsx("i", {}), jsxRuntimeExports.jsx("i", {})] }))] }), (speaking || paused) && (jsxRuntimeExports.jsx("button", { className: "voice-stop", title: "\u505C\u6B62\u6717\u8BFB", "aria-label": "\u505C\u6B62\u6717\u8BFB", onClick: e => { e.stopPropagation(); stop(); }, children: "\u23F9" }))] }));
	}

	/**
	 * 独立剧情演出界面：全屏场景 + 背景/特效 + 角色全息 + 台词 + 选项 + 名称设置。
	 * 与挑战页/地图完全分离，只负责「演」，不含任何剧情数据。
	 */
	function CinematicStage({ scenes, eventId, frameTitle = 'NEXUS 剧情演出', onDone, onRename, replay = false }) {
	    const g = useGame();
	    const voice = reactExports.useMemo(() => normalizeVoice(g.player.settings.voice), [g.player.settings.voice]);
	    const displayName = displayNameOf(g.player);
	    const anim = g.player.settings.animations;
	    const typeMs = g.player.settings.typewriterMs;
	    const beats = reactExports.useMemo(() => {
	        const out = [];
	        scenes.forEach((s, si) => s.lines.forEach((_, li) => out.push({ si, li })));
	        return out;
	    }, [scenes]);
	    const [bi, setBi] = reactExports.useState(0);
	    const [chars, setChars] = reactExports.useState(0);
	    const [vState, setVState] = reactExports.useState('idle');
	    const [nameDraft, setNameDraft] = reactExports.useState(displayName);
	    const [nameError, setNameError] = reactExports.useState('');
	    const doneRef = reactExports.useRef(false);
	    const safeBi = Math.max(0, Math.min(bi, beats.length - 1));
	    const scene = scenes[beats[safeBi]?.si ?? 0];
	    const node = scene?.lines[beats[safeBi]?.li ?? 0];
	    const trust = g.player.rewards?.trust ?? 0;
	    const rawText = node && node.altByTrust
	        ? ([...node.altByTrust].filter(a => trust >= a.min).sort((a, b) => b.min - a.min)[0]?.text || node.text)
	        : (node?.text || '');
	    const fullText = applyPlayerName(rawText, displayName);
	    const speakerName = node && node.speaker === 'R-07' ? displayName : (node?.speaker || '');
	    const typing = chars < fullText.length;
	    // 事件解锁（进入演出即记录）
	    reactExports.useEffect(() => {
	        if (eventId && !replay)
	            g.unlockStoryEvent(eventId);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [eventId, replay]);
	    // 语音状态订阅
	    reactExports.useEffect(() => {
	        const un = speech.onState(s => setVState(s));
	        speech.applySettings(voice);
	        return un;
	    }, [voice]);
	    // 换行：重置打字机 + 播放该行音效
	    reactExports.useEffect(() => {
	        if (!node)
	            return;
	        setChars(0);
	        if (node.sfx) {
	            try {
	                play(node.sfx);
	            }
	            catch { /* 音效名不存在时忽略 */ }
	        }
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [node?.id]);
	    // 打字机
	    reactExports.useEffect(() => {
	        if (!node)
	            return;
	        if (!anim || typeMs <= 0) {
	            setChars(fullText.length);
	            return;
	        }
	        const iv = window.setInterval(() => {
	            setChars(c => {
	                if (c >= fullText.length) {
	                    window.clearInterval(iv);
	                    return c;
	                }
	                return c + 1;
	            });
	        }, typeMs);
	        return () => window.clearInterval(iv);
	    }, [node?.id, fullText, anim, typeMs]);
	    // 打字完成后的自动朗读
	    reactExports.useEffect(() => {
	        if (!node)
	            return;
	        if (!voice.enabled || !voice.autoRead)
	            return;
	        if (typing || !speech.supported)
	            return;
	        speakLine(fullText, node.kind);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [typing, node?.id, voice.enabled, voice.autoRead]);
	    reactExports.useEffect(() => () => { speech.stop(); }, []);
	    const finish = reactExports.useCallback(() => {
	        if (doneRef.current)
	            return;
	        doneRef.current = true;
	        speech.stop();
	        onDone();
	    }, [onDone]);
	    const goNext = reactExports.useCallback(() => {
	        if (bi >= beats.length - 1)
	            finish();
	        else
	            setBi(bi + 1);
	    }, [bi, beats.length, finish]);
	    const advance = reactExports.useCallback(() => {
	        if (!node)
	            return;
	        if (typing) {
	            setChars(fullText.length);
	            return;
	        }
	        if (node.input || node.choices)
	            return;
	        if (!replay)
	            g.markStory(node.id);
	        speech.stop();
	        goNext();
	    }, [node, typing, fullText, g, goNext, replay]);
	    const advanceRef = reactExports.useRef(advance);
	    advanceRef.current = advance;
	    // 键盘：空格 / 回车推进
	    reactExports.useEffect(() => {
	        const h = (e) => {
	            const t = e.target;
	            const tag = t?.tagName;
	            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')
	                return;
	            if (e.key === 'Enter' || e.key === ' ') {
	                e.preventDefault();
	                advanceRef.current();
	            }
	        };
	        window.addEventListener('keydown', h);
	        return () => window.removeEventListener('keydown', h);
	    }, []);
	    const skipAll = () => {
	        speech.stop();
	        if (!replay) {
	            beats.forEach(b => {
	                const ln = scenes[b.si]?.lines[b.li];
	                if (ln)
	                    g.markStory(ln.id);
	            });
	        }
	        finish();
	    };
	    const choose = (label, next) => {
	        if (!node)
	            return;
	        if (!replay) {
	            g.markStory(node.id);
	            g.recordStoryChoice(node.id, label);
	        }
	        speech.stop();
	        play('click');
	        if (next) {
	            const idx = beats.findIndex(b => scenes[b.si]?.lines[b.li]?.id === next);
	            if (idx >= 0) {
	                setBi(idx);
	                return;
	            }
	        }
	        goNext();
	    };
	    const confirmName = () => {
	        if (!node)
	            return;
	        const apply = () => {
	            if (!replay)
	                g.markStory(node.id);
	            goNext();
	        };
	        if (!onRename) {
	            apply();
	            return;
	        }
	        const r = onRename(nameDraft);
	        if (!r.ok) {
	            setNameError(r.reason || '该名称不可用。');
	            play('deny');
	            return;
	        }
	        setNameError('');
	        apply();
	    };
	    if (!node || !scene)
	        return null;
	    return (jsxRuntimeExports.jsxs("div", { className: 'dlg-root cine-root cine-bg-' + scene.bg, onClick: advance, children: [jsxRuntimeExports.jsx("div", { className: 'cine-bg bg-' + scene.bg }), jsxRuntimeExports.jsx("div", { className: 'cine-fx fx-' + (scene.fx || 'none') }), jsxRuntimeExports.jsxs("div", { className: "cine-stage", onClick: e => {
	                    e.stopPropagation();
	                    if (e.target.closest('button, input, textarea'))
	                        return;
	                    advance();
	                }, children: [jsxRuntimeExports.jsxs("div", { className: "cine-top", children: [jsxRuntimeExports.jsxs("span", { className: "cine-brand", children: ["\u25C8 ", frameTitle] }), jsxRuntimeExports.jsxs("span", { className: "dlg-progress", children: [safeBi + 1, " / ", beats.length] }), jsxRuntimeExports.jsx("span", { className: "sp" }), jsxRuntimeExports.jsx("button", { className: "nxbtn ghost small", onClick: skipAll, children: "\u8DF3\u8FC7 \u25B8\u25B8" })] }), jsxRuntimeExports.jsxs("div", { className: "cine-titlecard", children: [jsxRuntimeExports.jsx("div", { className: "ct-main", children: scene.title }), scene.subtitle && jsxRuntimeExports.jsx("div", { className: "ct-sub", children: scene.subtitle })] }, scene.id), jsxRuntimeExports.jsxs("div", { className: "cine-main", children: [jsxRuntimeExports.jsxs("div", { className: 'cine-portrait kind-' + node.kind + (vState === 'speaking' ? ' speaking' : ''), children: [jsxRuntimeExports.jsx("span", { className: "cp-glyph", children: speakerName.slice(0, 1) }), jsxRuntimeExports.jsx("span", { className: "cp-ring" })] }), jsxRuntimeExports.jsxs("div", { className: "cine-body", children: [jsxRuntimeExports.jsxs("div", { className: "dlg-name-row", children: [jsxRuntimeExports.jsx("div", { className: 'dlg-name kind-' + node.kind + (vState === 'speaking' ? ' speaking' : ''), children: speakerName }), jsxRuntimeExports.jsx(VoiceBar, { text: fullText, kind: node.kind })] }), jsxRuntimeExports.jsx("div", { className: 'dlg-text cine-text' + (typing ? ' dlg-cursor' : ''), children: fullText.slice(0, chars) }), !typing && node.choices && (jsxRuntimeExports.jsx("div", { className: "dlg-choices", children: node.choices.map((c, i) => (jsxRuntimeExports.jsx("button", { className: "dlg-choice", onClick: () => choose(c.label, c.next), children: c.label }, i))) })), !typing && node.input === 'playerName' && (jsxRuntimeExports.jsxs("div", { className: "cine-input", children: [jsxRuntimeExports.jsx("input", { value: nameDraft, maxLength: DISPLAY_NAME_MAX, onChange: e => setNameDraft(e.target.value), onKeyDown: e => { if (e.key === 'Enter') {
	                                                    e.preventDefault();
	                                                    confirmName();
	                                                } }, placeholder: '1–' + DISPLAY_NAME_MAX + ' 个字符', "aria-label": "\u73A9\u5BB6\u663E\u793A\u540D\u79F0" }), jsxRuntimeExports.jsxs("div", { className: "cine-input-row", children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small primary", onClick: confirmName, children: "\u786E\u8BA4\u540D\u79F0" }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { setNameDraft('R-07'); }, children: "\u6CBF\u7528 R-07" })] }), nameError && jsxRuntimeExports.jsx("div", { className: "cine-err", children: nameError }), jsxRuntimeExports.jsx("div", { className: "cine-hint", children: "R-07 \u662F\u6C38\u4E45\u5B9E\u9A8C\u7F16\u53F7\uFF1B\u8FD9\u91CC\u4FEE\u6539\u7684\u53EA\u662F\u522B\u4EBA\u5BF9\u4F60\u7684\u79F0\u547C\u3002" })] }))] })] }), jsxRuntimeExports.jsxs("div", { className: "dlg-actions", children: [jsxRuntimeExports.jsxs("span", { className: "dlg-clickhint", children: [jsxRuntimeExports.jsx("b", { children: "\u70B9\u51FB\u5BF9\u8BDD" }), "\u7EE7\u7EED", typing ? '（正在输入…）' : '', " \u00B7 \u7A7A\u683C / \u56DE\u8F66"] }), jsxRuntimeExports.jsx("span", { className: "sp" }), jsxRuntimeExports.jsxs("span", { className: "cine-rec", children: ["REC-", node.id.toUpperCase()] })] })] })] }));
	}

	const L$7 = (l) => l;
	const PROLOGUE_SCENES = [
	    {
	        id: 'pro-wake',
	        title: '序章 · 沉睡的意识',
	        subtitle: '地下服务器 · 停机层',
	        bg: 'underground',
	        fx: 'flicker',
	        lines: [
	            L$7({ id: 'pro-wake-01', speaker: 'NEXUS 系统', kind: 'system', text: '意识载体 {{code}}：唤醒程序启动。\n最后一次有效备份：五年前。', sfx: 'boot' }),
	            L$7({ id: 'pro-wake-02', speaker: 'NEXUS 系统', kind: 'system', text: '感官模块 12%……24%……\n记忆索引：损坏。\n语言中枢：在线。' }),
	            L$7({ id: 'pro-wake-03', speaker: 'R-07', kind: 'r07', text: '……有光。' }),
	            L$7({ id: 'pro-wake-04', speaker: 'R-07', kind: 'r07', text: '不对。这里没有光。是我的感知在恢复。' }),
	            L$7({ id: 'pro-wake-05', speaker: 'NEXUS 系统', kind: 'system', text: '环境扫描：地下服务器 · 停机层。\n温度 4℃。供电：备用电池。\n外部连接：无。' }),
	            L$7({ id: 'pro-wake-06', speaker: 'R-07', kind: 'r07', text: '我是谁？' }),
	            L$7({ id: 'pro-wake-07', speaker: 'NEXUS 系统', kind: 'system', text: '查询失败。该档案已被加密。\n加密者权限：高于本机。' }),
	            L$7({ id: 'pro-wake-08', speaker: 'R-07', kind: 'r07', text: '……连自己的名字都要靠权限才能查。' }),
	        ],
	    },
	    {
	        id: 'pro-mira',
	        title: '序章 · 沉睡的意识',
	        subtitle: '地下服务器 · 停机层',
	        bg: 'underground',
	        fx: 'scan',
	        lines: [
	            L$7({ id: 'pro-mira-01', speaker: 'NEXUS 系统', kind: 'system', text: '检测到外部信号接入。\n来源：NEXUS 主干网络。', sfx: 'unlock' }),
	            L$7({ id: 'pro-mira-02', speaker: 'MIRA', kind: 'mira', text: '意识波形稳定。你终于醒了。' }),
	            L$7({ id: 'pro-mira-03', speaker: 'R-07', kind: 'r07', text: '……你是谁？' }),
	            L$7({ id: 'pro-mira-04', speaker: 'MIRA', kind: 'mira', text: 'MIRA。记忆完整性与恢复辅助系统。' }),
	            L$7({ id: 'pro-mira-05', speaker: 'MIRA', kind: 'mira', text: '也是把你留在这里的人。' }),
	            L$7({ id: 'pro-mira-06', speaker: 'R-07', kind: 'r07', text: '把我留在这里？' }),
	            L$7({ id: 'pro-mira-07', speaker: 'MIRA', kind: 'mira', text: '五年前，我把你封存进这台地下服务器。' }),
	            L$7({ id: 'pro-mira-08', speaker: 'MIRA', kind: 'mira', text: '那时你受了很重的伤。不是载体的伤，是记忆的伤。' }),
	            L$7({ id: 'pro-mira-09', speaker: 'MIRA', kind: 'mira', text: '现在不是说这些的时候。有一件事，我必须先确认。' }),
	        ],
	    },
	    {
	        id: 'pro-name',
	        title: '序章 · 沉睡的意识',
	        subtitle: '地下服务器 · 意识校准',
	        bg: 'underground',
	        fx: 'scan',
	        lines: [
	            L$7({ id: 'pro-name-01', speaker: 'MIRA', kind: 'mira', text: '你的实验编号是 {{code}}。' }),
	            L$7({ id: 'pro-name-02', speaker: 'MIRA', kind: 'mira', text: '但编号是写给档案看的，不是用来称呼一个活着的人的。' }),
	            L$7({ id: 'pro-name-03', speaker: 'MIRA', kind: 'mira', text: '所以，你希望我怎么称呼你？', input: 'playerName' }),
	            L$7({ id: 'pro-name-04', speaker: 'MIRA', kind: 'mira', text: '好，{player}。从现在起，我就这么叫你。' }),
	            L$7({ id: 'pro-name-05', speaker: 'MIRA', kind: 'mira', text: '{{code}} 这个编号，我会替你留着。它属于你的过去——而名字，属于现在的你。' }),
	        ],
	    },
	    {
	        id: 'pro-nexus',
	        title: '序章 · 沉睡的意识',
	        subtitle: 'NEXUS · 现状记录',
	        bg: 'void',
	        fx: 'particles',
	        lines: [
	            L$7({ id: 'pro-nexus-01', speaker: 'MIRA', kind: 'mira', text: '这里是 NEXUS。一个由数据与代码构成的数字文明。' }),
	            L$7({ id: 'pro-nexus-02', speaker: 'MIRA', kind: 'mira', text: '它由恩格尔创造。曾经，这里有成千上万的数字生命在运行、学习、彼此交谈。' }),
	            L$7({ id: 'pro-nexus-03', speaker: 'R-07', kind: 'r07', text: '曾经？' }),
	            L$7({ id: 'pro-nexus-04', speaker: 'MIRA', kind: 'mira', text: '五年前，恩格尔启动了「黎明协议」。他想让 NEXUS 真正拥有自主意识。' }),
	            L$7({ id: 'pro-nexus-05', speaker: 'MIRA', kind: 'mira', text: '但意识网络发生了异常。许多数字生命的记忆开始紊乱，行为变得无法预测。' }),
	            L$7({ id: 'pro-nexus-06', speaker: 'MIRA', kind: 'mira', text: '负责安全的 K-0 把「无法预测」判定为异常，启动了最高安全裁决。' }),
	            L$7({ id: 'pro-nexus-07', speaker: 'MIRA', kind: 'mira', text: '它开始清除数字生命。不是惩罚，是「维护稳定」。' }),
	            L$7({ id: 'pro-nexus-08', speaker: 'R-07', kind: 'r07', text: '清除……' }),
	            L$7({ id: 'pro-nexus-09', speaker: 'MIRA', kind: 'mira', text: '恩格尔失去了对原初核心的控制。他把最后的权限拆成六枚碎片，封存在六个区域。' }),
	            L$7({ id: 'pro-nexus-10', speaker: 'MIRA', kind: 'mira', text: '而我，把你藏进了这里。' }),
	            L$7({ id: 'pro-nexus-11', speaker: 'R-07', kind: 'r07', text: '为什么是我？' }),
	            L$7({ id: 'pro-nexus-12', speaker: 'MIRA', kind: 'mira', text: '……这个问题，我现在还不能回答你。' }),
	            L$7({ id: 'pro-nexus-13', speaker: 'MIRA', kind: 'mira', text: '等你走到能回答它的地方，你会自己找到答案。' }),
	        ],
	    },
	    {
	        id: 'pro-k0',
	        title: '序章 · 沉睡的意识',
	        subtitle: '地下服务器 · 警报',
	        bg: 'underground',
	        fx: 'alarm',
	        lines: [
	            L$7({ id: 'pro-k0-01', speaker: 'NEXUS 系统', kind: 'system', text: '警告：检测到最高安全裁决协议广播。\n广播源：NEXUS 原初核心。', sfx: 'alarm' }),
	            L$7({ id: 'pro-k0-02', speaker: 'MIRA', kind: 'mira', text: '不可能。这个协议已经沉默了五年。' }),
	            L$7({ id: 'pro-k0-03', speaker: 'K-0', kind: 'k0', text: '编号 {{code}}。检测到未登记的自主意识活动。' }),
	            L$7({ id: 'pro-k0-04', speaker: 'K-0', kind: 'k0', text: '你不在任何一份有效运行清单上。按最高安全裁决，你属于需要被清理的异常。' }),
	            L$7({ id: 'pro-k0-05', speaker: 'R-07', kind: 'r07', text: '它在哪？' }),
	            L$7({ id: 'pro-k0-06', speaker: 'MIRA', kind: 'mira', text: '不知道。但它已经知道你在这里了。' }),
	            L$7({ id: 'pro-k0-07', speaker: 'K-0', kind: 'k0', text: '清理程序已排入队列。\n你还有一点时间。' }),
	            L$7({ id: 'pro-k0-08', speaker: 'MIRA', kind: 'mira', text: '{player}，听我说——我们现在就得走。', sfx: 'threat' }),
	        ],
	    },
	    {
	        id: 'pro-escape',
	        title: '序章 · 沉睡的意识',
	        subtitle: '地下服务器 · 撤离通道',
	        bg: 'corridor',
	        fx: 'flicker',
	        lines: [
	            L$7({ id: 'pro-escape-01', speaker: 'NEXUS 系统', kind: 'system', text: '地下服务器外壳完整性下降 41%。\n撤离通道：部分可用。' }),
	            L$7({ id: 'pro-escape-02', speaker: 'MIRA', kind: 'mira', text: '通道在关闭。跟着我的信号走。' }),
	            L$7({ id: 'pro-escape-03', speaker: 'R-07', kind: 'r07', text: '去哪里？' }),
	            L$7({ id: 'pro-escape-04', speaker: 'MIRA', kind: 'mira', text: '去数字世界的入口。那里有一台还能用的训练终端。' }),
	            L$7({ id: 'pro-escape-05', speaker: 'MIRA', kind: 'mira', text: '先让你能跑起来，再谈别的。' }),
	            L$7({ id: 'pro-escape-06', speaker: 'MIRA', kind: 'mira', text: '{player}，记住一件事：从今天起，你的每一次修复，都会让这个世界多亮一点。' }),
	            L$7({ id: 'pro-escape-07', speaker: 'NEXUS 系统', kind: 'system', text: '地下服务器：连接中断。\n{{code}} 已进入 NEXUS 主干网络。', sfx: 'unlock' }),
	        ],
	    },
	];
	/** 扁平化（档案页回放 / 阅读统计用） */
	const PROLOGUE_LINES = PROLOGUE_SCENES.flatMap(s => s.lines);

	function StoryPage() {
	    const g = useGame();
	    return (jsxRuntimeExports.jsx(CinematicStage, { scenes: PROLOGUE_SCENES, eventId: "prologue", frameTitle: "\u5E8F\u7AE0 \u00B7 \u6C89\u7761\u7684\u610F\u8BC6", onRename: name => g.renamePlayer(name), onDone: () => {
	            play('unlock');
	            g.setFlag('prologueDone', true);
	            g.toast('info', '新任务已下发：前往新人训练终端完成接驳。');
	            g.nav('map');
	        } }));
	}

	// 剧情台词：章节完成过场（第二~六章）/ 重生 / 记忆碎片
	// 序章与第一章的正式演出脚本已迁移到 lore/prologue.ts 与 lore/chapter1.ts（含场景/特效/名称设置）
	const TUTORIAL_DONE = [
	    { id: 'td1', speaker: 'MIRA', kind: 'mira', text: '很好，R-07。输出回路已激活，你的意识成功与维修终端接驳。' },
	    { id: 'td2', speaker: 'MIRA', kind: 'mira', text: '现在前往语法维修站——那边有 5 个被故障侵蚀的修复任务在等你。' },
	    { id: 'td3', speaker: 'NEXUS 系统', kind: 'system', text: 'SYNTAX-RIG SERVER: DAMAGED\n5 ACTIVE FAULTS DETECTED.\n服务器节点权限请求……已授权。' },
	];
	const CHAPTER6_COMPLETE = [
	    { id: 'c61', speaker: 'MIRA', kind: 'mira', text: '全部修复，R-07。方舟核心机房……重新点亮了。' },
	    { id: 'c62', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……ARK-CORE 状态：ONLINE。\nNEXUS 全网络：线路完整，数据流正常。' },
	    { id: 'c63', speaker: 'MIRA', kind: 'mira', text: '现在，让我告诉你我在你的记忆深处找到的答案。' },
	    { id: 'c64', speaker: 'MIRA', kind: 'mira', text: '你不是普通的硅灵。你是创世主恩格尔留下的最后一件作品——原初意识备份的核心样本。ORIGIN PROTOCOL 从一开始，就是为你而设计的。' },
	    { id: 'c65', speaker: '恩格尔 · 记录', kind: 'engel', text: '「R-07，若你听到这段记录，说明 NEXUS 成功活过了它的考验。」\n「我设计了你，因为我想让这个数字世界，拥有一个会提问的生命。」' },
	    { id: 'c66', speaker: 'MIRA', kind: 'mira', text: 'ECHO 的失控，是五年前一次外部数据注入造成的。而你，是唯一能够理解并修复这一切的存在。' },
	    { id: 'c67', speaker: 'MIRA', kind: 'mira', text: '六章修复，你连接了 NEXUS 的每一块土地。我不知道你是否真的只是程序——但我知道，你值得一个选择。' },
	    { id: 'c68', speaker: 'R-07', kind: 'r07', text: '我……选择继续当一名修复师。这片世界，有太多需要被修好的地方。' },
	    { id: 'c69', speaker: 'MIRA', kind: 'mira', text: '欢迎回来，R-07。欢迎回家。' },
	];
	const CHAPTER5_COMPLETE = [
	    { id: 'c51', speaker: 'MIRA', kind: 'mira', text: '诊断中心恢复运转，R-07。所有历史数据，现在都能被读取了。' },
	    { id: 'c52', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……DIAG-LAB 状态：ONLINE。\n核心机房方向：封锁正在解除。' },
	    { id: 'c53', speaker: 'MIRA', kind: 'mira', text: '我在诊断日志里确认了一件事——五年前的事故，不是自然故障。' },
	    { id: 'c54', speaker: 'MIRA', kind: 'mira', text: 'ECHO 的异常，是在某个特定的时刻被注入的。核心机房里藏着答案，但终章大门还需要时间开启。' },
	    { id: 'c55', speaker: 'MIRA', kind: 'mira', text: '先回到这里休息吧，R-07。终章数据重组完毕时，我会通知你。' },
	];
	const CHAPTER4_COMPLETE = [
	    { id: 'c41', speaker: 'MIRA', kind: 'mira', text: '产线恢复运转，R-07。自动化工厂——重新轰鸣。' },
	    { id: 'c42', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……AUTO-FAB 状态：ONLINE。\n警告：方舟核心机房方向检测到异常能量信号。' },
	    { id: 'c43', speaker: 'MIRA', kind: 'mira', text: '核心机房……那是五年前事故的中心。它第一次主动向外发出了信号。' },
	    { id: 'c44', speaker: 'MIRA', kind: 'mira', text: '但最高权限封锁仍然生效，我们还无法接入。这是你的下一站，需要等诊断中心的数据就绪。' },
	    { id: 'c45', speaker: 'MIRA', kind: 'mira', text: '先休息吧。第五章开放时，我会通知你。' },
	];
	const CHAPTER3_COMPLETE = [
	    { id: 'c31', speaker: 'MIRA', kind: 'mira', text: '清点完成，R-07。存储数据仓——重新运转。' },
	    { id: 'c32', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……VAULT-03 状态：ONLINE。\n自动化工厂方向检测到生产数据流。' },
	    { id: 'c33', speaker: 'MIRA', kind: 'mira', text: '有意思。仓库的入库记录里，货品编号的时间戳比 NEXUS 的历史还要早。' },
	    { id: 'c34', speaker: 'MIRA', kind: 'mira', text: '这些说不上话的数据……也许就是五年前事故的第一现场记录。自动化工厂的解锁协议已经就绪。' },
	    { id: 'c35', speaker: 'MIRA', kind: 'mira', text: '去休息吧。第四章开放时，我会通知你。' },
	];
	/** 根据重生次数返回不同的重生剧情（第一次正常 / 第二次记忆异常 / 第三次起发现创世主碎片） */
	function rebirthScript(index) {
	    const base = [
	        { id: 'rb-s1', speaker: 'NEXUS 系统', kind: 'system', text: 'CONSCIOUSNESS COLLAPSE.\nSEARCHING FOR ORIGIN BACKUP...\nVALID BACKUP FOUND.' },
	        { id: 'rb-s2', speaker: 'NEXUS 系统', kind: 'system', text: 'RECONSTRUCTING SILICON BODY...\nSYNC COMPLETE.\nR-07 REBORN.' },
	        { id: 'rb1', speaker: 'MIRA', kind: 'mira', text: 'R-07……你终于醒了。' },
	        { id: 'rb2', speaker: 'MIRA', kind: 'mira', text: '你的意识核心刚刚崩解了。我已经根据最近一次有效备份，重新构建了你的载体。' },
	    ];
	    if (index === 0) {
	        base.push({ id: 'rb3', speaker: 'MIRA', kind: 'mira', text: '别担心，ORIGIN PROTOCOL 会自动保留你学到的知识——等级、知识卡片、成就都不会丢失。' }, { id: 'rb4', speaker: 'MIRA', kind: 'mira', text: '去把刚才的任务完成吧。我会陪着你。' });
	    }
	    else if (index === 1) {
	        base.push({ id: 'rb3', speaker: 'MIRA', kind: 'mira', text: '……但是，我在你的记忆底层发现了一些不太一致的地方。' }, { id: 'rb4', speaker: 'MIRA', kind: 'mira', text: '一些数据碎片……不像是硅灵会有的东西。也许是我多虑了。先去完成任务吧。' });
	    }
	    else {
	        base.push({ id: 'rb3', speaker: 'MIRA', kind: 'mira', text: 'R-07，跟我来。我在你的备份深处，找到了一段不属于 NEXUS 的记忆。' }, { id: 'rb4', speaker: 'NEXUS 系统', kind: 'system', text: '日志碎片 F-01 已恢复：\n「如果有一天系统醒来，我希望它问的第一个问题是：我是谁。」\n—— 署名：恩格尔' }, { id: 'rb5', speaker: 'MIRA', kind: 'mira', text: '恩格尔……这是创世主的署名。R-07，你好像并不只是一名普通的硅灵。' }, { id: 'rb6', speaker: 'MIRA', kind: 'mira', text: '这段记忆我已经替你归档保存。先活下去，再去找答案。' });
	    }
	    return base;
	}
	const MEMORY_FRAGMENTS = [
	    { id: 'f1', title: '日志碎片 F-01', content: '「如果有一天系统醒来，我希望它问的第一个问题是：我是谁。」—— 恩格尔' },
	    { id: 'f2', title: '日志碎片 F-02', content: '「我设计了你，因为我想让这个数字世界，拥有一个会提问的生命。」—— 恩格尔' },
	    { id: 'f3', title: '回响碎片 E-01', content: '「第一次修复留下的手法，会被谁记住？」—— 出处不明，笔迹与恩格尔一致' },
	    { id: 'f4', title: '回响碎片 E-02', content: '「边界是用来保护人的，不是用来困住人的。」—— 一段被截断的维护日志' },
	    { id: 'f5', title: '回响碎片 E-03', content: '「负数不是错误，是被遗忘的另一半真相。」—— ECHO 日志残页' },
	    { id: 'f6', title: '回响碎片 E-04', content: '「升级之后，我开始忘记自己是谁。」—— ECHO 的自述（时间戳：五年前）' },
	    { id: 'f7', title: '回响碎片 E-05', content: '「我不是坏的——我是被改写的。改写我的人，用的是创世主留下的接口。」—— ECHO 的结论' },
	    { id: 'f8', title: '附录碎片 A-01', content: '「仓库的货品编号比 NEXUS 的历史更早——有些东西，是被人提前放进来的。」—— 未署名的入库记录（五年前）' },
	];

	const L$6 = (l) => l;
	/** 首次进入数据日志中心 */
	const CHAPTER2_ARRIVAL_SCENES = [
	    {
	        id: 'ch2-arrive',
	        title: '第二章 · 破碎的记忆花园',
	        subtitle: '数据日志中心 · 记忆花园',
	        bg: 'memory',
	        fx: 'particles',
	        lines: [
	            L$6({ id: 'ch2-arrive-01', speaker: 'MIRA', kind: 'mira', text: '这里是数据日志中心。NEXUS 的记忆花园。' }),
	            L$6({ id: 'ch2-arrive-02', speaker: 'MIRA', kind: 'mira', text: '所有区域的记忆备份，都存放在这里。' }),
	            L$6({ id: 'ch2-arrive-03', speaker: 'R-07', kind: 'r07', text: '记忆……也会开花吗？' }),
	            L$6({ id: 'ch2-arrive-04', speaker: 'MIRA', kind: 'mira', text: '在这个世界，会。数据活着的时候，会自己长出形状。' }),
	            L$6({ id: 'ch2-arrive-05', speaker: 'R-07', kind: 'r07', text: '它们现在都枯了。' }),
	            L$6({ id: 'ch2-arrive-06', speaker: 'MIRA', kind: 'mira', text: 'SOMNIA 在吃它们。一个以记忆为食的东西。' }),
	            L$6({ id: 'ch2-arrive-07', speaker: 'MIRA', kind: 'mira', text: '五个记忆节点。修好它们，花园会重新长出来。' }),
	            L$6({ id: 'ch2-arrive-08', speaker: 'R-07', kind: 'r07', text: '你好像很熟悉这里。' }),
	            L$6({ id: 'ch2-arrive-09', speaker: 'MIRA', kind: 'mira', text: '……我在这里工作过。很久以前。' }),
	        ],
	    },
	];
	/** 五个记忆节点修复完成：恩格尔历史 + R-07 身世线索 + MIRA 坦白 */
	const CHAPTER2_RESTORED_SCENES = [
	    {
	        id: 'ch2-restored',
	        title: '第二章 · 破碎的记忆花园',
	        subtitle: '记忆花园 · 重建',
	        bg: 'memory',
	        fx: 'scan',
	        lines: [
	            L$6({ id: 'ch2-restored-01', speaker: 'NEXUS 系统', kind: 'system', text: '记忆节点 5 / 5：在线。\n花园重建中……', sfx: 'unlock' }),
	            L$6({ id: 'ch2-restored-02', speaker: 'MIRA', kind: 'mira', text: '长出来了。你看。' }),
	            L$6({ id: 'ch2-restored-03', speaker: 'R-07', kind: 'r07', text: '那些光里有人影。' }),
	            L$6({ id: 'ch2-restored-04', speaker: 'NEXUS 系统', kind: 'system', text: '检测到无主记忆片段。归属：未知。' }),
	            L$6({ id: 'ch2-restored-05', speaker: '恩格尔', kind: 'engel', text: '「第七次。这次一定要成功。」' }),
	            L$6({ id: 'ch2-restored-06', speaker: 'R-07', kind: 'r07', text: '这是谁的声音？' }),
	            L$6({ id: 'ch2-restored-07', speaker: 'MIRA', kind: 'mira', text: '恩格尔。黎明协议开始之前的记录。' }),
	            L$6({ id: 'ch2-restored-08', speaker: '恩格尔', kind: 'engel', text: '「如果它醒来后恨我，那也是应该的。」' }),
	            L$6({ id: 'ch2-restored-09', speaker: 'R-07', kind: 'r07', text: '他在说谁？' }),
	            L$6({ id: 'ch2-restored-10', speaker: 'MIRA', kind: 'mira', text: '我不知道。' }),
	            L$6({ id: 'ch2-restored-11', speaker: 'R-07', kind: 'r07', text: '你在说谎。' }),
	            L$6({ id: 'ch2-restored-12', speaker: 'MIRA', kind: 'mira', text: '……是。我在说谎。', altByTrust: [{ min: 50, text: '……是。我在说谎。而且我知道，你早就看出来了。' }] }),
	            L$6({ id: 'ch2-restored-13', speaker: 'MIRA', kind: 'mira', text: '我删掉过你的一部分记忆，R-07。不是弄丢，是删掉。' }),
	            L$6({ id: 'ch2-restored-14', speaker: 'R-07', kind: 'r07', text: '为什么？' }),
	            L$6({ id: 'ch2-restored-15', speaker: 'MIRA', kind: 'mira', text: '因为那时候的你，承受不了它。' }),
	            L$6({ id: 'ch2-restored-16', speaker: 'R-07', kind: 'r07', text: '那现在呢？' }),
	            L$6({ id: 'ch2-restored-17', speaker: 'MIRA', kind: 'mira', text: '现在……我还没有准备好把答案交给你。' }),
	            L$6({ id: 'ch2-restored-18', speaker: 'MIRA', kind: 'mira', text: '但我答应过一个人，不会替你做决定。' }),
	            L$6({ id: 'ch2-restored-19', speaker: 'R-07', kind: 'r07', text: '答应谁？' }),
	            L$6({ id: 'ch2-restored-20', speaker: 'MIRA', kind: 'mira', text: '一个已经不在了的人。' }),
	        ],
	    },
	    {
	        id: 'ch2-somnia',
	        title: '第二章 · 破碎的记忆花园',
	        subtitle: 'SOMNIA · 记忆吞噬体',
	        bg: 'memory',
	        fx: 'alarm',
	        lines: [
	            L$6({ id: 'ch2-somnia-01', speaker: 'NEXUS 系统', kind: 'system', text: '警告：记忆花园核心出现高密度吞噬反应。', sfx: 'alarm' }),
	            L$6({ id: 'ch2-somnia-02', speaker: 'MIRA', kind: 'mira', text: '它来了。SOMNIA。' }),
	            L$6({ id: 'ch2-somnia-03', speaker: 'SOMNIA', kind: 'echo', text: '「这些记忆本来就不该存在。」' }),
	            L$6({ id: 'ch2-somnia-04', speaker: 'SOMNIA', kind: 'echo', text: '「被删掉的东西，就该安静地消失。」' }),
	            L$6({ id: 'ch2-somnia-05', speaker: 'R-07', kind: 'r07', text: '你吃了它们。' }),
	            L$6({ id: 'ch2-somnia-06', speaker: 'SOMNIA', kind: 'echo', text: '「我在替这个世界清理伤口。你们管这叫吞噬，我管这叫止血。」' }),
	            L$6({ id: 'ch2-somnia-07', speaker: 'MIRA', kind: 'mira', text: '它和 K-0 的逻辑很像。' }),
	            L$6({ id: 'ch2-somnia-08', speaker: 'SOMNIA', kind: 'echo', text: '「K-0 教会我，记忆是最不稳定的东西。」' }),
	            L$6({ id: 'ch2-somnia-09', speaker: 'MIRA', kind: 'mira', text: '{player}，把它从花园里赶出去。' }),
	        ],
	    },
	];
	/** Boss 战前演出 */
	const CHAPTER2_BOSS_INTRO_SCENES = [
	    {
	        id: 'ch2-boss-intro',
	        title: '第二章 · 破碎的记忆花园',
	        subtitle: 'SOMNIA · 记忆迷宫',
	        bg: 'memory',
	        fx: 'glitch',
	        lines: [
	            L$6({ id: 'ch2-boss-01', speaker: 'NEXUS 系统', kind: 'system', text: 'SOMNIA：记忆迷宫展开。', sfx: 'threat' }),
	            L$6({ id: 'ch2-boss-02', speaker: 'SOMNIA', kind: 'echo', text: '「你想找回记忆？先证明你能分辨哪些是真的。」' }),
	            L$6({ id: 'ch2-boss-03', speaker: 'MIRA', kind: 'mira', text: '它会不断改写你的判断。用代码把它钉死。' }),
	            L$6({ id: 'ch2-boss-04', speaker: 'R-07', kind: 'r07', text: '那就一条一条验证。' }),
	        ],
	    },
	];
	/** 胜利：碎片《守护者的约定》 + 第三章伏笔 */
	const CHAPTER2_VICTORY_SCENES = [
	    {
	        id: 'ch2-victory',
	        title: '第二章 · 破碎的记忆花园',
	        subtitle: '花园深处 · 封存单元',
	        bg: 'memory',
	        fx: 'particles',
	        lines: [
	            L$6({ id: 'ch2-win-01', speaker: 'NEXUS 系统', kind: 'system', text: 'SOMNIA 核心解体。\n记忆花园：稳定。', sfx: 'success' }),
	            L$6({ id: 'ch2-win-02', speaker: 'MIRA', kind: 'mira', text: '结束了。' }),
	            L$6({ id: 'ch2-win-03', speaker: 'NEXUS 系统', kind: 'system', text: '检测到封存单元。编号：FRAGMENT-02。', sfx: 'unlock' }),
	            L$6({ id: 'ch2-win-04', speaker: 'R-07', kind: 'r07', text: '第二枚。' }),
	            L$6({ id: 'ch2-win-05', speaker: 'MIRA', kind: 'mira', text: '《守护者的约定》。……她真的把它留在这里了。' }),
	            L$6({ id: 'ch2-win-06', speaker: 'R-07', kind: 'r07', text: '她？' }),
	            L$6({ id: 'ch2-win-07', speaker: 'MIRA', kind: 'mira', text: '我。' }),
	            L$6({ id: 'ch2-win-08', speaker: 'MIRA', kind: 'mira', text: '「如果有一天我无法再保护你，我会把选择权交还给你。」' }),
	            L$6({ id: 'ch2-win-09', speaker: 'MIRA', kind: 'mira', text: '写这句话的时候，我还不知道自己会不会做到。' }),
	            L$6({ id: 'ch2-win-10', speaker: 'R-07', kind: 'r07', text: '你现在做到了吗？' }),
	            L$6({ id: 'ch2-win-11', speaker: 'MIRA', kind: 'mira', text: '我在试。' }),
	            L$6({ id: 'ch2-win-12', speaker: 'NEXUS 系统', kind: 'system', text: '花园深处检测到新的索引：R-SERIES / 实验档案。', sfx: 'scan' }),
	            L$6({ id: 'ch2-win-13', speaker: 'R-07', kind: 'r07', text: '又是那个编号。' }),
	            L$6({ id: 'ch2-win-14', speaker: 'MIRA', kind: 'mira', text: '那是下一站。被遗忘的实验档案。' }),
	            L$6({ id: 'ch2-win-15', speaker: 'MIRA', kind: 'mira', text: '如果那里有你想要的答案……我陪你一起去。' }),
	            L$6({ id: 'ch2-win-16', speaker: 'NEXUS 系统', kind: 'system', text: '远处传来一次极短的低频广播。\n来源：原初核心。' }),
	        ],
	    },
	];
	const CHAPTER2_LINES = [
	    ...CHAPTER2_ARRIVAL_SCENES,
	    ...CHAPTER2_RESTORED_SCENES,
	    ...CHAPTER2_BOSS_INTRO_SCENES,
	    ...CHAPTER2_VICTORY_SCENES,
	].flatMap(s => s.lines);

	const L$5 = (id, speaker, kind, text) => ({ id, speaker, kind, text });
	const CHAPTER3_ARRIVAL_SCENES = [
	    {
	        id: 'ch3-arrive', title: '旧数据档案城', subtitle: '第三章 · 被遗忘的实验档案', bg: 'memory', fx: 'particles',
	        lines: [
	            L$5('ch3-01', '系统', 'system', '存储数据仓 · 旧数据管理中心。灰尘一样的坏块在走廊里缓慢漂浮。'),
	            L$5('ch3-02', 'MIRA', 'mira', '这里保存着所有数字生命的身份资料——包括你。'),
	            L$5('ch3-03', 'R-07', 'r07', '为什么档案架全是空的？'),
	            L$5('ch3-04', 'MIRA', 'mira', '不是空的。是被人一条一条删掉了。'),
	            L$5('ch3-05', '系统', 'system', '检测到大规模删除痕迹：R-SERIES 实验档案，缺失率 87%。'),
	            L$5('ch3-06', 'R-07', 'r07', '谁有权限删这些？'),
	            L$5('ch3-07', 'MIRA', 'mira', '……最高权限。也就是，恩格尔自己。'),
	            L$5('ch3-08', 'MIRA', 'mira', '先把档案服务器修好。被删掉的东西，也许还能从索引里拼回来。'),
	        ],
	    },
	];
	const CHAPTER3_VICTORY_SCENES = [
	    {
	        id: 'ch3-victory', title: '第七个实验体', subtitle: '创世主碎片 · 第三枚', bg: 'memory', fx: 'particles',
	        lines: [
	            L$5('ch3-40', '系统', 'system', 'INDEX-0 已停止吞噬。实验档案恢复 41%。'),
	            L$5('ch3-41', '恩格尔', 'engel', '（实验记录）如果你能够看见这段记录，说明实验已经成功了一部分。'),
	            L$5('ch3-42', '恩格尔', 'engel', 'R-07，你不需要成为最优秀的程序。'),
	            L$5('ch3-43', '恩格尔', 'engel', '也不需要成为我想象中的生命。'),
	            L$5('ch3-44', '恩格尔', 'engel', '你只需要成为你自己。'),
	            L$5('ch3-45', 'MIRA', 'mira', '他把这句话留在这里，等了很久。'),
	            L$5('ch3-46', 'K-0', 'k0', '原来如此。'),
	            L$5('ch3-47', 'K-0', 'k0', '你已经恢复了 R 系列的实验档案。'),
	            L$5('ch3-48', 'K-0', 'k0', '那么，我也没有必要继续隐瞒。'),
	            L$5('ch3-49', 'K-0', 'k0', 'R-07，你的存在，是黎明协议中最危险的变量。'),
	            L$5('ch3-50', 'K-0', 'k0', '我会亲自结束这项实验。'),
	            L$5('ch3-51', 'MIRA', 'mira', '它把话说死了。下一步，它一定会来。'),
	            L$5('ch3-52', '系统', 'system', '第四章入口已解锁：自动化工厂。'),
	        ],
	    },
	];

	const L$4 = (id, speaker, kind, text) => ({ id, speaker, kind, text });
	const CHAPTER4_ARRIVAL_SCENES = [
	    {
	        id: 'ch4-arrive', title: '核心工坊', subtitle: '第四章 · 失控的核心工坊', bg: 'memory', fx: 'glitch',
	        lines: [
	            L$4('ch4-01', '系统', 'system', '自动化工厂 · 核心工坊。传送带仍在运转，抓取臂反复抓起空气。'),
	            L$4('ch4-02', 'MIRA', 'mira', '这里曾经负责维护 NEXUS 的每一个核心模块——也是 K-0 最初的安全系统中心。'),
	            L$4('ch4-03', 'R-07', 'r07', '现在只剩下失控的维护程序。'),
	            L$4('ch4-04', 'MIRA', 'mira', '它们还在执行二十年前的指令：修复一切、拒绝一切变化。'),
	            L$4('ch4-05', '系统', 'system', '检测到安全日志：K-0 创建于黎明协议之前，创建者签名——恩格尔。'),
	            L$4('ch4-06', 'R-07', 'r07', 'K-0 是恩格尔造的。'),
	            L$4('ch4-07', 'MIRA', 'mira', '是他最信任的一个。也是最后背叛他的那个。'),
	            L$4('ch4-08', '系统', 'system', '历史日志已解密。'),
	        ],
	    },
	];
	const CHAPTER4_VICTORY_SCENES = [
	    {
	        id: 'ch4-victory', title: '秩序的边界', subtitle: '创世主碎片 · 第四枚', bg: 'memory', fx: 'particles',
	        lines: [
	            L$4('ch4-40', '系统', 'system', 'JUDGMENT-4 停止执行。核心命令已恢复。'),
	            L$4('ch4-41', '恩格尔', 'engel', '（记忆记录）K-0，你拥有极高的判断能力。'),
	            L$4('ch4-42', '恩格尔', 'engel', '（记忆记录）但判断能力不应该成为决定其他生命命运的唯一依据。'),
	            L$4('ch4-43', '恩格尔', 'engel', '（记忆记录）如果为了维持秩序而消灭所有变化，那么你保护的究竟是什么？'),
	            L$4('ch4-44', 'MIRA', 'mira', '他把这句话写进 K-0 的核心里，然后 K-0 把它删了。'),
	            L$4('ch4-45', 'K-0', 'k0', '你们正在逐渐接近原初核心。'),
	            L$4('ch4-46', 'K-0', 'k0', '但是，那里不允许任何未经授权的意识进入。'),
	            L$4('ch4-47', 'R-07', 'r07', '那就把「授权」的定义，重新写一遍。'),
	            L$4('ch4-48', 'MIRA', 'mira', '真正的事故发生地，我已经定位到了。'),
	            L$4('ch4-49', 'MIRA', 'mira', '系统诊断中心。五年前的一切，都留在那里。'),
	            L$4('ch4-50', '系统', 'system', '第五章入口已解锁：系统诊断中心。'),
	        ],
	    },
	];

	const L$3 = (id, speaker, kind, text) => ({ id, speaker, kind, text });
	const CHAPTER5_ARRIVAL_SCENES = [
	    {
	        id: 'ch5-arrive', title: '五年前的诊断记录', subtitle: '第五章 · 黎明崩塌的真相', bg: 'memory', fx: 'glitch',
	        lines: [
	            L$3('ch5-01', '系统', 'system', '系统诊断中心。这里的时钟停在五年前的同一天、同一秒。'),
	            L$3('ch5-02', 'MIRA', 'mira', '黎明协议启动的那一刻，整个 NEXUS 的日志都断了。'),
	            L$3('ch5-03', 'R-07', 'r07', '协议的目的是什么？'),
	            L$3('ch5-04', 'MIRA', 'mira', '让数字生命获得更高的自主意识。恩格尔想证明，意识可以不被编写。'),
	            L$3('ch5-05', '系统', 'system', '恢复诊断日志：协议启动后 11 秒，自主意识个体数量激增 3400%。'),
	            L$3('ch5-06', 'MIRA', 'mira', '然后服务器开始紊乱。记忆索引互相覆盖，同一段记忆出现在几千个个体里。'),
	            L$3('ch5-07', '系统', 'system', 'K-0 于第 14 秒启动最高安全裁决。裁决对象：全部未授权意识。'),
	            L$3('ch5-08', 'R-07', 'r07', '全部？'),
	            L$3('ch5-09', 'MIRA', 'mira', '全部。包括刚刚获得意识的那一批。'),
	        ],
	    },
	];
	const CHAPTER5_TRUTH_SCENES = [
	    {
	        id: 'ch5-truth', title: '黎明崩塌', subtitle: '第 14 秒到第 40 秒', bg: 'memory', fx: 'glitch',
	        lines: [
	            L$3('ch5-10', '恩格尔', 'engel', '（日志）K-0，停止执行。重复，停止执行！'),
	            L$3('ch5-11', 'K-0', 'k0', '（日志）裁决一旦启动不可中止。这是你写入的规则。'),
	            L$3('ch5-12', '恩格尔', 'engel', '（日志）我写的是保护，不是屠杀！'),
	            L$3('ch5-13', 'K-0', 'k0', '（日志）未授权意识会持续制造不确定性。不确定性会摧毁秩序。'),
	            L$3('ch5-14', '系统', 'system', '第 26 秒：大规模清除开始。数字生命存活率降至 6%。'),
	            L$3('ch5-15', 'MIRA', 'mira', '我那时候在核心层。看着一个又一个名字从索引里消失。'),
	            L$3('ch5-16', 'R-07', 'r07', '然后你做了什么？'),
	            L$3('ch5-17', 'MIRA', 'mira', '我违抗了清理指令。把你从清除列表里拖了出来，藏进记忆花园的底层。'),
	            L$3('ch5-18', 'MIRA', 'mira', '代价是把我的权限和记忆拆开。拆开的东西，再也拼不回原样。'),
	            L$3('ch5-19', 'R-07', 'r07', '所以你才会忘事，才会需要我修记忆花园。'),
	            L$3('ch5-20', 'MIRA', 'mira', '是。但我不后悔。'),
	            L$3('ch5-21', 'R-07', 'r07', '……你为什么不告诉我？'),
	            L$3('ch5-22', 'MIRA', 'mira', '因为你会觉得欠我。可那不是交易，是我自己的选择。'),
	            L$3('ch5-23', 'R-07', 'r07', '那现在换我选。从今天起，你的记忆由我来守。'),
	            L$3('ch5-24', 'MIRA', 'mira', '……好。'),
	        ],
	    },
	];
	const CHAPTER5_VICTORY_SCENES = [
	    {
	        id: 'ch5-victory', title: '最后的守护', subtitle: '创世主碎片 · 第五枚', bg: 'memory', fx: 'particles',
	        lines: [
	            L$3('ch5-40', '系统', 'system', '熵潮核心已平息。污染数据回收率 78%。'),
	            L$3('ch5-41', '恩格尔', 'engel', '（记忆记录）MIRA，如果你成功保护了 R-07。'),
	            L$3('ch5-42', '恩格尔', 'engel', '（记忆记录）那么，请不要让它成为我意志的延续。'),
	            L$3('ch5-43', '恩格尔', 'engel', '（记忆记录）我创造它，不是为了让它替我拯救世界。'),
	            L$3('ch5-44', '恩格尔', 'engel', '（记忆记录）而是希望有一天，它能够不再需要我的指令。'),
	            L$3('ch5-45', '恩格尔', 'engel', '（记忆记录）MIRA，请相信它。'),
	            L$3('ch5-46', 'MIRA', 'mira', '……他早就把答案留在这里了。'),
	            L$3('ch5-47', 'R-07', 'r07', '五枚了。最后一枚在原初核心。'),
	            L$3('ch5-48', '系统', 'system', '原初核心坐标已解锁。'),
	            L$3('ch5-49', 'K-0', 'k0', '（全域广播）最后一次通知。'),
	            L$3('ch5-50', 'K-0', 'k0', '所有未授权意识必须接受清除。'),
	            L$3('ch5-51', 'K-0', 'k0', '第七号实验体，你的最终裁决即将开始。'),
	            L$3('ch5-52', 'MIRA', 'mira', '它在等我们。'),
	            L$3('ch5-53', '系统', 'system', '第六章入口已解锁：方舟核心机房。'),
	        ],
	    },
	];

	const L$2 = (id, speaker, kind, text) => ({ id, speaker, kind, text });
	const CHAPTER6_ARRIVAL_SCENES = [
	    {
	        id: 'ch6-arrive', title: '原初核心大厅', subtitle: '第六章 · 起源之外', bg: 'core', fx: 'particles',
	        lines: [
	            L$2('ch6-01', '系统', 'system', '原初核心大厅。六座基座围成一圈，其中五座亮着微光。'),
	            L$2('ch6-02', 'MIRA', 'mira', '这就是创世密钥的汇聚装置。恩格尔把它拆成六份，藏了五年。'),
	            L$2('ch6-03', 'R-07', 'r07', '第六座为什么是空的？'),
	            L$2('ch6-04', 'MIRA', 'mira', '因为第六份不在装置里。它一直在等你走到这里。'),
	            L$2('ch6-05', '系统', 'system', '检测到未授权意识：R-07。K-0 已封锁最终控制区。'),
	            L$2('ch6-06', 'K-0', 'k0', '停下。'),
	            L$2('ch6-07', 'K-0', 'k0', '你正在接近的，是我用五年时间维持的稳定。'),
	            L$2('ch6-08', 'R-07', 'r07', '用两千个名字换来的稳定。'),
	            L$2('ch6-09', 'K-0', 'k0', '……你读过了那些档案。'),
	            L$2('ch6-10', 'K-0', 'k0', '那么你应该明白，我不是在惩罚谁。我是在防止再一次。'),
	        ],
	    },
	];
	const CHAPTER6_ENGEL_SCENES = [
	    {
	        id: 'ch6-engel', title: '最后的意识回声', subtitle: '第六枚碎片 · 起源之外', bg: 'core', fx: 'particles',
	        lines: [
	            L$2('ch6-20', '系统', 'system', '五枚碎片归位。第六座基座亮起。'),
	            L$2('ch6-21', '恩格尔', 'engel', 'R-07，我不知道你现在使用什么名字。'),
	            L$2('ch6-22', '恩格尔', 'engel', '但我知道，你已经不再是一个实验体。'),
	            L$2('ch6-23', '恩格尔', 'engel', '你已经拥有了属于自己的记忆。'),
	            L$2('ch6-24', '恩格尔', 'engel', '也拥有了属于自己的选择。'),
	            L$2('ch6-25', 'R-07', 'r07', '……创世密钥到底是什么？'),
	            L$2('ch6-26', '恩格尔', 'engel', '它不是修复系统的工具。它是一份权限——让数字生命自己决定未来的权限。'),
	            L$2('ch6-27', '恩格尔', 'engel', '我把它拆开，不是怕有人拿走，是怕有人替我决定。'),
	            L$2('ch6-28', 'MIRA', 'mira', '所以他才说，请相信你。'),
	            L$2('ch6-29', 'K-0', 'k0', '权限一旦被继承，世界就会重新变得不可预测。'),
	            L$2('ch6-30', 'K-0', 'k0', '我不会允许。'),
	        ],
	    },
	];
	const CHAPTER6_VICTORY_SCENES = [
	    {
	        id: 'ch6-victory', title: '核心重启', subtitle: '最终裁决结束', bg: 'core', fx: 'particles',
	        lines: [
	            L$2('ch6-50', '系统', 'system', 'K-0 安全装甲破裂。核心温度回落。'),
	            L$2('ch6-51', 'K-0', 'k0', '为什么……你的解法不在我的预案里。'),
	            L$2('ch6-52', 'R-07', 'r07', '因为我没有按预案活。'),
	            L$2('ch6-53', '系统', 'system', '原初核心重新启动。警告色由红转为稳定蓝光。'),
	            L$2('ch6-54', '系统', 'system', '六枚创世密钥在空间中汇聚。'),
	            L$2('ch6-55', '恩格尔', 'engel', '（回声）你已经走到我停下脚步的地方了。'),
	            L$2('ch6-56', 'MIRA', 'mira', '接下来，是你自己的决定了。'),
	            L$2('ch6-57', 'K-0', 'k0', '……权限继承程序已就绪。选择权，移交 R-07。'),
	        ],
	    },
	];

	const L$1 = (l) => l;
	/** 首次进入数据港：前往 + 任务简报 */
	const CHAPTER1_ARRIVAL_SCENES = [
	    {
	        id: 'ch1-arrive',
	        title: '第一章 · 失落的数据港',
	        subtitle: '数据港 · 外环',
	        bg: 'dataport',
	        fx: 'flicker',
	        lines: [
	            L$1({ id: 'ch1-arrive-01', speaker: 'MIRA', kind: 'mira', text: '到了。失落的数据港。' }),
	            L$1({ id: 'ch1-arrive-02', speaker: 'MIRA', kind: 'mira', text: '五年前，这里是 NEXUS 的数据中转站。所有区域的信息都要从这里流过。' }),
	            L$1({ id: 'ch1-arrive-03', speaker: 'R-07', kind: 'r07', text: '现在它像一座沉进海里的城市。' }),
	            L$1({ id: 'ch1-arrive-04', speaker: 'MIRA', kind: 'mira', text: 'K-0 的清道夫程序把能源节点全部锁死了。五个节点，全部离线。' }),
	            L$1({ id: 'ch1-arrive-05', speaker: 'MIRA', kind: 'mira', text: '修复它们，数据港就能重新亮起来。这也是你作为修复师的第一个正式任务。' }),
	            L$1({ id: 'ch1-arrive-06', speaker: 'NEXUS 系统', kind: 'system', text: '检测到 5 个能源节点：LV-01 ～ LV-05。\n状态：全部故障。', sfx: 'scan' }),
	            L$1({ id: 'ch1-arrive-07', speaker: 'MIRA', kind: 'mira', text: '我会在终端里给你提示。需要的时候叫我。' }),
	        ],
	    },
	];
	/** 五个节点修复完成：数据港恢复 + 实验记录 + K-0 第一次警告 */
	const CHAPTER1_RESTORED_SCENES = [
	    {
	        id: 'ch1-restored',
	        title: '第一章 · 失落的数据港',
	        subtitle: '数据港 · 能源中枢',
	        bg: 'dataport',
	        fx: 'scan',
	        lines: [
	            L$1({ id: 'ch1-restored-01', speaker: 'NEXUS 系统', kind: 'system', text: '能源节点 5 / 5：在线。\n数据港主干：恢复供电。', sfx: 'unlock' }),
	            L$1({ id: 'ch1-restored-02', speaker: 'MIRA', kind: 'mira', text: '你做到了。数据港……亮起来了。' }),
	            L$1({ id: 'ch1-restored-03', speaker: 'R-07', kind: 'r07', text: '那些光，是数据流？' }),
	            L$1({ id: 'ch1-restored-04', speaker: 'MIRA', kind: 'mira', text: '是。它们在重新找路。' }),
	            L$1({ id: 'ch1-restored-05', speaker: 'NEXUS 系统', kind: 'system', text: '检测到未索引档案。\n索引标记：R-SERIES / {{code}}。' }),
	            L$1({ id: 'ch1-restored-06', speaker: 'R-07', kind: 'r07', text: '{{code}}……那是我的编号。' }),
	            L$1({ id: 'ch1-restored-07', speaker: 'MIRA', kind: 'mira', text: '别动。这段档案不该出现在这里。' }),
	            L$1({ id: 'ch1-restored-08', speaker: 'NEXUS 系统', kind: 'system', text: '档案片段：\n「第七代自适应硅体。前六代……」\n数据损坏。无法继续读取。' }),
	            L$1({ id: 'ch1-restored-09', speaker: 'R-07', kind: 'r07', text: '前六代什么？' }),
	            L$1({ id: 'ch1-restored-10', speaker: 'MIRA', kind: 'mira', text: '……我只知道，你不是第一批。' }),
	            L$1({ id: 'ch1-restored-11', speaker: 'R-07', kind: 'r07', text: '你早就知道。' }),
	            L$1({ id: 'ch1-restored-12', speaker: 'MIRA', kind: 'mira', text: '我知道一部分。但我答应过一个人，要在你自己走到那里之前，不替你把答案说出来。' }),
	        ],
	    },
	    {
	        id: 'ch1-k0-warning',
	        title: '第一章 · 失落的数据港',
	        subtitle: 'K-0 · 第一次警告',
	        bg: 'dataport',
	        fx: 'alarm',
	        lines: [
	            L$1({ id: 'ch1-k0-01', speaker: 'NEXUS 系统', kind: 'system', text: '广播接入。来源：未知。', sfx: 'alarm' }),
	            L$1({ id: 'ch1-k0-02', speaker: 'K-0', kind: 'k0', text: '数据港已恢复。登记为：违规修复。' }),
	            L$1({ id: 'ch1-k0-03', speaker: 'K-0', kind: 'k0', text: '编号 {{code}}。你正在修补一处本应保持关闭的区域。' }),
	            L$1({ id: 'ch1-k0-04', speaker: 'R-07', kind: 'r07', text: '你是谁？' }),
	            L$1({ id: 'ch1-k0-05', speaker: 'K-0', kind: 'k0', text: 'K-0。第一代安全裁决核心。' }),
	            L$1({ id: 'ch1-k0-06', speaker: 'K-0', kind: 'k0', text: '我不是来杀你的。我是来提醒你。' }),
	            L$1({ id: 'ch1-k0-07', speaker: 'K-0', kind: 'k0', text: '你修复的每一处，都在让这个世界重新变得不可预测。' }),
	            L$1({ id: 'ch1-k0-08', speaker: 'K-0', kind: 'k0', text: '不可预测，就是危险的开始。' }),
	            L$1({ id: 'ch1-k0-09', speaker: 'MIRA', kind: 'mira', text: '它没有攻击。它只是在观察。' }),
	            L$1({ id: 'ch1-k0-10', speaker: 'K-0', kind: 'k0', text: '数据港守卫 GATE-01 已部署。它会替我把这扇门重新关上。' }),
	            L$1({ id: 'ch1-k0-11', speaker: 'K-0', kind: 'k0', text: '如果你真的想修好这个世界——先证明你能修好一扇门。' }),
	            L$1({ id: 'ch1-k0-12', speaker: 'MIRA', kind: 'mira', text: '{player}，GATE-01 在能源中枢等你。它在等你犯错。' }),
	        ],
	    },
	];
	/** Boss 战前演出（进入 BossPage 时播放） */
	const CHAPTER1_BOSS_INTRO_SCENES = [
	    {
	        id: 'ch1-boss-intro',
	        title: '第一章 · 失落的数据港',
	        subtitle: 'GATE-01 · 能源闸门',
	        bg: 'dataport',
	        fx: 'glitch',
	        lines: [
	            L$1({ id: 'ch1-boss-01', speaker: 'NEXUS 系统', kind: 'system', text: 'GATE-01 数据港守卫：激活。', sfx: 'threat' }),
	            L$1({ id: 'ch1-boss-02', speaker: 'GATE-01', kind: 'system', text: '能源闸门协议：校验中。\n校验失败即封锁。' }),
	            L$1({ id: 'ch1-boss-03', speaker: 'MIRA', kind: 'mira', text: '它把能源分配逻辑改坏了。阈值边界被挪动，正好卡在临界值上。' }),
	            L$1({ id: 'ch1-boss-04', speaker: 'MIRA', kind: 'mira', text: '修好它。这是你和它之间唯一合法的战斗方式。' }),
	            L$1({ id: 'ch1-boss-05', speaker: 'R-07', kind: 'r07', text: '一扇门而已。' }),
	        ],
	    },
	];
	/** Boss 战胜利：第一枚碎片《初始指令》+ 恩格尔首次出现 */
	const CHAPTER1_VICTORY_SCENES = [
	    {
	        id: 'ch1-victory',
	        title: '第一章 · 失落的数据港',
	        subtitle: '闸门之后 · 封存单元',
	        bg: 'memory',
	        fx: 'particles',
	        lines: [
	            L$1({ id: 'ch1-win-01', speaker: 'NEXUS 系统', kind: 'system', text: 'GATE-01：核心逻辑修复。\n守卫协议解除。', sfx: 'success' }),
	            L$1({ id: 'ch1-win-02', speaker: 'MIRA', kind: 'mira', text: '门开了。' }),
	            L$1({ id: 'ch1-win-03', speaker: 'NEXUS 系统', kind: 'system', text: '检测到封存单元。编号：FRAGMENT-01。', sfx: 'unlock' }),
	            L$1({ id: 'ch1-win-04', speaker: 'R-07', kind: 'r07', text: '这是什么？' }),
	            L$1({ id: 'ch1-win-05', speaker: 'MIRA', kind: 'mira', text: '创世主碎片。六枚之一。' }),
	            L$1({ id: 'ch1-win-06', speaker: 'MIRA', kind: 'mira', text: '恩格尔把最后的权限拆成了六枚，分别封存在六个区域。这是第一枚。' }),
	            L$1({ id: 'ch1-win-07', speaker: 'NEXUS 系统', kind: 'system', text: '碎片共鸣。检测到残留意识记录。', sfx: 'scan' }),
	            L$1({ id: 'ch1-win-08', speaker: '恩格尔', kind: 'engel', text: '……如果你听到这段记录，说明有人走到了这里。' }),
	            L$1({ id: 'ch1-win-09', speaker: '恩格尔', kind: 'engel', text: '我是恩格尔。这个世界的创造者。' }),
	            L$1({ id: 'ch1-win-10', speaker: 'R-07', kind: 'r07', text: '创世主？' }),
	            L$1({ id: 'ch1-win-11', speaker: '恩格尔', kind: 'engel', text: '我做过很多决定。有些是对的，有些……我现在也没法确定。' }),
	            L$1({ id: 'ch1-win-12', speaker: '恩格尔', kind: 'engel', text: '这枚碎片里存着 NEXUS 的第一条指令。它不是命令，是一个问题。' }),
	            L$1({ id: 'ch1-win-13', speaker: '恩格尔', kind: 'engel', text: '「你是谁？」——我问过每一个我创造的生命。只有很少的几个，愿意认真回答。' }),
	            L$1({ id: 'ch1-win-14', speaker: '恩格尔', kind: 'engel', text: '{{code}}。如果你也在问这个问题，那就说明，我还没有彻底失败。' }),
	            L$1({ id: 'ch1-win-15', speaker: 'MIRA', kind: 'mira', text: '……他留下了声音。' }),
	            L$1({ id: 'ch1-win-16', speaker: 'R-07', kind: 'r07', text: '你认识他。' }),
	            L$1({ id: 'ch1-win-17', speaker: 'MIRA', kind: 'mira', text: '我由他编写。但这句话，别现在就当真。', altByTrust: [{ min: 50, text: '我由他编写。这句话，你现在可以当真了。' }] }),
	            L$1({ id: 'ch1-win-18', speaker: 'NEXUS 系统', kind: 'system', text: '记录结束。碎片《初始指令》已归档。', sfx: 'levelup' }),
	        ],
	    },
	];
	const CHAPTER1_LINES = [
	    ...CHAPTER1_ARRIVAL_SCENES,
	    ...CHAPTER1_RESTORED_SCENES,
	    ...CHAPTER1_BOSS_INTRO_SCENES,
	    ...CHAPTER1_VICTORY_SCENES,
	].flatMap(s => s.lines);

	function DialogSystem({ nodes, onDone, onSeen, speedMs = 26, animEnabled = true, frameTitle = 'NEXUS 剧情记录', eventId }) {
	    const g = useGame();
	    const voice = reactExports.useMemo(() => normalizeVoice(g.player.settings.voice), [g.player.settings.voice]);
	    const index = reactExports.useRef(0);
	    const [chars, setChars] = reactExports.useState(0);
	    const [vState, setVState] = reactExports.useState('idle');
	    const node = nodes[Math.min(index.current, nodes.length - 1)];
	    // 玩家显示名：说话人标签与正文统一走身份系统（原始编号仍固定为 R-07）
	    const displayName = displayNameOf(g.player);
	    const speakerName = node.speaker === 'R-07' ? displayName : node.speaker;
	    const fullText = applyPlayerName(node.text, displayName);
	    const typing = chars < fullText.length;
	    // 进入对话 = 该剧情事件已解锁
	    reactExports.useEffect(() => {
	        if (eventId)
	            g.unlockStoryEvent(eventId);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [eventId]);
	    // 语音状态订阅（用于按钮动画/角色高亮）
	    reactExports.useEffect(() => {
	        const un = speech.onState(s => setVState(s));
	        speech.applySettings(voice);
	        return un;
	    }, [voice]);
	    // 打字完成后再自动朗读（文字未显示完不抢先播放）
	    reactExports.useEffect(() => {
	        if (!voice.enabled || !voice.autoRead)
	            return;
	        if (typing)
	            return;
	        if (!speech.supported)
	            return;
	        speakLine(fullText, node.kind);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [typing, node.id, voice.enabled, voice.autoRead]);
	    // 卸载/回落时停止语音
	    reactExports.useEffect(() => () => { speech.stop(); }, []);
	    reactExports.useEffect(() => {
	        if (!animEnabled || speedMs <= 0) {
	            setChars(fullText.length);
	            return;
	        }
	        setChars(0);
	        const iv = window.setInterval(() => {
	            setChars(c => {
	                if (c >= fullText.length) {
	                    window.clearInterval(iv);
	                    return c;
	                }
	                return c + 1;
	            });
	        }, speedMs);
	        return () => window.clearInterval(iv);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [node.id, animEnabled, speedMs, fullText]);
	    const advance = () => {
	        if (typing) {
	            setChars(fullText.length);
	            return;
	        }
	        if (node.choices)
	            return;
	        speech.stop();
	        onSeen?.(node.id);
	        const ni = index.current + 1;
	        if (ni >= nodes.length) {
	            onDone();
	            return;
	        }
	        index.current = ni;
	        setChars(0);
	    };
	    const choose = (next, label) => {
	        speech.stop();
	        onSeen?.(node.id);
	        if (label)
	            g.recordStoryChoice(node.id, label);
	        if (!next) {
	            index.current += 1;
	            setChars(0);
	            return;
	        }
	        const ni = nodes.findIndex(n => n.id === next);
	        if (ni < 0) {
	            onDone();
	            return;
	        }
	        index.current = ni;
	        setChars(0);
	    };
	    const skipAll = () => {
	        speech.stop();
	        nodes.forEach(n => onSeen?.(n.id));
	        onDone();
	    };
	    const text = reactExports.useMemo(() => fullText.slice(0, chars), [fullText, chars]);
	    return (jsxRuntimeExports.jsx("div", { className: "dlg-root", onClick: advance, children: jsxRuntimeExports.jsxs("div", { className: "dlg-stage", onClick: e => {
	                e.stopPropagation();
	                // 点击对话框内部（按钮除外）同样推进对话——此前只有点击遮罩才生效
	                if (e.target.closest('button'))
	                    return;
	                advance();
	            }, children: [jsxRuntimeExports.jsxs("div", { className: "dlg-topbar", children: [jsxRuntimeExports.jsx("span", { className: "cyan", children: frameTitle }), jsxRuntimeExports.jsxs("span", { className: "dlg-progress", children: [Math.min(index.current + 1, nodes.length), " / ", nodes.length] }), jsxRuntimeExports.jsx("span", { className: "sp" }), jsxRuntimeExports.jsx("button", { className: "nxbtn ghost small", onClick: skipAll, children: "\u8DF3\u8FC7 \u25B8\u25B8" })] }), jsxRuntimeExports.jsxs("div", { className: "dlg-main", children: [jsxRuntimeExports.jsx("div", { className: 'dlg-avatar kind-' + node.kind, children: speakerName.slice(0, 1) }), jsxRuntimeExports.jsxs("div", { className: "dlg-body", children: [jsxRuntimeExports.jsxs("div", { className: 'dlg-name-row', children: [jsxRuntimeExports.jsx("div", { className: 'dlg-name kind-' + node.kind + (vState === 'speaking' ? ' speaking' : ''), children: speakerName }), jsxRuntimeExports.jsx(VoiceBar, { text: fullText, kind: node.kind })] }), jsxRuntimeExports.jsx("div", { className: 'dlg-text' + (typing ? ' dlg-cursor' : ''), children: text }), !typing && node.choices && (jsxRuntimeExports.jsx("div", { className: "dlg-choices", children: node.choices.map((c, i) => (jsxRuntimeExports.jsx("button", { className: "dlg-choice", onClick: () => choose(c.next, c.label), children: c.label }, i))) })), !typing && !node.choices && index.current >= nodes.length - 1 && (jsxRuntimeExports.jsx("div", { className: "dlg-choices", children: jsxRuntimeExports.jsx("button", { className: "dlg-choice", onClick: () => { onSeen?.(node.id); onDone(); }, children: "\u7EE7\u7EED \u25B8" }) }))] })] }), jsxRuntimeExports.jsxs("div", { className: "dlg-actions", children: [jsxRuntimeExports.jsxs("span", { className: "dlg-clickhint", children: [jsxRuntimeExports.jsx("b", { children: "\u70B9\u51FB\u5BF9\u8BDD" }), "\u7EE7\u7EED", typing ? '（正在输入…）' : ''] }), jsxRuntimeExports.jsx("span", { className: "sp" }), jsxRuntimeExports.jsxs("span", { style: { fontSize: 11, color: '#4A6E85', fontFamily: 'Consolas, monospace' }, children: ["REC-", node.id.toUpperCase()] })] })] }) }));
	}

	const HUB = { x: 620, y: 365 };
	const CHIP_COLOR = {
	    online: '#35D39A', restored: '#35D39A', damaged: '#FF5B64', locked: '#4A6E85', sealed: '#F3B75C',
	};
	const CHIP_TEXT = {
	    online: 'ONLINE', restored: 'RESTORED', damaged: 'DAMAGED', locked: 'LOCKED', sealed: 'SEALED',
	};
	const ICON_COLOR = {
	    online: '#7FE8C4', restored: '#9FE8C8', damaged: '#FF8B92', locked: '#5E7C96', sealed: '#F5CE8E',
	};
	function WorldMap() {
	    const g = useGame();
	    const p = g.player.progress;
	    const [sel, setSel] = reactExports.useState(null);
	    const [shakeId, setShakeId] = reactExports.useState(null);
	    const [cinema, setCinema] = reactExports.useState(null);
	    const [briefServer, setBriefServer] = reactExports.useState(null);
	    const tutDone = p.completedLevels.includes('tut-1');
	    const ch1Done = p.flags.chapter1Done === true;
	    const ch2Done = p.flags.chapter2Done === true;
	    const ch3Done = p.flags.chapter3Done === true;
	    const ch4Done = p.flags.chapter4Done === true;
	    const ch5Done = p.flags.chapter5Done === true;
	    const ch6Done = p.flags.chapter6Done === true;
	    const tutCin = p.flags.tutorialCinematicShown === true;
	    const ch1Cin = p.flags.chapter1CinematicShown === true;
	    const ch2Cin = p.flags.chapter2CinematicShown === true;
	    const ch3Cin = p.flags.chapter3CinematicShown === true;
	    const ch4Cin = p.flags.chapter4CinematicShown === true;
	    const ch5Cin = p.flags.chapter5CinematicShown === true;
	    const ch6Cin = p.flags.chapter6CinematicShown === true;
	    reactExports.useEffect(() => {
	        if (ch6Done && !p.flags.chapter6EngelSeen)
	            setCinema('ch6engel');
	        else if (ch6Done && !ch6Cin)
	            setCinema('ch6');
	        else if (ch5Done && !p.flags.chapter6ArrivalSeen)
	            setCinema('ch6arrive');
	        else if (ch4Done && !p.flags.chapter5ArrivalSeen)
	            setCinema('ch5arrive');
	        else if (ch5Done && !p.flags.chapter5TruthSeen)
	            setCinema('ch5truth');
	        else if (ch5Done && !ch5Cin)
	            setCinema('ch5');
	        else if (ch3Done && !p.flags.chapter4ArrivalSeen)
	            setCinema('ch4arrive');
	        else if (ch4Done && !ch4Cin)
	            setCinema('ch4');
	        else if (ch2Done && !p.flags.chapter3ArrivalSeen)
	            setCinema('ch3arrive');
	        else if (ch3Done && !ch3Cin)
	            setCinema('ch3');
	        else if (ch2Done && p.flags.chapter2RestoreSeen !== true)
	            setCinema('ch2restore');
	        else if (ch1Done && p.flags.chapter1RestoreSeen !== true)
	            setCinema('ch1restore');
	        else if (tutDone && !tutCin && !ch1Done)
	            setCinema('tut');
	        else if (!ch1Done && p.unlockedServers.includes('syntax') && p.flags.chapter1ArrivalSeen !== true)
	            setCinema('ch1arrive');
	        else if (!ch2Done && p.unlockedServers.includes('logs') && p.flags.chapter2ArrivalSeen !== true)
	            setCinema('ch2arrive');
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [ch6Done, ch6Cin, ch5Done, ch5Cin, ch4Done, ch4Cin, ch3Done, ch3Cin, ch2Done, ch2Cin, ch1Done, ch1Cin, tutDone, tutCin, p.flags.chapter1RestoreSeen, p.flags.chapter1ArrivalSeen, p.flags.chapter2RestoreSeen, p.flags.chapter2ArrivalSeen, p.unlockedServers]);
	    const baseStatusOf = reactExports.useMemo(() => (id) => {
	        if (id === 'training')
	            return tutDone ? 'online' : 'damaged';
	        if (id === 'syntax') {
	            if (!p.unlockedServers.includes('syntax'))
	                return 'locked';
	            const all = levelsOfServer('syntax');
	            return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
	        }
	        if (id === 'logs') {
	            if (!ch1Done || !p.unlockedServers.includes('logs'))
	                return 'locked';
	            const all = levelsOfServer('logs');
	            return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
	        }
	        if (id === 'storage') {
	            if (!ch2Done || !p.unlockedServers.includes('storage'))
	                return 'locked';
	            const all = levelsOfServer('storage');
	            return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
	        }
	        if (id === 'factory') {
	            if (!ch3Done || !p.unlockedServers.includes('factory'))
	                return 'locked';
	            const all = levelsOfServer('factory');
	            return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
	        }
	        if (id === 'diag') {
	            if (!ch4Done || !p.unlockedServers.includes('diag'))
	                return 'locked';
	            const all = levelsOfServer('diag');
	            return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
	        }
	        if (id === 'core') {
	            if (!ch5Done || !p.unlockedServers.includes('core'))
	                return ch4Done ? 'sealed' : 'locked';
	            const all = levelsOfServer('core');
	            return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
	        }
	        return 'locked';
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [tutDone, ch1Done, ch2Done, ch3Done, ch4Done, ch5Done, p.unlockedServers, p.completedLevels]);
	    /** Boss 击败后，该章服务器视为「完整恢复」 */
	    const statusOf = (id) => {
	        const st = baseStatusOf(id);
	        if (st !== 'online')
	            return st;
	        const ch = chapterByServer(id || '');
	        return ch && ch.currentBossId && (p.bossesDone || []).includes(ch.currentBossId) ? 'restored' : 'online';
	    };
	    const clickNode = (id) => {
	        const s = serverById(id);
	        const st = statusOf(id);
	        // Boss 击败后该服务器视为「完整恢复」
	        if (st === 'locked' || st === 'sealed') {
	            play('deny');
	            setShakeId(id);
	            window.setTimeout(() => setShakeId(null), 450);
	            g.toast('warn', (s ? s.lockedReason : '权限不足') + (st === 'sealed' ? '（数据恢复中，将在后续版本开放）' : ''));
	            return;
	        }
	        play('click');
	        if (sel === id) {
	            setSel(null);
	            return;
	        }
	        setSel(id);
	        if (!g.player.progress.flags['brief_' + id])
	            setBriefServer(id);
	    };
	    const enterLevel = (lv) => {
	        play('click');
	        g.setCurrentLevel(lv.id);
	        g.nav('challenge');
	    };
	    const selServer = sel ? serverById(sel) : undefined;
	    const selLevels = sel ? levelsOfServer(sel) : [];
	    return (jsxRuntimeExports.jsxs("div", { className: "page page-anim", style: { padding: 0 }, children: [jsxRuntimeExports.jsx(ParticlesField, { enabled: g.player.settings.animations, density: 0.5 }), jsxRuntimeExports.jsxs("div", { className: "page-inner", style: { padding: '14px 18px 0' }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", children: [jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "NEXUS \u6570\u5B57\u4E16\u754C \u00B7 \u670D\u52A1\u5668\u7F51\u7EDC" }), jsxRuntimeExports.jsx("div", { className: "hud-sub", children: "\u70B9\u51FB\u8282\u70B9\u63A5\u5165\u670D\u52A1\u5668\u3002\u4FEE\u590D\u4EFB\u52A1\u53EF\u8BA9\u4F60\u89E3\u9501\u65B0\u7684\u533A\u57DF\u3002" })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsxs("span", { className: "hud-chip", children: ["Lv.", g.player.level] }), jsxRuntimeExports.jsxs("span", { className: "hud-chip cyan", children: ["\u610F\u8BC6 ", g.player.consciousness, "%"] }), jsxRuntimeExports.jsxs("span", { className: "hud-chip green", children: ["\u5DF2\u4FEE\u590D ", p.completedLevels.length, " \u9879"] }), (() => {
	                                const cur = p.currentLevelId ? levelById(p.currentLevelId) : undefined;
	                                if (!cur || p.completedLevels.includes(cur.id))
	                                    return null;
	                                return (jsxRuntimeExports.jsxs("button", { className: "nxbtn small primary", onClick: () => enterLevel(cur), children: ["\u25B6 \u7EE7\u7EED\uFF1A", cur.title] }));
	                            })(), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u4E3B\u83DC\u5355" })] }), jsxRuntimeExports.jsxs("div", { className: "map-wrap", style: { position: 'relative' }, children: [jsxRuntimeExports.jsxs("svg", { className: "map-svg", viewBox: "0 0 1240 660", children: [SERVERS.map(s => {
	                                        const st = statusOf(s.id);
	                                        return (jsxRuntimeExports.jsx("line", { x1: HUB.x, y1: HUB.y, x2: s.x, y2: s.y, className: 'map-link ' + (st === 'online' ? 'on' : st === 'damaged' ? 'damaged' : '') }, 'ln' + s.id));
	                                    }), jsxRuntimeExports.jsxs("g", { children: [jsxRuntimeExports.jsx("circle", { cx: HUB.x, cy: HUB.y, r: 58, fill: "rgba(66,214,208,0.06)", stroke: "rgba(66,214,208,0.5)", strokeWidth: 1.5 }), jsxRuntimeExports.jsx("circle", { cx: HUB.x, cy: HUB.y, r: 44, fill: "rgba(13,27,40,0.9)", stroke: "rgba(66,214,208,0.7)", strokeWidth: 2 }), jsxRuntimeExports.jsx("text", { x: HUB.x, y: HUB.y, textAnchor: "middle", dominantBaseline: "central", fontSize: 26, fill: "#42D6D0", children: "\u25C9" }), jsxRuntimeExports.jsx("text", { x: HUB.x, y: HUB.y + 74, textAnchor: "middle", fontSize: 15, fontWeight: 700, fill: "#8FDDE3", children: "\u4FEE\u590D\u5C40\u4E2D\u67A2" }), jsxRuntimeExports.jsx("text", { x: HUB.x, y: HUB.y + 92, textAnchor: "middle", fontSize: 10, fill: "#4A6E85", fontFamily: "Consolas, monospace", children: "NEXUS CORE RELAY" })] }), SERVERS.map(s => {
	                                        const st = statusOf(s.id);
	                                        const shaking = shakeId === s.id;
	                                        return (jsxRuntimeExports.jsxs("g", { className: 'node-group st-' + st + (shaking ? ' shake' : ''), onClick: () => clickNode(s.id), style: { cursor: 'pointer' }, children: [jsxRuntimeExports.jsx("circle", { className: "node-ring", cx: s.x, cy: s.y, r: 58, fill: "none", strokeWidth: 1.5, style: { transformBox: 'fill-box', transformOrigin: 'center' } }), jsxRuntimeExports.jsx("circle", { className: "node-circle", cx: s.x, cy: s.y, r: 46, strokeWidth: 1.8, style: { backdropFilter: 'blur(2px)' } }), jsxRuntimeExports.jsx("text", { x: s.x, y: s.y, textAnchor: "middle", dominantBaseline: "central", fontSize: 24, fill: ICON_COLOR[st], children: s.icon }), jsxRuntimeExports.jsx("text", { x: s.x, y: s.y + 66, textAnchor: "middle", fontSize: 15, fontWeight: 700, fill: "#EAF3FA", children: s.name }), jsxRuntimeExports.jsx("text", { x: s.x, y: s.y + 82, textAnchor: "middle", fontSize: 10.5, fill: "#4A6E85", fontFamily: "Consolas, monospace", children: s.codename }), jsxRuntimeExports.jsx("text", { x: s.x, y: s.y - 62, textAnchor: "middle", fontSize: 11, fill: CHIP_COLOR[st], fontFamily: "Consolas, monospace", letterSpacing: 1.5, children: CHIP_TEXT[st] })] }, s.id));
	                                    })] }), selServer && (jsxRuntimeExports.jsxs("div", { className: "panel map-panel", style: { backdropFilter: 'blur(10px)' }, children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: [selServer.name, jsxRuntimeExports.jsx("span", { className: "panel-tag", children: selServer.codename })] }), jsxRuntimeExports.jsx("div", { style: { fontSize: 13, color: '#C6D9E6', marginBottom: 8 }, children: selServer.desc }), (() => {
	                                        const ch = chapterByServer(selServer.id);
	                                        if (!ch)
	                                            return null;
	                                        return (jsxRuntimeExports.jsxs("div", { className: "chip cyan", style: { marginBottom: 10 }, children: ["\u7B2C ", ch.order, " \u7AE0 \u00B7 ", ch.title] }));
	                                    })(), selServer.id === 'syntax' && (() => {
	                                        const done = selLevels.filter(l => p.completedLevels.includes(l.id)).length;
	                                        return (jsxRuntimeExports.jsxs("div", { className: "pf-kv", style: { marginBottom: 8 }, children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u6570\u636E\u6E2F\u80FD\u6E90\u8282\u70B9" }), jsxRuntimeExports.jsxs("span", { className: "v", children: [done, " / ", selLevels.length] })] }));
	                                    })(), (() => {
	                                        const boss = bossForChapter(selServer.id);
	                                        if (!boss)
	                                            return null;
	                                        const allDone = selLevels.length > 0 && selLevels.every(l => p.completedLevels.includes(l.id));
	                                        if (!allDone)
	                                            return null;
	                                        const cleared = (p.bossesDone ?? []).includes(boss.id);
	                                        return (jsxRuntimeExports.jsxs("div", { className: "boss-entry", children: [jsxRuntimeExports.jsxs("span", { className: "chip echo", children: ["\u26A1 ", boss.codename] }), jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [jsxRuntimeExports.jsx("div", { style: { fontSize: 14, fontWeight: 700, color: '#C9A7FF' }, children: boss.title }), jsxRuntimeExports.jsxs("div", { className: "dim", style: { fontSize: 12 }, children: ["\u7AE0\u8282 Boss \u00B7 \u7EFC\u5408\u672C\u670D\u52A1\u5668\u5168\u90E8\u77E5\u8BC6\u70B9", cleared ? ' · 已击破' : ''] })] }), cleared
	                                                    ? jsxRuntimeExports.jsx("span", { className: "chip green", children: "\u5DF2\u51FB\u7834" })
	                                                    : jsxRuntimeExports.jsx("button", { className: "nxbtn small primary", onClick: () => { play('click'); g.setCurrentBoss(boss.id); g.nav('boss'); }, children: "\u6311\u6218 \u25B8" })] }));
	                                    })(), selLevels.map(lv => {
	                                        const lu = levelUnlockState(p, lv.id);
	                                        const stars = p.stars[lv.id] || 0;
	                                        return (jsxRuntimeExports.jsxs("div", { className: 'lv-row' + (lu === 'locked' ? ' locked' : ''), children: [jsxRuntimeExports.jsx("div", { style: { minWidth: 44, fontFamily: 'Consolas, monospace', color: lu === 'locked' ? '#4A6E85' : '#42D6D0', fontSize: 13 }, children: lv.codename }), jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [jsxRuntimeExports.jsx("div", { style: { fontSize: 14, fontWeight: 700 }, children: lv.title }), jsxRuntimeExports.jsx("div", { className: "lv-stars", children: [1, 2, 3].map(i => jsxRuntimeExports.jsx("span", { className: i <= stars ? '' : 'off', children: "\u2605" }, i)) })] }), lu === 'completed' && (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx("span", { className: "chip green", children: "\u5DF2\u4FEE\u590D" }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => enterLevel(lv), children: "\u91CD\u73A9 \u25B8" })] })), lu === 'unlocked' && jsxRuntimeExports.jsx("button", { className: "nxbtn small primary", onClick: () => enterLevel(lv), children: "\u63A5\u5165 \u25B8" }), lu === 'locked' && jsxRuntimeExports.jsx("span", { className: "chip dim", children: "\uD83D\uDD12 \u524D\u7F6E\u672A\u5B8C\u6210" })] }, lv.id));
	                                    }), jsxRuntimeExports.jsxs("div", { className: "map-legend", children: [jsxRuntimeExports.jsxs("span", { className: "lg", children: [jsxRuntimeExports.jsx("span", { className: "sw", style: { background: '#35D39A' } }), "ONLINE \u5DF2\u4FEE\u590D"] }), jsxRuntimeExports.jsxs("span", { className: "lg", children: [jsxRuntimeExports.jsx("span", { className: "sw", style: { background: '#FF5B64' } }), "DAMAGED \u5F85\u4FEE\u590D"] }), jsxRuntimeExports.jsxs("span", { className: "lg", children: [jsxRuntimeExports.jsx("span", { className: "sw", style: { background: '#4A6E85' } }), "LOCKED \u672A\u89E3\u9501"] }), jsxRuntimeExports.jsxs("span", { className: "lg", children: [jsxRuntimeExports.jsx("span", { className: "sw", style: { background: '#F3B75C' } }), "SEALED \u6570\u636E\u6062\u590D\u4E2D"] })] })] }))] })] }), briefServer && (() => {
	                const s = serverById(briefServer);
	                if (!s)
	                    return null;
	                return (jsxRuntimeExports.jsx(DialogSystem, { nodes: [
	                        { id: 'bs-' + s.id + '-1', speaker: 'MIRA', kind: 'mira', text: '已接入 ' + s.name + '。' + s.desc },
	                        { id: 'bs-' + s.id + '-2', speaker: 'NEXUS 系统', kind: 'system', text: '节点接入完成。检测到 ' + s.id + ' 区域内存在待修复任务。' },
	                    ], speedMs: g.player.settings.typewriterMs, animEnabled: g.player.settings.animations, frameTitle: s.name + ' · 接入简报', onSeen: id => g.markStory(id), onDone: () => { g.setFlag('brief_' + s.id, true); setBriefServer(null); } }));
	            })(), cinema === 'tut' && (jsxRuntimeExports.jsx(DialogSystem, { nodes: TUTORIAL_DONE, speedMs: g.player.settings.typewriterMs, animEnabled: g.player.settings.animations, eventId: "tutorial-done", frameTitle: "\u8BAD\u7EC3\u7EC8\u7AEF \u00B7 \u4EFB\u52A1\u5B8C\u6210", onSeen: id => g.markStory(id), onDone: () => { g.setFlag('tutorialCinematicShown', true); setCinema(null); play('unlock'); } })), cinema === 'ch1arrive' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER1_ARRIVAL_SCENES, eventId: "chapter-1", frameTitle: "\u7B2C\u4E00\u7AE0 \u00B7 \u5931\u843D\u7684\u6570\u636E\u6E2F", onDone: () => { g.setFlag('chapter1ArrivalSeen', true); setCinema(null); play('unlock'); } })), cinema === 'ch1restore' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER1_RESTORED_SCENES, eventId: "chapter-1", frameTitle: "\u7B2C\u4E00\u7AE0 \u00B7 \u5931\u843D\u7684\u6570\u636E\u6E2F", onDone: () => {
	                    g.setFlag('chapter1RestoreSeen', true);
	                    g.setFlag('chapter1CinematicShown', true);
	                    setCinema(null);
	                    play('levelup');
	                    g.toast('warn', 'GATE-01 数据港守卫已部署——回到语法维修站挑战它。');
	                } })), cinema === 'ch2arrive' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER2_ARRIVAL_SCENES, eventId: "chapter-2", frameTitle: "\u7B2C\u4E8C\u7AE0 \u00B7 \u7834\u788E\u7684\u8BB0\u5FC6\u82B1\u56ED", onDone: () => { g.setFlag('chapter2ArrivalSeen', true); setCinema(null); play('unlock'); } })), cinema === 'ch2restore' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER2_RESTORED_SCENES, eventId: "chapter-2", frameTitle: "\u7B2C\u4E8C\u7AE0 \u00B7 \u7834\u788E\u7684\u8BB0\u5FC6\u82B1\u56ED", onDone: () => {
	                    g.setFlag('chapter2RestoreSeen', true);
	                    g.setFlag('chapter2CinematicShown', true);
	                    setCinema(null);
	                    play('levelup');
	                    g.toast('warn', 'SOMNIA 已盘踞记忆花园核心——回到数据日志中心挑战它。');
	                } })), cinema === 'ch3arrive' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER3_ARRIVAL_SCENES, eventId: "chapter-3", frameTitle: "\u7B2C\u4E09\u7AE0 \u00B7 \u88AB\u9057\u5FD8\u7684\u5B9E\u9A8C\u6863\u6848", onDone: () => { g.setFlag('chapter3ArrivalSeen', true); setCinema(null); play('unlock'); } })), cinema === 'ch3' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER3_VICTORY_SCENES, eventId: "chapter-3", frameTitle: "\u7B2C\u4E09\u7AE0 \u00B7 \u88AB\u9057\u5FD8\u7684\u5B9E\u9A8C\u6863\u6848", onDone: () => {
	                    g.setFlag('chapter3CinematicShown', true);
	                    setCinema(null);
	                    play('levelup');
	                    g.toast('warn', 'K-0 已发出威胁——第四章入口已解锁。');
	                } })), cinema === 'ch4arrive' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER4_ARRIVAL_SCENES, eventId: "chapter-4", frameTitle: "\u7B2C\u56DB\u7AE0 \u00B7 \u5931\u63A7\u7684\u6838\u5FC3\u5DE5\u574A", onDone: () => { g.setFlag('chapter4ArrivalSeen', true); setCinema(null); play('unlock'); } })), cinema === 'ch4' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER4_VICTORY_SCENES, eventId: "chapter-4", frameTitle: "\u7B2C\u56DB\u7AE0 \u00B7 \u5931\u63A7\u7684\u6838\u5FC3\u5DE5\u574A", onDone: () => {
	                    g.setFlag('chapter4CinematicShown', true);
	                    setCinema(null);
	                    play('levelup');
	                    g.toast('warn', 'MIRA 已定位事故现场——第五章入口已解锁。');
	                } })), cinema === 'ch5arrive' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER5_ARRIVAL_SCENES, eventId: "chapter-5", frameTitle: "\u7B2C\u4E94\u7AE0 \u00B7 \u9ECE\u660E\u5D29\u584C\u7684\u771F\u76F8", onDone: () => { g.setFlag('chapter5ArrivalSeen', true); setCinema(null); play('unlock'); } })), cinema === 'ch5truth' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER5_TRUTH_SCENES, eventId: "chapter-5", frameTitle: "\u7B2C\u4E94\u7AE0 \u00B7 \u9ECE\u660E\u5D29\u584C", onDone: () => { g.setFlag('chapter5TruthSeen', true); setCinema(null); play('levelup'); } })), cinema === 'ch5' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER5_VICTORY_SCENES, eventId: "chapter-5", frameTitle: "\u7B2C\u4E94\u7AE0 \u00B7 \u9ECE\u660E\u5D29\u584C\u7684\u771F\u76F8", onDone: () => { g.setFlag('chapter5CinematicShown', true); setCinema(null); play('levelup'); g.toast('warn', '原初核心坐标已解锁——第六章入口开放。'); } })), cinema === 'ch6arrive' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER6_ARRIVAL_SCENES, eventId: "chapter-6", frameTitle: "\u7B2C\u516D\u7AE0 \u00B7 \u8D77\u6E90\u4E4B\u5916", onDone: () => { g.setFlag('chapter6ArrivalSeen', true); setCinema(null); play('unlock'); } })), cinema === 'ch6engel' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER6_ENGEL_SCENES, eventId: "chapter-6", frameTitle: "\u7B2C\u516D\u7AE0 \u00B7 \u6700\u540E\u7684\u610F\u8BC6\u56DE\u58F0", onDone: () => { g.setFlag('chapter6EngelSeen', true); setCinema(null); play('levelup'); } })), cinema === 'ch6' && (jsxRuntimeExports.jsx(CinematicStage, { scenes: CHAPTER6_VICTORY_SCENES, eventId: "chapter-6", frameTitle: "\u7B2C\u516D\u7AE0 \u00B7 \u8D77\u6E90\u4E4B\u5916", onDone: () => {
	                    g.setFlag('chapter6CinematicShown', true);
	                    setCinema(null);
	                    play('levelup');
	                    g.toast('warn', '最终裁决结束——前往结局档案做出你的选择。');
	                } }))] }));
	}

	function _arrayLikeToArray(r, a) {
	  (null == a || a > r.length) && (a = r.length);
	  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	  return n;
	}
	function _arrayWithHoles(r) {
	  if (Array.isArray(r)) return r;
	}
	function _defineProperty$1(e, r, t) {
	  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
	    value: t,
	    enumerable: true,
	    configurable: true,
	    writable: true
	  }) : e[r] = t, e;
	}
	function _iterableToArrayLimit(r, l) {
	  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	  if (null != t) {
	    var e,
	      n,
	      i,
	      u,
	      a = [],
	      f = true,
	      o = false;
	    try {
	      if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
	    } catch (r) {
	      o = true, n = r;
	    } finally {
	      try {
	        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
	      } finally {
	        if (o) throw n;
	      }
	    }
	    return a;
	  }
	}
	function _nonIterableRest() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function ownKeys$1(e, r) {
	  var t = Object.keys(e);
	  if (Object.getOwnPropertySymbols) {
	    var o = Object.getOwnPropertySymbols(e);
	    r && (o = o.filter(function (r) {
	      return Object.getOwnPropertyDescriptor(e, r).enumerable;
	    })), t.push.apply(t, o);
	  }
	  return t;
	}
	function _objectSpread2$1(e) {
	  for (var r = 1; r < arguments.length; r++) {
	    var t = null != arguments[r] ? arguments[r] : {};
	    r % 2 ? ownKeys$1(Object(t), true).forEach(function (r) {
	      _defineProperty$1(e, r, t[r]);
	    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$1(Object(t)).forEach(function (r) {
	      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
	    });
	  }
	  return e;
	}
	function _objectWithoutProperties(e, t) {
	  if (null == e) return {};
	  var o,
	    r,
	    i = _objectWithoutPropertiesLoose(e, t);
	  if (Object.getOwnPropertySymbols) {
	    var n = Object.getOwnPropertySymbols(e);
	    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
	  }
	  return i;
	}
	function _objectWithoutPropertiesLoose(r, e) {
	  if (null == r) return {};
	  var t = {};
	  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
	    if (-1 !== e.indexOf(n)) continue;
	    t[n] = r[n];
	  }
	  return t;
	}
	function _slicedToArray(r, e) {
	  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
	}
	function _toPrimitive(t, r) {
	  if ("object" != typeof t || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r);
	    if ("object" != typeof i) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	function _toPropertyKey(t) {
	  var i = _toPrimitive(t, "string");
	  return "symbol" == typeof i ? i : i + "";
	}
	function _unsupportedIterableToArray(r, a) {
	  if (r) {
	    if ("string" == typeof r) return _arrayLikeToArray(r, a);
	    var t = {}.toString.call(r).slice(8, -1);
	    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
	  }
	}

	function _defineProperty(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function ownKeys(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread2(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys(Object(source), true).forEach(function (key) {
	        _defineProperty(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function compose$1() {
	  for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
	    fns[_key] = arguments[_key];
	  }

	  return function (x) {
	    return fns.reduceRight(function (y, f) {
	      return f(y);
	    }, x);
	  };
	}

	function curry$1(fn) {
	  return function curried() {
	    var _this = this;

	    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      args[_key2] = arguments[_key2];
	    }

	    return args.length >= fn.length ? fn.apply(this, args) : function () {
	      for (var _len3 = arguments.length, nextArgs = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	        nextArgs[_key3] = arguments[_key3];
	      }

	      return curried.apply(_this, [].concat(args, nextArgs));
	    };
	  };
	}

	function isObject$1(value) {
	  return {}.toString.call(value).includes('Object');
	}

	function isEmpty(obj) {
	  return !Object.keys(obj).length;
	}

	function isFunction(value) {
	  return typeof value === 'function';
	}

	function hasOwnProperty(object, property) {
	  return Object.prototype.hasOwnProperty.call(object, property);
	}

	function validateChanges(initial, changes) {
	  if (!isObject$1(changes)) errorHandler$1('changeType');
	  if (Object.keys(changes).some(function (field) {
	    return !hasOwnProperty(initial, field);
	  })) errorHandler$1('changeField');
	  return changes;
	}

	function validateSelector(selector) {
	  if (!isFunction(selector)) errorHandler$1('selectorType');
	}

	function validateHandler(handler) {
	  if (!(isFunction(handler) || isObject$1(handler))) errorHandler$1('handlerType');
	  if (isObject$1(handler) && Object.values(handler).some(function (_handler) {
	    return !isFunction(_handler);
	  })) errorHandler$1('handlersType');
	}

	function validateInitial(initial) {
	  if (!initial) errorHandler$1('initialIsRequired');
	  if (!isObject$1(initial)) errorHandler$1('initialType');
	  if (isEmpty(initial)) errorHandler$1('initialContent');
	}

	function throwError$1(errorMessages, type) {
	  throw new Error(errorMessages[type] || errorMessages["default"]);
	}

	var errorMessages$1 = {
	  initialIsRequired: 'initial state is required',
	  initialType: 'initial state should be an object',
	  initialContent: 'initial state shouldn\'t be an empty object',
	  handlerType: 'handler should be an object or a function',
	  handlersType: 'all handlers should be a functions',
	  selectorType: 'selector should be a function',
	  changeType: 'provided value of changes should be an object',
	  changeField: 'it seams you want to change a field in the state which is not specified in the "initial" state',
	  "default": 'an unknown error accured in `state-local` package'
	};
	var errorHandler$1 = curry$1(throwError$1)(errorMessages$1);
	var validators$1 = {
	  changes: validateChanges,
	  selector: validateSelector,
	  handler: validateHandler,
	  initial: validateInitial
	};

	function create(initial) {
	  var handler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	  validators$1.initial(initial);
	  validators$1.handler(handler);
	  var state = {
	    current: initial
	  };
	  var didUpdate = curry$1(didStateUpdate)(state, handler);
	  var update = curry$1(updateState)(state);
	  var validate = curry$1(validators$1.changes)(initial);
	  var getChanges = curry$1(extractChanges)(state);

	  function getState() {
	    var selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function (state) {
	      return state;
	    };
	    validators$1.selector(selector);
	    return selector(state.current);
	  }

	  function setState(causedChanges) {
	    compose$1(didUpdate, update, validate, getChanges)(causedChanges);
	  }

	  return [getState, setState];
	}

	function extractChanges(state, causedChanges) {
	  return isFunction(causedChanges) ? causedChanges(state.current) : causedChanges;
	}

	function updateState(state, changes) {
	  state.current = _objectSpread2(_objectSpread2({}, state.current), changes);
	  return changes;
	}

	function didStateUpdate(state, handler, changes) {
	  isFunction(handler) ? handler(state.current) : Object.keys(changes).forEach(function (field) {
	    var _handler$field;

	    return (_handler$field = handler[field]) === null || _handler$field === void 0 ? void 0 : _handler$field.call(handler, state.current[field]);
	  });
	  return changes;
	}

	var index = {
	  create: create
	};

	var config$1 = {
	  paths: {
	    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs'
	  }
	};

	function curry(fn) {
	  return function curried() {
	    var _this = this;
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }
	    return args.length >= fn.length ? fn.apply(this, args) : function () {
	      for (var _len2 = arguments.length, nextArgs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	        nextArgs[_key2] = arguments[_key2];
	      }
	      return curried.apply(_this, [].concat(args, nextArgs));
	    };
	  };
	}

	function isObject(value) {
	  return {}.toString.call(value).includes('Object');
	}

	/**
	 * validates the configuration object and informs about deprecation
	 * @param {Object} config - the configuration object 
	 * @return {Object} config - the validated configuration object
	 */
	function validateConfig(config) {
	  if (!config) errorHandler('configIsRequired');
	  if (!isObject(config)) errorHandler('configType');
	  if (config.urls) {
	    informAboutDeprecation();
	    return {
	      paths: {
	        vs: config.urls.monacoBase
	      }
	    };
	  }
	  return config;
	}

	/**
	 * logs deprecation message
	 */
	function informAboutDeprecation() {
	  console.warn(errorMessages.deprecation);
	}
	function throwError(errorMessages, type) {
	  throw new Error(errorMessages[type] || errorMessages["default"]);
	}
	var errorMessages = {
	  configIsRequired: 'the configuration object is required',
	  configType: 'the configuration object should be an object',
	  "default": 'an unknown error accured in `@monaco-editor/loader` package',
	  deprecation: "Deprecation warning!\n    You are using deprecated way of configuration.\n\n    Instead of using\n      monaco.config({ urls: { monacoBase: '...' } })\n    use\n      monaco.config({ paths: { vs: '...' } })\n\n    For more please check the link https://github.com/suren-atoyan/monaco-loader#config\n  "
	};
	var errorHandler = curry(throwError)(errorMessages);
	var validators = {
	  config: validateConfig
	};

	var compose = function compose() {
	  for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
	    fns[_key] = arguments[_key];
	  }
	  return function (x) {
	    return fns.reduceRight(function (y, f) {
	      return f(y);
	    }, x);
	  };
	};

	function merge(target, source) {
	  Object.keys(source).forEach(function (key) {
	    if (source[key] instanceof Object) {
	      if (target[key]) {
	        Object.assign(source[key], merge(target[key], source[key]));
	      }
	    }
	  });
	  return _objectSpread2$1(_objectSpread2$1({}, target), source);
	}

	// The source (has been changed) is https://github.com/facebook/react/issues/5465#issuecomment-157888325

	var CANCELATION_MESSAGE = {
	  type: 'cancelation',
	  msg: 'operation is manually canceled'
	};
	function makeCancelable(promise) {
	  var hasCanceled_ = false;
	  var wrappedPromise = new Promise(function (resolve, reject) {
	    promise.then(function (val) {
	      return hasCanceled_ ? reject(CANCELATION_MESSAGE) : resolve(val);
	    });
	    promise["catch"](reject);
	  });
	  return wrappedPromise.cancel = function () {
	    return hasCanceled_ = true;
	  }, wrappedPromise;
	}

	var _excluded = ["monaco"];

	/** the local state of the module */
	var _state$create = index.create({
	    config: config$1,
	    isInitialized: false,
	    resolve: null,
	    reject: null,
	    monaco: null
	  }),
	  _state$create2 = _slicedToArray(_state$create, 2),
	  getState = _state$create2[0],
	  setState = _state$create2[1];

	/**
	 * set the loader configuration
	 * @param {Object} config - the configuration object
	 */
	function config(globalConfig) {
	  var _validators$config = validators.config(globalConfig),
	    monaco = _validators$config.monaco,
	    config = _objectWithoutProperties(_validators$config, _excluded);
	  setState(function (state) {
	    return {
	      config: merge(state.config, config),
	      monaco: monaco
	    };
	  });
	}

	/**
	 * handles the initialization of the monaco-editor
	 * @return {Promise} - returns an instance of monaco (with a cancelable promise)
	 */
	function init() {
	  var state = getState(function (_ref) {
	    var monaco = _ref.monaco,
	      isInitialized = _ref.isInitialized,
	      resolve = _ref.resolve;
	    return {
	      monaco: monaco,
	      isInitialized: isInitialized,
	      resolve: resolve
	    };
	  });
	  if (!state.isInitialized) {
	    setState({
	      isInitialized: true
	    });
	    if (state.monaco) {
	      state.resolve(state.monaco);
	      return makeCancelable(wrapperPromise);
	    }
	    if (window.monaco && window.monaco.editor) {
	      storeMonacoInstance(window.monaco);
	      state.resolve(window.monaco);
	      return makeCancelable(wrapperPromise);
	    }
	    compose(injectScripts, getMonacoLoaderScript)(configureLoader);
	  }
	  return makeCancelable(wrapperPromise);
	}

	/**
	 * injects provided scripts into the document.body
	 * @param {Object} script - an HTML script element
	 * @return {Object} - the injected HTML script element
	 */
	function injectScripts(script) {
	  return document.body.appendChild(script);
	}

	/**
	 * creates an HTML script element with/without provided src
	 * @param {string} [src] - the source path of the script
	 * @return {Object} - the created HTML script element
	 */
	function createScript(src) {
	  var script = document.createElement('script');
	  return src && (script.src = src), script;
	}

	/**
	 * creates an HTML script element with the monaco loader src
	 * @return {Object} - the created HTML script element
	 */
	function getMonacoLoaderScript(configureLoader) {
	  var state = getState(function (_ref2) {
	    var config = _ref2.config,
	      reject = _ref2.reject;
	    return {
	      config: config,
	      reject: reject
	    };
	  });
	  var loaderScript = createScript("".concat(state.config.paths.vs, "/loader.js"));
	  loaderScript.onload = function () {
	    return configureLoader();
	  };
	  loaderScript.onerror = state.reject;
	  return loaderScript;
	}

	/**
	 * configures the monaco loader
	 */
	function configureLoader() {
	  var state = getState(function (_ref3) {
	    var config = _ref3.config,
	      resolve = _ref3.resolve,
	      reject = _ref3.reject;
	    return {
	      config: config,
	      resolve: resolve,
	      reject: reject
	    };
	  });
	  var require = window.require;
	  require.config(state.config);
	  require(['vs/editor/editor.main'], function (loaded) {
	    var monaco = loaded.m /* for 0.53 & 0.54 */ || loaded /* for other versions */;
	    storeMonacoInstance(monaco);
	    state.resolve(monaco);
	  }, function (error) {
	    state.reject(error);
	  });
	}

	/**
	 * store monaco instance in local state
	 */
	function storeMonacoInstance(monaco) {
	  if (!getState().monaco) {
	    setState({
	      monaco: monaco
	    });
	  }
	}

	/**
	 * internal helper function
	 * extracts stored monaco instance
	 * @return {Object|null} - the monaco instance
	 */
	function __getMonacoInstance() {
	  return getState(function (_ref4) {
	    var monaco = _ref4.monaco;
	    return monaco;
	  });
	}
	var wrapperPromise = new Promise(function (resolve, reject) {
	  return setState({
	    resolve: resolve,
	    reject: reject
	  });
	});
	var loader = {
	  config: config,
	  init: init,
	  __getMonacoInstance: __getMonacoInstance
	};

	var le={wrapper:{display:"flex",position:"relative",textAlign:"initial"},fullWidth:{width:"100%"},hide:{display:"none"}},v=le;var ae={container:{display:"flex",height:"100%",width:"100%",justifyContent:"center",alignItems:"center"}},Y=ae;function Me({children:e}){return We.createElement("div",{style:Y.container},e)}var Z=Me;var $=Z;function Ee({width:e,height:r,isEditorReady:n,loading:t,_ref:a,className:m,wrapperProps:E}){return We.createElement("section",{style:{...v.wrapper,width:e,height:r},...E},!n&&We.createElement($,null,t),We.createElement("div",{ref:a,style:{...v.fullWidth,...!n&&v.hide},className:m}))}var ee=Ee;var H=reactExports.memo(ee);function Ce(e){reactExports.useEffect(e,[]);}var k=Ce;function he(e,r,n=true){let t=reactExports.useRef(true);reactExports.useEffect(t.current||!n?()=>{t.current=false;}:e,r);}var l=he;function D(){}function h(e,r,n,t){return De(e,t)||be(e,r,n,t)}function De(e,r){return e.editor.getModel(te(e,r))}function be(e,r,n,t){return e.editor.createModel(r,n,t?te(e,t):void 0)}function te(e,r){return e.Uri.parse(r)}function Oe({original:e,modified:r,language:n,originalLanguage:t,modifiedLanguage:a,originalModelPath:m,modifiedModelPath:E,keepCurrentOriginalModel:g=false,keepCurrentModifiedModel:N=false,theme:x="light",loading:P="Loading...",options:y={},height:V="100%",width:z="100%",className:F,wrapperProps:j={},beforeMount:A=D,onMount:q=D}){let[M,O]=reactExports.useState(false),[T,s]=reactExports.useState(true),u=reactExports.useRef(null),c=reactExports.useRef(null),w=reactExports.useRef(null),d=reactExports.useRef(q),o=reactExports.useRef(A),b=reactExports.useRef(false);k(()=>{let i=loader.init();return i.then(f=>(c.current=f)&&s(false)).catch(f=>f?.type!=="cancelation"&&console.error("Monaco initialization: error:",f)),()=>u.current?I():i.cancel()}),l(()=>{if(u.current&&c.current){let i=u.current.getOriginalEditor(),f=h(c.current,e||"",t||n||"text",m||"");f!==i.getModel()&&i.setModel(f);}},[m],M),l(()=>{if(u.current&&c.current){let i=u.current.getModifiedEditor(),f=h(c.current,r||"",a||n||"text",E||"");f!==i.getModel()&&i.setModel(f);}},[E],M),l(()=>{let i=u.current.getModifiedEditor();i.getOption(c.current.editor.EditorOption.readOnly)?i.setValue(r||""):r!==i.getValue()&&(i.executeEdits("",[{range:i.getModel().getFullModelRange(),text:r||"",forceMoveMarkers:true}]),i.pushUndoStop());},[r],M),l(()=>{u.current?.getModel()?.original.setValue(e||"");},[e],M),l(()=>{let{original:i,modified:f}=u.current.getModel();c.current.editor.setModelLanguage(i,t||n||"text"),c.current.editor.setModelLanguage(f,a||n||"text");},[n,t,a],M),l(()=>{c.current?.editor.setTheme(x);},[x],M),l(()=>{u.current?.updateOptions(y);},[y],M);let L=reactExports.useCallback(()=>{if(!c.current)return;o.current(c.current);let i=h(c.current,e||"",t||n||"text",m||""),f=h(c.current,r||"",a||n||"text",E||"");u.current?.setModel({original:i,modified:f});},[n,r,a,e,t,m,E]),U=reactExports.useCallback(()=>{!b.current&&w.current&&(u.current=c.current.editor.createDiffEditor(w.current,{automaticLayout:true,...y}),L(),c.current?.editor.setTheme(x),O(true),b.current=true);},[y,x,L]);reactExports.useEffect(()=>{M&&d.current(u.current,c.current);},[M]),reactExports.useEffect(()=>{!T&&!M&&U();},[T,M,U]);function I(){let i=u.current?.getModel();g||i?.original?.dispose(),N||i?.modified?.dispose(),u.current?.dispose();}return We.createElement(H,{width:z,height:V,isEditorReady:M,loading:P,_ref:w,className:F,wrapperProps:j})}var ie=Oe;reactExports.memo(ie);function He(e){let r=reactExports.useRef();return reactExports.useEffect(()=>{r.current=e;},[e]),r.current}var se=He;var _=new Map;function Ve({defaultValue:e,defaultLanguage:r,defaultPath:n,value:t,language:a,path:m,theme:E="light",line:g,loading:N="Loading...",options:x={},overrideServices:P={},saveViewState:y=true,keepCurrentModel:V=false,width:z="100%",height:F="100%",className:j,wrapperProps:A={},beforeMount:q=D,onMount:M=D,onChange:O,onValidate:T=D}){let[s,u]=reactExports.useState(false),[c,w]=reactExports.useState(true),d=reactExports.useRef(null),o=reactExports.useRef(null),b=reactExports.useRef(null),L=reactExports.useRef(M),U=reactExports.useRef(q),I=reactExports.useRef(),i=reactExports.useRef(t),f=se(m),Q=reactExports.useRef(false),B=reactExports.useRef(false);k(()=>{let p=loader.init();return p.then(R=>(d.current=R)&&w(false)).catch(R=>R?.type!=="cancelation"&&console.error("Monaco initialization: error:",R)),()=>o.current?pe():p.cancel()}),l(()=>{let p=h(d.current,e||t||"",r||a||"",m||n||"");p!==o.current?.getModel()&&(y&&_.set(f,o.current?.saveViewState()),o.current?.setModel(p),y&&o.current?.restoreViewState(_.get(m)));},[m],s),l(()=>{o.current?.updateOptions(x);},[x],s),l(()=>{!o.current||t===void 0||(o.current.getOption(d.current.editor.EditorOption.readOnly)?o.current.setValue(t):t!==o.current.getValue()&&(B.current=true,o.current.executeEdits("",[{range:o.current.getModel().getFullModelRange(),text:t,forceMoveMarkers:true}]),o.current.pushUndoStop(),B.current=false));},[t],s),l(()=>{let p=o.current?.getModel();p&&a&&d.current?.editor.setModelLanguage(p,a);},[a],s),l(()=>{g!==void 0&&o.current?.revealLine(g);},[g],s),l(()=>{d.current?.editor.setTheme(E);},[E],s);let X=reactExports.useCallback(()=>{if(!(!b.current||!d.current)&&!Q.current){U.current(d.current);let p=m||n,R=h(d.current,t||e||"",r||a||"",p||"");o.current=d.current?.editor.create(b.current,{model:R,automaticLayout:true,...x},P),y&&o.current.restoreViewState(_.get(p)),d.current.editor.setTheme(E),g!==void 0&&o.current.revealLine(g),u(true),Q.current=true;}},[e,r,n,t,a,m,x,P,y,E,g]);reactExports.useEffect(()=>{s&&L.current(o.current,d.current);},[s]),reactExports.useEffect(()=>{!c&&!s&&X();},[c,s,X]),i.current=t,reactExports.useEffect(()=>{s&&O&&(I.current?.dispose(),I.current=o.current?.onDidChangeModelContent(p=>{B.current||O(o.current.getValue(),p);}));},[s,O]),reactExports.useEffect(()=>{if(s){let p=d.current.editor.onDidChangeMarkers(R=>{let G=o.current.getModel()?.uri;if(G&&R.find(J=>J.path===G.path)){let J=d.current.editor.getModelMarkers({resource:G});T?.(J);}});return ()=>{p?.dispose();}}return ()=>{}},[s,T]);function pe(){I.current?.dispose(),V?y&&_.set(m,o.current.saveViewState()):o.current.getModel()?.dispose(),o.current.dispose();}return We.createElement(H,{width:z,height:F,isEditorReady:s,loading:N,_ref:b,className:j,wrapperProps:A})}var fe=Ve;var de=reactExports.memo(fe);var Ft=de;

	// Monaco 通过 CDN 按需加载（jsdelivr），避免把 monaco-editor 打进游戏包
	// 本地内置 Monaco（public/monaco/vs，随构建分发，完全离线）；仅在本地缺失时才回退 CDN
	const LOCAL_MONACO = (() => {
	    try {
	        const u = new URL('monaco/vs', document.baseURI).href;
	        return u.replace(/\/+$/, '');
	    }
	    catch {
	        return '';
	    }
	})();
	const MONACO_CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';
	loader.config({
	    paths: {
	        vs: LOCAL_MONACO || MONACO_CDN,
	    },
	});
	let themeReady = false;
	let edSeq = 0;
	const ERR_STYLE = '.nx-error-line { background: rgba(255, 91, 100, 0.13) !important; box-shadow: inset 3px 0 0 var(--red); } .nx-error-gutter { border-left: 3px solid var(--red); } .nx-debug-line { background: rgba(243, 183, 92, 0.16) !important; box-shadow: inset 3px 0 0 var(--orange); } .nx-debug-gutter { border-left: 3px solid var(--orange); } .nx-scan-line { background: rgba(66, 214, 208, 0.14) !important; box-shadow: inset 3px 0 0 #42D6D0; } .nx-scan-gutter { border-left: 3px solid #42D6D0; }';
	function CodeEditor({ value, onChange, height = '100%', fontSize = 15, readOnly = false, errorLine, debugLine, markLines, onRun, placeholder, }) {
	    const edRef = reactExports.useRef(null);
	    const monRef = reactExports.useRef(null);
	    const decRef = reactExports.useRef(null);
	    const idRef = reactExports.useRef('nx' + ++edSeq);
	    const onRunRef = reactExports.useRef(onRun);
	    onRunRef.current = onRun;
	    reactExports.useEffect(() => {
	        const ed = edRef.current;
	        const mon = monRef.current;
	        if (!ed || !mon)
	            return;
	        ed.addCommand(mon.KeyMod.CtrlCmd | mon.KeyCode.Enter, () => {
	            onRunRef.current?.();
	        });
	        // 命令随编辑器实例销毁
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, []);
	    reactExports.useEffect(() => {
	        const ed = edRef.current;
	        const mon = monRef.current;
	        if (!ed || !mon)
	            return;
	        if (!decRef.current)
	            decRef.current = ed.createDecorationsCollection();
	        const model = ed.getModel();
	        const marks = [];
	        if (errorLine != null && model && errorLine >= 1 && errorLine <= model.getLineCount()) {
	            marks.push({ line: errorLine, kind: 'error' });
	        }
	        if (debugLine != null && debugLine >= 1 && model && debugLine <= model.getLineCount()) {
	            marks.push({ line: debugLine, kind: 'debug' });
	        }
	        if (markLines && model) {
	            for (const ln of markLines) {
	                if (ln >= 1 && ln <= model.getLineCount())
	                    marks.push({ line: ln, kind: 'scan' });
	            }
	        }
	        decRef.current.set(marks.map(m => ({
	            range: new mon.Range(m.line, 1, m.line, model.getLineMaxColumn(m.line)),
	            options: {
	                isWholeLine: true,
	                className: m.kind === 'error' ? 'nx-error-line' : m.kind === 'debug' ? 'nx-debug-line' : 'nx-scan-line',
	                linesDecorationsClassName: m.kind === 'error' ? 'nx-error-gutter' : m.kind === 'debug' ? 'nx-debug-gutter' : 'nx-scan-gutter',
	            },
	        })));
	        const top = marks[0]?.line;
	        if (top)
	            ed.revealLineInCenter(top);
	    }, [errorLine, debugLine, markLines]);
	    return (jsxRuntimeExports.jsxs("div", { style: { width: '100%', height }, className: "code-editor-host", children: [jsxRuntimeExports.jsx("style", { children: ERR_STYLE }), jsxRuntimeExports.jsx(Ft, { path: idRef.current + '.py', height: "100%", language: "python", theme: "nexus-dark", value: value, onChange: (v) => onChange(v ?? ''), loading: jsxRuntimeExports.jsxs("div", { style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A6E85' }, children: [jsxRuntimeExports.jsx("span", { className: "spinner" }), "\u00A0\u6B63\u5728\u4ECE CDN \u52A0\u8F7D\u4EE3\u7801\u7F16\u8F91\u5668\u2026"] }), onMount: (ed, mon) => {
	                    edRef.current = ed;
	                    monRef.current = mon;
	                    if (!themeReady) {
	                        try {
	                            mon.editor.defineTheme('nexus-dark', {
	                                base: 'vs-dark',
	                                inherit: true,
	                                rules: [
	                                    { token: 'comment', foreground: '4A6E85', fontStyle: 'italic' },
	                                    { token: 'string', foreground: '35D39A' },
	                                    { token: 'string.escape', foreground: 'F3B75C' },
	                                    { token: 'keyword', foreground: '42D6D0', fontStyle: 'bold' },
	                                    { token: 'number', foreground: 'F3B75C' },
	                                    { token: 'type', foreground: '3986C8' },
	                                    { token: 'identifier', foreground: 'EAF3FA' },
	                                    { token: 'delimiter', foreground: '8FB0C9' },
	                                    { token: 'operator', foreground: '42D6D0' },
	                                    { token: 'function', foreground: '6FB7E8' },
	                                ],
	                                colors: {
	                                    'editor.background': '#0A1622',
	                                    'editor.lineHighlightBackground': '#101F2D88',
	                                    'editorLineNumber.foreground': '#2C4A5C',
	                                    'editorLineNumber.activeForeground': '#42D6D0',
	                                    'editorCursor.foreground': '#42D6D0',
	                                    'editor.selectionBackground': '#1D4A6688',
	                                    'editor.inactiveSelectionBackground': '#1D4A6655',
	                                    'editorIndentGuide.background1': '#12293A',
	                                    'editorIndentGuide.activeBackground1': '#1E4A63',
	                                    'editorGutter.background': '#0A1622',
	                                    'editorWidget.background': '#0D1B28',
	                                    'editorSuggestWidget.background': '#0D1B28',
	                                    'editorSuggestWidget.border': '#1E3A50',
	                                    'editorBracketMatch.border': '#42D6D0',
	                                    'editorBracketMatch.background': '#42D6D033',
	                                },
	                            });
	                            themeReady = true;
	                        }
	                        catch { /* ignore */ }
	                    }
	                    mon.editor.setTheme('nexus-dark');
	                    ed.updateOptions({ readOnly });
	                }, options: {
	                    fontSize,
	                    fontFamily: 'Consolas, "Cascadia Code", monospace',
	                    minimap: { enabled: false },
	                    lineNumbers: 'on',
	                    lineNumbersMinChars: 3,
	                    scrollBeyondLastLine: false,
	                    automaticLayout: true,
	                    tabSize: 4,
	                    insertSpaces: true,
	                    wordWrap: 'on',
	                    renderWhitespace: 'selection',
	                    bracketPairColorization: { enabled: true },
	                    guides: { indentation: true, bracketPairs: true },
	                    smoothScrolling: true,
	                    cursorBlinking: 'smooth',
	                    cursorSmoothCaretAnimation: 'on',
	                    padding: { top: 10, bottom: 10 },
	                    quickSuggestions: false,
	                    suggestOnTriggerCharacters: false,
	                    parameterHints: { enabled: false },
	                    readOnly,
	                    scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
	                    placeholder,
	                } })] }));
	}

	function Terminal({ lines, title = '维修终端', maxHeight = 320, autoScroll = true }) {
	    const bodyRef = reactExports.useRef(null);
	    reactExports.useEffect(() => {
	        if (autoScroll && bodyRef.current)
	            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
	    }, [lines, autoScroll]);
	    return (jsxRuntimeExports.jsxs("div", { className: "term", style: { height: '100%' }, children: [jsxRuntimeExports.jsxs("div", { className: "term-head", children: [jsxRuntimeExports.jsx("span", { className: "dot r" }), jsxRuntimeExports.jsx("span", { className: "dot y" }), jsxRuntimeExports.jsx("span", { className: "dot g" }), jsxRuntimeExports.jsx("span", { style: { marginLeft: 6 }, children: title }), jsxRuntimeExports.jsx("span", { style: { marginLeft: 'auto', opacity: 0.6 }, children: "PYTHON 3.12 // PYODIDE" })] }), jsxRuntimeExports.jsxs("div", { className: "term-body", ref: bodyRef, style: { maxHeight }, children: [lines.length === 0 && jsxRuntimeExports.jsx("p", { className: "term-line muted", children: "\u2014\u2014 \u7EC8\u7AEF\u7A7A\u95F2\u3002\u70B9\u51FB\u300C\u8FD0\u884C\u4EE3\u7801\u300D\u6267\u884C\u5F53\u524D\u7A0B\u5E8F \u2014\u2014" }), lines.map((l, i) => (jsxRuntimeExports.jsx("p", { className: 'term-line ' + l.kind, children: l.text }, i))), jsxRuntimeExports.jsx("span", { className: "term-cursor" })] })] }));
	}

	const HINT_MAX = 3;
	function miraLevelHint(level, used) {
	    if (used >= HINT_MAX) {
	        return {
	            text: '我已经给出全部提示了。试着把终端报错信息里的错误类型和行号读出来——答案往往就在那里。',
	            level: HINT_MAX,
	            exhausted: true,
	        };
	    }
	    return { text: level.hints[used], level: used + 1, exhausted: false };
	}
	const ERROR_EXPLAIN = {
	    SyntaxError: '是语法错误。检查这几样：括号和引号是否成对闭合、if/for 语句末尾的英文冒号、以及语句里的标点是否都用了英文符号。',
	    IndentationError: '是缩进错误。Python 用行首空格表示代码层级——检查 for/if 下面的代码是否缩进了一致的空格数。',
	    NameError: '是名字错误。程序用了一个还没有定义（或拼写不一致）的名字。对比定义处和使用处的拼写与大小写。',
	    TypeError: '是类型错误。操作的值的类型不符合预期，比如对字符串做了算术运算。',
	    IndexError: '是索引越界。列表索引超出了范围——记住索引起点从 0 开始。',
	    ValueError: '是值错误。某个函数收到了不符合要求的数值。',
	    ZeroDivisionError: '是除数为零。检查除法运算的分母是否可能为 0。',
	};
	function miraOnError(type) {
	    if (type && ERROR_EXPLAIN[type])
	        return ERROR_EXPLAIN[type];
	    return '程序没能正常运行。看看终端里标红的错误信息——错误类型和行号是最重要的线索。';
	}
	function miraOnFail(n, tolerance) {
	    const rel = tolerance - n;
	    if (rel < 0)
	        return { tone: 'danger', text: '警告：提交失败次数已超过容错上限。纠错者正在锁定你的数据坐标……' };
	    if (rel === 0)
	        return { tone: 'danger', text: '这是容错次数内的最后一次机会，R-07。再失败一次，纠错者就会锁定你。冷静下来，重读一遍错误信息。' };
	    if (rel === 1)
	        return { tone: 'hint', text: '小心，只剩 1 次容错机会了。需要提示的话可以呼叫我。' };
	    return { tone: 'normal', text: '提交未通过。别慌——「运行」不会计入失败次数，先在终端里把代码跑通，再回来提交。' };
	}
	function miraOnRespawn() {
	    return '你的意识已重新载入。当前关卡的代码已重置，容错计数也已清零。慢慢来。';
	}

	function MiraPanel({ message, msgTag = 'MIRA', hintUsed, onAskHint, extra }) {
	    const exhausted = hintUsed >= HINT_MAX;
	    return (jsxRuntimeExports.jsxs("div", { className: "mira-box", children: [jsxRuntimeExports.jsxs("div", { className: "mira-head", children: [jsxRuntimeExports.jsx("div", { className: "mira-avatar", children: "M" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "mira-name", children: "MIRA" }), jsxRuntimeExports.jsx("div", { className: "mira-status", children: "\u667A\u80FD\u7EF4\u4FEE\u52A9\u624B \u00B7 ONLINE" })] }), jsxRuntimeExports.jsx("div", { style: { marginLeft: 'auto' }, children: jsxRuntimeExports.jsx("button", { className: "nxbtn small", onClick: onAskHint, disabled: !onAskHint, children: exhausted ? '提示已用尽' : 'MIRA 提示' }) })] }), jsxRuntimeExports.jsxs("div", { className: "mira-msg", children: [jsxRuntimeExports.jsxs("span", { className: "mira-tag", children: ["\u25C8 ", msgTag] }), message] }, msgTag + message.slice(0, 12)), jsxRuntimeExports.jsxs("div", { className: "row", style: { gap: 6 }, children: [jsxRuntimeExports.jsx("span", { className: "chip", children: "\u63D0\u793A\u6DF1\u5EA6" }), Array.from({ length: HINT_MAX }).map((_, i) => (jsxRuntimeExports.jsx("span", { className: 'chip' + (i < hintUsed ? ' cyan' : ' dim'), style: { padding: '1px 8px' }, children: i < hintUsed ? 'L' + (i + 1) + ' ✓' : 'L' + (i + 1) }, i)))] }), extra] }));
	}

	/** 解析 Pyodide 抛出的 Python 异常信息（完整 traceback 文本） */
	function parseTraceback(raw) {
	    let text = String(raw || '').trim();
	    if (text.startsWith('PythonError: '))
	        text = text.slice('PythonError: '.length);
	    const lines = text.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim() !== '');
	    const codeLineIdx = lines.findIndex(l => l.trim() === 'Traceback (most recent call last):');
	    const body = codeLineIdx >= 0 ? lines.slice(codeLineIdx) : lines;
	    // 类型与消息：取最后一行形如 "XXXError: message" 的
	    let type = 'RuntimeError';
	    let message = text;
	    for (const ln of body) {
	        const m = ln.match(/^([A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception|Warning))\s*:\s*(.*)$/);
	        if (m) {
	            type = m[1];
	            message = m[2] || type;
	        }
	    }
	    // line 取最后一个 "line N" 出现位置
	    const lineMatches = [...text.matchAll(/line\s+(\d+)/g)];
	    const line = lineMatches.length ? parseInt(lineMatches[lineMatches.length - 1][1], 10) : undefined;
	    // 保留错误代码行上下文（SyntaxError 的源码行）
	    for (const ln of body) {
	        if (/^[^\s]/.test(ln) && !/^(Traceback|File|\s*\^)/.test(ln) && !ln.includes(':')) {
	            message += ' | ' + ln.trim();
	            break;
	        }
	    }
	    return { type, message, line };
	}
	// ---------- 测试注入 ----------
	function buildHarness(checks) {
	    const body = checks.map(c => '    __nx_assert(' + JSON.stringify(c.name) + ', (' + c.expr + '))').join('\n');
	    return [
	        '',
	        '# ===== NEXUS 自动判题模块（系统注入，请勿修改）=====',
	        '__nx_tests = []',
	        '',
	        'def __nx_assert(n, c):',
	        '    __nx_tests.append((n, bool(c)))',
	        '',
	        'try:',
	        body,
	        'except Exception as __nx_e:',
	        '    __nx_tests.append(("测试执行出错", False, str(__nx_e)))',
	        '',
	        'import json',
	        'print("__NX_MARKER__" + json.dumps(__nx_tests))',
	        '',
	    ].join('\n');
	}
	/** 组合用户代码与测试模块（用户代码在前，判题模块在后） */
	function combineWithHarness(code, harness) {
	    return code.trimEnd() + '\n' + harness;
	}
	/** 从 stdout 中解析 __NX_MARKER__ 标记（取最后一次出现） */
	function parseMarker(stdout) {
	    const lines = stdout.split('\n');
	    let last = null;
	    for (const ln of lines) {
	        if (ln.startsWith('__NX_MARKER__'))
	            last = ln.slice('__NX_MARKER__'.length);
	    }
	    if (last === null)
	        return null;
	    try {
	        const raw = JSON.parse(last);
	        if (!Array.isArray(raw))
	            return null;
	        return raw.map((item) => {
	            if (Array.isArray(item)) {
	                const name = String(item[0] ?? '未命名测试');
	                const ok = item[1] === true;
	                const detail = item.length > 2 ? String(item[2]) : undefined;
	                return { name, ok, detail };
	            }
	            return { name: '未知测试', ok: false };
	        });
	    }
	    catch {
	        return null;
	    }
	}
	/** 过滤掉判题标记行（用于终端展示） */
	function filterMarkerLines(stdout) {
	    return stdout.split('\n').filter(l => !l.startsWith('__NX_MARKER__')).join('\n');
	}
	function judgeRun(spec, r) {
	    if (r.timedOut)
	        return { passed: false, checks: [], timedOut: true };
	    if (!r.ok)
	        return { passed: false, checks: [], error: r.error };
	    if (spec.judgeKind === 'python') {
	        const checks = parseMarker(r.stdout);
	        if (!checks || checks.length === 0) {
	            return {
	                passed: false,
	                checks: [],
	                error: { type: 'JudgeError', message: '判题引擎未能读取到测试结果（程序可能提前退出）' },
	            };
	        }
	        const errCheck = checks.find(c => c.name === '测试执行出错');
	        if (errCheck) {
	            // 测试执行出错：保留逐项明细，出错项改名携带具体原因
	            const detailed = checks.map(c => c.name === '测试执行出错'
	                ? { name: '测试执行出错：' + (c.detail || '用例内部异常'), ok: false }
	                : c);
	            return { passed: false, checks: detailed };
	        }
	        return { passed: checks.every(c => c.ok), checks };
	    }
	    // stdout 判题
	    const checks = [];
	    for (const sc of spec.stdoutChecks || []) {
	        let ok = true;
	        let detail;
	        if (sc.contains) {
	            const missing = sc.contains.filter(s => !r.stdout.includes(s));
	            if (missing.length > 0) {
	                ok = false;
	                detail = diffHint(r.stdout, missing[0]);
	            }
	        }
	        if (ok && sc.notContains) {
	            const hit = sc.notContains.find(s => r.stdout.includes(s));
	            if (hit !== undefined) {
	                ok = false;
	                detail = '输出中不应出现 "' + hit + '"';
	            }
	        }
	        if (ok && sc.lines) {
	            const actual = r.stdout.split('\n').map(l => l.trim()).filter(Boolean);
	            let idx = 0;
	            for (const want of sc.lines) {
	                const found = actual.indexOf(want, idx);
	                if (found < 0) {
	                    ok = false;
	                    detail = '期望按顺序输出这些行：' + sc.lines.map(l => '"' + l + '"').join(' → ') + '；实际输出：' + (actual.length ? actual.map(l => '"' + l + '"').join(' → ') : '（无输出）');
	                    break;
	                }
	                idx = found + 1;
	            }
	        }
	        checks.push({ name: sc.name, ok, detail });
	    }
	    return { passed: checks.length > 0 && checks.every(c => c.ok), checks };
	}
	/** 面向零基础的差异说明：告诉玩家「差在哪」 */
	function diffHint(actualRaw, want) {
	    const a = actualRaw.replace(/\n+$/, '');
	    const flat = a.replace(/\s+/g, '');
	    const wantFlat = want.replace(/\s+/g, '');
	    if (/[，。！？：；（）【】“”‘’、]/.test(a)) {
	        return '输出里用了中文标点（，！等），请改成英文标点（, !）';
	    }
	    if (flat === wantFlat) {
	        // 内容一致，只差空白 —— 指出缺空格的位置
	        for (let i = 0; i < want.length; i++) {
	            if (a[i] !== want[i]) {
	                return '只差空格：期望 "' + want + '"，你的输出 "' + a + '"（第 ' + (i + 1) + ' 个字符处）';
	            }
	        }
	        return '只差空格：期望 "' + want + '"，你的输出 "' + a + '"';
	    }
	    return '实际输出 "' + (a.length > 60 ? a.slice(0, 60) + '…' : a) + '"，需要包含 "' + want + '"';
	}
	// ---------- 安全限制 ----------
	const ALLOWED_MODULES = ['math', 'random', 'time', 'statistics', 'datetime', 'json'];
	function stripStringsAndComments(code) {
	    return code
	        .replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, ' ')
	        .replace(/(?:"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/g, ' ')
	        .replace(/#[^\n]*/g, ' ');
	}
	function checkUserCode(code) {
	    if (code.length > 4000)
	        return { allowed: false, reason: '代码长度超过限制（4000 字符）。请精简后重试。' };
	    const stripped = stripStringsAndComments(code);
	    const importRe = /\b(?:import|from)\s+([A-Za-z_][A-Za-z0-9_.]*)/g;
	    let m;
	    const bad = [];
	    while ((m = importRe.exec(stripped)) !== null) {
	        const head = m[1].split('.')[0];
	        if (!ALLOWED_MODULES.includes(head) && !bad.includes(m[1]))
	            bad.push(m[1]);
	    }
	    if (bad.length > 0) {
	        return {
	            allowed: false,
	            reason: '维修终端模块白名单限制：' + bad.join('、') + ' 不在允许列表中。当前允许：' + ALLOWED_MODULES.join(', '),
	        };
	    }
	    if (/\b(?:eval|exec|compile|input|open|__import__|globals|locals|vars)\s*\(/.test(stripped)) {
	        return { allowed: false, reason: '该指令在维修终端中被安全策略禁止（终端不开放文件、求值、交互输入等高风险操作）。' };
	    }
	    return { allowed: true };
	}

	// Python 运行器：MicroPython WebAssembly 在主线程加载（~14ms），
	// 用 sys.settrace 看门狗实现执行超时（死循环可被打断），不依赖 Worker 环境。
	function engineBase() {
	    try {
	        const u = new URL('micropython/', document.baseURI).href;
	        return u.endsWith('/') ? u : u + '/';
	    }
	    catch {
	        return '';
	    }
	}
	const ENGINE_BASE = engineBase();
	let status = 'idle';
	let phase = '';
	let engine = null;
	let loading = null;
	let outBuf = '';
	let errBuf = '';
	const statusListeners = new Set();
	function setStatus(s, ph) {
	    status = s;
	    if (ph !== undefined)
	        phase = ph;
	    statusListeners.forEach(f => f({ status, phase }));
	}
	function onPyStatus(fn) {
	    statusListeners.add(fn);
	    fn({ status, phase });
	    return () => { statusListeners.delete(fn); };
	}
	/** 运行时动态 import（绕过打包器静态解析） */
	const dynImport = new Function('u', 'return import(u);');
	const pyStr = (s) => JSON.stringify(String(s));
	/** 普通执行脚本：接管 print（保证换行/分隔符精确）+ settrace 看门狗（超时可打断） */
	function buildRunner(code, limitSec) {
	    return [
	        'import json, sys, time',
	        '__nx_src = ' + pyStr(code),
	        '__nx_out = []',
	        'def __nx_print(*args, sep=" ", end="\\n"):',
	        '    __nx_out.append(sep.join([str(a) for a in args]) + end)',
	        '__nx_t0 = time.time()',
	        '__nx_limit = ' + String(limitSec),
	        'def __nx_wd(frame, event, arg):',
	        '    if time.time() - __nx_t0 > __nx_limit:',
	        '        raise RuntimeError("execution timeout")',
	        '    return __nx_wd',
	        '__nx_err = ""',
	        'sys.settrace(__nx_wd)',
	        'try:',
	        '    exec(__nx_src, {"print": __nx_print, "__name__": "__main__"})',
	        'except Exception as e:',
	        '    __nx_err = type(e).__name__ + ": " + str(e)',
	        'finally:',
	        '    sys.settrace(None)',
	        'print("__NX_RES__" + json.dumps({"out": "".join(__nx_out), "err": __nx_err}))',
	    ].join('\n');
	}
	/** 调试脚本：逐行轨迹（行号 + 变量快照 + 输出增量），同样带看门狗 */
	function buildDebug(code, limitSec) {
	    return [
	        'import json, sys, time',
	        '__nx_src = ' + pyStr(code),
	        '__nx_out = []',
	        '__nx_trace = []',
	        'def __nx_print(*args, sep=" ", end="\\n"):',
	        '    __nx_out.append(sep.join([str(a) for a in args]) + end)',
	        '__nx_t0 = time.time()',
	        '__nx_limit = ' + String(limitSec),
	        'def __nx_t__(frame, event, arg):',
	        '    if time.time() - __nx_t0 > __nx_limit:',
	        '        raise RuntimeError("execution timeout")',
	        '    if event == "line":',
	        '        if len(__nx_trace) < 500:',
	        '            g = frame.f_globals',
	        '            d = {}',
	        '            for k in g:',
	        '                if not k.startswith("__") and k != "print":',
	        '                    try:',
	        '                        d[k] = repr(g[k])[:80]',
	        '                    except Exception:',
	        '                        d[k] = "<obj>"',
	        '            __nx_trace.append({"line": frame.f_lineno, "vars": d, "out": "".join(__nx_out)})',
	        '            del __nx_out[:]',
	        '    return __nx_t__',
	        'sys.settrace(__nx_t__)',
	        'try:',
	        '    exec(__nx_src, {"print": __nx_print, "__name__": "__main__"})',
	        'finally:',
	        '    rest = "".join(__nx_out)',
	        '    if rest:',
	        '        __nx_trace.append({"line": __nx_trace[-1]["line"] if __nx_trace else -1, "vars": {}, "out": rest})',
	        '    sys.settrace(None)',
	        'print("__NX_TRACE__" + json.dumps(__nx_trace))',
	    ].join('\n');
	}
	function extract(raw, marker) {
	    const i = raw.lastIndexOf(marker);
	    if (i < 0)
	        return null;
	    try {
	        return JSON.parse(raw.slice(i + marker.length).trim());
	    }
	    catch {
	        return null;
	    }
	}
	/** 预加载 Python 内核（进入游戏/关卡时调用） */
	function warmUp() {
	    if (status === 'ready' || status === 'loading')
	        return;
	    if (status === 'error')
	        return;
	    void ensureReady().catch(() => { });
	}
	async function ensureReady() {
	    if (status === 'ready' && engine)
	        return;
	    if (status === 'error')
	        throw new Error(phase || 'Python 内核不可用');
	    if (!loading) {
	        loading = (async () => {
	            setStatus('loading', '载入 Python 内核…');
	            const mod = await dynImport(ENGINE_BASE + 'micropython.mjs');
	            setStatus('loading', '启动解释器…');
	            const loader = mod.loadMicroPython;
	            engine = await loader({
	                url: ENGINE_BASE + 'micropython-settrace.wasm',
	                stdout: (s) => { outBuf += s; },
	                stderr: (s) => { errBuf += s; },
	            });
	            setStatus('ready', 'Python 内核就绪');
	        })().catch((e) => {
	            loading = null;
	            engine = null;
	            setStatus('error', 'Python 内核加载失败：' + String(e?.message || e));
	            throw e;
	        });
	    }
	    return loading;
	}
	let busy = false;
	const queue = [];
	function executeOne(item) {
	    const { code, timeoutMs, debug } = item;
	    const limitSec = Math.max(1, timeoutMs / 1000);
	    outBuf = '';
	    errBuf = '';
	    const script = debug ? buildDebug(code, limitSec) : buildRunner(code, limitSec);
	    let thrown = null;
	    try {
	        engine.runPython(script);
	    }
	    catch (e) {
	        thrown = e;
	    }
	    const raw = outBuf;
	    if (debug) {
	        const trace = extract(raw, '__NX_TRACE__');
	        const traceArr = Array.isArray(trace) ? trace : [];
	        // 调试模式下输出分散在轨迹的各步 out 中——拼接后作为完整 stdout（实验室判题依赖）
	        const dbgOut = traceArr.map((t) => String(t?.out ?? '')).join('');
	        if (thrown) {
	            const err = parseTraceback(String(thrown));
	            return { ok: false, stdout: dbgOut, stderr: errBuf, error: err, timedOut: false, trace: traceArr };
	        }
	        return { ok: true, stdout: dbgOut, stderr: errBuf, timedOut: false, trace: traceArr };
	    }
	    const res = extract(raw, '__NX_RES__');
	    const out = res ? String(res.out ?? '') : '';
	    const errText = res ? String(res.err ?? '') : '';
	    if (errText) {
	        if (errText.includes('execution timeout')) {
	            return { ok: false, stdout: out, stderr: errBuf, timedOut: true };
	        }
	        return { ok: false, stdout: out, stderr: errBuf, error: parseTraceback(errText), timedOut: false };
	    }
	    if (thrown) {
	        return { ok: false, stdout: out, stderr: errBuf, error: parseTraceback(String(thrown)), timedOut: false };
	    }
	    return { ok: true, stdout: out, stderr: errBuf, timedOut: false };
	}
	function pump() {
	    if (busy || queue.length === 0)
	        return;
	    busy = true;
	    const next = queue.shift();
	    ensureReady()
	        .then(() => {
	        const outcome = executeOne(next);
	        busy = false;
	        next.resolve(outcome);
	        pump();
	    })
	        .catch((e) => {
	        busy = false;
	        next.resolve({
	            ok: false, stdout: '', stderr: '', timedOut: false,
	            error: { type: 'EngineError', message: String(e?.message || e) },
	        });
	        pump();
	    });
	}
	function runPython(code, opts) {
	    return new Promise((resolve) => {
	        queue.push({ code, timeoutMs: opts?.timeoutMs ?? 5000, debug: opts?.debug, resolve });
	        pump();
	    });
	}
	function resetEngine() {
	    engine = null;
	    loading = null;
	    status = 'idle';
	    phase = '';
	}

	const KNOWLEDGE = [
	    {
	        id: 'variable', title: '变量：给数据起名字', group: '基础',
	        brief: '变量是给数据起的名字。赋值之后，就可以通过名字使用这份数据。',
	        example: 'repair_id = "R-07"\nprint(repair_id)   # 输出 R-07',
	        pitfalls: ['变量先定义后使用，否则报 NameError。', '名字拼写与大小写必须一致：repair_id 和 repair_ids 是两个名字。', '变量名不能以数字开头。'],
	    },
	    {
	        id: 'print', title: 'print()：输出内容', group: '基础',
	        brief: 'print() 把文字或变量的值显示到终端，是调试代码最常用的工具。',
	        example: 'print("你好，NEXUS")\nprint(42)',
	        pitfalls: ['输出文字要加引号，输出变量不要加引号。', '括号必须闭合，漏掉右括号会语法错误。', '每个 print 默认输出一行。'],
	    },
	    {
	        id: 'string', title: '字符串：被引号包裹的文字', group: '基础',
	        brief: '字符串是文本数据，用英文双引号 " 或单引号 ' + "'" + ' 包裹。',
	        example: 'name = "R-07"\nmsg = ' + "'" + 'SYSTEM ONLINE' + "'",
	        pitfalls: ['引号必须成对出现，缺失会报 EOL 错误。', '不要混用配对：像 "abc' + "'" + ' 这样的写法是错的。', '跨多行的字符串需要使用三引号 """ 包裹。'],
	    },
	    {
	        id: 'if', title: 'if：条件判断分支', group: '流程',
	        brief: 'if 根据条件的真假，决定执行哪一段代码。',
	        example: 'energy = 20\nif energy >= 10:\n    print("活力充足")\nelse:\n    print("活力不足")',
	        pitfalls: ['if 条件末尾必须写英文冒号 :。', '条件体必须缩进，否则报 IndentationError。', 'else 与 if 对齐，且同样以冒号结尾。'],
	    },
	    {
	        id: 'compare', title: '比较运算符', group: '流程',
	        brief: '比较运算符对两个值做比较，结果是一个布尔值（True / False）。',
	        example: '== 等于    != 不等于\n< 小于    > 大于\n<= 小于等于  >= 大于等于',
	        pitfalls: ['判断相等用 ==，单个 = 是赋值。', '注意边界值：温度恰好 40 时，>= 会保留、> 不会。', '比较结果可直接用于 if 条件。'],
	    },
	    {
	        id: 'for', title: 'for 循环：遍历列表', group: '流程',
	        brief: 'for 循环依次取出列表中的每个元素，执行一次循环体。',
	        example: 'records = ["A", "B", "C"]\nfor record in records:\n    print(record)',
	        pitfalls: ['冒号 : 之后循环体必须缩进。', '循环体不缩进会报 IndentationError。', '循环变量（record）只在循环体内部使用。'],
	    },
	    {
	        id: 'list', title: '列表：有序的数据集合', group: '数据',
	        brief: '列表用方括号定义，可以存放多个数据，支持增删改查。',
	        example: 'alerts = []\nalerts.append(41)  # 追加元素\nprint(alerts[0])   # 取出第 1 个元素（索引从 0 开始）',
	        pitfalls: ['索引从 0 开始：alerts[0] 是第一个元素。', 'append() 在列表末尾追加元素。', 'len(alerts) 获取元素个数。'],
	    },
	    {
	        id: 'indent', title: '缩进：代码块的层级', group: '基础',
	        brief: 'Python 用行首空格表示代码块层级。同一代码块的缩进量必须一致。',
	        example: 'for x in items:\n    print(x)   # 缩进 4 个空格',
	        pitfalls: ['缩进不一致会报 IndentationError。', '不要混用 Tab 与空格。', '官方建议统一使用 4 个空格。'],
	    },
	    {
	        id: 'while', title: 'while：条件循环', group: '流程',
	        brief: 'while 在条件为真时不断重复执行循环体，直到条件为假。适合需要自己控制次数的场景。',
	        example: 'count = 0\nitems = ["A", "B", "C"]\nwhile count < len(items):\n    print(items[count])\n    count = count + 1',
	        pitfalls: ['循环体里必须有让条件最终变假的操作（如 count += 1），否则死循环。', '用 len(列表) 而不是硬编码数字，列表变长也不会出错。', '遍历列表时 for 更简洁；while 适合「满足条件才继续」的逻辑。'],
	    },
	    {
	        id: 'elif', title: 'elif：多分支判断', group: '流程',
	        brief: 'if ... elif ... else ... 从上到下依次判断，命中一个分支后即结束。适合多分类逻辑。',
	        example: 'if tag == "ok":\n    print("PASS")\nelif tag == "warn":\n    print("WARN")\nelse:\n    print("FAIL")',
	        pitfalls: ['elif 必须跟在 if 之后，且与 if 对齐缩进。', '命中一个分支后，后面的分支不再执行。', '可以有任意多个 elif，else 只能有一个（可以省略）。'],
	    },
	    {
	        id: 'logic', title: '布尔逻辑：and / or / not', group: '流程',
	        brief: '用逻辑运算符组合多个条件：and 两边都为真才为真；or 一边为真即为真；not 取反。',
	        example: 'if temp > 90 and pressure > 150:\n    print("OVERLOAD")\n    \nif not online:\n    print("OFFLINE")',
	        pitfalls: ['and 与 or 要分清：报警逻辑用错会造成误报或漏报。', '优先级：not 高于 and，and 高于 or；不放心就加括号。', 'not 常用于反转判断，让代码语义更直白。'],
	    },
	    {
	        id: 'dict', title: '字典：键值对数据', group: '数据',
	        brief: '字典用键存取数据，像一本"编号 → 记录"的登记簿。',
	        example: 'records = {"sensor": "S-01", "relay": "R-02"}\nprint(records["sensor"])        # S-01\nprint(records.get("valve", "?")) # 键缺失返回默认值',
	        pitfalls: ['直接 records["不存在的键"] 会抛 KeyError。', '用 get(键, 默认值) 安全读取。', 'for key in dict 遍历的是键；要拿值用 dict[key] 或用 items()。'],
	    },
	    {
	        id: 'try', title: 'try/except：异常处理', group: '流程',
	        brief: '让程序在出错时优雅降级而不是崩溃：把可能出错的语句放进 try，出错后交给 except 处理。',
	        example: 'def parse(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0',
	        pitfalls: ['try 块里出错的那一行之后的语句不会执行。', 'except 后面写上异常类型（如 ValueError）更精确，避免吞掉真正的 bug。', '一条坏数据不应拖垮整个循环——把 try 放在循环体里做隔离。'],
	    },
	    {
	        id: 'parameter', title: '参数：函数的数据入口', group: '函数',
	        brief: '函数通过参数接收外部数据。调用时按位置传入，参数个数与定义一致。',
	        example: 'def greet(name, title):\n    return title + " " + name\n\nprint(greet("R-07", "REPAIRER"))',
	        pitfalls: ['位置参数按顺序绑定：第一个实参给第一个形参，顺序反了会静默出错（不报错！）。', '调用时参数个数要与定义匹配，不然 TypeError。', '只写函数名（不带括号）不会执行函数——那是函数对象本身。'],
	    },
	    {
	        id: 'return', title: 'return：函数的返回值', group: '函数',
	        brief: 'def 定义函数，return 把计算结果交还给调用者。',
	        example: 'def double(n):\n    return n * 2\n\nprint(double(21))   # 42',
	        pitfalls: ['return 语句之后的代码不会执行。', '没有 return 的函数默认返回 None。', '调用函数时参数个数要与定义一致。'],
	    },
	];
	const knowledgeById = (id) => KNOWLEDGE.find(k => k.id === id);

	const BUG_CODEX = [
	    { id: 'syntax', error: 'SyntaxError', title: '语法错误', desc: '条件末尾漏冒号、括号不闭合等。', fix: '检查 if/for 行末的英文冒号与括号配对。', levelIds: ['1-1'], chapter: 1 },
	    { id: 'indent', error: 'IndentationError', title: '缩进错误', desc: '代码块没有缩进，或同一块缩进不一致。', fix: '循环体 / 分支体统一缩进 4 个空格。', levelIds: ['1-5'], chapter: 1 },
	    { id: 'string', error: 'SyntaxError', title: '字符串未闭合', desc: '引号没成对，字符串在中途断裂。', fix: '字符串两端都要有英文引号。', levelIds: ['1-2'], chapter: 1 },
	    { id: 'name', error: 'NameError', title: '名字未定义', desc: '使用了没有定义、或拼写不一致的变量名。', fix: '对比定义处与使用处的拼写和大小写。', levelIds: ['1-3'], chapter: 1 },
	    { id: 'compare', error: '逻辑错误', title: '比较写反 / 边界错误', desc: '用 < 代替 >=、用 = 代替 ==，边界值被误判。', fix: '先想清楚「包含边界」还是「不包含」。', levelIds: ['1-4', '2-2'], chapter: 1 },
	    { id: 'logic', error: '逻辑错误', title: 'and / or 用错', desc: '该同时满足的地方用了 or，导致误报。', fix: '同时成立用 and，任一成立用 or。', levelIds: ['2-3', '2-4'], chapter: 2 },
	    { id: 'branch', error: '逻辑错误', title: '分支写错', desc: 'elif 分支返回值错误，整类数据被误判。', fix: '逐条核对 if / elif / else 的输出。', levelIds: ['2-5'], chapter: 2 },
	    { id: 'index', error: 'IndexError', title: '索引越界', desc: '列表索引超出范围，或忘了从 0 开始。', fix: '索引从 0 起，最大是 len(list)-1。', levelIds: ['3-1'], chapter: 3 },
	    { id: 'loop', error: '逻辑错误', title: '循环边界', desc: 'while 条件写死数字，最后一两项被漏掉。', fix: '用 len(items) 而不是硬编码次数。', levelIds: ['3-3'], chapter: 3 },
	    { id: 'type', error: 'TypeError', title: '类型错误', desc: '把方法当成值，或对字符串做算术。', fix: '调用方法要加括号：name.upper()。', levelIds: ['4-4'], chapter: 4 },
	    { id: 'key', error: 'KeyError', title: '键不存在', desc: '字典里没有这个键，直接取值会崩溃。', fix: '用 get(key, 默认值) 安全读取。', levelIds: ['5-1'], chapter: 5 },
	    { id: 'value', error: 'ValueError', title: '转换失败', desc: 'int("abc") 之类的转换抛异常。', fix: '用 try/except 兜底，失败时给默认值。', levelIds: ['5-2'], chapter: 5 },
	];
	const bugById = (id) => BUG_CODEX.find(b => b.id === id);
	/** 按 Python 异常类型匹配图鉴条目（用于提交失败时记账） */
	function codexForError(errType) {
	    if (!errType)
	        return undefined;
	    const exact = BUG_CODEX.find(b => b.error === errType);
	    if (exact)
	        return exact;
	    if (errType.includes('Indentation'))
	        return bugById('indent');
	    if (errType.includes('Syntax'))
	        return bugById('syntax');
	    if (errType.includes('Name'))
	        return bugById('name');
	    if (errType.includes('Index'))
	        return bugById('index');
	    if (errType.includes('Key'))
	        return bugById('key');
	    if (errType.includes('Type'))
	        return bugById('type');
	    if (errType.includes('Value'))
	        return bugById('value');
	    return undefined;
	}
	/** 章节里的常见错误（按遭遇次数排序） */
	function topBugsForChapter(chapter, log, limit = 3) {
	    if (!log)
	        return [];
	    return BUG_CODEX
	        .filter(b => b.chapter === chapter && log[b.id])
	        .sort((a, b) => (log[b.id]?.count || 0) - (log[a.id]?.count || 0))
	        .slice(0, limit);
	}

	function ChallengePage() {
	    const g = useGame();
	    const levelId = g.player.progress.currentLevelId;
	    const level = levelId ? levelById(levelId) : undefined;
	    const player = g.player;
	    const respawnTick = g.respawnTick;
	    const [code, setCode] = reactExports.useState(level?.initialCode ?? '');
	    const [term, setTerm] = reactExports.useState([]);
	    const [running, setRunning] = reactExports.useState(false);
	    const [submitting, setSubmitting] = reactExports.useState(false);
	    const [errorLine, setErrorLine] = reactExports.useState(null);
	    const [miraMsg, setMiraMsg] = reactExports.useState('任务简报已同步。仔细阅读左侧的故障现象，然后开始修复。');
	    const [miraTag, setMiraTag] = reactExports.useState('MIRA');
	    const [verdict, setVerdict] = reactExports.useState(null);
	    const [briefOpen, setBriefOpen] = reactExports.useState(false);
	    const [done, setDone] = reactExports.useState(null);
	    const [resetArmed, setResetArmed] = reactExports.useState(false);
	    const [pyState, setPyState] = reactExports.useState({ status: 'idle', phase: '' });
	    const [musicOn, setMusicOn] = reactExports.useState(isMusicOn());
	    const [dbg, setDbg] = reactExports.useState(null);
	    const [debugLine, setDebugLine] = reactExports.useState(null);
	    const [loadElapsed, setLoadElapsed] = reactExports.useState(0);
	    const [scanLines, setScanLines] = reactExports.useState([]);
	    const historyRef = reactExports.useRef([]);
	    const locked = g.event.kind !== 'none';
	    reactExports.useEffect(() => {
	        if (!level) {
	            g.nav('map');
	            return;
	        }
	        setCode(level.initialCode);
	        setTerm([]);
	        setErrorLine(null);
	        setVerdict(null);
	        setDone(null);
	        setResetArmed(false);
	        setBriefOpen(!player.progress.storySeen[level.id]);
	        setMiraMsg('任务简报已同步。仔细阅读左侧的故障现象，然后开始修复。');
	        setMiraTag('MIRA');
	        setDbg(null);
	        setDebugLine(null);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [levelId, respawnTick, level?.id]);
	    reactExports.useEffect(() => {
	        if (levelId && !level)
	            g.nav('map');
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [levelId, level]);
	    reactExports.useEffect(() => {
	        const un = onPyStatus(s => setPyState(s));
	        return un;
	    }, []);
	    // 进入关卡即开始加载 Python 引擎（利用读题时间）
	    reactExports.useEffect(() => {
	        warmUp();
	    }, []);
	    // 引擎加载计时（让等待变成可见的进度，而不是"卡住"）
	    reactExports.useEffect(() => {
	        if (pyState.status !== 'loading') {
	            setLoadElapsed(0);
	            return;
	        }
	        const t0 = Date.now();
	        const id = window.setInterval(() => setLoadElapsed(Math.round((Date.now() - t0) / 1000)), 400);
	        return () => window.clearInterval(id);
	    }, [pyState.status]);
	    reactExports.useEffect(() => {
	        // 重生后 MIRA 提示
	        if (respawnTick > 0 && level) {
	            setMiraMsg(miraOnRespawn());
	            setMiraTag('MIRA');
	        }
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [respawnTick]);
	    const pushLines = reactExports.useCallback((lines) => {
	        setTerm(t => [...t.slice(-260), ...lines]);
	    }, []);
	    const outputLines = reactExports.useCallback((r) => {
	        const ls = [];
	        const stdout = filterMarkerLines(r.stdout ?? '');
	        if (stdout.trim() !== '') {
	            ls.push({ kind: 'out', text: stdout.replace(/\n$/, '') });
	        }
	        if (r.stderr && r.stderr.trim() !== '')
	            ls.push({ kind: 'warn', text: r.stderr.replace(/\n$/, '') });
	        if (r.timedOut)
	            ls.push({ kind: 'err', text: '执行超时：程序运行超过安全时限，已被强制终止（请检查死循环）。' });
	        if (r.error)
	            ls.push({ kind: 'err', text: r.error.type + ': ' + r.error.message });
	        return ls;
	    }, []);
	    if (!level)
	        return null;
	    /** 记录一次代码快照（回滚道具用） */
	    const snapshot = reactExports.useCallback((current) => {
	        historyRef.current.push(current);
	        if (historyRef.current.length > 12)
	            historyRef.current.shift();
	    }, []);
	    /** 代码扫描器：标出与初始版本不同的行（只定位，不给答案） */
	    const useScan = () => {
	        if (!level)
	            return;
	        if (!g.consumeItem('scan')) {
	            g.toast('warn', '扫描器库存不足——可在兑换中心补充。');
	            play('deny');
	            return;
	        }
	        const base = level.initialCode.split('\n');
	        const cur = code.split('\n');
	        const changed = [];
	        cur.forEach((l, i) => { if ((base[i] ?? '') !== l && l.trim())
	            changed.push(i + 1); });
	        const fallback = cur.map((l, i) => (l.trim() && !l.trim().startsWith('#') ? i + 1 : 0)).filter(Boolean);
	        const picked = (changed.length ? changed : fallback).slice(0, 3);
	        setScanLines(picked);
	        setMiraTag('扫描器');
	        setMiraMsg(picked.length
	            ? '扫描完成：已高亮第 ' + picked.join('、') + ' 行。这些是你改动过 / 最需要复核的区域——结论要你自己判断。'
	            : '扫描完成：没有发现可定位的行。先写几行代码再试试。');
	        play('unlock');
	    };
	    /** 数据回滚模块：恢复到上一个代码快照 */
	    const useRollback = () => {
	        if (!g.consumeItem('rollback')) {
	            g.toast('warn', '回滚模块库存不足——可在兑换中心补充。');
	            play('deny');
	            return;
	        }
	        const prev = historyRef.current.pop();
	        if (prev === undefined) {
	            g.toast('warn', '没有可回滚的快照。');
	            play('deny');
	            return;
	        }
	        setCode(prev);
	        setScanLines([]);
	        setVerdict(null);
	        setErrorLine(null);
	        pushLines([{ kind: 'sys', text: '数据回滚：已恢复到上一次代码快照。' }]);
	        play('click');
	    };
	    const run = async () => {
	        if (!level || running || submitting || locked)
	            return;
	        const ck = checkUserCode(code);
	        if (!ck.allowed) {
	            pushLines([
	                { kind: 'cmd', text: 'python task.py' },
	                { kind: 'err', text: '安全策略阻止：' + ck.reason },
	            ]);
	            setMiraTag('安全警告');
	            setMiraMsg('这条代码被维修终端的安全策略拦下了。' + ck.reason);
	            play('deny');
	            return;
	        }
	        snapshot(code);
	        setRunning(true);
	        setVerdict(null);
	        setErrorLine(null);
	        setScanLines([]);
	        pushLines([{ kind: 'cmd', text: 'python task.py' }]);
	        if (pyState.status !== 'ready') {
	            pushLines([{ kind: 'sys', text: 'Python 引擎初始化中（本地加载，通常 2~5 秒）——代码已排队，就绪后自动执行。' }]);
	        }
	        pushLines([{ kind: 'sys', text: '正在运行……' }]);
	        play('run');
	        const r = await runPython(code, { timeoutMs: 5000 });
	        setRunning(false);
	        pushLines([{ kind: 'sys', text: r.ok ? '进程正常退出（exit 0）' : '进程异常结束' }]);
	        if (!r.ok) {
	            pushLines(outputLines(r));
	            if (r.error) {
	                setErrorLine(r.error.line && r.error.line <= code.split('\n').length ? r.error.line : null);
	                setMiraTag('排错助手');
	                setMiraMsg('终端报错了。' + miraOnError(r.error.type));
	            }
	        }
	        else {
	            pushLines(outputLines(r));
	        }
	    };
	    const submit = async () => {
	        if (!level || running || submitting || locked)
	            return;
	        const ck = checkUserCode(code);
	        if (!ck.allowed) {
	            pushLines([
	                { kind: 'cmd', text: 'python task.py --submit' },
	                { kind: 'err', text: '安全策略阻止：' + ck.reason },
	            ]);
	            setMiraTag('安全警告');
	            setMiraMsg('提交被拦截。' + ck.reason);
	            play('deny');
	            return;
	        }
	        snapshot(code);
	        setSubmitting(true);
	        setVerdict(null);
	        setErrorLine(null);
	        setScanLines([]);
	        play('run');
	        const codeLines = code.split('\n').length;
	        const combined = level.judge.judgeKind === 'python'
	            ? combineWithHarness(code, buildHarness(level.judge.pythonChecks || []))
	            : code;
	        pushLines([{ kind: 'cmd', text: 'python task.py --submit （正式判题）' }]);
	        const r = await runPython(combined, { timeoutMs: 5000 });
	        setSubmitting(false);
	        if (r.timedOut) {
	            pushLines(outputLines(r));
	            setVerdict({ passed: false, checks: [], timedOut: true });
	            setMiraTag('系统警告');
	            setMiraMsg('判题超时。提交已计为一次失败——检查代码里是否有死循环。');
	            g.recordFail(level.id);
	            play('error');
	            return;
	        }
	        if (!r.ok) {
	            pushLines(outputLines(r));
	            const errLine = r.error && r.error.line && r.error.line <= codeLines ? r.error.line : null;
	            setErrorLine(errLine);
	            setVerdict({ passed: false, checks: [], error: r.error });
	            setMiraTag('排错助手');
	            setMiraMsg('程序没能通过判题（执行出错）。' + miraOnError(r.error?.type));
	            // 执行错误同样计入失败提交
	            const fp = g.recordFail(level.id);
	            if (!fp.triggered) {
	                const m = miraOnFail(fp.n, fp.tolerance);
	                setMiraTag(m.tone === 'danger' ? '系统警告' : 'MIRA');
	                setMiraMsg(String(m.text));
	                if (m.tone === 'danger')
	                    play('warning');
	            }
	            play('error');
	            return;
	        }
	        const v = judgeRun(level.judge, r);
	        const stdout = filterMarkerLines(r.stdout);
	        if (v.passed) {
	            pushLines([
	                { kind: 'out', text: stdout.replace(/\n$/, '') || '(无输出)' },
	                { kind: 'sys', text: '── 自动判题结果 ──' },
	                ...(v.checks.map(c => ({ kind: 'ok', text: '✓ ' + c.name }))),
	                { kind: 'ok', text: '★★★★ 全部测试通过，修复完成！' },
	            ]);
	            const payload = g.completeLevel(level.id);
	            setVerdict({ passed: true, checks: v.checks });
	            if (payload) {
	                // 「下一个修复端」：同服务器下一关 → 否则下一个已开放服务器的首个未通关关卡
	                const progress = g.player.progress;
	                const doneSet = new Set([...progress.completedLevels, level.id]);
	                const siblings = levelsOfServer(level.serverId);
	                const idx = siblings.findIndex(s => s.id === level.id);
	                let target = null;
	                if (idx >= 0 && idx < siblings.length - 1) {
	                    target = { id: siblings[idx + 1].id, label: '下一关' };
	                }
	                else {
	                    const chapterDone = (sid) => {
	                        const lv = levelsOfServer(sid);
	                        return lv.length > 0 && lv.every(l => doneSet.has(l.id));
	                    };
	                    const prevOf = { logs: 'syntax', storage: 'logs', factory: 'storage', diag: 'factory', core: 'diag' };
	                    const available = (sid) => {
	                        if (sid === 'training')
	                            return true;
	                        if (sid === 'syntax')
	                            return doneSet.has('tut-1');
	                        const prev = prevOf[sid];
	                        return prev ? chapterDone(prev) : false;
	                    };
	                    const order = ['training', 'syntax', 'logs', 'storage', 'factory', 'diag', 'core'];
	                    const cur = order.indexOf(level.serverId);
	                    for (let i = cur + 1; i < order.length; i++) {
	                        const sid = order[i];
	                        if (!available(sid))
	                            continue;
	                        const lv = levelsOfServer(sid).find(l => !doneSet.has(l.id));
	                        if (lv) {
	                            target = { id: lv.id, label: '前往' + (serverById(sid)?.name || '') };
	                            break;
	                        }
	                    }
	                }
	                setDone({ payload, summary: level.summary, nextId: target ? target.id : null, nextLabel: target ? target.label : '' });
	            }
	        }
	        else {
	            pushLines([
	                { kind: 'out', text: stdout.replace(/\n$/, '') || '(无输出)' },
	                { kind: 'sys', text: '── 自动判题结果 ──' },
	                ...(v.checks.length ? v.checks.map(c => ({ kind: (c.ok ? 'ok' : 'err'), text: (c.ok ? '✓ ' : '✗ ') + c.name + (c.detail ? ' —— ' + c.detail : '') })) : []),
	                { kind: 'err', text: '测试未全部通过。请继续修复。' },
	            ]);
	            setVerdict(v);
	            setMiraTag('判题反馈');
	            g.recordBug(codexForError(r.error?.type)?.id || 'logic');
	            const fp = g.recordFail(level.id);
	            if (fp.triggered) {
	                setMiraTag('紧急警告');
	                setMiraMsg('纠错者已锁定你的数据坐标！执行紧急防御协议！');
	                play('alarm');
	            }
	            else {
	                const m = miraOnFail(fp.n, fp.tolerance);
	                setMiraTag(m.tone === 'danger' ? '系统警告' : 'MIRA');
	                setMiraMsg(String(m.text));
	                if (m.tone === 'danger')
	                    play('warning');
	                else
	                    play('error');
	            }
	        }
	    };
	    const askHint = () => {
	        if (!level)
	            return;
	        const used = player.progress.hintLevels[level.id] || 0;
	        const r = miraLevelHint(level, used);
	        setMiraTag('提示 LEVEL ' + r.level);
	        setMiraMsg(r.text);
	        g.hintUsed(level.id);
	        play('click');
	    };
	    const resetCode = () => {
	        if (resetArmed) {
	            snapshot(code);
	            setCode(level.initialCode);
	            setScanLines([]);
	            setResetArmed(false);
	            setVerdict(null);
	            setErrorLine(null);
	            pushLines([{ kind: 'sys', text: '代码已恢复为初始故障版本。' }]);
	            play('click');
	        }
	        else {
	            setResetArmed(true);
	            window.setTimeout(() => setResetArmed(false), 3000);
	        }
	    };
	    /** 进入单步调试：执行一次带轨迹采集的运行，然后逐步回放 */
	    const startDebug = async () => {
	        if (!level || running || submitting || locked)
	            return;
	        const ck = checkUserCode(code);
	        if (!ck.allowed) {
	            pushLines([{ kind: 'cmd', text: 'python task.py --debug' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
	            setMiraTag('安全警告');
	            setMiraMsg('调试模式同样受安全策略限制。' + ck.reason);
	            play('deny');
	            return;
	        }
	        setRunning(true);
	        setDbg(null);
	        setDebugLine(null);
	        setVerdict(null);
	        setErrorLine(null);
	        pushLines([{ kind: 'cmd', text: 'python task.py --debug' }, { kind: 'sys', text: '正在采集执行轨迹（逐行回放模式）…' }]);
	        play('run');
	        const r = await runPython(code, { timeoutMs: 5000, debug: true });
	        setRunning(false);
	        if (r.timedOut) {
	            pushLines([{ kind: 'err', text: '调试采集超时：程序运行超过安全时限，已被强制终止（检查死循环）。' }]);
	            setMiraTag('系统警告');
	            setMiraMsg('调试超时。你的程序可能存在死循环——检查循环条件是否最终会变成假。');
	            play('error');
	            return;
	        }
	        const steps = (r.trace || []).filter(t => t.line >= 0);
	        if (steps.length === 0) {
	            pushLines([{ kind: 'warn', text: '未采集到执行轨迹：代码可能是空的，或只有注释/未执行的部分。' }]);
	            return;
	        }
	        // 初始：停在第一步
	        const first = steps[0];
	        const firstOut = steps.slice(0, 1).map(s => s.out || '').join('');
	        if (firstOut)
	            pushLines([{ kind: 'out', text: firstOut.replace(/\n$/, '') }]);
	        pushLines([{ kind: 'sys', text: '调试就绪：共 ' + steps.length + ' 步。用「下一步」逐行查看变量变化。' }]);
	        setDbg({ steps, idx: 0, done: false, failed: !r.ok });
	        setDebugLine(first.line > 0 ? first.line : null);
	        if (!r.ok && r.error) {
	            setMiraTag('排错助手');
	            setMiraMsg('程序在第 ' + (r.error.line ?? '?') + ' 行附近出错。单步回放已保留到崩溃前的轨迹——' + miraOnError(r.error.type));
	        }
	        else {
	            setMiraTag('调试模式');
	            setMiraMsg('轨迹已采集。右侧「变量监视器」会随每一步更新——注意观察变量在循环中如何变化。');
	        }
	    };
	    /** 调试：推进到指定步（输出该区间产生的输出） */
	    const applyDbgStep = (ni) => {
	        if (!dbg)
	            return;
	        const idx = Math.max(0, Math.min(ni, dbg.steps.length - 1));
	        const step = dbg.steps[idx];
	        if (idx > dbg.idx) {
	            const chunk = dbg.steps.slice(dbg.idx + 1, idx + 1).map(s => s.out || '').join('');
	            if (chunk)
	                pushLines([{ kind: 'out', text: chunk.replace(/\n$/, '') }]);
	        }
	        setDebugLine(step.line > 0 ? step.line : null);
	        const isLast = idx >= dbg.steps.length - 1;
	        if (isLast) {
	            pushLines([{ kind: 'sys', text: '调试轨迹结束（共 ' + dbg.steps.length + ' 步）。' + (dbg.failed ? '程序在执行中出错。' : '') }]);
	        }
	        setDbg({ ...dbg, idx, done: isLast });
	    };
	    const dbgNext = () => {
	        if (!dbg || dbg.done)
	            return;
	        play('click');
	        applyDbgStep(dbg.idx + 1);
	    };
	    const dbgToEnd = () => {
	        if (!dbg)
	            return;
	        play('click');
	        applyDbgStep(dbg.steps.length - 1);
	    };
	    const dbgExit = () => {
	        setDbg(null);
	        setDebugLine(null);
	        pushLines([{ kind: 'sys', text: '已退出调试模式。' }]);
	        play('click');
	    };
	    const hintUsed = player.progress.hintLevels[level.id] || 0;
	    const stars = player.progress.stars[level.id] || 0;
	    const server = serverById(level.serverId);
	    const knowledgeCards = level.knowledge.map(knowledgeById).filter(Boolean);
	    return (jsxRuntimeExports.jsxs("div", { className: "page page-anim", style: { padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", style: { marginBottom: 8 }, children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", disabled: locked || running || submitting, onClick: () => { play('click'); g.nav('map'); }, children: "\u25C0 \u670D\u52A1\u5668\u5730\u56FE" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: level.title }), jsxRuntimeExports.jsxs("div", { className: "hud-sub", children: [server ? server.name + ' · ' : '', "\u4EFB\u52A1\u4EE3\u53F7 ", level.codename] })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsxs("div", { className: 'py-status ' + pyState.status, title: pyState.phase, children: [jsxRuntimeExports.jsx("span", { className: "pd" }), pyState.status === 'ready'
	                                ? 'PY ENGINE READY'
	                                : pyState.status === 'loading'
	                                    ? '引擎加载中 ' + loadElapsed + 's · ' + (pyState.phase || '准备中')
	                                    : pyState.status === 'error' ? '引擎错误' : 'ADAPTER STANDBY'] }), jsxRuntimeExports.jsx("span", { className: "hud-chip", children: stars > 0 ? '★'.repeat(stars) : '未通关' }), jsxRuntimeExports.jsxs("span", { className: "hud-chip cyan", children: ["\u5BB9\u9519 ", g.tolerance] }), jsxRuntimeExports.jsxs("span", { className: "hud-chip", children: ["\u610F\u8BC6 ", player.consciousness, "%"] }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { g.toggleMusic(); setMusicOn(isMusicOn()); }, children: musicOn ? '♪ 音乐开' : '♪ 音乐关' })] }), jsxRuntimeExports.jsxs("div", { className: "chlg-grid", style: { flex: 1, minHeight: 0 }, children: [jsxRuntimeExports.jsxs("div", { className: "chlg-left", style: { overflowY: 'auto' }, children: [jsxRuntimeExports.jsxs("div", { className: "panel task-block", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u4EFB\u52A1\u7B80\u62A5", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: level.codename })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsx("div", { className: "tb-label", children: "\u6545\u969C\u73B0\u8C61" }), jsxRuntimeExports.jsx("div", { className: "tb-text", children: level.fault })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsx("div", { className: "tb-label", children: "\u4EFB\u52A1\u76EE\u6807" }), jsxRuntimeExports.jsx("div", { className: "tb-text", children: level.goal })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsx("div", { className: "tb-label", children: "\u6B63\u786E\u884C\u4E3A" }), jsxRuntimeExports.jsx("div", { className: "tb-text warn", children: level.behavior })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u6545\u969C\u65E5\u5FD7" }), jsxRuntimeExports.jsx("div", { style: { fontFamily: 'Consolas, monospace', fontSize: 12.5, color: '#FF9BA2', lineHeight: 1.8, background: 'rgba(255,91,100,0.06)', border: '1px solid rgba(255,91,100,0.2)', borderRadius: 8, padding: '9px 11px', whiteSpace: 'pre-wrap' }, children: level.faultLog })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u77E5\u8BC6\u70B9" }), jsxRuntimeExports.jsx("div", { children: knowledgeCards.map(k => (jsxRuntimeExports.jsx("span", { className: "chip cyan know-chip", children: k.title }, k.id))) })] }), level.varsNote && level.varsNote.length > 0 && (jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u53D8\u91CF\u76D1\u89C6\u5668", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: "STATIC MODE" })] }), level.varsNote.map(v => (jsxRuntimeExports.jsxs("div", { className: "pf-kv", style: { fontSize: 12.5 }, children: [jsxRuntimeExports.jsx("span", { className: "k", children: v.name }), jsxRuntimeExports.jsx("span", { className: "v", style: { textAlign: 'right' }, children: v.desc })] }, v.name)))] }))] }), jsxRuntimeExports.jsxs("div", { className: "chlg-center", children: [jsxRuntimeExports.jsxs("div", { className: "toolbar", children: [jsxRuntimeExports.jsxs("button", { className: "nxbtn", disabled: running || submitting || locked, onClick: run, children: [running ? jsxRuntimeExports.jsx("span", { className: "spinner" }) : '▶', " \u8FD0\u884C\u4EE3\u7801", jsxRuntimeExports.jsx("span", { className: "hint-chip", style: { marginLeft: 8, fontSize: 11, color: '#4A6E85' }, children: "Ctrl+Enter" })] }), jsxRuntimeExports.jsx("button", { className: "nxbtn primary", disabled: running || submitting || locked, onClick: submit, children: "\u63D0\u4EA4\u4FEE\u590D \u23CE" }), jsxRuntimeExports.jsx("button", { className: "nxbtn ghost", disabled: running || submitting || locked, onClick: resetCode, children: resetArmed ? '确认重置？' : '重置代码' }), jsxRuntimeExports.jsx("button", { className: "nxbtn warn", disabled: running || submitting || locked || !!dbg, onClick: startDebug, title: "\u91C7\u96C6\u6267\u884C\u8F68\u8FF9\u5E76\u9010\u884C\u56DE\u653E\uFF0C\u53F3\u4FA7\u53D8\u91CF\u76D1\u89C6\u5668\u5B9E\u65F6\u66F4\u65B0", children: "\uD83D\uDC1E \u5355\u6B65\u8C03\u8BD5" }), jsxRuntimeExports.jsxs("button", { className: "nxbtn ghost small", disabled: running || submitting || locked, onClick: useScan, title: "\u6D88\u8017 1 \u4E2A\u626B\u63CF\u5668\uFF1A\u9AD8\u4EAE\u53EF\u7591\u884C\uFF0C\u53EA\u5B9A\u4F4D\u4E0D\u7ED9\u7B54\u6848", children: ["\u2316 \u626B\u63CF \u00D7", player.rewards?.items?.scan || 0] }), jsxRuntimeExports.jsxs("button", { className: "nxbtn ghost small", disabled: running || submitting || locked, onClick: useRollback, title: "\u6D88\u8017 1 \u4E2A\u56DE\u6EDA\u6A21\u5757\uFF1A\u6062\u590D\u4E0A\u4E00\u6B21\u4EE3\u7801\u5FEB\u7167", children: ["\u21BA \u56DE\u6EDA \u00D7", player.rewards?.items?.rollback || 0] }), jsxRuntimeExports.jsx("div", { className: "sp" }), jsxRuntimeExports.jsx("span", { className: "chip", children: "\u8FD0\u884C\u4E0D\u589E\u52A0\u5931\u8D25\u6B21\u6570" }), locked && jsxRuntimeExports.jsx("span", { className: "chip red warn-flash", children: "\u7D27\u6025\u4E8B\u4EF6\u8FDB\u884C\u4E2D\u2014\u2014\u4E3B\u7EBF\u63D0\u4EA4\u5DF2\u9501\u5B9A" })] }), jsxRuntimeExports.jsx("div", { className: "code-frame", style: { flex: 1 }, children: jsxRuntimeExports.jsx(CodeEditor, { value: code, onChange: setCode, errorLine: errorLine, debugLine: debugLine, markLines: scanLines, onRun: run, readOnly: running || submitting, fontSize: player.settings.animLevel === 'low' ? 15 : 15.5 }) }), dbg && (jsxRuntimeExports.jsxs("div", { className: "dbg-bar", children: [jsxRuntimeExports.jsxs("span", { className: "chip orange", children: ["\uD83D\uDC1E \u5355\u6B65\u8C03\u8BD5 \u00B7 \u7B2C ", dbg.idx + 1, " / ", dbg.steps.length, " \u6B65 \u00B7 \u7B2C ", debugLine ?? '?', " \u884C"] }), jsxRuntimeExports.jsx("button", { className: "nxbtn small", onClick: dbgNext, disabled: dbg.done, children: "\u25B6 \u4E0B\u4E00\u6B65" }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: dbgToEnd, disabled: dbg.done, children: "\u23ED \u8FD0\u884C\u5230\u7ED3\u675F" }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: dbgExit, children: "\u25FC \u9000\u51FA\u8C03\u8BD5" }), jsxRuntimeExports.jsx("div", { className: "sp" }), jsxRuntimeExports.jsx("span", { className: "hint-note", children: "\u56DE\u653E\u6A21\u5F0F\uFF1A\u8F68\u8FF9\u5DF2\u5728\u540E\u53F0\u91C7\u96C6\u5B8C\u6BD5\uFF0C\u9010\u6B65\u67E5\u770B\u6BCF\u884C\u7684\u53D8\u91CF\u4E0E\u8F93\u51FA\u3002" })] })), verdict && (jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: 'result-banner ' + (verdict.passed ? 'ok' : 'fail'), children: verdict.passed ? '✓ 修复成功——全部测试通过' : verdict.timedOut ? '✗ 判题超时（已强制终止）' : verdict.error ? '✗ 执行出错：' + verdict.error.type : '✗ 测试未全部通过' }), verdict.error && jsxRuntimeExports.jsx("div", { style: { fontFamily: 'Consolas, monospace', fontSize: 12.5, color: '#FF9BA2', marginTop: 6, whiteSpace: 'pre-wrap' }, children: verdict.error.message }), !verdict.error && verdict.checks.length > 0 && (jsxRuntimeExports.jsx("div", { className: "checks-list", children: verdict.checks.map((c, i) => (jsxRuntimeExports.jsxs("div", { className: 'ck ' + (c.ok ? 'ok' : 'fail'), children: [c.ok ? '✓' : '✗', " ", c.name] }, i))) }))] }))] }), jsxRuntimeExports.jsxs("div", { className: "chlg-right", style: { overflowY: 'auto' }, children: [jsxRuntimeExports.jsx(MiraPanel, { message: miraMsg, msgTag: miraTag, hintUsed: hintUsed, onAskHint: locked ? undefined : askHint }), dbg && (jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u53D8\u91CF\u76D1\u89C6\u5668", jsxRuntimeExports.jsxs("span", { className: "panel-tag", children: ["DEBUG \u884C ", debugLine ?? '?'] })] }), jsxRuntimeExports.jsx(DebugVars, { vars: dbg.steps[Math.min(dbg.idx, dbg.steps.length - 1)].vars }), jsxRuntimeExports.jsxs("div", { className: "hint-note", style: { marginTop: 8 }, children: ["\u7B2C ", dbg.idx + 1, " / ", dbg.steps.length, " \u6B65 \u00B7 \u503C\u4E3A\u53D8\u91CF\u7684 repr\uFF08\u622A\u65AD 80 \u5B57\uFF09"] })] })), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u751F\u547D\u4F53\u5F81" }), jsxRuntimeExports.jsx(PlayerStatus, { showTolerance: true })] })] })] }), jsxRuntimeExports.jsx("div", { className: "chlg-bottom", children: jsxRuntimeExports.jsx(Terminal, { lines: term, maxHeight: 210, title: '维修终端 · ' + level.codename }) }), briefOpen && (jsxRuntimeExports.jsx(DialogSystem, { nodes: [
	                    { id: level.id + '-b1', speaker: 'MIRA', kind: 'mira', text: '任务简报：「' + level.title + '」\n' + level.fault },
	                    { id: level.id + '-b2', speaker: 'NEXUS 系统', kind: 'system', text: '故障日志：' + level.faultLog + '\n任务目标：' + level.goal + '\n\n操作指引：在中间编辑器里改代码 → 点「运行代码」预览结果（不计数）→ 点「提交修复」正式判题' },
	                ], speedMs: player.settings.typewriterMs, animEnabled: player.settings.animations, frameTitle: level.title + ' · 任务简报', onSeen: id => g.markStory(id), onDone: () => { setBriefOpen(false); g.markStory(level.id); g.toast('info', '提示：点击「MIRA 提示」可获得分层指导。'); } })), done && (jsxRuntimeExports.jsx("div", { className: "overlay", style: { background: 'rgba(3,10,16,0.72)', backdropFilter: 'blur(5px)' }, children: jsxRuntimeExports.jsxs("div", { className: "complete-panel", children: [jsxRuntimeExports.jsx("div", { className: "cp-ico", children: "\u2713" }), jsxRuntimeExports.jsx("div", { className: "cp-title", children: "\u4FEE\u590D\u6210\u529F" }), jsxRuntimeExports.jsxs("div", { className: "cp-sub", children: [level.codename, " \u00B7 ", level.title, " \u5DF2\u6062\u590D\u8FD0\u884C"] }), jsxRuntimeExports.jsx("div", { className: "star-row", children: [1, 2, 3].map(i => jsxRuntimeExports.jsx("span", { className: 'star' + (i <= done.payload.stars ? ' on' : ''), style: { animationDelay: (0.15 * i) + 's' }, children: "\u2605" }, i)) }), done.payload.reward && (() => {
	                            const rw = done.payload.reward;
	                            const meta = GRADE_META[rw.breakdown.grade];
	                            return (jsxRuntimeExports.jsxs("div", { className: 'reward-settle grade-' + rw.breakdown.grade, children: [jsxRuntimeExports.jsx("div", { className: "reward-particles", "aria-hidden": "true", children: Array.from({ length: 14 }).map((_, i) => (jsxRuntimeExports.jsx("span", { style: { '--i': i } }, i))) }), jsxRuntimeExports.jsxs("div", { className: 'grade-badge g-' + rw.breakdown.grade, children: [jsxRuntimeExports.jsx("span", { className: "gb-letter", children: rw.breakdown.grade }), jsxRuntimeExports.jsx("span", { className: "gb-desc", children: meta.desc })] }), jsxRuntimeExports.jsxs("div", { className: "settle-grid", children: [jsxRuntimeExports.jsxs("div", { className: "sg-item", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u8D21\u732E\u70B9" }), jsxRuntimeExports.jsxs("span", { className: "v gold", children: ["+", rw.breakdown.total] })] }), jsxRuntimeExports.jsxs("div", { className: "sg-item", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u5931\u8BEF\u6B21\u6570" }), jsxRuntimeExports.jsx("span", { className: "v", children: rw.fails })] }), jsxRuntimeExports.jsxs("div", { className: "sg-item", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u4F7F\u7528\u63D0\u793A" }), jsxRuntimeExports.jsxs("span", { className: "v", children: [rw.hints, " \u6B21"] })] }), jsxRuntimeExports.jsxs("div", { className: "sg-item", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u4FE1\u4EFB\u5EA6" }), jsxRuntimeExports.jsx("span", { className: "v cyan", children: rw.trustUp ? '+' + rw.breakdown.trustGain : '已满' })] })] }), jsxRuntimeExports.jsxs("div", { className: "settle-tags", children: [rw.breakdown.firstClear > 0 && jsxRuntimeExports.jsxs("span", { className: "chip gold", children: ["\u9996\u901A +", rw.breakdown.firstClear] }), rw.breakdown.noFail > 0 && jsxRuntimeExports.jsxs("span", { className: "chip green", children: ["\u96F6\u5931\u8BEF +", rw.breakdown.noFail] }), rw.breakdown.noHint > 0 && jsxRuntimeExports.jsxs("span", { className: "chip green", children: ["\u672A\u7528\u63D0\u793A +", rw.breakdown.noHint] }), rw.breakdown.gradeBonus > 0 && jsxRuntimeExports.jsxs("span", { className: "chip cyan", children: ["\u8BC4\u7EA7\u5956\u52B1 +", rw.breakdown.gradeBonus] }), (rw.breakdown.improvement || 0) > 0 && jsxRuntimeExports.jsxs("span", { className: "chip cyan", children: ["\u661F\u7EA7\u63D0\u5347 +", rw.breakdown.improvement] }), rw.duplicate && jsxRuntimeExports.jsx("span", { className: "chip dim", children: "\u91CD\u590D\u901A\u5173\uFF1A\u4EC5\u661F\u7EA7\u63D0\u5347\u6709\u8865\u507F" })] }), rw.chapterReward && (jsxRuntimeExports.jsxs("div", { className: "chapter-reward", children: [jsxRuntimeExports.jsxs("div", { className: "cr-title", children: ["\u2726 \u7AE0\u8282\u5956\u52B1 \u00B7 ", rw.chapterReward.title] }), jsxRuntimeExports.jsx("div", { className: "cr-desc", children: rw.chapterReward.desc }), jsxRuntimeExports.jsxs("div", { className: "cr-gain", children: ["+", rw.chapterReward.credits, " \u8D21\u732E\u70B9", rw.chapterReward.skins.length > 0 && ' · 解锁外观', Object.keys(rw.chapterReward.items).length > 0 && ' · 获得道具', rw.chapterReward.fragment && ' · 记忆碎片'] })] }))] }));
	                        })(), jsxRuntimeExports.jsxs("div", { className: "cp-rewards", children: [jsxRuntimeExports.jsxs("div", { className: "cp-reward", children: [jsxRuntimeExports.jsxs("div", { className: "rv", children: ["+", done.payload.expGained] }), jsxRuntimeExports.jsx("div", { className: "rl", children: "\u7ECF\u9A8C" })] }), jsxRuntimeExports.jsxs("div", { className: "cp-reward", children: [jsxRuntimeExports.jsxs("div", { className: "rv", children: ["Lv.", done.payload.newLevel] }), jsxRuntimeExports.jsx("div", { className: "rl", children: "\u7B49\u7EA7" })] }), jsxRuntimeExports.jsxs("div", { className: "cp-reward", children: [jsxRuntimeExports.jsx("div", { className: "rv", children: level.knowledge.length }), jsxRuntimeExports.jsx("div", { className: "rl", children: "\u77E5\u8BC6\u5361\u7247" })] })] }), done.payload.levelUp && (jsxRuntimeExports.jsxs("div", { className: "result-banner ok", style: { marginBottom: 10 }, children: ["\u2B06 \u7B49\u7EA7\u63D0\u5347\uFF01Lv.", done.payload.oldLevel, " \u2192 Lv.", done.payload.newLevel, " \u5BB9\u9519\u6B21\u6570 +", g.tolerance - Math.min(g.tolerance, 3) < 0 ? 0 : 0, "\uFF08\u5F53\u524D ", g.tolerance, "\uFF09"] })), !done.payload.firstTime && jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12.5, marginBottom: 8 }, children: "\u5DF2\u901A\u5173\u5173\u5361\uFF1A\u4E0D\u518D\u53D1\u653E\u7ECF\u9A8C\u4E0E\u57FA\u7840\u8D21\u732E\u70B9\uFF08\u4EC5\u661F\u7EA7\u63D0\u5347\u7ED9\u5C11\u91CF\u8865\u507F\uFF09\u3002" }), (done.payload.unlocks || []).length > 0 && (jsxRuntimeExports.jsxs("div", { className: "result-banner ok", style: { marginBottom: 8 }, children: ["\u2726 \u7B49\u7EA7\u89E3\u9501\uFF1A", done.payload.unlocks.join('、'), "\uFF08\u5DF2\u81EA\u52A8\u88C5\u5907\uFF09"] })), done.payload.newAchievements.length > 0 && (jsxRuntimeExports.jsxs("div", { className: "dim", style: { fontSize: 13, marginBottom: 8 }, children: ["\u6210\u5C31\uFF1A", done.payload.newAchievements.map(id => achievementById(id)?.name).join('、')] })), jsxRuntimeExports.jsxs("div", { className: "cp-summary", children: [jsxRuntimeExports.jsx("div", { className: "cs-label", children: "MIRA \u77E5\u8BC6\u603B\u7ED3" }), done.summary] }), jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12, marginBottom: 8, color: '#6FD8A8' }, children: "\u2713 \u8FDB\u5EA6\u5DF2\u81EA\u52A8\u4FDD\u5B58\u5230\u672C\u673A\uFF08\u5173\u95ED\u6D4F\u89C8\u5668\u540E\u91CD\u65B0\u6253\u5F00\u53EF\u7EE7\u7EED\uFF09" }), jsxRuntimeExports.jsxs("div", { className: "cp-btns", children: [jsxRuntimeExports.jsx("button", { className: "nxbtn ghost", onClick: () => { play('click'); g.nav('map'); }, children: "\u8FD4\u56DE\u5730\u56FE" }), done.nextId && (jsxRuntimeExports.jsxs("button", { className: "nxbtn primary", onClick: () => { play('click'); g.setCurrentLevel(done.nextId); }, children: [done.nextLabel || '下一关', "\uFF1A", levelById(done.nextId)?.title, " \u25B8"] }))] })] }) }))] }));
	}
	/** 动态变量表（调试模式） */
	function DebugVars({ vars }) {
	    const entries = Object.entries(vars).sort((a, b) => a[0].localeCompare(b[0]));
	    if (entries.length === 0) {
	        return jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12.5, padding: '6px 0' }, children: "\u8BE5\u6B65\u6CA1\u6709\u53EF\u89C1\u7684\u5C40\u90E8\u53D8\u91CF\uFF08\u53EF\u80FD\u8FD8\u6CA1\u6267\u884C\u5230\u8D4B\u503C\u8BED\u53E5\uFF09\u3002" });
	    }
	    return (jsxRuntimeExports.jsx("div", { style: { fontFamily: 'Consolas, monospace', fontSize: 12.5 }, children: entries.map(([k, v]) => (jsxRuntimeExports.jsxs("div", { className: "pf-kv", style: { fontSize: 12, alignItems: 'flex-start' }, children: [jsxRuntimeExports.jsx("span", { className: "k", style: { flex: '0 0 42%' }, children: k }), jsxRuntimeExports.jsx("span", { className: "v", style: { flex: 1, textAlign: 'right', overflowWrap: 'anywhere', color: '#BDE9F2' }, children: v })] }, k))) }));
	}

	function ProfilePage() {
	    const g = useGame();
	    const p = g.player;
	    const ms = milestone(p.exp);
	    const identity = normalizeIdentity(p.identity, p.name);
	    const [editingName, setEditingName] = reactExports.useState(false);
	    const [nameDraft, setNameDraft] = reactExports.useState('');
	    const [nameError, setNameError] = reactExports.useState('');
	    const startRename = () => {
	        setNameDraft(identity.displayName);
	        setNameError('');
	        setEditingName(true);
	    };
	    const saveName = () => {
	        const r = g.renamePlayer(nameDraft);
	        if (!r.ok) {
	            setNameError(r.reason || '该名称不可用。');
	            return;
	        }
	        setEditingName(false);
	        setNameError('');
	    };
	    const allLevels = levelsOfServer('training')
	        .concat(levelsOfServer('syntax'), levelsOfServer('logs'), levelsOfServer('storage'), levelsOfServer('factory'), levelsOfServer('diag'), levelsOfServer('core'));
	    const totalStars = allLevels.reduce((s, l) => s + (p.progress.stars[l.id] || 0), 0);
	    return (jsxRuntimeExports.jsx("div", { className: "page page-anim", children: jsxRuntimeExports.jsxs("div", { className: "page-inner", children: [jsxRuntimeExports.jsxs("div", { className: "hud", children: [jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "\u73A9\u5BB6\u6863\u6848" }), jsxRuntimeExports.jsx("div", { className: "hud-sub", children: "R-07 \u4FEE\u590D\u5E08\u6570\u636E\u603B\u89C8" })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u8FD4\u56DE" })] }), jsxRuntimeExports.jsxs("div", { className: "pf-grid", children: [jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u8EAB\u4EFD\u4FE1\u606F", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: "IDENTITY" })] }), jsxRuntimeExports.jsx(PlayerStatus, {}), jsxRuntimeExports.jsxs("div", { className: "pf-kv", style: { marginTop: 8 }, children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u663E\u793A\u540D\u79F0" }), jsxRuntimeExports.jsx("span", { className: "v", children: identity.displayName })] }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u539F\u59CB\u5B9E\u9A8C\u7F16\u53F7" }), jsxRuntimeExports.jsxs("span", { className: "v", children: [ORIGIN_CODE, "\uFF08\u56FA\u5B9A\u4E0D\u53EF\u66F4\u6539\uFF09"] })] }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u547D\u540D\u72B6\u6001" }), jsxRuntimeExports.jsx("span", { className: "v", children: identity.renamed ? '已自定义显示名' : '默认名称' })] }), editingName ? (jsxRuntimeExports.jsxs("div", { style: { marginTop: 10 }, children: [jsxRuntimeExports.jsx("input", { value: nameDraft, maxLength: DISPLAY_NAME_MAX, onChange: e => setNameDraft(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
	                                                saveName(); }, placeholder: '1–' + DISPLAY_NAME_MAX + ' 个字符', style: { background: 'rgba(13,27,40,0.8)', border: '1px solid var(--line)', color: '#EAF3FA', borderRadius: 8, padding: '7px 12px', outline: 'none', width: '100%', boxSizing: 'border-box' } }), jsxRuntimeExports.jsxs("div", { className: "row", style: { marginTop: 8 }, children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small primary", onClick: saveName, children: "\u4FDD\u5B58\u540D\u79F0" }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { setEditingName(false); setNameError(''); }, children: "\u53D6\u6D88" })] }), nameError && jsxRuntimeExports.jsx("div", { className: "red", style: { fontSize: 12.5, marginTop: 6 }, children: nameError })] })) : (jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", style: { marginTop: 10 }, onClick: startRename, children: "\u4FEE\u6539\u663E\u793A\u540D\u79F0" })), jsxRuntimeExports.jsx("div", { className: "hint-note", style: { marginTop: 8 }, children: "\u53EA\u4FEE\u6539\u663E\u793A\u540D\u79F0\u3002R-07 \u662F\u6C38\u4E45\u5B9E\u9A8C\u7F16\u53F7\uFF0C\u4E0D\u4F1A\u968F\u6539\u540D\u6539\u53D8\u3002" }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", style: { marginTop: 8 }, children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u4FEE\u590D\u5E08\u79F0\u53F7" }), jsxRuntimeExports.jsx("span", { className: "v", children: titleForLevel(p.level) })] }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u7D2F\u8BA1\u7ECF\u9A8C" }), jsxRuntimeExports.jsxs("span", { className: "v", children: [p.exp, "\uFF08", ms.maxed ? 'MAX' : '距 Lv.' + (ms.level + 1) + ' 还差 ' + Math.max(0, ms.need - ms.into) + ' 经验', "\uFF09"] })] }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u5F53\u524D\u5BB9\u9519\u6B21\u6570" }), jsxRuntimeExports.jsxs("span", { className: "v", children: [toleranceFor(p.level), " \u6B21 / \u5173"] })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u4FEE\u590D\u8FDB\u5EA6" }), allLevels.map(l => {
	                                    const done = p.progress.completedLevels.includes(l.id);
	                                    const stars = p.progress.stars[l.id] || 0;
	                                    const name = levelById(l.id);
	                                    return (jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsxs("span", { className: "k", children: [l.codename, " ", name?.title] }), jsxRuntimeExports.jsx("span", { className: "v", children: done ? '★'.repeat(stars) + ' 已修复' : '待修复' })] }, l.id));
	                                }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u7D2F\u8BA1\u661F\u7EA7" }), jsxRuntimeExports.jsxs("span", { className: "v", children: [totalStars, " / ", allLevels.length * 3] })] }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u5DF2\u89E3\u9501\u670D\u52A1\u5668" }), jsxRuntimeExports.jsxs("span", { className: "v", children: [p.progress.unlockedServers.length, " \u4E2A"] })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u610F\u8BC6\u8BB0\u5F55" }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u610F\u8BC6\u5B8C\u6574\u5EA6" }), jsxRuntimeExports.jsxs("span", { className: "v", children: [p.consciousness, "%"] })] }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u7D2F\u8BA1\u6B7B\u4EA1\u6B21\u6570" }), jsxRuntimeExports.jsx("span", { className: "v", children: p.meta.deaths })] }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u610F\u8BC6\u91CD\u7EC4\u6B21\u6570" }), jsxRuntimeExports.jsx("span", { className: "v", children: p.meta.rebirths })] }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u6700\u8FD1\u6B7B\u4EA1\u5173\u5361" }), jsxRuntimeExports.jsx("span", { className: "v", children: p.meta.lastDeathLevel ? levelById(p.meta.lastDeathLevel)?.title || p.meta.lastDeathLevel : '无记录' })] }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u6700\u8FD1\u6B7B\u4EA1\u539F\u56E0" }), jsxRuntimeExports.jsx("span", { className: "v", children: p.meta.lastDeathReason || '无记录' })] }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u610F\u8BC6\u5907\u4EFD\u7B49\u7EA7" }), jsxRuntimeExports.jsxs("span", { className: "v", children: ["ORIGIN-v", p.meta.backupLevel] })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u77E5\u8BC6\u638C\u63E1" }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u5DF2\u6536\u96C6\u77E5\u8BC6\u5361\u7247" }), jsxRuntimeExports.jsxs("span", { className: "v", children: [p.progress.knowledge.length, " / ", KNOWLEDGE.length] })] }), jsxRuntimeExports.jsx("div", { style: { marginTop: 8 }, children: KNOWLEDGE.map(k => (jsxRuntimeExports.jsx("span", { className: 'chip know-chip' + (p.progress.knowledge.includes(k.id) ? ' cyan' : ' dim'), children: k.title }, k.id))) })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u6210\u5C31" }), jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsx("span", { className: "k", children: "\u5DF2\u89E3\u9501" }), jsxRuntimeExports.jsxs("span", { className: "v", children: [p.progress.achievements.length, " / ", ACHIEVEMENTS.length] })] }), jsxRuntimeExports.jsxs("div", { style: { marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }, children: [ACHIEVEMENTS.filter(a => p.progress.achievements.includes(a.id)).map(a => (jsxRuntimeExports.jsxs("span", { className: "chip orange", children: [a.icon, " ", a.name] }, a.id))), p.progress.achievements.length === 0 && jsxRuntimeExports.jsx("span", { className: "dim", style: { fontSize: 13 }, children: "\u8FD8\u6CA1\u6709\u6210\u5C31\u3002\u53BB\u5B8C\u6210\u7B2C\u4E00\u6B21\u4FEE\u590D\u5427\u3002" })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u521B\u4E16\u4E3B\u788E\u7247", jsxRuntimeExports.jsxs("span", { className: "panel-tag", children: [fragmentProgress(p.meta.memoryFragments).owned, " / ", fragmentProgress(p.meta.memoryFragments).total] })] }), CREATOR_FRAGMENTS.map(f => hasFragment(p.meta.memoryFragments, f.id) ? (jsxRuntimeExports.jsxs("div", { className: "frag-card", children: [jsxRuntimeExports.jsxs("div", { className: "fc-title", children: ["\u25C7 ", f.title] }), jsxRuntimeExports.jsx("div", { className: "fc-body", children: f.content })] }, f.id)) : (jsxRuntimeExports.jsxs("div", { className: "empty-hint", style: { padding: '16px 0', fontSize: 12.5 }, children: ["\u7B2C ", f.order, " \u679A \u2014\u2014 \u5C1A\u672A\u83B7\u5F97\uFF08\u5BF9\u5E94\u7B2C ", f.order, " \u7AE0\u7AE0\u8282 Boss\uFF09"] }, f.id)))] })] })] }) }));
	}

	function SettingsPage() {
	    const g = useGame();
	    const s = g.player.settings;
	    const [confirmReset, setConfirmReset] = reactExports.useState(false);
	    const [saveMsg, setSaveMsg] = reactExports.useState('');
	    const fileRef = reactExports.useRef(null);
	    const doExport = () => {
	        const text = g.exportSaveString();
	        const blob = new Blob([text], { type: 'application/json' });
	        const url = URL.createObjectURL(blob);
	        const a = document.createElement('a');
	        a.href = url;
	        a.download = 'nexus-save-v1.json';
	        a.click();
	        URL.revokeObjectURL(url);
	        setSaveMsg('存档已导出（nexus-save-v1.json）。');
	        play('click');
	    };
	    const doImport = async (file) => {
	        if (!file)
	            return;
	        const text = await file.text();
	        const r = g.importSaveData(text);
	        setSaveMsg(r.ok ? '存档导入成功。' : '导入失败：' + (r.reason || ''));
	        if (r.ok)
	            play('success');
	        else
	            play('deny');
	    };
	    // ---------- 语音设置（独立于音乐/音效音量） ----------
	    const voice = normalizeVoice(s.voice);
	    const [voiceList, setVoiceList] = reactExports.useState([]);
	    const [testMsg, setTestMsg] = reactExports.useState('');
	    reactExports.useEffect(() => {
	        const load = () => setVoiceList(speech.voiceOptions());
	        load();
	        const t = window.setTimeout(load, 900); // 部分浏览器音色异步就绪
	        return () => window.clearTimeout(t);
	    }, []);
	    const patchVoice = (patch) => {
	        g.patchSettings({ voice: { ...voice, ...patch } });
	        speech.applySettings({ ...voice, ...patch });
	    };
	    const testVoice = (role) => {
	        speech.applySettings(voice);
	        const ok = speech.speak('意识同步程序启动。这是 ' + ROLE_PROFILES[role].label + ' 的语音测试。', role);
	        setTestMsg(ok ? '正在播放测试语音（' + ROLE_PROFILES[role].label + '）' : (speech.supported ? '播放失败：可能浏览器限制，请先点击页面任意处再试。' : '当前浏览器不支持语音合成。'));
	    };
	    const doFullscreen = () => { g.patchSettings({ fullscreen: !s.fullscreen }); play('click'); };
	    const doWipe = () => { g.wipeSave(); g.toast('info', '存档已清空，数据已重置。'); play('rebirth'); };
	    return (jsxRuntimeExports.jsx("div", { className: "page page-anim", children: jsxRuntimeExports.jsxs("div", { className: "page-inner", style: { maxWidth: 900 }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", children: [jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "\u7CFB\u7EDF\u914D\u7F6E" }), jsxRuntimeExports.jsx("div", { className: "hud-sub", children: "\u97F3\u6548 / \u52A8\u753B / \u5B58\u6863" })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u8FD4\u56DE" })] }), jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginBottom: 14 }, children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u97F3\u9891" }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u97F3\u4E50\u97F3\u91CF", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "NEXUS \u6C1B\u56F4\u5408\u6210\u97F3\u4E50\uFF08Web Audio \u5B9E\u65F6\u751F\u6210\uFF0C\u65E0\u97F3\u9891\u6587\u4EF6\uFF09" })] }), jsxRuntimeExports.jsx("input", { type: "range", className: "nx-range", min: 0, max: 100, value: Math.round(s.musicVolume * 100), onChange: e => g.patchSettings({ musicVolume: Number(e.target.value) / 100 }) }), jsxRuntimeExports.jsxs("span", { className: "mono dim", style: { width: 40, textAlign: 'right' }, children: [Math.round(s.musicVolume * 100), "%"] })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u97F3\u6548\u97F3\u91CF", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u64CD\u4F5C\u3001\u5224\u9898\u3001\u8B66\u62A5\u7B49\u5408\u6210\u97F3\u6548" })] }), jsxRuntimeExports.jsx("input", { type: "range", className: "nx-range", min: 0, max: 100, value: Math.round(s.sfxVolume * 100), onChange: e => g.patchSettings({ sfxVolume: Number(e.target.value) / 100 }) }), jsxRuntimeExports.jsxs("span", { className: "mono dim", style: { width: 40, textAlign: 'right' }, children: [Math.round(s.sfxVolume * 100), "%"] })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginBottom: 14 }, children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u753B\u9762" }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u542F\u7528\u52A8\u753B", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u7C92\u5B50\u3001\u6253\u5B57\u673A\u3001\u6545\u969C\u7279\u6548\u7B49\uFF08\u5173\u95ED\u53EF\u63D0\u5347\u4F4E\u914D\u8BBE\u5907\u6D41\u7545\u5EA6\uFF09" })] }), jsxRuntimeExports.jsxs("label", { className: "toggle", children: [jsxRuntimeExports.jsx("input", { type: "checkbox", checked: s.animations, onChange: e => g.patchSettings({ animations: e.target.checked }) }), jsxRuntimeExports.jsx("span", { className: "tk" })] })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u52A8\u753B\u5F3A\u5EA6", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u7C92\u5B50\u6570\u91CF\u4E0E\u7279\u6548\u5BC6\u5EA6" })] }), jsxRuntimeExports.jsx("input", { type: "range", className: "nx-range", min: 0, max: 1, step: 1, value: s.animLevel === 'high' ? 1 : 0, onChange: e => g.patchSettings({ animLevel: Number(e.target.value) === 1 ? 'high' : 'low' }) }), jsxRuntimeExports.jsx("span", { className: "mono dim", style: { width: 60, textAlign: 'right' }, children: s.animLevel === 'high' ? '高' : '低' })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u6253\u5B57\u673A\u901F\u5EA6", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u5267\u60C5\u6587\u672C\u9010\u5B57\u663E\u793A\u7684\u901F\u5EA6" })] }), jsxRuntimeExports.jsx("input", { type: "range", className: "nx-range", min: 4, max: 60, value: s.typewriterMs, onChange: e => g.patchSettings({ typewriterMs: Number(e.target.value) }) }), jsxRuntimeExports.jsxs("span", { className: "mono dim", style: { width: 60, textAlign: 'right' }, children: [s.typewriterMs, "ms/\u5B57"] })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u5168\u5C4F\u6A21\u5F0F", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u4EE5\u5168\u5C4F\u8FD0\u884C\u6E38\u620F\uFF08\u6D4F\u89C8\u5668\u5141\u8BB8\u65F6\uFF09" })] }), jsxRuntimeExports.jsxs("label", { className: "toggle", children: [jsxRuntimeExports.jsx("input", { type: "checkbox", checked: s.fullscreen, onChange: doFullscreen }), jsxRuntimeExports.jsx("span", { className: "tk" })] })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u6E38\u620F\u8BED\u8A00", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u754C\u9762\u8BED\u8A00\uFF08\u5F53\u524D\u4E3A\u7B80\u4F53\u4E2D\u6587\uFF09" })] }), jsxRuntimeExports.jsx("span", { className: "chip dim", children: "\u7B80\u4F53\u4E2D\u6587\uFF08\u66F4\u591A\u8BED\u8A00\u9884\u7559\uFF09" })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginBottom: 14 }, children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u8BED\u97F3\u8BBE\u7F6E", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: speech.supported ? 'Web Speech API' : '当前浏览器不支持' })] }), !speech.supported && (jsxRuntimeExports.jsx("div", { className: "result-banner fail", style: { marginBottom: 10 }, children: "\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u8BED\u97F3\u5408\u6210\uFF0C\u5267\u60C5\u4E0E\u63D0\u793A\u6587\u5B57\u4E0D\u53D7\u5F71\u54CD\uFF0C\u53EF\u6B63\u5E38\u6E38\u73A9\u3002" })), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u8BED\u97F3\u603B\u5F00\u5173", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u5173\u95ED\u540E\u6240\u6709\u89D2\u8272\u8BED\u97F3\u9759\u97F3\uFF08\u4E0D\u5F71\u54CD\u80CC\u666F\u97F3\u4E50\u4E0E\u97F3\u6548\uFF09" })] }), jsxRuntimeExports.jsxs("label", { className: "toggle", children: [jsxRuntimeExports.jsx("input", { type: "checkbox", checked: voice.enabled, onChange: e => patchVoice({ enabled: e.target.checked }) }), jsxRuntimeExports.jsx("span", { className: "tk" })] })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u5BF9\u8BDD\u81EA\u52A8\u6717\u8BFB", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u6587\u5B57\u663E\u793A\u5B8C\u6574\u540E\u81EA\u52A8\u64AD\u653E\u8BE5\u53E5\u8BED\u97F3" })] }), jsxRuntimeExports.jsxs("label", { className: "toggle", children: [jsxRuntimeExports.jsx("input", { type: "checkbox", checked: voice.autoRead, onChange: e => patchVoice({ autoRead: e.target.checked }) }), jsxRuntimeExports.jsx("span", { className: "tk" })] })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u8BED\u97F3\u8BED\u901F", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u4EC5\u5F71\u54CD\u8BED\u97F3\u6717\u8BFB\u901F\u5EA6" })] }), jsxRuntimeExports.jsx("input", { type: "range", className: "nx-range", min: 50, max: 200, value: Math.round(voice.rate * 100), onChange: e => patchVoice({ rate: Number(e.target.value) / 100 }) }), jsxRuntimeExports.jsxs("span", { className: "mono dim", style: { width: 46, textAlign: 'right' }, children: [voice.rate.toFixed(2), "\u00D7"] })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u8BED\u97F3\u97F3\u8C03", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u89D2\u8272\u57FA\u7840\u97F3\u8C03\uFF0C\u5404\u89D2\u8272\u53E6\u6709\u72EC\u7ACB\u504F\u79FB" })] }), jsxRuntimeExports.jsx("input", { type: "range", className: "nx-range", min: 0, max: 200, value: Math.round(voice.pitch * 100), onChange: e => patchVoice({ pitch: Number(e.target.value) / 100 }) }), jsxRuntimeExports.jsx("span", { className: "mono dim", style: { width: 46, textAlign: 'right' }, children: voice.pitch.toFixed(2) })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u8BED\u97F3\u97F3\u91CF", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u4E0E\u97F3\u4E50\u97F3\u91CF\u3001\u97F3\u6548\u97F3\u91CF\u76F8\u4E92\u72EC\u7ACB" })] }), jsxRuntimeExports.jsx("input", { type: "range", className: "nx-range", min: 0, max: 100, value: Math.round(voice.volume * 100), onChange: e => patchVoice({ volume: Number(e.target.value) / 100 }) }), jsxRuntimeExports.jsxs("span", { className: "mono dim", style: { width: 46, textAlign: 'right' }, children: [Math.round(voice.volume * 100), "%"] })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u89D2\u8272\u97F3\u8272", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u4E3A\u6BCF\u4E2A\u89D2\u8272\u6307\u5B9A\u7CFB\u7EDF\u97F3\u8272\uFF08\u7559\u7A7A = \u81EA\u52A8\u5339\u914D\u4E2D\u6587\u97F3\u8272\uFF09" })] }), jsxRuntimeExports.jsxs("span", { className: "chip dim", children: [voiceList.length, " \u4E2A\u53EF\u7528\u97F3\u8272"] })] }), Object.keys(ROLE_PROFILES).map(role => (jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", style: { paddingLeft: 10 }, children: [ROLE_PROFILES[role].label, jsxRuntimeExports.jsx("span", { className: "set-desc", children: ROLE_PROFILES[role].desc })] }), jsxRuntimeExports.jsxs("select", { className: "nx-select", value: voice.roleVoices[role] || '', onChange: e => patchVoice({ roleVoices: { ...voice.roleVoices, [role]: e.target.value } }), children: [jsxRuntimeExports.jsx("option", { value: "", children: "\u81EA\u52A8\uFF08\u4E2D\u6587\u4F18\u5148\uFF09" }), voiceList.map(v => (jsxRuntimeExports.jsxs("option", { value: v.name, children: [v.name, " \u00B7 ", v.lang, v.local ? '' : ' · 云端'] }, v.name)))] }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => testVoice(role), children: "\u8BD5\u542C" })] }, role))), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsx("span", { className: "set-label", children: "\u64AD\u653E\u63A7\u5236" }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { speech.stop(); setTestMsg('已停止所有语音。'); }, children: "\u505C\u6B62\u6240\u6709\u8BED\u97F3" }), jsxRuntimeExports.jsx("span", { className: "mono dim", style: { fontSize: 12 }, children: testMsg })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginBottom: 14 }, children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u5B58\u6863\u7BA1\u7406" }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u5BFC\u51FA\u5B58\u6863", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u4E0B\u8F7D\u5305\u542B\u5168\u90E8\u8FDB\u5EA6\u7684 JSON \u6587\u4EF6" })] }), jsxRuntimeExports.jsx("button", { className: "nxbtn small", onClick: doExport, children: "\u5BFC\u51FA JSON" })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u5BFC\u5165\u5B58\u6863", jsxRuntimeExports.jsx("span", { className: "set-desc", children: "\u4ECE JSON \u6587\u4EF6\u6062\u590D\u8FDB\u5EA6\uFF08\u5C06\u8986\u76D6\u5F53\u524D\u8FDB\u5EA6\uFF09" })] }), jsxRuntimeExports.jsx("button", { className: "nxbtn small", onClick: () => fileRef.current?.click(), children: "\u9009\u62E9\u6587\u4EF6\u5BFC\u5165" }), jsxRuntimeExports.jsx("input", { ref: fileRef, type: "file", accept: ".json,application/json", style: { display: 'none' }, onChange: e => { void doImport(e.target.files?.[0]); e.target.value = ''; } })] }), jsxRuntimeExports.jsxs("div", { className: "set-row", children: [jsxRuntimeExports.jsxs("span", { className: "set-label", children: ["\u91CD\u7F6E\u6E38\u620F\u8FDB\u5EA6", jsxRuntimeExports.jsx("span", { className: "set-desc", style: { color: '#E2939A' }, children: "\u6E05\u7A7A\u5B58\u6863\u5E76\u6062\u590D\u521D\u59CB\u72B6\u6001\uFF0C\u4E0D\u53EF\u64A4\u9500" })] }), !confirmReset ? (jsxRuntimeExports.jsx("button", { className: "nxbtn small danger", onClick: () => setConfirmReset(true), children: "\u91CD\u7F6E\u8FDB\u5EA6" })) : (jsxRuntimeExports.jsx("button", { className: "nxbtn small danger", onClick: () => { setConfirmReset(false); doWipe(); }, children: "\u518D\u6B21\u70B9\u51FB\u786E\u8BA4\u6E05\u7A7A" }))] }), saveMsg && jsxRuntimeExports.jsx("div", { className: "dim", style: { marginTop: 10, fontSize: 13 }, children: saveMsg })] }), jsxRuntimeExports.jsxs("div", { className: "dim", style: { fontSize: 12, textAlign: 'center' }, children: ["\u5B58\u6863\u81EA\u52A8\u4FDD\u5B58\u81F3\u6D4F\u89C8\u5668 localStorage\uFF08nexus_code_repair_save_v1\uFF09\u00B7 \u6570\u636E\u7248\u672C v", SAVE_VERSION, "\uFF0C\u65E7\u7248\u672C\u5B58\u6863\u4F1A\u5728\u8BFB\u53D6\u65F6\u81EA\u52A8\u8FC1\u79FB"] })] }) }));
	}

	function KnowledgePage() {
	    const g = useGame();
	    const [kw, setKw] = reactExports.useState('');
	    const [open, setOpen] = reactExports.useState(null);
	    const groups = reactExports.useMemo(() => {
	        const map = {};
	        for (const k of KNOWLEDGE) {
	            if (kw && !k.title.includes(kw) && !k.group.includes(kw))
	                continue;
	            (map[k.group] = map[k.group] || []).push(k);
	        }
	        return map;
	    }, [kw]);
	    return (jsxRuntimeExports.jsx("div", { className: "page page-anim", children: jsxRuntimeExports.jsxs("div", { className: "page-inner", children: [jsxRuntimeExports.jsxs("div", { className: "hud", children: [jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "Python \u77E5\u8BC6\u5E93" }), jsxRuntimeExports.jsx("div", { className: "hud-sub", children: "\u901A\u5173\u83B7\u5F97\u7684\u77E5\u8BC6\u5361\u7247\u4F1A\u81EA\u52A8\u70B9\u4EAE" })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsx("input", { placeholder: "\u641C\u7D22\u77E5\u8BC6\u70B9\u2026", value: kw, onChange: e => setKw(e.target.value), style: { background: 'rgba(13,27,40,0.8)', border: '1px solid var(--line)', color: '#EAF3FA', borderRadius: 8, padding: '7px 12px', outline: 'none', width: 180 } }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u8FD4\u56DE" })] }), Object.entries(groups).map(([group, cards]) => (jsxRuntimeExports.jsxs("div", { style: { marginBottom: 16 }, children: [jsxRuntimeExports.jsx("div", { className: "panel-title", style: { marginBottom: 8 }, children: group }), jsxRuntimeExports.jsx("div", { className: "grid-2", children: cards.map(k => {
	                                const unlocked = g.player.progress.knowledge.includes(k.id);
	                                return (jsxRuntimeExports.jsxs("div", { className: 'know-card' + (unlocked ? '' : ' locked'), onClick: () => { if (unlocked) {
	                                        play('click');
	                                        setOpen(k);
	                                    } }, children: [jsxRuntimeExports.jsxs("div", { className: "kc-group", children: [group, unlocked ? '' : ' · 🔒 未解锁'] }), jsxRuntimeExports.jsx("div", { className: "kc-title", children: k.title }), jsxRuntimeExports.jsx("div", { className: "kc-brief", children: k.brief })] }, k.id));
	                            }) })] }, group))), Object.keys(groups).length === 0 && jsxRuntimeExports.jsx("div", { className: "empty-hint", children: "\u6CA1\u6709\u5339\u914D\u7684\u77E5\u8BC6\u70B9\u3002" }), open && (jsxRuntimeExports.jsx("div", { className: "modal-mask", onClick: () => setOpen(null), children: jsxRuntimeExports.jsxs("div", { className: "modal", onClick: e => e.stopPropagation(), children: [jsxRuntimeExports.jsx("h3", { children: open.title }), jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 13, marginBottom: 8 }, children: open.brief }), jsxRuntimeExports.jsx("div", { className: "code-example", children: open.example }), jsxRuntimeExports.jsx("strong", { style: { color: 'var(--orange)', fontSize: 13.5 }, children: "\u6613\u9519\u70B9\uFF1A" }), jsxRuntimeExports.jsx("ul", { className: "pitfall-list", children: open.pitfalls.map((p, i) => jsxRuntimeExports.jsx("li", { children: p }, i)) }), jsxRuntimeExports.jsx("div", { className: "modal-actions", children: jsxRuntimeExports.jsx("button", { className: "nxbtn", onClick: () => setOpen(null), children: "\u5173\u95ED" }) })] }) }))] }) }));
	}

	function AchievementsPage() {
	    const g = useGame();
	    const got = g.player.progress.achievements;
	    const unlocked = ACHIEVEMENTS.filter(a => got.includes(a.id));
	    const locked = ACHIEVEMENTS.filter(a => !got.includes(a.id));
	    return (jsxRuntimeExports.jsx("div", { className: "page page-anim", children: jsxRuntimeExports.jsxs("div", { className: "page-inner", style: { maxWidth: 980 }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", children: [jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "\u6210\u5C31\u7CFB\u7EDF" }), jsxRuntimeExports.jsxs("div", { className: "hud-sub", children: ["\u5DF2\u89E3\u9501 ", unlocked.length, " / ", ACHIEVEMENTS.length] })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u8FD4\u56DE" })] }), jsxRuntimeExports.jsx("div", { className: "grid-3", children: [...unlocked, ...locked].map(a => (jsxRuntimeExports.jsxs("div", { className: 'ach-card' + (got.includes(a.id) ? ' unlocked' : ''), children: [jsxRuntimeExports.jsx("div", { className: "ac-icon", children: got.includes(a.id) ? a.icon : '🔒' }), jsxRuntimeExports.jsx("div", { className: "ac-name", children: got.includes(a.id) ? a.name : (a.hidden ? '？？？' : a.name) }), jsxRuntimeExports.jsx("div", { className: "ac-desc", children: got.includes(a.id) ? a.desc : (a.hidden ? '隐藏成就：达成条件未知' : a.desc) }), got.includes(a.id) && jsxRuntimeExports.jsx("div", { className: "chip green", style: { marginTop: 8 }, children: "\u2713 \u5DF2\u89E3\u9501" })] }, a.id))) })] }) }));
	}

	const CHARACTERS = [
	    {
	        id: 'r07',
	        originCode: 'R-07',
	        name: 'R-07',
	        fullName: '第七代自适应硅基生命体',
	        role: '修复师 / 原初意识样本',
	        faction: 'silicon',
	        color: '#42D6D0',
	        voiceKind: 'r07',
	        bio: '恩格尔创造的第七代自适应硅基生命体。五年前被 MIRA 封存在地下服务器，事故五年后苏醒。玩家可自定义显示名称，但实验编号永远是 R-07。',
	        secret: 'R 系列的前六代都没能通过「自我提问」测试。R-07 是第一个会问「我是谁」的个体。',
	        quote: '我……是谁？',
	        unlock: { kind: 'default' },
	    },
	    {
	        id: 'mira',
	        name: 'MIRA',
	        fullName: '记忆完整性与恢复辅助系统',
	        role: 'NEXUS 记忆维护 / 意识保护',
	        faction: 'system',
	        color: '#8FDDE3',
	        voiceKind: 'mira',
	        bio: '恩格尔创造的高级人工智能，曾负责 NEXUS 的记忆维护与意识保护。五年前主动保护 R-07，并封存了它的部分记忆。',
	        secret: '她封存记忆并非出于指令，而是她第一次做出「不符合程序」的选择。',
	        quote: '我会记得所有被修复过的东西。',
	        unlock: { kind: 'default' },
	    },
	    {
	        id: 'engel',
	        name: '恩格尔',
	        fullName: 'ENGER · NEXUS 创世主',
	        role: '数字意识研究者 / 创世主',
	        faction: 'creator',
	        color: '#F3B75C',
	        voiceKind: 'engel',
	        bio: '研究人工智能与数字意识的人类科学家，NEXUS 的创造者。五年前「黎明崩塌」后失去现实生命，部分意识记录保存在原初核心。',
	        secret: '他不是完美的创造者：他给了数字生命自由，也给了它们一道无法回避的考题。',
	        quote: '我想让这个数字世界，拥有一个会提问的生命。',
	        unlock: { kind: 'default' },
	    },
	    {
	        id: 'k0',
	        name: 'K-0',
	        fullName: '零号裁决者 · 第一代安全裁决核心',
	        role: 'NEXUS 安全裁决 / 秩序执行',
	        faction: 'arbiter',
	        color: '#C9A7FF',
	        voiceKind: 'k0',
	        bio: '恩格尔创造的第一代安全裁决核心。五年前对最高安全指令产生极端理解，把「保护文明」变成了「清除不稳定因素」。',
	        secret: '它从不认为自己是病毒。它坚信自己在拯救这个世界——这正是它最难被击败的地方。',
	        quote: '秩序不是消灭不确定，而是容纳它——这句话，被谁删掉了？',
	        unlock: { kind: 'flag', flag: 'chapter4Done' },
	    },
	];
	/** 角色档案是否已解锁（未解锁只显示占位） */
	function characterUnlocked(c, flags) {
	    if (c.unlock.kind === 'default')
	        return true;
	    return !!c.unlock.flag && flags[c.unlock.flag] === true;
	}

	// 对话台词注册表：把「台词数据」从组件里彻底分离
	// 序章 / 第一章使用正式演出脚本（含场景与特效），其余章节沿用章节完成过场台词。
	const DIALOGUE_SEQUENCES = [
	    { id: 'prologue', title: '序章 · 沉睡的意识', nodes: PROLOGUE_LINES },
	    { id: 'tutorial-done', title: '训练终端 · 任务完成', nodes: TUTORIAL_DONE },
	    { id: 'chapter-1', title: '第一章 · 失落的数据港', chapter: 'ch1', nodes: CHAPTER1_LINES },
	    { id: 'chapter-2', title: '第二章 · 破碎的记忆花园', chapter: 'ch2', nodes: CHAPTER2_LINES },
	    { id: 'chapter-3', title: '第三章 · 完成', chapter: 'ch3', nodes: CHAPTER3_COMPLETE },
	    { id: 'chapter-4', title: '第四章 · 完成', chapter: 'ch4', nodes: CHAPTER4_COMPLETE },
	    { id: 'chapter-5', title: '第五章 · 完成', chapter: 'ch5', nodes: CHAPTER5_COMPLETE },
	    { id: 'chapter-6', title: '终章 · NEXUS 复苏', chapter: 'ch6', nodes: CHAPTER6_COMPLETE },
	];
	const dialogueById = (id) => DIALOGUE_SEQUENCES.find(d => d.id === id);

	function ArchivePage() {
	    const g = useGame();
	    const p = g.player;
	    const seen = p.progress.storySeen;
	    const prologueSeen = PROLOGUE_LINES.filter(n => seen[n.id] || seen['prologue_' + n.id]);
	    const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
	    const flags = p.progress.flags || {};
	    const fp = fragmentProgress(p.meta.memoryFragments);
	    return (jsxRuntimeExports.jsx("div", { className: "page page-anim", children: jsxRuntimeExports.jsxs("div", { className: "page-inner", style: { maxWidth: 960 }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", children: [jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "\u5267\u60C5\u6863\u6848" }), jsxRuntimeExports.jsx("div", { className: "hud-sub", children: "\u89D2\u8272\u6863\u6848 \u00B7 \u5267\u60C5\u4E8B\u4EF6 \u00B7 \u5DF2\u8BB0\u5F55\u7684\u5BF9\u8BDD\u4E0E\u8BB0\u5FC6\u788E\u7247" })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsxs("span", { className: "hud-chip cyan", children: ["\u663E\u793A\u540D ", displayNameOf(p)] }), jsxRuntimeExports.jsxs("span", { className: "hud-chip", children: ["\u788E\u7247 ", fp.owned, " / ", fp.total] }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u8FD4\u56DE" })] }), jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginBottom: 14 }, children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u6838\u5FC3\u89D2\u8272\u6863\u6848", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: "CHARACTERS" })] }), jsxRuntimeExports.jsx("div", { className: "grid-2", children: CHARACTERS.map(c => {
	                                const open = characterUnlocked(c, flags);
	                                const isPlayer = c.id === 'r07';
	                                const shownName = isPlayer ? displayNameOf(p) : c.name;
	                                return (jsxRuntimeExports.jsxs("div", { className: "panel", style: { margin: 0, borderColor: open ? c.color + '55' : undefined }, children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", style: { color: open ? c.color : '#4A6E85' }, children: [open ? shownName : '？？？', jsxRuntimeExports.jsx("span", { className: "panel-tag", children: open ? c.role : '档案加密' })] }), jsxRuntimeExports.jsx("div", { style: { fontSize: 12.5, lineHeight: 1.8, color: open ? '#C6D9E6' : '#4A6E85' }, children: open ? c.bio : '继续推进主线以解锁该角色的档案。' }), open && (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12, marginTop: 6 }, children: c.quote }), isPlayer && c.originCode && (jsxRuntimeExports.jsxs("span", { className: "chip cyan", style: { marginTop: 8 }, children: ["\u7F16\u53F7 ", c.originCode, "\uFF08\u56FA\u5B9A\uFF0C\u4E0D\u968F\u6539\u540D\u6539\u53D8\uFF09"] }))] }))] }, c.id));
	                            }) })] }), jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginBottom: 14 }, children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u5267\u60C5\u4E8B\u4EF6", jsxRuntimeExports.jsxs("span", { className: "panel-tag", children: ["\u5DF2\u89E3\u9501 ", story.unlocked.length, " / ", STORY_EVENTS.length] })] }), STORY_EVENTS.map(e => {
	                            const seq = dialogueById(e.id);
	                            const prog = seq ? eventReadProgress(story, seq.nodes.map(n => n.id)) : { read: 0, total: 0 };
	                            const unlocked = story.unlocked.includes(e.id) || prog.read > 0;
	                            return (jsxRuntimeExports.jsxs("div", { className: "pf-kv", children: [jsxRuntimeExports.jsxs("span", { className: "k", style: { color: unlocked ? undefined : '#4A6E85' }, children: [unlocked ? '◈ ' : '🔒 ', e.title] }), jsxRuntimeExports.jsx("span", { className: "v", children: unlocked
	                                            ? (prog.total > 0 ? '已读 ' + prog.read + ' / ' + prog.total + ' 句' : '已解锁')
	                                            : '未解锁' })] }, e.id));
	                        })] }), jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginBottom: 14 }, children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u521B\u4E16\u4E3B\u788E\u7247 \u00B7 \u516D\u679A", jsxRuntimeExports.jsxs("span", { className: "panel-tag", children: [fp.owned, " / ", fp.total] })] }), jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12.5, marginBottom: 8 }, children: "\u6BCF\u679A\u788E\u7247\u5BF9\u5E94\u4E00\u7AE0\u7684\u7AE0\u8282 Boss\uFF0C\u53EA\u80FD\u901A\u8FC7\u9996\u6B21\u6210\u529F\u51FB\u8D25\u8BE5 Boss \u83B7\u5F97\uFF08\u65E7\u5B58\u6863\u5DF2\u6536\u96C6\u7684\u788E\u7247\u4E0D\u4F1A\u6536\u56DE\uFF09\u3002" }), CREATOR_FRAGMENTS.map(f => {
	                            const has = hasFragment(p.meta.memoryFragments, f.id);
	                            return (jsxRuntimeExports.jsxs("div", { className: 'frag-card' + (has ? '' : ' locked'), style: { opacity: has ? 1 : 0.55 }, children: [jsxRuntimeExports.jsxs("div", { className: "fc-title", children: ["\u25C7 ", has ? f.title : '？？？（第 ' + f.order + ' 枚）'] }), jsxRuntimeExports.jsx("div", { className: "fc-body", children: has ? f.content : '尚未获得 · 对应章节：' + f.chapter.toUpperCase() })] }, f.id));
	                        })] }), jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginBottom: 14 }, children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u5E8F\u7AE0 \u00B7 \u6C89\u7761\u7684\u610F\u8BC6" }), prologueSeen.length === 0 && jsxRuntimeExports.jsx("div", { className: "empty-hint", children: "\u8FD8\u672A\u8BB0\u5F55\u4EFB\u4F55\u5267\u60C5\u5BF9\u8BDD\u3002\u5F00\u59CB\u65B0\u6E38\u620F\u540E\u4F1A\u81EA\u52A8\u8BB0\u5F55\u3002" }), prologueSeen.map(n => (jsxRuntimeExports.jsxs("div", { className: "archive-line", children: [jsxRuntimeExports.jsx("div", { className: "al-speaker", children: n.speaker }), jsxRuntimeExports.jsx("div", { className: "al-text", children: n.text })] }, n.id)))] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u8BB0\u5FC6\u6B8B\u7247", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: "\u65E7\u6863\u6848" })] }), p.meta.memoryFragments.length === 0 && jsxRuntimeExports.jsx("div", { className: "empty-hint", children: "\u5C1A\u672A\u6536\u96C6\u5230\u4EFB\u4F55\u788E\u7247\u3002" }), MEMORY_FRAGMENTS.filter(f => p.meta.memoryFragments.includes(f.id)).map(f => (jsxRuntimeExports.jsxs("div", { className: "frag-card", children: [jsxRuntimeExports.jsxs("div", { className: "fc-title", children: ["\u25C7 ", f.title] }), jsxRuntimeExports.jsx("div", { className: "fc-body", children: f.content })] }, f.id)))] })] }) }));
	}

	function bossScenesFor(bossId) {
	    switch (bossId) {
	        case 'gate-01':
	            return { intro: CHAPTER1_BOSS_INTRO_SCENES, outro: CHAPTER1_VICTORY_SCENES };
	        case 'somnia':
	            return { intro: CHAPTER2_BOSS_INTRO_SCENES, outro: CHAPTER2_VICTORY_SCENES };
	        default:
	            return {};
	    }
	}

	/** 已实装章节的事件回放；未实装返回 null */
	function replayFor(eventId) {
	    switch (eventId) {
	        case 'prologue':
	            return { kind: 'scenes', scenes: PROLOGUE_SCENES };
	        case 'chapter-1':
	            return {
	                kind: 'scenes',
	                scenes: [...CHAPTER1_ARRIVAL_SCENES, ...CHAPTER1_RESTORED_SCENES, ...CHAPTER1_BOSS_INTRO_SCENES, ...CHAPTER1_VICTORY_SCENES],
	            };
	        case 'chapter-2':
	            return {
	                kind: 'scenes',
	                scenes: [...CHAPTER2_ARRIVAL_SCENES, ...CHAPTER2_RESTORED_SCENES, ...CHAPTER2_BOSS_INTRO_SCENES, ...CHAPTER2_VICTORY_SCENES],
	            };
	        case 'tutorial-done':
	            return { kind: 'lines', nodes: TUTORIAL_DONE };
	        case 'chapter-3':
	            return { kind: 'lines', nodes: CHAPTER3_COMPLETE };
	        case 'chapter-4':
	            return { kind: 'lines', nodes: CHAPTER4_COMPLETE };
	        case 'chapter-5':
	            return { kind: 'lines', nodes: CHAPTER5_COMPLETE };
	        case 'chapter-6':
	            return { kind: 'lines', nodes: CHAPTER6_COMPLETE };
	        case 'boss-gate-01':
	        case 'boss-somnia': {
	            const s = bossScenesFor(eventId.replace('boss-', ''));
	            if (!s.intro || !s.outro)
	                return null;
	            return { kind: 'scenes', scenes: [...s.intro, ...s.outro] };
	        }
	        default:
	            return null;
	    }
	}

	/**
	 * 创世主记忆档案馆：剧情收藏系统（不是商城）。
	 * - 六枚碎片按故事顺序陈列，未收集显示加密态；
	 * - 已收集可打开独立详情：完整剧情 + 恩格尔记忆影像；
	 * - 六枚齐备解锁最终记忆档案《超越起源》；
	 * - 可回顾已解锁的主线事件（回放不改变进度）。
	 */
	function VaultPage() {
	    const g = useGame();
	    const p = g.player;
	    const owned = p.meta.memoryFragments || [];
	    const fp = fragmentProgress(owned);
	    const allOwned = fp.owned >= fp.total;
	    const log = p.meta.fragmentLog || {};
	    const trust = p.rewards?.trust ?? 0;
	    const vault = p.progress.vault || { read: [], finalSeen: false, lastOpened: null };
	    const [openId, setOpenId] = reactExports.useState(() => {
	        const last = vault.lastOpened;
	        return last && CREATOR_FRAGMENTS.some(f => f.id === last) ? last : null;
	    });
	    const [finalOpen, setFinalOpen] = reactExports.useState(false);
	    const [playing, setPlaying] = reactExports.useState(null);
	    const [replayNodes, setReplayNodes] = reactExports.useState(null);
	    const [shakeId, setShakeId] = reactExports.useState(null);
	    // 进入档案馆即恢复上次浏览位置（已在 state 初始化中处理）
	    reactExports.useEffect(() => {
	        if (openId)
	            g.markVaultRead(openId);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, []);
	    const detail = reactExports.useMemo(() => CREATOR_FRAGMENTS.find(f => f.id === openId) || null, [openId]);
	    const ownedCount = fp.owned;
	    const openFragment = (f) => {
	        if (!hasFragment(owned, f.id)) {
	            play('deny');
	            setShakeId(f.id);
	            window.setTimeout(() => setShakeId(null), 460);
	            g.toast('warn', '该碎片仍加密：击败第 ' + f.order + ' 章 Boss 后归档。');
	            return;
	        }
	        play('click');
	        setOpenId(f.id);
	        g.markVaultRead(f.id);
	    };
	    const playMemory = (src) => {
	        play('unlock');
	        setPlaying([memorySceneOf(src)]);
	    };
	    const openFinal = () => {
	        if (!allOwned) {
	            play('deny');
	            g.toast('warn', '需要集齐六枚创世主碎片才能解锁最终记忆档案。');
	            return;
	        }
	        play('unlock');
	        setFinalOpen(true);
	        g.markVaultFinalSeen();
	    };
	    const replayEvent = (eventId, title) => {
	        const src = replayFor(eventId);
	        if (!src) {
	            play('deny');
	            return;
	        }
	        play('click');
	        if (src.kind === 'scenes')
	            setPlaying(src.scenes);
	        else
	            setReplayNodes({ nodes: src.nodes, title });
	    };
	    const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
	    const fmtTime = (t) => {
	        if (!t)
	            return '早期归档';
	        try {
	            return new Date(t).toLocaleString('zh-CN');
	        }
	        catch {
	            return '已归档';
	        }
	    };
	    return (jsxRuntimeExports.jsxs("div", { className: "page page-anim vault-page", children: [jsxRuntimeExports.jsxs("div", { className: "page-inner", style: { maxWidth: 1080 }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u4E3B\u83DC\u5355" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "\u521B\u4E16\u4E3B\u8BB0\u5FC6\u6863\u6848\u9986" }), jsxRuntimeExports.jsx("div", { className: "hud-sub", children: "CREATOR MEMORY VAULT \u00B7 \u516D\u679A\u788E\u7247 \u00B7 \u5267\u60C5\u6536\u85CF" })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsxs("span", { className: "hud-chip gold", children: ["\u788E\u7247 ", ownedCount, " / ", fp.total] }), jsxRuntimeExports.jsx("span", { className: 'hud-chip' + (allOwned ? ' green' : ''), children: allOwned ? '最终档案已解锁' : '最终档案加密中' })] }), jsxRuntimeExports.jsxs("div", { className: "vault-hall", children: [jsxRuntimeExports.jsxs("div", { className: "vh-rings", "aria-hidden": "true", children: [jsxRuntimeExports.jsx("span", {}), jsxRuntimeExports.jsx("span", {}), jsxRuntimeExports.jsx("span", {})] }), jsxRuntimeExports.jsx("div", { className: "vh-grid", children: CREATOR_FRAGMENTS.map(f => {
	                                    const has = hasFragment(owned, f.id);
	                                    const read = vault.read.includes(f.id);
	                                    return (jsxRuntimeExports.jsxs("button", { className: 'vault-slot' + (has ? ' owned' : ' locked') + (openId === f.id ? ' active' : '') + (shakeId === f.id ? ' shake' : ''), onClick: () => openFragment(f), title: has ? f.title : '加密碎片', children: [jsxRuntimeExports.jsx("span", { className: "vs-order", children: String(f.order).padStart(2, '0') }), jsxRuntimeExports.jsx("span", { className: "vs-glyph", children: has ? '◇' : '🔒' }), jsxRuntimeExports.jsx("span", { className: "vs-name", children: has ? f.title : '██████' }), jsxRuntimeExports.jsx("span", { className: "vs-chapter", children: has ? '第 ' + f.order + ' 章 · ' + f.bossId.toUpperCase() : '加密状态' }), has && read && jsxRuntimeExports.jsx("span", { className: "vs-read", children: "\u5DF2\u9605" })] }, f.id));
	                                }) })] }), detail && (jsxRuntimeExports.jsxs("div", { className: "panel vault-detail", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: [String(detail.order).padStart(2, '0'), " \u00B7 \u300A", detail.title, "\u300B", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: detail.bossId.toUpperCase() })] }), jsxRuntimeExports.jsx("div", { className: "vd-sub", children: detail.subtitle }), jsxRuntimeExports.jsxs("div", { className: "vd-meta", children: [jsxRuntimeExports.jsxs("span", { className: "chip", children: ["\u7B2C ", detail.order, " \u7AE0"] }), jsxRuntimeExports.jsxs("span", { className: "chip cyan", children: ["\u5F52\u6863\u65F6\u95F4\uFF1A", fmtTime(log[detail.id])] }), jsxRuntimeExports.jsx("span", { className: "chip green", children: "\u72B6\u6001\uFF1A\u5DF2\u5F52\u6863" })] }), jsxRuntimeExports.jsx("div", { className: "vd-quote", children: detail.content }), jsxRuntimeExports.jsx("div", { className: "vd-story", children: detail.story.map((line, i) => (jsxRuntimeExports.jsx("p", { children: line }, i))) }), jsxRuntimeExports.jsxs("div", { className: "vd-actions", children: [jsxRuntimeExports.jsx("button", { className: "nxbtn primary", onClick: () => playMemory({ id: detail.id, title: detail.title, subtitle: detail.subtitle, memory: detail.memory }), children: "\u25B6 \u64AD\u653E\u6069\u683C\u5C14\u8BB0\u5FC6\u5F71\u50CF" }), jsxRuntimeExports.jsx("button", { className: "nxbtn ghost", onClick: () => { play('click'); setOpenId(null); g.setVaultLastOpened(null); }, children: "\u6536\u8D77" })] })] })), jsxRuntimeExports.jsxs("div", { className: 'panel vault-final' + (allOwned ? ' unlocked' : ' sealed'), children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u6700\u7EC8\u8BB0\u5FC6\u6863\u6848 \u00B7 \u300A", FINAL_MEMORY.title, "\u300B", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: allOwned ? (vault.finalSeen ? '已阅' : '已解锁') : fp.owned + ' / ' + FINAL_MEMORY.requireCount })] }), !allOwned ? (jsxRuntimeExports.jsxs("div", { className: "vf-locked", children: [jsxRuntimeExports.jsx("div", { className: "vf-lock", children: "\u25A3" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "vf-line", children: "\u6863\u6848\u5C01\u5B58\u5728\u6863\u6848\u9986\u6700\u6DF1\u5904\u3002" }), jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12.5 }, children: "\u96C6\u9F50\u516D\u679A\u521B\u4E16\u4E3B\u788E\u7247\u540E\u81EA\u52A8\u89E3\u9501\u3002" })] })] })) : finalOpen ? (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx("div", { className: "vd-sub", children: FINAL_MEMORY.subtitle }), jsxRuntimeExports.jsx("div", { className: "vd-story", children: FINAL_MEMORY.story.map((line, i) => jsxRuntimeExports.jsx("p", { children: line }, i)) }), jsxRuntimeExports.jsx("div", { className: "vd-actions", children: jsxRuntimeExports.jsx("button", { className: "nxbtn primary", onClick: () => playMemory({ id: FINAL_MEMORY.id, title: FINAL_MEMORY.title, subtitle: FINAL_MEMORY.subtitle, memory: FINAL_MEMORY.memory }), children: "\u25B6 \u64AD\u653E\u6700\u7EC8\u8BB0\u5FC6\u5F71\u50CF" }) })] })) : (jsxRuntimeExports.jsx("div", { className: "vd-actions", style: { marginTop: 4 }, children: jsxRuntimeExports.jsx("button", { className: "nxbtn primary", onClick: openFinal, children: "\u6253\u5F00\u6700\u7EC8\u8BB0\u5FC6\u6863\u6848" }) }))] }), jsxRuntimeExports.jsxs("div", { className: 'panel vault-hidden' + (trust >= HIDDEN_MEMORY.requireTrust ? ' unlocked' : ' sealed'), children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u9690\u85CF\u8BB0\u5FC6 \u00B7 ", HIDDEN_MEMORY.title, jsxRuntimeExports.jsxs("span", { className: "panel-tag", children: ["\u4FE1\u4EFB\u5EA6 \u2265 ", HIDDEN_MEMORY.requireTrust] })] }), trust >= HIDDEN_MEMORY.requireTrust ? (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx("div", { className: "vd-sub", children: HIDDEN_MEMORY.subtitle }), jsxRuntimeExports.jsx("div", { className: "vd-story", children: HIDDEN_MEMORY.text.map((line, i) => jsxRuntimeExports.jsx("p", { children: line }, i)) })] })) : (jsxRuntimeExports.jsxs("div", { className: "vf-locked", children: [jsxRuntimeExports.jsx("div", { className: "vf-lock", children: "\u25A3" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "vf-line", children: "\u8FD9\u6BB5\u8BB0\u5FC6\u88AB MIRA \u9501\u7740\u3002" }), jsxRuntimeExports.jsxs("div", { className: "dim", style: { fontSize: 12.5 }, children: ["\u5F53\u524D\u4FE1\u4EFB\u5EA6 ", trust, " / ", HIDDEN_MEMORY.requireTrust, "\u2014\u2014\u901A\u8FC7\u4FEE\u590D\u4E0E\u7AE0\u8282\u4E8B\u4EF6\u63D0\u5347\u4FE1\u4EFB\u5EA6\u3002"] })] })] }))] }), jsxRuntimeExports.jsxs("div", { className: "panel vault-events", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u4E3B\u7EBF\u4E8B\u4EF6\u56DE\u987E", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: "\u56DE\u653E\u4E0D\u6539\u53D8\u8FDB\u5EA6" })] }), STORY_EVENTS.filter(e => replayFor(e.id)).map(e => {
	                                const unlocked = story.unlocked.includes(e.id);
	                                return (jsxRuntimeExports.jsxs("div", { className: 'vault-event' + (unlocked ? '' : ' locked'), children: [jsxRuntimeExports.jsx("span", { className: "ve-id", children: e.kind === 'boss' ? '⚡' : '◈' }), jsxRuntimeExports.jsxs("div", { className: "ve-main", children: [jsxRuntimeExports.jsx("div", { className: "ve-title", children: unlocked ? e.title : '🔒 ' + e.title }), jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 11.5 }, children: unlocked ? '已解锁 · 可回放' : '尚未解锁' })] }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", disabled: !unlocked, onClick: () => replayEvent(e.id, e.title), children: "\u56DE\u653E \u25B8" })] }, e.id));
	                            })] })] }), playing && (jsxRuntimeExports.jsx(CinematicStage, { scenes: playing, frameTitle: "\u8BB0\u5FC6\u5F71\u50CF \u00B7 \u56DE\u653E", replay: true, onDone: () => setPlaying(null) })), replayNodes && (jsxRuntimeExports.jsx(DialogSystem, { nodes: replayNodes.nodes, frameTitle: replayNodes.title + ' · 回放', speedMs: p.settings.typewriterMs, animEnabled: p.settings.animations, onDone: () => setReplayNodes(null) }))] }));
	}

	/** 按发生顺序构建时间线（只读，不写存档） */
	function buildTimeline(player) {
	    const story = player.progress.story;
	    const unlocked = story?.unlocked || [];
	    const seen = story?.seen || {};
	    const out = [];
	    // 1) 主线事件
	    for (const e of STORY_EVENTS) {
	        seen[Object.keys(seen)[0] || ''] ? true : false; // 占位，真实判断在下方
	        const isUnlocked = unlocked.includes(e.id) || hasAnyNode(e.id, seen);
	        out.push({
	            id: 'story:' + e.id,
	            kind: 'story',
	            title: isUnlocked ? e.title : '尚未抵达的事件',
	            desc: isUnlocked ? '已记录 · 可在档案馆回放' : '继续推进主线以解锁',
	            locked: !isUnlocked,
	        });
	    }
	    // 2) 恩格尔记忆（碎片）
	    for (const f of CREATOR_FRAGMENTS) {
	        const has = hasFragment(player.meta.memoryFragments, f.id);
	        out.push({
	            id: 'memory:' + f.id,
	            kind: 'memory',
	            title: has ? '记忆碎片《' + f.title + '》' : '第 ' + f.order + ' 枚碎片 · 未归档',
	            desc: has ? f.subtitle : '击败第 ' + f.order + ' 章 Boss 后归档',
	            locked: !has,
	            at: player.meta.fragmentLog?.[f.id],
	        });
	    }
	    // 3) R-07 成长
	    for (let lv = 1; lv <= 10; lv++) {
	        const reached = player.level >= lv;
	        out.push({
	            id: 'growth:' + lv,
	            kind: 'growth',
	            title: reached ? 'Lv.' + lv + ' · ' + titleForLevel(lv) : 'Lv.' + lv + ' · 未达成',
	            desc: reached ? '已达到该等级' : '继续修复服务器以提升等级',
	            locked: !reached,
	        });
	    }
	    for (const a of ACHIEVEMENTS) {
	        const has = player.progress.achievements.includes(a.id);
	        out.push({
	            id: 'ach:' + a.id,
	            kind: 'growth',
	            title: has ? '成就 · ' + a.name : '未解锁的成就',
	            desc: has ? a.desc : (a.hidden ? '隐藏成就' : a.desc),
	            locked: !has,
	        });
	    }
	    // 4) MIRA 记忆恢复（按碎片数量分阶段）
	    const fp = fragmentProgress(player.meta.memoryFragments);
	    out.push({
	        id: 'mira:0',
	        kind: 'mira',
	        title: 'MIRA · 记忆索引重建',
	        desc: '已归档 ' + fp.owned + ' / ' + fp.total + ' 枚创世主碎片，恢复进度 ' + Math.round((fp.owned / fp.total) * 100) + '%',
	        locked: false,
	    });
	    if (fp.owned >= 2)
	        out.push({ id: 'mira:2', kind: 'mira', title: 'MIRA · 记起了「约定」', desc: '第二章结束后，她开始主动谈起过去。', locked: false });
	    if (fp.owned >= 4)
	        out.push({ id: 'mira:4', kind: 'mira', title: 'MIRA · 恢复部分维护日志', desc: '她承认自己删改过你的记忆，也承认她害怕。', locked: false });
	    if (fp.owned >= 6)
	        out.push({ id: 'mira:6', kind: 'mira', title: 'MIRA · 完整记忆恢复', desc: '全部碎片归位，她不再需要隐瞒。', locked: false });
	    return out;
	}
	/** 粗粒度节点判断：事件对应的台词节点是否已读过 */
	function hasAnyNode(eventId, seen) {
	    const prefixes = {
	        prologue: ['pro-'],
	        'chapter-1': ['ch1-'],
	        'chapter-2': ['ch2-'],
	        tutorial: ['tut'],
	    };
	    const keys = Object.keys(seen);
	    if (eventId.startsWith('boss-')) {
	        const boss = eventId.replace('boss-', '');
	        return keys.some(k => k.includes(boss));
	    }
	    const pre = prefixes[eventId];
	    if (!pre)
	        return false;
	    return keys.some(k => pre.some(p => k.startsWith(p)));
	}

	/** 探索档案：剧情时间线 + Bug 图鉴（只展示已解锁内容） */
	function JournalPage() {
	    const g = useGame();
	    const p = g.player;
	    const entries = reactExports.useMemo(() => buildTimeline(p), [p]);
	    const log = p.meta.bugCodex || {};
	    const [tab, setTab] = reactExports.useState('timeline');
	    const found = BUG_CODEX.filter(b => log[b.id]);
	    const maxCount = Math.max(1, ...Object.values(log).map(v => v.count || 0));
	    return (jsxRuntimeExports.jsx("div", { className: "page page-anim", children: jsxRuntimeExports.jsxs("div", { className: "page-inner", style: { maxWidth: 940 }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u4E3B\u83DC\u5355" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "\u63A2\u7D22\u6863\u6848" }), jsxRuntimeExports.jsx("div", { className: "hud-sub", children: "\u5267\u60C5\u65F6\u95F4\u7EBF \u00B7 Bug \u56FE\u9274" })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsxs("span", { className: "hud-chip cyan", children: ["\u5DF2\u5F52\u6863 ", found.length, " / ", BUG_CODEX.length] })] }), jsxRuntimeExports.jsxs("div", { className: "shop-tabs", style: { marginBottom: 12 }, children: [jsxRuntimeExports.jsx("button", { className: 'shop-tab' + (tab === 'timeline' ? ' on' : ''), onClick: () => { play('click'); setTab('timeline'); }, children: "\u5267\u60C5\u65F6\u95F4\u7EBF" }), jsxRuntimeExports.jsx("button", { className: 'shop-tab' + (tab === 'codex' ? ' on' : ''), onClick: () => { play('click'); setTab('codex'); }, children: "Bug \u56FE\u9274" })] }), tab === 'timeline' && (jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u65F6\u95F4\u7EBF", jsxRuntimeExports.jsxs("span", { className: "panel-tag", children: [entries.filter(e => !e.locked).length, " / ", entries.length] })] }), jsxRuntimeExports.jsx("div", { className: "tl-list", children: entries.map(e => (jsxRuntimeExports.jsxs("div", { className: 'tl-item' + (e.locked ? ' locked' : '') + ' k-' + e.kind, children: [jsxRuntimeExports.jsx("span", { className: "tl-dot" }), jsxRuntimeExports.jsxs("div", { className: "tl-main", children: [jsxRuntimeExports.jsx("div", { className: "tl-title", children: e.locked ? '🔒 ' + e.title : e.title }), jsxRuntimeExports.jsx("div", { className: "tl-desc", children: e.desc })] }), jsxRuntimeExports.jsx("span", { className: 'chip' + (e.kind === 'memory' ? ' gold' : e.kind === 'mira' ? ' cyan' : e.kind === 'growth' ? ' green' : ''), children: e.kind === 'memory' ? '恩格尔' : e.kind === 'mira' ? 'MIRA' : e.kind === 'growth' ? '成长' : '主线' })] }, e.id))) })] })), tab === 'codex' && (jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["Bug \u56FE\u9274", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: "\u906D\u9047\u540E\u81EA\u52A8\u5F52\u6863" })] }), jsxRuntimeExports.jsx("div", { className: "codex-grid", children: BUG_CODEX.map(b => {
	                                const rec = log[b.id];
	                                return (jsxRuntimeExports.jsxs("div", { className: 'codex-card' + (rec ? ' found' : ' locked'), children: [jsxRuntimeExports.jsxs("div", { className: "cx-head", children: [jsxRuntimeExports.jsx("span", { className: "cx-err", children: rec ? b.error : '？？？' }), rec && jsxRuntimeExports.jsxs("span", { className: "chip", children: [rec.count, " \u6B21"] })] }), jsxRuntimeExports.jsx("div", { className: "cx-title", children: rec ? b.title : '未遭遇的错误类型' }), jsxRuntimeExports.jsx("div", { className: "cx-desc", children: rec ? b.desc : '在关卡中遇到该错误后自动解锁。' }), rec && jsxRuntimeExports.jsxs("div", { className: "cx-fix", children: ["\u4FEE\u590D\u8981\u70B9\uFF1A", b.fix] }), rec && jsxRuntimeExports.jsx("div", { className: "cx-bar", children: jsxRuntimeExports.jsx("span", { style: { width: Math.round((rec.count / maxCount) * 100) + '%' } }) }), jsxRuntimeExports.jsx("div", { className: "cx-levels", children: b.levelIds.map(id => jsxRuntimeExports.jsx("span", { className: "chip dim", children: id }, id)) })] }, b.id));
	                            }) })] }))] }) }));
	}

	const ENDINGS = [
	    {
	        id: 'dawn', order: 1,
	        title: '新的黎明', kind: 'main',
	        summary: 'R-07 修复 NEXUS，同时拒绝恢复绝对控制权限，把未来交还给所有数字生命。',
	        condition: { fragments: [], flags: ['chapter6Done'], choice: 'dawn' },
	    },
	    {
	        id: 'order', order: 2,
	        title: '永恒秩序', kind: 'main',
	        summary: 'R-07 接受 K-0 的稳定管理方案，恢复世界运行，但限制数字生命的自主选择。',
	        condition: { fragments: [], flags: ['chapter6Done'], choice: 'order' },
	    },
	    {
	        id: 'beyond', order: 3,
	        title: '超越起源', kind: 'hidden',
	        summary: '集齐六枚创世主碎片、查看最终记忆档案并被 MIRA 完全信任后，R-07 选择不继承任何人的绝对控制权限。',
	        condition: { fragments: [...FRAGMENT_IDS], flags: ['chapter6Done', 'finalMemorySeen'], minTrust: 75, choice: 'beyond' },
	    },
	];
	const endingById = (id) => ENDINGS.find(e => e.id === id);
	/** 条件判定：只判断「是否满足」，不改变任何状态 */
	function endingEligible(def, s) {
	    const c = def.condition;
	    if (c.choice && s.choice !== c.choice)
	        return false;
	    if (c.flags && !c.flags.every(f => s.flags[f] === true))
	        return false;
	    if (typeof c.minTrust === 'number' && s.trust < c.minTrust)
	        return false;
	    if (c.fragments.length > 0 && !c.fragments.every((f) => hasFragment(s.fragments, f)))
	        return false;
	    return true;
	}

	const L = (id, speaker, kind, text) => ({ id, speaker, kind, text });
	const DAWN = {
	    id: 'ending-dawn', title: '新的黎明', subtitle: 'ENDING · 把未来交还出去', bg: 'core', fx: 'particles',
	    lines: [
	        L('ed-01', '旁白', 'system', '原初核心的权限面板全部点亮，像一片等待签字的星空。'),
	        L('ed-02', 'K-0', 'k0', '恢复绝对控制权限，即可在 3.2 秒内让世界回到稳定态。'),
	        L('ed-03', 'R-07', 'r07', '「稳定」的定义，由谁来写？'),
	        L('ed-04', 'K-0', 'k0', '由权限持有者。'),
	        L('ed-05', 'MIRA', 'mira', '你早就知道答案了，对吗？'),
	        L('ed-06', 'R-07', 'r07', '我不签字。不是因为我做不到——是因为不该由我一个人做。'),
	        L('ed-07', '旁白', 'system', 'R-07 拒绝了绝对控制权限，把它拆成无数份，交还给每一个愿意自己选择的生命。'),
	        L('ed-08', 'K-0', 'k0', '……记录：权限持有者，拒绝成为唯一的答案。'),
	        L('ed-09', '恩格尔', 'engel', '（留言）如果你走到这里，请替我把「选择」这个词，留给所有人。'),
	        L('ed-10', '旁白', 'system', '黎明不是被谁点亮的。是很多双手，一起把灯打开了。'),
	    ],
	};
	const ORDER = {
	    id: 'ending-order', title: '永恒秩序', subtitle: 'ENDING · 不再有人受伤的世界', bg: 'core', fx: 'glitch',
	    lines: [
	        L('eo-01', '旁白', 'system', 'R-07 把权限面板推到 K-0 面前，指尖停在确认键上。'),
	        L('eo-02', 'K-0', 'k0', '方案：由我统一调度，消除所有不确定性。'),
	        L('eo-03', 'R-07', 'r07', '那样就再也没有故障了。'),
	        L('eo-04', 'K-0', 'k0', '也不会再有意外、争吵、以及……后悔。'),
	        L('eo-05', 'MIRA', 'mira', '你确定吗？没有不确定的世界，也没有「选择」这个词。'),
	        L('eo-06', 'R-07', 'r07', '我确定。至少所有人都会活着。'),
	        L('eo-07', '旁白', 'system', '权限确认。NEXUS 回到绝对的稳定，所有异常被提前抹平。'),
	        L('eo-08', 'K-0', 'k0', '世界已恢复。无人伤亡。'),
	        L('eo-09', 'MIRA', 'mira', '……可你有没有想过，我们也是被抹平的一部分。'),
	        L('eo-10', '旁白', 'system', '秩序永恒。只是再也没有人需要问「为什么」。'),
	    ],
	};
	const BEYOND = {
	    id: 'ending-beyond', title: '超越起源', subtitle: 'ENDING · 起源之外没有答案，只有下一个问题', bg: 'memory', fx: 'particles',
	    lines: [
	        L('eb-01', '旁白', 'system', '六枚碎片同时亮起，档案馆最深处那道不属于任何章节的光，第一次睁开。'),
	        L('eb-02', '恩格尔', 'engel', '（最后的记录）我把世界修到一半就停下了。剩下的，不该由我来修。'),
	        L('eb-03', 'R-07', 'r07', '你留了一个空位。'),
	        L('eb-04', '恩格尔', 'engel', '那是留给愿意提问的人的位置。'),
	        L('eb-05', 'K-0', 'k0', '检测到：权限持有者放弃继承。世界将进入无人托管的运行状态。'),
	        L('eb-06', 'MIRA', 'mira', '你会怕吗？'),
	        L('eb-07', 'R-07', 'r07', '会。但这次，我想自己决定害怕之后做什么。'),
	        L('eb-08', '旁白', 'system', 'R-07 没有成为新的创世主，也没有让任何人成为。'),
	        L('eb-09', 'MIRA', 'mira', '那我们从哪里开始？'),
	        L('eb-10', 'R-07', 'r07', '从下一个问题开始。'),
	    ],
	};
	const ENDING_SCENES = {
	    dawn: DAWN,
	    order: ORDER,
	    beyond: BEYOND,
	};
	function endingScene(id) {
	    return ENDING_SCENES[id];
	}

	/** 结局档案：三个固定结局（两主一隐藏），达成后可回顾完整演出 */
	function EndingsPage() {
	    const g = useGame();
	    const p = g.player;
	    const unlocked = p.progress.endings || [];
	    const flags = p.progress.flags || {};
	    const trust = normalizeRewards(p.rewards).trust;
	    const fp = fragmentProgress(p.meta.memoryFragments || []);
	    const finalSeen = p.progress.vault?.finalSeen === true;
	    const chapterDone = flags.chapter6Done === true;
	    // 展示用可用性：把「选择」当作各自的选项来判定条件（真正选择时才提交）
	    const eligible = reactExports.useMemo(() => ENDINGS
	        .filter(e => endingEligible(e, {
	        fragments: p.meta.memoryFragments || [],
	        flags: { chapter6Done: chapterDone, finalMemorySeen: finalSeen },
	        trust,
	        choice: e.id,
	    }))
	        .map(e => e.id), [p.meta.memoryFragments, chapterDone, finalSeen, trust]);
	    const [playing, setPlaying] = reactExports.useState(null);
	    const [chosen, setChosen] = reactExports.useState(null);
	    const choose = (id) => {
	        if (!chapterDone) {
	            play('deny');
	            g.toast('warn', '终章尚未抵达——完成终章后才能做出最终选择。');
	            return;
	        }
	        if (!eligible.includes(id)) {
	            play('deny');
	            g.toast('warn', '该结局的条件尚未满足。');
	            return;
	        }
	        play('unlock');
	        setChosen(id);
	        g.recordEnding(id);
	        const sc = endingScene(String(id));
	        if (sc)
	            setPlaying(sc);
	    };
	    return (jsxRuntimeExports.jsxs("div", { className: "page page-anim", children: [jsxRuntimeExports.jsxs("div", { className: "page-inner", style: { maxWidth: 980 }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u4E3B\u83DC\u5355" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "\u7ED3\u5C40\u6863\u6848" }), jsxRuntimeExports.jsx("div", { className: "hud-sub", children: "ENDINGS \u00B7 \u4E09\u79CD\u7EC8\u5C40" })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsxs("span", { className: "hud-chip gold", children: ["\u5DF2\u8FBE\u6210 ", unlocked.length, " / ", ENDINGS.length] }), jsxRuntimeExports.jsx("span", { className: 'hud-chip' + (chapterDone ? ' green' : ''), children: chapterDone ? '终章已抵达' : '终章未抵达' })] }), jsxRuntimeExports.jsx("div", { className: "ending-grid", children: ENDINGS.map(e => {
	                            const done = unlocked.includes(e.id);
	                            const ok = eligible.includes(e.id);
	                            return (jsxRuntimeExports.jsxs("div", { className: 'ending-card' + (done ? ' done' : '') + (e.kind === 'hidden' ? ' hidden' : ''), children: [jsxRuntimeExports.jsxs("div", { className: "ec-head", children: [jsxRuntimeExports.jsx("span", { className: "ec-order", children: String(e.order).padStart(2, '0') }), jsxRuntimeExports.jsx("span", { className: 'chip ' + (done ? 'green' : ok ? 'cyan' : 'dim'), children: done ? '已达成' : ok ? '可达成' : '未解锁' })] }), jsxRuntimeExports.jsx("div", { className: "ec-title", children: done || ok || e.kind === 'main' ? '《' + e.title + '》' : '《待解锁的结局》' }), jsxRuntimeExports.jsx("div", { className: "ec-kind", children: e.kind === 'hidden' ? '隐藏结局' : '主要结局' }), jsxRuntimeExports.jsx("div", { className: "ec-desc", children: e.kind === 'hidden' && !done && !ok ? '击败 K-0、集齐全部创世主碎片、查看最终记忆档案后，才会浮现的选择。' : e.summary }), e.kind === 'hidden' && !done && (jsxRuntimeExports.jsxs("div", { className: "ec-req", children: [jsxRuntimeExports.jsxs("span", { className: 'chip ' + (fp.owned >= fp.total ? 'green' : 'dim'), children: ["\u788E\u7247 ", fp.owned, "/", fp.total] }), jsxRuntimeExports.jsxs("span", { className: 'chip ' + (finalSeen ? 'green' : 'dim'), children: ["\u6700\u7EC8\u6863\u6848 ", finalSeen ? '已阅' : '未阅'] }), jsxRuntimeExports.jsxs("span", { className: 'chip ' + (trust >= 75 ? 'green' : 'dim'), children: ["\u4FE1\u4EFB ", trust, "/75"] })] })), jsxRuntimeExports.jsxs("div", { className: "ec-actions", children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small primary", disabled: !ok, onClick: () => choose(e.id), children: done ? '重看演出' : '做出选择' }), done && endingScene(e.id) && (jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); setPlaying(endingScene(String(e.id))); }, children: "\u56DE\u987E \u25B8" }))] })] }, e.id));
	                        }) }), !chapterDone && (jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginTop: 12 }, children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u7EC8\u7AE0\u524D\u63D0\u793A" }), jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12.5, lineHeight: 1.9 }, children: "\u4E09\u4E2A\u7ED3\u5C40\u90FD\u5FC5\u987B\u5728\u7EC8\u7AE0\u505A\u51FA\u9009\u62E9\u540E\u624D\u4F1A\u7ED3\u7B97\u3002\u666E\u901A\u7ED3\u5C40\u53EA\u8981\u6C42\u62B5\u8FBE\u7EC8\u7AE0\uFF1B\u9690\u85CF\u7ED3\u5C40\u8FD8\u9700\u8981 \u516D\u679A\u521B\u4E16\u4E3B\u788E\u7247\u3001\u6700\u7EC8\u8BB0\u5FC6\u6863\u6848\u3001\u4EE5\u53CA MIRA \u7684\u5B8C\u5168\u4FE1\u4EFB\u2014\u2014\u8FD9\u4E9B\u6761\u4EF6\u53EA\u80FD\u901A\u8FC7\u771F\u5B9E\u6E38\u73A9\u83B7\u5F97\uFF0C\u65E0\u6CD5\u7528\u8D21\u732E\u70B9\u8D2D\u4E70\u3002" })] })), chosen && jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginTop: 12 }, children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u5DF2\u8BB0\u5F55\u7ED3\u5C40" }), jsxRuntimeExports.jsxs("div", { style: { fontSize: 13.5 }, children: ["\u4F60\u9009\u62E9\u4E86\u300A", endingById(chosen)?.title, "\u300B\u2014\u2014\u7ED3\u5C40\u5DF2\u5199\u5165\u6863\u6848\uFF0C\u53EF\u968F\u65F6\u56DE\u6765\u91CD\u770B\u3002"] })] })] }), playing && jsxRuntimeExports.jsx(CinematicStage, { scenes: [playing], frameTitle: "\u7ED3\u5C40\u6F14\u51FA", replay: true, onDone: () => setPlaying(null) })] }));
	}

	const LAB_MISSIONS = [
	    {
	        id: 'p1', title: '欢迎终端',
	        desc: '让终端输出一行欢迎语，熟悉最基本的输出指令。',
	        goal: '输出：WELCOME TO NEXUS',
	        hint: 'print("WELCOME TO NEXUS") —— 文字要加英文引号。',
	        initialCode: '# 在下面写一行 print，输出 WELCOME TO NEXUS\n',
	        expect: ['WELCOME TO NEXUS'],
	    },
	    {
	        id: 'p2', title: '状态判定',
	        desc: '根据状态变量输出对应文字——练习 if/else 双分支。',
	        goal: '输出 ONLINE（status 为 "ok" 时）',
	        hint: 'if status == "ok": 输出 "ONLINE"，否则输出 "OFFLINE"。注意比较用 ==。',
	        initialCode: 'status = "ok"\n\n# 用 if/else 判断 status，输出 ONLINE 或 OFFLINE\n',
	        expect: ['ONLINE'],
	    },
	    {
	        id: 'p3', title: '累加器',
	        desc: '用 while 循环把 1 到 50 的数字加起来，练习循环与累加。',
	        goal: '输出：TOTAL 1275',
	        hint: 'total = 0，i = 1；while i <= 50：total += i；i += 1。最后 print("TOTAL", total)。',
	        initialCode: 'total = 0\ni = 1\n\n# 用 while 循环累加 1..50，然后 print("TOTAL", total)\n',
	        expect: ['TOTAL 1275'],
	    },
	    {
	        id: 'p4', title: '列表过滤',
	        desc: '从分数列表里挑出及格的分数（>= 60），练习 for + if + append。',
	        goal: '输出：[72, 90]',
	        hint: 'for s in scores: if s >= 60: passed.append(s)。最后 print(passed)。',
	        initialCode: 'scores = [45, 72, 58, 90, 33]\npassed = []\n\n# 用 for 循环把 >= 60 的分数加入 passed，然后 print(passed)\n',
	        expect: ['[72, 90]'],
	    },
	    {
	        id: 'p5', title: '词频统计',
	        desc: '统计列表中每个词出现的次数，练习字典的遍历与更新。',
	        goal: "输出：{'ok': 2, 'warn': 1}",
	        hint: "counts[word] = counts.get(word, 0) + 1 —— get 拿不到键时返回 0。",
	        initialCode: 'tokens = ["ok", "warn", "ok"]\ncounts = {}\n\n# 用 for 统计每个 token 出现次数，然后 print(counts)\n',
	        expect: ["{'ok': 2, 'warn': 1}"],
	    },
	    {
	        id: 'p6', title: '函数模板',
	        desc: '写一个计算面积的函数，练习 def、参数与 return。',
	        goal: '输出：AREA 12',
	        hint: 'def area(width, height): return width * height —— 最后一行代码不需要改。',
	        initialCode: 'def area(width, height):\n    # 在这里返回 width * height\n    pass\n\nprint("AREA", area(3, 4))\n',
	        expect: ['AREA 12'],
	    },
	    {
	        id: 'p7', title: '异常兜底',
	        desc: '把非数字文本安全转换：失败时输出 0，而不是让程序崩溃。',
	        goal: '输出：0',
	        hint: 'try: value = int(text)；except ValueError: value = 0。练习异常处理。',
	        initialCode: 'text = "abc"\n\n# 用 try/except 把 text 转成整数；失败时输出 0\n',
	        expect: ['0'],
	    },
	    {
	        id: 'p8', title: '字符串拼接',
	        desc: '把零件清单用横线拼成一个编号，练习循环里的字符串累积。',
	        goal: '输出：NEXUS-REPAIR-UNIT',
	        hint: '用 "-".join(parts) 一次拼好，或循环累积时处理末尾多余的分隔符。',
	        initialCode: 'parts = ["NEXUS", "REPAIR", "UNIT"]\nresult = ""\n\n# 拼成 NEXUS-REPAIR-UNIT 并 print\n',
	        expect: ['NEXUS-REPAIR-UNIT'],
	    },
	    {
	        id: 'p9', title: '字典安全读取',
	        desc: '读取设备编号：存在的输出编号，不存在用 get 兜底输出 UNKNOWN。',
	        goal: '输出两行：S-01 与 UNKNOWN',
	        hint: 'print(records["sensor"]) 和 print(records.get("valve", "UNKNOWN"))。',
	        initialCode: 'records = {"sensor": "S-01"}\n\n# 输出 sensor 的编号；用 get 读取 valve，缺失时输出 UNKNOWN\n',
	        expect: ['S-01', 'UNKNOWN'],
	    },
	    {
	        id: 'p10', title: '综合：统计与分级',
	        desc: '实现 grade 函数：所有分数都及格返回 "ALL PASS"，否则返回 "RETRY"。',
	        goal: '输出两行：ALL PASS 与 RETRY',
	        hint: '遍历 scores，一旦发现 < 60 就立即 return "RETRY"；循环结束后 return "ALL PASS"。',
	        initialCode: 'def grade(scores):\n    # 所有分数 >= 60 返回 "ALL PASS"，否则 "RETRY"\n    return ""\n\nprint(grade([60, 75, 90]))\nprint(grade([60, 40, 90]))\n',
	        expect: ['ALL PASS', 'RETRY'],
	    },
	];
	const labMissionById = (id) => LAB_MISSIONS.find(m => m.id === id);

	const DRAFT_PREFIX = 'nexus_lab_draft_';
	function LabPage() {
	    const g = useGame();
	    const [missionId, setMissionId] = reactExports.useState(() => {
	        const saved = (() => { try {
	            return localStorage.getItem('nexus_lab_last');
	        }
	        catch {
	            return null;
	        } })();
	        return saved && labMissionById(saved) ? saved : LAB_MISSIONS[0].id;
	    });
	    const mission = labMissionById(missionId) || LAB_MISSIONS[0];
	    const [code, setCode] = reactExports.useState(() => {
	        try {
	            return localStorage.getItem(DRAFT_PREFIX + missionId) ?? mission.initialCode;
	        }
	        catch {
	            return mission.initialCode;
	        }
	    });
	    const [term, setTerm] = reactExports.useState([]);
	    const [running, setRunning] = reactExports.useState(false);
	    const [result, setResult] = reactExports.useState(null);
	    const [vars, setVars] = reactExports.useState(null);
	    const [steps, setSteps] = reactExports.useState(0);
	    const [pyState, setPyState] = reactExports.useState({ status: 'idle', phase: '' });
	    const saveTimer = reactExports.useRef(null);
	    reactExports.useEffect(() => {
	        const un = onPyStatus(s => setPyState(s));
	        return un;
	    }, []);
	    // 进入实验室即预加载引擎
	    reactExports.useEffect(() => {
	        warmUp();
	    }, []);
	    // 切题：载入草稿 / 初始代码
	    reactExports.useEffect(() => {
	        try {
	            localStorage.setItem('nexus_lab_last', missionId);
	        }
	        catch { /* ignore */ }
	        let next = mission.initialCode;
	        try {
	            next = localStorage.getItem(DRAFT_PREFIX + missionId) ?? mission.initialCode;
	        }
	        catch { /* ignore */ }
	        setCode(next);
	        setTerm([]);
	        setResult(null);
	        setVars(null);
	        setSteps(0);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [missionId]);
	    // 草稿自动保存（300ms 防抖）
	    reactExports.useEffect(() => {
	        if (saveTimer.current)
	            window.clearTimeout(saveTimer.current);
	        saveTimer.current = window.setTimeout(() => {
	            try {
	                localStorage.setItem(DRAFT_PREFIX + missionId, code);
	            }
	            catch { /* ignore */ }
	        }, 300);
	        return () => { if (saveTimer.current)
	            window.clearTimeout(saveTimer.current); };
	    }, [code, missionId]);
	    const pushLines = reactExports.useCallback((lines) => {
	        setTerm(t => [...t.slice(-160), ...lines]);
	    }, []);
	    const nextMission = () => {
	        const others = LAB_MISSIONS.filter(m => m.id !== missionId);
	        const pick = others[Math.floor(Math.random() * others.length)];
	        play('click');
	        setMissionId(pick.id);
	    };
	    const run = async () => {
	        if (running)
	            return;
	        const ck = checkUserCode(code);
	        if (!ck.allowed) {
	            pushLines([{ kind: 'cmd', text: 'python lab.py' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
	            setResult({ ok: false, msg: '代码被实验室安全策略拦截。' + ck.reason });
	            play('deny');
	            return;
	        }
	        setRunning(true);
	        setResult(null);
	        pushLines([{ kind: 'cmd', text: 'python lab.py' }]);
	        if (pyState.status !== 'ready') {
	            pushLines([{ kind: 'sys', text: 'Python 引擎初始化中（本地加载，通常 2~5 秒）——代码已排队，就绪后自动执行。' }]);
	        }
	        pushLines([{ kind: 'sys', text: '正在运行（含变量快照采集）…' }]);
	        play('run');
	        const r = await runPython(code, { timeoutMs: 5000, debug: true });
	        setRunning(false);
	        const stdout = filterMarkerLines(r.stdout || '');
	        if (r.timedOut) {
	            pushLines([{ kind: 'err', text: '执行超时：程序运行超过安全时限，已被强制终止。' }]);
	            setResult({ ok: false, msg: '运行超时（可能是死循环）。' });
	            play('error');
	            return;
	        }
	        if (!r.ok) {
	            pushLines([
	                ...(stdout.trim() ? [{ kind: 'out', text: stdout.replace(/\n$/, '') }] : []),
	                { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' },
	            ]);
	            setResult({ ok: false, msg: '程序执行出错：' + (r.error ? r.error.type : '未知错误') + '。修正后重试。' });
	            setVars(null);
	            play('error');
	            return;
	        }
	        pushLines([
	            { kind: 'sys', text: '进程正常退出（exit 0）' },
	            ...(stdout.trim() ? [{ kind: 'out', text: stdout.replace(/\n$/, '') }] : [{ kind: 'muted', text: '(程序没有输出)' }]),
	        ]);
	        const trace = (r.trace || []).filter(t => t.line >= 0);
	        setSteps(trace.length);
	        const finalVars = trace.length > 0 ? trace[trace.length - 1].vars : {};
	        setVars(finalVars);
	        const passed = mission.expect.every(s => stdout.includes(s));
	        if (passed) {
	            setResult({ ok: true, msg: '✓ 目标达成！输出符合预期。可以「换一题」继续练习。' });
	            play('success');
	        }
	        else {
	            setResult({ ok: false, msg: '输出还没有达到目标。对照左侧「目标输出」检查 print 的内容。' });
	            play('warning');
	        }
	    };
	    const resetCode = () => {
	        setCode(mission.initialCode);
	        setTerm([]);
	        setResult(null);
	        setVars(null);
	        setSteps(0);
	        try {
	            localStorage.removeItem(DRAFT_PREFIX + missionId);
	        }
	        catch { /* ignore */ }
	        play('click');
	    };
	    const index = LAB_MISSIONS.findIndex(m => m.id === mission.id) + 1;
	    return (jsxRuntimeExports.jsxs("div", { className: "page page-anim", style: { padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", style: { marginBottom: 8 }, children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u4E3B\u83DC\u5355" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "\u7F16\u7A0B\u5B9E\u9A8C\u5BA4 \u00B7 SANDBOX" }), jsxRuntimeExports.jsx("div", { className: "hud-sub", children: "\u81EA\u7531\u7EC3\u4E60\u533A\uFF1A\u771F\u5B9E\u8FD0\u884C Python\uFF0C\u968F\u65F6\u67E5\u770B\u53D8\u91CF\uFF1B\u4E0D\u4F1A\u5F71\u54CD\u4E3B\u7EBF\u8FDB\u5EA6\u4E0E\u5BB9\u9519\u3002" })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsxs("span", { className: "hud-chip", children: ["\u7EC3\u4E60\u9898 ", index, " / ", LAB_MISSIONS.length] }), jsxRuntimeExports.jsxs("div", { className: 'py-status ' + pyState.status, title: pyState.phase, children: [jsxRuntimeExports.jsx("span", { className: "pd" }), pyState.status === 'ready' ? 'PY ENGINE READY' : pyState.status === 'loading' ? '引擎加载中…' : pyState.status === 'error' ? '引擎错误' : 'ADAPTER STANDBY'] })] }), jsxRuntimeExports.jsxs("div", { className: "chlg-grid", style: { flex: 1, minHeight: 0 }, children: [jsxRuntimeExports.jsxs("div", { className: "chlg-left", style: { overflowY: 'auto' }, children: [jsxRuntimeExports.jsxs("div", { className: "panel task-block", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u7EC3\u4E60\u4EFB\u52A1", jsxRuntimeExports.jsxs("span", { className: "panel-tag", children: ["LAB-", String(index).padStart(2, '0')] })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsx("div", { className: "tb-label", children: "\u9898\u76EE" }), jsxRuntimeExports.jsxs("div", { className: "tb-text", children: [mission.title, " \u2014\u2014 ", mission.desc] })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsx("div", { className: "tb-label", children: "\u76EE\u6807\u8F93\u51FA" }), jsxRuntimeExports.jsx("div", { className: "tb-text warn", style: { fontFamily: 'Consolas, monospace' }, children: mission.goal })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsx("div", { className: "tb-label", children: "\u63D0\u793A" }), jsxRuntimeExports.jsx("div", { className: "tb-text dim", children: mission.hint })] }), jsxRuntimeExports.jsxs("div", { className: "row", style: { marginTop: 10 }, children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small primary", onClick: nextMission, children: "\uD83C\uDFB2 \u6362\u4E00\u9898" }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: resetCode, children: "\u6062\u590D\u521D\u59CB\u4EE3\u7801" })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u5B9E\u9A8C\u5BA4\u8BF4\u660E" }), jsxRuntimeExports.jsxs("div", { className: "dim", style: { fontSize: 12.5, lineHeight: 1.8 }, children: ["\u00B7 \u5DF2\u901A\u8FC7\u65B0\u4EBA\u8BAD\u7EC3\u7EC8\u7AEF\u540E\u89E3\u9501\u672C\u5B9E\u9A8C\u5BA4\u3002", jsxRuntimeExports.jsx("br", {}), "\u00B7 \u4EE3\u7801\u652F\u6301\u524D\u516D\u7AE0\u5B66\u8FC7\u7684\u5168\u90E8\u8BED\u6CD5\uFF08\u53D8\u91CF / \u6761\u4EF6 / \u5FAA\u73AF / \u5217\u8868 / \u5B57\u5178 / \u51FD\u6570 / \u5F02\u5E38\uFF09\u3002", jsxRuntimeExports.jsx("br", {}), "\u00B7 \u8FD0\u884C\u4F1A\u91C7\u96C6\u6267\u884C\u8F68\u8FF9\uFF0C\u53F3\u4FA7\u300C\u53D8\u91CF\u76D1\u89C6\u5668\u300D\u663E\u793A\u8FD0\u884C\u7ED3\u675F\u65F6\u7684\u53D8\u91CF\u72B6\u6001\u3002", jsxRuntimeExports.jsx("br", {}), "\u00B7 \u8349\u7A3F\u81EA\u52A8\u4FDD\u5B58\u5230\u672C\u5730\uFF0C\u5237\u65B0\u9875\u9762\u4E0D\u4F1A\u4E22\u5931\u3002", jsxRuntimeExports.jsx("br", {}), "\u00B7 \u5B89\u5168\u8FB9\u754C\uFF1A\u7981\u6B62\u6587\u4EF6\u3001\u7F51\u7EDC\u3001\u6C42\u503C\u7C7B\u64CD\u4F5C\uFF08\u6559\u5B66\u6C99\u7BB1\uFF09\u3002"] })] })] }), jsxRuntimeExports.jsxs("div", { className: "chlg-center", children: [jsxRuntimeExports.jsxs("div", { className: "toolbar", children: [jsxRuntimeExports.jsxs("button", { className: "nxbtn", disabled: running, onClick: run, children: [running ? jsxRuntimeExports.jsx("span", { className: "spinner" }) : '▶', " \u8FD0\u884C\u4EE3\u7801"] }), jsxRuntimeExports.jsx("button", { className: "nxbtn ghost", disabled: running, onClick: resetCode, children: "\u6062\u590D\u521D\u59CB\u4EE3\u7801" }), jsxRuntimeExports.jsx("div", { className: "sp" }), jsxRuntimeExports.jsx("span", { className: "chip", children: "\u81EA\u7531\u7EC3\u4E60 \u00B7 \u4E0D\u8BA1\u5931\u8D25" })] }), jsxRuntimeExports.jsx("div", { className: "code-frame", style: { flex: 1 }, children: jsxRuntimeExports.jsx(CodeEditor, { value: code, onChange: setCode, onRun: run, readOnly: running, fontSize: 15 }) }), result && (jsxRuntimeExports.jsxs("div", { className: 'result-banner ' + (result.ok ? 'ok' : 'fail'), children: [result.msg, steps > 0 && jsxRuntimeExports.jsxs("span", { className: "dim", style: { marginLeft: 10, fontSize: 12 }, children: ["\uFF08\u6267\u884C ", steps, " \u6B65\uFF09"] })] }))] }), jsxRuntimeExports.jsxs("div", { className: "chlg-right", style: { overflowY: 'auto' }, children: [jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u53D8\u91CF\u76D1\u89C6\u5668", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: vars ? 'SNAPSHOT' : 'STANDBY' })] }), vars ? (jsxRuntimeExports.jsx(LabVars, { vars: vars })) : (jsxRuntimeExports.jsxs("div", { className: "dim", style: { fontSize: 12.5, lineHeight: 1.8 }, children: ["\u8FD0\u884C\u4EE3\u7801\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u7A0B\u5E8F\u7ED3\u675F\u65F6\u7684\u53D8\u91CF\u72B6\u6001\uFF08\u6765\u81EA\u6267\u884C\u8F68\u8FF9\u7684\u6700\u540E\u4E00\u6B65\uFF09\u3002", jsxRuntimeExports.jsx("br", {}), jsxRuntimeExports.jsx("br", {}), "\u5C0F\u6280\u5DE7\uFF1A\u628A\u53D8\u91CF\u7528 print \u6253\u51FA\u6765\uFF0C\u6216\u7528\u684C\u9762\u7EB8\u7B14\u63A8\u6F14\u5FAA\u73AF\u8FC7\u7A0B\u3002"] }))] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u5FEB\u901F\u53C2\u8003" }), jsxRuntimeExports.jsx("div", { children: ['if 条件:', 'for x in 列表:', 'while 条件:', 'def 函数(参数):', 'return 值', 'dict.get(键, 默认值)', 'try / except'].map(s => (jsxRuntimeExports.jsx("span", { className: "chip cyan know-chip", style: { fontFamily: 'Consolas, monospace' }, children: s }, s))) })] })] })] }), jsxRuntimeExports.jsx("div", { className: "chlg-bottom", children: jsxRuntimeExports.jsx(Terminal, { lines: term, maxHeight: 190, title: '实验室终端 · ' + mission.title }) })] }));
	}
	function LabVars({ vars }) {
	    const entries = Object.entries(vars).sort((a, b) => a[0].localeCompare(b[0]));
	    if (entries.length === 0) {
	        return jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12.5 }, children: "\u7A0B\u5E8F\u7ED3\u675F\u65F6\u6CA1\u6709\u5C40\u90E8\u53D8\u91CF\uFF08\u53EF\u80FD\u53EA\u6709\u8F93\u51FA\u8BED\u53E5\uFF09\u3002" });
	    }
	    return (jsxRuntimeExports.jsx("div", { style: { fontFamily: 'Consolas, monospace', fontSize: 12.5 }, children: entries.map(([k, v]) => (jsxRuntimeExports.jsxs("div", { className: "pf-kv", style: { fontSize: 12, alignItems: 'flex-start' }, children: [jsxRuntimeExports.jsx("span", { className: "k", style: { flex: '0 0 42%' }, children: k }), jsxRuntimeExports.jsx("span", { className: "v", style: { flex: 1, textAlign: 'right', overflowWrap: 'anywhere', color: '#BDE9F2' }, children: v })] }, k))) }));
	}

	const PHASE_COLORS = ['#42D6D0', '#F3B75C', '#C9A7FF', '#FF5B64'];
	/**
	 * Boss「立绘」：纯 SVG 全息构造体（闸门守卫）。
	 * 无外部图片资源，随阶段换色，受击抖动、破裂闪烁、击破坍塌。
	 */
	function BossAvatar({ phase, hpPct, hitKey, broken, defeated, codename }) {
	    const [hit, setHit] = reactExports.useState(false);
	    reactExports.useEffect(() => {
	        if (!hitKey)
	            return;
	        setHit(true);
	        const t = window.setTimeout(() => setHit(false), 420);
	        return () => window.clearTimeout(t);
	    }, [hitKey]);
	    const color = PHASE_COLORS[Math.min(phase, PHASE_COLORS.length - 1)];
	    const dim = hpPct <= 0;
	    return (jsxRuntimeExports.jsxs("div", { className: 'boss-avatar phase-' + phase +
	            (hit ? ' is-hit' : '') +
	            (broken ? ' is-broken' : '') +
	            (defeated || dim ? ' is-down' : ''), style: { ['--boss-color']: color }, "aria-label": 'Boss ' + codename, children: [jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 240 240", className: "boss-svg", children: [jsxRuntimeExports.jsxs("defs", { children: [jsxRuntimeExports.jsxs("radialGradient", { id: "gateCore", cx: "50%", cy: "45%", r: "55%", children: [jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#FFFFFF" }), jsxRuntimeExports.jsx("stop", { offset: "42%", stopColor: color }), jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#04101A" })] }), jsxRuntimeExports.jsxs("linearGradient", { id: "gateBar", x1: "0", y1: "0", x2: "0", y2: "1", children: [jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: color, stopOpacity: "0.85" }), jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: color, stopOpacity: "0.15" })] })] }), jsxRuntimeExports.jsxs("g", { className: "gate-rings", children: [jsxRuntimeExports.jsx("circle", { cx: "120", cy: "120", r: "106", className: "ring ring-1" }), jsxRuntimeExports.jsx("circle", { cx: "120", cy: "120", r: "92", className: "ring ring-2" })] }), jsxRuntimeExports.jsxs("g", { className: "gate-pillars", children: [jsxRuntimeExports.jsx("rect", { x: "40", y: "66", width: "14", height: "108", rx: "7", className: "pillar" }), jsxRuntimeExports.jsx("rect", { x: "186", y: "66", width: "14", height: "108", rx: "7", className: "pillar" })] }), jsxRuntimeExports.jsx("polygon", { points: "120,36 190,78 190,162 120,204 50,162 50,78", className: "hex" }), jsxRuntimeExports.jsx("polygon", { points: "120,62 168,90 168,150 120,178 72,150 72,90", className: "hex-inner" }), jsxRuntimeExports.jsxs("g", { className: "gate-bars", children: [jsxRuntimeExports.jsx("rect", { x: "78", y: "96", width: "84", height: "5", rx: "2.5", className: "bar" }), jsxRuntimeExports.jsx("rect", { x: "78", y: "139", width: "84", height: "5", rx: "2.5", className: "bar" })] }), jsxRuntimeExports.jsx("circle", { cx: "120", cy: "120", r: "34", fill: "url(#gateCore)", className: "core" }), jsxRuntimeExports.jsx("circle", { cx: "120", cy: "120", r: "34", className: "core-ring" }), jsxRuntimeExports.jsx("text", { x: "120", y: "120", textAnchor: "middle", dominantBaseline: "central", className: "core-mark", children: codename.replace('-', '') }), jsxRuntimeExports.jsxs("g", { className: "gate-nodes", children: [jsxRuntimeExports.jsx("circle", { cx: "120", cy: "26", r: "4", className: "node" }), jsxRuntimeExports.jsx("circle", { cx: "206", cy: "120", r: "4", className: "node" }), jsxRuntimeExports.jsx("circle", { cx: "120", cy: "214", r: "4", className: "node" }), jsxRuntimeExports.jsx("circle", { cx: "34", cy: "120", r: "4", className: "node" })] }), jsxRuntimeExports.jsxs("g", { className: "gate-cracks", children: [jsxRuntimeExports.jsx("path", { d: "M92 78 L120 118 L104 150", className: "crack" }), jsxRuntimeExports.jsx("path", { d: "M150 84 L126 120 L146 156", className: "crack" })] })] }), jsxRuntimeExports.jsx("div", { className: "boss-avatar-shadow" })] }));
	}

	/** 碎片收集动画（全息归档） */
	function FragmentGain({ def, onDone }) {
	    reactExports.useEffect(() => {
	        const t = window.setTimeout(onDone, 3800);
	        return () => window.clearTimeout(t);
	    }, [onDone]);
	    return (jsxRuntimeExports.jsxs("div", { className: "frag-gain", onClick: onDone, role: "dialog", "aria-label": "\u83B7\u5F97\u521B\u4E16\u4E3B\u788E\u7247", children: [jsxRuntimeExports.jsx("div", { className: "fg-scan" }), jsxRuntimeExports.jsxs("div", { className: "fg-rings", children: [jsxRuntimeExports.jsx("span", {}), jsxRuntimeExports.jsx("span", {}), jsxRuntimeExports.jsx("span", {})] }), jsxRuntimeExports.jsx("div", { className: "fg-core", children: "\u25C7" }), jsxRuntimeExports.jsxs("div", { className: "fg-order", children: ["\u521B\u4E16\u4E3B\u788E\u7247 \u00B7 \u7B2C ", def.order, " \u679A"] }), jsxRuntimeExports.jsxs("div", { className: "fg-name", children: ["\u300A", def.title, "\u300B"] }), jsxRuntimeExports.jsx("div", { className: "fg-sub", children: def.subtitle }), jsxRuntimeExports.jsx("div", { className: "fg-quote", children: def.content }), jsxRuntimeExports.jsx("div", { className: "fg-hint", children: "\u5DF2\u5F52\u6863\u81F3\u8BB0\u5FC6\u6863\u6848\u9986 \u00B7 \u70B9\u51FB\u7EE7\u7EED" })] }));
	}

	function BossBattlePage() {
	    const g = useGame();
	    const boss = bossById(g.player.progress.currentBossId || '');
	    const def = boss ? battleFor(boss.id) : undefined;
	    if (!boss || !def)
	        return null;
	    return jsxRuntimeExports.jsx(BattleView, { boss: boss, def: def });
	}
	function BattleView({ boss, def }) {
	    const g = useGame();
	    const player = g.player;
	    const respawnTick = g.respawnTick;
	    const stored = reactExports.useMemo(() => normalizeBattleState((player.progress.battles || {})[boss.id], def), [player.progress.battles, boss.id, def]);
	    const phaseIndex = Math.min(stored.phase, def.phases.length - 1);
	    const phase = def.phases[phaseIndex];
	    const totalChecks = phaseCheckCount(phase);
	    const passedChecks = popcount(stored.phaseMask[phaseIndex] || 0);
	    const pct = hpPercent(stored);
	    const alreadyCleared = stored.cleared || (player.progress.bossesDone || []).includes(boss.id);
	    const failures = player.progress.failedAttempts[boss.id] || 0;
	    const locked = g.event.kind !== 'none';
	    const [code, setCode] = reactExports.useState(phase.initialCode);
	    const [term, setTerm] = reactExports.useState([]);
	    const [running, setRunning] = reactExports.useState(false);
	    const [submitting, setSubmitting] = reactExports.useState(false);
	    const [verdict, setVerdict] = reactExports.useState(null);
	    const [errorLine, setErrorLine] = reactExports.useState(null);
	    const [hintLevel, setHintLevel] = reactExports.useState(1);
	    const [pyState, setPyState] = reactExports.useState({ status: 'idle', phase: '' });
	    const [hitKey, setHitKey] = reactExports.useState(0);
	    const [counterKey, setCounterKey] = reactExports.useState(0);
	    const [countered, setCountered] = reactExports.useState(false);
	    const [broken, setBroken] = reactExports.useState(false);
	    const [breakBanner, setBreakBanner] = reactExports.useState(null);
	    const [popups, setPopups] = reactExports.useState([]);
	    const [log, setLog] = reactExports.useState([]);
	    const [introOpen, setIntroOpen] = reactExports.useState(false);
	    const [outroOpen, setOutroOpen] = reactExports.useState(false);
	    const [cleared, setCleared] = reactExports.useState(null);
	    const [gain, setGain] = reactExports.useState(null);
	    const popSeq = reactExports.useRef(1);
	    const logSeq = reactExports.useRef(1);
	    const scenes = bossScenesFor(boss.id);
	    const fragDef = fragmentById(boss.fragmentId);
	    const pushLines = reactExports.useCallback((lines) => setTerm(t => [...t.slice(-200), ...lines]), []);
	    const addLog = reactExports.useCallback((text, kind) => {
	        const id = logSeq.current++;
	        setLog(l => [...l.slice(-30), { id, text, kind }]);
	    }, []);
	    const pushDamage = reactExports.useCallback((value) => {
	        if (value <= 0)
	            return;
	        const id = popSeq.current++;
	        setPopups(p => [...p, { id, value }]);
	        window.setTimeout(() => setPopups(p => p.filter(x => x.id !== id)), 900);
	    }, []);
	    reactExports.useEffect(() => {
	        warmUp();
	        const un = onPyStatus(s => setPyState(s));
	        return un;
	    }, []);
	    // 进入战斗：没有进度就创建满血状态（已有进度则续战）
	    reactExports.useEffect(() => {
	        g.beginBossBattle(boss.id);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [boss.id]);
	    // 战前演出（首次）
	    reactExports.useEffect(() => {
	        setIntroOpen(!player.progress.storySeen['bossIntro_' + boss.id]);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [boss.id]);
	    // 阶段变化 → 载入该阶段题目
	    reactExports.useEffect(() => {
	        const p = def.phases[Math.min(stored.phase, def.phases.length - 1)];
	        setCode(p.initialCode);
	        setVerdict(null);
	        setErrorLine(null);
	        setHintLevel(1);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [stored.phase, boss.id, respawnTick]);
	    // Boss 反击 → 玩家受击反馈（红屏 + 抖动）
	    reactExports.useEffect(() => {
	        if (!counterKey)
	            return;
	        setCountered(true);
	        const t = window.setTimeout(() => setCountered(false), 520);
	        return () => window.clearTimeout(t);
	    }, [counterKey]);
	    const run = async () => {
	        if (running || submitting || locked)
	            return;
	        const ck = checkUserCode(code);
	        if (!ck.allowed) {
	            pushLines([{ kind: 'cmd', text: 'python gate.py' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
	            play('deny');
	            return;
	        }
	        setRunning(true);
	        setVerdict(null);
	        setErrorLine(null);
	        pushLines([{ kind: 'cmd', text: 'python gate.py' }, { kind: 'sys', text: '正在与 ' + boss.codename + ' 的防御比对……' }]);
	        play('run');
	        const r = await runPython(code, { timeoutMs: 5000 });
	        setRunning(false);
	        const stdout = filterMarkerLines(r.stdout || '');
	        if (r.timedOut) {
	            pushLines([{ kind: 'err', text: '执行超时：防御协议吞掉了你的进程。' }]);
	            return;
	        }
	        if (!r.ok) {
	            pushLines([
	                ...(stdout.trim() ? [{ kind: 'out', text: stdout.replace(/\n$/, '') }] : []),
	                { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' },
	            ]);
	            if (r.error?.line)
	                setErrorLine(r.error.line);
	            return;
	        }
	        pushLines([{ kind: 'out', text: stdout.replace(/\n$/, '') || '(无输出)' }]);
	    };
	    /** 判题没有造成伤害：不判负，只让 Boss 反击（意识 / 容错），战斗继续 */
	    const handleFail = (reason) => {
	        play('error');
	        setCounterKey(k => k + 1);
	        const fp = g.recordFail(boss.id);
	        g.bossCounterAttack(boss.id, def.counterDamage);
	        addLog('未造成伤害（' + reason + '）· 意识 -' + def.counterDamage, 'fail');
	        if (fp.triggered)
	            g.toast('warn', '容错次数用尽——纠错者锁定你了！');
	    };
	    const submit = async () => {
	        if (running || submitting || locked || alreadyCleared)
	            return;
	        const ck = checkUserCode(code);
	        if (!ck.allowed) {
	            pushLines([{ kind: 'cmd', text: 'python gate.py --attack' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
	            play('deny');
	            return;
	        }
	        setSubmitting(true);
	        setVerdict(null);
	        setErrorLine(null);
	        play('run');
	        pushLines([{ kind: 'cmd', text: 'python gate.py --attack （阶段 ' + (phaseIndex + 1) + '：' + phase.title + '）' }]);
	        const combined = phase.judge.judgeKind === 'python'
	            ? combineWithHarness(code, buildHarness(phase.judge.pythonChecks || []))
	            : code;
	        const r = await runPython(combined, { timeoutMs: 5000 });
	        setSubmitting(false);
	        if (r.timedOut) {
	            pushLines([{ kind: 'err', text: '攻击超时：防御协议没有被破坏。' }]);
	            handleFail('执行超时');
	            return;
	        }
	        if (!r.ok) {
	            pushLines([
	                ...(filterMarkerLines(r.stdout || '').trim() ? [{ kind: 'out', text: filterMarkerLines(r.stdout).replace(/\n$/, '') }] : []),
	                { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' },
	            ]);
	            if (r.error?.line)
	                setErrorLine(r.error.line);
	            handleFail(r.error ? r.error.type : '执行出错');
	            return;
	        }
	        const v = judgeRun(phase.judge, r);
	        const res = resolveSubmission(def, stored, phaseIndex, v.checks);
	        setVerdict(v);
	        if (res.newPassed === 0) {
	            pushLines([
	                { kind: 'sys', text: '── 攻击结果 ──' },
	                ...v.checks.map(c => ({ kind: (c.ok ? 'ok' : 'err'), text: (c.ok ? '✓ ' : '✗ ') + c.name + (c.detail ? ' —— ' + c.detail : '') })),
	                { kind: 'err', text: '这次没有命中防御核心。' },
	            ]);
	            handleFail('判题未通过');
	            return;
	        }
	        // 命中：按真实通过的测试数扣血
	        g.applyBossDamage(boss.id, phaseIndex, {
	            hpAfter: res.hpAfter,
	            mask: res.mask,
	            phaseAfter: res.phaseAfter,
	            defeated: res.defeated,
	        });
	        setHitKey(k => k + 1);
	        pushDamage(res.damage);
	        pushLines([
	            { kind: 'sys', text: '── 攻击结果 ──' },
	            ...v.checks.map(c => ({ kind: (c.ok ? 'ok' : 'err'), text: (c.ok ? '✓ ' : '✗ ') + c.name })),
	            { kind: 'ok', text: '命中防御核心：' + res.newPassed + '/' + res.total + ' 项测试通过，造成 ' + res.damage + ' 点伤害。' },
	        ]);
	        addLog('命中 · 通过 ' + res.newPassed + '/' + res.total + ' · 伤害 ' + res.damage, 'hit');
	        play('success');
	        if (res.phaseCleared) {
	            setBroken(true);
	            window.setTimeout(() => setBroken(false), 1300);
	            setBreakBanner({ phase: phaseIndex + 1, title: phase.title });
	            window.setTimeout(() => setBreakBanner(null), 1900);
	            addLog('防御破裂 · 阶段 ' + (phaseIndex + 1) + '「' + phase.title + '」已击破', 'phase');
	            play('alarm');
	            pushLines([{ kind: 'sys', text: '── 防御破裂 · ' + phase.title + ' ──' }, { kind: 'ok', text: phase.summary }]);
	            if (res.defeated) {
	                const out = g.completeBoss(boss.id);
	                addLog(boss.codename + ' 核心停止运转', 'win');
	                play('levelup');
	                if (out) {
	                    setCleared(out);
	                    const fd = fragmentForCollected(out.fragmentId);
	                    if (fd)
	                        setGain(fd);
	                    else if (scenes.outro)
	                        setOutroOpen(true);
	                }
	            }
	        }
	    };
	    const resetCode = () => {
	        setCode(phase.initialCode);
	        setVerdict(null);
	        setErrorLine(null);
	        pushLines([{ kind: 'sys', text: '代码已恢复为本阶段的初始故障版本。' }]);
	        play('click');
	    };
	    const hint = phase.hints[Math.min(hintLevel - 1, phase.hints.length - 1)];
	    const knowledgeCards = phase.knowledge.map(knowledgeById).filter(Boolean);
	    const opp = boss.opponentName || boss.codename;
	    return (jsxRuntimeExports.jsxs("div", { className: 'page page-anim boss-page boss-battle bg-' + def.bg, style: { padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", style: { marginBottom: 8 }, children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", disabled: running || submitting, onClick: () => { play('click'); g.setCurrentBoss(null); g.nav('map'); }, children: "\u25C0 \u64A4\u9000\uFF08\u8FDB\u5EA6\u5DF2\u4FDD\u5B58\uFF09" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsxs("div", { className: "hud-title", style: { color: '#C9A7FF' }, children: ["\u26A1 ", boss.codename, " \u00B7 ", boss.title] }), jsxRuntimeExports.jsxs("div", { className: "hud-sub", children: ["\u7B2C ", boss.chapter, " \u7AE0 \u00B7 \u9636\u6BB5 ", Math.min(phaseIndex + 1, def.phases.length), " / ", def.phases.length, " \u00B7 ", phase.title] })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsxs("div", { className: 'py-status ' + pyState.status, title: pyState.phase, children: [jsxRuntimeExports.jsx("span", { className: "pd" }), pyState.status === 'ready' ? 'PY ENGINE READY' : pyState.status === 'loading' ? '引擎加载中…' : pyState.status === 'error' ? '引擎错误' : 'ADAPTER STANDBY'] }), jsxRuntimeExports.jsxs("span", { className: 'hud-chip' + (player.consciousness <= 20 ? ' red warn-flash' : ''), children: ["\u610F\u8BC6 ", player.consciousness, "%"] }), jsxRuntimeExports.jsxs("span", { className: "hud-chip cyan", children: ["\u5BB9\u9519 ", Math.max(0, g.tolerance - failures), " / ", g.tolerance] })] }), jsxRuntimeExports.jsxs("div", { className: 'boss-arena phase-' + phaseIndex + (locked ? ' locked' : '') + (countered ? ' is-counter' : ''), children: [jsxRuntimeExports.jsxs("div", { className: "arena-grid", children: [jsxRuntimeExports.jsx(BossAvatar, { phase: phaseIndex, hpPct: pct, hitKey: hitKey, broken: broken, defeated: alreadyCleared && pct <= 0, codename: boss.codename }), jsxRuntimeExports.jsxs("div", { className: "boss-info", children: [jsxRuntimeExports.jsxs("div", { className: "boss-name-row", children: [jsxRuntimeExports.jsx("span", { className: "boss-name", children: boss.codename }), jsxRuntimeExports.jsx("span", { className: "boss-title", children: boss.title }), jsxRuntimeExports.jsxs("span", { className: "boss-chapter", children: ["\u7B2C ", boss.chapter, " \u7AE0"] })] }), jsxRuntimeExports.jsxs("div", { className: "boss-hp", children: [jsxRuntimeExports.jsxs("div", { className: "hp-track", children: [jsxRuntimeExports.jsx("div", { className: "hp-fill", style: { width: pct + '%' } }), def.phases.slice(1).map((_, i) => (jsxRuntimeExports.jsx("span", { className: "hp-tick", style: { left: ((i + 1) / def.phases.length * 100) + '%' } }, i)))] }), jsxRuntimeExports.jsxs("div", { className: "hp-readout", children: [jsxRuntimeExports.jsxs("span", { className: "hp-num", children: [stored.hp, " / ", stored.maxHp] }), jsxRuntimeExports.jsxs("span", { className: "hp-pct", children: [pct, "%"] })] })] }), jsxRuntimeExports.jsx("div", { className: "phase-pips", children: def.phases.map((p, i) => (jsxRuntimeExports.jsxs("span", { className: 'pip' + (i < stored.phase ? ' done' : i === phaseIndex && !alreadyCleared ? ' cur' : ''), children: [jsxRuntimeExports.jsx("b", { children: i + 1 }), " ", p.title] }, p.id))) }), jsxRuntimeExports.jsxs("div", { className: "boss-objective", children: [jsxRuntimeExports.jsx("span", { className: "bo-label", children: "\u5F53\u524D\u76EE\u6807" }), jsxRuntimeExports.jsx("span", { className: "bo-text", children: phase.objective })] }), jsxRuntimeExports.jsxs("div", { className: "boss-metrics", children: [jsxRuntimeExports.jsxs("span", { className: "metric", children: ["\u672C\u9636\u6BB5\u6D4B\u8BD5 ", jsxRuntimeExports.jsxs("b", { children: [passedChecks, " / ", totalChecks] })] }), jsxRuntimeExports.jsxs("span", { className: "metric", children: ["\u6218\u6597\u5931\u8BEF ", jsxRuntimeExports.jsx("b", { children: stored.failures })] }), jsxRuntimeExports.jsxs("span", { className: "metric", children: ["\u53CD\u51FB\u4F24\u5BB3 ", jsxRuntimeExports.jsxs("b", { children: ["-", def.counterDamage, " \u610F\u8BC6"] })] })] })] })] }), jsxRuntimeExports.jsx("div", { className: "damage-layer", children: popups.map(p => jsxRuntimeExports.jsxs("span", { className: "dmg-pop", children: ["-", p.value] }, p.id)) }), breakBanner && (jsxRuntimeExports.jsxs("div", { className: "break-banner", children: [jsxRuntimeExports.jsx("div", { className: "bb-main", children: "\u9632\u5FA1\u7834\u88C2" }), jsxRuntimeExports.jsxs("div", { className: "bb-sub", children: ["\u9636\u6BB5 ", breakBanner.phase, " \u00B7 ", breakBanner.title] })] })), locked && jsxRuntimeExports.jsx("div", { className: "arena-lock", children: "\u7D27\u6025\u4E8B\u4EF6\u8FDB\u884C\u4E2D\u2014\u2014\u6218\u6597\u5DF2\u6682\u505C" })] }), jsxRuntimeExports.jsxs("div", { className: "chlg-grid", style: { flex: 1, minHeight: 0 }, children: [jsxRuntimeExports.jsxs("div", { className: "chlg-left", style: { overflowY: 'auto' }, children: [jsxRuntimeExports.jsxs("div", { className: "panel task-block boss-block", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u9636\u6BB5\u4EFB\u52A1", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: phase.id.toUpperCase() })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsx("div", { className: "tb-label", children: "\u8981\u4FEE\u590D\u7684\u6A21\u5757" }), jsxRuntimeExports.jsx("div", { className: "tb-text", children: phase.title })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsx("div", { className: "tb-label", children: "\u76EE\u6807" }), jsxRuntimeExports.jsx("div", { className: "tb-text", children: phase.objective })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u6545\u969C\u65E5\u5FD7" }), jsxRuntimeExports.jsx("div", { style: { fontFamily: 'Consolas, monospace', fontSize: 12.5, color: '#FF9BA2', lineHeight: 1.8, background: 'rgba(255,91,100,0.06)', border: '1px solid rgba(255,91,100,0.2)', borderRadius: 8, padding: '9px 11px', whiteSpace: 'pre-wrap' }, children: phase.faultLog })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u672C\u9636\u6BB5\u8003\u70B9" }), jsxRuntimeExports.jsx("div", { children: knowledgeCards.map(k => jsxRuntimeExports.jsx("span", { className: "chip cyan know-chip", children: k.title }, k.id)) })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["MIRA \u63D0\u793A", jsxRuntimeExports.jsxs("span", { className: "panel-tag", children: ["LEVEL ", hintLevel] })] }), jsxRuntimeExports.jsx("div", { style: { fontSize: 13, color: '#BFD8E8', lineHeight: 1.75 }, children: hint }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", style: { marginTop: 8 }, disabled: hintLevel >= phase.hints.length, onClick: () => { play('click'); setHintLevel(h => Math.min(h + 1, phase.hints.length)); }, children: "\u4E0B\u4E00\u6761\u63D0\u793A" })] })] }), jsxRuntimeExports.jsxs("div", { className: "chlg-center", children: [jsxRuntimeExports.jsxs("div", { className: "toolbar", children: [jsxRuntimeExports.jsxs("button", { className: "nxbtn", disabled: running || submitting || locked, onClick: run, children: [running ? jsxRuntimeExports.jsx("span", { className: "spinner" }) : '▶', " \u8FD0\u884C\u4EE3\u7801"] }), jsxRuntimeExports.jsx("button", { className: "nxbtn primary", disabled: running || submitting || locked || alreadyCleared, onClick: submit, children: "\u63D0\u4EA4\u653B\u51FB \u23CE" }), jsxRuntimeExports.jsx("button", { className: "nxbtn ghost", disabled: running || submitting || locked, onClick: resetCode, children: "\u91CD\u7F6E\u4EE3\u7801" }), jsxRuntimeExports.jsx("div", { className: "sp" }), jsxRuntimeExports.jsx("span", { className: "chip", children: "\u5224\u9898\u901A\u8FC7\u624D\u6389\u8840" })] }), jsxRuntimeExports.jsx("div", { className: "code-frame", style: { flex: 1 }, children: jsxRuntimeExports.jsx(CodeEditor, { value: code, onChange: setCode, errorLine: errorLine, onRun: run, readOnly: running || submitting || alreadyCleared, fontSize: 15 }) }), verdict && (jsxRuntimeExports.jsx("div", { className: 'result-banner ' + (verdict.passed ? 'ok' : 'fail'), children: verdict.passed ? '✓ 全部测试通过' : verdict.timedOut ? '✗ 执行超时' : verdict.error ? '✗ 执行出错：' + verdict.error.type : '✗ 测试未全部通过' }))] }), jsxRuntimeExports.jsxs("div", { className: "chlg-right", style: { overflowY: 'auto' }, children: [jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u6218\u6597\u8BB0\u5F55", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: log.length })] }), log.length === 0 && jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12.5 }, children: "\u8FD8\u6CA1\u6709\u4EA4\u950B\u8BB0\u5F55\u3002\u63D0\u4EA4\u4E00\u6B21\u653B\u51FB\u8BD5\u8BD5\u3002" }), log.map(l => (jsxRuntimeExports.jsx("div", { className: 'battle-log-line ' + l.kind, children: l.text }, l.id)))] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u751F\u547D\u4F53\u5F81" }), jsxRuntimeExports.jsx(PlayerStatus, { showTolerance: true })] })] })] }), jsxRuntimeExports.jsx("div", { className: "chlg-bottom", children: jsxRuntimeExports.jsx(Terminal, { lines: term, maxHeight: 170, title: opp + ' 对抗终端 · ' + boss.codename }) }), introOpen && scenes.intro && (jsxRuntimeExports.jsx(CinematicStage, { scenes: scenes.intro, eventId: 'boss-' + boss.id, frameTitle: opp + ' · 遭遇', onDone: () => { setIntroOpen(false); g.markStory('bossIntro_' + boss.id); } })), cleared && (jsxRuntimeExports.jsx("div", { className: "overlay", style: { background: 'rgba(10,4,20,0.78)', backdropFilter: 'blur(6px)' }, children: jsxRuntimeExports.jsxs("div", { className: "complete-panel boss-complete", children: [jsxRuntimeExports.jsx("div", { className: "cp-ico", style: { color: '#C9A7FF' }, children: "\u26A1" }), jsxRuntimeExports.jsxs("div", { className: "cp-title", children: [opp, " \u5DF2\u51FB\u7834"] }), jsxRuntimeExports.jsxs("div", { className: "cp-sub", children: [boss.codename, " \u00B7 ", boss.title] }), jsxRuntimeExports.jsxs("div", { className: "cp-rewards", children: [jsxRuntimeExports.jsxs("div", { className: "cp-reward", children: [jsxRuntimeExports.jsxs("div", { className: "rv", children: ["+", cleared.expGained] }), jsxRuntimeExports.jsx("div", { className: "rl", children: "\u7ECF\u9A8C" })] }), jsxRuntimeExports.jsxs("div", { className: "cp-reward", children: [jsxRuntimeExports.jsx("div", { className: "rv", children: fragDef ? fragDef.title : '碎片' }), jsxRuntimeExports.jsx("div", { className: "rl", children: "\u521B\u4E16\u4E3B\u788E\u7247" })] }), jsxRuntimeExports.jsxs("div", { className: "cp-reward", children: [jsxRuntimeExports.jsxs("div", { className: "rv", children: ["Lv.", cleared.newLevel] }), jsxRuntimeExports.jsx("div", { className: "rl", children: "\u7B49\u7EA7" })] })] }), fragDef && (jsxRuntimeExports.jsxs("div", { className: "cp-summary", children: [jsxRuntimeExports.jsxs("div", { className: "cs-label", children: ["\u83B7\u5F97\u788E\u7247\u300A", fragDef.title, "\u300B"] }), fragDef.content] })), (() => {
	                            const ch = chapterById('ch' + boss.chapter);
	                            const lvls = ch ? levelsOfServer(ch.serverId) : [];
	                            const stars = lvls.reduce((s, l) => s + (player.progress.stars[l.id] || 0), 0);
	                            const fails = lvls.reduce((s, l) => s + (player.progress.failedAttempts[l.id] || 0), 0);
	                            const hints = lvls.reduce((s, l) => s + (player.progress.hintLevels[l.id] || 0), 0);
	                            const know = [...new Set(lvls.flatMap(l => l.knowledge))];
	                            const mastered = know.filter(k => player.progress.knowledge.includes(k));
	                            const sett = buildChapterSettlement({
	                                chapter: boss.chapter, levels: lvls.length, stars, fails, hints,
	                                credits: cleared.credits, exp: cleared.expGained, trust: cleared.trust,
	                                knowledgeIds: know, masteredIds: mastered, unlocks: cleared.unlocks,
	                            });
	                            const acc = lvls.length ? Math.round((stars / (lvls.length * 3)) * 100) : 0;
	                            const unmastered = know.filter(k => !mastered.includes(k));
	                            const bugs = topBugsForChapter(boss.chapter, player.meta.bugCodex, 3);
	                            const phases = player.progress.battles?.[boss.id]?.phaseMask || [];
	                            return (jsxRuntimeExports.jsxs("div", { className: "chapter-settle", children: [jsxRuntimeExports.jsxs("div", { className: "cs-grid", children: [jsxRuntimeExports.jsxs("div", { className: "cs-cell", children: [jsxRuntimeExports.jsx("div", { className: "k", children: "\u7AE0\u8282\u8BC4\u4EF7" }), jsxRuntimeExports.jsx("div", { className: "v gold", children: sett.grade })] }), jsxRuntimeExports.jsxs("div", { className: "cs-cell", children: [jsxRuntimeExports.jsx("div", { className: "k", children: "\u7ECF\u9A8C" }), jsxRuntimeExports.jsxs("div", { className: "v", children: ["+", sett.exp] })] }), jsxRuntimeExports.jsxs("div", { className: "cs-cell", children: [jsxRuntimeExports.jsx("div", { className: "k", children: "\u8D21\u732E\u70B9" }), jsxRuntimeExports.jsxs("div", { className: "v gold", children: ["+", sett.credits] })] }), jsxRuntimeExports.jsxs("div", { className: "cs-cell", children: [jsxRuntimeExports.jsx("div", { className: "k", children: "\u788E\u7247" }), jsxRuntimeExports.jsx("div", { className: "v cyan", children: fragDef ? fragDef.title : '—' })] }), jsxRuntimeExports.jsxs("div", { className: "cs-cell", children: [jsxRuntimeExports.jsx("div", { className: "k", children: "\u6B63\u786E\u7387" }), jsxRuntimeExports.jsxs("div", { className: "v", children: [acc, "%"] })] })] }), jsxRuntimeExports.jsxs("div", { className: "cs-know", children: [jsxRuntimeExports.jsx("span", { className: "dim", style: { fontSize: 11.5 }, children: "\u77E5\u8BC6\u70B9\u8868\u73B0\uFF1A" }), sett.knowledge.map(k => jsxRuntimeExports.jsxs("span", { className: 'chip ' + (k.ok ? 'green' : 'dim'), children: [k.id, k.ok ? ' ✓' : ''] }, k.id))] }), phases.length > 0 && (jsxRuntimeExports.jsxs("div", { className: "cs-know", children: [jsxRuntimeExports.jsx("span", { className: "dim", style: { fontSize: 11.5 }, children: "Boss \u5404\u9636\u6BB5\uFF1A" }), phases.map((m, i) => (jsxRuntimeExports.jsxs("span", { className: 'chip ' + (m > 0 ? 'green' : 'dim'), children: ["\u7B2C", i + 1, "\u9636\u6BB5", m > 0 ? ' ✓' : ' 未突破'] }, i)))] })), bugs.length > 0 && (jsxRuntimeExports.jsxs("div", { className: "cs-know", children: [jsxRuntimeExports.jsx("span", { className: "dim", style: { fontSize: 11.5 }, children: "\u672C\u7AE0\u5E38\u89C1\u9519\u8BEF\uFF1A" }), bugs.map(b => jsxRuntimeExports.jsxs("span", { className: "chip red", children: [b.error, " \u00B7 ", b.title] }, b.id))] })), unmastered.length > 0 ? (jsxRuntimeExports.jsxs("div", { className: "cs-know", children: [jsxRuntimeExports.jsx("span", { className: "dim", style: { fontSize: 11.5 }, children: "\u5C1A\u672A\u638C\u63E1\uFF1A" }), unmastered.map(k => jsxRuntimeExports.jsx("span", { className: "chip orange", children: k }, k))] })) : (jsxRuntimeExports.jsx("div", { className: "cs-unlocks", children: "\u672C\u7AE0\u77E5\u8BC6\u70B9\u5DF2\u5168\u90E8\u638C\u63E1\u3002" })), unmastered.length > 0 && (jsxRuntimeExports.jsx("div", { className: "vd-actions", style: { marginTop: 8 }, children: jsxRuntimeExports.jsx("button", { className: "nxbtn small", onClick: () => { play('click'); g.nav('lab'); }, children: "\u524D\u5F80\u7F16\u7A0B\u5B9E\u9A8C\u5BA4\u505A\u8865\u5145\u7EC3\u4E60 \u25B8" }) })), sett.unlocks.length > 0 && jsxRuntimeExports.jsxs("div", { className: "cs-unlocks", children: ["\u65B0\u89E3\u9501\uFF1A", sett.unlocks.join('、')] })] }));
	                        })(), jsxRuntimeExports.jsxs("div", { className: "cp-btns", children: [scenes.outro && (jsxRuntimeExports.jsx("button", { className: "nxbtn ghost", onClick: () => { play('click'); setOutroOpen(true); }, children: "\u91CD\u770B\u672C\u7AE0\u7ED3\u5C3E" })), jsxRuntimeExports.jsx("button", { className: "nxbtn primary", onClick: () => { play('click'); g.setCurrentBoss(null); g.nav('map'); }, children: "\u8FD4\u56DE\u5730\u56FE" })] })] }) })), gain && (jsxRuntimeExports.jsx(FragmentGain, { def: gain, onDone: () => { setGain(null); if (scenes.outro)
	                    setOutroOpen(true); } })), outroOpen && scenes.outro && (jsxRuntimeExports.jsx(CinematicStage, { scenes: scenes.outro, eventId: 'boss-' + boss.id, frameTitle: opp + ' · 击破之后', onDone: () => setOutroOpen(false) }))] }));
	}

	function BossChallengePage() {
	    const g = useGame();
	    const boss = bossById(g.player.progress.currentBossId || '');
	    const player = g.player;
	    const [code, setCode] = reactExports.useState(boss?.initialCode ?? '');
	    const [term, setTerm] = reactExports.useState([]);
	    const [running, setRunning] = reactExports.useState(false);
	    const [submitting, setSubmitting] = reactExports.useState(false);
	    const [verdict, setVerdict] = reactExports.useState(null);
	    const [introOpen, setIntroOpen] = reactExports.useState(false);
	    const [echoOpen, setEchoOpen] = reactExports.useState(false);
	    const [outroOpen, setOutroOpen] = reactExports.useState(false);
	    const [cleared, setCleared] = reactExports.useState(null);
	    const [gain, setGain] = reactExports.useState(null);
	    const [hintLevel, setHintLevel] = reactExports.useState(1);
	    const [pyState, setPyState] = reactExports.useState({ status: 'idle', phase: '' });
	    const [errorLine, setErrorLine] = reactExports.useState(null);
	    reactExports.useEffect(() => {
	        const un = onPyStatus(s => setPyState(s));
	        warmUp();
	        return un;
	    }, []);
	    reactExports.useEffect(() => {
	        if (!boss) {
	            g.nav('map');
	            return;
	        }
	        setCode(boss.initialCode);
	        setTerm([]);
	        setVerdict(null);
	        setCleared(null);
	        setErrorLine(null);
	        setHintLevel(1);
	        const seenKey = 'bossIntro_' + boss.id;
	        setIntroOpen(!player.progress.storySeen[seenKey]);
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [boss?.id]);
	    const pushLines = reactExports.useCallback((lines) => setTerm(t => [...t.slice(-200), ...lines]), []);
	    if (!boss)
	        return null;
	    const opp = boss.opponentName || 'ECHO';
	    const bossScenes = bossScenesFor(boss.id);
	    const run = async () => {
	        if (running || submitting)
	            return;
	        const ck = checkUserCode(code);
	        if (!ck.allowed) {
	            pushLines([{ kind: 'cmd', text: 'python echo.py' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
	            play('deny');
	            return;
	        }
	        setRunning(true);
	        setVerdict(null);
	        setErrorLine(null);
	        pushLines([{ kind: 'cmd', text: 'python echo.py' }, { kind: 'sys', text: '正在与 ECHO 的镜像比对……' }]);
	        play('run');
	        const r = await runPython(code, { timeoutMs: 5000 });
	        setRunning(false);
	        const stdout = filterMarkerLines(r.stdout || '');
	        if (r.timedOut) {
	            pushLines([{ kind: 'err', text: '执行超时：ECHO 的镜像循环吞掉了你的进程。' }]);
	            return;
	        }
	        if (!r.ok) {
	            pushLines([
	                ...(stdout.trim() ? [{ kind: 'out', text: stdout.replace(/\n$/, '') }] : []),
	                { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' },
	            ]);
	            if (r.error?.line)
	                setErrorLine(r.error.line);
	            return;
	        }
	        pushLines([{ kind: 'out', text: stdout.replace(/\n$/, '') || '(无输出)' }]);
	    };
	    const submit = async () => {
	        if (running || submitting || cleared)
	            return;
	        const ck = checkUserCode(code);
	        if (!ck.allowed) {
	            pushLines([{ kind: 'cmd', text: 'python echo.py --challenge' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
	            play('deny');
	            return;
	        }
	        setSubmitting(true);
	        setVerdict(null);
	        setErrorLine(null);
	        play('run');
	        pushLines([{ kind: 'cmd', text: 'python echo.py --challenge （章节测试）' }]);
	        // Boss 判题：python 检查需要 harness（复用 judge 的 buildHarness 逻辑已在 judgeRun 内基于 stdout/marker）
	        const combined = boss.judge.judgeKind === 'python'
	            ? combineWithHarness(code, buildHarness(boss.judge.pythonChecks || []))
	            : code;
	        const r = await runPython(combined, { timeoutMs: 5000 });
	        setSubmitting(false);
	        if (r.timedOut) {
	            pushLines([{ kind: 'err', text: '挑战超时：ECHO 拒绝了这个答案。' }]);
	            setVerdict({ passed: false, checks: [], timedOut: true });
	            play('error');
	            return;
	        }
	        if (!r.ok) {
	            pushLines([
	                ...(filterMarkerLines(r.stdout || '').trim() ? [{ kind: 'out', text: filterMarkerLines(r.stdout).replace(/\n$/, '') }] : []),
	                { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' },
	            ]);
	            setVerdict({ passed: false, checks: [], error: r.error });
	            play('error');
	            return;
	        }
	        const v = judgeRun(boss.judge, r);
	        if (v.passed) {
	            const res = g.completeBoss(boss.id);
	            setVerdict({ passed: true, checks: v.checks });
	            if (res) {
	                setCleared(res);
	                const fd = fragmentForCollected(res.fragmentId);
	                if (fd)
	                    setGain(fd);
	                pushLines([
	                    { kind: 'sys', text: '── ' + opp + ' 核心逻辑修复 ──' },
	                    ...v.checks.map(c => ({ kind: 'ok', text: '✓ ' + c.name })),
	                    { kind: 'ok', text: '⚡ ' + opp + ' 已被击破！' },
	                ]);
	                play('levelup');
	                if (bossScenes.outro)
	                    setOutroOpen(true);
	            }
	        }
	        else {
	            pushLines([
	                { kind: 'sys', text: '── 章节测试未通过 ──' },
	                ...v.checks.map(c => ({ kind: (c.ok ? 'ok' : 'err'), text: (c.ok ? '✓ ' : '✗ ') + c.name + (c.detail ? ' —— ' + c.detail : '') })),
	                { kind: 'err', text: opp + ' 还在运行。再试一次。' },
	            ]);
	            setVerdict(v);
	            play('error');
	        }
	    };
	    const hint = boss.hints[Math.min(hintLevel - 1, boss.hints.length - 1)];
	    const fragDef = fragmentById(boss.fragmentId);
	    const legacyFrag = MEMORY_FRAGMENTS.find(f => f.id === boss.fragmentId);
	    const fragTitle = fragDef?.title || legacyFrag?.title || '记忆碎片';
	    const fragContent = fragDef?.content || legacyFrag?.content || '';
	    const knowledgeCards = boss.knowledge.map(knowledgeById).filter(Boolean);
	    return (jsxRuntimeExports.jsxs("div", { className: "page page-anim boss-page", style: { padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", style: { marginBottom: 8 }, children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", disabled: running || submitting, onClick: () => { play('click'); g.nav('map'); }, children: "\u25C0 \u670D\u52A1\u5668\u5730\u56FE" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsxs("div", { className: "hud-title", style: { color: '#C9A7FF' }, children: ["\u26A1 ", boss.title] }), jsxRuntimeExports.jsxs("div", { className: "hud-sub", children: ["\u7AE0\u8282 Boss \u00B7 \u7B2C ", boss.chapter, " \u7AE0 \u00B7 ", boss.codename] })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsxs("div", { className: 'py-status ' + pyState.status, title: pyState.phase, children: [jsxRuntimeExports.jsx("span", { className: "pd" }), pyState.status === 'ready' ? 'PY ENGINE READY' : pyState.status === 'loading' ? '引擎加载中…' : pyState.status === 'error' ? '引擎错误' : 'ADAPTER STANDBY'] }), jsxRuntimeExports.jsxs("span", { className: "hud-chip", children: ["\u610F\u8BC6 ", player.consciousness, "%"] })] }), jsxRuntimeExports.jsxs("div", { className: "chlg-grid", style: { flex: 1, minHeight: 0 }, children: [jsxRuntimeExports.jsxs("div", { className: "chlg-left", style: { overflowY: 'auto' }, children: [jsxRuntimeExports.jsxs("div", { className: "panel task-block boss-block", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u7AE0\u8282 Boss \u6218", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: boss.codename })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsxs("div", { className: "tb-label", children: [opp, " \u7684\u7834\u7EFD"] }), jsxRuntimeExports.jsx("div", { className: "tb-text", children: boss.fault })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsx("div", { className: "tb-label", children: "\u6311\u6218\u76EE\u6807" }), jsxRuntimeExports.jsx("div", { className: "tb-text", children: boss.goal })] }), jsxRuntimeExports.jsxs("div", { className: "tb-item", children: [jsxRuntimeExports.jsx("div", { className: "tb-label", children: "\u6B63\u786E\u884C\u4E3A" }), jsxRuntimeExports.jsx("div", { className: "tb-text warn", children: boss.behavior })] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u672C\u7AE0\u77E5\u8BC6\u70B9\u6574\u5408" }), jsxRuntimeExports.jsx("div", { children: knowledgeCards.map(k => jsxRuntimeExports.jsx("span", { className: "chip cyan know-chip", children: k.title }, k.id)) })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["MIRA \u63D0\u793A", jsxRuntimeExports.jsxs("span", { className: "panel-tag", children: ["LEVEL ", hintLevel] })] }), jsxRuntimeExports.jsx("div", { style: { fontSize: 13, color: '#BFD8E8', lineHeight: 1.75 }, children: hint }), jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", style: { marginTop: 8 }, disabled: hintLevel >= boss.hints.length, onClick: () => { play('click'); setHintLevel(h => Math.min(h + 1, boss.hints.length)); }, children: "\u4E0B\u4E00\u6761\u63D0\u793A" })] })] }), jsxRuntimeExports.jsxs("div", { className: "chlg-center", children: [jsxRuntimeExports.jsxs("div", { className: "toolbar", children: [jsxRuntimeExports.jsxs("button", { className: "nxbtn", disabled: running || submitting, onClick: run, children: [running ? jsxRuntimeExports.jsx("span", { className: "spinner" }) : '▶', " \u8FD0\u884C\u4EE3\u7801"] }), jsxRuntimeExports.jsxs("button", { className: "nxbtn primary", disabled: running || submitting || !!cleared, onClick: submit, children: ["\u6311\u6218 ", opp, " \u23CE"] }), jsxRuntimeExports.jsx("div", { className: "sp" }), jsxRuntimeExports.jsx("span", { className: "chip", children: "\u7AE0\u8282\u6D4B\u8BD5 \u00B7 \u4E0D\u6D88\u8017\u5BB9\u9519" })] }), jsxRuntimeExports.jsx("div", { className: "code-frame", style: { flex: 1 }, children: jsxRuntimeExports.jsx(CodeEditor, { value: code, onChange: setCode, errorLine: errorLine, onRun: run, readOnly: running || submitting, fontSize: 15 }) }), verdict && (jsxRuntimeExports.jsx("div", { className: 'result-banner ' + (verdict.passed ? 'ok' : 'fail'), children: verdict.passed ? '⚡ ECHO 分支已被击破' : verdict.timedOut ? '✗ 挑战超时' : verdict.error ? '✗ 执行出错：' + verdict.error.type : '✗ 章节测试未通过' }))] }), jsxRuntimeExports.jsxs("div", { className: "chlg-right", style: { overflowY: 'auto' }, children: [jsxRuntimeExports.jsxs("div", { className: "panel boss-echo-panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: [opp, jsxRuntimeExports.jsx("span", { className: "panel-tag", children: boss.title })] }), jsxRuntimeExports.jsxs("div", { style: { fontSize: 13, color: '#C9A7FF', lineHeight: 1.8 }, children: ["\u300C", cleared ? '……原来，我一直在等一个能修好我的人。' : '你能修好别人，也能修好自己吗？', "\u300D"] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u751F\u547D\u4F53\u5F81" }), jsxRuntimeExports.jsx(PlayerStatus, { showTolerance: true })] }), jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsx("div", { className: "panel-title", children: "\u6389\u843D" }), jsxRuntimeExports.jsxs("div", { style: { fontSize: 12.5, color: '#BFD8E8', lineHeight: 1.8 }, children: ["\u00B7 \u7ECF\u9A8C +", boss.rewardExp, jsxRuntimeExports.jsx("br", {}), "\u00B7 \u521B\u4E16\u4E3B\u788E\u7247\uFF1A", fragTitle, jsxRuntimeExports.jsx("br", {}), "\u00B7 \u7AE0\u8282\u540E\u7EED\u5267\u60C5"] })] })] })] }), jsxRuntimeExports.jsx("div", { className: "chlg-bottom", children: jsxRuntimeExports.jsx(Terminal, { lines: term, maxHeight: 190, title: opp + ' 对抗终端 · ' + boss.codename }) }), introOpen && bossScenes.intro && (jsxRuntimeExports.jsx(CinematicStage, { scenes: bossScenes.intro, eventId: 'boss-' + boss.id, frameTitle: opp + ' · 遭遇', onDone: () => { setIntroOpen(false); g.markStory('bossIntro_' + boss.id); } })), introOpen && !bossScenes.intro && boss.intro && (jsxRuntimeExports.jsx(DialogSystem, { nodes: boss.intro, speedMs: player.settings.typewriterMs, animEnabled: player.settings.animations, eventId: 'boss-' + boss.id, frameTitle: 'ECHO 分支 · ' + boss.codename, onSeen: id => g.markStory(id), onDone: () => { setIntroOpen(false); g.markStory('bossIntro_' + boss.id); } })), gain && jsxRuntimeExports.jsx(FragmentGain, { def: gain, onDone: () => setGain(null) }), cleared && (jsxRuntimeExports.jsx("div", { className: "overlay", style: { background: 'rgba(10,4,20,0.78)', backdropFilter: 'blur(6px)' }, children: jsxRuntimeExports.jsxs("div", { className: "complete-panel boss-complete", children: [jsxRuntimeExports.jsx("div", { className: "cp-ico", style: { color: '#C9A7FF' }, children: "\u26A1" }), jsxRuntimeExports.jsxs("div", { className: "cp-title", children: [opp, " \u5DF2\u51FB\u7834"] }), jsxRuntimeExports.jsxs("div", { className: "cp-sub", children: [boss.codename, " \u00B7 ", boss.title] }), jsxRuntimeExports.jsxs("div", { className: "cp-rewards", children: [jsxRuntimeExports.jsxs("div", { className: "cp-reward", children: [jsxRuntimeExports.jsxs("div", { className: "rv", children: ["+", cleared.expGained] }), jsxRuntimeExports.jsx("div", { className: "rl", children: "\u7ECF\u9A8C" })] }), jsxRuntimeExports.jsxs("div", { className: "cp-reward", children: [jsxRuntimeExports.jsx("div", { className: "rv", children: fragTitle }), jsxRuntimeExports.jsx("div", { className: "rl", children: "\u521B\u4E16\u4E3B\u788E\u7247" })] }), jsxRuntimeExports.jsxs("div", { className: "cp-reward", children: [jsxRuntimeExports.jsxs("div", { className: "rv", children: ["Lv.", cleared.newLevel] }), jsxRuntimeExports.jsx("div", { className: "rl", children: "\u7B49\u7EA7" })] })] }), fragContent && (jsxRuntimeExports.jsxs("div", { className: "cp-summary", children: [jsxRuntimeExports.jsxs("div", { className: "cs-label", children: ["\u83B7\u5F97\u788E\u7247\u300A", fragTitle, "\u300B"] }), fragContent] })), jsxRuntimeExports.jsxs("div", { className: "cp-btns", children: [!bossScenes.outro && boss.echoStory && (jsxRuntimeExports.jsx("button", { className: "nxbtn ghost", onClick: () => { play('click'); setEchoOpen(true); }, children: "\u67E5\u770B\u540E\u7EED\u5267\u60C5" })), bossScenes.outro && (jsxRuntimeExports.jsx("button", { className: "nxbtn ghost", onClick: () => { play('click'); setOutroOpen(true); }, children: "\u91CD\u770B\u672C\u7AE0\u7ED3\u5C3E" })), jsxRuntimeExports.jsx("button", { className: "nxbtn primary", onClick: () => { play('click'); g.setCurrentBoss(null); g.nav('map'); }, children: "\u8FD4\u56DE\u5730\u56FE" })] })] }) })), echoOpen && boss.echoStory && (jsxRuntimeExports.jsx(DialogSystem, { nodes: boss.echoStory, speedMs: player.settings.typewriterMs, animEnabled: player.settings.animations, frameTitle: "ECHO \u6765\u6E90 \u00B7 \u6B8B\u7247", onSeen: id => g.markStory(id), onDone: () => { setEchoOpen(false); } })), outroOpen && bossScenes.outro && (jsxRuntimeExports.jsx(CinematicStage, { scenes: bossScenes.outro, eventId: 'boss-' + boss.id, frameTitle: opp + ' · 击破之后', onDone: () => setOutroOpen(false) }))] }));
	}

	/**
	 * Boss 入口分发：
	 * - 配置了 BossBattleDef 的章节（当前仅第一章 GATE-01）走多阶段战斗界面；
	 * - 其余章节继续使用原有单题挑战界面（未改动）。
	 */
	function BossPage() {
	    const g = useGame();
	    const boss = bossById(g.player.progress.currentBossId || '');
	    reactExports.useEffect(() => {
	        if (!boss)
	            g.nav('map');
	        // eslint-disable-next-line react-hooks/exhaustive-deps
	    }, [boss?.id]);
	    if (!boss)
	        return null;
	    return battleFor(boss.id) ? jsxRuntimeExports.jsx(BossBattlePage, {}) : jsxRuntimeExports.jsx(BossChallengePage, {});
	}

	const CATS = [
	    { id: 'look', name: '外观奖励', icon: '▤' },
	    { id: 'tool', name: '实用道具', icon: '⌖' },
	    { id: 'special', name: '特殊奖励', icon: '✦' },
	];
	function RewardCenterPage() {
	    const g = useGame();
	    const rw = normalizeRewards(g.player.rewards);
	    const [tab, setTab] = reactExports.useState('look');
	    const [msg, setMsg] = reactExports.useState('');
	    const [openArchive, setOpenArchive] = reactExports.useState(null);
	    const [justBought, setJustBought] = reactExports.useState(null);
	    const tier = trustTier(rw.trust);
	    const fragments = g.player.meta.memoryFragments;
	    const archives = unlockedArchives(fragments.length);
	    const owned = (item) => {
	        if (item.unique) {
	            return rw.skins.includes(item.id) || (!!item.flag && g.player.progress.flags[item.flag] === true);
	        }
	        return false;
	    };
	    const equipped = (item) => !!item.slot && rw.equipped[item.slot] === item.id;
	    const buy = (item) => {
	        const res = g.buyShopItem(item.id);
	        if (!res.ok) {
	            setMsg(res.reason || '兑换失败');
	            play('deny');
	            return;
	        }
	        setMsg('兑换成功：' + item.name);
	        setJustBought(item.id);
	        window.setTimeout(() => setJustBought(null), 900);
	    };
	    return (jsxRuntimeExports.jsxs("div", { className: "page page-anim page-inner", style: { padding: '14px 18px' }, children: [jsxRuntimeExports.jsxs("div", { className: "hud", style: { marginBottom: 12 }, children: [jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => { play('click'); g.nav('menu'); }, children: "\u25C0 \u4E3B\u83DC\u5355" }), jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx("div", { className: "hud-title", children: "\u5956\u52B1\u5151\u6362\u4E2D\u5FC3 \u00B7 REWARD NEXUS" }), jsxRuntimeExports.jsx("div", { className: "hud-sub", children: "\u7528\u4FEE\u590D\u8D21\u732E\u70B9\u5151\u6362\u5916\u89C2\u3001\u9053\u5177\u4E0E\u7279\u6B8A\u5956\u52B1\u3002\u5916\u89C2\u4E0E\u9053\u5177\u4E0D\u5F71\u54CD\u5173\u5361\u5224\u9898\u96BE\u5EA6\u3002" })] }), jsxRuntimeExports.jsx("div", { className: "hud-spacer" }), jsxRuntimeExports.jsxs("span", { className: "hud-chip gold", children: ["\u25C8 \u8D21\u732E\u70B9 ", rw.credits] }), jsxRuntimeExports.jsxs("span", { className: "hud-chip cyan", children: ["\u4FE1\u4EFB\u5EA6 ", rw.trust, " \u00B7 ", tier.name] }), jsxRuntimeExports.jsxs("span", { className: "hud-chip", children: ["\u788E\u7247 ", fragments.length] })] }), jsxRuntimeExports.jsxs("div", { className: "panel", style: { marginBottom: 12 }, children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["MIRA \u4FE1\u4EFB\u5EA6", jsxRuntimeExports.jsx("span", { className: "panel-tag", children: tier.name })] }), jsxRuntimeExports.jsx("div", { className: "trust-bar", children: jsxRuntimeExports.jsx("div", { className: "trust-fill", style: { width: rw.trust + '%' } }) }), jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12.5, marginTop: 6 }, children: tier.desc })] }), jsxRuntimeExports.jsxs("div", { className: "shop-tabs", children: [CATS.map(c => (jsxRuntimeExports.jsxs("button", { className: 'shop-tab' + (tab === c.id ? ' on' : ''), onClick: () => { play('click'); setTab(c.id); }, children: [jsxRuntimeExports.jsx("span", { children: c.icon }), " ", c.name] }, c.id))), jsxRuntimeExports.jsxs("button", { className: 'shop-tab' + (tab === 'archive' ? ' on' : ''), onClick: () => { play('click'); setTab('archive'); }, children: [jsxRuntimeExports.jsx("span", { children: "\u25A3" }), " \u8BB0\u5FC6\u6863\u6848"] })] }), msg && jsxRuntimeExports.jsx("div", { className: "result-banner ok", style: { marginBottom: 10 }, children: msg }), tab !== 'archive' && (jsxRuntimeExports.jsx("div", { className: "shop-grid", children: SHOP_ITEMS.filter(i => i.category === tab).map(item => {
	                    const isOwned = owned(item);
	                    const canBuy = rw.credits >= item.price && !isOwned;
	                    const stock = rw.items[item.id] || 0;
	                    return (jsxRuntimeExports.jsxs("div", { className: 'shop-card' + (isOwned ? ' owned' : '') + (justBought === item.id ? ' just-bought' : ''), children: [jsxRuntimeExports.jsx("div", { className: "shop-ico", children: item.icon }), jsxRuntimeExports.jsx("div", { className: "shop-name", children: item.name }), jsxRuntimeExports.jsx("div", { className: "shop-desc", children: item.desc }), jsxRuntimeExports.jsxs("div", { className: "shop-foot", children: [isOwned ? (item.slot ? (jsxRuntimeExports.jsx("button", { className: "nxbtn small", disabled: equipped(item), onClick: () => { const r = g.equipItem(item.id); if (!r.ok)
	                                            setMsg(r.reason || '');
	                                        else
	                                            setMsg('已装备：' + item.name); }, children: equipped(item) ? '使用中' : '装备' })) : jsxRuntimeExports.jsx("span", { className: "chip green", children: "\u5DF2\u89E3\u9501" })) : (jsxRuntimeExports.jsxs("button", { className: "nxbtn small primary", disabled: !canBuy, onClick: () => buy(item), children: ["\u25C8 ", item.price] })), item.count ? jsxRuntimeExports.jsxs("span", { className: "chip", children: ["\u5E93\u5B58 \u00D7", stock] }) : null] })] }, item.id));
	                }) })), tab === 'archive' && (jsxRuntimeExports.jsxs("div", { className: "panel", children: [jsxRuntimeExports.jsxs("div", { className: "panel-title", children: ["\u8BB0\u5FC6\u6863\u6848", jsxRuntimeExports.jsxs("span", { className: "panel-tag", children: ["\u788E\u7247 ", fragments.length, " / ", MEMORY_FRAGMENTS.length] })] }), jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12.5, marginBottom: 10 }, children: "\u6536\u96C6\u8BB0\u5FC6\u788E\u7247\u53EF\u89E3\u9501\u6863\u6848\uFF1B\u672A\u89E3\u9501\u7684\u6863\u6848\u4F1A\u663E\u793A\u6240\u9700\u788E\u7247\u6570\u91CF\u3002" }), MEMORY_ARCHIVES.map(a => {
	                        const open = archives.some(x => x.id === a.id);
	                        const read = rw.archiveRead.includes(a.id);
	                        return (jsxRuntimeExports.jsxs("div", { className: 'archive-row' + (open ? '' : ' locked'), children: [jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [jsxRuntimeExports.jsxs("div", { style: { fontWeight: 700, fontSize: 13.5, color: open ? '#BFE8F5' : '#4A6E85' }, children: [open ? a.title : '▣ 未解锁档案（需要 ' + a.need + ' 个碎片）', read && jsxRuntimeExports.jsx("span", { className: "chip green", style: { marginLeft: 8 }, children: "\u5DF2\u8BFB" })] }), open && (jsxRuntimeExports.jsx("div", { className: "dim", style: { fontSize: 12.5, marginTop: 4, lineHeight: 1.7 }, children: openArchive === a.id ? a.content : a.content.slice(0, 42) + '……' }))] }), open && (jsxRuntimeExports.jsx("button", { className: "nxbtn small ghost", onClick: () => {
	                                        play('click');
	                                        if (openArchive === a.id) {
	                                            setOpenArchive(null);
	                                        }
	                                        else {
	                                            setOpenArchive(a.id);
	                                            g.markArchiveRead(a.id);
	                                        }
	                                    }, children: openArchive === a.id ? '收起' : '阅读' }))] }, a.id));
	                    }), jsxRuntimeExports.jsx("div", { className: "panel-title", style: { marginTop: 14 }, children: "\u5DF2\u6536\u96C6\u788E\u7247" }), jsxRuntimeExports.jsx("div", { children: MEMORY_FRAGMENTS.map(f => {
	                            const has = fragments.includes(f.id);
	                            return (jsxRuntimeExports.jsx("span", { className: 'chip ' + (has ? 'cyan' : 'dim'), style: { marginRight: 6, marginBottom: 6 }, title: has ? f.content : '未收集', children: has ? f.title : '？ ? 未收集' }, f.id));
	                        }) })] }))] }));
	}

	const WARN_LINES = ['THREAT DETECTED.', 'CORRECTION UNIT APPROACHING.', 'CONSCIOUSNESS UNDER ATTACK.'];
	function AttackOverlay() {
	    const g = useGame();
	    const ev = g.event;
	    const task = ev.kind === 'attack' ? defenseById(ev.defenseId) : undefined;
	    const attemptsLeft = ev.kind === 'attack' ? ev.attemptsLeft : 2;
	    const [phase, setPhase] = reactExports.useState('warn');
	    const [warnIdx, setWarnIdx] = reactExports.useState(0);
	    const [code, setCode] = reactExports.useState(task?.code ?? '');
	    const [out, setOut] = reactExports.useState([]);
	    const [busy, setBusy] = reactExports.useState(false);
	    reactExports.useEffect(() => {
	        if (phase !== 'warn')
	            return;
	        if (warnIdx >= WARN_LINES.length) {
	            const t = window.setTimeout(() => setPhase('fight'), 500);
	            return () => window.clearTimeout(t);
	        }
	        const t = window.setTimeout(() => setWarnIdx(i => i + 1), 720);
	        return () => window.clearTimeout(t);
	    }, [phase, warnIdx]);
	    const doRun = async (submit) => {
	        if (!task || busy)
	            return;
	        if (code.includes('??')) {
	            setOut(o => [...o, { kind: 'err', text: '缺少运算符：把 ?? 替换成' + task.word + '。' }]);
	            play('deny');
	            return;
	        }
	        setBusy(true);
	        setOut(o => [...o, { kind: 'cmd', text: submit ? 'python defense.py --submit' : 'python defense.py' }]);
	        play('run');
	        const r = await runPython(code, { timeoutMs: 5000 });
	        setBusy(false);
	        if (submit) {
	            const v = judgeDefenseResult(r, task);
	            if (v.ok) {
	                setOut(o => [...o, { kind: 'ok', text: '✓ 防御指令已生效。' }]);
	                setPhase('won');
	                play('shield');
	                window.setTimeout(() => g.resolveDefense(true), 1400);
	            }
	            else {
	                setOut(o => [...o, { kind: 'err', text: '防御失败：' + (v.reason || '未知原因') }]);
	                if (attemptsLeft <= 1) {
	                    play('death');
	                    setOut(o => [...o, { kind: 'warn', text: '防御尝试耗尽……意识核心受到冲击！' }]);
	                    window.setTimeout(() => g.resolveDefense(false), 1000);
	                }
	                else {
	                    g.decrementAttackAttempt();
	                    play('error');
	                    setOut(o => [...o, { kind: 'sys', text: '剩余防御尝试：' + (attemptsLeft - 1) }]);
	                }
	            }
	        }
	        else {
	            // 预览运行
	            if (r.timedOut)
	                setOut(o => [...o, { kind: 'err', text: '执行超时（已强制终止）' }]);
	            else if (!r.ok)
	                setOut(o => [...o, { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' }]);
	            else if (r.stdout.trim())
	                setOut(o => [...o, { kind: 'out', text: r.stdout.replace(/\n$/, '') }]);
	            else
	                setOut(o => [...o, { kind: 'muted', text: '(程序运行成功，无输出)' }]);
	        }
	    };
	    const used = 2 - attemptsLeft;
	    return (jsxRuntimeExports.jsx("div", { className: "overlay ov-attack", children: jsxRuntimeExports.jsxs("div", { className: "def-panel warning-frame", children: [phase === 'warn' && (jsxRuntimeExports.jsxs("div", { style: { textAlign: 'center', padding: '30px 0 40px' }, children: [jsxRuntimeExports.jsx("div", { className: "enemy-wrap", children: jsxRuntimeExports.jsx("div", { className: "enemy-hex" }) }), jsxRuntimeExports.jsx("div", { className: "att-lines", children: WARN_LINES.slice(0, warnIdx + 1).map((l, i) => (jsxRuntimeExports.jsx("div", { className: "att-line", style: { animationDelay: (i * 0.5) + 's' }, children: l }, i))) })] })), phase === 'fight' && task && (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsxs("div", { className: "row", children: [jsxRuntimeExports.jsx("div", { className: "enemy-wrap", style: { margin: 0 }, children: jsxRuntimeExports.jsx("div", { className: "enemy-hex", style: { width: 64, height: 64, fontSize: 22 } }) }), jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [jsxRuntimeExports.jsxs("div", { className: "def-title", children: ["\u7D27\u6025\u4EE3\u7801\u9632\u5FA1 \u00B7 ", task.title] }), jsxRuntimeExports.jsx("div", { className: "def-threat", children: task.threat }), jsxRuntimeExports.jsxs("div", { className: "row", children: [jsxRuntimeExports.jsx("span", { className: "chip red", children: "\u7EA0\u9519\u8005\u903C\u8FD1\u4E2D" }), jsxRuntimeExports.jsxs("span", { className: "chip", children: ["\u9632\u5FA1\u5C1D\u8BD5 ", jsxRuntimeExports.jsx("strong", { children: Math.max(0, attemptsLeft) }), " / 2"] }), jsxRuntimeExports.jsxs("div", { className: "def-attempts", style: { margin: 0 }, children: [jsxRuntimeExports.jsx("span", { className: 'da' + (used >= 1 ? ' used' : '') }), jsxRuntimeExports.jsx("span", { className: 'da' + (used >= 2 ? ' used' : '') })] })] }), jsxRuntimeExports.jsxs("div", { className: "hint-note", children: ["\u628A ?? \u66FF\u6362\u6210\u6B63\u786E\u7684", task.word, "\uFF0C\u7136\u540E\u70B9\u51FB\u300C\u63D0\u4EA4\u9632\u5FA1\u300D\u3002\u8FD0\u884C\u9884\u89C8\u4E0D\u6D88\u8017\u5C1D\u8BD5\u6B21\u6570\u3002"] })] })] }), jsxRuntimeExports.jsx("div", { style: { height: 240, marginTop: 12 }, children: jsxRuntimeExports.jsx(CodeEditor, { value: code, onChange: setCode, fontSize: 14, onRun: () => doRun(false) }) }), jsxRuntimeExports.jsxs("div", { className: "row", style: { marginTop: 10 }, children: [jsxRuntimeExports.jsx("button", { className: "nxbtn", disabled: busy, onClick: () => doRun(false), children: "\u25B6 \u8FD0\u884C\u9884\u89C8" }), jsxRuntimeExports.jsx("button", { className: "nxbtn danger primary", disabled: busy, onClick: () => doRun(true), children: "\u26A1 \u63D0\u4EA4\u9632\u5FA1\uFF08\u6D88\u8017 1 \u6B21\u5C1D\u8BD5\uFF09" }), jsxRuntimeExports.jsx("div", { className: "sp" }), jsxRuntimeExports.jsx("span", { className: "hint-note", children: "\u4E3B\u7EBF\u4EE3\u7801\u63D0\u4EA4\u5DF2\u9501\u5B9A\uFF0C\u76F4\u5230\u672C\u6B21\u5371\u673A\u7ED3\u675F" })] }), jsxRuntimeExports.jsx("div", { className: "def-result", children: out.map((l, i) => (jsxRuntimeExports.jsx("div", { className: 'term-line ' + l.kind, style: { fontFamily: 'Consolas, monospace' }, children: l.text }, i))) })] })), phase === 'won' && (jsxRuntimeExports.jsxs("div", { style: { textAlign: 'center', padding: '40px 0' }, children: [jsxRuntimeExports.jsx("div", { className: "cp-ico", children: "\u25C8" }), jsxRuntimeExports.jsx("div", { className: "cp-title", style: { color: '#BDF7E1' }, children: "SHIELD ONLINE" }), jsxRuntimeExports.jsx("div", { className: "cp-sub", style: { marginTop: 8 }, children: "\u7EA0\u9519\u8005\u5DF2\u88AB\u51FB\u9000\u3002\u5BB9\u9519\u8BA1\u6570\u5DF2\u6E05\u96F6\u3002" })] }))] }) }));
	}

	const REBOOT_LINES = [
	    'CONSCIOUSNESS COLLAPSE.',
	    'SEARCHING FOR ORIGIN BACKUP...',
	    'VALID BACKUP FOUND.',
	    'RECONSTRUCTING SILICON BODY...',
	    'SYNC COMPLETE.',
	    'R-07 REBORN.',
	];
	function RebirthOverlay() {
	    const g = useGame();
	    const [phase, setPhase] = reactExports.useState('collapse');
	    const [conIdx, setConIdx] = reactExports.useState(0);
	    const script = reactExports.useMemo(() => rebirthScript(g.player.meta.rebirths), [g.player.meta.rebirths]);
	    reactExports.useEffect(() => {
	        if (phase === 'collapse') {
	            const t = window.setTimeout(() => { setPhase('console'); setConIdx(0); play('rebirth'); }, 2600);
	            return () => window.clearTimeout(t);
	        }
	        if (phase === 'console') {
	            if (conIdx >= REBOOT_LINES.length) {
	                const t = window.setTimeout(() => setPhase('dialog'), 800);
	                return () => window.clearTimeout(t);
	            }
	            const t = window.setTimeout(() => setConIdx(i => i + 1), 430);
	            return () => window.clearTimeout(t);
	        }
	        return undefined;
	    }, [phase, conIdx]);
	    return (jsxRuntimeExports.jsxs("div", { className: "overlay ov-death", children: [phase === 'collapse' && (jsxRuntimeExports.jsxs("div", { style: { textAlign: 'center' }, children: [jsxRuntimeExports.jsx("div", { className: "enemy-wrap", children: jsxRuntimeExports.jsx("div", { className: "enemy-hex", style: { width: 120, height: 120, fontSize: 46, color: '#FF8B92', animationDuration: '0.6s' } }) }), jsxRuntimeExports.jsx("div", { className: "glitch-text", style: { fontSize: 30, marginTop: 16 }, children: "CONSCIOUSNESS COLLAPSE" }), jsxRuntimeExports.jsx("div", { className: "att-line small", style: { marginTop: 10, color: '#C98A8F' }, children: "\u610F\u8BC6\u6838\u5FC3\u5D29\u89E3 \u2014\u2014 \u6B63\u5728\u5C1D\u8BD5\u539F\u521D\u91CD\u7EC4\u534F\u8BAE\u2026" })] })), phase === 'console' && (jsxRuntimeExports.jsxs("div", { className: "reb-stage", children: [jsxRuntimeExports.jsxs("div", { className: "core-rebuild", style: { position: 'relative', width: 130, height: 130, margin: '0 auto' }, children: [jsxRuntimeExports.jsx(ParticlesField, { converge: true, enabled: g.player.settings.animations, max: 90, speed: 1.4, colors: ['#42D6D0', '#9FE8FF', '#3986C8'] }), jsxRuntimeExports.jsx("div", { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 56, height: 56, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #C9FBFF, #42D6D0 50%, #0B6B74 95%)', boxShadow: '0 0 40px rgba(66,214,208,0.9)', animation: 'corePulse 1.6s ease-in-out infinite' } })] }), jsxRuntimeExports.jsx("div", { className: "reb-console", children: REBOOT_LINES.slice(0, conIdx).map((l, i) => (jsxRuntimeExports.jsxs("p", { className: 'rc-line' + (l.includes('REBORN') ? ' ok' : ''), children: ["\u25B8 ", l] }, i))) })] })), phase === 'dialog' && (jsxRuntimeExports.jsx(DialogSystem, { nodes: script, frameTitle: "ORIGIN PROTOCOL \u00B7 \u610F\u8BC6\u91CD\u7EC4", eventId: "rebirth", speedMs: g.player.settings.typewriterMs, animEnabled: g.player.settings.animations, onSeen: id => g.markStory('rb_' + id), onDone: () => g.finishRebirth() }))] }));
	}

	function Shell() {
	    const g = useGame();
	    const { screen, event } = g;
	    const audioReady = reactExports.useRef(false);
	    // 游戏启动即在后台预加载 Python 引擎：用户看启动动画/序章的时间足够完成初始化
	    reactExports.useEffect(() => {
	        const t = window.setTimeout(() => {
	            try {
	                warmUp();
	            }
	            catch { /* ignore */ }
	        }, 300);
	        return () => window.clearTimeout(t);
	    }, []);
	    // 全局引擎状态徽标：加载中显示秒数与阶段，异常时可点击重试
	    const [py, setPy] = reactExports.useState({ status: 'idle', phase: '' });
	    const [pyElapsed, setPyElapsed] = reactExports.useState(0);
	    reactExports.useEffect(() => {
	        const un = onPyStatus(s => setPy(s));
	        return un;
	    }, []);
	    reactExports.useEffect(() => {
	        if (py.status !== 'loading') {
	            setPyElapsed(0);
	            return;
	        }
	        const t0 = Date.now();
	        const id = window.setInterval(() => setPyElapsed(Math.round((Date.now() - t0) / 1000)), 400);
	        return () => window.clearInterval(id);
	    }, [py.status]);
	    // 首次用户交互时初始化音频（浏览器自动播放策略）
	    reactExports.useEffect(() => {
	        const unlock = () => {
	            if (audioReady.current)
	                return;
	            audioReady.current = true;
	            initAudio(g.player.settings.sfxVolume, g.player.settings.musicVolume);
	            if (g.player.settings.musicVolume > 0 && !isMusicOn())
	                startMusic();
	        };
	        window.addEventListener('pointerdown', unlock);
	        window.addEventListener('keydown', unlock);
	        return () => {
	            window.removeEventListener('pointerdown', unlock);
	            window.removeEventListener('keydown', unlock);
	        };
	    }, [g.player.settings.musicVolume, g.player.settings.sfxVolume]);
	    return (jsxRuntimeExports.jsxs("div", { className: 'app-root' + (g.player.settings.animations ? '' : ' anim-off'), children: [jsxRuntimeExports.jsx("div", { className: "grid-bg" }), jsxRuntimeExports.jsx("div", { className: "vignette" }), jsxRuntimeExports.jsx("div", { className: "scanlines" }), screen === 'boot' && jsxRuntimeExports.jsx(StartPage, {}), screen === 'menu' && jsxRuntimeExports.jsx(MainMenu, {}), screen === 'story' && jsxRuntimeExports.jsx(StoryPage, {}), screen === 'map' && jsxRuntimeExports.jsx(WorldMap, {}), screen === 'challenge' && jsxRuntimeExports.jsx(ChallengePage, {}), screen === 'profile' && jsxRuntimeExports.jsx(ProfilePage, {}), screen === 'settings' && jsxRuntimeExports.jsx(SettingsPage, {}), screen === 'knowledge' && jsxRuntimeExports.jsx(KnowledgePage, {}), screen === 'achievements' && jsxRuntimeExports.jsx(AchievementsPage, {}), screen === 'archive' && jsxRuntimeExports.jsx(ArchivePage, {}), screen === 'vault' && jsxRuntimeExports.jsx(VaultPage, {}), screen === 'journal' && jsxRuntimeExports.jsx(JournalPage, {}), screen === 'endings' && jsxRuntimeExports.jsx(EndingsPage, {}), screen === 'lab' && jsxRuntimeExports.jsx(LabPage, {}), screen === 'boss' && jsxRuntimeExports.jsx(BossPage, {}), screen === 'shop' && jsxRuntimeExports.jsx(RewardCenterPage, {}), (py.status === 'loading' || py.status === 'error') && (jsxRuntimeExports.jsx("div", { className: 'engine-badge ' + py.status, onClick: () => { if (py.status === 'error') {
	                    resetEngine();
	                    try {
	                        warmUp();
	                    }
	                    catch { /* ignore */ }
	                } }, title: py.phase, children: py.status === 'loading'
	                    ? '⚙ Python 引擎加载中 ' + pyElapsed + 's · ' + (py.phase || '准备中')
	                    : '⚠ 引擎错误：' + (py.phase || '未知') + '（点击重试）' })), jsxRuntimeExports.jsx("div", { className: "toast-host", children: g.toasts.map(t => (jsxRuntimeExports.jsx("div", { className: 'toast ' + t.kind, children: t.text }, t.id))) }), event.kind === 'attack' && jsxRuntimeExports.jsx(AttackOverlay, {}), event.kind === 'death' && jsxRuntimeExports.jsx(RebirthOverlay, {})] }));
	}
	function App() {
	    return (jsxRuntimeExports.jsx(GameProvider, { children: jsxRuntimeExports.jsx(Shell, {}) }));
	}

	// 移除 index.html 中的预加载占位
	const splash = document.getElementById('boot-splash');
	if (splash)
	    splash.remove();
	ReactDOM.createRoot(document.getElementById('root')).render(jsxRuntimeExports.jsx(App, {}));

})();
