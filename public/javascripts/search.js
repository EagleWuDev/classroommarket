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
		var start = $('<div></div>')
		var wrapper = $('<div><a href = "/classRoom/' + item._id + '">' + item.name + '</a></div>');
		var more = $('<div>' + item.college + '</div>');

		wrapper.append(more);
		start.append(wrapper);

		start.html();

		$('.results').append(start);

	})
}