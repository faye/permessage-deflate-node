SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)

source_files := $(shell find src -name '*.js')
target_files := $(source_files:src/%.js=lib/%.js)

.PHONY: all clean test

all: $(target_files)

lib/%.js: src/%.js
	mkdir -p $(dir $@)
	babel $< --out-file $@ --source-maps true

clean:
	rm -rf lib

test: all
	jstest spec/runner.js
