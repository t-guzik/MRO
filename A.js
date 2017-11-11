import math from 'mathjs';
import fs from 'fs';
import _ from 'lodash';
import chalk from 'chalk';
import now from 'performance-now';
import cov from 'compute-covariance'
import numeric from 'numeric'

const plotly = require('plotly')()

// Logging
const log       = console.log;
const padding   = 18;
const info      = text => log(chalk.bold.blue(text))
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

// Data
const radius       = 5;
const pointsNumber = 5000;
const dimension    = 13
const point        = { min : 0, max : 2 * radius };

const COLORS = {
  RED   : '#ff5166',
  GREEN : '#5cff96',
  BLUE  : '#6794ff'
}

// Functions
const euclidianDistanceFromCenter = (args) => {
  let differences = 0;

  for (let i = 0; i < args.length; i++) {
    differences += math.square(radius - args[i])
  }

  return math.sqrt(differences)
}

const getTwoMax = array => {
  const first = array.indexOf(_.max(array));
  const newArray = array.slice();
  newArray[first] = -Infinity;
  const second = newArray.indexOf(_.max(newArray));

  return [first, second]
}

const normalize = array => {
  const mean = math.mean(array)
  const std = math.std(array)

  return _.map(array, x => _.map(x, single => (single-mean)/std))
}

const calculateCurseOfDimension = (dimension) => {
  const pointsForDimension = pointsNumber + (1000 * (dimension - 3));
  const pointsForDimensionInfo = `Liczba punktów: ${pointsForDimension}`;

  info(`${pointsForDimensionInfo}`)

  let sample    = []
  const classes = {
    INSIDE  : [],
    OUTSIDE : [],
    CORNERS : []
  }

  for (let j = 0; j < pointsForDimension; j++) {
    const generated = math.random([dimension], point.min, point.max);

    const distanceFromcenter = euclidianDistanceFromCenter(generated)

    if (distanceFromcenter < radius) {
      classes.INSIDE.push(j)
    } else {
      if(distanceFromcenter > ((point.max * math.sqrt(2))/2 - 1)) {
        classes.CORNERS.push(j)
      } else {
        classes.OUTSIDE.push(j)
      }
    }

    sample.push(generated)
  }

  sample = normalize(sample)

  const separatedVariables = []

  for (let i = 0; i < sample[0].length; i++) {
    separatedVariables.push(_.map(sample, x => x[i]))
  }

  const covariance = cov(separatedVariables)
  const eigen = numeric.eig(covariance)

  let eigenVector = eigen.E.x
  let eigenValues = eigen.lambda.x

  const biggestEigenValues = getTwoMax(eigenValues)

  eigenVector = [eigenVector[biggestEigenValues[0]].filter((x, i) => biggestEigenValues.indexOf(i) !== -1), eigenVector[biggestEigenValues[1]].filter((x, i) => biggestEigenValues.indexOf(i) !== -1)]

  sample = _.map(sample, (x, i) => {
    return x.filter((y, j) => biggestEigenValues.indexOf(j) !== -1)
  })

  const reorientedSample = math.multiply(math.matrix(sample), math.matrix(eigenVector))._data

  const separatedVariablesReoriented = []

  for (let i = 0; i < reorientedSample[0].length; i++) {
    separatedVariablesReoriented.push(_.map(reorientedSample, x => x[i]))
  }

  const traceInside = {
    x      : separatedVariablesReoriented[0].filter((x, i) => classes.INSIDE.indexOf(i) !== -1),
    y      : separatedVariablesReoriented[1].filter((x, i) => classes.INSIDE.indexOf(i) !== -1),
    mode   : 'markers',
    name : 'Wewnątrz hipersfery',
    marker : {
      size    : 5,
      line    : {
        color : COLORS.GREEN,
        width : 0.5
      },
    },
    type   : 'scatter'
  };

  const traceOutside = {
    x      : separatedVariablesReoriented[0].filter((x, i) => classes.OUTSIDE.indexOf(i) !== -1),
    y      : separatedVariablesReoriented[1].filter((x, i) => classes.OUTSIDE.indexOf(i) !== -1),
    name : 'Na zewnątrz hipersfery',
    mode   : 'markers',
    marker : {
      size    : 3,
      line    : {
        color : COLORS.BLUE,
        width : 0.5
      },
    },
    type   : 'scatter'
  };

  const traceCorners = {
    x      : separatedVariablesReoriented[0].filter((x, i) => classes.CORNERS.indexOf(i) !== -1),
    y      : separatedVariablesReoriented[1].filter((x, i) => classes.CORNERS.indexOf(i) !== -1),
    name : 'W narożnikach hipersześcianu',
    mode   : 'markers',
    marker : {
      size    : 3,
      line    : {
        color : COLORS.RED,
        width : 0.5
      },
    },
    type   : 'scatter'
  };

  // const line = {
  //   x      : [eigenValues[biggestEigenValues[0]] * eigenVector[0][0], eigenValues[biggestEigenValues[0]] * eigenVector[1][0]],
  //   y      : [eigenValues[biggestEigenValues[0]] * eigenVector[0][1], eigenValues[biggestEigenValues[0]] * eigenVector[1][1]],
  //   name   : 'Princincipal components',
  //   marker : {
  //     size : 5,
  //     line : {
  //       color : '#000',
  //       width : 0.5
  //     }
  //   },
  //   type   : 'line'
  // };

  info(`Redukcja z ${dimension} wymiarów`)
  info(`Wewnątrz hipersfery: ${((traceInside.x.length/separatedVariablesReoriented[0].length)*100).toPrecision(3)}%`)
  info(`Na zewnątrz hipersfery: ${((traceOutside.x.length/separatedVariablesReoriented[0].length)*100).toPrecision(3)}%`)
  info(`W narożnikach hipersześcianu: ${((traceCorners.x.length/separatedVariablesReoriented[0].length)*100).toPrecision(3)}%`)

  const data = [traceInside, traceOutside, traceCorners];

  const layout = {
    autosize : true,
    title    : `PCA - redukcja z ${dimension} wymiarów do 2 wymiarów`,
    xaxis    : {
      title    : 'x',
      showgrid : false,
      zeroline : false
    },
    yaxis    : {
      title    : 'y',
      showline : false
    }
  };

  const graphOptions = {
    filename : `PCA 2d from ${dimension} dimensions`,
    layout : layout,
    fileopt : 'overwrite'
  };

  plotly.plot(data, graphOptions, function (err, msg) {
    err ? console.log(err) : console.log(msg);
  });
}

// Execution
measurePerformance(() => {
    calculateCurseOfDimension(dimension)
}, totalTimeMsg)
