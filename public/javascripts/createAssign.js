console.log('hello');

$('document').ready(function() {
	var assigns = $('.assign');
	console.log(assigns);
	var len = assigns.length-1;
	console.log('len', len);
	var id = $(assigns[len]).attr('id');
	var classId = $('#class').attr('classId');


	var addWage = function(lastDay) {
		console.log('in function')

		var num = parseInt($('#numDays').val());
		$('div#days').css('display','none');
		var wrapper = $('<div></div>');


		console.log(num)
		console.log($.type(num))
		for(var i = 0; i < num; i++ ){
		
			var current = lastDay + i;
			wrapper.append($('<label>Class #' + current + ' Wage</label>'));
			wrapper.append($('<input type = "Number" id=' + current +' class="form-control wage" value=1>'));
		}

		wrapper.html();

		$('div#doge').append(wrapper)
	}

	$('#nextButton').click(function(e){

		var wages = $('.wage');

		if(wages.length === 0){
			e.preventDefault();
			if(len < 0){
				localStorage.classId = 1;

				addWage(1);

			} else {
			$.ajax({type: "POST",
				data: {
					'id' : id,
					'classId' : classId
				},
				url: "/findLatestDay",
				success:function(response){
					console.log(response)
					localStorage.classId = response.data;

					console.log(localStorage.classId);
					addWage(parseInt(localStorage.classId));
				}
			})
			}
		} else {
			e.preventDefault();
			var wageArr = [];
			

			for(var i = 0; i < wages.length; i++){
				wageArr[i] = [$(wages[i]).attr('id') , $(wages[i]).val()];
			}

			
			var e = document.getElementById("assignLast");
			var assignLast = e.options[e.selectedIndex].value;

		

			$.ajax({type: "POST",
				data: {
					'assignName' : $('#assignName').val(),
					'assignDate' : $('#assignDate').val(),
					'assignWeight' : $('#assignWeight').val(),
					'assignLast' : assignLast,
					'wages' : JSON.stringify(wageArr)
				},
				url: '/classRoom/' + classId,
				success:function(response){
					console.log(response);
					window.location.replace("/classRoom/" +classId)
				}
			})
		}
	})



	$('.nextButton1').click(function(e){
		e.preventDefault();
		console.log('clicked');
		var assignId = $(this).attr('assign-id');
		var dueDate = $('#newAssignDate' + assignId).val();
		var amount = $('#addAssignDays' + assignId).val();
		if ($('#assignLast' + assignId).is(":checked"))
		{
			var assignLast = true;
		} else {
			var assignLast = false;
		}

		console.log('assignLast', assignLast)
		$.ajax({type: "POST",
			data: {
				'assignId': assignId,
				'dueDate': dueDate,
				'wageAmount':amount,
				'assignLast': assignLast,
				'classId': classId
			},
			url: '/editAssign/' + classId,
			success:function(response){
				console.log(response);
				if(response.success){
					window.location.replace('/classRoom/'+classId);
				}

			}
		})



	})
	





})