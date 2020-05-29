document.querySelectorAll('[data-disqus-loader]')[0].onclick = loadDisqus;


function loadDisqus() {
	var d = document, s = d.createElement('script');

	s.src = '//maxchadwickblog.disqus.com/embed.js';

	s.setAttribute('data-timestamp', +new Date());
	(d.head || d.body).appendChild(s);

	this.parentNode.removeChild(this);
}