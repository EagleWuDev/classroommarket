$(document).ready(function(){

	$('#joinNow').click(function(e){
		var signUp = document.getElementById("signUpForm");
		console.log(signUp);
		zenscroll.center(signUp)
	})

	$('#contactSubmit').click(function(e){
		e.preventDefault();
		console.log('clicked');
		var name = $('#nameContact').val();
		var email = $('#emailContact').val();

		$.ajax({
			  type: "POST",
			  data: {'name' : name, 'email': email},
			  url: "/signUp",
			  success: function(response){
				console.log(response);
				if(response['success']){
					$('#contactForm').fadeOut();

					$('#thankYou').delay(500).fadeIn();
				}
			  }
		})
	})

})