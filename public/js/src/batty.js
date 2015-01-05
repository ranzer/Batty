define(['pixi', 'jquery', 'q'], function(PIXI, $, Q) {
  return function(window) {
    function DynamicBody(texture, world, options) {
      var radians;
      
      PIXI.Sprite.apply(this, [texture]);
      
      this.world = world;
      
      // We use texture 'width' and 'height' instance properties rather then 'width' and 'height'
      // of 'this' variable in order to allow calling DynamicBody function without creating 
      // new object instance.
      this.width = this.width || texture.width;
      this.height = this.height || texture.height;
      this.position.x = options.x || this.width + 1;
      this.position.y = options.y || this.height + 1;
      this.vel = typeof (options.vel) !== 'undefined' ? options.vel : 15;
      this.angle = typeof (options.angle) !== 'undefined' ? options.angle : 30;
      this.stopAnimation = false;
      
      radians = this.getRadians();
      
      this.vx = this.getVelX(radians);
      this.vy = this.getVelY(radians);
    }
    
    DynamicBody.prototype = Object.create(PIXI.Sprite.prototype);
    DynamicBody.prototype.constructor = DynamicBody;
    DynamicBody.prototype.getCollidableBodies = function() {
      return [];
    };
  
    DynamicBody.prototype.getRadians = function() {
      var radians = this.angle * Math.PI / 180;
      
      return radians;
    };
  
    DynamicBody.prototype.getVelX = function(radians) {
      var vx = Math.cos(radians) * this.vel;
      
      return vx;
    };
    
    DynamicBody.prototype.getVelY = function(radians) {
      var vy = Math.sin(radians) * this.vel;
      
      return vy;
    };
  
    DynamicBody.prototype.updateTransform = function() {
      if (!this.stopAnimation) {
        PIXI.Sprite.prototype.updateTransform.call(this);
        
        this.calculateVelComponents();
        this.calculateSpritePosition();
       
        if (this.onUpdateTransformed) {
          this.onUpdateTransformed();
        }
      }
    }
    
    DynamicBody.prototype.calculateVelComponents = function() {
      var radians = this.getRadians();
      
      this.vx = this.getVelX(radians);
      this.vy = this.getVelY(radians);
    };
    
    DynamicBody.prototype.calculateSpritePosition = function() {
      var spritePosition = this.position;
      
      spritePosition.x += this.vx;
      spritePosition.y += this.vy;      
    };
    
    DynamicBody.prototype.wallCollide = function() {
      var spritePosition = this.position,
          world = this.world;
      if (spritePosition.x + this.width > world.width) {
        this.updateAngleReflectionVertically();
        spritePosition.x = world.width - this.width;
      } else if (spritePosition.x < 0) {
        this.updateAngleReflectionVertically();
        spritePosition.x = 0;
      } else if (spritePosition.y < 0) {
        this.updateAngleReflectionHorizontally();
        spritePosition.y = 0;
      } else if (this.visible && spritePosition.y > world.height) {
        if (this.onOutOfScreen) {
          this.onOutOfScreen(this);
        }
        return;
      }
      
      this.calculateVelComponents();
    }
    
    DynamicBody.prototype.updateAngleReflectionHorizontally = function() {
      this.angle = 360 - this.angle;
    };
    
    DynamicBody.prototype.updateAngleReflectionVertically = function() {
      this.angle = 180 - this.angle;
    };

    DynamicBody.prototype.blocksCollide = function() {
      var blocks = this.getCollidableBodies(),
          blocksLength = blocks.length,
          block,
          i;
      
      for (i = 0; i < blocksLength; i++) {
        block = blocks[i];
        if (this.blockCollides(block)) {
          if (this.onBlockCollided) {
            this.onBlockCollided(block); 
          }
          
          break;
        }
      }
    }
    
    DynamicBody.prototype.blockCollides = function(block) {
      var isTestBlockHit = this.hitTestBlock(block);
      
      return this.visible && block.visible && isTestBlockHit;
    };
    
    DynamicBody.prototype.hitTestBlock = function(block) {
      var position = this.position,
          isMissed;
      
      isMissed = position.x + this.width < block.position.x ||
        block.position.x + block.width < position.x ||
        position.y + this.height < block.position.y ||
        block.position.y + block.height < position.y;
      
      return !isMissed;
    }
    
    DynamicBody.prototype.blockCollide = function(block) {
      var radians;
      
      var intersectionRect = this.getIntersectionRect(block);
      
      if (intersectionRect.width >= intersectionRect.height) {
        this.updateVerticalCoordinate(block);
        this.updateAngleReflectionHorizontally();
      } else {
        this.updateHorizontalCoordinate(block);
        this.updateAngleReflectionVertically();
      }
      
      radians = this.getRadians();
      
      this.vx = this.getVelX(radians);
      this.vy = this.getVelY(radians);
    }
    
    /*
     * The function updates vertical coordinate of the body.
     * This function is called after body collides with a 
     * block.
     * @param {object} block the block with whom the body collided.
     */
    DynamicBody.prototype.updateVerticalCoordinate = function(block) {
      if (this.position.y >= block.position.y + block.height / 2) {
        this.position.y = block.position.y + block.height;
      } else {
        this.position.y = block.position.y - this.height;
      }
    };
    
    /*
     * The function updates horizontal coordinate of the body.
     * This function is called after body collides with a 
     * block.
     * @param {object} block the block with whom the body collided.
     */
    DynamicBody.prototype.updateHorizontalCoordinate = function(block) {
      if (this.position.x < block.position.x) {
        this.position.x = block.position.x - this.width;
      } else {
        this.position.x = block.position.x + block.width;
      }
    };
    
    DynamicBody.prototype.getIntersectionRect = function(block) {
      var height, width;
  
      var x11 = this.position.x,
          y11 = this.position.y,
          x12 = this.position.x + this.width,
          y12 = this.position.y + this.height,
          x21 = block.position.x,
          y21 = block.position.y,
          x22 = block.position.x + block.width,
          y22 = block.position.y + block.height;
      
      width = this.getMaxIntersection(x11, x12, x21, x22);
      height = this.getMaxIntersection(y11, y12, y21, y22);

      return { width: width, height: height };
    };
    
    DynamicBody.prototype.getMaxIntersection = function(
      firstObjectMinPos, firstObjectMaxPos, 
      secondObjectMinPos, secondObjectMaxPos) {
      var minPos = Math.min(firstObjectMaxPos, secondObjectMaxPos);
      var maxPos = Math.max(firstObjectMinPos, secondObjectMinPos);
      
      return Math.max(0, minPos - maxPos);
    };
    
    DynamicBody.prototype.onUpdateTransformed = null;
    DynamicBody.prototype.onBlockCollided = null;
    DynamicBody.prototype.onOutOfScreen = null;
  
    function Circle(texture, world, options) {
      DynamicBody.apply(this, [texture, world, options]);
      
      this.type = 'circle';
    }
    
    Circle.prototype = Object.create(DynamicBody.prototype);
    Circle.prototype.constructor = Circle;
    Circle.prototype.getCollidableBodies = function() {
      return this.world.blocks;
    };
    
    Circle.prototype.onUpdateTransformed = function(parent) {
      this.wallCollide();
      this.blocksCollide();
    }
    
    Circle.prototype.onBlockCollided = function(block) {
      if (block.type === 'block' || block.type === 'slider') {
        this.blockCollide(block);
        
        // Potential memory leak issue cause block object cannot 
        // be disposed until gift object is disposed.
        if (block.type === 'block') {
          if (block.gift) {
            this.world.addGift(block.gift);
          }
          
          this.world.removeBlock(block);
        }
      }
    };
    
    Circle.prototype.onOutOfScreen = function(circle) {
      this.world.removeCircle(circle);
    };
    
    function Bullet(texture, world, options) {
      DynamicBody.apply(this, [texture, world, options]);
    }
    
    Bullet.prototype = Object.create(DynamicBody.prototype);
    Bullet.prototype.constructor = Bullet;
    
    Bullet.prototype.getCollidableBodies = function() {
      return this.world.blocks;
    };
    
    Bullet.prototype.wallCollide = function() {
      var spritePosition = this.position;
      if (spritePosition.y < 0) {
        this.world.removeBullet(this);
      }
    };
    
    Bullet.prototype.onUpdateTransformed = function(parent) {
      this.wallCollide();
      this.blocksCollide();
    }
    
    Bullet.prototype.onBlockCollided = function(block) {
      if (block.type === 'block') {
        this.world.removeBlock(block);
        this.world.removeBullet(this);
      }
    };
    
    function Gift(textures, world, options) {
      var options = options || {};
      
      options.angle = options.angle || 90;
      
      DynamicBody.apply(this, [textures[0], world, options]);
      
      this.isActive = false;
      this.isDestroying = false;
      this.textures = textures;
      this.animationSpeed = options.animationSpeed || 1;
      this.loop = typeof(options.loop) != 'undefined' ? options.loop : true;
      this.onComplete = options.onComplete || null;
      this.currentFrame = options.currentFrame || 0;
      this.playing = options.playing || false;
      this.type = 'gift';
    }
    
    Gift.prototype = (function() {
      var dynamicBodyPrototype = Object.create(DynamicBody.prototype),
          movieClipPrototype = Object.create(PIXI.MovieClip.prototype),
          giftPrototype = {},
          fnCopyProperties;
        
      fnCopyProperties = function(sourceObject, destObject) {
        var prop;
        
        for (prop in sourceObject) {
          destObject[prop] = sourceObject[prop];
        }
      };
      
      fnCopyProperties(dynamicBodyPrototype, giftPrototype);
      fnCopyProperties(movieClipPrototype, giftPrototype);
      
      // We want to override MovieClip's updateTransform method.
      giftPrototype.updateTransform = dynamicBodyPrototype.updateTransform;
      
      return giftPrototype;
    })();
    Gift.prototype.constructor = Gift;
    
    Gift.prototype.onUpdateTransformed = function() {
      if (this.visible) {
        this.blocksCollide();
        PIXI.MovieClip.prototype.updateTransform.call(this);
      }
    };
    
    Gift.prototype.getCollidableBodies = function() {
      return [ this.world.slider ];
    };
    
    Gift.prototype.onBlockCollided = function(block) {
      var that = this,
          existingGift;
      if (block.type === 'slider') {
        this.visible = false;
        if (this.actionExpireTime) {
          //console.log('gifts count: ' + this.world.gifts.length);
          existingGift = this.world.gifts.filter(function(gift) {
            //console.log('comparing gift of type ' + gift.constructor.name +
            //  ' and ' + that.constructor.name);
            //console.log('this.constructor: ' + that.constructor.name);
            return gift.isActive && gift.constructor.name == that.constructor.name;
          });
          //console.log('existingGift.length: ' + existingGift.length);
          if (existingGift.length) {
            //console.log('add expire time to gift of type ' + existingGift[0].constructor.name);
            existingGift[0].actionExpireTime += this.actionExpireTime;
            return;
          }
        }
        if (this.action) {
          this.isActive = true;
          this.action();
        }
      }
    };
    
    Gift.prototype.onOutOfScreen = function(gift) {
      this.world.removeGift(gift);
    };

    Gift.prototype.action = null;
    Gift.prototype.destroy = null;
    
    function Balls3Gift(world, options) {
      var balls3GiftTexturesLength = 6,
          balls3GiftTextures = new Array(),
          i;
      
      for (i = 0; i < balls3GiftTexturesLength; i++) {
        balls3GiftTextures.push(PIXI.TextureCache['3balls' + i + '.png']);
      }
      
      Gift.apply(this, [balls3GiftTextures, world, options]);
      
      this.ballsCount = 3;
    }
    
    Balls3Gift.prototype = Object.create(Gift.prototype);
    Balls3Gift.prototype.constructor = Balls3Gift;
    
    Balls3Gift.prototype.action = function() {
      var world = this.world;
          i = this.ballsCount,
          slider = world.slider,
          circle;
        
      while (i--) {
        circle = world.createCircle({
          x: slider.x,
          y: slider.y - world.circleTexture.height - 1,
          angle: Math.floor(Math.random() * 90),
          vel: 10
        });
        
        world.addCircle(circle);
      }

      this.isActive = false;
    };
    
    function HandGift(world, options) {
      var handGiftTexturesLength = 7,
          handGiftTextures = new Array(),
          i;
      
      for (i = 0; i < handGiftTexturesLength; i++) {
        handGiftTextures.push(PIXI.TextureCache['hand' + i + '.png']);
      }

      Gift.apply(this, [handGiftTextures, world, options]);
      
      this.lastTimeActionCalled = 0;
      this.actionExpireTime = 5000;
      this.catchedCircle = null;
      this.previousVel = -1;
      this.previousAngle = -1;
      this.previousUpdateTransform = null;
      this.previousGetCollidableBodies = null;
      this.sliderKeyDownActionRef = this.sliderKeyDownAction.bind(this);
      this.sliderKeyUpActionRef = this.sliderKeyUpAction.bind(this);
    }
    
    HandGift.prototype = Object.create(Gift.prototype);
    HandGift.prototype.constructor = HandGift;
    
    HandGift.prototype.releaseCircle = function() {
      if (this.catchedCircle !== null) {
        this.catchedCircle.angle = this.previousAngle;
        this.catchedCircle.position.y = this.world.slider.position.y - this.catchedCircle.height - 20;
        this.catchedCircle.vel = this.previousVel;
        this.catchedCircle.onUpdateTransformed = this.previousOnUpdateTransformed;
        this.catchedCircle = null;
      }
    };
    
    HandGift.prototype.sliderKeyDownAction = function(e) {
      if (e.keyCode == 37 || e.keyCode == 39) {
        if (this.catchedCircle) {
          console.log('changing cathedCircle.vel to ' + this.world.slider.vel);
          this.catchedCircle.vel = this.world.slider.vel;
        }
      } else if (e.keyCode == 32 && this.catchedCircle) {
        console.log('releasing cathedCircle (HandGift)');
        this.releaseCircle();
      }
    };
    
    HandGift.prototype.sliderKeyUpAction = function(e) {
      if (this.catchedCircle) {
        console.log('changing catchedCircle.vel to 0');
        this.catchedCircle.vel = 0;
      }
    };
    
    HandGift.prototype.action = function() {
      var that = this,
          slider = this.world.slider;

      this.lastTimeActionCalled = +new Date();
      this.catchedCircle = null;
      this.previousGetCollidableBodies = null;
      this.previousGetCollidableBodies = slider.getCollidableBodies;
      this.previousOnBlockCollided = slider.onBlockCollided;
      slider.getCollidableBodies = function() {
        var bodies = slider.world.circles.filter(function(circle) {
          return circle !== that.catchedCircle;
        });
        
        return bodies;
      };
      slider.addAction(Slider.KEY_DOWN, this.sliderKeyDownActionRef);
      slider.addAction(Slider.KEY_UP, this.sliderKeyUpActionRef);
      slider.onBlockCollided = function(block) {
        if (that.catchedCircle !== block && Slider.prototype.onBlockCollided) {
          Slider.prototype.onBlockCollided.call(slider);
        }
        if (!that.isDestroying && block !== that.catchedCircle && block.type === 'circle') {
          that.releaseCircle();
          // Beacuse block's angle is value calculated after the collision with the slider
          // we need to retrieve block's angle before the collision.
          that.previousAngle = 180 - block.angle;
          that.previousVel = block.vel;
          that.catchedCircle = block;
          that.catchedCircle.minX = block.position.x - slider.position.x;
          that.catchedCircle.maxX = that.world.width - (slider.width - that.catchedCircle.minX);
          that.previousOnUpdateTransformed = block.onUpdateTransformed;
          
          block.onUpdateTransformed = function() {
            if (this.position.x < that.catchedCircle.minX) {
              this.position.x = that.catchedCircle.minX;
            }  else if (this.position.x > that.catchedCircle.maxX) {
              this.position.x = that.catchedCircle.maxX;
            }
          };
          
          block.angle = 0;
          block.vel = 0;
          block.position.y = slider.position.y - block.height - 1;
        }
      };
          
      setTimeout(this.destroy.bind(this), this.actionExpireTime);
    };
    
    HandGift.prototype.destroy = function() {
      var slider = this.world.slider,
          currentTime = +new Date(),
          delta = currentTime - this.lastTimeActionCalled;

      if (currentTime - this.lastTimeActionCalled > this.actionExpireTime) {
        this.isDestroying = true;
        console.log('destroying ...');
        console.log('isDestroying (destroy): ' + this.isDestroying);
        // Check if previousGetCollidableBodies instance property is set
        // before reversing changes made by the gift's action method.
        // If previousGetCollidableBodies instance property is null it
        // means that the slider missed the gift.
        if (this.previousGetCollidableBodies) {
          this.releaseCircle();
          slider.getCollidableBodies = this.previousGetCollidableBodies;
          slider.onBlockCollided = this.previousOnBlockCollided;
          slider.removeAction(Slider.KEY_DOWN, this.sliderKeyDownActionRef);
          slider.removeAction(Slider.KEY_UP, this.sliderKeyUpActionRef);
        }
        this.isActive = false;
      } else {
        setTimeout(this.destroy.bind(this), this.actionExpireTime - delta);
      }
    };
    
    function GunGift(world, options) {
      var gunGiftTexturesLength = 4,
          gunGiftTextures = new Array();
      
      for (i = 0; i < gunGiftTexturesLength; i++) {
        gunGiftTextures.push(PIXI.TextureCache['gun' + i + '.png']);
      }
      
      Gift.apply(this, [gunGiftTextures, world, options]);
    
      this.actionExpireTime = 5000;
      this.lastTimeKeyDownFired = 0;
      this.lastTimeActionCalled = 0;
      this.lastTimeBulletFired = 0;
      this.keyDownFired = false;
      this.requestId = -1;
      this.fps = 5,
      this.delay = 1000 / this.fps;
      this.sliderKeyDownActionRef = this.sliderKeyDownAction.bind(this);
      this.sliderKeyUpActionRef = this.sliderKeyUpAction.bind(this);
    }
    
    GunGift.prototype = Object.create(Gift.prototype);
    GunGift.prototype.constructor = GunGift;
    
    GunGift.prototype.sliderKeyDownAction = function(e) {
      var currentTime = Date.now();
          
      if (currentTime - this.lastTimeKeyDownFired > this.delay) {
        this.lastTimeKeyDownFired = currentTime;
        if (!this.keyDownFired) {
          this.keyDownFired = true;
          this.requestId = requestAnimationFrame(this.fireBullet.bind(this));
        }
      }  
    };
    
    GunGift.prototype.sliderKeyUpAction = function(e) {
      this.keyDownFired = !!this.world.slider.keysMap[32];
    };
    
    GunGift.prototype.fireBullet = function(time) {
      var currentTime = +new Date(),
          delta = currentTime - this.lastTimeBulletFired,
          slider;
      
      requestId = requestAnimationFrame(this.fireBullet.bind(this));
      if (delta > this.delay) {
        this.lastTimeBulletFired = currentTime;
        slider = this.world.slider;
        if (this.keyDownFired && slider.keysMap[32]) {
          console.log('Firing');
          bullet = this.world.createBullet({ 
            angle: -90, 
            vel: 10, 
            x: slider.x + slider.width / 2, 
            y: slider.y - slider.height
          });
          this.world.addBullet(bullet);
        } else {
          cancelAnimationFrame(requestId);
        }
      }
    };
    
    GunGift.prototype.action = function() {
      var that = this,
          world = this.world,
          slider = world.slider;
          
      this.lastTimeActionCalled = +new Date();

      slider.addAction(Slider.KEY_DOWN, this.sliderKeyDownActionRef);
      slider.addAction(Slider.KEY_UP, this.sliderKeyUpActionRef);
            
      setTimeout(this.destroy.bind(this), this.actionExpireTime);
    };
    
    GunGift.prototype.destroy = function() {
      var slider = this.world.slider;
      
      slider.removeAction(Slider.KEY_DOWN, this.sliderKeyDownActionRef);
      slider.removeAction(Slider.KEY_UP, this.sliderKeyUpActionRef);
            
      this.keyDownFired = false;
    };
    
    function Slider(texture, world, options) {
      var options = options || {};
      
      options.x = typeof (options.x) !== 'undefined' ? options.x : world.width / 2 - texture.frame.width / 2;
      options.y = typeof (options.y) !== 'undefined' ? options.y : world.height - texture.frame.height - 1;
      options.angle = 0;
      
      DynamicBody.apply(this, [texture, world, options]);
      
      this.vel1 = typeof (options.vel1) !== 'undefined' ? options.vel1 : 15;
      this.type = 'slider';
      this.maxX = world.width - texture.frame.width;
      this.actions = Object.create(null);
      this.keysMap = {};
      
      this.addAction(Slider.KEY_DOWN, this.onKeyDown.bind(this));
      this.addAction(Slider.KEY_UP, this.onKeyUp.bind(this));
      
      // Treba korisiti publish subscriber pattern
      window.addEventListener(Slider.KEY_DOWN, this.triggerActions.bind(this, Slider.KEY_DOWN));
      window.addEventListener(Slider.KEY_UP, this.triggerActions.bind(this, Slider.KEY_UP));
    }
    
    Slider.KEY_DOWN = 'keydown';
    Slider.KEY_UP = 'keyup';
    
    Slider.prototype = Object.create(DynamicBody.prototype);
    
    Slider.prototype.getCollidableBodies = function() {
      return this.world.circles;
    };
    
    Slider.prototype.constructor = Slider;
    
    Slider.prototype.addAction = function(type, action) {
      if (typeof(this.actions[type]) === 'undefined') {
        this.actions[type] = [];
      }
      this.actions[type].push(action);
    };
    
    Slider.prototype.removeAction = function(type, action) {
      var index;
      if (typeof(this.actions[type]) !== 'undefined') {
        index = this.actions[type].indexOf(action);
        if (index != -1) {
          this.actions[type].splice(index, 1);
        }
      }
    };
    
    Slider.prototype.onKeyDown = function(e) {
      this.keysMap[e.keyCode] = true;
    
      if (e.keyCode == 37) {
        this.vel = -this.vel1;
      } else if (e.keyCode == 39) {
        this.vel = this.vel1;
      }
    };
    
    Slider.prototype.onKeyUp = function(e) {
      this.keysMap[e.keyCode] = false;
    
      if (e.keyCode == 37 || e.keyCode == 39) {
        this.vel = 0;
      }
    };
    
    Slider.prototype.triggerActions = function(type, e) {
      var i = -1,
          actions, 
          length;
      
      actions = this.actions[type];
      
      if (typeof(actions) !== 'undefined') {
        length = actions.length;
        while (++i < length) {
          actions[i](e);
        };
      }
    };
    
    Slider.prototype.onUpdateTransformed = function() {
      if (this.position.x < 0) {
        this.position.x = 0;
      }	else if (this.position.x + this.width > this.world.width) {
        this.position.x = this.world.width - this.width;
      }
      
      this.blocksCollide();
    };
    
    function World(options) {
      var options = options || {};
      
      this.blocksStartX = 150;
      this.blocksStartY = 150;
      this.stage = new PIXI.Stage(0xffffff);
      this.gameStarted = false;
      this.blockTextureWidth = PIXI.TextureCache[this.BLOCKS_TEXTURE_NAMES[0]].width;
      this.blockTextureHeight = PIXI.TextureCache[this.BLOCKS_TEXTURE_NAMES[0]].height;
      this.blocksDistHorizontal = 5;
      this.blocksDistVertical = 5;
      this.maxBlocksPerRow = options.maxBlocksPerRow || 16;
      this.maxBlocksPerColumn = options.maxBlocksPerColumn || 10;
      this.width = options.width || this.getDefaultWorldWidth();
      this.height = options.height || this.getDefaultWorldHeight();
      this.renderer = new PIXI.CanvasRenderer(this.width, this.height);
      this.circleTexture = PIXI.TextureCache[this.BALL_TEXTURE_NAME];
      this.sliderTexture = PIXI.TextureCache[this.SLIDER_TEXTURE_NAME];
      this.bulletTexture = PIXI.TextureCache[this.BULLET_TEXTURE_NAME];
      this.slider = new Slider(this.sliderTexture, this, { vel: 0, vel1: 35 });
      this.blocks = new Array();
      this.circles = new Array();
      this.gifts = new Array();
      this.bullets = new Array();
      this.bodiesToRemove = [];
      this.messages = {};
      
      if (!this.circleTexture) {
        throw new Error('The frameId ' + this.BALL_TEXTURE_NAME + ' does not exist in the texture cache ' + this);
      }
      
      //this.addCircles(1, 225, 10);
      //this.addBlocks(40);
      //this.stage.addChild(this.slider);
      //this.blocks.push(this.slider);
      
      window.document.body.appendChild(this.renderer.view);
    }
    
    World.prototype.BLOCKS_TEXTURE_NAMES = [ 'blue.png', 'purple.png', 'red.png', 'yellow.png' ],
    World.prototype.BALL_TEXTURE_NAME = 'ball.png';
    World.prototype.SLIDER_TEXTURE_NAME = 'slider.png';
    World.prototype.BULLET_TEXTURE_NAME = 'bullet.png';
    World.prototype.GAME_WON_MESSAGE = '0';
    World.prototype.GAME_LOST_MESSAGE = '1';
    World.prototype.LOADING_NEXT_LEVEL_MESSAGE = '2';
    World.prototype.LEVEL_COMPLETED_MESSAGE = '3';
    World.prototype.BALLS3_GIFT_ID = 0;
    World.prototype.BALLS5_GIFT_ID = 1;
    World.prototype.HAND_GIFT_ID = 2;
    World.prototype.GUN_GIFT_ID = 3;
    World.prototype.removeBlock = function(block) {
      this.removeBody(block, this.blocks);
    };
    
    World.prototype.addCircles = function(circlesCount, angle, vel) {
      var circle, i;
      
      for (i = 0; i < circlesCount; i++) {
        circle = this.createCircle({
          x: this.slider.x,
          y: this.slider.y - this.circleTexture.height,
          angle: angle,
          vel: vel
        });
        
        this.addCircle(circle);
      }
    };
    
    World.prototype.getBlockTexture = function(name) {
      return PIXI.TextureCache[name];
    };
    
    World.prototype.getBlockTextureName = function(index) {
      return this.BLOCKS_TEXTURE_NAMES[index];
    };
    
    World.prototype.createBlockFromTexture = function(blockTexture) {
      var block = new PIXI.Sprite(blockTexture);
      
      block.type = 'block';
      
      return block;
    };
    
    World.prototype.getGiftForBlockAtIndex = function(block, index) {
      var gift;
      
      if (index == 0) {
        gift = new HandGift(
          this,
          {
            animationSpeed: 0.1,
            x: block.position.x, 
            y: block.position.y, 
            vel: 1
          }
        );
      } else if (index % 10 == 0) {
        gift = new Balls3Gift(
          this,
          {
            animationSpeed: 0.1,
            x: block.position.x, 
            y: block.position.y, 
            vel: 1
          }
        );
      } 
      
      return gift;
    };
    
    World.prototype.createGift = function(id, x, y) {
      switch (id) {
        case 0: 
          return new Balls3Gift(
            this, { animationSpeed: 0.1, x: x, y: y, vel: 1 }
          );
        case 1: return null;
        case 2: 
          return new HandGift(
            this, { animationSpeed: 0.1, x: x, y: y, vel: 1 }
          );
        case 3: 
          return new GunGift(
            this, { animationSpeed: 0.1, x: x, y: y, vel: 1 }
          );
        default: return null;
      }
    };
    
    World.prototype.addBlocks = function(blocksCount) {
      var i, block, gift, blockTextureName;
      
      for (i = 0; i < blocksCount; i++) {
        blockTextureName = this.getBlockTextureName(i % this.BLOCKS_TEXTURE_NAMES.length);
        blockTexture = this.getBlockTexture(blockTextureName);
      
        if (!blockTexture) {
          throw new Error('The frameId ' + blockTexture + ' does not exist in the texture cache ' + this);  
        }
      
        block = this.createBlockFromTexture(blockTexture);
        
        block.position.x = this.blocksStartX + i % 8 * 55 + 1;
        block.position.y = this.blocksStartY + Math.floor(i / 8) * 30;
    
        gift = this.getGiftForBlockAtIndex(block, i);
    
        if (gift) {
          block.gift = gift;
        }
        
        this.stage.addChild(block);
        this.blocks.push(block);
      }
    };
    
    World.prototype.addGift = function(gift) {
      this.gifts.push(gift);
      this.stage.addChild(gift);
      gift.play();
    };
    
    World.prototype.removeGift = function(gift) {
      var index = this.gifts.indexOf(gift);
      
      gift.visible = false;
      this.gifts.splice(index, 1);
      //this.stage.removeChild(gift);
    };
    
    World.prototype.addCircle = function(circle) {
      this.circles.push(circle);
      this.stage.addChild(circle);
    };
    
    World.prototype.addBullet = function(bullet) {
      this.bullets.push(bullet);
      this.stage.addChild(bullet);
    };
    
    World.prototype.createCircle = function(options) {
      var circle = new Circle(
        this.circleTexture,
        this,
        options);
        
      return circle;
    };
    
    World.prototype.createBullet = function(options) {
      var bullet = new Bullet(
        this.bulletTexture,
        this,
        options);
      
      return bullet;
    };
    
    World.prototype.removeCircle = function(circle, visible) {
      this.removeBody(circle, this.circles, visible);
    };
    
    World.prototype.removeBullet = function(bullet, visible) {
      this.removeBody(bullet, this.bullets, visible);
    }
    
    World.prototype.removeBody = function(body, bodies, visible) {
      var index = bodies.indexOf(body);
      
      body.visible = typeof(visible) !== 'undefined' ? visible : false;
      bodies.splice(index, 1);
      this.bodiesToRemove.push(body);
      //this.stage.removeChild(body);
    };
    
    World.prototype.removeBodies = function(bodies, preRemoveCallback) {
      var i = bodies.length;
      
      while (i--) {
        if (preRemoveCallback) {
          preRemoveCallback(bodies[i]);
        }
        this.stage.removeChild(bodies[i]);
      }
      bodies.length = 0;
    };
    
    World.prototype.removeBlocks = function() {
      this.removeBodies(this.blocks, function(body) {
        if (body.gift) {
          this.stage.removeChild(body.gift);
        }
      });
    };
    
    World.prototype.removeCircles = function() {
      this.removeBodies(this.circles);
    };
    
    World.prototype.removeBullets = function() {
      this.removeBodies(this.bullets);
    };
    
    World.prototype.removeGifts = function() {
      this.removeBodies(this.gifts);
    };
    
    World.prototype.stopAnimation = function(stop) {
      var childBodies = this.stage.children,
          childBodiesLength = childBodies.length,
          i;
      
      for (i = 0; i < childBodiesLength; i++) {
        if (childBodies[i].type === 'circle' ||
            childBodies[i].type === 'slider' || 
            childBodies[i].type === 'gift') {
          childBodies[i].stopAnimation = stop;
        }
      }
    };
    
    World.prototype.addMessage = function(messageId, message) {
      var x = this.width / 2,
          y = this.height / 2;
      
      message.anchor.x = 0.5;
      message.anchor.y = 0.5;
      
      message.position.x = x;
      message.position.y = y;
      
      this.messages[messageId] = message;
      this.stage.addChild(message);
    };
    
    World.prototype.showMessage = function(id, text) {
      var message, deferred;
      
      message = this.messages[id];
      
      if (!message) {
        message = new Message(text);
      
        this.addMessage(id, message);        
      } else {
        message.setText(text);
      }
      
      if (!this.isMessageShown(id)) {
        deferred = message.show();
      } else {
        deferred = Q.defer().resolve();
      }
      
      return deferred.promise;
    };
    
    World.prototype.hideMessage = function(id) {
      var deferred;
      
      //console.log('id: ' + id + ', visible: ' + this.isMessageShown(id));
      
      if (this.isMessageShown(id)) {
        //console.log('hiding message ' + id);
        message = this.messages[id];
        deferred = message.show(false);
      } else {
        deferred = Q.defer();
        deferred.resolve();
      }
      
      return deferred.promise;
    };
    
    World.prototype.isMessageShown = function(id) {
      var message = this.messages[id];
      
      return typeof(message) !== 'undefined' && message.isVisible();    
    };
    
    World.prototype.showLostGameMessage = function() {
      return this.showMessage(this.GAME_LOST_MESSAGE, 'You lost!');
    };
    
    World.prototype.showWonGameMessage = function() {
      return this.showMessage(this.GAME_WON_MESSAGE, 'You won');
    };
    
    World.prototype.showLevelCompletedMessage = function(level) {
      return this.showMessage(this.LEVEL_COMPLETED_MESSAGE, 'Level ' + level + ' completed');
    };
    
    World.prototype.showLoadNextLevelMessage = function(level) {
      return this.showMessage(this.LOADING_NEXT_LEVEL_MESSAGE, 'Loading level ' + level);
    };    
    
    World.prototype.hideLostGameMessage = function() {
      return this.hideMessage(this.GAME_LOST_MESSAGE);
    };
    
    World.prototype.hideWonGameMessage = function() {
      //console.log('hideWonGameMessage');
      return this.hideMessage(this.GAME_WON_MESSAGE);
    };
   
    World.prototype.hideLevelCompletedMessage = function() {
      return this.hideMessage(this.LEVEL_COMPLETED_MESSAGE);
    };
    
    World.prototype.hideLoadNextLevelMessage = function() {
      var promise = this.hideMessage(this.LOADING_NEXT_LEVEL_MESSAGE);
      
      //console.log('promise.isFulfilled (hideLoadNextLevelMessage): ' + promise.isFulfilled());
      //console.log('promise.isPending (hideLoadNextLevelMessage): ' + promise.isPending());
      
      return promise;
    };
    
   
    World.prototype.onGameWon = null;
    World.prototype.onGameLost = null;
    
    World.prototype.draw = function() {
      if (this.gameStarted) {
        if (!this.circles.length && this.onGameLost) {
          this.onGameLost();
        } else if (this.blocks.length == 1 && this.onGameWon) {
          this.onGameWon();
        }
      }
      
      var bodiesToRemoveLength = this.bodiesToRemove.length;
      
      for (var i = 0; i < bodiesToRemoveLength; i++) {
        this.stage.removeChild(this.bodiesToRemove[i]);
      }
      
      this.bodiesToRemove.length = 0;
      // Here add code for removing object from stage.
      
      this.renderer.render(this.stage);
    };
    
    World.prototype.initLevel = function(levelData) {
      var index, blockData, block;
      
      this.levelInitialized = false;
      
      for (index in levelData) {
        block = this.createBlock(index, levelData[index]);
        this.addBlock(block);
      }
      
      this.addBlock(this.slider);
      
      this.levelInitialized = true;
    };
    
    World.prototype.createBlock = function(index, data) {
      var x = this.getBlockXCoordinate(index),
          y = this.getBlockYCoordinate(index),
          blockTexture = this.getBlockTexture(data.color + '.png'),
          block = this.createBlockFromTexture(blockTexture),
          gift;
         
      block.position.x = x;
      block.position.y = y;
      
      if (data.gift) {
        gift = this.createGift(data.gift, x, y);
        block.gift = gift;
      }
      
      return block;
    };
    
    World.prototype.getBlockXCoordinate = function(index) {
      var mod = index % this.maxBlocksPerRow,
          x = mod ? mod * (this.blockTextureWidth + this.blocksDistHorizontal) : mod;
          
      return x;
    };
    
    World.prototype.getBlockYCoordinate = function(index) {
      var mod = Math.floor(index / this.maxBlocksPerColumn),
          y = index ? Math.floor(index / this.maxBlocksPerRow) * 
            (this.blockTextureHeight + this.blocksDistVertical) : index;
          
      return y;
    };
    
    World.prototype.addBlock = function(block) {
      this.stage.addChild(block);
      this.blocks.push(block);
    };
    
    World.prototype.removeMessage = function(messageId) {
      var message;
      
      message = this.messages[messageId];
      if (message) {
        delete this.messages[messageId];
        this.stage.removeChild(message);    
      }
    };
    
    World.prototype.removeMessages = function() {
      var id, message
      
      for (id in this.messages) {
        if (Object.hasOwnProperty(id)) {
          this.removeMessage(id);
        }
      }
    };
    
    World.prototype.getDefaultWorldWidth = function() {
      var width = (this.blockTextureWidth + this.blocksDistHorizontal) * 
        (this.maxBlocksPerRow - 1) + this.blockTextureWidth;
    
      return width;
    };
    
    World.prototype.getDefaultWorldHeight = function() {
      var height = (this.blockTextureHeight + this.blocksDistVertical) * 
        (this.maxBlocksPerColumn - 1) + this.blockTextureHeight;
        
      height = height > 600 ? height : 600;
      
      return height;
    };
    
    function Message(text, config) {
      var rgbRegex = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i,
          config = config || {},
          style = config.style || {
            font: 'bold 40px Arial',
            fill: 'blue'//'rgb(0, 255, 0)'
          },
          match;
      
      PIXI.Text.apply(this, [text, style]);
      
      match = this.style.fill.match(rgbRegex);
      
      if (!match) {
        match = [ '0', '0', '0' ];
      }
      
      this.r = match[1];
      this.g = match[2];
      this.b = match[3];
      this.alpha = 0;
      this.alphaIncrement = 0.05;
      this.showMessage = false;
      this.showDeferred = null;
    }
    
    Message.prototype = Object.create(PIXI.Text.prototype);
    
    Message.prototype.constructor = Message;
    
    Message.prototype.getColor = function() {
      return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.alpha + ')';
    };
    
    Message.prototype.updateTransform = function() {
      if (this.showDeferred && this.showDeferred.promise.isPending()) {
        if (this.showMessage) {
          this.alpha += this.alphaIncrement;
          if (this.alpha > 1) {
            this.alpha = 1;
            this.showDeferred.resolve(this);
          }
        } else {
          this.alpha -= this.alphaIncrement;
          if (this.alpha < 0) {
            this.alpha = 0;
            var promise = this.showDeferred.promise;
            
            //console.log('promise.isFulfilled (updateTransform): ' + promise.isFulfilled());
            //console.log('promise.isPending (updateTransform): ' + promise.isPending());
            
            this.showDeferred.resolve(this);
          }
        }
      }
    
      PIXI.Text.prototype.updateTransform.call(this);
    };
    
    Message.prototype.show = function(show) {
      this.showMessage = typeof(show) == 'undefined' || show;
      this.showDeferred = this.showMessage && this.isHidden() || 
        !this.showMessage && this.isVisible() ? 
         Q.defer() : Q.defer().resolve();
      
      return this.showDeferred;
    };
    
    Message.prototype.isVisible = function() {
      //console.log('alpha: ' + this.alpha);
      return this.alpha == 1;
    };
    
    Message.prototype.isHidden = function() {
      return this.alpha == 0;
    };
    
    function GameService(world, options) {
      var options = options || {};
      
      this.currentLevel = 1;
      this.maxLevels = options.maxLevels || 5;
      this.levelDataUrl = options.levelDataUrl || 'http://localhost:4000/levels/';
      this.world = world;
      
      world.onGameLost = this.endGame.bind(this);
      world.onGameWon = this.endLevel.bind(this);
    }
    
    GameService.prototype.drawWorld = function() {
      this.world.draw();
    };
    
    GameService.prototype.endGame = function() {
      this.world.gameStarted = false;
      this.world.stopAnimation(true);
      this.world.showLostGameMessage();
    };
    
    GameService.prototype.endLevel = function() {
      var that = this;
      
      this.world.gameStarted = false;
      this.world.stopAnimation(true);
      
      if (this.currentLevel == this.maxLevels) {
        that.world.showWonGameMessage();
      } else {
        this.world.showLevelCompletedMessage(that.currentLevel)
          .then(function() {
            that.world.removeCircles();
            that.world.removeBlocks();
            that.world.removeGifts();
            that.world.removeBullets();
            
            return that.world.hideLevelCompletedMessage();
          })
          .then(function () {
            return that.world.showLoadNextLevelMessage(that.currentLevel + 1);
          })
          .then(function() {
            return that.loadNextLevel()
              .then(function(data) {
                return data;
              }, function(jqXHR, textStatus, errorThrown) {
                console.log('Error loading next level');
                throw new Error('Level not found');
              });
          })
          .then(function(data) {
            that.currentLevel++;
            that.world.initLevel(data);
          })
          .then(function() {
            return that.world.hideLoadNextLevelMessage();
          })
          .then(function() {
            that.startGame(true);
          })
          .fail(function(err) {
            alert('Kaboom !');
          })
          .done(function() {
            console.log('end level completed');
          });
      }
    };
    
    GameService.prototype.loadNextLevel = function() {
      var that = this;
      
      return Q($.ajax({
        dataType: 'json',
        url: this.levelDataUrl + (this.currentLevel + 1) + '.json',
        type: 'GET'
      }));
    };
    
    GameService.prototype.startGame = function(start) {
      console.log('starting game ...');
      this.world.addCircles(1, 225, 15);
      this.world.stopAnimation(!start);
      this.world.gameStarted = start;      
    };
    
    return {
      DynamicBody: DynamicBody,
      Circle: Circle,
      Gift: Gift,
      Balls3Gift: Balls3Gift,
      HandGift: HandGift,
      Slider: Slider,
      World: World,
      GameService: GameService
    };
  };
});