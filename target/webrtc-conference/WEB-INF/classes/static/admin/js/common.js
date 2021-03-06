var baseUrl = "/webrtc-conference/";

/**
 * 时间戳格式化为日期
 * 
 * @param timestamp
 * @returns
 */
function getFormatDate(timestamp) {
	var newDate = new Date(timestamp);
	Date.prototype.format = function(format) {
		var date = {
			'M+' : this.getMonth() + 1,
			'd+' : this.getDate(),
			'h+' : this.getHours(),
			'm+' : this.getMinutes(),
			's+' : this.getSeconds(),
			'q+' : Math.floor((this.getMonth() + 3) / 3),
			'S+' : this.getMilliseconds()
		};
		if (/(y+)/i.test(format)) {
			format = format.replace(RegExp.$1, (this.getFullYear() + '')
					.substr(4 - RegExp.$1.length));
		}
		for ( var k in date) {
			if (new RegExp('(' + k + ')').test(format)) {
				format = format.replace(RegExp.$1,
						RegExp.$1.length == 1 ? date[k] : ('00' + date[k])
								.substr(('' + date[k]).length));
			}
		}
		return format;
	}
	return newDate.format('yyyy-MM-dd h:m');
}


//判空
function isNullOrEmpty(variable) {
    return variable == null || variable == undefined || variable == '' || variable == 'NaN';
}