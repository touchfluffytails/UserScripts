// ==UserScript==
// @name         Twitter Image Download
// @namespace    http://tampermonkey.net/
// @version      3.4.0
// @description  Adds a button to make downloading images from Twitter a tad bit easier.
// @author       touchfluffytail
// @match        https://twitter.com/*
// @match        https://x.com/*
// @include      https://twitter.com/*
// @include      https://pbs.twimg.com/media/*
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      https://code.jquery.com/ui/1.13.2/jquery-ui.min.js
// @resource    jqUI_CSS  http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css
// @resource    IconSet1  http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/images/ui-icons_222222_256x240.png
// @resource    IconSet2  http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/images/ui-icons_454545_256x240.png
// @downloadURL https://raw.githubusercontent.com/touchfluffytails/UserScripts/main/Twitter/Image%20Downloader/twitter_download_images.js
// @updateURL https://raw.githubusercontent.com/touchfluffytails/UserScripts/main/Twitter/Image%20Downloader/twitter_download_images.js
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_getResourceURL
// @grant        GM_download
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

const VideoType = {
	Unknown: 0,
	Gif: 1,
	Video: 2,
};

const VideoSizes = {
	Large: "large",
	Medium: "medium",
	Small: "small",
	Unknown: "",
};

function InsertVideoHttpIntercept()
{
	const originalOpen = window.XMLHttpRequest.prototype.open;
	// console.log(originalOpen)

	window.XMLHttpRequest.prototype.open = function(method, url)
	{
		// console.log("Intercepted HTTP request: " + method + " " + url);
		this.addEventListener('readystatechange', function(event)
		{
			// console.log(event)
			// console.log(this.readyState)
			if (this.readyState === 4)
			{
				if (this !== null &&
					this.response !== null &&
					(this.responseType === '' || this.responseType === 'text') &&
					this.responseText !== null &&
					this.responseText.includes("ext_tw_video"))
				{
					// console.log("in")
					// console.log(this)
					// console.log(event)
					let interceptJson = null;

					try
					{
						interceptJson = JSON.parse(this.response);
					}
					catch (ex)
					{

					}
					if (interceptJson !== null)
					{
						// console.log("intercept")
						// console.log(this)
						// console.log(event)
						// console.log(interceptJson)
						ProcessInterceptedJson(interceptJson);
					}
				}
				// else if (this !== null && this.response !== null && this.response.includes("Fyl-GC5aYAACT6k") || this.responseText !== null &&
				//  this.responseText.includes("Fyl-GC5aYAACT6k"))
				// {
				//  console.log(this)
				// }
				// else if (this !== null && this.response !== null && this.response.includes("id__fxy8zr25a9p"))
				// {
				//  console.log(this)
				// }
			}
			// else if (this.readyState === 3)
			// {
			// 	console.log("waiting");
			// 	console.log(this)
			// }
		})
		originalOpen.apply(this, arguments);
	};
}

function ProcessInterceptedJson(json)
{
	// if (!json["data"] ||
	// 	!json["data"]["threaded_conversation_with_injections_v2"] ||
	// 	!json["data"]["threaded_conversation_with_injections_v2"]["instructions"])
	// {
	// 	return;
	// }

	let instructions = json?.["data"]?.["threaded_conversation_with_injections_v2"]?.["instructions"];
	if (instructions === null || instructions === undefined)
	{
		instructions = json?.["data"]?.["user"]?.["result"]?.["timeline_v2"]?.["timeline"]?.["instructions"];
	}

	if (instructions === null || instructions === undefined)
	{
		return;
	}

	let timelineAdd = null;
	let pinnedTweet = null;

	// console.log("instruction")
	// console.log(instructions)

	for (let i = 0; i < instructions.length; i++)
	{
		if (instructions[i]["type"] && instructions[i]["type"] == "TimelineAddEntries")
		{
			// console.log(instructions[i])
			timelineAdd = instructions[i];
		}
		if (instructions[i]["type"] && instructions[i]["type"] == "TimelinePinEntry")
		{
			// console.log(instructions[i])
			pinnedTweet = instructions[i]
		}
	}

	if (!timelineAdd || timelineAdd === null)
	{
		return;
	}
	// console.log("timelineAdd")
	// console.log(timelineAdd)
	// console.log("pinned")
	// console.log(pinnedTweet)

	let entries = timelineAdd?.["entries"];

	// let entries = timelineAdd["entries"];
	// if (!entries || entries === null)
	// {
	// 	return;
	// }
	// console.log("entries")
	try
	{
		if (entries !== null && entries !== undefined)
		{
			for (let i = 0; i < entries.length; i++)
			{
				// console.log(i)
				// console.log(entries[i])
				ProcessTweetAddEntry(entries[i]);
			}
		}
	}
	catch (ex)
	{
		console.log(ex)
	}

	try
	{
		entries = pinnedTweet?.["entries"]
		// console.log("pinnable")
		// console.log(entries)
		if (entries !== null && entries !== undefined)
		{
			// console.log("pinned entries")

			for (let i = 0; i < entries.length; i++)
			{
				ProcessTweetAddEntry(entries[i]);
			}
		}
		let pinEntry = pinnedTweet?.["entry"]
		// console.log("pinnable")
		// console.log(entries)
		if (pinEntry !== null && pinEntry !== undefined)
		{
			// console.log("pinned entry")

			ProcessTweetAddEntry(pinEntry);
		}
	}
	catch (ex)
	{
		console.log(ex)
	}
}

async function ProcessTweetAddEntry(entry)
{
	if (!entry || entry === null)
	{
		return;
	}

	// console.log("entry")

	if (!entry["content"])
	{
		return;
	}

	if (!entry["content"]["items"] && !entry["content"]["itemContent"])
	{
		return;
	}
	let tweetItems = [];

	if (entry["content"]["itemContent"] && entry["content"]["itemContent"] !== null)
	{
		tweetItems.push(entry["content"])
	}
	else
	{
		if (entry["content"]["items"] && entry["content"]["items"] !== null)
		{
			tweetItems = entry["content"]["items"];
		}
	}

	// let tweetItems = entry["content"]["items"]
	// console.log("tweetItems")
	// console.log(tweetItems)

	for (let i = 0; i < tweetItems.length; i++)
	{
		// console.log(i)
		let item = null;
		if (tweetItems[i]["itemContent"])
		{
			item = tweetItems[i];
		}
		else if (tweetItems[i]["item"])
		{
			item = tweetItems[i]["item"];
		}
		else
		{
			continue;
		}
		// Now validate the only path we care about

		// console.log(item)

		let media = null;
		try
		{
			media = item["itemContent"]["tweet_results"]["result"]["legacy"]["entities"]["media"];
		}
		catch
		{
			continue;
		}


		// console.log("media")

		let tweetId = item["itemContent"]["tweet_results"]["result"]["legacy"]["id_str"];

		// console.log(media);
		// console.log(tweetId);
		if (media && media !== null)
		{
			// console.log("media in")

			for (let mediaIndex = 0; mediaIndex < media.length; mediaIndex++)
			{
				// console.log(media.length)
				// console.log(mediaIndex)
				await ProcessTweetMedia(media[mediaIndex], tweetId, mediaIndex, media.length);
			}
		}

	}
}

async function ProcessTweetMedia(media, tweetId, mediaIndex, mediaCount)
{
	// console.log("process")
	// console.log(media)
	if (!media || media === null || !media["type"])
	{
		return;
	}
	// 
	// console.log(media)

	if (media["type"].toUpperCase() !== "video".toUpperCase())
	{
		return;
	}

	let originalInfo = media["original_info"];
	let sizes = media["sizes"];
	let variants;

	if (media["variants"])
	{
		variants = media["variants"];
	}
	else if (media["video_info"] && media["video_info"]["variants"])
	{
		variants = media["video_info"]["variants"];
	}
	else
	{
		console.log("no variants?")
		console.log(media)
		variants = [];
	}

	let originalSizeValue = null;

	if (originalInfo)
	{
		originalSizeValue = originalInfo["width"] + "x" + originalInfo["height"];
	}
	// console.log(originalInfo)

	let existingSizes = {};
	if (sizes)
	{
		if (sizes[VideoSizes.Large])
		{
			let size = sizes[VideoSizes.Large];
			existingSizes[VideoSizes.Large] = size;
			existingSizes[VideoSizes.Large]["sizeValue"] = size["w"] + "x" + size["h"];
		}
		else if (sizes[VideoSizes.Medium])
		{
			let size = sizes[VideoSizes.Medium];
			existingSizes[VideoSizes.Medium] = size;
			existingSizes[VideoSizes.Medium]["sizeValue"] = size["w"] + "x" + size["h"];
		}
		else if (sizes[VideoSizes.Small])
		{
			let size = sizes[VideoSizes.Small];
			existingSizes[VideoSizes.Small] = size;
			existingSizes[VideoSizes.Small]["sizeValue"] = size["w"] + "x" + size["h"];
		}
	}
	// console.log(existingSizes)
	// console.log(sizes)

	let bestSize = null;
	let m3u8Url = null;

	for (let i = 0; i < variants.length; i++)
	{
		let variant = variants[i];
		if (variant["url"].includes(".m3u8"))
		{
			m3u8Url = variant["url"];
		}
		else if (originalSizeValue &&
			originalSizeValue !== null &&
			variant["url"].includes(originalSizeValue))
		{
			bestSize = variant["url"];
		}
	}
	// console.log(bestSize)
	// console.log(m3u8Url)
	// console.log(variants)

	if (!bestSize ||
		bestSize === null &&
		sizes[VideoSizes.Large])
	{

		let size = sizes[VideoSizes.Large];

		for (let i = 0; i < variants.length; i++)
		{
			let variant = variants[i];
			if (variant["url"].includes(size))
			{
				bestSize = variant["url"];
			}
		}
	}

	if (!bestSize ||
		bestSize === null &&
		sizes[VideoSizes.Medium])
	{
		let size = sizes[VideoSizes.Medium];

		for (let i = 0; i < variants.length; i++)
		{
			let variant = variants[i];
			if (variant["url"].includes(size))
			{
				bestSize = variant["url"];
			}
		}
	}

	if (!bestSize ||
		bestSize === null &&
		sizes[VideoSizes.Small])
	{
		let size = sizes[VideoSizes.Small];

		for (let i = 0; i < variants.length; i++)
		{
			let variant = variants[i];
			if (variant["url"].includes(size))
			{
				bestSize = variant["url"];
			}
		}
	}
	// console.log(bestSize)

	if (!bestSize || bestSize === null)
	{
		let bestBitrate = 0;
		let bestIndex = null;

		for (let i = 0; i < variants.length; i++)
		{
			const variant = variants[i];
			if (variant["bitrate"])
			{
				if (variant["bitrate"] > bestBitrate)
				{
					bestBitrate = variant["bitrate"]
					bestIndex = i;
				}
			}
		}

		if (bestIndex != null && bestBitrate > 0)
		{
			bestSize = variants[bestIndex]["url"];
		}
	}
	// console.log("absolute bestest")
	// console.log(bestSize)

	if (!bestSize || bestSize === null)
	{
		console.log("joe over")
		return;
	}

	// console.log(bestSize);
	// console.log(m3u8Url)

	let storedValue = {};
	storedValue["url"] = bestSize;
	storedValue["m3u8"] = m3u8Url;
	// storedValue["grabbed"] = Date.now();
	storedValue["id"] = tweetId;
	// console.log(storedValue);

	// let storageKey = "twdl_" + tweetId;

	// let existingEntry = videoDataStorage[storageKey];

	// // Consumed
	// if (existingEntry && existingEntry === -1)
	// {
	// 	return;
	// }

	// if (existingEntry === null || existingEntry === undefined)
	// {
	// 	existingEntry[storageKey] = storedValue;
	// }
	// else if (existingEntry)
	// {
	// 	// videoDataStorage[storageKey] = 
	// }

	// let existingEntry = tweetStorage.dataset[storageKey];
	// // let existingEntry = await GM.getValue(storageKey, -1);
	// if (existingEntry === null || existingEntry === undefined)
	// {
	//  tweetStorage.data[storageKey] = JSON.stringify(storedValue);

	//  await GM.setValue(storageKey, storedValue);
	// }
	// else
	// {
	//  console.log("existing")
	//  console.log(existingEntry);
	//  existingEntry["grabbed"] = Date.now();
	//  await GM.setValue(storageKey, existingEntry);
	// }

	storedValue["index"] = mediaIndex;
	storedValue["mediaCount"] = mediaCount;

	// console.log("DONE")
	window.dispatchEvent(new CustomEvent("twimgdl_VideoFoundEvent",
	{
		detail: storedValue
	}));
}

// Gecko feature so only firefox variants should have InstallTrigger
// We can't do XMLHttpRequest in a userscript on firefox and that requires a seperate extension
if (typeof InstallTrigger === 'undefined')
{
	console.log("holy hell were in chrome")
	InsertVideoHttpIntercept()
}

// // Opera 8.0+
// var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

// // Firefox 1.0+
// var isFirefox = typeof InstallTrigger !== 'undefined';

// // Safari 3.0+ "[object HTMLElementConstructor]" 
// var isSafari = /constructor/i.test(window.HTMLElement) || (function(p)
// {
// 	return p.toString() === "[object SafariRemoteNotification]";
// })(!window['safari'] || (typeof safari !== 'undefined' && window['safari'].pushNotification));

// // Internet Explorer 6-11
// var isIE = /*@cc_on!@*/ false || !!document.documentMode;

// // Edge 20+
// var isEdge = !isIE && !!window.StyleMedia;

// // Chrome 1 - 79
// var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

// // Edge (based on chromium) detection
// var isEdgeChromium = isChrome && (navigator.userAgent.indexOf("Edg") != -1);

// // Blink engine detection
// var isBlink = (isChrome || isOpera) && !!window.CSS;



(function()
{
	'use strict';
	const sleep = ms => new Promise(r => setTimeout(r, ms));

	const nsfwSavingDir = 'media/dwn/twitterNSFW/'
	const sfwSavingDir = 'media/dwn/twitterSFW/'
	const UseSavePaths = false;
	const UseTwoButtons = true;

	const DefaultButton1Image = " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAAsTAAALEwEAmpwYAAAIy0lEQVRIibVUWXBT1xk+915Jlixbki3J2nfLtiQvIAy2kSgQIIGkSeg4kCZpBieTaV7oQ+l0ppO0HbdJp+1DQ7MQSCeEdOqyGAazlQAiQIjxIm9YNjbGsmRrlyxZy5WupXuv7u2DqbNMlr7kPJ3z/f/5l+//zoFomgY/5IK/24yiKI7jP2ACDMM6OzsHBwd/qAQSiWTv3r09PT0LCwvfWcdyKBQKBoKZdOZrJuj/nIHb7cZx3Gw2fw0fGRmZmpoSiYSVwkoIgFQq5fP7DHqjzWZjsVgAAMb3hna5XFeuXGlvb0+n01/GURTtPt3NYjLXrbMqVYpwOFQki0qVzGw2nT5zGgBo69Yt358gmUyePHkykUgIBAKDwbCKx+OJ48e7mputGzdu8s67HQ5HsUhotbpobLG+3tLQ0KhUKB+60t+5+vr6duzYQRDEl0Gnc/jw4UOTk3dpmh4dcw4M9oXD/hVTDksf+NUvrl69sur8PUMmSfLAgQPnz5+Px+MAAKoIuk93/eWvf7DUmy2Wpk9vXKMpqGVDm1T6sN7e3t5ljGhr27ga4VspoijK5XJpNBq1Wh0MBhEEAQBc/fTU1Mzt11//HZYrzDyYhiHYYKj58q0iSb322m/Ly8tXkW9VUSQSeeWVV9rb21966aUV5OatT2KpYUtdm6l6O8IAvb23bn9+Wy5XtLa0oihG03Qul7XbNzGZzP91j1+5dvmbKYrH44cOHbLb7bt27VpF7s8OPbLtR7ksBUHAOTSAYct1teYqsSiVTqLZFIqmEonEiRMnL1y4BABIo6G33nm9gPu/mSKSJMfGxjo6OqRS6QrimhiqrpWKyqt67l6LBHMUXbRarRq1HgBQpAsIxFrhI7+cd1z77Or1496FKZutyday+5s7CIfDBw8epCjq4sWLBEGsVKTXK7P5gt8XqRJLf7L7GaVSkViKZtClTDqDExgA1FIyWqToJ59+bN4/XSWR2Vr2jEw4vj6DxcVFsVgcDodlMtnqEQBw7dOTjeukizE0vVhqt21bSsaikahMLoNhqKycT5JEMrbIqxBlscT4pIOmoe1b7MtEcWJy6isUTU9P8/n8np4eDocjkUhgGBaLxclkMhQKeGbjBJXU6ZUaXRVBEK5xl06vE/BFFCgGfP5n2vcW89jIxCTMikWjsQ0t6yEA4UV0/VrLQ4oCgUB3d3coFOrq6urq6ioUCqu/dDQahhmgokLsfhANBcMisXjQ6ZQpFBq1wXVv/NK585lY7NUXn1vweSPBUAkikclFJFkkAQkBuAgopLOzM5fLnTt3rq2trbm5GcMwBEF2797N4/FWOxtyDuzZs1ehFE9MjLOZ4pAvYKqpGR8fyyxGDEpFrbFao9cnk5nZOc+mzdti8blgKFhnsLAYjFg8DgMAIAgCAKhUKgCA1Wo1mUxCoXA1ulAoQhDG8NBIJV+z4E3/+5+ngsHQf872SPllW7dvM65pvuW4NuMLv3X4g/vuB86hvg3Wp7JpMrzknZicv3jhFtLZ2clkMtlstsPh8Pl8brdbIBDodLrVBBAEaTX6YCg4N+f1euYlctX+/fsXojEom1LodCCfyyRTGpOFIIg5z4ywUlBtMMeiSZ9/xtq0ViAsRTo7OwEAYrHYYDDkcjmtVtvc3Fwki92nu3ECX9ESk8lUqVT+gE8sFukUylKBkEAzZoOmpFICWLBUIWfj+WQ8opdJEtl8TU0tAPDgwAi7lGiyGL9QUVlZWWtr68q+3zkwERsJFuY1Ro2wTAgA6OvrGxoZamuo39jWnIklWtY35rLp8ds3YQbME1bKBQJlTX1xuH8pmQAAAIiuMTYtxsj337/8FZniOD4767ZYzDheeP7l5yddk0NT/Ts3/Ngz553zurUqeZ1CBrN5AjUvPDvx7r4DMhzhlXKdEd8vT77HI8Epx/XnXtwHAHA6B3Q6PQMpQQDvi4cWCARdrlEUzdVWm0oqmMfOfbh925ZoNN5qtN8bnn56z5MPZu67BvplVVVsAb+ApunB2RpQEsukXUhhSchG2Kyn9r6gkEhv3nRgGLZz5+NXr37CZpc9fAeFAn758kWP1/3ssz/NZbPCChGDQooUZdBWHzv7kSfoHuh1Aho2rWvhyTVJNM8SSJfqlTvOfND64Z9f/fj9xaV0x8/3c0tYTzyxq79/UKXSIAhzrbUpHo8+7GB6eubwkfeamuqVShWCINu3PRYKB0YWnPpaXWQxEvCFAl6/tEpeWV5RwRVaas1CftWG5g0jd0ebGhsPvLzPvmO7vq7Bal2bzWYfPJj96NgHnjnfm2/+6eKlcw9VdPToP5rWNL74s45Ll3pUKo1GrSUL1Oid8RnXrLpSU84sl0tlUBHy+f3Do8P+eV+mkOJouMfffvfXv/m9Xir627EPt9q3lJeX3bhxgwbQ2bM9C/P+jo59Wq0Gomm6t/ezYx8ffeONP4qEsgsXzgMAAUAnU2mFXPHI5q1sLgfQFJbNYVgWx3EWwsyDwmT4XpxI1uMKLIPdI/18RSXpI59vf+HsmVOTE9NGs/HxXTsRBEEQBuR0Oj3embY22/XrDgFfwOFw84W8Xq81mepYTC5BYhi2TFEUgiAQDLMAs4TLPfHZvyiYNlXXjpz9XLxGZbNtDsR8R985tr5lnW2NfW7O89iWxwEAiaUIgjAQu32TwaC1mJtkcqlaq1rT1GyqM4vFlUwGezmPhkNhHCc4HA4ANEIjFIOczkwM9A7b7TZuGUdUK9PXVUMAco1O1KiNaSxFMEl+WdnfD76tkWrVGu1yPgc3NDTMe4MAAD6/vJTDzeZSAAAMy9+58/ndMRdOkNxSDoAoCIIgCmJwGL29vbIqiUasImmqnMdDMygFirnlXGO1dfeu9v7+vo2NNqPdcPDQW/llrLSUixw5cmR+fj6bRdUqDY4XCIK809c3OjrGZDKNRoNKpWYgrBJWCUzBGJSdQ92e+762ra04TFAUVSSLEASxSlghf7gKlquVak90Zip8/9FHd3gCHjSWMZss/wU/xJHE/TC3TwAAAABJRU5ErkJggg=="

	const tweetButtonImage = "data:image/png;base64,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"
	const DefaultMediaButton1Image = " data:image/png;base64,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"
	const mediaButtonImage = " data:image/png;base64,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";
	const DefaultCopyUrlButtonImage = " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAALvUlEQVRYhXWWW3Ab133Gv7NXAIsbAZAGRIJ3EbRIiqRImhIlmoooybFiqlGSWtHFtmIpdWaaTN3puJJHcV/aia1e0jruJXabTqcPdswqrhM3MsWYlhvHtXWheTVJkSyvAokLAYIEsMAu9uz2wZYituh/5v+y55z9fvOd75w5MAwDd1sQBPA8D0mS4HK54HK50NjYiIsXLwKA/cUXXxR2795NduzYwRFCnPv37zcDMDU3N7OFhYWWEydO8EVFRbDb7Th//jwuXLgAyWKCxSyCEILnf//rHzzcXofDDzfd02SQpxiGwebmJtra2mwjIyNcLpcjAIjVaiWxWMxIJBKa3+9PTE1NZfx+f5ZSavF4PPqHH37oSKVSgs/ngyiKKC0tQ1VVBSSLCe4CW/0jXY1dd0JrBeO3l36rdb+wpmnQNA2EEGiaxq2urloYhvH29vYaANIvvfSSMjMzg/Ly8jar1bo3FApV+/1+hMPh5NzcXPbOnTuZQCDwQG1tbdHc3BzT398PnmNgt1tRW+0/qlEdhS7Hd1fC8Xua3P0AbrcblFJ4vV4uk8lYVlZWEpIkcQsLCwCgBYPBjmPHjl1qb2/fp6oqUqkUHRwc/NDv938/k8l8JIpiOhgMqrIsszMzM0TXdRS67CjxeVBYYO0mIHikq+mJ60PTf5oXoLy8HIIgYHx8XKuvr6fDw8OKIAjKF8OHn3/++at79+79fCHHgRDC1tfX7x8aGvpNIpHonp2dfV+W5VwkEmEAMIJookUeJ5w2C0q2efYwLAOrxWS9X3MLQHV1Nex2Ozs2NiaOjIxky8vLMT09DQDus2fPXm1tbYUsy5BlGRzHgWVZOJ1OdHZ2guf5gZdffpnYbDa0tLRoqqrSeGITJW4OyWTS5LRbzFbJhERSFkWR9wBY+z8ZeOONN9Db20s7OzsJwzD85OQkcrkcOjo6fnT48GGk02moqgqO4yCKJiiKgnA4DF3XUVRUhOPHj9t0Xcfk5KQwPT1tnZr4DGOTc0hsplvLSopAADjtkquprvJ03hAGAgGsr69jYGCAmkwmXdd1+Hw+lJWVbaeUQhB4hCIx/fb0bG5oZASLy6tIyxkAgKqqGB0dVeLxOJaWljRBEARCDMQ30jCbTQeKvS6sRtZR6LJDy2m5vAAnT55Ed3e3TZIkUyQS0QFAFEXMzs6OAcD0zALmbw9lKn1CtqbECmRD2uCtmzJhWMiyjLGxcRWAn+P4XGNjo2yxSGw2q6K5rvw01XWAEBiGgUK3I5sXYGRkBE6nUz148GAagAYACwsLiEQisyuhKKbGPjH+8DuPWx778iFbz6MHce6Jr7GdrZVG/68GADAQBFboff3Y65qW87z99tt8PB6Hpmni7uaa7RubMggAjmNQWeYtzQuQTCYRi8XUy5cv54qLi2G1WsFxHCjV79y4/jHOnu4hZquHGGBggIFOTOTJk8cl3kghFI4MEcLQgffnb7AsZABZALTY637WIQnIKhpYhsAmmUEpteQ9BZRSwjCMq66uLkcI2ZQkCcFgEOFI5Jc1FT7s29uJ8ckZbGxsguM48DyHTMaFRw914dS5516R5Qx99Z+G/7z7wJfk7TUB9sev/QT722sv6DqFJJmRy6kghIGi5HbnBbh+/bohy/J6IBCwTE9PQxRFqKoKSmncLPJYWVmBomT1Z/7gIkN1HSd+9zF869Q34HEVILG+9q9f/CYcia5xJaWlDlE0sXUBv1PVCBhWg6YxWIkm4HHZhbwA6XQaANipqSkVADKZzL0xOasOLizMtvzq2nU9FI4wyWQagzcGMzXlxWZZhQKAlha7W8yiSRkbG5ueX1iKbS9zv9pSX4nwWhI0kwUrWCDwHHRd/8+8AA0NDejo6GD6+vpyy8vL0HUd/m3ubiWrZD+9dT3mLiwwUgmd+8GfXKDTiwvMrqpqfnBwhlI9kfuLC49HHu7YVfiTN9+/NLuwciGVyuBkzyO/l0zJyGSz4FgCDjocNgsWg9HevACVlZUYGBjQV1dXrbqupwHQY4/seeHcN7u6Bj8dB7Xa6FOnvs7u6trDgi0wQjND3M6WZvnWjfesO6sc1revfvLXw9NrLwTqW8Fllv6htsyNWCKJArsZSVmDq8COz6aXMToxfysvQDKZJAzD2BoaGh4YHh6eZzmO/nvfx4cWguHvVVWUdtbbUkd37WkxQClJby4S7/Y65IyMkNMFHD33l1Vut2tubjGEuoamg2e+svs7aTkLVcmCgQneQgfiGzJGJhb7ZhZC9zS3HEOfzwe73Z4OBlcilNLsM888A2qwuV/03/zhSowmqyv8zJWr75KNZMqQCgqxHlky+q68wxWXFOPA/s7vB1djUBXV2VKq/YevyIP1jRRcNhFU1+Gw25CWM/h0bP6FAqf9nuYWBzRNM27duqUAYAoKChBaWRETSVnhOKHy7MkjT7C8iN/0vWWIVi812Za5aCiqj45NMCcamsnxr3Z/a3Ry7pMKn+OPDnTUiAvBOMwiC4vFDFnjsBrdgMUkwmYVm5ZX1XtbsMWB/v5+AEB5qfQ1u93D/9vlywUMw+JYz8Fny7bvRCIepaENNheoa+F+/IO/Qpm/irW4q4yR4VEwFq/6t3//2quH9u2omVtag5rLwWGTEN1QwQsiBJ6DRiluz4f6U+l7N/FWgPX1dfi81p6Prp35l2BwwQ8gvW2bT2jbVf+9obHp3EIwpjTv+zL75t/9CK6UjLee+2M07+tmGMGuroZjkCQbkpuJjFUyodTngmg2wyqZkckqAAEGPhq/nExll9wuZ34Aj9sBhiG5Dz5YDFsszCKAZCQa7wnF0oisJXD46JOmb585xe546CFo0TW0fPNxdOxqxLe/+xxbWlbBTk8MIZOMmyWLCMJyyCoUuRxFsdeD0YlF/HLg5os6zSGR2MwPYLebEFxJ9j17fuBSUaFEARS21xX9Yza9gTNPn+O3V1cxIsfi0aM9aH3yFL5y7mmUlpQABtgjR46w6/E1arNJOssyiCVkyNkcHE4bIvEkovGNxcRG+lMAoLqeP4SU6hBFDtG1zCvRtQye/sa+odpSR4GjutWwSWYiyzIIITCbzYZjRy1h8dvb0mw2o27nLuPq8M9QUboNgpmDy+WAIJgQiUXw7rWhbrNJBM+x90tudeBOMAZVpQCAngON/7X/oeriyFoclVUBAgCEkLtTyWYkChgG7n6nlKLYX8mZTCKbViiqK/3IqgZYlsHY7cUbM/Mr/63rOrJKDlkllx+AUh2GYaCmwvfS6Z7WPVOzK/AWOvHRxzcNAOB5Hhz3uWmpVCrJMIxuNpvBMAwAAy6nlY7ORm89WO3HejKDyZll/PC1X/z8n98caAcARc1BzX3eebdA4DmIovjAs2cOnd9IKbBJIqw2CcHgEOaWwqgsfQAAsLi4iCtXrmwwDGN+6qmnGF3XYbPZ8NOfvh779c3ZriLvJ+9QLRfVDfS+897Nt0wij/+viPGFjQDgdtpQWuy5+DcvnP6zoc/mYWIpDMJC5IH3h9aNg4+d1K2SyF65cgUejwfxeBwcx6G5uRlWq3X17NmzpxRFufbgg7VYvbMMq9WCO6tR8ByP+56BAIC7ulsciG+k0FhX3kjBQRQF2CwcFEUFw4nGoVZG/9nrrxj+wMOorKxAW9tDWFxcxODgIAghuHTp0q8VRbkGAFlZRiKZRiKZ9ntcpmXdMECIKa8DWzLwpb1NqPB7H4yuJ1Fa4oVOeIDhoOkGsbl8xpHOGtZlQ7qhqQ2pVBLZbBaBQABlZWVoa2trAQCOI6D6Jrr2+n+n59GKcxzPQBBY8DyzpfMC7Krzw2Ezb2MIgW4QiGYzEikVICwAcMXbSohZXZDe6+/D0vIKLBYL4vE4xsfHEQgEqisqqr6qaQbaWwrx9BM7ju+s8zaHwjLydd4MdLbXo72p+uc1ldu67FYzBIHXM1mFWd9IodjrJpQaxmooitXwml7e1EMo1YjdbsfExAQcDgcTjUbpu+/2uyLhecPtYlt0gyuYmY2/Zxg6/nfd1f0fr69sQxxkSfUAAAAASUVORK5CYII="


	// input_button_1_colour
	// input_button_1_picture
	// input_button_1_width
	// input_button_1_height
	// input_button_1_directory
	// input_toggle_button_2
	// input_button_2_colour
	// input_button_2_picture
	// input_button_2_width
	// input_button_2_height
	// input_button_2_directory
	// input_media_button_1_colour
	// input_media_button_1_picture
	// input_media_button_1_width
	// input_media_button_1_height
	// input_media_button_1_directory
	// input_toggle_media_button_2
	// input_media_button_2_colour
	// input_media_button_2_picture
	// input_media_button_2_width
	// input_media_button_2_height
	// input_media_button_2_directory

	const DefaultConfiguration = {
		UseDirectories: true,
		Button1Toggle: true,
		Button2Toggle: true,
		CopyUrlToggle: true,
		MediaButton1Toggle: true,
		MediaButton2Toggle: true,

		Button1Colour: "red",
		Button1Picture: DefaultButton1Image,
		Button1Width: "32px",
		Button1Height: "32px",
		Button1Directory: "media/dwn/twitterNSFW/",

		Button2Colour: "blue",
		Button2Picture: tweetButtonImage,
		Button2Width: "32px",
		Button2Height: "32px",
		Button2Directory: "media/dwn/twitterSFW/",

		MediaButton1Colour: "red",
		MediaButton1Picture: DefaultMediaButton1Image,
		MediaButton1Width: "50px",
		MediaButton1Height: "50px",
		MediaButton1Directory: "media/dwn/twitterNSFW/",

		MediaButton2Colour: "grey",
		MediaButton2Picture: mediaButtonImage,
		MediaButton2Width: "50px",
		MediaButton2Height: "50px",
		MediaButton2Directory: "media/dwn/twitterSFW/",

		CopyUrlColour: "grey",
		CopyUrlPicture: DefaultCopyUrlButtonImage,
		CopyUrlWidth: "32px",
		CopyUrlHeight: "32px",
		CopyUrlDomain: "vxtwitter",
	}

	const SettingMapping = {
		UseDirectories: "input_use_save_dir",
		MediaButton2Toggle: "input_toggle_media_button_2",

		Button1Toggle: "input_toggle_button_1",
		Button1Colour: "input_button_1_colour",
		Button1Picture: "input_button_1_picture",
		Button1Width: "input_button_1_width",
		Button1Height: "input_button_1_height",
		Button1Directory: "input_button_1_directory",

		Button2Toggle: "input_toggle_button_2",
		Button2Colour: "input_button_2_colour",
		Button2Picture: "input_button_2_picture",
		Button2Width: "input_button_2_width",
		Button2Height: "input_button_2_height",
		Button2Directory: "input_button_2_directory",

		MediaButton1Toggle: "input_toggle_media_button_1",
		MediaButton1Colour: "input_media_button_1_colour",
		MediaButton1Picture: "input_media_button_1_picture",
		MediaButton1Width: "input_media_button_1_width",
		MediaButton1Height: "input_media_button_1_height",
		MediaButton1Directory: "input_media_button_1_directory",

		MediaButton2Toggle: "input_toggle_media_button_2",
		MediaButton2Colour: "input_media_button_2_colour",
		MediaButton2Picture: "input_media_button_2_picture",
		MediaButton2Width: "input_media_button_2_width",
		MediaButton2Height: "input_media_button_2_height",
		MediaButton2Directory: "input_media_button_2_directory",

		CopyUrlToggle: "input_toggle_button_copyurl",
		CopyUrlColour: "input_button_copyurl_colour",
		CopyUrlPicture: "input_button_copyurl_picture",
		CopyUrlWidth: "input_button_copyurl_width",
		CopyUrlHeight: "input_button_copyurl_height",
		CopyUrlDomain: "input_button_copyurl_domain",
	}

	const UICheckBoxes = {
		UseDirectories: "input_use_save_dir",
		MediaButton2Toggle: "input_toggle_media_button_2",
		Button1Toggle: "input_toggle_button_1",
		Button2Toggle: "input_toggle_button_2",
		MediaButton1Toggle: "input_toggle_media_button_1",
		MediaButton2Toggle: "input_toggle_media_button_2",
		CopyUrlToggle: "input_toggle_button_copyurl",
	}

	const UITextBoxes = {
		Button1Colour: "input_button_1_colour",
		Button1Picture: "input_button_1_picture",
		Button1Width: "input_button_1_width",
		Button1Height: "input_button_1_height",
		Button1Directory: "input_button_1_directory",

		Button2Colour: "input_button_2_colour",
		Button2Picture: "input_button_2_picture",
		Button2Width: "input_button_2_width",
		Button2Height: "input_button_2_height",
		Button2Directory: "input_button_2_directory",

		MediaButton1Colour: "input_media_button_1_colour",
		MediaButton1Picture: "input_media_button_1_picture",
		MediaButton1Width: "input_media_button_1_width",
		MediaButton1Height: "input_media_button_1_height",
		MediaButton1Directory: "input_media_button_1_directory",

		MediaButton2Colour: "input_media_button_2_colour",
		MediaButton2Picture: "input_media_button_2_picture",
		MediaButton2Width: "input_media_button_2_width",
		MediaButton2Height: "input_media_button_2_height",
		MediaButton2Directory: "input_media_button_2_directory",

		CopyUrlColour: "input_button_copyurl_colour",
		CopyUrlPicture: "input_button_copyurl_picture",
		CopyUrlWidth: "input_button_copyurl_width",
		CopyUrlHeight: "input_button_copyurl_height",
		CopyUrlDomain: "input_button_copyurl_domain",
	}

	const VideoType = {
		Unknown: 0,
		Gif: 1,
		Video: 2,
	};

	const VideoSizes = {
		Large: "large",
		Medium: "medium",
		Small: "small",
		Unknown: "",
	};

	const videoDataStorage = {}


	async function GetButtonSettings()
	{
		let settingValue;
		let settings = {};

		for (const [key, value] of Object.entries(SettingMapping))
		{
			settingValue = await GM.getValue(value, DefaultConfiguration[key]);
			settings[key] = settingValue;

			// console.log("key " + key + " - value " + value + " - settingvalue " + settingValue)
		}

		return settings;
	}

	async function GetMediaButtonSettings()
	{
		return await GetButtonSettings();
	}

	async function GetSetting(setting)
	{
		let value;
		value = await GM.getValue(SettingMapping[setting], DefaultConfiguration[setting]);
		return value;
	}


	const tweetStorage = document.createElement('DIV');
	tweetStorage.className = 'tweetStorage';
	tweetStorage.id = 'tweetStorage';

	document.body.appendChild(tweetStorage);

	// function overrideXhrFunctions()
	// {
	//  if (XMLHttpRequest.prototype)
	//  {
	//      console.log("xxx")
	//      //New Firefox Versions
	//      XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;
	//      var myOpen = function(method, url, async, user, password)
	//      {

	//          //call original
	//          this.realOpen(method, url, async, user, password);
	//          // myCode();
	//          console.log("Intercepted HTTP request: " + method + " " + url);
	//      }
	//      //ensure all XMLHttpRequests use our custom open method
	//      XMLHttpRequest.prototype.open = myOpen;
	//  }
	// }

	// addJS_Node(null, null, overrideXhrFunctions)
	// // {

	// //-- addJS_Node is a standard(ish) function
	// function addJS_Node(text, s_URL, funcToRun, runOnLoad)
	// {
	//  var D = document;
	//  var scriptNode = D.createElement('script');
	//  if (runOnLoad)
	//  {
	//      scriptNode.addEventListener("load", runOnLoad, false);
	//  }
	//  scriptNode.type = "text/javascript";
	//  if (text) scriptNode.textContent = text;
	//  if (s_URL) scriptNode.src = s_URL;
	//  if (funcToRun) scriptNode.textContent = '(' + funcToRun.toString() + ')()';
	//  var targ = D.getElementsByTagName('head')[0] || D.body || D.documentElement;
	//  targ.appendChild(scriptNode);
	// }
	// }

	// const originalOpen = unsafeWindow.XMLHttpRequest.prototype.open;
	// console.log(originalOpen)

	// unsafeWindow.XMLHttpRequest.prototype.open = function(method, url)
	// {
	//  // console.log("Intercepted HTTP request: " + method + " " + url);
	//  console.log("Intercepted HTTP request: " + method + " " + url);
	//  this.addEventListener('readystatechange', function(event)
	//  {
	//      if (this.readyState === 4)
	//      {
	//          console.log("4");
	//          // if (this !== null && this.response !== null && this.responseText !== null &&
	//          //  this.responseText.includes("ext_tw_video"))
	//          // {
	//          //  console.log("intercept")
	//          //  console.log(this)
	//          //  let interceptJson = JSON.parse(this.response);
	//          //  ProcessInterceptedJson(interceptJson);
	//          // }
	//          // else if (this !== null && this.response !== null && this.response.includes("Fyl-GC5aYAACT6k") || this.responseText !== null &&
	//          //  this.responseText.includes("Fyl-GC5aYAACT6k"))
	//          // {
	//          //  console.log(this)
	//          // }
	//          // else if (this !== null && this.response !== null && this.response.includes("id__fxy8zr25a9p"))
	//          // {
	//          //  console.log(this)
	//          // }
	//      }
	//      // else if (this.readyState === 3)
	//      // {
	//      //  console.log("waiting");

	//      //  console.log(this)
	//      // }
	//      // else
	//      // {
	//      //  console.log("despair");

	//      //  console.log(this)
	//      // }
	//  })
	//  // originalOpen.apply(this, arguments);
	//  // openn.apply(this, arguments);
	// };
	// console.log(originalOpen)

	// const processXHR = function(json)
	// {
	//  console.log("hijacked")
	//  console.log(json)
	// }


	// function InjectXHR(process)
	// {
	//  console.log("inject")
	//  if (typeof process != "function")
	//  {
	//      process = function(e)
	//      {
	//          console.log(e);
	//      };
	//  }
	//  console.log("event")

	window.addEventListener("twimgdl_VideoFoundEvent", function(event)
	{
		// console.log("proc")
		// console.log(event);
		// console.log(event.detail);

		StoreVideoData(event.detail);
	}, false);

	function StoreVideoData(videoData)
	{
		// console.log("HOLY SHIT A VIDEO")
		// console.log(videoData)
		if (!tweetStorage.dataset[videoData["id"]])
		{
			tweetStorage.dataset[videoData["id"]] = JSON.stringify(
			{});
		}

		// if (!tweetStorage.dataset[videoData["id"]][videoData["index"]])
		// {
		let datasetData = JSON.parse(tweetStorage.dataset[videoData["id"]])
		datasetData[videoData["index"]] = videoData
		tweetStorage.dataset[videoData["id"]] = JSON.stringify(datasetData);
		// }
	}

	//  function injection()
	//  {
	//      console.log("injecting")

	//      var open = XMLHttpRequest.prototype.open;
	//      XMLHttpRequest.prototype.open = function()
	//      {
	//          console.log("inj")
	//          this.addEventListener("load", function()
	//          {
	//              console.log("red")
	//              window.dispatchEvent(new CustomEvent("twimgdl_VideoFoundEvent",
	//              {
	//                  detail: this
	//              }));
	//          }, false);
	//          open.apply(this, arguments);
	//      };
	//  }
	//  window.setTimeout("(" + injection.toString() + ")()", 0);
	// }

	// InjectXHR(processXHR);

	function ProcessTweet(article, imageParent)
	{
		if (imageParent !== null)
		{
			// console.log("image parent");

			let imgNode = imageParent.getElementsByTagName("img");
			// console.log(imageParent)
			// console.log(imgNode)
			if (imgNode !== null)
			{
				imgNode = imgNode[0];
				// console.log("image node");

				let linkNode = imageParent.closest('a[role="link"]');

				let tweetData = GetTweetUrlData(linkNode.href);
				// console.log(imgNode)
				// console.log(imgNode.classList)
				imgNode.classList.add("id" + tweetData.id);

				// console.log(article);
				// console.log(tweetData);

				AddDownloadButtonToArticle(article, tweetData);
			}
		}
	}

	function ProcessVideoTweet(article, videoParent)
	{
		if (videoParent === null)
		{
			return;
		}
		// console.log("image parent");

		let vidNode = null;
		if (videoParent.tagName === "IMG")
		{
			vidNode = videoParent;
		}
		else
		{
			vidNode = videoParent.getElementsByTagName("img");
			// console.log(imageParent)
			// console.log(imgNode)
			if (vidNode === null)
			{
				return;
			}
			vidNode = vidNode[0];
		}

		if (vidNode === null)
		{
			return;
		}


		// console.log(vidNode)
		// console.log("image node");

		let videoThumbUrl = vidNode.src;
		// console.log(videoThumbUrl)
		// if (videoThumbUrl.includes("ext_tw_video"))
		// {
		// 	return;
		// }

		// console.log(videoThumbUrl)

		let tweetData = GetVideoUrlData(videoThumbUrl);
		tweetData["thumbUrl"] = videoThumbUrl;

		let user;
		let id;
		// let userLinkNode = article.querySelector('a[role="link"');
		let tweetTime = article.querySelector("time");

		if (tweetTime !== null)
		{
			let timeLink = tweetTime.closest('a[role="link"]');
			let urlData = GetTweetUrlData(timeLink.href);
			user = urlData["user"]
			id = urlData["id"]
		}
		else
		{
			let roleLinks = article.querySelectorAll('a[role="link"]')
			// console.log(roleLinks)

			if (roleLinks)
			{
				// console.log("rolelinks")
				for (let i = 0; i < roleLinks.length; i++)
				{
					if (roleLinks.children && roleLinks.children.length > 0)
					{
						// console.log(roleLinks.children[0]);
					}
				}
			}
			let userLinkNode = article.querySelector('a[role="link"]');
			let userHref = userLinkNode.href
			let userUrl = userHref.split("/")
			user = userUrl[userUrl.length - 1];
			id = null;
			// console.log("stupid idiot")
		}
		tweetData["user"] = user;
		tweetData["id"] = id;

		// console.log(tweetData)

		AddVideoDownloadButtonToArticle(article, tweetData)
	}

	async function AddVideoDownloadButtonToArticle(article, tweetData)
	{
		let divDownloadImgs = AddButtonDiv(article);
		if (divDownloadImgs === null)
		{
			return;
		}

		if (divDownloadImgs.attributes["dlbtnattached"])
		{
			let existingData = JSON.parse(divDownloadImgs.dataset.video);
			existingData["data"].push(tweetData);

			divDownloadImgs.dataset.video = JSON.stringify(existingData);
			return;
		}

		divDownloadImgs.attributes["dlbtnattached"] = true;

		divDownloadImgs.attributes["tweetData"] = tweetData;

		let embeddedTweetData = {};

		embeddedTweetData["user"] = tweetData["user"];
		embeddedTweetData["tweetId"] = tweetData["id"];

		embeddedTweetData["data"] = [];
		embeddedTweetData["data"].push(tweetData);

		divDownloadImgs.dataset.video = JSON.stringify(embeddedTweetData);
		// divDownloadImgs.setAttribute("tweetData", embeddedTweetData);

		// console.log("embed")

		const buttonSettings = await GetButtonSettings();

		if (buttonSettings["Button1Toggle"])
		{
			let button1 = document.createElement("button")
			button1.className = "button1";
			button1.title = "Download";
			// button1.style.margin = "auto";

			if (buttonSettings["Button1Colour"] !== "")
			{
				button1.style.backgroundColor = buttonSettings["Button1Colour"];
			}

			button1.addEventListener("click", function()
			{
				HandleDownloadVideo(article, divDownloadImgs, buttonSettings["Button1Directory"]);
			}, false);


			if (buttonSettings["Button1Width"] !== "")
			{
				button1.style.width = buttonSettings["Button1Width"];
			}
			if (buttonSettings["Button1Height"] !== "")
			{
				button1.style.height = buttonSettings["Button1Height"];
			}

			if (buttonSettings["Button1Picture"] !== "")
			{
				let buttonImage = document.createElement("img");
				buttonImage.className = "button1Image";
				buttonImage.src = buttonSettings["Button1Picture"];
				button1.appendChild(buttonImage);
			}

			divDownloadImgs.appendChild(button1);
		}

		if (buttonSettings["Button2Toggle"])
		{
			let button2 = document.createElement("button")
			button2.className = "button2";
			button2.title = "Download";
			button2.style.backgroundColor = buttonSettings["Button2Colour"];
			// button2.style.margin = "auto";

			button2.addEventListener("click", function()
			{
				HandleDownloadVideo(article, divDownloadImgs, buttonSettings["Button2Directory"]);
			}, false);

			if (buttonSettings["Button2Width"] !== "")
			{
				button2.style.width = buttonSettings["Button2Width"];
			}
			if (buttonSettings["Button2Height"] !== "")
			{
				button2.style.height = buttonSettings["Button2Height"];
			}

			if (tweetButtonImage !== "")
			{
				let buttonImage = document.createElement("img");
				buttonImage.className = "button2Image";
				buttonImage.src = buttonSettings["Button2Picture"];
				button2.appendChild(buttonImage);
			}

			divDownloadImgs.appendChild(button2);
		}
	}

	function HandleDownloadVideo(article, divDownloadImgs, saveDir)
	{
		// console.log("dl")
		// console.log(divDownloadImgs.dataset.video)
		let tweetData = JSON.parse(divDownloadImgs.dataset.video);
		let user = tweetData["user"];
		let tweetId = tweetData["tweetId"];
		let videoData = tweetData["data"];

		if (tweetId === null)
		{
			// console.log("stupid idiot 2")
			let tweetTime = article.querySelector("time");

			if (tweetTime === null)
			{
				console.log("COULDNT GET TWEET ID CANT DL VIDEO/GIF")
			}

			let timeLink = tweetTime.closest('a[role="link"]');
			let urlData = GetTweetUrlData(timeLink.href);
			tweetId = urlData["id"]
			if (tweetId === null || tweetId === "")
			{
				console.log("COULDNT GET TWEET ID CANT DL VIDEO/GIF")
			}
		}

		let isMultiple = videoData.length > 1;

		for (let i = 0; i < videoData.length; i++)
		{
			let video = videoData[i];

			video["i"] = i;
			video["index"] = isMultiple ? i + 1 : -1;

			if (!video["tweetId"] || video["tweetId"] === null || video["tweetId"] === "")
			{
				video["tweetId"] = tweetId;
			}

			video["saveDir"] = saveDir;

			if (video["videoType"] === VideoType.Gif)
			{
				video["ext"] = "mp4";
				// console.log("dl gif")
				// console.log(video);
				try
				{
					DownloadGif(video);
				}
				catch (ex)
				{
					console.log("error while downloading gif")
					console.log(ex)
				}
			}
			else if (video["videoType"] === VideoType.Video)
			{
				try
				{
					DownloadVideo(video);
				}
				catch (ex)
				{
					console.log("error while downloading video")
					console.log(ex)
				}
			}
			else
			{
				console.log("VIDEO TYPE ISNT KNOWN");
				console.log(tweetId);
				console.log(videoData[i])
			}
		}
	}

	// const waitForVideoDownload = new Event("WaitForVideo");

	// tweetStorage.addEventListener(
	// 	"WaitForVideo",
	// 	function(event)
	// 	{
	// 		// console.log("proc")
	// 		console.log(event);
	// 		console.log(event.detail);

	// 		WaitForVideoDataToDownload(event.detail);
	// 	}, false);

	async function WaitForVideoDataToDownload(videoData)
	{
		const MaxFailCount = 100;
		let failCount = 0;
		let notFound = true;


		while (failCount < MaxFailCount && notFound)
		{
			if (tweetStorage.dataset[videoData["tweetId"]])
			{
				DownloadVideo(videoData);
				notFound = false;
				return;
			}
			else
			{
				failCount++;
				await new Promise(r => setTimeout(r, 500));
			}
		}
	}

	async function DownloadVideo(videoData)
	{
		console.log(videoData)
		// console.log(tweetStorage.dataset[videoData["tweetId"]])
		// console.log(videoData["tweetId"])
		if (!tweetStorage.dataset[videoData["tweetId"]])
		{
			console.log("failed to get tweet id")
			// for (const [key, value] of Object.entries(tweetStorage.dataset))
			// {
			// 	console.log(key);
			// }

			// tweetStorage.dispatchEvent(new CustomEvent("WaitForVideo",
			// {
			// 	detail: videoData
			// }));
			await WaitForVideoDataToDownload(videoData)
			return;
		}

		let scrappedVideoData;

		const datasetData = JSON.parse(tweetStorage.dataset[videoData["tweetId"]])
		console.log(datasetData)
		console.log(videoData["i"])
		console.log(videoData)
		scrappedVideoData = datasetData[videoData["i"]]
		// if (videoData["index"] === -1)
		// {
		// 	const datasetData = JSON.parse(tweetStorage.dataset[videoData["tweetId"]])
		// 	console.log(datasetData)
		// 	console.log(videoData["index"])
		// 	console.log(videoData)
		// 	scrappedVideoData = datasetData["0"]
		// }
		// else
		// {
		// 	const datasetData = JSON.parse(tweetStorage.dataset[videoData["tweetId"]])
		// 	console.log(datasetData)
		// 	console.log(videoData["index"] - 1)
		// 	console.log(videoData)
		// 	scrappedVideoData = datasetData[videoData["index"]]
		// }

		console.log(scrappedVideoData)
		const videoUrl = scrappedVideoData["url"];
		// // console.log(videoData)
		// let videoPlaylist = "https://video.twimg.com/ext_tw_video/1773413521952317441/pu/pl/1uGIRr2FcP5mx_Fu.m3u8"
		// //https://video.twimg.com/ext_tw_video/1773413521952317441/pu/pl/1uGIRr2FcP5mx_Fu.m3u8
		// //https://video.twimg.com/ext_tw_video/1773413592454287746/pu/pl/im56sEeiEz6BRPQi.m3u8
		// //https://video.twimg.com/ext_tw_video/1773413521952317441/pu/pl/1uGIRr2FcP5mx_Fu.m3u8?variant_version=1&tag=12&container=cmaf
		// //"https://video.twimg.com/ext_tw_video/1773413521952317441/pu/vid/avc1/852x480/ntKRFbAuA2OTNptg.mp4?tag=12
		// videoPlaylist = "https://video.twimg.com/ext_tw_video/" + videoData["tweetId"];
		// videoPlaylist += "/pu/pl/" + videoData["videoName"] + ".m3u8";

		// // video.twimg.com/ext_tw_video/1773413521952317441/pu/pl/avc1/852x480/9vJHfmjDnMR23cOu.m3u8?container=cmaf
		// //https://twitter.com/AniNewsAndFacts/status/1773413592454287746

		// // console.log(videoPlaylist);

		console.log(videoUrl)
		// console.log(imageData)
		let filename = "";

		if (await GetSetting("UseDirectories"))
		{
			filename += videoData["saveDir"] !== null ? videoData["saveDir"] : "";
			filename += videoData["saveDir"][videoData["saveDir"].length - 1] != "/" ? "/" : "";
			filename += videoData["user"] + "/";
		}

		filename += videoData["user"] + '_' + videoData["tweetId"];
		filename += videoData["index"] === -1 ? "" : "_" + videoData["index"];

		if (videoData["ext"])
		{
			filename += "." + videoData["ext"];
		}
		else
		{
			filename += "." + "mp4";
		}
		// filename += "." + "mp4";
		console.log(filename)

		let url = videoUrl;
		console.log(url)

		// if (!url.includes(":orig"))
		// {
		//  url += ":orig";
		// }

		// console.log(url)
		// console.log(filename)

		if (navigator["platform"] == "Win32")
		{
			filename.replace("/", "\\")
		}
		// console.log(filename)
		// console.log(url)

		GM_download(
		{
			url: url,
			name: filename
		});
	}

	async function DownloadGif(videoData)
	{
		// console.log(videoData)
		//"https://video.twimg.com/tweet_video/GJ6iequbgAArQ99.mp4"
		let gifUrl = "https://video.twimg.com/tweet_video/" + videoData["videoName"] + ".mp4";
		console.log(gifUrl)
		// console.log(imageData)
		let filename = "";

		if (await GetSetting("UseDirectories"))
		{
			filename += videoData["saveDir"] !== null ? videoData["saveDir"] : "";
			filename += videoData["saveDir"][videoData["saveDir"].length - 1] != "/" ? "/" : "";
			filename += videoData["user"] + "/";
		}

		filename += videoData["user"] + '_' + videoData["tweetId"];
		filename += videoData["index"] === -1 ? "" : "_" + videoData["index"];

		filename += "." + videoData["ext"];
		console.log(filename)

		let url = gifUrl;
		console.log(url)

		// if (!url.includes(":orig"))
		// {
		//  url += ":orig";
		// }

		// console.log(url)
		// console.log(filename)

		if (navigator["platform"] == "Win32")
		{
			filename.replace("/", "\\")
		}
		// console.log(filename)
		// console.log(url)

		GM_download(
		{
			url: url,
			name: filename
		});
	}

	function GetVideoUrlData(url)
	{
		let isGif = url.includes("tweet_video");
		let isVideo = url.includes("ext_tw_video");

		let videoType;

		if (isGif && isVideo)
		{
			videoType = VideoType.Unknown;
		}
		else if (isGif)
		{
			videoType = VideoType.Gif;
		}
		else if (isVideo)
		{
			videoType = VideoType.Video;
		}
		else
		{
			videoType = VideoType.Unknown;
		}

		let cleanedUrl = url.replace(/\?format.*/, '');
		cleanedUrl = cleanedUrl.replace(/https+\:\/\/pbs\.(twimg|x)\.com\//, '');
		// console.log(cleanedUrl)

		let splitUrl = cleanedUrl.split("/")
		console.log(splitUrl)

		let videoName = splitUrl[splitUrl.length - 1].split(".")[0]

		let tweetData = {
			"videoType": videoType,
			"videoName": videoName
		};
		// console.log("url data")
		// console.log(tweetData)
		// console.log(splitUrl)

		return tweetData;
	}

	function ProcessMediaTweet(listItem, imageParent)
	{
		if (imageParent === null || listItem === null)
		{
			return;
		}

		const linkNode = imageParent.closest('a[role="link"]');
		let tweetData = GetTweetUrlData(linkNode.href);

		// const videoData = GetVideoUrlData(imageParent.src);
		// if (tweetData["videoType"])
		// {
		// 	tweetData["videoType"] = videoData["videoType"]
		// }
		// if (tweetData["videoName"])
		// {
		// 	tweetData["videoName"] = videoData["videoName"]
		// }

		AddDownloadButtonToMediaTweet(listItem, linkNode, tweetData, imageParent);
	}

	async function AddDownloadButtonToMediaTweet(listItem, linkNode, tweetData, imageParent)
	{
		let frameParent = linkNode.parentElement;
		if (frameParent.getElementsByClassName("downloadButton") > 0)
		{
			return;
		}

		let divDownloadImgs = document.createElement('DIV');
		divDownloadImgs.className = 'downloadImgs';
		divDownloadImgs.attributes["tweetData"] = tweetData;

		const buttonSettings = await GetMediaButtonSettings();

		if (buttonSettings["MediaButton1Toggle"])
		{
			let button1 = document.createElement("button")
			button1.className = "mediaButton1";
			button1.classList.add("downloadButton");
			button1.title = "Download";
			if (buttonSettings["MediaButton1Colour"] !== "")
			{
				button1.style.backgroundColor = buttonSettings["MediaButton1Colour"]
			}

			button1.addEventListener("click", function()
			{
				HandleMediaImageDownload(listItem, linkNode, tweetData, buttonSettings["MediaButton1Directory"])
			}, false);


			if (buttonSettings["MediaButton1Width"] !== "")
			{
				button1.style.width = buttonSettings["MediaButton1Width"];
			}
			if (buttonSettings["MediaButton1Height"] !== "")
			{
				button1.style.height = buttonSettings["MediaButton1Height"];
			}

			if (buttonSettings["MediaButton1Picture"] !== "")
			{
				let buttonImage = document.createElement("img");
				buttonImage.className = "button1Image";
				buttonImage.src = buttonSettings["MediaButton1Picture"];
				buttonImage.style["max-width"] = "100%";
				buttonImage.style["max-height"] = "100%";
				button1.appendChild(buttonImage);
			}
			divDownloadImgs.appendChild(button1);

		}
		let button2;
		if (buttonSettings["MediaButton2Toggle"])
		{
			button2 = document.createElement("button")
			button2.className = "mediaButton2";
			button2.classList.add("downloadButton");
			button2.title = "Download";
			if (buttonSettings["MediaButton2Colour"] !== "")
			{
				button2.style.backgroundColor = buttonSettings["MediaButton2Colour"]
			}

			button2.addEventListener("click", function()
			{
				HandleMediaImageDownload(listItem, linkNode, tweetData, buttonSettings["MediaButton2Directory"]);
			}, false);

			if (buttonSettings["MediaButton2Width"] !== "")
			{
				button2.style.width = buttonSettings["MediaButton2Width"];
			}
			if (buttonSettings["MediaButton2Height"] !== "")
			{
				button2.style.height = buttonSettings["MediaButton2Height"];
			}

			if (buttonSettings["MediaButton2Picture"] !== "")
			{
				let buttonImage = document.createElement("img");
				buttonImage.className = "button2Image";
				buttonImage.src = buttonSettings["MediaButton2Picture"];
				buttonImage.style["max-width"] = "100%";
				buttonImage.style["max-height"] = "100%";
				button2.appendChild(buttonImage);
			}

			divDownloadImgs.appendChild(button2);
		}

		frameParent.insertBefore(divDownloadImgs, linkNode)
		// frameParent.insertBefore(nsfwDLButton, linkNode)
		// frameParent.insertBefore(sfwDLButton, linkNode)
		// tweetFrame.appendChild(nsfwDLButton)
	}

	async function NewGetMediaImage(tweetFrame)
	{
		console.log(tweetFrame)
		tweetFrame.click();

		let failCounter = 0;
		let MaxFailCount = 500;

		// while (!document.querySelector('div[aria-roledescription="carousel"]'))
		while (!document.querySelector('div[aria-labelledby="modal-header"]'))
		{
			await new Promise(r => setTimeout(r, 5));
		}

		// await new Promise(r => setTimeout(r, 200));


		let modal = document.querySelector('div[aria-labelledby="modal-header"]');
		console.log(modal)

		while (modal.getElementsByTagName("img").length < 1)
		{
			await new Promise(r => setTimeout(r, 5));
		}

		// await new Promise(r => setTimeout(r, 200));


		let listCollection = modal.querySelector("ul");

		let imageUrls = [];

		if (listCollection !== null)
		{
			let listItems = listCollection.getElementsByTagName("li");

			// console.log("lists")
			// console.log(listItems);
			let carousel = modal.querySelector('div[aria-roledescription="carousel"]');

			for (let i = 0; i < listItems.length; i++)
			{
				// console.log(carousel)

				let randomMax = 1000;
				let randomMin = 300;

				// console.log(listItems[i])
				// console.log(listItems[i].children.length)
				if (listItems[i].children.length === 0)
				{
					while (listItems[i].children.length === 0)
					{
						let nextSlideButton = carousel.querySelector('div[aria-label="Next slide"]');
						nextSlideButton.click()
						let randomTime = Math.floor(Math.random() * (randomMax - randomMin)) + randomMin;
						// sleep(randomTime);
						await new Promise(r => setTimeout(r, randomTime));
					}
				}

				while (!listItems[i].getElementsByTagName("img"))
				{
					await new Promise(r => setTimeout(r, 300));
				}

				await new Promise(r => setTimeout(r, 200));

				let image = listItems[i].getElementsByTagName("img")[0];
				imageUrls.push(image.src);
			}
		}
		else
		{
			while (!modal.querySelector('video, div[aria-label="Image"], div[aria-label="Embedded video"]'))
			{
				await new Promise(r => setTimeout(r, 5));
			}

			// await new Promise(r => setTimeout(r, 200));
			let imageDiv = modal.querySelector('video, div[aria-label="Image"], div[aria-label="Embedded video"]');
			// console.log(modal)
			console.log(imageDiv)
			if (imageDiv.tagName === "VIDEO")
			{
				imageUrls.push(imageDiv.src);
			}
			else
			{
				let image = imageDiv.querySelector("video, img");
				console.log(image)
				imageUrls.push(image.src);
			}

		}

		let exitButton = modal.querySelector('div[aria-label="Close"]');
		exitButton.click();

		return imageUrls;
	}


	async function HandleMediaImageDownload(listItem, linkNode, tweetData, saveDir)
	{
		// console.log('WE ARE MEDIA IN')

		console.log(linkNode)

		let imageUrls = await NewGetMediaImage(linkNode);
		// console.log(imageUrls)

		let imageData = []

		let multipleImages = imageUrls.length > 1;

		for (let i = 0; i < imageUrls.length; i++)
		{
			let image = {};
			image["tweetId"] = tweetData["id"];
			image["user"] = tweetData["user"];
			const urlData = GetTweetSourceUrlData(imageUrls[i]);

			console.log(imageUrls[i])
			const videoData = GetVideoUrlData(imageUrls[i]);
			console.log(videoData)
			if (videoData["videoType"])
			{
				image["videoType"] = videoData["videoType"]
			}
			if (videoData["videoName"])
			{
				image["videoName"] = videoData["videoName"]
			}
			// console.log(urlData)
			image["imageUrl"] = urlData["url"];
			image["ext"] = urlData["ext"];
			image["index"] = multipleImages ? i + 1 : -1;
			image["saveDir"] = saveDir;
			imageData.push(image);
		}

		console.log(imageData)
		// console.log(imageData)

		for (let i = 0; i < imageData.length; i++)
		{
			console.log(imageData[i])
			console.log(imageData[i]["videoType"])
			console.log(imageData[i]["videoType"] !== VideoType.Unknown)
			if (imageData[i]["videoType"] && imageData[i]["videoType"] !== VideoType.Unknown)
			{
				if (imageData[i]["videoType"] === VideoType.Gif)
				{
					imageData[i]["ext"] = "mp4";
					await DownloadGif(imageData[i])
				}
				else if (imageData[i]["videoType"] === VideoType.Video)
				{
					imageData[i]["ext"] = "mp4";
					await DownloadVideo(imageData[i])
				}
			}
			else
			{
				HandleImageDownload(imageData[i]);

			}
		}
	}

	function GetTweetUrlData(url)
	{
		// console.log(url)
		// Remove photo ext
		let cleanedUrl = url.replace(/\/photo\/.*/, '');
		cleanedUrl = cleanedUrl.replace(/https+\:\/\/(twitter|x).com\//, '');

		let splitUrl = cleanedUrl.split("/")

		let tweetData = {
			"user": splitUrl[0],
			"id": splitUrl[2]
		};

		return tweetData;
	}

	function GetTweetSourceUrlData(url)
	{
		const formatExt = url.match('\\?format=(.*?)&');
		let ext = null;

		if (formatExt && formatExt !== null)
		{
			ext = formatExt[1];
		}
		else
		{
			const seperatedExt = url.split("?")[0].split(".")
			ext = seperatedExt[seperatedExt.length - 1];
		}

		let imgUrl = url.split('?')[0] + '.' + ext

		return {
			"url": imgUrl,
			"ext": ext
		};
	}

	function NewDownloadImage(article, parentDiv, saveDir)
	{
		console.log('WE ARE IN')

		let tweetData = parentDiv.attributes["tweetData"];
		let tweetId = tweetData["id"];
		let user = tweetData["user"];
		// console.log(tweetData)
		// console.log(article)
		let imageNodes = article.getElementsByClassName("id" + tweetId);
		// console.log(imageNodes);

		let images = [];

		let multipleImages = imageNodes.length > 1;

		for (let i = 0; i < imageNodes.length; i++)
		{
			let image = {};
			image["tweetId"] = tweetId;
			image["user"] = user;
			let urlData = GetTweetSourceUrlData(imageNodes[i].src);
			// console.log(urlData)
			image["imageUrl"] = urlData["url"];
			image["ext"] = urlData["ext"];
			image["index"] = multipleImages ? i + 1 : -1;
			image["saveDir"] = saveDir;
			images.push(image);
		}

		// console.log(images)

		for (let i = 0; i < images.length; i++)
		{
			HandleImageDownload(images[i]);
		}
	}

	async function HandleImageDownload(imageData)
	{
		// console.log(imageData)
		let filename = "";

		if (await GetSetting("UseDirectories"))
		{
			filename += imageData["saveDir"] !== null ? imageData["saveDir"] : "";
			filename += imageData["saveDir"][imageData["saveDir"].length - 1] != "/" ? "/" : "";
			filename += imageData["user"] + "/";
		}

		filename += imageData["user"] + '_' + imageData["tweetId"];
		filename += imageData["index"] === -1 ? "" : "_" + imageData["index"];

		filename += "." + imageData["ext"];

		let url = imageData["imageUrl"]

		if (!url.includes(":orig"))
		{
			url += ":orig";
		}

		// console.log(url)
		// console.log(filename)

		if (navigator["platform"] == "Win32")
		{
			filename.replace("/", "\\")
		}
		// console.log(filename)

		GM_download(
		{
			url: url,
			name: filename
		});
	}



	async function AddDownloadButtonToArticle(article, tweetData)
	{
		let divDownloadImgs = AddButtonDiv(article);
		// let tweetFooter = article.querySelector('div[role="group"]');
		if (divDownloadImgs === null)
		{
			return;
		}

		// let divDownloadImgs = tweetFooter.parentElement.getElementsByClassName("downloadImgs");
		// // let dataAttribute = {};

		if (divDownloadImgs.attributes["dlbtnattached"])
		{
			return;
		}

		divDownloadImgs.attributes["dlbtnattached"] = true;

		divDownloadImgs.attributes["tweetData"] = tweetData;

		const buttonSettings = await GetButtonSettings();

		if (buttonSettings["Button1Toggle"])
		{
			let button1 = document.createElement("button")
			button1.className = "downloadbutton button1";
			button1.title = "Download";
			// button1.style.margin = "auto";

			if (buttonSettings["Button1Colour"] !== "")
			{
				button1.style.backgroundColor = buttonSettings["Button1Colour"];
			}

			button1.addEventListener("click", function()
			{
				NewDownloadImage(article, divDownloadImgs, buttonSettings["Button1Directory"]);
			}, false);

			if (buttonSettings["Button1Width"] !== "")
			{
				button1.style.width = buttonSettings["Button1Width"];
			}
			if (buttonSettings["Button1Height"] !== "")
			{
				button1.style.height = buttonSettings["Button1Height"];
			}

			// button1.style.float = "right";


			if (buttonSettings["Button1Picture"] !== "")
			{
				let buttonImage = document.createElement("img");
				buttonImage.className = "button1Image";
				buttonImage.src = buttonSettings["Button1Picture"];
				button1.appendChild(buttonImage);
			}

			divDownloadImgs.appendChild(button1);
		}

		if (buttonSettings["Button2Toggle"])
		{
			let button2 = document.createElement("button")
			button2.className = "downloadbutton button2";
			button2.title = "Download";
			button2.style.backgroundColor = buttonSettings["Button2Colour"];
			// button2.style.margin = "auto";

			button2.addEventListener("click", function()
			{
				NewDownloadImage(article, divDownloadImgs, buttonSettings["Button2Directory"]);
			}, false);

			if (buttonSettings["Button2Width"] !== "")
			{
				button2.style.width = buttonSettings["Button2Width"];
			}
			if (buttonSettings["Button2Height"] !== "")
			{
				button2.style.height = buttonSettings["Button2Height"];
			}

			// button2.style.float = "right";

			if (tweetButtonImage !== "")
			{
				let buttonImage = document.createElement("img");
				buttonImage.className = "button2Image";
				buttonImage.src = buttonSettings["Button2Picture"];
				button2.appendChild(buttonImage);
			}

			// tweetFooter.appendChild(button2);
			divDownloadImgs.appendChild(button2);
		}
	}

	async function CopyTweetUrl(downloadDiv)
	{
		let article = downloadDiv.closest("article")
		if (article === null)
		{
			return
		}
		let links = article.querySelectorAll('a[role="link"]');
		let linkNode = null;

		for (let i = 0; i < links.length; i++)
		{
			if (links[i].querySelector("time") !== null)
			{
				linkNode = links[i];
				break;
			}
		}

		if (linkNode === null)
		{
			return;
		}

		let tweetData = GetTweetUrlData(linkNode.href);

		const buttonSettings = await GetButtonSettings();
		const urlBase = "https://{domain}.com/{user}/status/{postid}";
		let url = urlBase.replace("{domain}", buttonSettings["CopyUrlDomain"]).replace("{user}", tweetData["user"]).replace("{postid}", tweetData["id"]);

		// if (typeof ClipboardItem !== 'undefined')
		// {
		// 	const item = new ClipboardItem(
		// 	{
		// 		"text/plain": "test"
		// 	});

		// 	await navigator.clipboard.write([item])
		// }
		// else
		// {
		await navigator.clipboard.writeText(url)

		// }
	}

	function AddButtonDiv(node)
	{
		let article;
		if (node.tagName === "ARTICLE")
		{
			article = node;
		}
		else
		{
			article = node.closest("article")
			if (article == null)
			{
				return;
			}
		}

		let divDownloadImgs = article.getElementsByClassName("downloadImgs");
		if (divDownloadImgs.length > 0)
		{
			return divDownloadImgs[0];
		}

		let tweetFooter = article.querySelector('div[role="group"]');
		if (tweetFooter === null)
		{
			return;
		}

		divDownloadImgs = document.createElement('DIV');
		divDownloadImgs.className = 'downloadImgs';
		divDownloadImgs.style.display = "flex";
		tweetFooter.parentElement.insertBefore(divDownloadImgs, tweetFooter);


		return divDownloadImgs;
	}

	async function AddButtonUtilities(node)
	{
		let divDownloadImgs = node.getElementsByClassName("downloadImgs");

		if (divDownloadImgs === null || divDownloadImgs?.length === 0)
		{
			divDownloadImgs = AddButtonDiv(node)
		}

		if (divDownloadImgs === null || divDownloadImgs?.length === 0)
		{
			return;
		}

		const buttonSettings = await GetButtonSettings();

		if (buttonSettings["CopyUrlToggle"])
		{
			if (divDownloadImgs.querySelectorAll(".copyUrlButton").length === 0)
			{
				let copyUrlButton = document.createElement("button")
				copyUrlButton.className = "copyUrlButton";
				copyUrlButton.title = "Download";
				copyUrlButton.style.backgroundColor = buttonSettings["CopyUrlColour"];
				copyUrlButton.style.margin = "auto";

				copyUrlButton.addEventListener("click", function()
				{
					CopyTweetUrl(divDownloadImgs);
				}, false);

				if (buttonSettings["CopyUrlWidth"] !== "")
				{
					copyUrlButton.style.width = buttonSettings["CopyUrlWidth"];

				}
				if (buttonSettings["CopyUrlHeight"] !== "")
				{
					copyUrlButton.style.height = buttonSettings["CopyUrlHeight"];
				}

				copyUrlButton.style.float = "center";

				if (buttonSettings["CopyUrlPicture"] !== "")
				{
					let buttonImage = document.createElement("img");
					buttonImage.className = "copyUrlImage";
					buttonImage.src = buttonSettings["CopyUrlPicture"];
					copyUrlButton.appendChild(buttonImage);
				}

				divDownloadImgs.appendChild(copyUrlButton);
			}
		}
	}

	const observer = new MutationObserver(mutationList =>
	{
		// console.log("looking")

		mutationList.filter(m => m.type === 'childList').forEach(m =>
		{
			m.addedNodes.forEach(
				node =>
				{
					//console.log(node);

					if (node.tagName == "IMG")
					{


						// console.log(node);
						// console.log(node.parentNode)

						let closestListItem = node.closest("li");
						// console.log(closestListItem)

						// if (closestListItem)
						// {
						//  console.log(closestListItem)
						// }

						if (closestListItem &&
							closestListItem.attributes &&
							closestListItem.attributes["role"].value == "listitem")
						{
							// console.log("in")
							ProcessMediaTweet(closestListItem, node);
						}
						//data-testid="tweetPhoto"
						else if (node.parentNode &&
							node.parentNode.attributes["aria-label"] &&
							node.parentNode.attributes["aria-label"].value === "Image" ||
							node.parentNode.attributes["data-testid"] &&
							node.parentNode.attributes["data-testid"].value === "tweetPhoto")
						{
							AddButtonUtilities(node)

							let imageParent = node.parentNode;
							// console.log("image")
							// console.log(node.parentNode)
							// console.log(node.parentNode.attributes["data-testid"])
							let article = imageParent.closest("article");
							if (article !== null)
							{
								ProcessTweet(article, imageParent);
							}
							// console.log(node)
							// console.log(imageParent);
						}
						else if (node.parentNode &&
							node.parentNode.attributes["aria-label"] &&
							node.parentNode.attributes["aria-label"].value == "Embedded video" ||
							(node.src && node.src.includes("tweet_video") || node.src.includes("tw_video")))
						{
							AddButtonUtilities(node)

							// console.log("VIDEO")
							// console.log(node)
							let imageParent = node.parentNode;
							// console.log("image")
							let article = imageParent.closest("article");
							if (article !== null)
							{
								ProcessVideoTweet(article, imageParent);
							}
							// console.log(node)
							// console.log(imageParent);
						}
						// else
						// {

						// }
					}
				}
			);
		})
	});

	const InsertObserver = () =>
	{
		console.log("OBSERVE");
		let mainNode = document.querySelector("main");
		observer.observe(mainNode,
		{
			childList: true,
			subtree: true
		});
	}

	function SetupUI()
	{



		let header = document.querySelector('header[role="banner"]')
		let logo = header.querySelector('svg')
		let logoParent = logo.parentElement;
		let logoH1 = logoParent.closest("h1")
		// console.log(logoH1)

		let settingsButton = document.createElement("button")
		//dlButton.className = "ProfileTweet-actionButton u-textUserColorHover js-actionButton js-tooltip";
		settingsButton.className = "twdlSettings";
		settingsButton.id = "twdlSettings";
		settingsButton.title = "Settings";
		settingsButton.textContent = "Settings"
		settingsButton.style.backgroundColor = "grey"

		settingsButton.addEventListener("click", function()
		{



			//--- Add our custom dialog using jQuery. Note the multi-line string syntax.
			$("body").append(
				'<div id="gmOverlayDialog">                                                     \
             Resize with the control in the lower-left, or by dragging any edge.<br><br>    \
                                                                                \
                           <div>                                                 \
             <label id="label_use_save_dir">Use Save Paths</label>           \
             <input type="checkbox" id="input_use_save_dir">                                      \
              </div>                                                                          \
                                                                                            \
                          <div>                     \
                          <p></p>                                  \
                          </div>                                  \
              <div>                                                                          \
             <label id="label_toggle_button_1">Enable Button 1</label>           \
             <input type="checkbox" id="input_toggle_button_1">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_1_colour">Button 1 Colour</label>                       \
            <input id="input_button_1_colour">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_1_picture">Button 1 Picture</label>                       \
             <input id="input_button_1_picture">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_1_width">Button 1 Width</label>                       \
             <input id="input_button_1_width">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_1_height">Button 1 Height</label>                       \
             <input id="input_button_1_height">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_1_directory">Button 1 Directory</label>                       \
             <input id="input_button_1_directory">                                      \
              </div>                                                                          \
                          <div>                     \
                          <p></p>                                  \
                          </div>                                  \
                                                                    \
              <div>                                                                          \
             <label id="label_toggle_button_2">Enable Button 2</label>           \
             <input type="checkbox" id="input_toggle_button_2">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_2_colour">Button 2 Colour</label>                       \
             <input id="input_button_2_colour">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_2_picture">Button 2 Picture</label>                       \
             <input id="input_button_2_picture">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_2_width">Button 2 Width</label>                       \
             <input id="input_button_2_width">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_2_height">Button 2 Height</label>                       \
             <input id="input_button_2_height">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_2_directory">Button 2 Directory</label>                       \
             <input id="input_button_2_directory">                                      \
              </div>                                                                          \
                                                                    \
                          <div>                                    \
                          <p></p>                                  \
                          </div>                                  \
                                                                    \
                                                                    \
                            <div>                                                                          \
             <label id="label_toggle_media_button_1">Enable Media Button 1</label>           \
             <input type="checkbox" id="input_toggle_media_button_1">                                      \
              </div>                                                                          \
                          <div>                                                                          \
             <label id="label_media_button_1_colour">Media Button 1 Colour</label>                       \
            <input id="input_media_button_1_colour">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_media_button_1_picture">Media Button 1 Picture</label>                       \
             <input id="input_media_button_1_picture">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_media_button_1_width">Media Button 1 Width</label>                       \
             <input id="input_media_button_1_width">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_media_button_1_height">Media Button 1 Height</label>                       \
             <input id="input_media_button_1_height">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_media_button_1_directory">Media Button 1 Directory</label>                       \
             <input id="input_media_button_1_directory">                                      \
              </div>                                                                          \
                          <div>                     \
                          <p></p>                                  \
                          </div>                                  \
                                                                    \
              <div>                                                                          \
             <label id="label_toggle_media_button_2">Enable Media Button 2</label>           \
             <input type="checkbox" id="input_toggle_media_button_2">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_media_button_2_colour">Media Button 2 Colour</label>                       \
             <input id="input_media_button_2_colour">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_media_button_2_picture">Media Button 2 Picture</label>                       \
             <input id="input_media_button_2_picture">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_media_button_2_width">Media Button 2 Width</label>                       \
             <input id="input_media_button_2_width">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_media_button_2_height">Media Button 2 Height</label>                       \
             <input id="input_media_button_2_height">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_media_button_2_directory">Media Button 2 Directory</label>                       \
             <input id="input_media_button_2_directory">                                      \
              </div>                                                                          \
                                       <div>                     \
                          <p></p>                                  \
                          </div>                                  \
                                                                    \
              <div>                                                                          \
             <label id="label_toggle_button_copyurl">Enable Copy Url Button</label>           \
             <input type="checkbox" id="input_toggle_button_copyurl">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_copyurl_colour">Copy Url Colour</label>                       \
             <input id="input_button_copyurl_colour">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_copyurl_picture">Copy Url Picture</label>                       \
             <input id="input_button_copyurl_picture">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_copyurl_width">Copy Url Width</label>                       \
             <input id="input_button_copyurl_width">                                      \
              </div>                                                                          \
              <div>                                                                          \
             <label id="label_button_copyurl_height">Copy Url Height</label>                       \
             <input id="input_button_copyurl_height">                                      \
              </div>                                                                          \
               <div>                                                                          \
              <label id="label_button_copyurl_domain">Copy Url domain</label>                       \
              <input id="input_button_copyurl_domain">                                      \
               </div>                                                                          \
             </div>                                                                         \
            '
			);

			// console.log($("input_button_1_colour"))

			//--- Activate the dialog.
			let dialog = $("#gmOverlayDialog").dialog(
			{
				modal: true,
				title: "Click and drag here.",
				zIndex: 83668, //-- This number doesn't need to get any higher.
				height: 500,
				width: 580,
				buttons: [
				{
					style: "lightgrey",
					text: "Import",
					click: function()
					{
						ImportSettings();
					}
				},
				{
					text: "Export",
					click: function()
					{
						ExportSettings();
					}
				},
				{
					text: "Clear",
					click: function()
					{
						ClearSettingFields()
					}
				},
				{
					text: "Reset Stored",
					click: function()
					{
						ResetStoredSettings();
						FillSettingsPage();
					}
				},
				{
					text: "OK",
					click: function()
					{
						if (SettingsDialogOk())
						{
							$(this).dialog("close");
						}

					}
				},
				{
					text: "Cancel",
					click: function()
					{
						$(this).dialog("close");
					}
				}],
				close: function()
				{
					$("#gmOverlayDialog").remove()
				},
				focus: function()
				{
					FillSettingsPage();
				}
			});
			$("#gmOverlayDialog").parent().attr("id", "twdlSettingDialog");

		}, false);
		logoH1.appendChild(settingsButton)
	}

	function HandleImportSettings()
	{
		let settingsToImport = $("#input_import")[0].value;

		let settingJson = JSON.parse(settingsToImport)



		for (const [key, value] of Object.entries(SettingMapping))
		{
			if (settingJson[key])
			{
				GM.setValue(value, settingJson[key])
			}
			else
			{
				GM.setValue(value, "");
			}
		}


	}

	function ImportSettings()
	{
		//--- Add our custom dialog using jQuery. Note the multi-line string syntax.
		$("body").append(
			'<div id="twimgdl_import">                                                     \
             Input settings to import.<br><br>    \
                                                                                \
                           <div>                                                 \
             <label id="label_import">Use Save Paths</label>           \
             <input id="input_import">                                      \
              </div>                                                                          \
                                                                                            \
                                                                           \
             </div>                                                                         \
            '
		);

		//--- Activate the dialog.
		let dialog = $("#twimgdl_import").dialog(
		{
			modal: true,
			title: "Import settings.",
			zIndex: 83668, //-- This number doesn't need to get any higher.
			height: 500,
			width: 580,
			buttons: [
			{
				text: "OK",
				click: function()
				{
					HandleImportSettings();
					FillSettingsPage();
					$(this).dialog("close");
				}
			},
			{
				text: "Cancel",
				click: function()
				{
					FillSettingsPage();
					$(this).dialog("close");
				}
			}],
			close: function()
			{
				$("#twimgdl_import").remove()
			},
		});

		$("#twimgdl_import").parent().attr("id", "twimgdl_import_parent");
	}

	async function ExportSettings()
	{
		let value;
		let settings = {};

		for (const [key, defaultValue] of Object.entries(DefaultConfiguration))
		{
			value = await GM.getValue(SettingMapping[key], defaultValue);

			if (value !== null && value !== "")
			{
				settings[key] = value;
			}
		}

		const settingBlob = await new Blob([JSON.stringify(settings)],
		{
			type: "text/plain",
		})

		const settingFilename = "TwitterDownloadImages_" + Date.now() + ".json";

		const url = await URL.createObjectURL(settingBlob)

		const dlDetails = {
			url: url,
			name: settingFilename,
			onerror: function(ex)
			{
				window.URL.revokeObjectURL(url)
				console.log("error")
				console.log(ex);
				console.log("ex.error");
				console.log(ex.error);
			},
			onload: function(ex)
			{
				window.URL.revokeObjectURL(url)
			}
		};

		let dl = GM_download(dlDetails)
	}

	function ResetStoredSettings()
	{
		for (const [key, value] of Object.entries(DefaultConfiguration))
		{
			GM.setValue(SettingMapping[key], value);
		}
	}

	function ClearSettingFields()
	{
		for (const [key, value] of Object.entries(SettingMapping))
		{
			let field = $("#" + value)
			if (field)
			{
				field[0].value = "";
			}
		}
	}

	const FillSettingsPage = async function()
	{
		for (const [key, value] of Object.entries(UICheckBoxes))
		{
			let settingValue = await GetSetting(key)
			$("#" + value)[0].checked = settingValue;
		}

		for (const [key, value] of Object.entries(UITextBoxes))
		{
			let settingValue = await GetSetting(key)
			$("#" + value)[0].value = settingValue;
		}
	}

	const SettingsDialogOk = function(dialog)
	{
		for (const [key, value] of Object.entries(UICheckBoxes))
		{
			GM.setValue(value, $("#" + value)[0].checked)
		}

		for (const [key, value] of Object.entries(UITextBoxes))
		{
			GM.setValue(value, $("#" + value)[0].value)

		}

		return true;
	}

	const SettingsDialogCancel = function(dialog)
	{
		return true;
	}

	var iconSet1 = GM_getResourceURL("IconSet1");
	var iconSet2 = GM_getResourceURL("IconSet2");
	var jqUI_CssSrc = GM_getResourceText("jqUI_CSS");
	jqUI_CssSrc = jqUI_CssSrc.replace(/url\(images\/ui\-bg_.*00\.png\)/g, "");
	jqUI_CssSrc = jqUI_CssSrc.replace(/images\/ui-icons_222222_256x240\.png/g, iconSet1);
	jqUI_CssSrc = jqUI_CssSrc.replace(/images\/ui-icons_454545_256x240\.png/g, iconSet2);

	GM_addStyle(jqUI_CssSrc);

	//--- Add some custom style tweaks.
	GM_addStyle('                 \
    div.ui-widget-overlay {     \
        background: red;        \
        opacity:    0.6;        \
    }                           \
');
	GM_addStyle(`
                div#twdlSettingDialog {
                    z-index: 83668;
                }
                 div#twimgdl_import_parent {
                    z-index: 83700;
                }

                button.ui-button {
                	background-color : lightgrey
                }
                

                `);


	// function InsertVideoHttpIntercept()
	// {
	//  const originalOpen = XMLHttpRequest.prototype.open;

	//  XMLHttpRequest.prototype.open = function(method, url)
	//  {
	//      // console.log("Intercepted HTTP request: " + method + " " + url);
	//      this.addEventListener('readystatechange', function(event)
	//      {
	//          if (this.readyState === 4)
	//          {
	//              if (this !== null && this.response !== null && this.responseText !== null &&
	//                  this.responseText.includes("ext_tw_video"))
	//              {
	//                  console.log("intercept")
	//                  console.log(this)
	//                  let interceptJson = JSON.parse(this.response);
	//                  ProcessInterceptedJson(interceptJson);
	//              }
	//              // else if (this !== null && this.response !== null && this.response.includes("Fyl-GC5aYAACT6k") || this.responseText !== null &&
	//              //  this.responseText.includes("Fyl-GC5aYAACT6k"))
	//              // {
	//              //  console.log(this)
	//              // }
	//              // else if (this !== null && this.response !== null && this.response.includes("id__fxy8zr25a9p"))
	//              // {
	//              //  console.log(this)
	//              // }
	//          }
	//          else if (this.readyState === 3)
	//          {
	//              console.log("waiting");
	//              console.log(this)
	//          }
	//      })
	//      originalOpen.apply(this, arguments);
	//  };
	// }



	// InsertVideoHttpIntercept();


	waitForKeyElements(
		'main',
		InsertObserver,
		true
	);

	waitForKeyElements(
		'a[aria-label="X"]',
		SetupUI,
		true
	);

	function waitForKeyElements(
		selectorTxt,
		/* Required: The jQuery selector string that
		                    specifies the desired element(s).
		                */
		actionFunction,
		/* Required: The code to run when elements are
		                       found. It is passed a jNode to the matched
		                       element.
		                   */
		bWaitOnce,
		/* Optional: If false, will continue to scan for
		                  new elements even after the first match is
		                  found.
		              */
		iframeSelector
		/* Optional: If set, identifies the iframe to
		                      search.
		                  */
	)
	{
		var targetNodes, btargetsFound;

		if (typeof iframeSelector == "undefined")
			targetNodes = $(selectorTxt);
		else
			targetNodes = $(iframeSelector).contents()
			.find(selectorTxt);

		if (targetNodes && targetNodes.length > 0)
		{
			btargetsFound = true;
			/*--- Found target node(s).  Go through each and act if they
			    are new.
			*/
			targetNodes.each(function()
			{
				var jThis = $(this);
				var alreadyFound = jThis.data('alreadyFound') || false;

				if (!alreadyFound)
				{
					//--- Call the payload function.
					var cancelFound = actionFunction(jThis);
					if (cancelFound)
						btargetsFound = false;
					else
						jThis.data('alreadyFound', true);
				}
			});
		}
		else
		{
			btargetsFound = false;
		}

		//--- Get the timer-control variable for this selector.
		var controlObj = waitForKeyElements.controlObj ||
		{};
		var controlKey = selectorTxt.replace(/[^\w]/g, "_");
		var timeControl = controlObj[controlKey];

		//--- Now set or clear the timer as appropriate.
		if (btargetsFound && bWaitOnce && timeControl)
		{
			//--- The only condition where we need to clear the timer.
			clearInterval(timeControl);
			delete controlObj[controlKey]
		}
		else
		{
			//--- Set a timer, if needed.
			if (!timeControl)
			{
				timeControl = setInterval(function()
					{
						waitForKeyElements(selectorTxt,
							actionFunction,
							bWaitOnce,
							iframeSelector
						);
					},
					300
				);
				controlObj[controlKey] = timeControl;
			}
		}
		waitForKeyElements.controlObj = controlObj;
	}
})();
