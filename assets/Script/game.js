cc.Class({
    extends: cc.Component,

    properties: {
        yellowKey: 0,
        blueKey: 0,
        redKey: 0,
        yellowLabel:cc.Label,
        blueLabel:cc.Label,
        redLabel: cc.Label,
    },

    // use this for initialization
    onLoad: function () {

    },

    updateKeyLabel: function () {
        this.yellowLabel.string = this.yellowKey;
        this.blueLabel.string = this.blueKey;
        this.redLabel.string = this.redKey;
    },

    onBtnClicked: function () {
        cc.game.end();
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
