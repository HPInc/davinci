#!/usr/bin/env sh

#
# © Copyright 2022 HP Development Company, L.P.
# SPDX-License-Identifier: MIT
#

# abort on errors
set -e

ssh-keyscan github.com >> ~/.ssh/known_hosts
git config --global user.email "circleci@hp.com"
git config --global user.name "Circle CI"

cd docs

# install & build
npm ci
npm run build

npx gh-pages --message "Update Docs [skip ci]" --dist ./build
