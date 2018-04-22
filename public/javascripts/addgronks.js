$('document').ready(function() {

	$('#giveGronks').click(function(e){
		var data = [];
	
		$('input[name="gronks[]"]').each(function(item, index){
			var iden = this.id;
			var ret = [];

			console.log("value", this.value);

			if (this.value) {
				ret[0] = iden;
				ret[1] = this.value;
				data.push(ret);
				console.log('Null');
			} else {
				ret[0] = iden;
				ret[1] = 0;
				data.push(ret);
			}
		});

		var assignId = $('#assignment').attr('assign');
		var classId = $('#assignment').attr('classRoom');
		var dayId = $('#assignment').attr('day')


		$.ajax({type: "POST",
				 data: {'classId' : classId, 
				  		'assignId' : assignId, 
				  		'dayId' : dayId,
				  		'data' : JSON.stringify(data)}, 	
				 url:"/addGronks", 	
				 success: function(response){
					console.log(response)

					if(response['success']){
						window.location.replace("/classRoom/"+classId);
					}
				 }
		});
    })
})