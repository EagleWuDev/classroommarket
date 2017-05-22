$('document').ready(function() {
  var round = $('.round');
    round.each(function(item, index){
      var num = parseFloat($(this).text());
      var round = Math.round(num * 100) / 100;
      $(this).text(round);
    })

  var dates = $('.dateNice');
  	dates.each(function(item, index){
  		var dateRaw = $(this).text() + "";
  		var arr = dateRaw.split(' ');
  		var newDate = "";

  		for(var i = 0; i < 4; i++) {
  			if(i === 0) {
  				newDate = arr[i] + ",";
  			} else {
  				newDate = newDate + " " + arr[i];
  			}
  		}

  		$(this).text(newDate)

  	})
})

