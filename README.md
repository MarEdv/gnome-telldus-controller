# Telldus GNOME Shell Extension

## About
This GNOME Shell Extension controlls devices via [Telldus Live](http://live.telldus.com).

Tested only with GNOME 3.20 on [Antergos Linux](https://antergos.com/).

The REST endpoints are used that works as proxies between this extension and Telldus' REST endpoints
because of the authorization protocol used (OAuth1.0). The intention is to make this extension work
without the proxies, sometime in the future. The proxies are implemented in PHP and will be on GitHub
any day now.

The code is heavily inspired by the example extension at 
[Step by step tutorial to create extensions](https://wiki.gnome.org/Projects/GnomeShell/Extensions/StepByStepTutorial#myFirstExtension) and the 
[Places Menu extension](https://git.gnome.org/browse/gnome-shell-extensions/tree/extensions/places-menu).

## Configuration

At the moment, there is no configuration needed.
