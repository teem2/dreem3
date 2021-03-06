// Copyright 2015 Teem2 LLC, MIT License (see LICENSE)
// promisify

define(function(){
	// turn a callback method into a promise
	function promisify(call){
		return function(){
			var arg = Array.prototype.slice.call(arguments)
			return new Promise(function(resolve, reject){
				arg.push(function(err, result){
					if(err) reject(err)
					else resolve(result)
				})
				call.apply(this, arg)
			}.bind(this))
		}
	}

	promisify.timeout = function(time){
		return new Promise(function(resolve){
			setTimeout(function(){
				resolve(time)
			}, time)
		})
	}

	return promisify
})