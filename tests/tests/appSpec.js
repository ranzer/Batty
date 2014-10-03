define([ 'batty', 'pixi', 'modernizr' ], function(Batty, PIXI, Modernizr) {
  var Batty = Batty(window);
  suite('DynamicBody', function() {
    setup(function(done) {
      var assets = [ 'base/SpriteSheetTest.json' ],
          assetLoader = new PIXI.AssetLoader(assets);
      
      assetLoader.onComplete = function() {
        sinon.spy(PIXI, 'Sprite');
        sinon.stub(PIXI.Sprite.prototype, 'updateTransform');
        
        done();
      };
   
      assetLoader.load();
    });    
    var getRadians = function(angle) {
      return angle * Math.PI / 180;
    };
    var createDefaultTexture = function() {
      return PIXI.TextureCache[Batty.World.prototype.BALL_TEXTURE_NAME];
    };
    var createDynamicBodyObject = function(texture, world, options) {
      var texture = texture || createDefaultTexture(),
          world = world || {},
          options = options || {};
      
      return new Batty.DynamicBody(texture, world, options);
    };
    var testDynamicBodyConstructor = function(texture, world, options, doneCallback) {
      var dynamicBody = createDynamicBodyObject(texture, world, options);
      
      expect(PIXI.Sprite.calledOnce).to.be.ok();
      expect(dynamicBody.world).to.be.equal(world);
      expect(dynamicBody.width).to.equal(texture.width);
      expect(dynamicBody.height).to.equal(texture.height);
      expect(dynamicBody.stopAnimation).to.not.be.ok();
      
      doneCallback(dynamicBody);
    };
    var createDynamicBodyMock = function(stopAnim) {
      var dynamicBodyMock = {
        stopAnimation: stopAnim,
        vx: 0,
        vy: 0,
        position: {
          x: 1,
          y: 2,
        },
        getRadians: function() {},
        getVelX: function() {},
        getVelY: function() {},
        calculateVelComponents: function() {},
        calculateSpritePosition: function() {},
        onUpdateTransformed: function() {}
      };  
      
      return dynamicBodyMock;
    };
    var testVelComponent = function(mathFunction, doneCallback) {
      var dynamicBody = createDynamicBodyObject(),
          radians,
          v;
          
      radians = dynamicBody.getRadians();
      v = mathFunction(radians) * dynamicBody.vel;
      
      doneCallback(dynamicBody, v);
    };
    var testUpdateTransform = function(stopAnimation, doneCallback) {
      var dynamicBodyMock = createDynamicBodyMock(stopAnimation);
      
      sinon.stub(dynamicBodyMock);
      
      Batty.DynamicBody.prototype.updateTransform.call(dynamicBodyMock);
      
      doneCallback(dynamicBodyMock);
    };
    test('construtor with default options', function(done) {
      var texture = createDefaultTexture(),
          worldMock = {},
          options = {},
          doneCallback;
    
      doneCallback = function(dynamicBody) {
        expect(dynamicBody.vel).to.be.equal(15);
        expect(dynamicBody.position.x).to.be.equal(dynamicBody.width + 1);
        expect(dynamicBody.position.y).to.be.equal(dynamicBody.height + 1);
        expect(dynamicBody.angle).to.be.equal(30);
        
        done();
      };
      
      testDynamicBodyConstructor(texture, worldMock, options, doneCallback);
    });
    test('constructor with non-default options', function(done) {
      var texture = createDefaultTexture(),
          worldMock = {},
          options = { vel: 1, x: 2, y: 3, angle: 4 },
          doneCallback;

      doneCallback = function(dynamicBody) {
        expect(dynamicBody.vel).to.be.equal(options.vel);
        expect(dynamicBody.position.x).to.be.equal(options.x);
        expect(dynamicBody.position.y).to.be.equal(options.y);
        expect(dynamicBody.angle).to.be.equal(options.angle);
        
        done();
      };
      
      testDynamicBodyConstructor(texture, worldMock, options, doneCallback);    
    });
    test('getCollidableBodies', function() {
      var dynamicBody = createDynamicBodyObject(),
          collidableBodies;
      
      collidableBodies = dynamicBody.getCollidableBodies();
      
      expect(collidableBodies).to.be.an('array');
      expect(collidableBodies).to.be.empty();
    });
    test('getRadians', function() {
      var dynamicBody = createDynamicBodyObject(),
          radians;
          
      radians = getRadians(dynamicBody.angle);
      
      expect(dynamicBody.getRadians()).to.be.equal(radians);
    });
    test('getVelX', function(done) {
      var doneCallback = function(dynamicBody, vx) {
        expect(dynamicBody.vx).to.be.equal(vx);
        
        done();
      };
      
      testVelComponent(Math.cos, doneCallback);
    });
    test('getVelY', function(done) {
      var doneCallback = function(dynamicBody, vy) {
        expect(dynamicBody.vy).to.be.equal(vy);
        
        done();
      };
      
      testVelComponent(Math.sin, doneCallback);      
    });
    test('updateTransform when animation is in progress', function(done) {
      var doneCallback;
      
      doneCallback = function(dynamicBodyMock) {
        expect(PIXI.Sprite.prototype.updateTransform.calledOnce).to.be.ok();
        expect(dynamicBodyMock.calculateVelComponents.calledOnce).to.be.ok();
        expect(dynamicBodyMock.calculateSpritePosition.calledOnce).to.be.ok();
        expect(dynamicBodyMock.onUpdateTransformed.calledOnce).to.be.ok();
        
        done();
      }
      
      testUpdateTransform(false, doneCallback);
    });
    test('updateTransform when animation is stopped', function(done) {
      var doneCallback;
      
      doneCallback = function(dynamicBodyMock) {
        expect(PIXI.Sprite.prototype.updateTransform.notCalled).to.be.ok();
        expect(dynamicBodyMock.calculateVelComponents.notCalled).to.be.ok();
        expect(dynamicBodyMock.calculateSpritePosition.notCalled).to.be.ok();
        expect(dynamicBodyMock.onUpdateTransformed.notCalled).to.be.ok();
        
        done();
      }
      
      testUpdateTransform(true, doneCallback);
    });    
    test('calculateVelComponents', function() {
       var dynamicBodyMock = createDynamicBodyMock();
       
       sinon.spy(dynamicBodyMock, 'getRadians');
       sinon.stub(dynamicBodyMock, 'getVelX').returns(1);
       sinon.stub(dynamicBodyMock, 'getVelY').returns(2);
       
       Batty.DynamicBody.prototype.calculateVelComponents.call(dynamicBodyMock);
       
       expect(dynamicBodyMock.vx).to.be.equal(1);
       expect(dynamicBodyMock.vy).to.be.equal(2);
    });
    test('calcuateSpritePosition', function() {
      var dynamicBodyMock = createDynamicBodyMock();
      
      Batty.DynamicBody.prototype.calculateSpritePosition.call(dynamicBodyMock);
      
      expect(dynamicBodyMock.position.x).to.be.equal(1);
      expect(dynamicBodyMock.position.y).to.be.equal(2);
    });
    teardown(function() {
      PIXI.Sprite.restore();
      PIXI.Sprite.prototype.updateTransform.restore();
    });
  });
});