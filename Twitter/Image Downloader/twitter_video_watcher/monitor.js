console.log("intercept time")
// InsertVideoHttpIntercept();

function injectJS(file)
{

	let D = document;
	let s = D.createElement('script');

	s.type = "text/javascript";
	s.src = browser.runtime.getURL(file);
	s.onload = function()
	{
		s.parentNode.removeChild(s);
	};

	(D.head || D.documentElement).appendChild(s);
}

injectJS("inject.js");
