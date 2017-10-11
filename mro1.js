import math from 'mathjs';
import fs from 'fs';
import _ from 'lodash';
import chalk from 'chalk';
import now from 'performance-now';

// Logging
const log       = console.log;
const padding   = 18;
const info      = text => log(chalk.bold.blue(text))
const result    = text => log(chalk.green('Result: '.padding(padding / 2) + text))
const time      = text => log(chalk.redBright('Execution time: '.padding(padding) + text + 'ms\n'))
const totalTime = text => log(chalk.red('Total execution time: '.padding(padding) + text + 'ms\n'))

// Utils
String.prototype.padding = function (n, c) {
  let val = this.valueOf();
  if (Math.abs(n) <= val.length) {
    return val;
  }

  let m   = Math.max((Math.abs(n) - this.length) || 0, 0);
  let pad = new Array(m + 1).join(String(c || ' ').charAt(0));

  return (n < 0) ? pad + val : val + pad;
};

const totalTimeMsg = '###total###';

const measurePerformance = (fun, ...args) => {
  const start        = now()
  const result       = fun(...args)
  const end          = now()
  const measuredTime = (end - start)

  args[0] !== totalTimeMsg ? time(measuredTime.toPrecision(5)) : totalTime(measuredTime.toPrecision(5))

  return result;
}

const resultsFile = fs.createWriteStream('./results.csv');

// Data
const radius          = 10;
const testsNumber     = 200;
const pointsNumber    = 1000;
const dimension       = { initial : 2, max : 13 }
const point           = { min : 0, max : 2 * radius };
const resultPrecision = 3;

resultsFile.write(`"Radius: ${radius}", "Tests : ${testsNumber}"`)

// Functions
const euclidianDistance = (args) => {
  let differences = 0;

  for (let i = 0; i < args.length; i++) {
    differences += math.square(radius - args[i])
  }

  return math.sqrt(differences)
}

const calculateCurseOfDimension = (dimension, testsNumber) => {
  const pointsForDimension = pointsNumber * (math.pow(2, (dimension - 1)));
  const fillData           = [];

  const dimensionInfo          = `Dimension: ${dimension}`;
  const pointsForDimensionInfo = `Points: ${pointsForDimension}`;

  info(`${dimensionInfo} | ${pointsForDimensionInfo}`)
  resultsFile.write(`${dimensionInfo.replace(':', ',')}, ${pointsForDimensionInfo.replace(':', ',')},`)

  for (let i = 0; i < testsNumber; i++) {
    let inside = 0;

    for (let j = 0; j < pointsForDimension; j++) {
      if (euclidianDistance(math.random([dimension], point.min, point.max)) < radius) {
        inside++
      }
    }

    const fill = ((inside / pointsForDimension) * 100).toPrecision(resultPrecision);
    fillData.push(fill)

    result(fill + '%')
  }

  resultsFile.write('Results,' + _.map(fillData, fill => `${fill}`).toString())
  resultsFile.write(',StD,' + math.std(fillData).toPrecision(resultPrecision) + '\n')
}

// Execution
measurePerformance(() => {
  for (let i = dimension.initial; i < dimension.max; i++) {
    measurePerformance(calculateCurseOfDimension, i, testsNumber)
  }
}, totalTimeMsg)
