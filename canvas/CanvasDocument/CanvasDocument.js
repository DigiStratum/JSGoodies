function CanvasDocument(canvasid) {

	// Private Properties
	var canvas = document.getElementById(canvasid);
	var ppi = 72; // Pixels per inch
	var scale = 1.0;
	var sizes = {
		// 8.5" x 11" Letter size
		letter: [Math.ceil(8.5 * ppi), Math.ceil(11 * ppi)],
		// 8.5" x 14" Legal size
		legal: [Math.ceil(8.5 * ppi), Math.ceil(14 * ppi)],
	};
	var size = sizes.letter;
	var orientation = null;
	var width = 0;
	var height = 0;
	var objects = [];
	var clickSelection = false;
	var selectedObject = null;
	var selectionCallback = null;

	// Public functions
	this.setClickSelection = function (state, callback) {
		clickSelection = state ? true : false;
		if ('function' === typeof callback) selectionCallback = callback;
	}

	this.reorientPortrait = function () {
		if ('portrait' === orientation) return;
		width = scaled(size[0]);
		height = scaled(size[1]);
		reorient();
		orientation = 'portrait';
	};

	this.reorientLandscape = function () {
		if ('landscape' === orientation) return;
		width = scaled(size[1]);
		height = scaled(size[0]);
		reorient();
		orientation = 'landscape';
	};

	// Convert from PDF to canvas coordinate space (origin is lower left on PDF, upper left on canvas!)
	this.addPDFObject = function (type, x, y, w, h, data) {
		this.addObject(type, x, height - y, w, h, data);
	};

	this.addObject = function (type, x, y, w, h, data) {
		objects.push({
			type: type,
			x: x,
			y: y,
			w: w,
			h: h,
			data: data
		});
	};

	this.render = function () {
		for (var i = 0; i < objects.length; i++) {
			renderObject(objects[i], false);
		}
	};

	// Private functions
	function reorient() {
		canvas.width = scaled(width);
		canvas.height = scaled(height);
		canvas.addEventListener('click', function (evt) {
			if (! clickSelection) return;
			var canvasLeft = canvas.offsetLeft;
			var canvasTop = canvas.offsetTop;
			var clickX= evt.pageX - canvasLeft;
			var clickY = evt.pageY - canvasTop;
			var obj = getObjectAt(clickX, clickY);
			if (null !== obj) {
				// We clicked something!
				if (null !== selectedObject) {
					// There was a prior object selected; remove the highlighting for it
					renderObject(selectedObject, false);
				}
				renderObject(obj, true);
				selectedObject = obj;
				if ('function' === typeof selectionCallback) {
					selectionCallback(obj);
				}
			}
		});
	}

	// There can be only one return value, so the first match wins; later overlapping ones lose
	function getObjectAt(x, y) {
		for (var i = 0; i < objects.length; i++) {
			// If the (x, y) test point is inside this object's bounding rectangle...
			if ((x >= scaled(objects[i].x)) && (y >= scaled(objects[i].y)) &&
			    (x <= scaled(objects[i].x + objects[i].w)) && (y <= scaled(objects[i].y + objects[i].h))) {
				return objects[i];
			}
		}
		return null;
	}

	function scaled(pos) {
		return Math.floor(pos * scale);
	}


	function renderObject(object, selected) {
		switch (object.type) {
			case 'text':
				renderTextObject(object, selected);
				break;

			case 'rect':
				renderRectObject(object);
				break;
		}
	}

	function renderTextObject(textObject, selected) {
		var sCol = '#FFF';
		var fCol = sCol;
		
		// If selected, highlight from behind
		if (clickSelection && selected) {
			sCol = '#996';
			fCol = '#FFC';
		}
		addRect(scaled(textObject.x), scaled(textObject.y), scaled(textObject.w), scaled(textObject.h), '1', sCol, fCol);
		addText(scaled(textObject.x), scaled(textObject.y + textObject.h), scaled(textObject.w), scaled(textObject.h), textObject.data);
	}

	// Pass rectangle border color in the 'data' property
	function renderRectObject(rectObject) {
		addRect(scaled(rectObject.x), scaled(rectObject.y), scaled(rectObject.w), scaled(rectObject.h), '1', rectObject.data);
 	}

	function addText(x, y, w, h, text) {
		var ctx = canvas.getContext('2d');
		ctx.font = h + 'px Arial';
		ctx.fillStyle = '#333';
		ctx.fillText(text, x, y, w);
	}

	function addRect(x, y, w, h, thickness, strokeColor, fillColor) {
		var ctx = canvas.getContext('2d');
		ctx.beginPath();
		if (fillColor) {
			ctx.fillStyle = fillColor;
			ctx.fillRect(x, y, w, h);
		}
		else {
			ctx.rect(x, y, w, h);
		}
		ctx.lineWidth = thickness;
		ctx.strokeStyle = strokeColor;
		ctx.strokeRect(x, y, w, h);
		ctx.closePath();
	}

	// Construct!
	this.reorientPortrait();
}

