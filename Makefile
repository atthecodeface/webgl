help:
	@echo "Help!"
	@echo "httpd  - run server for javascript use/testing"
	@echo "mypy   - do strict type checking (there will be some errors)"
	@echo "py     - run python GUI"
	@echo "py_all - run python unittest"

httpd:
	python3 -m http.server

mypy:
	MYPYPATH=${CURDIR}/mypy_stubs mypy --strict -m test

py:
	python3 -m test

py_all:
	python3 -m test_all

