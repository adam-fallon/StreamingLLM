#!/bin/bash

# Install deps
npm i --prefix ./api/ & npm i --prefix ./streaming-app/;

# Run
npm run start --prefix ./api/ & npm run start --prefix ./streaming-app/;
