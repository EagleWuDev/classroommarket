$('document').ready(function() {

	$('#giveExtraGronks').click(function(e){
		var data = [];
	
		$('input[name="gronks[]"]').each(function(item, index){
			var iden = this.id;
			var ret = [];
			ret[0] = iden;
			ret[1] = this.value;
			data.push(ret);
		});

		var classId = $(this).attr('classId');

		console.log('classId', classId);

		$.ajax({type: "POST",
				 data: {'classId' : classId, 
				  		'data' : JSON.stringify(data)}, 	
				 url:"/addExtraGronks", 	
				 success: function(response){
					console.log(response)

					if(response['success']){
						console.log(response['message']);
						window.location.replace("/classRoom/"+classId);
					}
				 }
		});
    })
})