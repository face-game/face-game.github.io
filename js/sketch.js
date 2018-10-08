/* public/js/sketch.js
 * Originally created 9/29/2017 by Perry Naseck (DaAwesomeP)
 * https://github.com/face-game/face-game
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

/* global p5, ml5, XMLHttpRequest */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "p5Runtime| }] */

/* eslint new-cap: ["error", { "newIsCapExceptionPattern": "clm|p5" }] */
'use strict';

var sketch = function sketch(s) {
  var videoInput;
  var poseNet;
  var canvasBg;
  var width = 640;
  var height = 480;
  var devPixRat = 1;
  if (window.devicePixelRatio > 1) devPixRat = window.devicePixelRatio;
  var rWidth = width * devPixRat;
  var rHeight = height * devPixRat;
  var player = {};

  var getContent = function getContent(callback) {
    var request = new XMLHttpRequest();
    request.open('GET', 'https://face-game.github.io/face-game-content/content.txt', true);

    request.onload = function getContentOnload() {
      if (request.status >= 200 && request.status < 400) {
        var lines = request.responseText.split('\n');
        player.content = lines[s.int(s.random(lines.length - 1))];
        if (player.debug) console.log('content', player.content);
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
        if (player.debug) console.log('wakeupRemote', data);
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
    var modelReady = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var debug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var callback = arguments.length > 3 ? arguments[3] : undefined;
    if (player.debug) console.log('init');
    player = {
      ended: false,
      loc: false,
      coords: false,
      cameraReady: cameraReady,
      modelReady: modelReady,
      poses: [],
      part: {},
      level: 1,
      snapped: [],
      sent: false,
      remoteAwake: false,
      content: false,
      sendData: {},
      sendInit: false,
      startShowLoad: false,
      debug: debug
    };
    wakeupRemote();
    getContent(function () {
      for (var i in levels) {
        levels[i].img.loaded = s.loadImage(levels[i].img.src);
        levels[i].cursor.loaded = s.loadImage(levels[i].cursor.src);
        levels[i].img.counter = s.loadImage("https://face-game.github.io/face-game-content/level-".concat(s.int(i) + 1, "/").concat(player.content, ".png"));
      }

      callback();
    });
  };

  var levels = [{
    obj: 'Stick out your tongue, turn your head, and lick the lollipop',
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
    obj: 'Pucker your lips, turn your head, and kiss the puppy',
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
    init(false, false, false, function () {
      canvasBg = s.loadImage('/img/45-degree-fabric-light.png');
      s.createCanvas(640, 480);
      s.textSize(50);
      videoInput = s.createCapture({
        video: {
          width: {
            min: 320,
            ideal: 640,
            max: 640
          },
          height: {
            min: 240,
            ideal: 480,
            max: 480
          }
        },
        audio: false
      }, function () {
        player.cameraReady = true;
      });
      videoInput.size(rWidth, rHeight);
      videoInput.hide();
      poseNet = ml5.poseNet(videoInput, function () {
        player.modelReady = true;
      });
      poseNet.on('pose', function (results) {
        player.poses = results;
      });
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
    s.fill(0);
    s.noStroke();
    s.textAlign(s.CENTER, s.CENTER);

    if (navigator.userAgent.toLowerCase().search('phone') !== -1 || navigator.userAgent.toLowerCase().search('ipad') !== -1 || navigator.userAgent.toLowerCase().search('android') !== -1) {
      s.textAlign(s.CENTER, s.CENTER);
      s.text('Sorry, but the game only works on desktop or laptop computers! The game doesn\'t run well on phones and tablets.', s.width / 4, s.height / 4, s.width / 2, s.height / 2);
    } else if (navigator.userAgent.match(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari/g) || navigator.userAgent.match(/(Edge)\/(\d+)(?:\.(\d+))?/g) || navigator.userAgent.match(/(MSIE) (\d+)(?:\.(\d+))?/g) || navigator.userAgent.match(/(Trident)\/(\d+)(?:\.(\d+))?/g)) {
      // Safari match regex adjusted from
      // https://jonlabelle.com/snippets/view/yaml/browser-user-agent-regular-expressions
      s.textAlign(s.CENTER, s.CENTER);
      s.text('Sorry, but the game doesn\'t work in Safari, Edge, or Internet Explorer! The game uses technology for face detection with cameras in the browser. Please try Mozilla Firefox, Google Chrome, or Opera.', s.width / 4, s.height / 4, s.width / 2, s.height / 2);
    } else if (!player.cameraReady) {
      if (player.debug) console.log('not camera ready');
      s.textAlign(s.CENTER, s.CENTER);
      s.text('Your browser will prompt you to allow this website to access your camera. Please allow access to play the game.', s.width / 4, s.height / 4, s.width / 2, s.height / 2);
    } else if (!player.modelReady) {
      if (player.debug && !player.startShowLoad) console.log('show loading');
      player.startShowLoad = true;
      s.textAlign(s.CENTER, s.CENTER);
      s.text('Loading face detection model...', s.width / 4, s.height / 4, s.width / 2, s.height / 2);
    } else {
      var currLevel = levels[player.level - 1];

      if (!player.ended) {
        player.part = {
          score: 0
        };
        player.loc = false;

        for (var i in player.poses) {
          var noseScore = player.poses[i].pose.keypoints.find(function (key) {
            return key.part === 'nose';
          });

          if (noseScore.score > player.part.score) {
            player.part = noseScore;
            player.loc = [player.part.position.x, player.part.position.y];
          }
        }

        s.fill(0);
        s.noStroke();
        s.textSize(22);
        s.textAlign(s.LEFT, s.TOP);
        s.text("Level ".concat(player.level), 20, 5);
        s.textAlign(s.RIGHT, s.TOP);
        s.text(currLevel.obj, s.width / 4, 5, 3 * s.width / 4);
        s.textAlign(s.CENTER, s.BOTTOM);
        s.textSize(18);
        s.text('Move your head in real life to control the game', s.width / 2, s.height - 5);
        s.imageMode(s.CENTER);
        s.image(currLevel.img.loaded, currLevel.loc[0], currLevel.loc[1], currLevel.img.size[0], currLevel.img.size[0]);

        if (player.loc !== false) {
          player.coords = [(rWidth - player.loc[0]) / devPixRat, player.loc[1] / devPixRat];
          player.distFrom = Math.hypot(player.coords[0] - currLevel.loc[0], player.coords[1] - currLevel.loc[1]);

          if (player.distFrom <= currLevel.dist) {
            if (player.debug) console.log('levelup');
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

        for (var _i in player.snapped) {
          if (levels[_i].side === 1) {
            s.push();
            s.translate(s.width / 2, 0);
            s.scale(-1.0, 1.0);
          }

          s.image(player.snapped[_i], 0, _i * (s.height / 2), s.width / 2, s.height / 2);
          if (levels[_i].side === 1) s.pop();
        }

        for (var _i2 in levels) {
          if (levels[_i2].side === 0) {
            s.push();
            s.translate(s.width, 0);
            s.scale(-1.0, 1.0);
            s.image(levels[_i2].img.counter, 0, _i2 * (s.height / 2), s.width / 2, s.height / 2);
            s.pop();
          } else {
            s.image(levels[_i2].img.counter, s.width / 2, _i2 * (s.height / 2), s.width / 2, s.height / 2);
          }
        }

        s.stroke(0);
        s.fill(255);
        s.textSize(44);
        s.textAlign(s.CENTER, s.CENTER);
        s.text('Wow! very cute!', s.width / 2, s.height / 2);
        s.textAlign(s.CENTER, s.BOTTOM);
        s.textSize(18); // s.text('Click or press any key to play again!', s.width / 2, s.height - 5)

        s.fill(0);
        s.stroke(255);
        s.strokeWeight(2);
        s.rect(s.width / 10, s.height - 40, 3 * s.width / 10, 40);
        s.rect(6 * s.width / 10, s.height - 40, 3 * s.width / 10, 40);
        s.fill(255);
        s.stroke(0);
        if (!player.sent) s.text('Submit my photos!', s.width / 4, s.height - 5);else s.text('Submitted!', s.width / 4, s.height - 5);
        s.text('Play again!', 3 * s.width / 4, s.height - 5);
        player.sendData = {
          images: [],
          created: new Date(),
          userAgent: window.navigator.userAgent,
          devicePixelRatio: window.devicePixelRatio
        };

        for (var _i3 in player.snapped) {
          player.sendData.images.push({
            level: s.int(_i3) + 1,
            img: player.snapped[_i3].canvas.toDataURL()
          });
        }

        if (!player.sent && !player.sendInit) {
          if (player.debug) console.log('sendData', player.sendData);
          wakeupRemote();
          player.sendInit = true;
        }
      }
    }

    if (player.debug) {
      s.fill(s.color(255, 0, 0, 100));
      s.noStroke();
      s.textFont('Courier New', 90);
      s.textAlign(s.CENTER, s.CENTER);
      s.text('DEBUG MODE', s.width / 2, s.height / 3);
      s.text('DEBUG MODE', s.width / 2, 2 * s.height / 3);
    }
  }; // s.mouseMoved = function mouseMoved () {
  //   if (player.ended) {
  //     if ((s.mouseX >= s.width / 10) && (s.mouseX <= 4 * s.width / 10) &&
  //         (s.mouseY >= s.height - 40) && (s.mouseX <= s.height)) {
  //       s.cursor(s.HAND)
  //     } else if ((s.mouseX >= 6 * s.width / 10) && (s.mouseX <= 9 * s.width / 10) &&
  //                (s.mouseY >= s.height - 40) && (s.mouseX <= s.height)) {
  //       s.cursor(s.HAND)
  //     } else s.cursor(s.ARROW)
  //   }
  // }


  s.mousePressed = function mousePressed() {
    if (player.debug) console.log('mousepress'); // if (player.sent) init(player.cameraReady, player.modelReady, player.debug, () => {})

    if (s.mouseX >= s.width / 10 && s.mouseX <= 4 * s.width / 10 && s.mouseY >= s.height - 40 && s.mouseX <= s.height) {
      if (!player.sent && player.sendInit && player.ended) {
        if (player.debug) console.log('sending');
        wakeupRemote();
        var request = new XMLHttpRequest();
        request.open('POST', 'https://face-game.glitch.me/api/0/submit', true);
        request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        if (!player.debug) request.send(JSON.stringify(player.sendData));
        player.sent = true;
      }
    } else if (s.mouseX >= 6 * s.width / 10 && s.mouseX <= 9 * s.width / 10 && s.mouseY >= s.height - 40 && s.mouseX <= s.height) {
      if (player.ended) {
        init(player.cameraReady, player.modelReady, player.debug, function () {});
      }
    }
  };

  s.keyPressed = function keyPressed() {
    if (player.debug) console.log('keypress'); // if (player.sent) init(player.cameraReady, player.modelReady, player.debug, () => {})
    else if (s.keyCode === 68 && !player.debug) {
        console.log('debug mode');
        player.debug = true;
      }
  };
};

var p5Runtime = new p5(sketch, 'p5sketch');
//# sourceMappingURL=sketch.js.map
