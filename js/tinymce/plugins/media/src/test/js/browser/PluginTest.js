asynctest('browser.core.PluginTest', [
	'global!tinymce',
	'tinymce.media.Plugin',
	'ephox.mcagar.api.TinyLoader',
	'ephox.mcagar.api.TinyDom',
	'ephox.mcagar.api.TinyApis',
	'ephox.mcagar.api.TinyUi',
	'ephox.agar.api.Pipeline',
	'ephox.agar.api.GeneralSteps',
	'ephox.agar.api.Waiter',
	'ephox.agar.api.Step',
	'ephox.agar.api.Chain',
	'ephox.agar.api.UiFinder',
	'ephox.agar.api.UiControls',
	'ephox.agar.api.Assertions',
	'tinymce.media.test.Utils'
], function (
	tinymce, Plugin, TinyLoader, TinyDom, TinyApis,
	TinyUi, Pipeline, GeneralSteps,	Waiter,
	Step, Chain, UiFinder, UiControls, Assertions, Utils
) {
	var success = arguments[arguments.length - 2];
	var failure = arguments[arguments.length - 1];

	var cFindFilepickerInput = Utils.cFindInDialog(function (value) {
		return document.getElementById(value.dom().htmlFor).querySelector('input');
	});
	var cFindWidthInput = Utils.cFindInDialog(function (value) {
		return document.getElementById(value.dom().htmlFor).querySelector('input[aria-label="Width"]');
	});
	var cFindHeightInput = Utils.cFindInDialog(function (value) {
		return document.getElementById(value.dom().htmlFor).querySelector('input[aria-label="Height"]');
	});

	var cGetWidthValue = function (ui) {
		return Chain.fromChains([
			cFindWidthInput(ui, 'Dimensions'),
			UiControls.cGetValue
		]);
	};

	var cSetWidthValue = function (ui, value) {
		return Chain.fromChains([
			cFindWidthInput(ui, 'Dimensions'),
			UiControls.cSetValue(value)
		]);
	};

	var cGetHeightValue = function (ui) {
		return Chain.fromChains([
			cFindHeightInput(ui, 'Dimensions'),
			UiControls.cGetValue
		]);
	};

	var cSetHeightValue = function (ui, value) {
		return Chain.fromChains([
			cFindHeightInput(ui, 'Dimensions'),
			UiControls.cSetValue(value)
		]);
	};

	var sAssertWidthValue = function (ui, value) {
		return Waiter.sTryUntil('Wait for new width value',
			Chain.asStep({}, [
				cGetWidthValue(ui),
				Assertions.cAssertEq('Assert size value', value)
			]), 1, 3000
		);
	};

	var sAssertHeightValue = function (ui, value) {
		return Waiter.sTryUntil('Wait for new height value',
			Chain.asStep({}, [
				cGetHeightValue(ui),
				Assertions.cAssertEq('Assert size value', value)
			]), 1, 3000
		);
	};

	var sSetFormItemPaste = function (ui, value) {
		return Chain.asStep({}, [
			Utils.cSetFormItem(ui, value),
			Utils.cFakeEvent('paste')
		]);
	};

	var sChangeWidthValue = function (ui, value) {
		return Chain.asStep({}, [
			cSetWidthValue(ui, value),
			Utils.cFakeEvent('change')
		]);
	};

	var sChangeHeightValue = function (ui, value) {
		return Chain.asStep({}, [
			cSetHeightValue(ui, value),
			Utils.cFakeEvent('change')
		]);
	};

	var sAssertSizeRecalcConstrained = function (ui) {
		return GeneralSteps.sequence([
			Utils.sOpenDialog(ui),
			sSetFormItemPaste(ui, 'http://test.se'),
			sAssertWidthValue(ui, "300"),
			sAssertHeightValue(ui, "150"),
			sChangeWidthValue(ui, "350"),
			sAssertWidthValue(ui, "350"),
			sAssertHeightValue(ui, "175"),
			sChangeHeightValue(ui, "100"),
			sAssertHeightValue(ui, "100"),
			sAssertWidthValue(ui, "200"),
			Utils.sCloseDialog(ui)
		]);
	};

	var sAssertSizeRecalcUnconstrained = function (ui) {
		return GeneralSteps.sequence([
			Utils.sOpenDialog(ui),
			sSetFormItemPaste(ui, 'http://test.se'),
			ui.sClickOnUi('click checkbox', '.mce-checkbox'),
			sAssertWidthValue(ui, "300"),
			sAssertHeightValue(ui, "150"),
			sChangeWidthValue(ui, "350"),
			sAssertWidthValue(ui, "350"),
			sAssertHeightValue(ui, "150"),
			sChangeHeightValue(ui, "100"),
			sAssertHeightValue(ui, "100"),
			sAssertWidthValue(ui, "350"),
			Utils.sCloseDialog(ui)
		]);
	};


	var sSetFormItemNoEvent = function (ui, value) {
		return Chain.asStep({}, [
			Utils.cSetFormItem(ui, value)
		]);
	};

	var sAssertEditorContent = function (apis, expected) {
		return Waiter.sTryUntil('Wait for editor value',
			Chain.asStep({}, [
				apis.cGetContent,
				Assertions.cAssertHtml('Assert body content', expected)
			]), 1, 3000
		);
	};

	var sTestEmbedContentSubmit = function (ui, editor, apis, url, expected) {
		return GeneralSteps.sequence([
			Utils.sOpenDialog(ui),
			sSetFormItemNoEvent(ui, url),
			ui.sClickOnUi('click checkbox', 'div.mce-primary > button'),
			sAssertEditorContent(apis, expected)

		]);
	};

	TinyLoader.setup(function (editor, onSuccess, onFailure) {
		var ui = TinyUi(editor);
		var apis = TinyApis(editor);

		Pipeline.async({}, [
			Utils.sTestEmbedContentFromUrl(ui,
				'https://www.youtube.com/watch?v=b3XFjWInBog',
				'<iframe src="//www.youtube.com/embed/b3XFjWInBog" width="560" height="314" allowFullscreen="1"></iframe>'
			),
			Utils.sTestEmbedContentFromUrl(ui,
				'https://www.google.com',
				'<video width="300" height="150" controls="controls">\n<source src="https://www.google.com" />\n</video>'
			),
			// sTestEmbedContentSubmit(ui, editor, apis, 'test.se', 'test.se'),
			sAssertSizeRecalcConstrained(ui),
			sAssertSizeRecalcUnconstrained(ui)
		], onSuccess, onFailure);
	}, {
		plugins: ["media"],
		toolbar: "media"
	}, success, failure);
});
