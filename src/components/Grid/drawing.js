import * as d3 from 'd3';
import 'd3-selection-multi';
import _ from 'lodash';
import { distanceBetweenPoints, unitPerpVector, unitVector, edgeDirection } from './../../store/modules/geometry/helpers';

export function drawWindow() {
  let
    xScale = _.identity,
    yScale = _.identity,
    highlight = false;
  function chart(selection) {
    selection.exit().remove();
    const windowE = selection.enter().append('g').attr('class', 'window');
    windowE.append('line');
    windowE.append('circle');
    const windw = selection.merge(windowE);
    windw.select('line')
      .attr('x1', d => xScale(d.start.x))
      .attr('y1', d => yScale(d.start.y))
      .attr('x2', d => xScale(d.end.x))
      .attr('y2', d => yScale(d.end.y))
      .attr('marker-end', `url(#perp-linecap${highlight ? '-highlight' : ''})`)
      .attr('marker-start', `url(#perp-linecap${highlight ? '-highlight' : ''})`);
    windw.select('circle')
      .attr('cx', d => xScale(d.center.x))
      .attr('cy', d => yScale(d.center.y))
      .attr('r', '2');
  }

  chart.xScale = function (_) {
    if (!arguments.length) return xScale;
    xScale = _;
    return chart;
  };
  chart.yScale = function (_) {
    if (!arguments.length) return yScale;
    yScale = _;
    return chart;
  };
  chart.highlight = function(_) {
    if (!arguments.length) return highlight;
    highlight = _;
    return chart;
  };

  return chart;
}

function distanceMeasure() {
  let
    xScale = _.identity,
    yScale = _.identity,
    lineOffset = 20,
    labelPosition = 1;
  function chart(selection) {
    selection.exit().remove();
    const measureE = selection.enter().append('g')
      .attr('class', 'distance-measure')
      .attr('transform', (d) => {
        const { dx, dy } = unitPerpVector(d.start, d.end),
          offX = lineOffset * dx,
          offY = lineOffset * dy;
        return `translate(${offX}, ${offY})`;
      });
    measureE.append('line');
    measureE.append('text');
    measureE.append('path').attr('class', 'start');
    measureE.append('path').attr('class', 'end');

    const measure = selection.merge(measureE);

    measure.select('text')
      .attr('x', d => (1 - labelPosition) * xScale(d.start.x) + labelPosition * xScale(d.end.x))
      .attr('y', d => (1 - labelPosition) * yScale(d.start.y) + labelPosition * yScale(d.end.y))
      .attr('dominant-baseline', 'text-before-edge')
      .attrs((d) => {
        const
          { dx, dy } = unitPerpVector(d.start, d.end),
          offset = 4;
        return {
          dx: dx * offset,
          dy: dy * offset,
        };
      })
      .text((d) => {
        const
          distance = distanceBetweenPoints(d.start, d.end),
          roundDistance = Math.round(distance * 100) / 100;
        return `${roundDistance}`;
      });
    measure.select('line')
      .attrs((d) => {
        const { dx, dy } = unitVector(d.start, d.end),
          offset = 11.5,
          offX = dx * offset,
          offY = dy * offset;

        return {
          x1: xScale(d.start.x) + offX,
          y1: yScale(d.start.y) - offY,
          x2: xScale(d.end.x) - offX,
          y2: yScale(d.end.y) + offY,
        };
      });
    const
      arrowHead = 'M -6,-2 V 2 L0,0 Z',
      rotate = (d) => {
        // did ya ever... did ya ever program by guess and check?
        const
          angle = (edgeDirection(d) * 180) / Math.PI,
          adjust = d.start.x === d.end.x ?
                    (d.start.y > d.end.y ? 0 : 180) :
                    (d.start.x > d.end.x ? 0 : 180);

        return adjust - angle;
      };

    measure.select('path.start')
      .attr('transform',
        d => `translate(${xScale(d.start.x)}, ${yScale(d.start.y)}) scale(2) rotate(${rotate(d)})`)
      .attr('d', arrowHead);

    measure.select('path.end')
      .attr('transform',
        d => `translate(${xScale(d.end.x)}, ${yScale(d.end.y)}) scale(2) rotate(${180 + rotate(d)})`)
      .attr('d', arrowHead);
  }
  chart.xScale = function (_) {
    if (!arguments.length) return xScale;
    xScale = _;
    return chart;
  };
  chart.yScale = function (_) {
    if (!arguments.length) return yScale;
    yScale = _;
    return chart;
  };
  chart.lineOffset = function(_) {
    if (!arguments.length) return lineOffset;
    lineOffset = _;
    return chart;
  };
  chart.labelPosition = function(_) {
    if (!arguments.length) return labelPosition;
    if (_ < 0 || _ > 1) {
      console.warn(`Expected labelPosition to be in [0, 1] (got ${_})`);
    }
    labelPosition = _;
    return chart;
  };

  return chart;
}

export function drawWindowGuideline() {
  let
    xScale = _.identity,
    yScale = _.identity;
  const drawMeasure = distanceMeasure();
  function chart(selection) {
    drawMeasure.xScale(xScale).yScale(yScale);
    selection.exit().remove();
    selection
      .merge(selection.enter().append('g').classed('window-guideline', true))
      .selectAll('.distance-measure')
      .data(
        // there must be a better way to do this...
        selection.merge(selection.enter()).data()
        .map(d => ({ start: d.edge_start, end: d.center }))
      )
      .call(drawMeasure);
  }

  chart.xScale = function (_) {
    if (!arguments.length) return xScale;
    xScale = _;
    return chart;
  };
  chart.yScale = function (_) {
    if (!arguments.length) return yScale;
    yScale = _;
    return chart;
  };
  return chart;
}


export function drawDaylightingControl() {
  let
    xScale = _.identity,
    yScale = _.identity;

  function chart(selection) {
    selection.exit().remove();
    const dcE = selection.enter().append('g').attr('class', 'daylighting-control');
    dcE.append('circle').attr('class', 'bg');
    dcE.append('path').attr('class', 'quadrants');
    const dc = selection.merge(dcE);
    dc.select('circle.bg')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 10);
    dc.select('path.quadrants')
      .attr('d', (d) => {
        const x = xScale(d.x), y = yScale(d.y), r = 10;
        return `M${x} ${y} L${x + r} ${y} A ${r} ${r} 0 0 1 ${x} ${y + r} L ${x} ${y - r} A ${r} ${r} 0 0 0 ${x - r} ${y} Z`;
      });
  }

  chart.xScale = function (_) {
    if (!arguments.length) return xScale;
    xScale = _;
    return chart;
  };
  chart.yScale = function (_) {
    if (!arguments.length) return yScale;
    yScale = _;
    return chart;
  };
  return chart;
}

export function drawDaylightingControlGuideline() {
  let
    xScale = _.identity,
    yScale = _.identity;
  const drawMeasure = distanceMeasure()
    .lineOffset(0)
    .labelPosition(0.5);
  function chart(selection) {
    drawMeasure.xScale(xScale).yScale(yScale);
    selection.exit().remove();
    const guideE = selection.enter().append('g')
      .classed('daylighting-control-guideline', true);

    const data = _.flatMap(
      selection.merge(selection.enter()).data(),
      (d) => {
        const
          dir = unitVector(d.nearestEdge.v1, d.nearestEdge.v2),
          v = { start: d.loc, end: d.nearestEdge.proj },
          dotProduct = ((v.end.x - v.start.x) * dir.dx) + ((v.end.y - v.start.y) * dir.dy),
          parallel = {
            start: v.start,
            end: {
              x: v.start.x + dotProduct * dir.dx,
              y: v.start.y + dotProduct * dir.dy,
            },
          },
          perp = {
            start: parallel.end,
            end: v.end,
          };
        return [v, perp, parallel].filter(
          ({ start, end }) => distanceBetweenPoints(start, end) > 0.01,
        );
      });
    const guide = selection.merge(guideE);
    guide
      .selectAll('.distance-measure')
      .data(data)
      .call(drawMeasure);
  }

  chart.xScale = function (_) {
    if (!arguments.length) return xScale;
    xScale = _;
    return chart;
  };
  chart.yScale = function (_) {
    if (!arguments.length) return yScale;
    yScale = _;
    return chart;
  };
  return chart;
}

const RESIZE_CURSORS = [
  { vec: { x: 1, y: 0 }, cursor: 'ew-resize' },
  { vec: { x: -1, y: 0 }, cursor: 'ew-resize' },
  { vec: { x: 0, y: 1 }, cursor: 'ns-resize' },
  { vec: { x: 0, y: -1 }, cursor: 'ns-resize' },
  { vec: { x: 1/Math.sqrt(2), y: 1/Math.sqrt(2) }, cursor: 'nwse-resize' },
  { vec: { x: -1/Math.sqrt(2), y: -1/Math.sqrt(2) }, cursor: 'nwse-resize' },
  { vec: { x: 1/Math.sqrt(2), y: -1/Math.sqrt(2) }, cursor: 'nesw-resize' },
  { vec: { x: -1/Math.sqrt(2), y: 1/Math.sqrt(2) }, cursor: 'nesw-resize' },
]
function bestResizeCursor(xOff, yOff, rotation) {
  const
    norm = Math.sqrt(xOff * xOff + yOff * yOff),
    x = xOff / norm,
    y = yOff / norm,
    a = Math.PI * rotation / 180,
    pt = {
      x: x * Math.cos(a) - y * Math.sin(a),
      y: x * Math.sin(a) + y * Math.cos(a),
    };

  return _.minBy(RESIZE_CURSORS, c => distanceBetweenPoints(c.vec, pt)).cursor;
}

export function drawImage() {
  let
    xScale = _.identity,
    yScale = _.identity,
    updateImage = (data) => window.application.$store.dispatch('models/updateImageWithData', data);
  function chart(selection) {
    const pxPerRWU = (xScale(100) - xScale(0)) / 100;

    let startX, startY, currX, currY;
    const
      offset = (d) => {
        const
          x = (currX - startX),
          y = (currY - startY),
          invR = -1 * d.r * Math.PI / 180;
        return {
          dx: x * Math.cos(invR) - y * Math.sin(invR),
          dy: x * Math.sin(invR) + y * Math.cos(invR),
        };
      },
      moveable = d3.drag()
      .on('start.move', function() {
        d3.event.sourceEvent.stopPropagation(); // don't zoom when I'm draggin' an image!
        [startX, startY] = d3.mouse(document.querySelector('#grid svg'));
      })
      .on('drag.move', function(d) {
        [currX, currY] = d3.mouse(document.querySelector('#grid svg'));
        const { dx, dy } = offset(d);
        d3.select(this)
          .attr('transform', `translate(${dx}, ${dy})`);
      })
      .on('end.move', function(d) {
        const { dx, dy } = offset(d);
        updateImage({
          image: d,
          x: d.x + (currX - startX) / pxPerRWU,
          y: d.y - (currY - startY) / pxPerRWU,
        });
      });

    const
      scalingFactor = (d) => {
        const
          pxOrigin = { x: xScale(d.x), y: yScale(d.y) },
          distCurrToOrigin = distanceBetweenPoints(
            { x: currX, y: currY }, pxOrigin),
          distStartToOrigin = distanceBetweenPoints(
            { x: startX, y: startY }, pxOrigin),
          scale = distCurrToOrigin / distStartToOrigin;
        return scale;
      },
      resizeable = d3.drag()
        .on('start.resize', function() {
          d3.event.sourceEvent.stopPropagation();
          [startX, startY] = d3.mouse(document.querySelector('#grid svg'));
        })
        .on('drag.resize', function(d) {
          [currX, currY] = d3.mouse(document.querySelector('#grid svg'));
          d3.select(this.parentNode.parentNode)
            .attr('transform', `scale(${scalingFactor(d)})`);
        })
        .on('end.resize', function(d) {
          const scale = scalingFactor(d);
          updateImage({
            image: d,
            width: d.width * scale,
            height: d.height * scale,
          });
        });

    const
      rotationAngle = (d) => {
        const
          pxOrigin = { x: xScale(d.x), y: yScale(d.y) },
          startAngle = edgeDirection({ start: pxOrigin, end: { x: startX, y: startY }}),
          currAngle = edgeDirection({ start: pxOrigin, end: { x: currX, y: currY }});
        return ((180 * (currAngle - startAngle) / Math.PI)
          + 180 * (xScale(d.x) > currX !== xScale(d.x) > startX)
        );
      },
      rotateable = d3.drag()
        .on('start.rotate', function() {
          d3.event.sourceEvent.stopPropagation();
          [startX, startY] = d3.mouse(document.querySelector('#grid svg'));
        })
        .on('drag.rotate', function(d) {
          [currX, currY] = d3.mouse(document.querySelector('#grid svg'));
          d3.select(this.parentNode.parentNode)
            .attr('transform', `rotate(${rotationAngle(d)})`);
        })
        .on('end.rotate', function(d) {
          const rotation = rotationAngle(d);
          updateImage({
            image: d,
            r: rotation + d.r,
          });
        });

    selection.exit().remove();
    const imageGroupE = selection.enter().append('g').attr('class', 'image-group');
    const moveableWrapperE = imageGroupE.append('g').attr('class', 'moveable-wrapper');
    moveableWrapperE.append('image');
    const controlsE = moveableWrapperE.append('g').attr('class', 'controls');
    controlsE.append('line').attr('class', 'rotation-to-center');
    controlsE.append('circle').attr('class', 'center');
    controlsE.append('circle').attr('class', 'rotation-handle');
    ['tl', 'tr', 'bl', 'br']
      .forEach(corner => controlsE.append('circle').attr('class', `corner ${corner}`));

    const imageGroup = selection.merge(imageGroupE);

    imageGroup
      .attr('transform', d => `translate(${xScale(d.x)}, ${yScale(d.y)}) rotate(${d.r})`);

    imageGroup.select('.moveable-wrapper')
      .attr('transform', 'translate(0,0)')
      .call(moveable);

    imageGroup.select('image')
      .attr('x', d => -1 * pxPerRWU * d.width / 2)
      .attr('y', d => -1 * pxPerRWU * d.height / 2)
      .attr('width', d => pxPerRWU * d.width)
      .attr('height', d => pxPerRWU * d.height)
      .attr('xlink:href', d => d.src);

    imageGroup.select('.controls .center')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 3);
    imageGroup.select('.controls .rotation-handle')
      .attr('cx', 0)
      .attr('cy', d => pxPerRWU * d.height)
      .attr('r', 5)
      .call(rotateable);
    imageGroup.select('.controls .rotation-to-center')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', d => pxPerRWU * d.height);
    _.forIn(
      { tl: [-1, -1], tr: [1, -1], bl: [-1, 1], br: [1, 1] },
      ([xOff, yOff], label) => {
        imageGroup.select(`.controls .${label}`)
          .attr('cx', d => xOff * pxPerRWU * d.width / 2)
          .attr('cy', d => yOff * pxPerRWU * d.height / 2)
          .attr('r', 5)
          .style('cursor', d => bestResizeCursor(xOff, yOff, d.r))
          .call(resizeable);
      });

  }

  chart.xScale = function (_) {
    if (!arguments.length) return xScale;
    xScale = _;
    return chart;
  };
  chart.yScale = function (_) {
    if (!arguments.length) return yScale;
    yScale = _;
    return chart;
  };
  return chart;
}
