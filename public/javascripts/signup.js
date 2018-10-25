$(document).ready(function(){

	$('#joinNow').click(function(e){
		var signUp = document.getElementById("signUpForm");
		console.log(signUp);
		zenscroll.center(signUp)
	})

	$('#contactSubmit').click(function(e){

		console.log('clicked');
		var name = $('#nameContact').val();
		var email = $('#emailContact').val();

		console.log(name);
		console.log(email);

		$.ajax({
			  type: "POST",
			  data: {'name' : name, 'email': email},
			  url: "/joinUp",
			  success: function(response){
				console.log('getting response');
				console.log(response)
				if(response['success']){
					$('#contactForm').fadeOut();

					$('#thankYou').delay(500).fadeIn();
				}
			  }
		})
	})

})