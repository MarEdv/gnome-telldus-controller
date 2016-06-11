
const Soup = imports.gi.Soup;
const session = new Soup.SessionAsync();

const Mainloop = imports.mainloop;

const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Tweener = imports.ui.tweener;

function _debug(message){
	global.log('[telldus] ' + message);
}

/**
 * Generic method that handles a call to a REST service, calling the success 
 * method with the response as an Object.
 * 
 * @param url
 * @param success
 * @param thisArg
 */
function performAction(url, success, thisArg) {
	let request = Soup.Message.new('GET', url);
	if (!request){
		_debug('request is null, "' + url + '" is wrong');
		return;
	}

	session.queue_message(request, Lang.bind(this, function(session, response) {
		if (response.status_code == 200){
			let r = JSON.parse(response.response_body.data);
			success(r, thisArg);
		} 
		else if(response.status_code && response.status_code >= 100) {
		}
	}));
}

/**
 * A class that represents a switch as a menu item that toggles the status 
 * of that said switch when activated.
 */
const SwitchMenuItem = new Lang.Class({
	Name: 'SwitchMenuItem',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function(info, icon) {
		this.parent();
		this._info = info;

		this._icon = icon;
		this.actor.add_child(this._icon);

		this._label = new St.Label({ text: info.name });
		this.actor.add_child(this._label);
	},

	destroy: function() {
		this.parent();
	},

	activate: function(event) {
		// state == 0 => switch is turned off
		// state == 1 => switch is turned on
		if (this._info.state == 1) {
			this.turnOff();
		}
		else {
			this.turnOn();
		}

		this.parent(event);
	},

	success: function(response, thisArg) {
		// Inform the user of the success of the operation
		_showMessage(response.status);
		
		// Reinitialize the menu
		_telldus.redisplay(thisArg);
		
		// After 3 seconds, reinitialize again, important since the first 
		// call occasionally does not return correct status
		Mainloop.timeout_add_seconds(3, Lang.bind(this, function() {
			_telldus.redisplay(thisArg);
			return false;
		}));

	},

	turnOn: function() {
		let url = 'http://192.168.1.2/telldus/turnOn.php?id=' + this._info.id;
		performAction(url, this.success, _telldus);
	},

	turnOff: function() {
		let url = 'http://192.168.1.2/telldus/turnOff.php?id=' + this._info.id;
		performAction(url, this.success, _telldus);
	},
});

const TelldusMenu = new Lang.Class({
	Name: 'TelldusMenu.TelldusMenu',
	Extends: PanelMenu.Button,

	_init: function() {
		this.parent(0.0, _("Telldus"));

		let hbox = new St.BoxLayout({ style_class: 'telldus-status-menu-box' });
		let label = new St.Label({ 
				text: _("Telldus"),
				y_expand: true,
				y_align: Clutter.ActorAlign.CENTER 
			}
		);
		hbox.add_child(label);
		hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
		this.actor.add_actor(hbox);

		this.sections = this.loadSwitchItems(this);
	},
	
	createIcon: function(state) {
		if (state == 1) {
			return new St.Icon({
				gicon: Gio.icon_new_for_string(Me.path + '/icons/idea.svg'),
				icon_size: 24
			});
		}
		else {
			return new St.Icon({
				gicon: Gio.icon_new_for_string(Me.path + '/icons/cloud.svg'),
				icon_size: 24
			});
		}
	},
	
	handleDevices: function(response, thisArg) {
		let devices = response.device;
		if (devices && devices.length > 0) {
			_debug('devices count=' + devices.length);
			thisArg.items = devices.map(function(device) {
				return new SwitchMenuItem(device, thisArg.createIcon(device.state));
			});
		} 
		else {
			thisArg.items = [new SwitchMenuItem({name:'Empty', state: 0})];
		}
		
		thisArg.items.forEach(function(item) {
			thisArg.sections.addMenuItem(item);
		});
	},

	loadDevices: function() {
		let url = 'http://192.168.1.2/telldus/devices.php';
		performAction(url, this.handleDevices, this);
	},

	destroy: function() {
		this.parent();
	},
	
	destroySwitchItems: function(thisArg) {
		thisArg.items.forEach(function(item) {
			item.destroy();
		});
		thisArg.items = [];
	},
	
	loadSwitchItems: function(thisArg) {
		let section = new PopupMenu.PopupMenuSection();
		thisArg.loadDevices();
		thisArg.menu.addMenuItem(section);
		return section;
	},

	redisplay: function(thisArg) {
		thisArg.destroySwitchItems(thisArg);
		thisArg.sections.destroy();
		thisArg.sections = thisArg.loadSwitchItems(thisArg);
	},
});

function init() {
	_telldus = new TelldusMenu;
}

let _telldus;
function enable() {
	let pos = 1;
	if ('apps-menu' in Main.panel.statusArea)
		pos = 2;
	Main.panel.addToStatusArea('telldus-menu', _telldus, pos, 'left');
}

function disable() {
	// TODO handle disable correctly
}

let text;
function _showMessage(string) {
	text = new St.Label({ style_class: 'message-label', text: string });
	Main.uiGroup.add_actor(text);

	text.opacity = 255;
	let monitor = Main.layoutManager.primaryMonitor;
	text.set_position(Math.floor(monitor.width / 2 - text.width / 2),
			Math.floor(monitor.height / 2 - text.height / 2));
	Tweener.addTween(text,
			{ 
				opacity: 0,
				time: 5,
				transition: 'easeOutQuad',
				onComplete: _hideMessage 
			}
	);
}

function _hideMessage() {
	Main.uiGroup.remove_actor(text);
	text = null;
}


