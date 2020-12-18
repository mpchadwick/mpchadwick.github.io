// If ethicalads wasn't loaded, hide the <div>.
// Ad blockers might block it and the empty <div> occupying 186px of
// vertical space is weird.
if (typeof ethicalads === 'undefined') {
	var div = document.querySelectorAll('[data-ea-publisher]')[0];
	div.style.display = "none";
}