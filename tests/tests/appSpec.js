define([ 'batty', 'pixi', 'modernizr' ], function(Batty, PIXI, Modernizr) {
  var Batty = Batty(window);
  var callPrototypeMethod = function(klass, method, obj, args) {
    var fn = Batty[klass].prototype[method];
    
    return fn.apply(obj, args);
  };
  var createDefaultTexture = function() {
    return PIXI.TextureCache[Batty.World.prototype.BALL_TEXTURE_NAME];
  };
  var loadAssets = function(assets, completeCallback) {
    var assetLoader = new PIXI.AssetLoader(assets);
    
    assetLoader.onComplete = function() {
      completeCallback();
    };
 
    assetLoader.load();
  };
  suite('DynamicBody', function() {
    setup(function(done) {
      var assets = [ 'base/SpriteSheet.json' ],
          completeCallback = function() {
            sinon.spy(PIXI, 'Sprite');
            sinon.stub(PIXI.Sprite.prototype, 'updateTransform');
            
            done();
          };
   
      loadAssets(assets, completeCallback);
    });    
    var getRadians = function(angle) {
      return angle * Math.PI / 180;
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
      expect(dynamicBody.width).to.equal(texture.frame.width);
      expect(dynamicBody.height).to.equal(texture.frame.height);
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
      var dynamicBodyMock = createDynamicBodyMock(),
          collidableBodies;
      
      dynamicBodyMock.world.blocks = [ 1, 2 ];
      
      collidableBodies = callPrototypeMethod('DynamicBody', 'getCollidableBodies', dynamicBodyMock);
      
      expect(collidableBodies).to.be.an('array');
      expect(collidableBodies).to.have.length(2);
      expect(collidableBodies).to.contain(1);
      expect(collidableBodies).to.contain(2);
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
    suite('updateVerticalCoordinate', function() {
      test('when y coordinate is greater then or equal to y coordinate of the block center', function() {
        var blockMock = { position: { y: 0 }, height: 10 },
            dynamicBodyMock = { position: { y: blockMock.position.y + blockMock.height / 2 }};
        
        callPrototypeMethod('DynamicBody', 'updateVerticalCoordinate', dynamicBodyMock, [ blockMock ]);
        
        expect(dynamicBodyMock.position.y).to.be(blockMock.position.y + blockMock.height);
      });
      test('when y coordinate is less then y coordinate of the block center', function() {
        var blockMock = { position: { y: 0 }, height: 10 },
            dynamicBodyMock = { position: { y: 0 }, height: 10 };
        
        callPrototypeMethod('DynamicBody', 'updateVerticalCoordinate', dynamicBodyMock, [ blockMock ]);
        
        expect(dynamicBodyMock.position.y).to.be(blockMock.position.y - dynamicBodyMock.height);
      });
    });
    suite('updateHorizontalCoordinate', function() {
      test('when x coordinate is less then x coordinate of the block', function() {
        var blockMock = { position: { x: 10 } },
            dynamicBodyMock = { position: { x: 0 }, width: 10 };
        
        callPrototypeMethod('DynamicBody', 'updateHorizontalCoordinate', dynamicBodyMock, [ blockMock ]);
        
        expect(dynamicBodyMock.position.x).to.be(blockMock.position.x - dynamicBodyMock.width);
      });
      test('when x coordinate is greater then or equal to x coordinate of the block', function() {
        var blockMock = { position: { x: 0 }, width: 10 },
            dynamicBodyMock = { position: { x: 0 } };
        
        callPrototypeMethod('DynamicBody', 'updateHorizontalCoordinate', dynamicBodyMock, [ blockMock ]);
        
        expect(dynamicBodyMock.position.x).to.be(blockMock.position.x + blockMock.width);
      });
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
    test('onUpdateTransformed', function() {
      var dynamicBodyMock = {
        wallCollide: function() {},
        blocksCollide: function() {}
      };
      
      sinon.spy(dynamicBodyMock, 'wallCollide');
      sinon.spy(dynamicBodyMock, 'blocksCollide');
      
      callPrototypeMethod('DynamicBody', 'onUpdateTransformed', dynamicBodyMock);
      
      expect(dynamicBodyMock.wallCollide.callCount).to.be(1);
      expect(dynamicBodyMock.blocksCollide.callCount).to.be(1);
    });
    teardown(function() {
      PIXI.Sprite.restore();
      PIXI.Sprite.prototype.updateTransform.restore();
    });
  });
  
  suite('Circle', function() {
    test('constructor', function() {
      var texture = createDefaultTexture(),
          worldMock = {},
          options = {},
          circle;
          
      circle = new Batty.Circle(texture, worldMock, options);
      
      expect(circle instanceof Batty.DynamicBody).to.be.ok();
      expect(circle.type).to.be.equal('circle');
    });
    test('getCollidableBodies', function() {
      var circleMock = { world: { blocks: [] } },
          blocks;
      
      blocks = callPrototypeMethod('Circle', 'getCollidableBodies', circleMock);
      
      expect(blocks).to.be.eql(circleMock.world.blocks);
    });
    suite('onBlockCollided', function() {
      var createCircleMock = function() {
        return {
          blockCollide: function() {},
          world: {
            removeBlock: function() {}
          }
        }
      };
      var testBlock = function(circleMock, blockMock, assertCallback) {
        sinon.spy(circleMock, 'blockCollide');
        sinon.spy(circleMock.world, 'removeBlock');
        
        callPrototypeMethod('Circle', 'onBlockCollided', circleMock, [ blockMock ]);
        
        expect(circleMock.blockCollide.callCount).to.be.equal(1);
        expect(circleMock.blockCollide.calledWith(blockMock)).to.be.ok();
        expect(circleMock.world.removeBlock.callCount).to.be.equal(1);
        expect(circleMock.world.removeBlock.calledWith(blockMock)).to.be.ok();
        
        if (assertCallback) {
          assertCallback(circleMock);
        };
      };
      test('when block is of block type', function() {
        var circleMock = createCircleMock(),
            blockMock = { type: 'block' };
        
        testBlock(circleMock, blockMock);
      });
      test('when block is of block type and has gift', function(done) {
        var circleMock = createCircleMock(),
            blockMock = { 
              type: 'block', 
              gift: { play: sinon.spy() } 
            },
            assertCallback;
            
        circleMock.world.addGift = function() {};
        
        sinon.spy(circleMock.world, 'addGift');
        
        assertCallback = function(circleMock) {
          expect(circleMock.world.addGift.callCount).to.be.equal(1);
          expect(circleMock.world.addGift.calledWith(blockMock.gift)).to.be.ok();
          expect(blockMock.gift.play.callCount).to.be(1);
          
          done();
        };
        
        testBlock(circleMock, blockMock, assertCallback);
      });
      test('when block is of slider type', function() {
        var circleMock = createCircleMock(),
            blockMock = { type: 'slider' };
        
        sinon.spy(circleMock, 'blockCollide');
        
        callPrototypeMethod('Circle', 'onBlockCollided', circleMock, [ blockMock ]);
        
        expect(circleMock.blockCollide.callCount).to.be.equal(1);
        expect(circleMock.blockCollide.calledWith(blockMock)).to.be.ok();
      });
    });
    test('onOutOfScreen', function() {
      var circleMock = { 
        world: {
          removeCircle: function() {}
        }
      };
      
      sinon.spy(circleMock.world, 'removeCircle');
      
      callPrototypeMethod('Circle', 'onOutOfScreen', circleMock, [ circleMock ]);
      
      expect(circleMock.world.removeCircle.callCount).to.be(1);
      expect(circleMock.world.removeCircle.calledWith(circleMock)).to.be.ok();
    });
  });
  suite('Bullet', function() {
    suite('wallCollide', function() {
      var bulletMock;
      
      setup(function() {
        bulletMock = { 
          position: { y: 0 }, 
          world: {
            removeBullet: function() {}
          }
        };
        sinon.spy(bulletMock.world, 'removeBullet');
      });
      
      test('when y coordinate less then 0', function() {
        bulletMock.position.y = -1;
        
        callPrototypeMethod('Bullet', 'wallCollide', bulletMock);
        
        expect(bulletMock.world.removeBullet.callCount).to.be(1);
        expect(bulletMock.world.removeBullet.calledWith(bulletMock)).to.be.ok();
      });
      test('when y is greater then 0', function() {
        callPrototypeMethod('Bullet', 'wallCollide', bulletMock);
        
        expect(bulletMock.world.removeBullet.notCalled).to.be.ok();
      });
    });
    suite('onBlockCollided', function() {
      var blockMock, bulletMock;
      
      setup(function() {
        blockMock = { type: 'block' },
        bulletMock = {
          world: {
            removeBlock: function() {},
            removeBullet: function() {}
          }
        };
        
        sinon.spy(bulletMock.world, 'removeBlock');
        sinon.spy(bulletMock.world, 'removeBullet');
      });
      
      test('when the block argument is of the block type', function() {
        callPrototypeMethod('Bullet', 'onBlockCollided', bulletMock, [ blockMock ]);
        
        expect(bulletMock.world.removeBlock.callCount).to.be(1);
        expect(bulletMock.world.removeBlock.calledWith(blockMock)).to.be.ok();
        expect(bulletMock.world.removeBullet.callCount).to.be(1);
        expect(bulletMock.world.removeBullet.calledWith(bulletMock)).to.be.ok();
      });
      test('when the block argument is not of the block type', function() {
        blockMock.type = 0;
        
        callPrototypeMethod('Bullet', 'onBlockCollided', bulletMock, [ blockMock ]);
        
        expect(bulletMock.world.removeBlock.notCalled).to.be.ok();
        expect(bulletMock.world.removeBullet.notCalled).to.be.ok();  
      });
    });
  });
  suite('Gift', function() {
    test('default constructor', function() {
      var textures = [ createDefaultTexture() ],
          world = {},
          gift;
          
      gift = new Batty.Gift(textures, world);
      
      expect(gift.isActive).to.not.be.ok();
      expect(gift.isDestroying).to.not.be.ok();
      expect(gift.angle).to.be.equal(90);
      expect(gift.textures).to.be.equal(textures);
      expect(gift.animationSpeed).to.be.equal(1);
      expect(gift.loop).to.be.ok();
      expect(gift.onComplete).to.be.equal(null);
      expect(gift.currentFrame).to.be.equal(0);
      expect(gift.playing).to.not.be.ok();
      expect(gift.type).to.be.equal('gift');
    });
    test('options constructor', function() {
      var textures = [ createDefaultTexture() ],
          world = {},
          options = { 
            angle: 30,
            action: function() {},
            animationSpeed: 2,
            loop: false,
            onComplete: function() {},
            currentFrame: 1,
            playing: true
          },
          gift;
          
      gift = new Batty.Gift(textures, world, options);
      
      expect(gift.isActive).to.not.be.ok();
      expect(gift.isDestroying).to.not.be.ok();
      expect(gift.angle).to.be.equal(options.angle);
      expect(gift.textures).to.be.equal(textures);
      expect(gift.animationSpeed).to.be.equal(options.animationSpeed);
      expect(gift.loop).to.be.equal(options.loop);
      expect(gift.onComplete).to.be.equal(options.onComplete);
      expect(gift.currentFrame).to.be.equal(options.currentFrame);
      expect(gift.playing).to.be.equal(options.playing);
      expect(gift.type).to.be.equal('gift');
    });
    suite('onUpdateTransformed', function() {
      var giftMock;
      
      setup(function() {
        giftMock = {
          visible: true,
          blocksCollide: function() {}
        };
        sinon.spy(giftMock, 'blocksCollide');
        sinon.stub(PIXI.MovieClip.prototype, 'updateTransform');
      });
      
      test('when gift is visible', function() {
        callPrototypeMethod('Gift', 'onUpdateTransformed', giftMock);
        
        expect(giftMock.blocksCollide.callCount).to.be(1);
        expect(PIXI.MovieClip.prototype.updateTransform.callCount).to.be(1);
      });
      
      test('when gift is not visible', function() {
        giftMock.visible = false;
      
        callPrototypeMethod('Gift', 'onUpdateTransformed', giftMock);
        
        expect(giftMock.blocksCollide.notCalled).to.be.ok();
        expect(PIXI.MovieClip.prototype.updateTransform.notCalled).to.be.ok();
      });
      
      teardown(function() {
        PIXI.MovieClip.prototype.updateTransform.restore();
      });
    });
    test('getCollidableBodies', function() {
      var giftMock = {
            world: { slider: {} }
          },
          collidableBodies;
      
      collidableBodies = callPrototypeMethod('Gift', 'getCollidableBodies', giftMock);
      
      expect(collidableBodies).to.have.length(1);
      expect(collidableBodies[0]).to.be.eql(giftMock.world.slider);
    });
    suite('onBlockCollided', function() {
      var createGiftMock = function() {
       var mock = {
          visible: true,
          updateActiveGiftActionExpireTime: function() {},
          executeAction: function() {}
        };
        
        sinon.spy(mock, 'updateActiveGiftActionExpireTime');
        sinon.spy(mock, 'executeAction');
        
        return mock;
      };
      test('when block argument is of slider type', function() {
        var giftMock = createGiftMock(),
            blockMock = { type: 'slider' };
            
        callPrototypeMethod('Gift', 'onBlockCollided', giftMock, [ blockMock ]);
        
        expect(giftMock.visible).to.not.be.ok();
        expect(giftMock.updateActiveGiftActionExpireTime.callCount).to.be.equal(1);
        expect(giftMock.executeAction.callCount).to.be.equal(1);
      });
      test('when block argument is not of slider type', function() {
        var giftMock = createGiftMock(),
            blockMock = { type: void 0 };
        
        callPrototypeMethod('Gift', 'onBlockCollided', giftMock, [ blockMock ]);
        
        expect(giftMock.visible).to.be.ok();
        expect(giftMock.updateActiveGiftActionExpireTime.notCalled).to.be.ok();
        expect(giftMock.executeAction.notCalled).to.be.ok();
      });
    });
    suite('updateActiveGiftActionExpireTime', function() {
      var createGiftMock = function() {
            var giftMock = {
                  constructor: { name: 'test' },
                  actionExpireTime: 10,
                  world: {
                    gifts: [],
                    getGifts: function() { return []; }
                  }
                };
            
            sinon.stub(giftMock.world, 'getGifts');
            
            return giftMock;
          };
      var testAddActionExpireTime = function(constructorName, thereAreNoGifts, callback) {
        var giftMock = createGiftMock(),
            giftMock2 = { 
              constructor: { name: constructorName },
              actionExpireTime: 10 
            };
        
        giftMock.world.getGifts.returns(thereAreNoGifts ? [] : [ giftMock2 ]);
        
        callPrototypeMethod('Gift', 'updateActiveGiftActionExpireTime', giftMock);
        
        expect(giftMock.world.getGifts.callCount).to.be.ok();
        expect(giftMock.world.getGifts.calledWith(giftMock.constructor.name, true)).to.be.ok();
        
        callback(giftMock2);
      };
      test('when gift does not have action expire time', function() {
        var giftMock = createGiftMock();
        
        giftMock.actionExpireTime = null;
        
        callPrototypeMethod('Gift', 'updateActiveGiftActionExpireTime', giftMock);
        
        expect(giftMock.world.getGifts.notCalled).to.be.ok();
      });
      test('when gift has action expire time but there are no gifts of specified type', function(done) {
        var doneCallback = function(existingGiftMock) {
              expect(existingGiftMock.actionExpireTime).to.be(10);
              done();
            };
            
        testAddActionExpireTime('test2', true, doneCallback);
      });
      
      test('when gift has action expire time and there are gifts of specified type', function(done) {
        var doneCallback = function(existingGiftMock) {
              expect(existingGiftMock.actionExpireTime).to.be(20);
              done();
            };
            
        testAddActionExpireTime('test2', false, doneCallback);
      });
    });
    suite('executeAction', function() {
      var giftMock;
      
      setup(function() {
        giftMock = {
          isActive: false,
          action: function() {}
        };
        sinon.spy(giftMock, 'action');
      });
      
      test('when gift has an action', function() {
        callPrototypeMethod('Gift', 'executeAction', giftMock);
        
        expect(giftMock.isActive).to.be.ok();
        expect(giftMock.action.callCount).to.be(1);
      });
      test('when gift has not an action', function() {
        giftMock.action = null;
        
        callPrototypeMethod('Gift', 'executeAction', giftMock);
        
        expect(giftMock.isActive).to.not.be.ok();
      });      
    });
    test('onOutOfScreen', function() {
      var giftMock = {
            world: { removeGift: function() {} }
          };
      
      sinon.spy(giftMock.world, 'removeGift');
      
      callPrototypeMethod('Gift', 'onOutOfScreen', giftMock, [ giftMock ]);
      
      expect(giftMock.world.removeGift.callCount).to.be(1);
      expect(giftMock.world.removeGift.calledWith(giftMock)).to.be.ok();
    });
  });
  suite('Balls3Gift', function() {
    suite.skip('constructor', function() {
      var originalPixiTextureCache,
          Gift;
      setup(function() {
        Batty.Gift = sinon.stub().returns(true);
        Gift = sinon.stub().returns(true);
        originalPixiTextureCache = PIXI.TextureCache;
        PIXI.TextureCache = {
          '3balls0.png': {},
          '3balls1.png': {}
        };
      });
      test('with default options', function() {
        var worldMock = {},
            options = {},
            gift;
            
        gift = new Batty.Balls3Gift();
        
        expect(true).to.ok();
      });
      teardown(function() {
        Gift.restore();
        PIXI.TextureCache = originalPixiTextureCache;
      });
    });
    test('action', function() {
      var circleMock = {},
          giftMock = {
            ballsCount: 1,
            isActive: true,
            world: {
              slider: { x: 10, y: 10 },
              circleTexture: { height: 10 },
              createCircle: function() { return 0; },
              addCircle: function() {}
            }
          };
      
      sinon.spy(giftMock.world, 'createCircle');
      
      callPrototypeMethod('Balls3Gift', 'action', giftMock);
      
      expect(giftMock.isActive).to.not.be.ok();
      expect(giftMock.world.createCircle.callCount).to.be(1);
    });
  });
  suite('HandGift', function() {
    test.skip('default constructor', function() {
    });
    test.skip('non-default constructor', function() {
    });
    suite('sliderCrossSide', function() {
      test('when there is a catched circle', function() {
        var giftMock = {
              catchedCircle: { vel: 10 }
            };
            
        callPrototypeMethod('HandGift', 'sliderCrossedSide', giftMock);
        
        expect(giftMock.catchedCircle.vel).to.be(0);
      });
    });
    suite('releaseCircle', function() {
      var giftMock, circleMock;
      
      setup(function() {
        circleMock = {
          angle: 0,
          position: { y: 0 },
          height: 3,
          vel: 0,
          onUpdateTransformed: null,
        },
        giftMock = {
          previousAngle: 1,
          previousVel: 4,
          previousOnUpdateTransformed: function() {},
          world: {
            slider: { position: { y: 2 } }
          },
          catchedCircle: circleMock
        };
      });
      
      test('when there is a catched circle', function() {
        callPrototypeMethod('HandGift', 'releaseCircle', giftMock);
        
        expect(circleMock.angle).to.be(giftMock.previousAngle);
        expect(circleMock.position.y).to.be(giftMock.world.slider.position.y - circleMock.height - 20);
        expect(circleMock.vel).to.be(giftMock.previousVel);
        expect(circleMock.onUpdateTransformed).to.be.eql(circleMock.onUpdateTransformed);
        expect(giftMock.catchedCircle).to.be(null);
      });
      test('when there is no catched circle', function() {
        giftMock.catchedCircle = undefined;
        
        callPrototypeMethod('HandGift', 'releaseCircle', giftMock);
        
        expect(giftMock.catchedCircle).to.be(undefined);
      });
    });
    suite('sliderKeyDownAction', function() {
      var giftMock, circleMock, mainTest;
      
      mainTest = function(keyCode, doneCallback) {
        var eventMock = typeof(keyCode) == 'Function' ? null : { keyCode: keyCode },
            doneCallback = doneCallback || keyCode;
        
        callPrototypeMethod('HandGift', 'sliderKeyDownAction', giftMock, [ eventMock ]);
        doneCallback();
      };
      
      setup(function() {
        circleMock = { vel: 0 };
        giftMock = {
          world: { slider: { vel: 1 } },
          catchedCircle: circleMock,
          releaseCircle: sinon.stub()
        };
      });
      
      
      test('when there is no catched circle', function() {
        giftMock.catchedCircle = null;
        mainTest(function() {
          expect(circleMock.vel).to.be(0);
          expect(giftMock.releaseCircle.notCalled).to.be.ok();
        });
      });
      test('when there is a catched circle and key down code is equal 37', function() {
        mainTest(37, function() {
          expect(giftMock.catchedCircle.vel).to.be(giftMock.world.slider.vel);
        });
      });
      test('when there is a catched circle and key down code is equal 39', function() {
        mainTest(39, function() {
          expect(giftMock.catchedCircle.vel).to.be(giftMock.world.slider.vel);
        });
      });
      test('when there is a catched circle and key down code is equal 32', function() {
        mainTest(32, function() {
          expect(giftMock.releaseCircle.callCount).to.be(1);
        });
      });
      test('when there is a catched circle but key down code is neither 32, 37 or 39', function() {
        mainTest(-1, function() {
          expect(circleMock.vel).to.be(0);
          expect(giftMock.releaseCircle.notCalled).to.be.ok();
        });
      });
    });
    suite('sliderKeyUpAction', function() {
      var giftMock, circleMock;
      
      setup(function() {
        circleMock = { vel: 1 };
        giftMock = {
          catchedCircle: circleMock
        };
      });
      
      test('when there is catched circle', function() {
        callPrototypeMethod('HandGift', 'sliderKeyUpAction', giftMock);
        
        expect(circleMock.vel).to.be(0);
      });
      
      test('when there is no catched circle', function() {
        giftMock.catchedCircle = null;
        
        callPrototypeMethod('HandGift', 'sliderKeyUpAction', giftMock);
        
        expect(circleMock.vel).to.be(1);
      });
    });
    test('action', function(done) {
      var sliderGetCollidableBodies = function() {},
          sliderOnBlockCollided = function() {},
          giftMock = {
            actionExpireTime: 0,
            sliderKeyDownActionRef: function() {},
            sliderKeyUpActionRef: function() {},
            destroy: sinon.stub(),
            world: { 
              slider: {
                addAction: sinon.stub(),
                getCollidableBodies: sliderGetCollidableBodies,
                onBlockCollided: sliderOnBlockCollided
              } 
            }
          };
      
      callPrototypeMethod('HandGift', 'action', giftMock);
      
      setTimeout(function() {
        var slider = giftMock.world.slider;
        
        expect(giftMock.lastTimeActionCalled).not.to.be(undefined);
        expect(giftMock.catchedCircle).to.be(null);
        expect(giftMock.previousGetCollidableBodies).to.be.eql(sliderGetCollidableBodies);
        expect(giftMock.previousOnBlockCollided).to.be.eql(sliderOnBlockCollided);
        expect(slider.getCollidableBodies).to.be.a(Function);
        expect(slider.addAction.callCount).to.be(2);
        expect(slider.addAction.args[0][0]).to.be(Batty.Slider.KEY_DOWN);
        expect(slider.addAction.args[0][1]).to.be.eql(giftMock.sliderKeyDownActionRef);
        expect(slider.addAction.args[1][0]).to.be(Batty.Slider.KEY_UP);
        expect(slider.addAction.args[1][1]).to.be.eql(giftMock.sliderKeyUpActionRef);
        
        done();
      }, 0);      
    });
    suite('destroy', function() {
      var giftMock;
      
      setup(function() {
        giftMock = {
          lastTimeActionCalled: 0,
          actionExpireTime: 0,
          world: {
            slider: {
              KEY_DOWN: 'keydown',
              KEY_UP: 'keyup',
              removeAction: sinon.spy()
            }
          },
          sliderKeyDownActionRef: function() {},
          sliderKeyUpActionRef: function() {},
          previousGetCollidableBodies: function() {},
          previousOnBlockCollided: function() {},
          releaseCircle: sinon.spy()
        };
      });
      
      test('when action is expired and previousGetCollidableBodies callback exists', function() {
        var slider = giftMock.world.slider;
      
        callPrototypeMethod('HandGift', 'destroy', giftMock);
        
        expect(giftMock.isDestroying).to.be(true);
        expect(giftMock.isActive).to.be(false);
        expect(giftMock.releaseCircle.callCount).to.be(1);
        expect(slider.getCollidableBodies).to.be.eql(giftMock.previousGetCollidableBodies);
        expect(slider.onBlockCollided).to.be.eql(giftMock.previousOnBlockCollided);
        expect(slider.removeAction.callCount).to.be(2);
        expect(slider.removeAction.firstCall.calledWith(slider.KEY_DOWN, giftMock.sliderKeyDownActionRef)).to.be.ok();
        expect(slider.removeAction.secondCall.calledWith(slider.KEY_UP, giftMock.sliderKeyUpActionRef)).to.be.ok();
      });
      test('when action is expired and previousGetCollidableBodies callback does not exist', function() {
        var slider = giftMock.world.slider;
        
        giftMock.previousGetCollidableBodies = null;
      
        callPrototypeMethod('HandGift', 'destroy', giftMock);
        
        expect(giftMock.isDestroying).to.be(true);
        expect(giftMock.isActive).to.be(false);
        expect(giftMock.releaseCircle.notCalled).to.be.ok();
        expect(slider.getCollidableBodies).to.be(undefined);
        expect(slider.onBlockCollided).to.be(undefined);
        expect(slider.removeAction.callCount).to.be(0);
      });
    });
  });
  suite('GunGift', function() {
    setup(function() {
      sinon.stub(window, 'setTimeout');
    });
    
    suite('sliderKeyDownAction', function() {
      var giftMock;

      setup(function() {
        giftMock = {
          keyDownFired: false,
          lastTimeKeyDownFired: 0,
          delay: 0,
          requestId: -1,
          fireBullet: function() {}
        };
        
        sinon.stub(window, 'requestAnimationFrame').returns(1);
      });
      
      test('when the currentTime minus lastTimeKeyDownFired is greater than the delay and keyDownFired is false', function() {
        callPrototypeMethod('GunGift', 'sliderKeyDownAction', giftMock);
        
        expect(giftMock.lastTimeKeyDownFired).to.be.above(0);
        expect(giftMock.keyDownFired).to.be(true);
        expect(giftMock.requestId).to.be(1);
        expect(window.requestAnimationFrame.callCount).to.be(1);
      });
      test('when the currentTime minus lastTimeKeyDownFired is greater than the delay and keyDownFired is true', function() {
        giftMock.keyDownFired = true;
        
        callPrototypeMethod('GunGift', 'sliderKeyDownAction', giftMock);
        
        expect(giftMock.lastTimeKeyDownFired).to.be.above(0);
        expect(giftMock.requestId).to.be(-1);
      });
      test('when the currentTime minus lastTimeKeyDownFired is less than the delay', function() {
        giftMock.delay = Number.MAX_INT;
        
        callPrototypeMethod('GunGift', 'sliderKeyDownAction', giftMock);
        
        expect(giftMock.lastTimeKeyDownFired).to.be(0);
        expect(giftMock.keyDownFired).to.be(false);
        expect(giftMock.requestId).to.be(-1);
        
      });
      
      teardown(function() {
        window.requestAnimationFrame.restore();
      });
    });
    suite('sliderKeyUpAction', function() {
      var giftMock;

      setup(function() {
        giftMock = {
          keyDownFired: false,
          world: {
            slider: {
              keysMap: {}
            }
          }
        };
      });
      
      test('when keysMap has key with value 32', function() {
        giftMock.world.slider.keysMap[32] = true;
        
        callPrototypeMethod('GunGift', 'sliderKeyUpAction', giftMock);
        
        expect(giftMock.keyDownFired).to.be(true);
      });
      
      test('when keysMap has key with value 32', function() {
        delete giftMock.world.slider.keysMap[32];
        
        callPrototypeMethod('GunGift', 'sliderKeyUpAction', giftMock);
        
        expect(giftMock.keyDownFired).to.be(false);
      });
    });
    suite('fireBullet', function() {
      var giftMock;
      
      setup(function() {
        giftMock = {
          lastTimeBulletFired: 0,
          delay: 0,
          requestId: -1,
          keyDownFired: false,
          fireBullet: function() {},
          world: {
            slider: { 
              x: 1,
              y: 2,
              width: 20,
              height: 5,
              keysMap: {} 
            },
            createBullet: sinon.spy(),
            addBullet: sinon.spy()
          }
        };
              
        sinon.stub(window, 'requestAnimationFrame').returns(1);
        sinon.stub(window, 'cancelAnimationFrame');
      });
      
      var testFireBullet = function(giftMock, requestId, doneCallback, options) {
          var options = options || {};
          
          callPrototypeMethod('GunGift', 'fireBullet', giftMock);
          
          expect(giftMock.requestId).to.be(requestId);
          
          if (options.lastTimeBulletFired) {
            expect(giftMock.lastTimeBulletFired).to.be.above(options.lastTimeBulletFired);
          }
          if (options.createBulletCallCount) {
            expect(giftMock.world.createBullet.callCount).to.be(options.createBulletCallCount);
          }
          if (options.createBulletArgs) {
            var createBulletArgs = giftMock.world.createBullet.args[0][0];
            
            expect(createBulletArgs.angle).to.be(options.createBulletArgs.angle);
            expect(createBulletArgs.vel).to.be(options.createBulletArgs.vel);
            expect(createBulletArgs.x).to.be(giftMock.world.slider.x + giftMock.world.slider.width / 2);
            expect(createBulletArgs.y).to.be(giftMock.world.slider.y - giftMock.world.slider.height);
          }
          if (options.addBulletCallCount) {
            expect(giftMock.world.addBullet.callCount).to.be(options.addBulletCallCount);
          }
          if (options.cancelAnimationFrameCallCount) {
            expect(window.cancelAnimationFrame.callCount).to.be(options.cancelAnimationFrameCallCount);              
          }
          
          doneCallback();
        };
        
      test('can update and id of the request', function(done) {
        var options = {
              createBulletCallCount: 0, 
              cancelAnimationFrameCallCount: 0
            };
            
        giftMock.delay = Number.MAX_INT;
      
        testFireBullet(giftMock, 1, done, options);
      });
      test('can update the last bullet fire time', function(done) {
        var options = { 
          lastTimeBulletFired: 0
        };
      
        testFireBullet(giftMock, 1, done, options);
      });
      test('can add new bullet to the world', function(done) {
        var options = {
              lastTimeBulletFired: 0,
              createBulletCallCount: 1,
              createBulletArgs: {
                angle: -90,
                vel: 10
              },
              addBulletCallCount: 1
            };
        
        giftMock.keyDownFired = true;
        giftMock.world.slider.keysMap[32] = true;
        
        testFireBullet(giftMock, 1, done, options); 
      });
      test('can cancel animation frame when key down event is not fired', function(done) {
        var options = {
              cancelAnimationFrameCallCount: 1
            };
        
        testFireBullet(giftMock, 1, done, options);
      });
      test('can cancel animation frame when key with keyCode 32 is not pressed', function(done) {
        var options = {
              cancelAnimationFrameCallCount: 1
            };
      
        giftMock.keyDownFired = true;
            
        testFireBullet(giftMock, 1, done, options);
      });
      
      teardown(function() {
        window.requestAnimationFrame.restore();
        window.cancelAnimationFrame.restore();
      });
    });
    test('action', function() {
      var giftMock = {
            lastTimeActionCalled: 0,
            sliderKeyDownActionRef: function() {},
            sliderKeyUpActionRef: function() {},
            destroy: function() {},
            world: {
              slider: {
                addAction: sinon.spy()
              }
            }
          },
          addActionRef = giftMock.world.slider.addAction;
          
      callPrototypeMethod('GunGift', 'action', giftMock);
      
      expect(giftMock.lastTimeActionCalled).to.be.above(0);
      expect(addActionRef.callCount).to.be(2);
      expect(addActionRef.args[0][0]).to.be('keydown');
      expect(addActionRef.args[0][1]).to.be(giftMock.sliderKeyDownActionRef);
      expect(addActionRef.args[1][0]).to.be('keyup');
      expect(addActionRef.args[1][1]).to.be(giftMock.sliderKeyUpActionRef);
    });
    suite('destroy', function() {
      var giftMock;
      
      setup(function() {
          giftMock = {
            actionExpireTime: 0,
            lastTimeActionCalled: 0,
            sliderKeyDownActionRef: function() {},
            sliderKeyUp: function() {},
            destroy: function() {},
            world: {
              slider: {
                removeAction: sinon.spy()
              }
            }
          };
      });
     
      test('can cleanup resources held', function() {
        var slider = giftMock.world.slider;
        
        callPrototypeMethod('GunGift', 'destroy', giftMock);
        
        expect(slider.removeAction.callCount).to.be(2);
        expect(slider.removeAction.args[0][0]).to.be('keydown');
        expect(slider.removeAction.args[0][1]).to.be(giftMock.sliderKeyDownActionRef);
        expect(slider.removeAction.args[1][0]).to.be('keyup');
        expect(slider.removeAction.args[1][1]).to.be(giftMock.sliderKeyUpActionRef);
        expect(giftMock.keyDownFired).to.be(false);
        expect(giftMock.isActive).to.be(false);
      });
      /**
       * Not testing if parameters passed to setTimeout function are correct.
       */
      test('can postpone destroy if action is not yet expired', function() {
        giftMock.actionExpireTime = Number.MAX_INT;
        
        callPrototypeMethod('GunGift', 'destroy', giftMock);
        
        expect(window.setTimeout.callCount).to.be(1);
      });
    });
    
    teardown(function() {
      window.setTimeout.restore();
    });
  });
  suite('Slider', function() {
    var createWorldMock = function() {
      return {
        height: 100,
        width: 200
      }
    };
    suite('constructor', function() {
      setup(function(done) {
        var assets = [ 'base/SpriteSheet.json' ],
            completeCallback = function() {
              sinon.spy(Batty, 'DynamicBody');
              sinon.spy(window, 'addEventListener');  
              sinon.spy(Batty.Slider.prototype, 'addAction');    
        
              done();
            };
   
        loadAssets(assets, completeCallback);
      });
      test('default constructor', function() {        
        var texture = createDefaultTexture(),
            worldMock = createWorldMock(),
            slider;
        
        slider = new Batty.Slider(texture, worldMock);
        
        expect(slider.x).to.be.equal(worldMock.width / 2 - texture.frame.width / 2);
        expect(slider.y).to.be.equal(worldMock.height - texture.frame.height - 1);
        expect(slider.angle).to.be.equal(0);
        expect(slider.vel1).to.be.equal(15);
        expect(slider.type).to.be.equal('slider');
        expect(slider.maxX).to.be.equal(worldMock.width - texture.frame.width);
        expect(slider.actions).to.be.an('object');
        expect(slider.addAction.callCount).to.be.equal(2);
        expect(window.addEventListener.callCount).to.be.equal(2);
      });
      test('non-default constructor', function() {
        var texture = createDefaultTexture(),
            worldMock = createWorldMock(),
            options = {
              x: 10,
              y: 15,
              vel1: 20
            },
            slider;
        
        slider = new Batty.Slider(texture, worldMock, options);
        
        expect(slider.x).to.be.equal(options.x);
        expect(slider.y).to.be.equal(options.y);
        expect(slider.angle).to.be.equal(0);
        expect(slider.vel1).to.be.equal(options.vel1);
        expect(slider.type).to.be.equal('slider');
        expect(slider.maxX).to.be.equal(worldMock.width - texture.frame.width);
        expect(slider.actions).to.be.an('object');
        expect(slider.addAction.callCount).to.be.equal(2);
        expect(window.addEventListener.callCount).to.be.equal(2);
      });
      teardown(function() {
        Batty.DynamicBody.restore();
        Batty.Slider.prototype.addAction.restore();
        window.addEventListener.restore();
      });
    });
    test('getCollidableBodies', function() {
      var sliderMock = { 
            world: {
              circles: []
            }
          },
          collidableBodies;
      
      collidableBodies = callPrototypeMethod('Slider', 'getCollidableBodies', sliderMock);
    
      expect(collidableBodies).to.be.equal(sliderMock.world.circles);
    });
    suite('addAction', function() {
      test('can create an actions array of specific type if one does not exist', function() {
        var giftMock = {
              actions: {}
            },
            type = 'unknown';
            
        callPrototypeMethod('Slider', 'addAction', giftMock, [ type ]);
        
        expect(giftMock.actions[type]).to.be.an(Array);
      });
      test('cannot create an actions array of specific type if one already exist', function() {
        var type = 'action1';
            actions = [],
            giftMock = {
              actions: {
                'action1': actions
              }
            },
            newAction = function() {};
        
        callPrototypeMethod('Slider', 'addAction', giftMock, [ type, newAction ]);
        
        expect(giftMock.actions[type]).to.be.eql(actions);
      });
      test('can add action', function() {
        var sliderMock = {
              actions: {
              }
            },
            type1 = 'type1',
            type2 = 'type2',
            action1 = function() {},
            action2 = function() {};
        
        callPrototypeMethod('Slider', 'addAction', sliderMock, [ type1, action1 ]);
        callPrototypeMethod('Slider', 'addAction', sliderMock, [ type2, action2 ]);
        
        expect(sliderMock.actions).to.only.have.keys([ type1, type2 ]);
        expect(sliderMock.actions[type1]).to.have.length(1);
        expect(sliderMock.actions[type2]).to.have.length(1);
        expect(sliderMock.actions[type1]).to.contain(action1);
        expect(sliderMock.actions[type2]).to.contain(action2);
      });
    });
    suite('removeAction', function() {
      var createSliderMock = function() {
        return {
          actions: {
            'type1': [
              function() {}
            ]
          }
        };    
      };    
      test('cannot remove an action if specified type does not exist', function() {
        var sliderMock = createSliderMock(),
            type = 'nonExistingType';
        
        callPrototypeMethod('Slider', 'removeAction', sliderMock, [ type, null ]);
        
        expect(sliderMock.actions).to.only.have.key('type1');
      });
      test('can remove an action', function() {
        var sliderMock = createSliderMock();
            newType = 'type2',
            newAction = function() {};
        
        sliderMock.actions[newType] = [ newAction ];
        
        callPrototypeMethod('Slider', 'removeAction', sliderMock, [ newType, newAction ]);
        
        expect(sliderMock.actions).to.only.have.keys([ 'type1', newType ]);
        expect(sliderMock.actions[newType]).to.have.length(0);
      });
      test('cannot remove an action when type exists and action do not', function() {
        var sliderMock = createSliderMock(),
            type = 'type1',
            action = function() {};
        
        callPrototypeMethod('Slider', 'removeAction', sliderMock, [ type, action ]);
        
        expect(sliderMock.actions).to.only.have.key('type1');
        expect(sliderMock.actions[type]).to.have.length(1);
      });
    });
    suite('onKeyDown', function() {
      var testOnKeyDown = function(keyCode, doneCallback) {
        var sliderMock = { vel: 0, vel1: 10, keysMap: {} },
            event = { keyCode: keyCode };
        
        callPrototypeMethod('Slider', 'onKeyDown', sliderMock, [ event ]);
        
        doneCallback(sliderMock);
      };
      test('can set negative velocity', function(done) {
        testOnKeyDown(37, function(sliderMock) {
          expect(sliderMock.vel).to.be.equal(-sliderMock.vel1);
          done();
        });
      });
      test('can set positive velocity', function(done) {
        testOnKeyDown(39, function(sliderMock) {
          expect(sliderMock.vel).to.be.equal(sliderMock.vel1);
          done();
        });
      });
      test('cannot set velocity if key code is different than 37 or 39', function(done) {
        testOnKeyDown(40, function(sliderMock) {
          expect(sliderMock.vel).to.be.equal(0);
          done();
        });
      });
    });
    suite('onKeyUp', function() {
      var testOnKeyDown = function(keyCode, doneCallback) {
        var sliderMock = { vel: 10, keysMap: {} },
            event = { keyCode: keyCode };
        
        callPrototypeMethod('Slider', 'onKeyUp', sliderMock, [ event ]);
        
        doneCallback(sliderMock);
      };
      test('can set velocity if key code is equal 37', function(done) {
        testOnKeyDown(37, function(sliderMock) {
          expect(sliderMock.vel).to.be.equal(0);
          done();
        });
      });
      test('can set velocity if key code is equal 39', function(done) {
        testOnKeyDown(39, function(sliderMock) {
          expect(sliderMock.vel).to.be.equal(0);
          done();
        });
      });
      test('cannot set velocity when key code is neither 37 or 39', function(done) {
        testOnKeyDown(40, function(sliderMock) {
          expect(sliderMock.vel).to.be.equal(10);
          done();
        });
      });
    });
    suite('triggerActions', function() {
      var actionType = 'a1',
          action = sinon.spy(),
          sliderMock = {
            actions: {
              'a1': [ action ]
            }
          };
      test('cannot trigger an action if there are no actions of the specified type', function() {
        var type = 'unknown_type',
            eventMock = {};
        
        sinon.spy(action);
        
        callPrototypeMethod('Slider', 'triggerActions', sliderMock, [ type, eventMock ]);
        
        expect(action.notCalled).to.be.ok(0);
      });
      test('can trigger an action', function() {
        var type = actionType,
            eventMock = {};
        
        sinon.spy(action);
        
        callPrototypeMethod('Slider', 'triggerActions', sliderMock, [ type, eventMock ]);
        
        expect(action.callCount).to.be.equal(1);
        expect(action.calledWith(eventMock)).to.be.ok();
      });
      teardown(function() {
        action.reset();
      });
    });
    suite('onUpdateTransformed', function() {
      var sliderMock;

      setup(function() {
        sliderMock = {
          CROSSED_SIDE: 1,
          position: {
            x: 0
          },
          width: 5,
          world: { 
            width: 10
          },
          triggerActions: sinon.spy(),
          blocksCollide: sinon.spy()
        };
        
        return sliderMock;
      });
      test('can position the slider to the furthest position to the left edge', function() {
        sliderMock.position.x = -1;
        
        callPrototypeMethod('Slider', 'onUpdateTransformed', sliderMock);
        
        expect(sliderMock.position.x).to.be.equal(0);
        expect(sliderMock.triggerActions.callCount).to.be(1);
        expect(sliderMock.triggerActions.calledWith(sliderMock.CROSSED_SIDE)).to.be.ok();
      });
      test('can position the slider to the furthest position to the right edge', function() {
        sliderMock.position.x = sliderMock.world.width - sliderMock.width + 1;
        
        callPrototypeMethod('Slider', 'onUpdateTransformed', sliderMock);
        
        expect(sliderMock.position.x).to.be.equal(sliderMock.world.width - sliderMock.width);
        expect(sliderMock.triggerActions.callCount).to.be(1);
        expect(sliderMock.triggerActions.calledWith(sliderMock.CROSSED_SIDE)).to.be.ok();
        expect(sliderMock.blocksCollide.callCount).to.be.equal(1);
      });
      test('checks if blocks collide', function() {
        sliderMock.position.x = 1;
        
        callPrototypeMethod('Slider', 'onUpdateTransformed', sliderMock);
        
        expect(sliderMock.position.x).to.be.equal(1);
        expect(sliderMock.triggerActions.notCalled).to.be.ok();
        expect(sliderMock.blocksCollide.callCount).to.be.equal(1);
      });
      
      teardown(function() {
        sliderMock.blocksCollide.reset();
      });
    });
  });
  suite('World', function() {
    setup(function(done) {
      var assets = [ 'base/SpriteSheet.json' ];
      loadAssets(assets, done.bind(null));
    });
    
    
    function createQMock() {
      var Q = {
            defer: sinon.stub()
          },
          promiseMock1 = { 
            promise: { isFulfilled: sinon.stub().returns(false) }, 
            resolve: sinon.stub() 
          },
          promiseMock2 = { 
            promise: { isFulfilled: sinon.stub().returns(true) } 
          };
      
      promiseMock1.resolve.returns(promiseMock2);
      Q.defer.returns(promiseMock1);
      
      return Q;
    }
    function testMethod(collectionName, method, methodArgs, mockedMethods, mockedMethodsArgs) {
      var worldMock = {};
          
      worldMock[collectionName] = [];
      
      for (var i = 0; i < mockedMethods.length; i++) {
        worldMock[mockedMethods[i]] = sinon.spy();
      }
      
      callPrototypeMethod('World', method, worldMock, methodArgs);
      
      for (var i = 0; i < mockedMethods.length; i++) {
        var mockedMethod = mockedMethods[i];
        expect(worldMock[mockedMethod].callCount).to.be(1);
        expect(worldMock[mockedMethod].calledWith.apply(
          worldMock[mockedMethod], mockedMethodsArgs[i](worldMock))).to.be.ok();
      }
    };
    function testRemoveMethod(collectionName, method) {
      var worldMock = {
            removeBody: sinon.spy()
          },
          bodyMock = {},
          visible = false;
      
      worldMock[collectioName] = [];
      
      callPrototypeMethod('World', method, worldMock, [ bodyMock, visible ]);
      
      expect(worldMock.removeBody.callCount).to.be(1);
      expect(worldMock.removeBody.calledWith(bodyMock, worldMock[collectionName], visible)).to.be.ok();
    };
    suite('constructor', function() {
      var testContructor = function(world, doneCallback) {
        expect(world.blocksStartX).to.be.equal(150);
        expect(world.blocksStartY).to.be.equal(150);
        expect(world.stage.backgroundColor).to.be.equal(0xffffff);
        expect(world.gameStarted).to.be(false);
        expect(world.blockTextureWidth).to.be.equal(PIXI.TextureCache[Batty.World.prototype.BLOCKS_TEXTURE_NAMES[0]].width);
        expect(world.blockTextureHeight).to.be.equal(PIXI.TextureCache[Batty.World.prototype.BLOCKS_TEXTURE_NAMES[0]].height);
        expect(world.blocksDistHorizontal).to.be(5);
        expect(world.blocksDistVertical).to.be(5);
        expect(world.maxBlocksPerRow).to.be(16);
        expect(world.maxBlocksPerColumn).to.be(10);
        expect(world.renderer).to.be.a(PIXI.CanvasRenderer);
        expect(world.circleTexture).to.be.equal(PIXI.TextureCache[Batty.World.prototype.BALL_TEXTURE_NAME]);
        expect(world.sliderTexture).to.be.equal(PIXI.TextureCache[Batty.World.prototype.SLIDER_TEXTURE_NAME]);
        expect(world.slider).to.be.a(Batty.Slider);
        expect(world.slider.texture).to.be.equal(PIXI.TextureCache[Batty.World.prototype.SLIDER_TEXTURE_NAME]);
        expect(world.slider.world).to.be.eql(world);
        expect(world.slider.vel).to.be(0);
        expect(world.slider.vel1).to.be(30);
        expect(world.blocks).to.be.an(Array);
        expect(world.blocks).to.be.empty();
        expect(world.gifts).to.be.an(Array);
        expect(world.gifts).to.be.empty();
        expect(world.circles).to.be.an(Array);
        expect(world.circles).to.be.empty();
        expect(world.bullets).to.be.an(Array);
        expect(world.bullets).to.be.empty();
        expect(world.bodiesToRemove).to.be.an(Array);
        expect(world.bodiesToRemove).to.be.empty();
        
        expect(window.document.body.appendChild.callCount).to.be(1);
        expect(window.document.body.appendChild.calledWith(world.renderer.view)).to.be.ok();
            
        if (doneCallback) {
          doneCallback();
        }
      };
      setup(function() {
      //  sinon.spy(PIXI.DisplayObjectContainer.prototype, 'addChild');
        sinon.spy(window.document.body, 'appendChild');
        sinon.spy(Batty.World.prototype, 'getDefaultWorldWidth');
        sinon.spy(Batty.World.prototype, 'getDefaultWorldHeight');
      });
      test('can set default options', function(done) {
        var options = {},
            world = new Batty.World(options),
            doneCallback;
        
        doneCallback = function() {
          expect(world.getDefaultWorldWidth.callCount).to.be(1);
          expect(world.getDefaultWorldHeight.callCount).to.be(1);
          
          done();
        };
        
        testContructor(world, doneCallback);
      });
      test('can set non-default options', function(done) {
        var options = { height: 100, width: 200 },
            world = new Batty.World(options),
            doneCallback;
        
        doneCallback = function() {
          expect(world.width).to.be.equal(options.width);
          expect(world.height).to.be.equal(options.height);
          
          done();
        };
        
        testContructor(world, doneCallback);
      });
      teardown(function() {
        // PIXI.DisplayObjectContainer.prototype.addChild.restore();
        Batty.World.prototype.getDefaultWorldWidth.restore();
        Batty.World.prototype.getDefaultWorldHeight.restore();
        window.document.body.appendChild.restore();
      });
    });
    test('removeBlock', function() {
      var worldMock = {
            blocks: [],
            removeBody: sinon.spy()
          },
          blockMock = {};
      
      callPrototypeMethod('World', 'removeBlock', worldMock, [ blockMock ]);
      
      expect(worldMock.removeBody.callCount).to.be(1);
      expect(worldMock.removeBody.calledWith(blockMock, worldMock.blocks)).to.be.ok();
    });
    test('addCircles', function() {
      var circleMock = {},
          worldMock = {
            slider: { x: 200, y: 150 },
            circleTexture: { height: 50 },
            createCircle: sinon.stub().returns(circleMock),
            addCircle: sinon.spy()
          },
          circlesCount = 1,
          angle = 220,
          vel = 10,
          createCircleFirstCallArgs;
      
      callPrototypeMethod('World', 'addCircles', worldMock, [ circlesCount, angle, vel ]);
    
      expect(worldMock.createCircle.callCount).to.be.equal(circlesCount);
      expect(worldMock.createCircle.callCount).to.be.equal(circlesCount);
      expect(worldMock.createCircle.args[0][0].x).to.be.equal(worldMock.slider.x);
      expect(worldMock.createCircle.args[0][0].y).to.be.equal(worldMock.slider.y - worldMock.circleTexture.height);
      expect(worldMock.createCircle.args[0][0].angle).to.be.equal(angle);
      expect(worldMock.createCircle.args[0][0].vel).to.be.equal(vel);
      expect(worldMock.addCircle.calledWith(circleMock)).to.be.ok();
    });
    suite.skip('getGiftForBlockAtIndex', function() {
      var worldMock = {},
          blockMock = {
            position: { x: 0, y: 0 }
          };
      setup(function() {
        sinon.spy(Batty, 'HandGift');
        sinon.spy(Batty, 'Balls3Gift');
      });
      // The test is skipped because of the problem with spying HandGift function.
      test('can create HandGift', function() {
        var index = 0,
            gift;
            
        gift = callPrototypeMethod('World', 'getGiftForBlockAtIndex', worldMock, [ blockMock, index ]);
        
        expect(gift).to.be.a(Batty.HandGift);
        expect(Batty.HandGift.args[0][0].animationSpeed).to.be.equal(0.1);
        expect(Batty.HandGift.args[0][0].x).to.be.equal(blockMock.position.x);
        expect(Batty.HandGift.args[0][0].y).to.be.equal(blockMock.position.y);
        expect(Batty.HandGift.args[0][0].vel).to.be.equal(1);
      });
      test('can create Balls3Gift', function() {
       var index = 0,
            gift;
            
        gift = callPrototypeMethod('World', 'getGiftForBlockAtIndex', worldMock, [ blockMock, index ]);
        
        expect(gift).to.be.a(Batty.HandGift);
        expect(Batty.HandGift.args[0][0].animationSpeed).to.be.equal(0.1);
        expect(Batty.HandGift.args[0][0].x).to.be.equal(blockMock.position.x);
        expect(Batty.HandGift.args[0][0].y).to.be.equal(blockMock.position.y);
        expect(Batty.HandGift.args[0][0].vel).to.be.equal(1); 
      });
      teardown(function() {
        Batty.HandGift.restore();
        Batty.Balls3Gift.restore();
      });
    });
    test.skip('addBlocks', function() {
      var blockMock = {
            position: { x: 0, y: 0 }
          },
          worldMock = {
            blocks: [],
            BLOCKS_TEXTURES_NAME: [ 't1', 't2' ],
            stage: {
              addChild: sinon.spy()
            },
            getBlockTextureName: sinon.stub().returns('test'),
            getBlockTexture: sinon.spy(),
            createBlockFromTexture: sinon.stub().returns(blockMock), 
          };
      setup(function() {
      });
    });
    suite('getGift', function() {
      function GiftMock() {
         this.isActive = false;
      };
      GiftMock.prototype.constructor = GiftMock;
      function mainTest(type, active, doneCallback) {
        var giftMock = new GiftMock(),
            world = { gifts: [ giftMock ] },
            gifts;

        gifts = callPrototypeMethod('World', 'getGifts', world, [ type, active ]);
        
        doneCallback(gifts, giftMock);
      }
      
      test('returns all active gifts of the specified type', function(done) {
        mainTest('GiftMock', false, function(gifts, giftMock) {
          expect(gifts).to.have.length(1);
          expect(gifts[0]).to.be.eql(giftMock);
          
          done();
        });
      });
      test('cannot return gifts with wrong active property', function(done) {
        mainTest('GiftMock', true, function(gifts) {
          expect(gifts).to.be.empty();
          
          done();
        });
      });
      test('cannot return gifts with wrong constructor', function(done) {
        mainTest('WrongType', false, function(gifts) {
          expect(gifts).to.be.empty();
          
          done();
        });
      });
    });
    test('addBody', function() {
      var worldMock = {
            bodies: [],
            stage: { addChild: sinon.spy() }
          },
          bodyMock = {};
       
      callPrototypeMethod('World', 'addBody', worldMock, [ bodyMock, worldMock.bodies ]);
      
      expect(worldMock.bodies).to.have.length(1);
      expect(worldMock.bodies[0]).to.be.eql(bodyMock);
      expect(worldMock.stage.addChild.callCount).to.be(1);
      expect(worldMock.stage.addChild.calledWith(bodyMock)).to.be.ok();
    });
    test('addGift', function() {
      var giftMock = {},
          getExpectedArgs = function(worldMock) {
            return [ giftMock, worldMock.gifts ]; 
          };

      testMethod('gifts', 'addGift', [ giftMock ], [ 'addBody' ], [ getExpectedArgs ]);
    });
    test('removeGift', function() {
      var giftMock = {},
          getExpectedArgs = function(worldMock) {
            return [ giftMock, worldMock.gifts ]; 
          };

      testMethod('gifts', 'removeGift', [ giftMock ], [ 'removeBody' ], [ getExpectedArgs ]);
    });
    test('addCircle', function() {
      var circleMock = {},
          getExpectedArgs = function(worldMock) {
            return [ circleMock, worldMock.circles ]; 
          };

      testMethod('circles', 'addCircle', [ circleMock ], [ 'addBody' ], [ getExpectedArgs ]);
    });
    test('addBullet', function() {
      var bulletMock = {},
          getExpectedArgs = function(worldMock) {
            return [ bulletMock, worldMock.bullets ]; 
          };

      testMethod('bullets', 'addBullet', [ bulletMock ], [ 'addBody' ], [ getExpectedArgs ]);
    });
    test('removeCircle', function() {
      var circleMock = {},
          visible = false,
          getExpectedArgs = function(worldMock) {
            return [ circleMock, worldMock.circles, visible ];
          }
      
      testMethod('circles', 'removeCircle', [ circleMock, visible ], 
        [ 'removeBody' ], [ getExpectedArgs ]);
    });
    test('removeBullet', function() {
      var bulletMock = {},
          visible = false,
          getExpectedArgs = function(worldMock) {
            return [ bulletMock, worldMock.bullets, visible ];
          }
      
      testMethod('bullets', 'removeBullet', [ bulletMock, visible ], 
        [ 'removeBody' ], [ getExpectedArgs ]);
    });
    suite('removeBody', function() {
      var worldMock;
      
      setup(function() { 
        worldMock = { bodiesToRemove: [] };
        sinon.spy(Array.prototype, 'slice');
      });
      
      function mainTest(body, bodies, visible, doneCallback) {
        callPrototypeMethod('World', 'removeBody', worldMock, [ body, bodies, visible ]);
        
        expect(worldMock.bodiesToRemove).to.have.length(1);
        expect(worldMock.bodiesToRemove[0]).to.be.eql(body);
        
        if (doneCallback) {
          doneCallback(body, bodies, visible);
        }
      }
      
      test('can add body to an array of bodies to remove', function() {
        var body = {};
        
        mainTest(body, [ body ], false, function(body, bodies, visible) {
          expect(body.visible).to.be(visible);
          expect(bodies).to.be.empty();
        });
      });
      test('cannot remove a body if body is not provided', function() {
        var bodyMock = {};
        
        worldMock.bodiesToRemove.push(bodyMock);
        
        callPrototypeMethod('World', 'removeBody', worldMock, []);
        
        expect(worldMock.bodiesToRemove).to.have.length(1);
        expect(worldMock.bodiesToRemove[0]).to.be.eql(bodyMock);
      });
      test('cannot remove a body from bodies array if bodies array does not exist', function() {
        mainTest({}, null, false);
      });
      test('cannot remove a body from bodies array if a body does not exist', function() {
        var body1 = { id: 2 };
        
        mainTest({ id: 1 }, [ body1 ], true, function(body, bodies, visible) {
          expect(body.visible).to.be(visible);
          expect(bodies).to.have.length(1);
          expect(bodies[0]).to.be.eql(body1);
        });
      });
      test('can set visible property to false if visible argument is not provided', function() {
        mainTest({}, null, undefined, function(body, bodies, visible) {
          expect(body.visible).to.be(false);
        });
      });
      
      teardown(function() {
        Array.prototype.slice.restore();
      });
    });
    suite('removeBodies', function() {
      var worldMock;
          
      setup(function() {
        worldMock = {
          stage: {
            removeChild: sinon.spy()
          }
        };
      });
       
      function mainTest(bodies, preRemoveCallback) {
        var bodiesClone = bodies.slice(0);
        
        callPrototypeMethod('World', 'removeBodies', worldMock, [ bodies, preRemoveCallback ]);
        
        if (bodiesClone.length) {
          if (preRemoveCallback) {
            expect(preRemoveCallback.callCount).to.be(bodiesClone.length);
          }
          expect(worldMock.stage.removeChild.callCount).to.be(bodiesClone.length);
          for (var i = 0; i < bodiesClone.length; i++) {
            if (preRemoveCallback) {
              expect(preRemoveCallback.args[i][0]).to.be.eql(bodiesClone[i]);
            }
            expect(worldMock.stage.removeChild.args[i][0]).to.be.eql(bodiesClone[i]);
          }
        } else {
          if (preRemoveCallback) {
            expect(preRemoveCallback.notCalled).to.be.ok();
          }
          expect(worldMock.stage.removeChild.notCalled).to.be.ok();
        }
        
        expect(bodies).to.be.empty();
      }
      test('can remove bodies', function() {
        var bodies = [ {}, {}, {} ];
            
        mainTest(bodies);
      });
      test('can execute callback prior removing a body', function() {
        var bodies = [ {}, {}, {} ],
            preRemoveCallback = sinon.spy();
            
        mainTest(bodies, preRemoveCallback);
      });
      test('cannot remove bodies from stage if bodies array is empty', function() {
        mainTest([], sinon.spy());
      });
    });
    test('removeBlocks', function() {
      var worldMock = {
            removeBodies: sinon.spy(),
            blocks: []
          };
      
      callPrototypeMethod('World', 'removeBlocks', worldMock);
      
      expect(worldMock.removeBodies.callCount).to.be(1);
      expect(worldMock.removeBodies.args[0][0]).to.be.eql(worldMock.blocks);
      expect(worldMock.removeBodies.args[0][1]).to.a(Function);
    });
    suite('removeGifts', function() {
      var worldMock;
      
      setup(function() {
        worldMock = {
          gifts: [ createGiftMock(), createGiftMock() ],
          removeBodies: sinon.spy()
        };
      });
      function createGiftMock() {
        return {
          isActive: true,
          destroy: sinon.spy()
        };
      };
      
      test('can clenaup and remove gifts', function() {
        callPrototypeMethod('World', 'removeGifts', worldMock);
        
        expect(worldMock.gifts[0].destroy.callCount).to.be(1);
        expect(worldMock.gifts[1].destroy.callCount).to.be(1);
        expect(worldMock.removeBodies.callCount).to.be(1);
        expect(worldMock.removeBodies.calledWith(worldMock.gifts)).to.be.ok();
      });
      test('cannot cleanup gift if it is not active', function() {
        worldMock.gifts[0].isActive = false;
        
        callPrototypeMethod('World', 'removeGifts', worldMock);
        
        expect(worldMock.gifts[0].destroy.notCalled).to.be.ok();
        expect(worldMock.gifts[1].destroy.callCount).to.be(1);
        expect(worldMock.removeBodies.callCount).to.be(1);
        expect(worldMock.removeBodies.calledWith(worldMock.gifts)).to.be.ok();
      });
      test('cannot cleanup gift if it cannot be cleanup', function() {
        delete worldMock.gifts[0].destroy;
        
        expect(Batty.World.prototype.removeGifts.bind(worldMock)).to.not.throwError();
        expect(worldMock.removeBodies.callCount).to.be(1);
        expect(worldMock.removeBodies.calledWith(worldMock.gifts)).to.be.ok();
      });
    });
    test('stopAnimation', function() {
      var stop = true,
          children = [ 
            { type: 'a1', stopAnimation: false },
            { type: 'circle', stopAnimation: false },
            { type: 'slider', stopAnimation: false },
            { type: 'gift', stopAnimation: false },
            { type: 'a2', stopAnimation: false }
          ],
          worldMock = {
            stage: {
              children: children
            }
          };
          
      callPrototypeMethod('World', 'stopAnimation', worldMock, [ stop ]);
      
      expect(children[0].stopAnimation).to.be(false);
      expect(children[1].stopAnimation).to.be(true);
      expect(children[2].stopAnimation).to.be(true);
      expect(children[3].stopAnimation).to.be(true);
      expect(children[4].stopAnimation).to.be(false);
    });
    test('addMessage', function() {
      var worldMock = {
            height: 100,
            width: 100,
            messages: {},
            stage: { addChild: sinon.spy() }
          },
          messageMock = {
            anchor: { x: 0, y: 0 },
            position: { x: 0, y: 0 }
          },
          messageId = '0';
          
      callPrototypeMethod('World', 'addMessage', worldMock, [ messageId, messageMock ]);
      
      expect(messageMock.anchor.x).to.be(0.5);
      expect(messageMock.anchor.y).to.be(0.5);
      expect(messageMock.position.x).to.be(worldMock.width / 2);
      expect(messageMock.position.y).to.be(worldMock.height / 2);
      expect(worldMock.messages[messageId]).to.be(messageMock);
      expect(worldMock.stage.addChild.callCount).to.be(1);
      expect(worldMock.stage.addChild.calledWith(messageMock)).to.be.ok();
    });
    suite.skip('showMessage', function() {
      var Q, messageMock, worldMock;
          
      setup(function() {
        Q = createQMock();
        worldMock = {
          messages: {
            '0': { 
              setText: sinon.spy(), 
              show: sinon.stub().returns(Q.defer) 
            }
          },
          isMessageShown: sinon.stub(),
          addMessage: sinon.spy()
        };
      });      
      test('can show not shown message', function() {
        var id = '1',
            text = 'test';
            
        worldMock.isMessageShown.returns(false);
        
        var promise = callPrototypeMethod('World', 'showMessage', worldMock, [ id, text ]);
        
        expect(worldMock.isMessageShown.callCount).to.be(1);
        expect(worldMock.isMessageShown.calledWith(id)).to.be.ok();
        expect(worldMock.addMessage.callCount).to.be(1);
        expect(worldMock.addMessage.args[0][0]).to.be(id);
        expect(messageMock.setText.callCount).to.be(1);
        expect(messageMock.setText.calledWith(text)).to.be.ok();
        expect(messageMock.show.callCount).to.be(1);
        expect(promise.isFulfilled()).to.be(false);
      });
      test('cannot show already shown message', function() {
        var id = '0',
            promise;
            
        worldMock.isMessageShown.returns(true);
        
        promise = callPrototypeMethod('World', 'showMessage', worldMock, [ id ]);
        
        expect(worldMock.isMessageShown.callCount).to.be(1);
        expect(worldMock.isMessageShown.calledWith(id)).to.be.ok();
        expect(messageMock.show.callCount).to.be(0);
        expect(promise.isFulfilled()).to.be(true);
      });
    });
    suite('hideMessage', function() {
      var Q, worldMock, messageMock;
      
      setup(function() {
        Q = createQMock();
        messageMock = {
          show: sinon.stub().returns(Q.defer())
        };
        worldMock = {
          messages: {
            '0': messageMock
          },
          isMessageShown: sinon.stub().returns(true)
        };
      });
      test('can hide message', function() {
        var id = '0',
            promise;
        
        promise = callPrototypeMethod('World', 'hideMessage', worldMock, [ id ]);
        
        expect(worldMock.isMessageShown.callCount).to.be(1);
        expect(worldMock.isMessageShown.calledWith(id)).to.be.ok();
        expect(messageMock.show.callCount).to.be(1);
        expect(promise.isFulfilled()).to.be(false);
      });
      test('cannot hide already hidden message', function() {
        var id = '0',
            promise;
            
        worldMock.isMessageShown.returns(false);
        
        promise = callPrototypeMethod('World', 'hideMessage', worldMock, [ id ]);
        
        expect(worldMock.isMessageShown.callCount).to.be(1);
        expect(worldMock.isMessageShown.calledWith(id)).to.be.ok();
        expect(messageMock.show.callCount).to.be(0);
        expect(promise.isFulfilled()).to.be(true);
      });
    });
    suite('isMessageShown', function() {
      var worldMock, messageMock;
      
      setup(function() {
        messageMock = {
          isVisible: sinon.stub().returns(true)
        };
        worldMock = {
          messages: {
            '0': messageMock
          }
        };
      });
      test('returns true if message is already shown', function() {
        var visible = callPrototypeMethod('World', 'isMessageShown', worldMock, [ '0' ]);
        
        expect(visible).to.be(true);
      });
      test('returns false if message does not exist', function() {
        var visible = callPrototypeMethod('World', 'isMessageShown', worldMock, [ '1' ]);
        
        expect(visible).to.be(false);
      });
      test('returns false if message is not visible', function() {
        var visible;
        
        messageMock.isVisible.returns(false);
        
        var visible = callPrototypeMethod('World', 'isMessageShown', worldMock, [ '0' ]);
        
        expect(visible).to.be(false);        
      });
    });
    suite('draw', function() {
      var bodyMock, bodies, worldMock;
      
      setup(function() {
        bodyMock = {};
        bodies = [ bodyMock ];
        worldMock = {
          gameStarted: true,
          circles: [ {} ],
          blocks: [ {} ],
          bodiesToRemove: bodies,
          onGameLost: sinon.spy(),
          onGameWon: sinon.spy(),
          removeBodies: sinon.spy(),
          renderer: { render: sinon.spy() }
        };
      });
      function mainTest(doneCallback) {
        callPrototypeMethod('World', 'draw', worldMock);
        
        expect(worldMock.removeBodies.callCount).to.be(1);
        expect(worldMock.removeBodies.calledWith(worldMock.bodiesToRemove)).to.be.ok();
        expect(worldMock.renderer.render.callCount).to.be(1);
        expect(worldMock.renderer.render.calledWith(worldMock.stage)).to.be.ok();
      
        if (doneCallback) {
          doneCallback();
        }
      }
      test('can invoke game won event handler', function() {
        mainTest(function() {
          expect(worldMock.onGameWon.callCount).to.be(1);
          expect(worldMock.onGameLost.notCalled).to.be.ok();
        });
      });
      test('cannot invoke game won event handler if it does not exist', function() {
        worldMock.onGameWon = null;
        
        expect(Batty.World.prototype.draw.bind(worldMock)).to.not.throwError();
      });
      test('can invoke game lost event handler', function() {
        worldMock.circles.length = 0;
        
        mainTest(function() {
          expect(worldMock.onGameWon.notCalled).to.be.ok();
          expect(worldMock.onGameLost.callCount).to.be(1);
        });
      });
      test('cannot invoke game lost event handler if it does not exist', function() {
        worldMock.circles.length = 0;
        worldMock.onGameLost = null;
        
        expect(Batty.World.prototype.draw.bind(worldMock)).to.not.throwError();
      });
      test('cannot invoke either game won or game lost event handlers if game is not started', function() {
        worldMock.gameStarted = false;
        
        mainTest(function() {
          expect(worldMock.onGameWon.notCalled).to.be.ok();
          expect(worldMock.onGameLost.notCalled).to.be.ok();
        });
      });
    });
    suite('initLevel', function() {
      var blocksMock, levelDataMock, levelDataMockKeys, worldMock;
      
      setup(function() {
        blocksMock = [ {}, {} ];
        levelDataMock = { '0': {}, '1': {} };
        worldMock = {
          slider: {},
          levelInitialized: true,
          createBlock: sinon.stub(),
          addBlock: sinon.spy()
        };
        levelDataMockKeys = Object.keys(levelDataMock);
        
        worldMock.createBlock.withArgs(levelDataMockKeys[0], levelDataMock[0]).returns(blocksMock[0]);
        worldMock.createBlock.withArgs(levelDataMockKeys[1], levelDataMock[1]).returns(blocksMock[1]);
      });
      test('can initialize level data', function() {
        callPrototypeMethod('World', 'initLevel', worldMock, [ levelDataMock ]);
        
        expect(worldMock.levelInitialized).to.be(true);
        expect(worldMock.createBlock.callCount).to.be(levelDataMockKeys.length);
        expect(worldMock.createBlock.args[0][0]).to.be(levelDataMockKeys[0]);
        expect(worldMock.createBlock.args[0][1]).to.be(levelDataMock[0]);
        expect(worldMock.createBlock.args[1][0]).to.be(levelDataMockKeys[1]);
        expect(worldMock.createBlock.args[1][1]).to.be(levelDataMock[1]);
        expect(worldMock.addBlock.callCount).to.be(3);
        expect(worldMock.addBlock.args[0][0]).to.be(blocksMock[0]);
        expect(worldMock.addBlock.args[1][0]).to.be(blocksMock[1]);
      });
    });
    suite('createBlock', function() {
      var worldMock, x, y, blockMock, giftMock, blockTextureMock;
      
      setup(function() {
        x = 10;
        y = 20;
        blockTextureMock = {};
        blockMock = {
          position: { x: 0, y: 0 }
        };
        giftMock = {};
        worldMock = {
          getBlockXCoordinate: sinon.stub().returns(x),
          getBlockYCoordinate: sinon.stub().returns(y),
          getBlockTexture: sinon.stub().returns(blockTextureMock),
          createBlockFromTexture: sinon.stub().returns(blockMock),
          createGift: sinon.stub().returns(giftMock)
        };
      });
      function mainTest(index, dataMock, callback) {
        var block = callPrototypeMethod('World', 'createBlock', worldMock, [ index, dataMock ]);
        
        expect(worldMock.getBlockXCoordinate.callCount).to.be(1);
        expect(worldMock.getBlockXCoordinate.calledWith(index)).to.be.ok();
        expect(worldMock.getBlockYCoordinate.callCount).to.be(1);
        expect(worldMock.getBlockYCoordinate.calledWith(index)).to.be.ok();
        expect(worldMock.getBlockTexture.callCount).to.be(1);
        expect(worldMock.getBlockTexture.calledWith(dataMock.color + '.png')).to.be.ok();
        expect(worldMock.createBlockFromTexture.callCount).to.be(1);
        expect(worldMock.createBlockFromTexture.calledWith(blockTextureMock)).to.be.ok();
        expect(block.position.x).to.be(x);
        expect(block.position.y).to.be(y);
        
        if (callback) {
          callback();
        }
      };
      test('can create block', function() {
        var index = 0,
            dataMock = {
              gift: giftMock,
              color: 'red'
            };
            
        mainTest(index, dataMock, function() {
          expect(blockMock.gift).to.be.eql(giftMock);
          expect(worldMock.createGift.callCount).to.be(1);
          expect(worldMock.createGift.calledWith(dataMock.gift, x, y)).to.be.ok();          
        });
      });
      test('cannot create gift if one does not exist', function() {
        var index = 0,
            dataMock = {};
        
        mainTest(index, dataMock, function() {
          expect(blockMock.gift).to.be(undefined);
          expect(worldMock.createGift.notCalled).to.be.ok();          
        });
      });
    });
  });
});