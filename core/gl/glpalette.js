// MIT License.

define(function (require, exports) {
	exports.pal0 = function(t){
		return mix(vec3(0),vec3(1), t)
	}
	exports.pal1 = 
	exports.rainbow = function(t){
		return pal(t, vec3(.5),vec3(.5),vec3(1),vec3(0,0.33,0.67))
	}

	exports.pal2 =
	exports.hotcool = function(t){
		return pal(t, vec3(.5),vec3(.5),vec3(1),vec3(0,0.1,0.2))
	}

	exports.pal3 = 
	exports.pinkblue = function(t){
		return pal(t, vec3(.5),vec3(.5),vec3(1),vec3(0.3,0.2,0.2))
	}

	exports.pal4 = 
	exports.greenish = function(t){
		return pal(t, vec3(.5),vec3(.5),vec3(1.,1.,.5),vec3(0.8,0.9,0.3))
	}

	exports.pal5 = 
	exports.dipper = function(t){
		return pal(t, vec3(.5),vec3(.5),vec3(1.,0.7,.4),vec3(0,0.15,0.20))
	}

	exports.pal6 = 
	exports.purply = function(t){
		return pal(t, vec3(.5),vec3(.5),vec3(2.,1.0,0.),vec3(0.5,0.2,0.25))
	}

	exports.pal7 = 
	exports.reddish = function(t){
		return pal(t, vec3(.8,.5,.4),vec3(.2,.4,.2),vec3(2.,1.0,1.0),vec3(0.,0.25,0.25))
	}

	exports.pal = function (t, a, b, c, d) {
		return a + b * cos(6.28318 * (c * t + d));
	}

	exports.texture = require('$textures/noise.png');
	exports.checkertex  = require('$textures/checker.png');
	exports.crystaltex  = require('$textures/hex_tiles.png');

	exports.fetch = function (pos) {
		return texture.sample(pos)
	}

	exports.band_with_dither = function (y, col) {

		var f = fract(y);
		f = pow(f, 0.5);
		col.xyz *= smoothstep(0.49, 0.47, abs(f - 0.5));
		col.xyz *= 0.5 + 0.5 * sqrt(4.0 * f * (1.0 - f));

		//col += (10.0/255.0)*texture.sample(mod(gl_FragCoord.xy / texture.size.xy,1.0));

		var texc = mod((vec2(gl_FragCoord.x, 1.0 - gl_FragCoord.y) + vec2(0.5)) / texture.size.xy, 1.0);

		col.xyz += 0.01 * texture.sample(texc).xyz;

		return col;
	}
	
	exports.dither = function(col){
		var texc = mod((vec2(gl_FragCoord.x, 1.0 - gl_FragCoord.y) + vec2(0.5)) / texture.size.xy, 1.0);

		col.xyz += 0.03 * texture.sample(texc).xyz;

		return col;
	}
	
	exports.dithercrystal = function(col, time){
		var texc = mod((vec2(gl_FragCoord.x, 1.0 - gl_FragCoord.y) + vec2(0.5)) / texture.size.xy, 1.0);
var R = crystaltex.sample(mod(texc*0.2,1.0)).x * crystaltex.sample(mod(vec2(0,time*0.12314) +texc.yx*0.625123,1.0)).y;
R = 1.0- R;
R = R*R*R;
		col.xyz *=  0.6+R;

		return col;
	}
	
	exports.checker = function(col){
		var texc = mod((vec2(gl_FragCoord.x, 1.0 - gl_FragCoord.y) + vec2(0.5)) / checkertex.size.xy, 1.0);

		col.xyz += 0.03 * checkertex.sample(texc).xyz;

		return col;
		
	}
	exports.band_no_dither = function (y, col) {
		var f = fract(y);
		col *= smoothstep(0.49, 0.47, abs(f - 0.5));
		col *= 0.5 + 0.5 * sqrt(4.0 * f * (1.0 - f));
		return col;
	}

	exports.hsv2rgb = function (hsv) {
		return hsv.z * (1.0 + 0.5 * hsv.y * (cos(6.2832 * (hsv.x + vec3(0.0, 0.6667, 0.3333))) - 1.0));
	}
});
