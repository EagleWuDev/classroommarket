
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
			    		$(".successId").css("display","block");
			    		setTimeout(3000);
			    		window.location.replace("/classRoom/"+classId);
			    	}
			    	else {
			    		$(".insufficientId").css("display","block");
			    	}
			    }

		})
		
	})

	$('.modal').on('hidden.bs.modal', function(e) {
		$(".insufficientId").css("display","none");
		$(".successId").css("display","none");
	})




})