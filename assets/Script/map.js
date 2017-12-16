cc.Class({
    extends: cc.Component,
    editor: {
        requireComponent: cc.TiledMap
    },

    properties: {
        minMoveValue: {
            default: 50,
            serializable: false,
        },
        _upPos: {
            default: 'UpPoint',
            serializable: false,
        },
        _touchStartPos: {
            default: null,
            serializable: false,
        },
        _touching: {
            default: false,
            serializable: false,
        },

        _isMapLoaded: {
            default: false,
            serializable: false,
        },

        floorLayerName: {
            default: 'floor'
        },

        barrierLayerName: {
            default: 'barrier'
        },

        doorLayerName: {
            default: 'door'
        },

        propLayerName: {
            default: 'prop'
        },

        monsterLayerName: {
            default: 'monster'
        },

        objectGroupName: {
            default: 'players'
        },

        upObjectName: {
            default: 'UpPoint'
        },

        downObjectName: {
            default: 'DownPoint'
        },

        shangrenSpriteFrames: {
            default: [],
            type: cc.SpriteFrame
        },
    },

    // use this for initialization
    onLoad: function () {
        this._player = this.node.getChildByName('player');
        if (!this._isMapLoaded) {
            this._player.active = false;
        }
        this.time = 0;
        this.index = 0;
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyPressed, this);
        this.node.on(cc.Node.EventType.TOUCH_START, (event) => {
            this._touching = true;
            this._touchStartPos = event.touch.getLocation();
        });
        this.node.on(cc.Node.EventType.TOUCH_END, (event) => {
            if (!this._touching || !this._isMapLoaded) return;

            this._touching = false;
            var touchPos = event.touch.getLocation();
            var movedX = touchPos.x - this._touchStartPos.x;
            var movedY = touchPos.y - this._touchStartPos.y;
            var movedXValue = Math.abs(movedX);
            var movedYValue = Math.abs(movedY);
            if (movedXValue < this.minMoveValue && movedYValue < this.minMoveValue) {
                // touch moved not enough
                return;
            }

            var newTile = cc.p(this._curTile.x, this._curTile.y);
            if (movedXValue >= movedYValue) {
                // move to right or left
                if (movedX > 0) {
                    newTile.x += 1;
                } else {
                    newTile.x -= 1;
                }
            } else {
                // move to up or down
                if (movedY > 0) {
                    newTile.y -= 1;
                } else {
                    newTile.y += 1;
                }
            }
            this._tryMoveToNewTile(newTile);
        });
    },

    onEnable: function () {
        if (!this._startTile) this.initMap();

        if (this._upPos == 'UpPoint') {
            this._curTile = this._startTile;
        } else if (this._upPos == 'DownPoint') {
            this._curTile = this._endTile;
        };
        this._updatePlayerPos();
    },

    onDisable: function () {
        //cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyPressed, this);
        //this.node.targetOff(this.node);
    },

    initMap: function (err) {
        if (err) return;

        // init the map position
        this._initMapPos();

        // init the player position
        this._tiledMap = this.node.getComponent('cc.TiledMap');
        var objectGroup = this._tiledMap.getObjectGroup(this.objectGroupName);
        if (!objectGroup) return;

        var UpObj = objectGroup.getObject(this.upObjectName);
        var DownObj = objectGroup.getObject(this.downObjectName);
        if (!UpObj || !DownObj) return;

        var UpPos = cc.p(UpObj.sgNode.x, UpObj.sgNode.y);
        var DownPos = cc.p(DownObj.sgNode.x, DownObj.sgNode.y);

        this._layerFloor = this._tiledMap.getLayer(this.floorLayerName);
        this._layerBarrier = this._tiledMap.getLayer(this.barrierLayerName);
        this._layerDoor = this._tiledMap.getLayer(this.doorLayerName);
        this._layerProp = this._tiledMap.getLayer(this.propLayerName);
        this._layerMonster = this._tiledMap.getLayer(this.monsterLayerName);
        if (!this._layerFloor || !this._layerBarrier || !this._layerDoor || !this._layerProp || !this._layerMonster) return;

        this._curTile = this._startTile = this._getTilePos(UpPos);
        this._endTile = this._getTilePos(DownPos);

        if (this._player) {
            this._updatePlayerPos();
            this._player.active = true;
        }

        var size = this._layerMonster.getLayerSize();

        for (let i = 0; i < size.width; i++) {
            for (let j = 0; j < size.height; j++){
                
                var monsterGID = this._layerMonster.getTileGIDAt(cc.p(i, j));
                var monsterProperties = this._tiledMap.getPropertiesForGID(monsterGID);
                if (monsterProperties && monsterProperties.type == 'npc') {
                    this.tile = this._layerMonster.getTileAt(cc.p(i, j));
                    
                };
            };
        };


        this._isMapLoaded = true;
    },

    _initMapPos: function () {
        //this.node.setPosition(cc.visibleRect.bottomLeft);
    },

    _updatePlayerPos: function () {
        var pos = this._layerFloor.getPositionAt(this._curTile);
        this._player.setPosition(pos);
    },

    _getTilePos: function (posInPixel) {
        var mapSize = this.node.getContentSize();
        var tileSize = this._tiledMap.getTileSize();
        var x = Math.floor(posInPixel.x / tileSize.width);
        var y = Math.floor((mapSize.height - posInPixel.y) / tileSize.height);

        return cc.p(x, y);
    },

    _onKeyPressed: function (event) {
        if (!this._isMapLoaded || this.node.active == false) return;

        var newTile = cc.p(this._curTile.x, this._curTile.y);
        switch (event.keyCode) {
            case cc.KEY.up:
                newTile.y -= 1;
                break;
            case cc.KEY.down:
                newTile.y += 1;
                break;
            case cc.KEY.left:
                newTile.x -= 1;
                break;
            case cc.KEY.right:
                newTile.x += 1;
                break;
            default:
                return;
        }

        this._tryMoveToNewTile(newTile);
    },

    _tryMoveToNewTile: function (newTile) {
        var mapSize = this._tiledMap.getMapSize();
        if (newTile.x < 0 || newTile.x >= mapSize.width) return;
        if (newTile.y < 0 || newTile.y >= mapSize.height) return;

        var barrierGID = this._layerBarrier.getTileGIDAt(newTile);
        var doorGID = this._layerDoor.getTileGIDAt(newTile);
        var propGID = this._layerProp.getTileGIDAt(newTile);
        var monsterGID = this._layerMonster.getTileGIDAt(newTile);

        if (barrierGID) {
            var barrierProperties = this._tiledMap.getPropertiesForGID(barrierGID);
            if (!barrierProperties) {
                cc.log('This way is blocked!');
                return false;
            };

            if (barrierProperties.type == 'UpStair') {
                cc.log('up');
                let nameArr = this.node.name.split('_');
                let index = parseFloat(nameArr[1]) + 1;
                let floorName = 'floor_' + index;
                this.node.active = false;
                let nextMap = this.node.parent.getChildByName(floorName);
                nextMap.getComponent('map')._upPos = 'UpPoint';
                nextMap.active = true;

                let floorLabel = this.node.parent.getChildByName('Canvas').getChildByName('info').getChildByName('labelBg').getChildByName('floorLabel');
                floorLabel.getComponent(cc.Label).string = '第' + index + '层';

            } else if (barrierProperties.type == 'DownStair') {
                cc.log('down');
                let nameArr = this.node.name.split('_');
                let index = parseFloat(nameArr[1]) - 1;
                let floorName = 'floor_' + index;
                this.node.active = false;
                let nextMap = this.node.parent.getChildByName(floorName);
                nextMap.getComponent('map')._upPos = 'DownPoint';
                nextMap.active = true;

                let floorLabel = this.node.parent.getChildByName('Canvas').getChildByName('info').getChildByName('labelBg').getChildByName('floorLabel');
                floorLabel.getComponent(cc.Label).string = '第' + index + '层';

            };
            return;
        };

        if (doorGID) {
            var doorProperties = this._tiledMap.getPropertiesForGID(doorGID);
            if (!doorProperties) {
                cc.log('this door has no property!');
                return false;
            };

            if (doorProperties.type == 'yellow_door') {
                cc.log('yellow_door');
                var gameScript = this.node.parent.getChildByName('Canvas').getComponent('game');
                if (gameScript.yellowKey > 0) {
                    gameScript.yellowKey--;
                    gameScript.updateKeyLabel();
                    this._layerDoor.removeTileAt(newTile);
                } else {
                    cc.log('has no yellow key');
                };
            } else if (doorProperties.type == 'blue_door') {
                cc.log('blue_door');
                var gameScript = this.node.parent.getChildByName('Canvas').getComponent('game');
                if (gameScript.blueKey > 0) {
                    gameScript.blueKey--;
                    gameScript.updateKeyLabel();
                    this._layerDoor.removeTileAt(newTile);
                } else {
                    cc.log('has no blue key');
                };
            };

            return;
        };

        if (propGID) {
            var propProperties = this._tiledMap.getPropertiesForGID(propGID);
            if (!propProperties) {
                cc.log('this prop has no property!');
                return false;
            };

            if (propProperties.type == 'yellow_key') {
                cc.log('yellow_key + 1');
                var gameScript = this.node.parent.getChildByName('Canvas').getComponent('game');
                gameScript.yellowKey++;
                gameScript.updateKeyLabel();
                this._layerProp.removeTileAt(newTile);
            } else if (propProperties.type == 'blue_key') {
                cc.log('blue_key + 1');
                var gameScript = this.node.parent.getChildByName('Canvas').getComponent('game');
                gameScript.blueKey++;
                gameScript.updateKeyLabel();
                this._layerProp.removeTileAt(newTile);
            } else {
                this._layerProp.removeTileAt(newTile);

            };
            //return;
        };
        // update the player position
        this._curTile = newTile;
        this._updatePlayerPos();
    },

    update1: function (dt) {
        if (this.tile) {
            this.time += dt;
            if (this.time >= 0.2) {
                this.tile.setSpriteFrame(this.shangrenSpriteFrames[this.index]);
                this.index++;
                if (this.index === 4) this.index = 0;
                this.time = 0;
            };
        };
    },
});
