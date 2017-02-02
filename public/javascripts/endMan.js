console.log('script loaded');

$('document').ready(function() {

	$('.end_assignment').click(function(e){

		var assignId = $(this).attr('assignId');
		var classId = $('#class').attr('classId');

		$.ajax({type: "POST",
				data: {
					'assignId': assignId,
					'classId': classId
				},
				url: "/calculatePrice",
				success:function(response) {
					console.log(response);
				}

		})

	})

})

