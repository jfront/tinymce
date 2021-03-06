define('tinymce.media.core.Nodes', [
	'global!tinymce',
	'tinymce.media.core.Data'
], function (tinymce, Data) {
	var createPlaceholderNode = function (editor, node) {
		var placeHolder;
		var name = node.name;

		placeHolder = new tinymce.html.Node('img', 1);
		placeHolder.shortEnded = true;

		retainAttributesAndInnerHtml(editor, node, placeHolder);

		placeHolder.attr({
			width: node.attr('width') || "300",
			height: node.attr('height') || (name === "audio" ? "30" : "150"),
			style: node.attr('style'),
			src: tinymce.Env.transparentSrc,
			"data-mce-object": name,
			"class": "mce-object mce-object-" + name
		});

		return placeHolder;
	};

	var createPreviewNode = function (editor, node) {
		var previewWrapper;
		var previewNode;
		var shimNode;
		var name = node.name;

		previewWrapper = new tinymce.html.Node('span', 1);
		previewWrapper.attr({
			contentEditable: 'false',
			style: node.attr('style'),
			"data-mce-object": name,
			"class": "mce-preview-object mce-object-" + name
		});

		retainAttributesAndInnerHtml(editor, node, previewWrapper);

		previewNode = new tinymce.html.Node(name, 1);
		previewNode.attr({
			src: node.attr('src'),
			allowfullscreen: node.attr('allowfullscreen'),
			width: node.attr('width') || "300",
			height: node.attr('height') || (name === "audio" ? "30" : "150"),
			frameborder: '0'
		});

		shimNode = new tinymce.html.Node('span', 1);
		shimNode.attr('class', 'mce-shim');

		previewWrapper.append(previewNode);
		previewWrapper.append(shimNode);

		return previewWrapper;
	};

	var retainAttributesAndInnerHtml = function (editor, sourceNode, targetNode) {
		var attrName;
		var attrValue;
		var attribs;
		var ai;
		var innerHtml;

		// Prefix all attributes except width, height and style since we
		// will add these to the placeholder
		attribs = sourceNode.attributes;
		ai = attribs.length;
		while (ai--) {
			attrName = attribs[ai].name;
			attrValue = attribs[ai].value;

			if (attrName !== "width" && attrName !== "height" && attrName !== "style") {
				if (attrName === "data" || attrName === "src") {
					attrValue = editor.convertURL(attrValue, attrName);
				}

				targetNode.attr('data-mce-p-' + attrName, attrValue);
			}
		}

		// Place the inner HTML contents inside an escaped attribute
		// This enables us to copy/paste the fake object
		innerHtml = sourceNode.firstChild && sourceNode.firstChild.value;
		if (innerHtml) {
			targetNode.attr("data-mce-html", escape(Data.sanitize(editor, innerHtml)));
			targetNode.firstChild = null;
		}
	};

	var placeHolderConverter = function (editor) {
		return function (nodes) {
			var i = nodes.length;
			var node;
			var placeHolder;
			var videoScript;

			while (i--) {
				node = nodes[i];
				if (!node.parent) {
					continue;
				}

				if (node.parent.attr('data-mce-object')) {
					continue;
				}

				if (node.name === 'script') {
					videoScript = Data.getVideoScriptMatch(editor, node.attr('src'));
					if (!videoScript) {
						continue;
					}
				}

				if (videoScript) {
					if (videoScript.width) {
						node.attr('width', videoScript.width.toString());
					}

					if (videoScript.height) {
						node.attr('height', videoScript.height.toString());
					}
				}

				if (node.name === 'iframe' && editor.settings.media_live_embeds !== false && tinymce.Env.ceFalse) {
					placeHolder = createPreviewNode(editor, node);
				} else {
					placeHolder = createPlaceholderNode(editor, node);
				}

				node.replace(placeHolder);
			}
		};
	};
	return {
		createPreviewNode: createPreviewNode,
		createPlaceholderNode: createPlaceholderNode,
		placeHolderConverter: placeHolderConverter
	};
});