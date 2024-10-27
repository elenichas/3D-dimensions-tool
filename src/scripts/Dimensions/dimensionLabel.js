/**
 * @author mrdoob / http://mrdoob.com/
 */

export var UI = {};

UI.Element = function (dom) {

	this.dom = dom;

};

UI.Element.prototype = {

	add: function () {

		for (var i = 0; i < arguments.length; i++) {

			var argument = arguments[i];

			if (argument instanceof UI.Element) {

				this.dom.appendChild(argument.dom);

			} else {

				console.error('UI.Element:', argument, 'is not an instance of UI.Element.')

			}

		}

		return this;

	},

	remove: function () {

		for (var i = 0; i < arguments.length; i++) {

			var argument = arguments[i];

			if (argument instanceof UI.Element) {

				this.dom.removeChild(argument.dom);

			} else {

				console.error('UI.Element:', argument, 'is not an instance of UI.Element.')

			}

		}

		return this;

	},

	clear: function () {

		while (this.dom.children.length) {

			this.dom.removeChild(this.dom.lastChild);

		}

	},

	setId: function (id) {

		this.dom.id = id;

		return this;

	},

	setClass: function (name) {

		this.dom.className = name;

		return this;

	},

	setStyle: function (style, array) {

		for (var i = 0; i < array.length; i++) {

			this.dom.style[style] = array[i];

		}

		return this;

	},

	setDisabled: function (value) {

		this.dom.disabled = value;

		return this;

	},

	setTextContent: function (value) {

		this.dom.textContent = value;

		return this;

	}

}

// properties

var properties = ['position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'border', 'borderLeft',
	'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display', 'overflow', 'margin', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding', 'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color',
	'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'textAlign', 'textDecoration', 'textTransform', 'cursor', 'zIndex'];

properties.forEach(function (property) {

	var method = 'set' + property.substr(0, 1).toUpperCase() + property.substr(1, property.length);

	UI.Element.prototype[method] = function () {

		this.setStyle(property, arguments);

		return this;

	};

});

// events

var events = ['KeyUp', 'KeyDown', 'MouseOver', 'MouseOut', 'Click', 'DblClick', 'Change'];

events.forEach(function (event) {

	var method = 'on' + event;

	UI.Element.prototype[method] = function (callback) {

		this.dom.addEventListener(event.toLowerCase(), callback.bind(this), false);

		return this;

	};

});


// // Panel
// UI.Panel = function () {

// 	UI.Element.call( this );

// 	var dom = document.createElement( 'div' );
// 	dom.className = 'Panel';

// 	this.dom = dom;

// 	return this;

// };

// UI.Panel.prototype = Object.create( UI.Element.prototype );
// UI.Panel.prototype.constructor = UI.Panel;



UI.Text = function (text) {

	UI.Element.call(this);

	var dom = document.createElement('div');
	dom.className = 'Text';
	dom.style.cursor = 'default';
	dom.style.display = 'flex';
	dom.style.verticalAlign = 'middle';

	this.dom = dom;
	this.setValue(text);

	return this;

};

UI.Text.prototype = Object.create(UI.Element.prototype);
UI.Text.prototype.constructor = UI.Text;

UI.Text.prototype.getValue = function () {
	return this.dom.textContent;
};

UI.Text.prototype.setValue = function (value) {

	if (value !== undefined) {

		this.dom.textContent = value;

	}

	return this;

};


UI.Label = function (text, userData) {

	UI.Element.call(this);

	var dom = document.createElement('div');
	dom.className = 'Text';
	dom.style.cursor = 'default';
	dom.style.display = 'flex';
	dom.style.verticalAlign = 'middle';

	var textDiv = new UI.Text();
	textDiv.setPaddingRight('8px');
	textDiv.setValue(text);
	dom.appendChild(textDiv.dom);

	if (userData.subType == "manual") {
		var button = new UI.Button();
		button.setLabel("x");
		button.setPosition("relative");
		dom.appendChild(button.dom);
	} else if (userData.subType == "auto" && userData.auxType == "simple") {
		const div = document.createElement("div");
		div.id = "svg-background";
		div.style.position = "relative";
		dom.appendChild(div);
	}

	this.dom = dom;

	return this;

};

UI.Label.prototype = Object.create(UI.Element.prototype);
UI.Label.prototype.constructor = UI.Label;

UI.Label.prototype.getValue = function () {

	const text = this.dom.textContent;
	const splitText = text.split(" "); // split on single space characters

	return splitText[0];

};

UI.Label.prototype.setValue = function (value) {

	if (value !== undefined) {

		this.dom.children[0].textContent = value + " mm";

	}

	return this;

};

// Button
UI.Button = function (value) {

	UI.Element.call(this);

	var scope = this;

	var dom = document.createElement('button');
	dom.className = 'Button';

	this.dom = dom;
	this.dom.textContent = value;

	return this;

};

UI.Button.prototype = Object.create(UI.Element.prototype);
UI.Button.prototype.constructor = UI.Button;

UI.Button.prototype.setLabel = function (value) {

	this.dom.textContent = value;

	return this;

};


