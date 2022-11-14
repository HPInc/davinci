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

# git checkout -f ./package-lock.json
git add ./build -f
git checkout gh-pages
git pull

# remove everything except the build folder
ls | grep -v ^build | xargs rm -r
cp -rf ./build/* ./

# commit & push the changes
git add .
git commit --allow-empty -am "Update Docs [skip ci]"
git push
