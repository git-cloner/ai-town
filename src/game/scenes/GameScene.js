import { Scene } from 'phaser';
import { createInteractiveGameObject } from '../utils';
import {
    NPC_MOVEMENT_RANDOM,
    SCENE_FADE_TIME,
} from '../constants';

export default class GameScene extends Scene {
    constructor() {
        super('GameScene');
    }

    cursors = {};
    isTeleporting = false;
    conversationHistory = {
        "npc_01": [
            "你好",
            "最近怎么样？", "还不错！",
            "准备去哪？"
        ]
    };
    isConversationing = 0;

    init(data) {
        this.initData = data;
    }

    calculatePreviousTeleportPosition() {
        const currentPosition = this.gridEngine.getPosition('hero');
        const facingDirection = this.gridEngine.getFacingDirection('hero');

        switch (facingDirection) {
            case 'up': {
                return {
                    x: currentPosition.x,
                    y: currentPosition.y + 1,
                };
            }

            case 'right': {
                return {
                    x: currentPosition.x - 1,
                    y: currentPosition.y,
                };
            }

            case 'down': {
                return {
                    x: currentPosition.x,
                    y: currentPosition.y - 1,
                };
            }

            case 'left': {
                return {
                    x: currentPosition.x + 1,
                    y: currentPosition.y,
                };
            }

            default: {
                return {
                    x: currentPosition.x,
                    y: currentPosition.y,
                };
            }
        }
    }

    getFramesForAnimation(assetKey, animation) {
        return this.anims.generateFrameNames(assetKey)
            .filter((frame) => {
                if (frame.frame.includes(`${assetKey}_${animation}`)) {
                    const parts = frame.frame.split(`${assetKey}_${animation}_`);
                    return Boolean(!Number.isNaN(Number.parseInt(parts[1], 10)));
                }

                return false;
            })
            .sort((a, b) => (a.frame < b.frame ? -1 : 1));
    }

    createPlayerWalkingAnimation(assetKey, animationName) {
        this.anims.create({
            key: `${assetKey}_${animationName}`,
            frames: [
                { key: assetKey, frame: `${assetKey}_${animationName}_01` },
                { key: assetKey, frame: `${assetKey}_${animationName.replace('walking', 'idle')}_01` },
                { key: assetKey, frame: `${assetKey}_${animationName}_02` },
            ],
            frameRate: 4,
            repeat: -1,
            yoyo: true,
        });
    }

    getStopFrame(direction, spriteKey) {
        switch (direction) {
            case 'up':
                return `${spriteKey}_idle_up_01`;
            case 'right':
                return `${spriteKey}_idle_right_01`;
            case 'down':
                return `${spriteKey}_idle_down_01`;
            case 'left':
                return `${spriteKey}_idle_left_01`;
            default:
                return null;
        }
    }

    getOppositeDirection(direction) {
        switch (direction) {
            case 'up':
                return 'down';
            case 'right':
                return 'left';
            case 'down':
                return 'up';
            case 'left':
                return 'right';
            default:
                return null;
        }
    }

    extractTeleportDataFromTiled(data) {
        const [mapKey, position] = data.trim().split(':');
        const [x, y] = position.split(',');

        return {
            mapKey,
            x: Number.parseInt(x, 10),
            y: Number.parseInt(y, 10),
        };
    }

    updateGameHint(hintText) {
        const customEvent = new CustomEvent('game-hint', {
            detail: {
                hintText,
            },
        });

        window.dispatchEvent(customEvent);
    }


    extractNpcDataFromTiled(data) {
        const [npcKey, config] = data.trim().split(':');
        const [movementType, delay, area, direction] = config.split(';');

        return {
            npcKey,
            movementType,
            facingDirection: direction,
            delay: Number.parseInt(delay, 10),
            area: Number.parseInt(area, 10),
        };
    }

    create() {
        const camera = this.cameras.main;
        const { game } = this.sys;
        const isDebugMode = this.physics.config.debug;
        const { heroStatus, mapKey } = this.initData;
        const {
            position: initialPosition,
            frame: initialFrame,
            health: heroHealth,
            maxHealth: heroMaxHealth,
            coin: heroCoin,
            canPush: heroCanPush,
            haveSword: heroHaveSword,
        } = heroStatus;

        camera.fadeIn(SCENE_FADE_TIME);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            this.updateGameHint(gameObject.name);
        });

        this.conversationHistory = {};

        // Mouse
        this.input.on("pointerup", (pointer) => {
            var pt = this.gridEngine.gridTilemap.tilemap.worldToTileXY(pointer.worldX, pointer.worldY);
            var newMapX = pt.x;
            var newMapY = pt.y;
            this.gridEngine.moveTo("hero", { x: newMapX, y: newMapY });
            this.heroActionCollider.update();
        });

        // Map
        const map = this.make.tilemap({ key: mapKey });
        map.addTilesetImage('tileset', 'tileset');

        if (isDebugMode) {
            window.phaserGame = game;
            this.map = map;
        }

        // Hero
        this.heroSprite = this.physics.add
            .sprite(0, 0, 'hero', initialFrame)
            .setDepth(1);
        this.heroSprite.health = heroHealth;
        this.heroSprite.maxHealth = heroMaxHealth;
        this.heroSprite.coin = heroCoin;
        this.heroSprite.canPush = heroCanPush;
        this.heroSprite.haveSword = heroHaveSword;

        this.heroSprite.body.setSize(14, 14);
        this.heroSprite.body.setOffset(9, 13);
        this.heroSprite.name = "hero";
        this.heroSprite.setInteractive();

        this.heroActionCollider = createInteractiveGameObject(
            this,
            this.heroSprite.x + 9,
            this.heroSprite.y + 36,
            14,
            8,
            'hero',
            isDebugMode
        );
        this.heroPresenceCollider = createInteractiveGameObject(
            this,
            this.heroSprite.x + 16,
            this.heroSprite.y + 20,
            320,
            320,
            'presence',
            isDebugMode,
            { x: 0.5, y: 0.5 }
        );
        this.heroObjectCollider = createInteractiveGameObject(
            this,
            this.heroSprite.x + 16,
            this.heroSprite.y + 20,
            24,
            24,
            'object',
            isDebugMode,
            { x: 0.5, y: 0.5 }
        );

        // Layer
        const elementsLayers = this.add.group();
        for (let i = 0; i < map.layers.length; i++) {
            const layer = map.createLayer(i, 'tileset', 0, 0);
            layer.layer.properties.forEach((property) => {
                const { value, name } = property;

                if (name === 'type' && value === 'elements') {
                    elementsLayers.add(layer);
                }
            });

            this.physics.add.collider(this.heroSprite, layer);
        }
        // Npcs
        const npcsKeys = [];
        const dataLayer = map.getObjectLayer('actions');
        dataLayer.objects.forEach((data) => {
            const { properties, x, y } = data;

            properties.forEach((property) => {
                const { name, value } = property;

                switch (name) {
                    case 'npcData': {
                        const {
                            facingDirection,
                            movementType,
                            npcKey,
                            delay,
                            area,
                        } = this.extractNpcDataFromTiled(value);

                        npcsKeys.push({
                            facingDirection,
                            movementType,
                            npcKey,
                            delay,
                            area,
                            x,
                            y,
                        });
                        break;
                    }

                    case 'teleportTo': {
                        const customCollider = createInteractiveGameObject(
                            this,
                            x,
                            y,
                            16,
                            16,
                            'teleport',
                            isDebugMode
                        );

                        const {
                            mapKey: teleportToMapKey,
                            x: teleportToX,
                            y: teleportToY,
                        } = this.extractTeleportDataFromTiled(value);

                        const overlapCollider = this.physics.add.overlap(this.heroSprite, customCollider, () => {
                            // camera.stopFollow();
                            this.physics.world.removeCollider(overlapCollider);
                            const facingDirection = this.gridEngine.getFacingDirection('hero');
                            camera.fadeOut(SCENE_FADE_TIME);
                            // this.scene.pause();
                            this.isTeleporting = true;
                            // this.gridEngine.stopMovement('hero');

                            this.time.delayedCall(
                                SCENE_FADE_TIME,
                                () => {
                                    this.isTeleporting = false;
                                    this.scene.restart({
                                        heroStatus: {
                                            position: { x: teleportToX, y: teleportToY },
                                            previousPosition: this.calculatePreviousTeleportPosition(),
                                            frame: `hero_idle_${facingDirection}_01`,
                                            facingDirection,
                                            health: this.heroSprite.health,
                                            maxHealth: this.heroSprite.maxHealth,
                                            coin: this.heroSprite.coin,
                                            canPush: this.heroSprite.canPush,
                                            haveSword: this.heroSprite.haveSword,
                                        },
                                        mapKey: teleportToMapKey,
                                    });
                                }
                            );
                        });

                        break;
                    }

                    default: {
                        break;
                    }
                }
            });
        });

        // Follow
        camera.startFollow(this.heroSprite, true);
        camera.setFollowOffset(-this.heroSprite.width, -this.heroSprite.height);
        camera.setBounds(
            0,
            0,
            Math.max(map.widthInPixels, game.scale.gameSize.width),
            Math.max(map.heightInPixels, game.scale.gameSize.height)
        );

        if (map.widthInPixels < game.scale.gameSize.width) {
            camera.setPosition(
                (game.scale.gameSize.width - map.widthInPixels) / 2
            );
        }

        if (map.heightInPixels < game.scale.gameSize.height) {
            camera.setPosition(
                camera.x,
                (game.scale.gameSize.height - map.heightInPixels) / 2
            );
        }

        const gridEngineConfig = {
            characters: [
                {
                    id: 'hero',
                    sprite: this.heroSprite,
                    startPosition: initialPosition,
                    offsetY: 4
                },
            ],
        };
        // Npc move
        const npcSprites = this.add.group();
        npcsKeys.forEach((npcData) => {
            const { npcKey, x, y, facingDirection = 'down' } = npcData;
            const npc = this.physics.add.sprite(0, 0, npcKey, `${npcKey}_idle_${facingDirection}_01`);
            npc.body.setSize(14, 14);
            npc.body.setOffset(9, 13);
            npc.name = npcKey;
            npcSprites.add(npc);
            npc.setInteractive();

            this.createPlayerWalkingAnimation(npcKey, 'walking_up');
            this.createPlayerWalkingAnimation(npcKey, 'walking_right');
            this.createPlayerWalkingAnimation(npcKey, 'walking_down');
            this.createPlayerWalkingAnimation(npcKey, 'walking_left');

            gridEngineConfig.characters.push({
                id: npcKey,
                sprite: npc,
                startPosition: { x: x / 16, y: (y / 16) - 1 },
                speed: 1,
                offsetY: 4,
            });
        });

        // Movement
        this.createPlayerWalkingAnimation('hero', 'walking_up');
        this.createPlayerWalkingAnimation('hero', 'walking_right');
        this.createPlayerWalkingAnimation('hero', 'walking_down');
        this.createPlayerWalkingAnimation('hero', 'walking_left');

        this.gridEngine.create(map, gridEngineConfig);

        // NPCs
        npcsKeys.forEach((npcData) => {
            const {
                movementType,
                npcKey,
                delay,
                area,
            } = npcData;

            if (movementType === NPC_MOVEMENT_RANDOM) {
                this.gridEngine.moveRandomly(npcKey, delay, area);
            }
        });

        // Animations
        this.gridEngine.movementStarted().subscribe(({ charId, direction }) => {
            if (charId === 'hero') {
                this.heroSprite.anims.play(`hero_walking_${direction}`);
            } else {
                const npc = npcSprites.getChildren().find((npcSprite) => npcSprite.texture.key === charId);
                if (npc) {
                    npc.anims.play(`${charId}_walking_${direction}`);
                    return;
                }
            }
        });
        // Subscribe
        this.gridEngine.movementStopped().subscribe(({ charId, direction }) => {
            if (charId === 'hero') {
                this.heroSprite.anims.stop();
                this.heroSprite.setFrame(this.getStopFrame(direction, charId));
            } else {
                const npc = npcSprites.getChildren().find((npcSprite) => npcSprite.texture.key === charId);
                if (npc) {
                    npc.anims.stop();
                    npc.setFrame(this.getStopFrame(direction, charId));
                    return;
                }
            }
        });

        this.gridEngine.directionChanged().subscribe(({ charId, direction }) => {
            if (charId === 'hero') {
                this.heroSprite.setFrame(this.getStopFrame(direction, charId));
            } else {
                const npc = npcSprites.getChildren().find((npcSprite) => npcSprite.texture.key === charId);
                if (npc) {
                    npc.setFrame(this.getStopFrame(direction, charId));
                    return;
                }
            }
        });

        // Hero update
        this.heroActionCollider.update = () => {
            const facingDirection = this.gridEngine.getFacingDirection('hero');
            this.heroPresenceCollider.setPosition(
                this.heroSprite.x + 16,
                this.heroSprite.y + 20
            );

            this.heroObjectCollider.setPosition(
                this.heroSprite.x + 16,
                this.heroSprite.y + 20
            );

            switch (facingDirection) {
                case 'down': {
                    this.heroActionCollider.setSize(14, 8);
                    this.heroActionCollider.body.setSize(14, 8);
                    this.heroActionCollider.setX(this.heroSprite.x + 9);
                    this.heroActionCollider.setY(this.heroSprite.y + 36);

                    break;
                }

                case 'up': {
                    this.heroActionCollider.setSize(14, 8);
                    this.heroActionCollider.body.setSize(14, 8);
                    this.heroActionCollider.setX(this.heroSprite.x + 9);
                    this.heroActionCollider.setY(this.heroSprite.y + 12);

                    break;
                }

                case 'left': {
                    this.heroActionCollider.setSize(8, 14);
                    this.heroActionCollider.body.setSize(8, 14);
                    this.heroActionCollider.setX(this.heroSprite.x);
                    this.heroActionCollider.setY(this.heroSprite.y + 21);

                    break;
                }

                case 'right': {
                    this.heroActionCollider.setSize(8, 14);
                    this.heroActionCollider.body.setSize(8, 14);
                    this.heroActionCollider.setX(this.heroSprite.x + 24);
                    this.heroActionCollider.setY(this.heroSprite.y + 21);

                    break;
                }

                default: {
                    break;
                }
            }
        };

        // Overlap
        this.physics.add.overlap(this.heroObjectCollider, npcSprites, (objA, objB) => {
            if (this.isConversationing > 0) {
                return;
            }
            this.conversation(objB, npcsKeys);
        });
    }

    callGpt(modelname, prompt) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('post', 'https://gitclone.com/aiit/codegen_stream/v2');
            xhr.setRequestHeader('Content-Type', 'application/json');
            var context = JSON.stringify({
                "context": {
                    "prompt": prompt,
                    "history": []
                },
                "modelname": modelname
            });

            xhr.onload = function () {
                if (xhr.status === 200) {
                    var json = JSON.parse(xhr.response);
                    resolve(json);
                } else {
                    reject("Request failed with status: " + xhr.status);
                }
            };

            xhr.onerror = function () {
                reject("Request failed");
            };

            xhr.send(context);
        });
    }

    genConversationByGPT(characterName, npc, npcsKeys) {
        var history = this.conversationHistory[characterName];
        var prompt = "当在小镇遇到熟人，聊天气或生活，随机写一个开始话题";
        var prevAnswer = "";
        var modelname = "ChatGLM-6b";
        if (history !== undefined) {
            prevAnswer = this.conversationHistory[characterName][this.conversationHistory[characterName].length - 1];
            prompt = '当在小镇遇到熟人，聊天气或生活，熟人说：" ' + prevAnswer + '"，随机写一个回答';
        }
        this.callGpt(modelname, prompt).then(response => {
            if (response.stop) {
                this.isConversationing = 2;
            };
            if (this.isConversationing <= 1) {
                return;
            }
            //console.log(this.conversationHistory);
            if (!this.conversationHistory[characterName]) {
                this.conversationHistory[characterName] = [];
            }
            this.conversationHistory[characterName].push(response.response);
            const customEvent = new CustomEvent('new-dialog', {
                detail: {
                    "characterName": characterName,
                    "message": response.response
                },
            });
            window.dispatchEvent(customEvent);
            const dialogBoxFinishedEventListener = () => {
                window.removeEventListener(`
                        ${characterName}-dialog-finished`, dialogBoxFinishedEventListener);
                const { delay, area } = npcsKeys.find((npcData) => npcData.npcKey === characterName);
                this.gridEngine.moveRandomly(characterName, delay, area);
                this.time.delayedCall(3000, () => {
                    this.isConversationing = 0;
                    this.updateGameHint(" ");
                });
            };
            window.addEventListener(`${characterName}-dialog-finished`, dialogBoxFinishedEventListener);
            const facingDirection = this.gridEngine.getFacingDirection('hero');
            npc.setFrame(this.getStopFrame(this.getOppositeDirection(facingDirection), characterName));
        });
    }

    conversation(npc, npcsKeys) {
        const characterName = npc.texture.key;
        this.gridEngine.stopMovement(characterName);
        if (this.gridEngine.isMoving(characterName)) {
            return;
        }
        this.isConversationing = 1;
        this.updateGameHint("与" + characterName + "聊天中...");
        const timer = setInterval(() => {
            if (this.isConversationing === 1) {
                this.genConversationByGPT(characterName, npc, npcsKeys);
            }
            if (this.isConversationing === 2) {
                clearInterval(timer);
            }
        }, 1000);
    }

    update() {
        if (
            this.isTeleporting
        ) {
            return;
        }

        this.heroActionCollider.update();
        if (this.cursors.left.isDown) {
            this.gridEngine.move('hero', 'left');
        } else if (this.cursors.right.isDown) {
            this.gridEngine.move('hero', 'right');
        } else if (this.cursors.up.isDown) {
            this.gridEngine.move('hero', 'up');
        } else if (this.cursors.down.isDown) {
            this.gridEngine.move('hero', 'down');
        }
    }
}
