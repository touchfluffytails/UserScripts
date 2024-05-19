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


	// function InsertVideoHttpIntercept()
	// {
	// 	const originalOpen = window.XMLHttpRequest.prototype.open;
	// 	// console.log(originalOpen)

	// 	window.XMLHttpRequest.prototype.open = function(method, url)
	// 	{
	// 		// console.log("Intercepted HTTP request: " + method + " " + url);
	// 		this.addEventListener('readystatechange', function(event)
	// 		{
	// 			// console.log(event)
	// 			if (this.readyState === 4)
	// 			{
	// 				if (this !== null &&
	// 					this.response !== null &&
	// 					(this.responseType === '' || this.responseType === 'text') &&
	// 					this.responseText !== null &&
	// 					this.responseText.includes("ext_tw_video"))
	// 				{

	// 					let interceptJson = null;

	// 					try
	// 					{
	// 						interceptJson = JSON.parse(this.response);
	// 					}
	// 					catch
	// 					{}
	// 					if (interceptJson !== null)
	// 					{
	// 						// console.log("intercept")
	// 						// console.log(this)
	// 						ProcessInterceptedJson(interceptJson);
	// 					}
	// 				}
	// 				// else if (this !== null && this.response !== null && this.response.includes("Fyl-GC5aYAACT6k") || this.responseText !== null &&
	// 				//  this.responseText.includes("Fyl-GC5aYAACT6k"))
	// 				// {
	// 				//  console.log(this)
	// 				// }
	// 				// else if (this !== null && this.response !== null && this.response.includes("id__fxy8zr25a9p"))
	// 				// {
	// 				//  console.log(this)
	// 				// }
	// 			}
	// 			// else if (this.readyState === 3)
	// 			// {
	// 			// 	console.log("waiting");
	// 			// 	console.log(this)
	// 			// }
	// 		})
	// 		originalOpen.apply(this, arguments);
	// 	};
	// }

	// function ProcessInterceptedJson(json)
	// {
	// 	if (!json["data"] ||
	// 		!json["data"]["threaded_conversation_with_injections_v2"] ||
	// 		!json["data"]["threaded_conversation_with_injections_v2"]["instructions"])
	// 	{
	// 		return;
	// 	}
	// 	console.log(json)

	// 	let instructions = json["data"]["threaded_conversation_with_injections_v2"]["instructions"];
	// 	let timelineAdd = null;
	// 	// console.log("instruction")

	// 	for (let i = 0; i < instructions.length; i++)
	// 	{
	// 		if (instructions[i]["type"] && instructions[i]["type"] == "TimelineAddEntries")
	// 		{
	// 			// console.log(instructions[i])
	// 			timelineAdd = instructions[i];
	// 			break;
	// 		}
	// 	}

	// 	if (!timelineAdd || timelineAdd === null)
	// 	{
	// 		return;
	// 	}
	// 	console.log("timelineAdd")
	// 	console.log(timelineAdd)

	// 	let entries = timelineAdd["entries"];
	// 	if (!entries || entries === null)
	// 	{
	// 		return;
	// 	}
	// 	// console.log("entries")

	// 	for (let i = 0; i < entries.length; i++)
	// 	{
	// 		// console.log(i)
	// 		// console.log(entries[i])
	// 		ProcessTweetAddEntry(entries[i]);
	// 	}
	// }


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
			// console.log("no variants?")
			// console.log(media)
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
			// console.log("joe over")
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


	InsertVideoHttpIntercept()
