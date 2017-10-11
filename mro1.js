import math from 'mathjs';
import fs from 'fs';
import _ from 'lodash';
import chalk from 'chalk';
import now from 'performance-now';
import moment from 'moment';

// Logging
const log = console.log;
const padding = 18;
const info = text => log(chalk.bold.blue(text))
const result = text => log(chalk.green('Result: '.padding(padding) + text))
const time = text => log(chalk.red('Execution time: '.padding(padding) + text + 'ms\n'))
const totalTime = text => log(chalk.redBright('Total execution time: '.padding(padding) + text + 'ms\n'))

// Utils
String.prototype.padding = function(n, c) {
  let val = this.valueOf();
  if ( Math.abs(n) <= val.length ) {
    return val;
  }

  let m = Math.max((Math.abs(n) - this.length) || 0, 0);
  let pad = new Array(m + 1).join(String(c || ' ').charAt(0));

  return (n < 0) ? pad + val : val + pad;
};

const totalTimeMsg = '###total###';

const measurePerformance = (fun, ...args) => {
  const start = now()
  const result = fun(args)
  const end = now()
  const measuredTime = (end-start)

  args[0] !== totalTimeMsg ? time(measuredTime.toPrecision(5)) : totalTime(measuredTime.toPrecision(5))

  return result;
}

// Data
const radius = 10;
const point  = {
  min : 0,
  max : 2 * radius,
};

const pointsNumber = 1000;

const dimension = {
  initial : 2,
  max     : 13
}

const resultPrecision = 3;

// Functions
const euclidianDistance = (args) => {
  let differences = 0;

  for(let i = 0; i < args.length; i++) {
    differences += math.square(radius - args[i])
  }

  return math.sqrt(differences)
}

const calculateCurseOfDimension = dimension => {
  let inside = 0;
  const pointsForDimension = pointsNumber * (math.pow(2, (dimension-1)));
  info(`Dimension: ${dimension} | Points: ${pointsForDimension}`)

  for (let j = 0; j < pointsForDimension; j++) {
    if(euclidianDistance(math.random([dimension], point.min, point.max)) < radius) {
      inside++
    }
  }
  result(((inside/pointsForDimension) * 100).toPrecision(resultPrecision) + '%')
}
measurePerformance( () => {
  for(let i = dimension.initial; i < dimension.max; i++) {
    measurePerformance(calculateCurseOfDimension, i)
  }
}, totalTimeMsg)
