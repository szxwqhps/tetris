/**
 * Created by xiawanqiang on 14-5-2.
 */

YUI.add('tetris', function(Y) {
    Y.namespace('tetris');

    var QActive = Y.yqf.QActive,
        QHsm = Y.yqf.QHsm,
        QEvent = Y.yqf.QEvent,
        QState = Y.yqf.QState,
        QTimeEvent = Y.yqf.QTimeEvent,
        QF = Y.yqf.QF;

    // define game global variables, constans ...
    var tetris = {
        eventTypes: {
            NEW_GAME_SIG: 'tetris:newGame',
            RESET_GAME_SIG: 'tetris:resetGame',
            UPDATE_NEXT_BLOCK_SIG: 'tetris:updateNextBlock',
            UPDATE_STAT_SIG: 'tetris:updateStat',
            UPDATE_TIME_SIG: 'tetris:updateTime',
            MOVE_LEFT_SIG: 'tetris:moveLeft',
            MOVE_RIGHT_SIG: 'tetris:moveRight',
            ROTATE_SIG: 'tetris:rotate',
            MOVE_DOWN_SIG: 'tetris:moveDown',
            ON_PLACE_SIG: 'tetris:onPlace',
            NEW_BLOCK_SIG: 'tetris:newBlock',
            GAME_PAUSE_SIG: 'tetris:gamePause',
            GAME_RESUME_SIG: 'tetris:gameResume',
            GAME_OVER_SIG: 'tetris:gameOver',
            BLOCK_TIME_TICK_SIG: 'tetris:blockTimeTick',
            STAT_TIME_TICK_SIG: 'tetris:statTimeTick'
        },

        blockWidth: 20,

        blockHeight: 20,

        areaRow: 25,

        areaColumn: 12,

        nextBlockAreaWidth: 5,

        areaElement: null,

        nextBlockElement: null,

        gameArea: null,

        nextBlock: null,

        gameStat: null,

        activeBlock: null,

        init: function(areaEl, nextEl, areaRow, areaColumn, blockSize, nextWidth) {
            tetris.areaElement = areaEl;
            tetris.nextBlockElement = nextEl;

            tetris.areaRow = areaRow || 25;
            tetris.areaColumn = areaColumn || 12;
            tetris.blockWidth = blockSize || 20;
            tetris.blockHeight = blockSize || 20;
            tetris.nextBlockAreaWidth = nextWidth || 5;

            tetris.gameArea = new GameArea();
            tetris.activeBlock = new ActiveBlock();
            tetris.nextBlock = new NextBlock();
            tetris.gameStat = new GameStat();

            QF.startActive(tetris.gameArea, 1);
            QF.startActive(tetris.gameStat, 2);
            QF.startActive(tetris.nextBlock, 3);
            QF.startActive(tetris.activeBlock, 4);
        },

        onKeyDown: function(key) {
            switch (key) {
                case 37:  	// left
                    tetris.gameStat.incOperation();
                    tetris.activeBlock.postFifo(moveLeftEvent);
                    break;
                case 38:  	// up
                    tetris.gameStat.incOperation();
                    tetris.activeBlock.postFifo(rotateEvent);
                    break;
                case 39:  	// right
                    tetris.gameStat.incOperation();
                    tetris.activeBlock.postFifo(moveRightEvent);
                    break;
                case 40:  	// down
                    tetris.gameStat.incOperation();
                    tetris.activeBlock.postFifo(moveDownEvent);
                    break;
                case 32: 	// space - move down
                    tetris.gameStat.incOperation();
                    tetris.activeBlock.postFifo(moveDownEvent);
                    break;
                case 78:  	// new game
                    tetris.newGame();
                    break;
                case 80:  	// pause
                    tetris.pauseGame();
                    break;
                case 82: 	// resume
                    tetris.resumeGame();
                    break;
            }
        },

        pauseGame: function() {
            tetris.gameArea.postFifo(gamePauseEvent);
        },

        newGame: function() {
            tetris.gameArea.postLifo(resetGameEvent);
            tetris.gameArea.postFifo(newGameEvent);
        },

        resumeGame: function() {
            tetris.gameArea.postFifo(gameResumeEvent);
        }

    };

    // static event type
    var moveDownEvent = new QEvent(tetris.eventTypes.MOVE_DOWN_SIG),
        moveLeftEvent = new QEvent(tetris.eventTypes.MOVE_LEFT_SIG),
        moveRightEvent = new QEvent(tetris.eventTypes.MOVE_RIGHT_SIG),
        rotateEvent = new QEvent(tetris.eventTypes.ROTATE_SIG),
        newGameEvent = new QEvent(tetris.eventTypes.NEW_GAME_SIG),
        resetGameEvent = new QEvent(tetris.eventTypes.RESET_GAME_SIG),
        newBlockEvent = new QEvent(tetris.eventTypes.NEW_BLOCK_SIG),
        updateNextBlockEvent = new QEvent(tetris.eventTypes.UPDATE_NEXT_BLOCK_SIG),
        updateStatEvent = new QEvent(tetris.eventTypes.UPDATE_STAT_SIG),
        updateTimeEvent = new QEvent(tetris.eventTypes.UPDATE_TIME_SIG),
        gamePauseEvent = new QEvent(tetris.eventTypes.GAME_PAUSE_SIG),
        gameResumeEvent = new QEvent(tetris.eventTypes.GAME_RESUME_SIG),
        gameOverEvent = new QEvent(tetris.eventTypes.GAME_OVER_SIG),
        onPlaceEvent = new QEvent(tetris.eventTypes.ON_PLACE_SIG);

    // define block types
    var blockTypes = [{
        // **
        //  **
        size: 3,
        count: 4,
        style: 'type0',
        position: [
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}],
            [{x: 0, y: 2}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 0}],
            [{x: 2, y: 2}, {x: 1, y: 2}, {x: 1, y: 1}, {x: 0, y: 1}],
            [{x: 2, y: 0}, {x: 2, y: 1}, {x: 1, y: 1}, {x: 1, y: 2}]
        ]
    }, {
        //    **
        //   **
        size: 3,
        count: 4,
        style: 'type1',
        position: [
            [{x: 2, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}],
            [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 2}],
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 1, y: 1}, {x: 2, y: 1}],
            [{x: 2, y: 2}, {x: 2, y: 1}, {x: 1, y: 1}, {x: 1, y: 0}]
        ]
    }, {
        // *
        // ***
        size: 3,
        count: 4,
        style: 'type2',
        position: [
            [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}],
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 1, y: 1}, {x: 1, y: 0}],
            [{x: 2, y: 2}, {x: 2, y: 1}, {x: 1, y: 1}, {x: 0, y: 1}],
            [{x: 2, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 1, y: 2}]
        ]
    }, {
        //   *
        // ***
        size: 3,
        count: 4,
        style: 'type3',
        position: [
            [{x: 2, y: 0}, {x: 2, y: 1}, {x: 1, y: 1}, {x: 0, y: 1}],
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 1, y: 2}],
            [{x: 0, y: 2}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}],
            [{x: 2, y: 2}, {x: 1, y: 2}, {x: 1, y: 1}, {x: 1, y: 0}]
        ]
    }, {
        //  *
        // ***
        size: 3,
        count: 4,
        style: 'type4',
        position: [
            [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}],
            [{x: 0, y: 1}, {x: 1, y: 2}, {x: 1, y: 1}, {x: 1, y: 0}],
            [{x: 1, y: 2}, {x: 2, y: 1}, {x: 1, y: 1}, {x: 0, y: 1}],
            [{x: 2, y: 1}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 1, y: 2}]
        ]
    }, {
        //
        // ****
        size: 4,
        count: 4,
        style: 'type5',
        position: [
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}],
            [{x: 1, y: 3}, {x: 1, y: 2}, {x: 1, y: 1}, {x: 1, y: 0}],
            [{x: 3, y: 2}, {x: 2, y: 2}, {x: 1, y: 2}, {x: 0, y: 2}],
            [{x: 2, y: 0}, {x: 2, y: 1}, {x: 2, y: 2}, {x: 2, y: 3}]
        ]
    }, {
        // **
        // **
        size: 2,
        count: 4,
        style: 'type6',
        position: [
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}],
            [{x: 0, y: 1}, {x: 0, y: 0}, {x: 1, y: 1}, {x: 1, y: 0}],
            [{x: 1, y: 1}, {x: 0, y: 1}, {x: 1, y: 0}, {x: 0, y: 0}],
            [{x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 0}, {x: 0, y: 1}]
        ]
    }];

    // t: 0 - current, 1 - after rotate, 2 - after left, 3 - after right, 4 - after down
    // type is block type (0~6), state is block rotation state (0~3)
    // (startX, startY) is the block position
    var getPosition = function(t, type, state, startX, startY) {
        var nextState = (state + 1) % 4,
            pos = blockTypes[type].position[state];

        switch (t) {
            case 0:
                pos = pos.map(function(item, i, a) {
                    return {
                        x: item.x + startX,
                        y: item.y + startY
                    };
                })
                break;
            case 1:
                pos = blockTypes[type].position[nextState];
                pos = pos.map(function(item, i, a) {
                    return {
                        x: item.x + startX,
                        y: item.y + startY
                    };
                });
                break;
            case 2:
                pos = pos.map(function(item, i, a) {
                    return {
                        x: item.x + startX - 1,
                        y: item.y + startY
                    };
                });
                break;
            case 3:
                pos = pos.map(function(item, i, a) {
                    return {
                        x: item.x + startX + 1,
                        y: item.y + startY
                    };
                });
                break;
            case 4:
                pos = pos.map(function(item, i, a) {
                    return {
                        x: item.x + startX,
                        y: item.y + startY + 1
                    };
                });
                break;
        }

        return pos;
    };

    // Game stattistic ao
    var GameStat = function() {
        var self = this,
            score = 0,
            lines = 0,
            level = 1,
            operation = 0,
            blocks = 0,
            usedTime = 0,
            gameOn = false,
            startTime = Date.now();


        var reset =function() {
            score = 0;
            blocks = 0;
            lines = 0;
            level = 1;
            operation = 0;
            usedTime = 0,
                gameOn = false;
            startTime = Date.now();
        };


        var initial = new QState(function(e) {
            return self.transfer(notActive);
        });

        var notActive = new QState(function(e) {
            if (e.signal === tetris.eventTypes.NEW_GAME_SIG) {
                return self.transfer(active);
            }

            return QHsm.unhandled();
        }, QHsm.top, function() {
            reset();
            return QHsm.handled();
        });

        var active = new QState(function(e) {
            switch (e.signal) {
                case tetris.eventTypes.UPDATE_STAT_SIG:
                    Y.fire(tetris.eventTypes.UPDATE_STAT_SIG, {score: score, lines: lines, level: level});
                    return QHsm.handled();

                case tetris.eventTypes.UPDATE_TIME_SIG:
                    Y.fire(tetris.eventTypes.UPDATE_TIME_SIG, {time: self.getTime(), amp: self.getAmp()});
                    return QHsm.handled();

                case tetris.eventTypes.RESET_GAME_SIG:
                    return self.transfer(notActive);
            }

            return QHsm.unhandled();
        }, QHsm.top, function() {
            self.startStatTime();
            return QHsm.handled();
        })


        this.incOperation = function() {
            operation += 1;
        };

        this.incLines = function(n) {
            lines += n;
            score += 200 * level * n * n;
        };

        this.incBlocks = function() {
            blocks += 1;
            score += 5 + level;
            if (blocks >= (10 + level * 2)) {
                level += 1;
                blocks = 0;
            }
        };

        this.stopStatTime = function() {
            if (gameOn) {
                usedTime += Date.now() - startTime;
                gameOn = false;
            }
        }

        this.startStatTime = function() {
            if (!gameOn) {
                startTime = Date.now();
                gameOn = true;
            }
        };

        this.getAmp = function() {
            return Math.floor(operation  / (Date.now() - startTime)  * 60000);
        };

        this.getTime = function() {
            if (gameOn) {
                return usedTime + Date.now() - startTime;
            }

            return usedTime;
        };

        this.getLevel = function() {
            return level;
        };

        this.getLevelTimeTick = function() {
            return 80 + Math.floor(700 / level);
        };

        this.getScore = function() {
            return score;
        };

        this.getLines = function() {
            return lines;
        };

        QActive.call(self, initial);
    };

    Y.extend(GameStat, QActive);

    // Game area ao
    var GameArea = function() {
        var self = this,
            topest = tetris.areaRow,
            board = new Array(tetris.areaRow * tetris.areaColumn),
            blockTimeEvent = new QTimeEvent(self, tetris.eventTypes.BLOCK_TIME_TICK_SIG),
            statTimeEvent = new QTimeEvent(self, tetris.eventTypes.STAT_TIME_TICK_SIG),
            gameOverElement = Y.Node.create('<span class="game-over">Game Over</span>'),
            i = 0,
            length = board.length;

        for (i = 0; i < length; i++) {
            board[i] = null;
        }

        var reset = function() {
            var i = 0,
                length = board.length;

            for (i = 0; i < length; i++) {
                if (board[i] !== null) {
                    tetris.areaElement.removeChild(board[i]);
                    board[i] = null;
                }
            }

            topest = tetris.areaRow;
        };

        var isLineFull = function(line) {
            var i = 0,
                xy = line * tetris.areaColumn;

            for (i = 0; i < tetris.areaColumn; i++) {
                if (board[xy] === null) {
                    return false;
                }
                xy += 1;
            }

            return true;
        };

        var removeLines = function(lines) {
            var i = 0,
                j = 0,
                xy = 0,
                count = 0;
            bottom = 0;

            if (lines.length === 0) {
                return;
            }

            bottom = lines.shift();
            for (i = bottom; i >= topest; i--) {
                if (i === bottom) {	// need remove element
                    for (j = 0; j < tetris.areaColumn; j++) {
                        xy = i * tetris.areaColumn + j;
                        tetris.areaElement.removeChild(board[xy]);
                        board[xy] = null;
                    }
                    count += 1;
                    if (lines.length > 0) {
                        bottom = lines.shift();
                    }
                } else {
                    for (j = 0; j < tetris.areaColumn; j++) {
                        xy = i * tetris.areaColumn + j;
                        if (board[xy] !== null) {
                            board[xy + count * tetris.areaColumn] = board[xy];	// move down
                            board[xy].setStyle('left', j * (tetris.blockWidth + 1));
                            board[xy].setStyle('top', (i + count) * (tetris.blockHeight + 1));
                            board[xy] = null;
                        }

                    }
                }
            }

            tetris.gameStat.incLines(count);
        };

        var placeBlocks = function() {
            var i = 0,
                xy = 0,
                placeInfo = tetris.activeBlock.getPlaceInfo(),
                pos = placeInfo.pos,
                blocks = placeInfo.blocks,
                length = pos.length;

            for (i = 0; i < length; i++) {
                xy = pos[i].y * tetris.areaColumn + pos[i].x;
                if (board[xy] !== null) {
                    throw new Error('Place block error! x: ' + pos[i].x + ' y: ' + pos[i].y);
                }

                board[xy] = blocks.shift();
                if (topest > pos[i].y) {
                    topest = pos[i].y;
                }
            }

            tetris.gameStat.incBlocks();
        };

        var initial = new QState(function(e) {
            return self.transfer(notActive);
        });

        var notActive = new QState(function(e) {
            if (e.signal === tetris.eventTypes.NEW_GAME_SIG) {
                return self.transfer(gameOn);
            }

            return QHsm.unhandled();
        }, QHsm.top, function() {
            reset();
            tetris.activeBlock.postLifo(resetGameEvent);
            tetris.nextBlock.postLifo(resetGameEvent);
            tetris.gameStat.postLifo(resetGameEvent);
            return QHsm.handled();
        });

        var gameOn = new QState(function(e) {
            if (e.signal === tetris.eventTypes.RESET_GAME_SIG) {
                return self.transfer(notActive);
            }

            return QHsm.unhandled();
        }, QHsm.top, function() {
            tetris.activeBlock.postFifo(newGameEvent);
            tetris.nextBlock.postFifo(newGameEvent);
            tetris.gameStat.postFifo(newGameEvent);

            return QHsm.handled();
        }, QHsm.handled, function(){
            return self.transfer(active);
        });

        var active = new QState(function(e) {
            var lines = [],
                i = 0;

            switch (e.signal) {
                case tetris.eventTypes.ON_PLACE_SIG:
                    placeBlocks();

                    for (i = tetris.areaRow - 1; i >= topest; i--) {
                        if (isLineFull(i)) {
                            lines.push(i);
                        }
                    }
                    if (lines.length > 0) {
                        removeLines(lines);
                    }
                    tetris.gameStat.postFifo(updateStatEvent);
                    tetris.activeBlock.postFifo(newBlockEvent);
                    return QHsm.handled();

                case tetris.eventTypes.BLOCK_TIME_TICK_SIG:
                    tetris.activeBlock.postFifo(moveDownEvent);
                    QF.arm(blockTimeEvent, tetris.gameStat.getLevelTimeTick(), false);
                    return QHsm.handled();

                case tetris.eventTypes.STAT_TIME_TICK_SIG:
                    tetris.gameStat.postFifo(updateTimeEvent);
                    QF.arm(statTimeEvent, 1000, false);
                    return QHsm.handled();

                case tetris.eventTypes.GAME_PAUSE_SIG:
                    tetris.gameStat.stopStatTime();
                    return self.transfer(paused);

                case tetris.eventTypes.GAME_OVER_SIG:
                    return self.transfer(gameOver);

            }

            return QHsm.unhandled();
        }, gameOn, function() {
            QF.arm(blockTimeEvent, tetris.gameStat.getLevelTimeTick(), false);
            QF.arm(statTimeEvent, 1000, false);

            return QHsm.handled();
        }, function() {
            QF.disarm(blockTimeEvent);
            QF.disarm(statTimeEvent);

            return QHsm.handled();
        });

        var paused = new QState(function(e) {
            if (e.signal === tetris.eventTypes.GAME_RESUME_SIG) {
                tetris.gameStat.startStatTime();
                return self.transfer(active);
            }

            return QHsm.unhandled();
        }, gameOn);

        var gameOver = new QState(QHsm.unhandled, gameOn, function() {
            // on game over, do ...
            console.log('game over!');
            tetris.gameStat.stopStatTime();
            tetris.areaElement.insert(gameOverElement);
        }, function() {
            tetris.areaElement.removeChild(gameOverElement);
        });



        this.testCollision = function(pos) {
            var i = 0,
                xy = 0,
                length = pos.length;

            for (i = 0; i < length; i++) {
                if (pos[i].x < 0 || pos[i].x >= tetris.areaColumn) {
                    return true;
                }
                if (pos[i].y >= tetris.areaRow) {
                    return true;
                }
                xy = pos[i].y * tetris.areaColumn + pos[i].x;
                if (board[xy] !== null) {
                    return true;
                }
            }

            return false;
        };


        QActive.call(self, initial);
    };

    Y.extend(GameArea, QActive);

    // Active block ao
    var ActiveBlock = function() {
        var self = this,
            blocks = [],
            state = 0,
            type = 0,
            startX = 0,
            startY = 0;

        var reset = function() {
            while (blocks.length > 0) {
                tetris.areaElement.removeChild(blocks.pop());
            }
            state = 0;
            type = 0;
            startX = 0;
            startY = 0;
        };

        var createNewBlock = function(t) {
            var count = blockTypes[t].count,
                block = null,
                i = 0;

            for (i = 0; i < count; i++) {
                block = Y.Node.create('<div class="block"></div>');
                tetris.areaElement.insert(block);
                block.addClass('type' + t);
                block.setStyle('width', tetris.blockWidth);
                block.setStyle('height', tetris.blockHeight);
                blocks.push(block);
            }
        };

        var onNewBlock = function() {
            var pos = [];

            type = tetris.nextBlock.getNextType();
            createNewBlock(type);
            startX = Math.floor((tetris.areaColumn - blockTypes[type].size) / 2);
            startY = 0;
            state = 0;
            setBlocksPos();

            pos = getPosition(0, type, state, startX, startY);
            if (tetris.gameArea.testCollision(pos)) {	// game over
                tetris.gameArea.postLifo(gameOverEvent);
            }
        };

        var canMoveLeft = function() {
            var pos = getPosition(2, type, state, startX, startY);
            return !tetris.gameArea.testCollision(pos);
        };

        var canMoveRight = function() {
            var pos = getPosition(3, type, state, startX, startY);
            return !tetris.gameArea.testCollision(pos);
        };

        var canMoveDown = function() {
            var pos = getPosition(4, type, state, startX, startY);
            return !tetris.gameArea.testCollision(pos);
        };

        var canRotate = function() {
            var pos = getPosition(1, type, state, startX, startY);
            return !tetris.gameArea.testCollision(pos);
        };

        var setBlocksPos = function() {
            var	pos = getPosition(0, type, state, startX, startY);

            blocks.forEach(function(b, i, a) {
                b.setStyle('left', pos[i].x * (tetris.blockWidth + 1));
                b.setStyle('top', pos[i].y * (tetris.blockHeight + 1));
            });
        };

        var moveLeft = function() {
            startX -= 1;
            setBlocksPos();
        };

        var moveRight = function() {
            startX += 1;
            setBlocksPos();
        };

        var moveDown = function() {
            startY += 1;
            setBlocksPos();
        };

        var rotate = function() {
            state = (state + 1) % 4;
            setBlocksPos();
        };



        var initial = new QState(function(e) {
            return self.transfer(notActive);
        });

        var notActive = new QState(function(e) {
            if (e.signal === tetris.eventTypes.NEW_GAME_SIG) {
                return self.transfer(active);
            }

            return QHsm.unhandled();
        }, QHsm.top, function() {
            reset();
            return QHsm.handled();
        });

        var active = new QState(function(e) {
            var pos = [];

            switch (e.signal) {
                case tetris.eventTypes.MOVE_DOWN_SIG:
                    if (canMoveDown()) {
                        moveDown();
                    } else {
                        return self.transfer(placed);
                    }
                    return QHsm.handled();
                case tetris.eventTypes.MOVE_LEFT_SIG:
                    if (canMoveLeft()) {
                        moveLeft();
                    }
                    return QHsm.handled();
                case tetris.eventTypes.MOVE_RIGHT_SIG:
                    if (canMoveRight()) {
                        moveRight();
                    }
                    return QHsm.handled();
                case tetris.eventTypes.ROTATE_SIG:
                    if (canRotate()) {
                        rotate();
                    }
                    return QHsm.handled();
                case tetris.eventTypes.RESET_GAME_SIG:
                    return self.transfer(notActive);
            }

            return QHsm.unhandled();
        },QHsm.top, function() {
            onNewBlock();
            tetris.nextBlock.postFifo(updateNextBlockEvent);
            return QHsm.handled();
        });

        var placed = new QState(function(e) {
            switch (e.signal) {
                case tetris.eventTypes.RESET_GAME_SIG:
                    return self.transfer(notActive);
                case tetris.eventTypes.NEW_BLOCK_SIG:
                    return self.transfer(active);
            }

            return QHsm.unhandled();
        }, QHsm.top, function() {
            tetris.gameArea.postFifo(onPlaceEvent);
            return QHsm.handled();
        });

        this.getPlaceInfo = function() {
            var pos = getPosition(0, type, state, startX, startY);

            return {
                pos: pos,
                blocks: blocks
            };
        };

        QActive.call(self, initial);
    };

    Y.extend(ActiveBlock, QActive);

    // define next block ao
    var NextBlock = function() {
        var self = this,
            nextType = 0,
            lastType = 0,
            blocks = [],
            startX = 0,
            startY = 0;

        var setBlocksPos = function() {
            var	pos = getPosition(0, nextType, 0, startX, startY);

            blocks.forEach(function(b, i, a) {
                b.setStyle('left', pos[i].x * (tetris.blockWidth + 1));
                b.setStyle('top', pos[i].y * (tetris.blockHeight + 1));
            });
        };


        var onNewBlock = function() {
            var type = Math.floor(Math.random() * blockTypes.length);
            if (type !== nextType) {
                blocks.forEach(function(b, i, a) {
                    b.replaceClass('type' + nextType, 'type' + type);
                });
                startX = Math.floor((tetris.nextBlockAreaWidth - blockTypes[type].size) / 2);
                startY = 0;
                nextType = type;
                setBlocksPos();
            }
        };


        var initial = new QState(function(e) {
            var i = 0,
                block = null;

            // all our block types are 4 blocks,so ...
            for (i = 0; i < 4; i++) {
                block = Y.Node.create('<div class="block type0"></div>');
                tetris.nextBlockElement.insert(block);
                block.setStyle('width', tetris.blockWidth);
                block.setStyle('height', tetris.blockHeight);
                block.setStyle('display', 'none');
                blocks.push(block);
            }
            return self.transfer(notActive);
        });


        var notActive = new QState(function(e) {
            if (e.signal === tetris.eventTypes.NEW_GAME_SIG) {
                return self.transfer(active);
            }

            return QHsm.unhandled();
        }, QHsm.top, function() {
            blocks.forEach(function(b, i,a) {
                b.setStyle('display', 'none');
            });
            return QHsm.handled();
        });


        var active = new QState(function(e) {
            var type = 0;
            switch (e.signal) {
                case tetris.eventTypes.UPDATE_NEXT_BLOCK_SIG:
                    onNewBlock();
                    return QHsm.handled();

                case tetris.eventTypes.RESET_GAME_SIG:
                    return self.transfer(notActive);
            }

            return QHsm.unhandled();
        }, QHsm.top, function() {
            onNewBlock();
            blocks.forEach(function(b, i, a) {
                b.setStyle('display', 'block');
            });
            return QHsm.handled();
        });

        this.getNextType = function() {
            return nextType;
        };

        QActive.call(self, initial);
    };

    Y.extend(NextBlock, QActive);


    // exports ...
    Y.tetris.tetris = tetris;

}, '0.0.1', {requires: ['node', 'yqf']});