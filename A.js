import math from 'mathjs';
import fs from 'fs';
import _ from 'lodash';
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

const resultsFile = fs.createWriteStream('./resultsA.csv');

// Data
const radius          = 10;
const testsNumber     = 100;
const pointsNumber    = 1000;
const dimension       = { initial : 1, max : 10 }
const point           = { min : 0, max : 2 * radius };
const resultPrecision = 3;

// Plot data

const traces  = []

const layout = {
  autosize : true,
  title    : 'Klątwa wymiarowości - A',
  xaxis    : {
    title    : 'Liczba wymiarów',
    showgrid : false,
    zeroline : false
  },
  yaxis    : {
    title    : 'Procent punktów zawartych w hipersferze [%]',
    showline : false
  }
};

resultsFile.write(`"Promień: ${radius}", "Liczba testów : ${testsNumber}"\n`)

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

  const dimensionInfo          = `Wymiar: ${dimension}`;
  const pointsForDimensionInfo = `Liczba punktów: ${pointsForDimension}`;

  info(`${dimensionInfo} | ${pointsForDimensionInfo}`)
  resultsFile.write(`${dimensionInfo} | ${pointsForDimensionInfo},`)

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

  const standardDeviation = math.std(fillData).toPrecision(resultPrecision);

  resultsFile.write('Odchylenie standardowe,' + standardDeviation + ',')
  resultsFile.write('Rezultat:,' + _.map(fillData, fill => `${fill}`).toString() + '\n')

  const trace = {
    x       : dimension,
    y       : math.mean(fillData).toPrecision(resultPrecision),
    error_y : {
      type      : 'constant',
      value     : standardDeviation,
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
    'filename'       : 'curseOfDimension',
    'fileopt'        : 'overwrite',
    'layout'         : layout,
    'world_readable' : true
  }

  plotly.plot(traces, graphOptions, function (err, msg) {
    console.log(msg);
  });

}, totalTimeMsg)
