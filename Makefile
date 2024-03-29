\JS_SOURCES =
JS_SOURCES += bone.js
JS_SOURCES += frontend.js
JS_SOURCES += glm.js
JS_SOURCES += gltf.js
JS_SOURCES += hierarchy.js
JS_SOURCES += model.js
JS_SOURCES += sample_models.js
JS_SOURCES += sample_objects.js
JS_SOURCES += shader.js
JS_SOURCES += texture.js
JS_SOURCES += transformation.js
# JS_SOURCES += viewer.js

help:
	@echo "Help!"
	@echo "httpd  - run server for javascript use/testing"
	@echo "mypy   - do strict type checking (there will be some errors)"
	@echo "py     - run python GUI"
	@echo "py_all - run python unittest"

help_install:
	@echo "Help install"
	# @echo "pip3 install pyglm PyOpenGL Pillow glfw"
	@echo "pip3 install PyOpenGL Pillow glfw"

httpd:
	python3 -m http.server

mypy:
	MYPYPATH=${CURDIR}/mypy_stubs mypy --config-file mypy.cfg --strict -m test
mypy2:
	MYPYPATH=${CURDIR}/mypy_stubs mypy --config-file mypy.cfg --strict -m test_all
mypy3:
	MYPYPATH=${CURDIR}/mypy_stubs mypy --config-file mypy.cfg --strict python/asteroids.py
mypy4:
	MYPYPATH=${CURDIR}/mypy_stubs mypy --config-file mypy.cfg --strict python/viewer.py

jslib:
	cat ${JS_SOURCES:%.js=gjsgl/%.js} > gjsgl.js

viewer:
	PYTHONPATH=${CURDIR}:${PYTHONPATH} ./python/viewer.py

asteroids:
	PYTHONPATH=${CURDIR}:${PYTHONPATH} ./python/asteroids.py

py_all:
	python3 -m test_all

