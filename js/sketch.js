/* public/js/sketch.js
 * Originally created 9/29/2017 by Perry Naseck (DaAwesomeP)
 * https://github.com/DaAwesomeP/face-game
 *
 * Copyright 2018-present Perry Naseck (DaAwesomeP)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global p5, clm, XMLHttpRequest */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "p5Runtime| }] */

/* eslint new-cap: ["error", { "newIsCapExceptionPattern": "clm|p5" }] */
'use strict';

var sketch = function sketch(s) {
  var videoInput;
  var ctracker;
  var canvasBg;
  var player = {};

  var getContent = function getContent(callback) {
    var request = new XMLHttpRequest();
    request.open('GET', 'https://face-game.github.io/face-game-content/content.txt', true);

    request.onload = function getContentOnload() {
      if (request.status >= 200 && request.status < 400) {
        var lines = request.responseText.split('\n');
        player.content = lines[s.int(s.random(lines.length - 1))];
        callback();
      }
    };

    request.onerror = function getContentOnerror(err) {
      console.log('getContentError', err);
      player.content = false;
    };

    request.send();
  };

  var wakeupRemote = function wakeupRemote() {
    var request = new XMLHttpRequest();
    request.open('GET', 'https://face-game.glitch.me/api/0/wakeup', true);

    request.onload = function wakeupOnload() {
      if (request.status >= 200 && request.status < 400) {
        var data = JSON.parse(request.responseText);
        if (data === {
          status: 200
        }) player.remoteAwake = true;else player.remoteAwake = false;
      }
    };

    request.onerror = function wakeupOnerror(err) {
      console.log('wakeupError', err);
      player.remoteAwake = false;
    };

    request.send();
  };

  var init = function init() {
    var cameraReady = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var callback = arguments.length > 1 ? arguments[1] : undefined;
    player = {
      ended: false,
      loc: false,
      coords: false,
      cameraReady: cameraReady,
      level: 1,
      snapped: [],
      sent: false,
      remoteAwake: false,
      content: false,
      debug: false
    };
    wakeupRemote();
    getContent(callback);
  };

  var levels = [{
    obj: 'Stick out your tongue and lick the lollipop',
    loc: [65, 185],
    side: 0,
    dist: 40,
    img: {
      src: '/img/level-01.png',
      size: [100, 100]
    },
    cursor: {
      src: '/img/cursor-01.png',
      size: [100, 100]
    }
  }, {
    obj: 'Pucker your lips and kiss the puppy',
    loc: [575, 260],
    side: 1,
    dist: 40,
    img: {
      src: '/img/level-02.png',
      size: [100, 100]
    },
    cursor: {
      src: '/img/cursor-02.png',
      size: [100, 100]
    }
  }];

  s.setup = function setup() {
    init(false, function () {
      canvasBg = s.loadImage('/img/45-degree-fabric-light.png');

      for (var i in levels) {
        levels[i].img.loaded = s.loadImage(levels[i].img.src);
        levels[i].cursor.loaded = s.loadImage(levels[i].cursor.src);
        levels[i].img.counter = s.loadImage("https://face-game.github.io/face-game-content/level-".concat(s.int(i) + 1, "/").concat(player.content, ".png"));
      }

      s.createCanvas(640, 480);
      s.textSize(50);
      videoInput = s.createCapture({
        video: {
          mandatory: {
            minWidth: 640,
            minHeight: 480
          },
          optional: [{
            minFrameRate: 10
          }]
        },
        audio: false
      }, function () {
        player.cameraReady = true;
      });
      videoInput.size(640, 480);
      videoInput.hide();
      ctracker = new clm.tracker();
      ctracker.init();
      ctracker.start(videoInput.elt);
    });
  };

  s.draw = function draw() {
    s.imageMode(s.CORNERS);
    s.background(s.color(252, 249, 213));

    if (player.debug) {
      s.push();
      s.translate(s.width, 0);
      s.scale(-1.0, 1.0);
      s.image(videoInput.get(), 0, 0, s.width, s.height);
      s.pop();
    } // s.background(canvasBg)


    s.textFont('Gloria Hallelujah', 22);

    if (!player.cameraReady) {
      s.textAlign(s.CENTER, s.CENTER);
      s.text('Your browser will prompt you to allow this website to access your camera. Please allow access to play the game.', s.width / 4, s.height / 4, s.width / 2, s.height / 2);
    } else {
      var currLevel = levels[player.level - 1];

      if (!player.ended) {
        player.loc = ctracker.getCurrentPosition();
        s.textAlign(s.LEFT, s.TOP);
        s.text("Level ".concat(player.level), 20, 5);
        s.textAlign(s.LEFT, s.TOP);
        s.text(currLevel.obj, s.width - (20 + s.textWidth(currLevel.obj)), 5);
        s.textAlign(s.CENTER, s.BOTTOM);
        s.textSize(18);
        s.text('Move your head in real life to control the game', s.width / 2, s.height - 5);
        s.imageMode(s.CENTER);
        s.image(currLevel.img.loaded, currLevel.loc[0], currLevel.loc[1], currLevel.img.size[0], currLevel.img.size[0]);

        if (player.loc !== false) {
          player.coords = [640 - player.loc[62][0], player.loc[62][1]];
          player.distFrom = Math.hypot(player.coords[0] - currLevel.loc[0], player.coords[1] - currLevel.loc[1]);

          if (player.distFrom <= currLevel.dist) {
            player.snapped.push(videoInput.get());
            player.level++;
            wakeupRemote();
            if (player.level > levels.length) player.ended = true;
          }
        }

        if (player.coords !== false) {
          s.image(currLevel.cursor.loaded, player.coords[0], player.coords[1], currLevel.cursor.size[0], currLevel.cursor.size[1]);
        }
      } else {
        s.imageMode(s.CORNER);

        for (var i in player.snapped) {
          if (levels[i].side === 1) {
            s.push();
            s.translate(s.width / 2, 0);
            s.scale(-1.0, 1.0);
          }

          s.image(player.snapped[i], 0, i * (s.height / 2), s.width / 2, s.height / 2);
          if (levels[i].side === 1) s.pop();
        }

        for (var _i in levels) {
          if (levels[_i].side === 0) {
            s.push();
            s.translate(s.width, 0);
            s.scale(-1.0, 1.0);
            s.image(levels[_i].img.counter, 0, _i * (s.height / 2), s.width / 2, s.height / 2);
            s.pop();
          } else {
            s.image(levels[_i].img.counter, s.width / 2, _i * (s.height / 2), s.width / 2, s.height / 2);
          }
        }

        s.stroke(0);
        s.fill(255);
        s.textSize(40);
        s.textAlign(s.CENTER, s.CENTER);
        s.text('Wow! very cute!', s.width / 2, s.height / 2);
        s.textAlign(s.CENTER, s.BOTTOM);
        s.textSize(18);
        s.text('Click or press any key to play again!', s.width / 2, s.height - 5);

        if (!player.sent) {
          var sendData = {
            images: [],
            created: new Date()
          };

          for (var _i2 in player.snapped) {
            sendData.images.push({
              level: s.int(_i2) + 1,
              img: player.snapped[_i2].canvas.toDataURL()
            });
          }

          wakeupRemote();
          var request = new XMLHttpRequest();
          request.open('POST', 'https://face-game.glitch.me/api/0/submit', true);
          request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
          if (!player.debug) request.send(JSON.stringify(sendData));
          player.sent = true;
        }
      }
    }
  };

  s.mousePressed = function mousePressed() {
    if (player.sent) init(player.cameraReady, function () {});
  };

  s.keyPressed = function keyPressed() {
    if (player.sent) init(player.cameraReady, function () {});else if (s.keyCode === 68 && !player.debug) {
      console.log('debug mode');
      player.debug = true;
    }
  };
};

var p5Runtime = new p5(sketch, 'p5sketch');
//# sourceMappingURL=sketch.js.map
