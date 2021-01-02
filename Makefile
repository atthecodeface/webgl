help:
	@echo "Help!"

httpd:
	python3 -m http.server

mypy:
	MYPYPATH=${CURDIR}/mypy_stubs mypy --strict -m test

py:
	python3 -m test

py_all:
	python3 -m test_all

