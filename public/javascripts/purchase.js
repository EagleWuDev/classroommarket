
console.log('script loaded')

$(document).ready(function(e){

	$('.purchase').click(function(e){

		var assignId = $(this).attr('assignId')
		var classId = $('#className').attr('classId');
		var amount = $('#value' + assignId).val();

		$.ajax({type: "POST",
			    data: {
			    	'classId' : classId,
			    	'assignId': assignId,
			    	'amount': amount
			    }, 
			    url: "/transaction",
			    success:function(response){
			    	console.log(response);

			    	if(response.success){
			    		window.location.replace("/classRoom/"+classId);
			    	}
			    }

		})
		
	})
})