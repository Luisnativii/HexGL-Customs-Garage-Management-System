HexGL
=========

Source code of [HexGL](http://hexgl.bkcore.com), the futuristic HTML5 racing game by [Thibaut Despoulain](http://bkcore.com)

## Branches
  * **[Master](https://github.com/BKcore/HexGL)** - Public release (stable).

## License

Unless specified in the file, HexGL's code and resources are now licensed under the *MIT License*.

## Installation

	cd ~/
	git clone git://github.com/BKcore/HexGL.git
	cd HexGL
	python -m SimpleHTTPServer
	chromium index.html

To use full size textures, swap the two textures/ and textures.full/ directories.

## Documentación de la Versión Customs (Garage)

Esta versión de HexGL incorpora un completo sistema de personalización de la nave en 3D. Tienes a tu disposición dos documentos para conocerlo a fondo:

* **[Manual de Usuario](manual-usuario.md)**: Guía paso a paso en español con explicaciones y capturas de pantalla sobre cómo usar y guardar personalizaciones en el Garage, controles de juego y configuración.
* **[Documentación del Sistema de Garage](documentation_garage.md)**: Documento técnico exhaustivo que explica la arquitectura de software (Three.js r53), la definición de los componentes core, el flujo de datos persistidos en localStorage, los shaders/presets del motor gráfico y el plan detallado de pruebas unitarias y E2E (Jest y Playwright).

## Note

The development of HexGL is in a hiatus for now until I find some time and interest to work on it again.
That said, feel free to post issues, patches, or anything to make the game better and I'll gladly review and merge them.
