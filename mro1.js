import math from 'mathjs';
import fs from 'fs';
import _ from 'lodash';
import chalk from 'chalk';
import now from 'performance-now';

// Logging
const log = console.log;
const info = text => log(chalk.bold.blue(text))
const result = text => log('Result: '  + chalk.green(text) + '\n')


// Data
const radius = 10;
const point  = {
  min : 0,
  max : 2 * radius,
};

const pointsNumber = 1000;

const dimension = {
  initial : 2,
  max     : 18
}

const PRECISION = 5;

// Functions
const euclidianDistance = (args) => {
  const differences = _(args)
    .map(a => math.square(radius - a))
    .reduce((sum, n) => sum + n, 0)

  return math.sqrt(differences)
}

for(let i = dimension.initial; i < dimension.max; i++) {
  let inside = 0;
  const pointsForDimension = pointsNumber * (math.pow(2, (i-1)));
  info(`Dimension: ${i} Points: ${pointsForDimension}`)

  for (let j = 0; j < pointsForDimension; j++) {
    if(euclidianDistance(math.bignumber(math.random([i], point.min, point.max))) < radius) {
      inside++
    }
  }
  result(((inside/pointsForDimension) * 100).toFixed(PRECISION) + '%')
}
