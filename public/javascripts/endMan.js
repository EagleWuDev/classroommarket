console.log('script loaded');

$('document').ready(function() {

	var classId = $('#class').attr('classId');

	$('.end_assignment').click(function(e){

		var assignId = $(this).attr('assignId');

		$.ajax({type: "POST",
				data: {
					'assignId': assignId,
					'classId': classId
				},
				url: "/calculatePrice",
				success:function(response) {
					console.log(response);
					window.location.replace("/classRoom/" +classId)
				}

		})

	})

	$('#addExtraCredit').click(function(e){

		e.preventDefault();

		var assignId = $(this).attr('assignId');
		var amount = $('#extraCreditAdd' + assignId).val();
		console.log("assignId", assignId);
		console.log("amount", amount);

		$.ajax({type: 'POST',
				data: {
					'assignId': assignId,
					'classId': classId,
					'amount': amount
				},
				url: "/addExtraCreditAssign", 
				success:function(response) {
					console.log(response);
					window.location.replace('/classRoom/' + classId)
				}

			})

	})

})

