define([ 'batty', 'pixi', 'modernizr' ], function(Batty, PIXI, Modernizr) {
  var Batty = Batty(window);
  suite('DynamicBody', function() {
    setup(function(done) {
      var assets = [ 'base/SpriteSheetTest.json' ],
          assetLoader = new PIXI.AssetLoader(assets);
      
      assetLoader.onComplete = function() {
        sinon.spy(PIXI, 'Sprite');
      
        done();
      };
   
      assetLoader.load();
    });
    test('construtor function with default default params', function() {
      var texture,
          worldMock,
          options,
          dynamicBody;

      texture = PIXI.TextureCache[Batty.World.prototype.BALL_TEXTURE_NAME];
      worldMock = {};
      options = {};
          
      dynamicBody = new Batty.DynamicBody(texture, worldMock, options);
      
      expect(PIXI.Sprite.calledOnce).to.be.ok();
      expect(dynamicBody.world).to.be.equal(worldMock);
      expect(dynamicBody.width).to.equal(texture.width);
      expect(dynamicBody.height).to.equal(texture.height);
      expect(dynamicBody.position.x).to.be.equal(dynamicBody.width + 1);
      expect(dynamicBody.position.y).to.be.equal(dynamicBody.height + 1);
    });
    teardown(function() {
      PIXI.Sprite.restore();
    });
  });
  suite('Test suite 2', function() {
    test('test 1', function() {
      expect(1).to.be.ok();
    });
  });
});