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
    var callPrototypeMethod = function(klass, method, obj, args) {
      var fn = Batty[klass].prototype[method];
      
      return fn.apply(obj, args);
    };
    var createDynamicBodyObject = function(texture, world, options) {
      var texture = texture || createDefaultTexture(),
          world = world || {},
          options = options || {};
      
      return new Batty.DynamicBody(texture, world, options);
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
        angle: 30,
        width: 100,
        height: 100,
        visible: true,
        world: { width: 0, height: 0 },
        getRadians: function() {},
        getVelX: function() {},
        getVelY: function() {},
        calculateVelComponents: function() {},
        calculateSpritePosition: function() {},
        onUpdateTransformed: function() {},
        onOutOfScreen: function() {},
        updateAngleReflectionHorizontally: function(block) {},
        updateAngleReflectionVertically: function(block) {},
        getIntersectionRect: function(block) {},
        updateVerticalCoordinate: function(block) {},
        updateHorizontalCoordinate: function(block) {},
      };  
      
      return dynamicBodyMock;
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
    test('DynamicBody construtor with default options', function(done) {
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
    test('DynamicBody constructor with non-default options', function(done) {
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
    suite('wallCollide', function() {
      var testWallCollide = function(position, doneCallback) {
        var dynamicBodyMock;

        dynamicBodyMock = createDynamicBodyMock();
        dynamicBodyMock.startAngle = dynamicBodyMock.angle;
        dynamicBodyMock.world.width = 100;
        dynamicBodyMock.world.heigth = 100;
        dynamicBodyMock.position = position;
        
        sinon.spy(dynamicBodyMock, 'calculateVelComponents');
        sinon.spy(dynamicBodyMock, 'onOutOfScreen');
        sinon.spy(dynamicBodyMock, 'updateAngleReflectionVertically');
        sinon.spy(dynamicBodyMock, 'updateAngleReflectionHorizontally');
        
        Batty.DynamicBody.prototype.wallCollide.call(dynamicBodyMock);
      
        doneCallback(dynamicBodyMock);
      };
      test('sprite position exceeds the right boundary of the world', function(done) {
        var doneCallback,
            position;
        
        doneCallback = function(dynamicBodyMock) {
          expect(dynamicBodyMock.updateAngleReflectionVertically.calledOnce).to.be.ok();
          expect(dynamicBodyMock.position.x).to.be.equal(dynamicBodyMock.world.width - dynamicBodyMock.width);
          expect(dynamicBodyMock.calculateVelComponents.calledOnce).to.be.ok();
        
          done();
        };
        position = { x: 100 };
        
        testWallCollide(position, doneCallback);
      });
      test('sprite position exceeds the left boundary of the world', function(done) {
        var doneCallback,
            position;
        
        doneCallback = function(dynamicBodyMock) {
          expect(dynamicBodyMock.updateAngleReflectionVertically.calledOnce).to.be.ok();
          expect(dynamicBodyMock.position.x).to.be.equal(0);
          expect(dynamicBodyMock.calculateVelComponents.calledOnce).to.be.ok();
          
          done();
        };
        position = { x: -1 };
        
        testWallCollide(position, doneCallback);
      });
      test('sprite position exceeds the bottom boundary of the world', function(done) {
        var doneCallback,
            position;
        
        doneCallback = function(dynamicBodyMock) {
          expect(dynamicBodyMock.updateAngleReflectionHorizontally.calledOnce).to.be.ok();
          expect(dynamicBodyMock.position.y).to.be.equal(0);
          expect(dynamicBodyMock.calculateVelComponents.calledOnce).to.be.ok();
          
          done();
        };
        position = { x: 0, y: -1 };
        
        testWallCollide(position, doneCallback);
      });
      test('sprite position exceeds the top boundary of the world and the sprite is visible', function(done) {
        var doneCallback,
            position;
        
        doneCallback = function(dynamicBodyMock) {
          expect(dynamicBodyMock.onOutOfScreen.calledOnce).to.be.ok();
          expect(dynamicBodyMock.calculateVelComponents.notCalled).to.be.ok();
          
          done();
        };
        position = { x: 0, y: 101 };
        
        testWallCollide(position, doneCallback);
      });
    });
    test('updateAngleReflectionHorizontally', function() {
      var dynamicBodyMock = {
        angle: 30
      };
      
      Batty.DynamicBody.prototype.updateAngleReflectionHorizontally.call(dynamicBodyMock);
      
      expect(dynamicBodyMock.angle).to.be.equal(330);
    });
    
    test('updateAngleReflectionVertically', function() {
      var dynamicBodyMock = {
        angle: 30
      };
      
      Batty.DynamicBody.prototype.updateAngleReflectionVertically.call(dynamicBodyMock);
      
      expect(dynamicBodyMock.angle).to.be.equal(150);
    });
    suite('blocksCollide', function() {
      var createDynamicBodyMock = function() {
        return {
          getCollidableBodies: function() {
            return [ { id: 1 }, { id: 2 } ]
          },
          blockCollides: function(block) {
          }
        };
      };
      /**
       * The test doesn't work properly when getCollidableMethod 
       * returns more then two collidable bodies.
       */
      test('no onBlockCollided methods defined', function() {
        var dynamicBodyMock = createDynamicBodyMock(),
            collidableBodies = dynamicBodyMock.getCollidableBodies(),
            blockCollidesStub = sinon.stub(dynamicBodyMock, 'blockCollides');
        
        sinon.spy(dynamicBodyMock, 'getCollidableBodies');
        blockCollidesStub.returns(false);
        blockCollidesStub.withArgs(collidableBodies[1]).returns(true);
        
        Batty.DynamicBody.prototype.blocksCollide.call(dynamicBodyMock);
          
        expect(dynamicBodyMock.getCollidableBodies.calledOnce).to.be.ok();
        expect(blockCollidesStub.returnValues[0]).to.not.be.ok();
        expect(blockCollidesStub.returnValues[1]).to.be.ok();
      });
      test('onBlockCollided method defined', function() {
        var dynamicBodyMock = createDynamicBodyMock(),
            collidableBodies = dynamicBodyMock.getCollidableBodies(),
            blockCollidesStub = sinon.stub(dynamicBodyMock, 'blockCollides');
        
        dynamicBodyMock.onBlockCollided = function(block) {
        };
        
        sinon.spy(dynamicBodyMock, 'onBlockCollided');
        blockCollidesStub.returns(false);
        blockCollidesStub.withArgs(collidableBodies[0]).returns(true);
        
        Batty.DynamicBody.prototype.blocksCollide.call(dynamicBodyMock);
        
        expect(dynamicBodyMock.onBlockCollided.calledOnce).to.be.ok();
        expect(dynamicBodyMock.onBlockCollided.calledWith(collidableBodies[0])).to.be.ok();
        expect(dynamicBodyMock.onBlockCollided.calledWith(collidableBodies[1])).to.not.be.ok();
      });
    });
    suite('blockCollides', function() {
      var createDynamicBodyMock = function(visible) {
        return {
          visible: visible,
          hitTestBlock: function() { return true; }
        };
      };
      var testBlockCollides = function(options) {
        var options = options || {},
            bodyVisible = options.bodyVisible == undefined ? true : options.bodyVisible,
            blockVisible = options.blockVisible == undefined ? true : options.blockVisible,
            doneCallback = options.doneCallback,
            hitTestReturnValue = options.hitTestReturnValue == undefined ? true : options.hitTestReturnValue,
            blockMock = { visible: blockVisible },
            dynamicBodyMock = createDynamicBodyMock(bodyVisible),
            result;
        
        sinon.stub(dynamicBodyMock, 'hitTestBlock').returns(hitTestReturnValue);
        
        result = Batty.DynamicBody.prototype.blockCollides.call(dynamicBodyMock, blockMock);
        
        expect(dynamicBodyMock.hitTestBlock.calledOnce).to.be.ok();
        expect(dynamicBodyMock.hitTestBlock.calledWith(blockMock)).to.be.ok();
        
        doneCallback(result);
      };
      test('returns true when body and block are visible and the block hits the body', function() {
        var doneCallback;
            
        doneCallback = function(result) {
          expect(result).to.be.ok();
        };
        
        testBlockCollides({ doneCallback: doneCallback });
      });
      test('returns false when body is not visible', function() {
        var bodyVisible = false,
            doneCallback;
         
        doneCallback = function(result) {
          expect(result).to.not.be.ok();
        };
        
        testBlockCollides({ bodyVisible: bodyVisible, doneCallback: doneCallback });
      });
      test('returns false when block is not visible', function() {
        var blockVisible = false,
            doneCallback;
         
        doneCallback = function(result) {
          expect(result).to.not.be.ok();
        };
        
        testBlockCollides({ blockVisible: blockVisible, doneCallback: doneCallback });
      });
      test('returns false when given block object is not hit the body object', function() {
        var doneCallback;
        
        doneCallback = function(result) {
          expect(result).to.not.be.ok();
        };
        
        testBlockCollides({ hitTestReturnValue: false, doneCallback: doneCallback });
      });
    });
    suite('hitTestBlock', function() {
      var createBodyMock = function(x, y) {
        return {
          height: 100,
          position: { x: x, y: y },
          width: 100
        }
      };
      var testHitTestBlock = function(bodyX, bodyY, blockX, blockY, doneCallback) {
        var dynamicBodyMock = createBodyMock(bodyX, bodyY),
            blockMock = createBodyMock(blockX, blockY),
            result;
            
        result = Batty.DynamicBody.prototype.hitTestBlock.call(dynamicBodyMock, blockMock);
        
        if (doneCallback) {
          doneCallback(result);
        }
      };
      test('when the dynamic body object is left of the block object', function(done) {
        testHitTestBlock(0, 0, 101, 0, function(result) {
          expect(result).to.not.be.ok();
           
          done();
        });
      });      
      test('when the dynamic body object is right of the block object', function(done) {
        testHitTestBlock(101, 0, 0, 0, function(result) {
          expect(result).to.not.be.ok();
          
          done();
        });
      });      
      test('when the dynamic body object is top of the block object', function(done) {
        testHitTestBlock(0, 0, 0, 101, function(result) {
          expect(result).to.not.be.ok();
          
          done();
        });
      });
      test('when the dynamic body object is bottom of the block object', function(done) {
        testHitTestBlock(0, 101, 0, 0, function(result) {
          expect(result).to.not.be.ok();
          
          done();
        });
      });      
      test('when the dynamic body hits the block object from the left', function(done) {
        testHitTestBlock(0, 0, 100, 0, function(result) {
          expect(result).to.be.ok();
          
          done();
        });
      });
      test('when the dynamic body hits the block object from the right', function(done) {
        testHitTestBlock(100, 0, 0, 0, function(result) {
          expect(result).to.be.ok();
          
          done();
        });
      });
      test('when the dynamic body hits the block object from the top', function(done) {
        testHitTestBlock(0, 0, 0, 100, function(result) {
          expect(result).to.be.ok();
          
          done();
        });
      });
      test('when the dynamic body hits the block object from the bottom', function(done) {
        testHitTestBlock(0, 100, 0, 0, function(result) {
          expect(result).to.be.ok();
          
          done();
        });
      });
    });
    suite('blockCollide', function() {
      var testBlockCollide = function(dynamicBodyMock, doneCallback) {
        var block = {};
        
        sinon.spy(dynamicBodyMock, 'getRadians');
        sinon.spy(dynamicBodyMock, 'getVelX');
        sinon.spy(dynamicBodyMock, 'getVelY');
        
        Batty.DynamicBody.prototype.blockCollide.call(dynamicBodyMock, block);
        
        expect(dynamicBodyMock.getIntersectionRect.calledOnce).to.be.ok();
        expect(dynamicBodyMock.getIntersectionRect.calledWith(block)).to.be.ok();
        expect(dynamicBodyMock.getRadians.calledOnce).to.be.ok();
        expect(dynamicBodyMock.getVelX.calledOnce).to.be.ok();
        expect(dynamicBodyMock.getVelY.calledOnce).to.be.ok();
        
        doneCallback(block);
      };
      test('when intersection width is greater or equal to intersection height', function(done) {
        var dynamicBodyMock = createDynamicBodyMock();
        
        sinon.stub(dynamicBodyMock, 'getIntersectionRect').returns({ height: 1, width: 1 });
        sinon.spy(dynamicBodyMock, 'updateVerticalCoordinate');
        sinon.spy(dynamicBodyMock, 'updateAngleReflectionHorizontally');
        
        testBlockCollide(dynamicBodyMock, function(block) {
          expect(dynamicBodyMock.updateVerticalCoordinate.calledOnce).to.be.ok();
          expect(dynamicBodyMock.updateVerticalCoordinate.calledWith(block)).to.be.ok();
          expect(dynamicBodyMock.updateAngleReflectionHorizontally.calledOnce).to.be.ok();
          
          done();
        });
      });
      test('when intersection width is less then intersection height', function(done) {
        var dynamicBodyMock = createDynamicBodyMock();
        
        sinon.stub(dynamicBodyMock, 'getIntersectionRect').returns({ height: 1, width: 0 });
        sinon.spy(dynamicBodyMock, 'updateHorizontalCoordinate');
        sinon.spy(dynamicBodyMock, 'updateAngleReflectionVertically');
        
        testBlockCollide(dynamicBodyMock, function(block) {
          expect(dynamicBodyMock.updateHorizontalCoordinate.calledOnce).to.be.ok();
          expect(dynamicBodyMock.updateHorizontalCoordinate.calledWith(block)).to.be.ok();
          expect(dynamicBodyMock.updateAngleReflectionVertically.calledOnce).to.be.ok();
          
          done();
        });
      });
    });
    test.skip('updateVerticalCoordinate', function() {
    });
    test.skip('updateHorizontalCoordinate', function() {
    });
    test('getIntersectionRect', function() {
      var dynamicBodyMock = {
            position: { x: 0, y: 0 },
            height: 30,
            width: 20,
            getMaxIntersection: function() {}
          },
          blockMock = {
            position: { x: 10, y: 10 },
            height: 40,
            width: 30          
          },
          result,
          getMaxIntersectionFirstCallArgs,
          getMaxIntersectionSecondCallArgs;
      
      sinon.stub(dynamicBodyMock, 'getMaxIntersection').returns(10);
    
      result = callPrototypeMethod('DynamicBody', 'getIntersectionRect', dynamicBodyMock, [ blockMock ]);
      
      getMaxIntersectionFirstCallArgs = dynamicBodyMock.getMaxIntersection.firstCall.args;
      getMaxIntersectionSecondCallArgs = dynamicBodyMock.getMaxIntersection.secondCall.args;
      
      expect(result.height).to.be.equal(10);
      expect(result.width).to.be.equal(10);
      expect(dynamicBodyMock.getMaxIntersection.callCount).to.be.equal(2);
      expect(getMaxIntersectionFirstCallArgs[0]).to.be.equal(dynamicBodyMock.position.x);
      expect(getMaxIntersectionFirstCallArgs[1]).to.be.equal(dynamicBodyMock.position.x + dynamicBodyMock.width);
      expect(getMaxIntersectionFirstCallArgs[2]).to.be.equal(blockMock.position.x);
      expect(getMaxIntersectionFirstCallArgs[3]).to.be.equal(blockMock.position.x + blockMock.width);
      expect(getMaxIntersectionSecondCallArgs[0]).to.be.equal(dynamicBodyMock.position.y);
      expect(getMaxIntersectionSecondCallArgs[1]).to.be.equal(dynamicBodyMock.position.y + dynamicBodyMock.height);
      expect(getMaxIntersectionSecondCallArgs[2]).to.be.equal(blockMock.position.y);
      expect(getMaxIntersectionSecondCallArgs[3]).to.be.equal(blockMock.position.y + blockMock.height);
    });
    test.skip('getMaxIntersection', function() {
    }); 
    teardown(function() {
      PIXI.Sprite.restore();
      PIXI.Sprite.prototype.updateTransform.restore();
    });
  });
  suite('Circle', function() {
    test('Circle constructor', function() {
      var texture = {},
          worldMock = {},
          options = {},
          circle;
          
      circle = new Batty.Circle(texture, world, options);
      
      expect(circle instanceof Batty.DynamicBody).to.be.ok();
      expect(circle.type).to.be.equal('circle');
    });
    test.skip('getCollidableBodies', function() {
    });
    test.skip('onUpdateTransformed', function() {
    });
  });
});