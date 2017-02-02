//on button click
console.log('script loaded')

$(document).ready(function() { 

	$('#search').on('input', function() {
		console.log('typing');
		var search = $('#search').val();
		$.ajax({
			  url: "/search", 
			  headers: {'search' : search},
			  type: "GET",
			  success: function(response){

			  	render(response.data);
				console.log(response);

			  }
		})
	})
})

var render = function(data) {

	$('.results').empty();

	data.forEach(function(item, index){
		var start = $('<div class="col-md-4"></div>')
		var wrapper = $('<div class="classRoom" ><a href = "/classRoom/' + item._id + '"><h5>' + item.name + '</h5></a></div>');
		var college = $('<h6>' + item.college + '</h6>');
		var professor = $('<h6>' + item.professor + '</h6>');

		wrapper.append(college);
		wrapper.append(professor);
		start.append(wrapper);

		start.html();

		$('.results').append(start);

	})
}