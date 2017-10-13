import math from 'mathjs';
import fs from 'fs';
import chalk from 'chalk';
import now from 'performance-now';
const plotly = require('plotly')()

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

const getRandomColor = () => {
  let letters = '0123456789ABCDEF';
  let color   = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const totalTimeMsg = '###total###';

const measurePerformance = (fun, ...args) => {
  const start        = now()
  const result       = fun(...args)
  const end          = now()
  const measuredTime = (end - start)

  args[0] !== totalTimeMsg ? time(measuredTime.toPrecision(5)) : totalTime(measuredTime.toPrecision(5))

  return result;
}

const resultsFile = fs.createWriteStream('./resultsB.csv');

// Data
const radius          = 1;
const testsNumber     = 10;
const pointsNumber    = 100;
const dimension       = { initial : 1, max : 25 }
const point           = { min : 0, max : 1 };
const resultPrecision = 3;

// Plot data

const traces = []

const layout = {
  autosize : true,
  title    : 'Klątwa wymiarowości - B',
  xaxis    : {
    title    : 'Liczba wymiarów',
    showgrid : false,
    zeroline : false
  },
  yaxis    : {
    title    : 'Stosunek odchylenia standardowego do średniej arytmetycznej',
    showline : false
  }
};

resultsFile.write(`"Promień: ${radius}", "Liczba testów : ${testsNumber}"\n`)

// Functions
const euclidianDistance = (args1, args2) => {
  if (args1.length !== args2.length) {
    throw new Error;
  }
  let differences = 0;

  for (let i = 0; i < args1.length; i++) {
    differences += math.square(args1[i] - args2[i])
  }

  return math.sqrt(differences)
}

const calculateCurseOfDimension = (dimension, testsNumber) => {
  const pointsForDimension = pointsNumber + (50 * (dimension-1));

  const dimensionInfo          = `Wymiar: ${dimension}`;
  const pointsForDimensionInfo = `Liczba punktów: ${pointsForDimension}`;
  const results = []

  info(`${dimensionInfo} | ${pointsForDimensionInfo}`)
  resultsFile.write(`${dimensionInfo} | ${pointsForDimensionInfo},\n`)

  for (let i = 0; i < testsNumber; i++) {
    let points    = [];
    let distances = [];

    for (let j = 0; j < pointsForDimension; j++) {
      points.push(math.random([dimension], point.min, point.max))
    }



    for (let j = 0; j < points.length; j++) {
      for (let k = j+1; k < points.length; k++) {
        distances.push(euclidianDistance(points[j], points[k]))
      }
    }

    let standardDeviation = math.std(distances)
    let mean = math.mean(distances)
    let devideResult = (standardDeviation/mean).toPrecision(resultPrecision)

    resultsFile.write('Odchylenie standardowe,' + standardDeviation.toPrecision(resultPrecision) + ',')
    resultsFile.write('Średnia arytmetyczna,' + mean.toPrecision(resultPrecision) + ',')
    resultsFile.write('Rezultat,' + devideResult + '\n')
    results.push(devideResult)
    result(devideResult)
  }


  const trace = {
    x       : dimension,
    y       : math.mean(results).toPrecision(resultPrecision),
    error_y : {
      type      : 'constant',
      value     : math.std(results).toPrecision(resultPrecision),
      color     : '#555',
      thickness : 1,
      width     : 2,
      opacity   : 1
    },
    mode    : 'markers',
    name    : `${dimensionInfo} | ${pointsForDimensionInfo}`,
    marker  : {
      color : getRandomColor(),
      size  : 4
    },
    type    : 'scatter'
  };

  traces.push(trace)
}

// Execution
measurePerformance(() => {
  for (let i = dimension.initial; i <= dimension.max; i++) {
    measurePerformance(calculateCurseOfDimension, i, testsNumber)
  }

  const graphOptions = {
    'filename'       : 'curseOfDimension2',
    'fileopt'        : 'overwrite',
    'layout'         : layout,
    'world_readable' : true
  }

  plotly.plot(traces, graphOptions, function (err, msg) {
    console.log(msg);
  });

}, totalTimeMsg)
